/* العرّاف (The Oracle): the engine. Pure - no page, no storage - so tools/oracle-check.mjs runs
   the very same code to play every entry (notes/games/oracle.md).

   Every entry keeps a likelihood. Each answer multiplies it by how likely that answer is from
   someone thinking of that entry (ORACLE_LIKE), so one wrong answer, «مش عارف» or «غالباً» never
   rules anything out: it only moves the odds. The next question is the one whose answers are
   expected to leave the least doubt (the expected entropy of what remains); the oracle guesses
   when one entry is clearly ahead, and at the end. 20 questions, 3 guesses.

   The truth of a question for an entry, from its lists (OracleQuestions.js says how):
     Y  in its yes list (or implied by one), or the kind's auto 'y'
     M  in its maybe list
     U  about its kind, but in none of its lists: «غالباً لأ»
     N  in its no list
     X  not about its kind, or the kind's auto 'n': a firm no */

const ORACLE_MAX_Q = 20;
const ORACLE_GUESSES = 3;
const ORACLE_KINDS = ['p', 'c', 'a', 't', 'j', 'l'];   // l: a place (a country or a city), 10 Oct 2026
/** The five answers, in the order the likelihood table has them. */
const ORACLE_ANSWERS = ['y', 'py', 'dk', 'pn', 'n'];
const ORACLE_Y = 0, ORACLE_M = 1, ORACLE_U = 2, ORACLE_N = 3, ORACLE_X = 4;
/** How likely each answer is, from a player thinking of an entry whose truth is Y, M, U, N, X.
    «مش عارف» (dk) moves nothing when it is given: it is only here for picking the questions. */
const ORACLE_LIKE = [
  //  y     py    dk    pn    n
  [0.80, 0.10, 0.05, 0.03, 0.02],   // Y
  [0.25, 0.30, 0.20, 0.15, 0.10],   // M
  [0.07, 0.08, 0.15, 0.20, 0.50],   // U
  [0.02, 0.03, 0.05, 0.10, 0.80],   // N
  [0.01, 0.02, 0.05, 0.07, 0.85],   // X
];
/** The same for a firm question (`firm: true` in OracleQuestions.js): what a thing IS - its kind,
    a woman or a man, Egyptian, an actor, a footballer... Its data is complete (an entry not marked
    is a no), so an answer to it is nearly final, and an entry it contradicts is never guessed
    (10 Oct 2026: the owner answered «لأ» to «ست أو بنت؟» and was offered a woman, because two
    true traits missing from a man's data weighed more than the soft answer). */
const ORACLE_LIKE_FIRM = [
  //  y      py     dk    pn     n
  [0.90, 0.07, 0.02, 0.007, 0.003],   // Y
  [0.25, 0.30, 0.20, 0.15, 0.10],     // M
  [0.003, 0.007, 0.02, 0.07, 0.90],   // U (read as N)
  [0.003, 0.007, 0.02, 0.07, 0.90],   // N
  [0.003, 0.007, 0.02, 0.07, 0.90],   // X
];
/** The likelihood table of a question. */
const oracleLike = (q) => (q && q.firm ? ORACLE_LIKE_FIRM : ORACLE_LIKE);

/** Guess when the leader holds this much of the odds (with guesses to spare, a little less). */
const ORACLE_SURE = [0, 0.9, 0.8, 0.72];   // by guesses left
/** Entries under this share of the leader's odds are not weighed when picking a question. */
const ORACLE_PRUNE = 1e-4;

let oracleCache = null;

/** The lists of entries, in the order they are read. A new file of entries adds its list here. */
function oracleEntryLists() {
  const out = [];
  if (typeof ORACLE_PEOPLE !== 'undefined') out.push(ORACLE_PEOPLE);
  if (typeof ORACLE_CREATORS !== 'undefined') out.push(ORACLE_CREATORS);
  if (typeof ORACLE_CHARACTERS !== 'undefined') out.push(ORACLE_CHARACTERS);
  if (typeof ORACLE_ANIMALS !== 'undefined') out.push(ORACLE_ANIMALS);
  if (typeof ORACLE_THINGS !== 'undefined') out.push(ORACLE_THINGS);
  if (typeof ORACLE_JOBS !== 'undefined') out.push(ORACLE_JOBS);
  if (typeof ORACLE_APPS !== 'undefined') out.push(ORACLE_APPS);
  if (typeof ORACLE_PLACES !== 'undefined') out.push(ORACLE_PLACES);
  return out;
}

const oracleWords = (s) => String(s || '').trim().split(/\s+/).filter(Boolean);

/** 'p:y c:n' -> { p: 'y', c: 'n' }. */
function oracleAutoOf(q) {
  const out = {};
  oracleWords(q.auto).forEach((w) => { const [k, v] = w.split(':'); out[k] = v; });
  return out;
}

/** Everything a list of traits implies, the traits included (OracleQuestions.js `implies`). */
function oracleClosure(ids, byId) {
  const out = new Set();
  const add = (id) => {
    if (out.has(id)) return;
    out.add(id);
    const q = byId[id];
    if (q && q.implies) q.implies.forEach(add);
  };
  ids.forEach(add);
  return out;
}

/** The truth (Y, M, U, N, X) of every question for one entry. */
function oracleTruthRow(entry, kind, questions, byId) {
  const yes = oracleClosure(oracleWords(entry.yes), byId);
  const maybe = oracleClosure(oracleWords(entry.maybe), byId);
  const no = new Set(oracleWords(entry.no));
  const row = new Uint8Array(questions.length);
  questions.forEach((q, i) => {
    let v;
    if (q.kinds.indexOf(kind) === -1) v = ORACLE_X;
    else if (yes.has(q.id)) v = ORACLE_Y;
    else if (no.has(q.id)) v = ORACLE_N;
    else if (maybe.has(q.id)) v = ORACLE_M;
    else {
      const auto = q.autoOf[kind];
      v = auto === 'y' ? ORACLE_Y : auto === 'm' ? ORACLE_M : auto === 'n' ? ORACLE_X : q.firm ? ORACLE_N : ORACLE_U;
    }
    row[i] = v;
  });
  return row;
}

/** The questions and the entries, read once: { questions, qIndex, entries, eIndex }. */
function oracleData() {
  if (oracleCache) return oracleCache;
  const questions = (typeof ORACLE_QUESTIONS !== 'undefined' ? ORACLE_QUESTIONS : []).map((q) => Object.assign({}, q, { autoOf: oracleAutoOf(q) }));
  const byId = {};
  const qIndex = {};
  questions.forEach((q, i) => { byId[q.id] = q; qIndex[q.id] = i; });
  const entries = [];
  const eIndex = {};
  oracleEntryLists().forEach((list) => {
    (list.list || []).forEach((e) => {
      eIndex[e.id] = entries.length;
      entries.push({ id: e.id, kind: list.kind, ar: e.ar, en: e.en, icon: e.icon, truth: oracleTruthRow(e, list.kind, questions, byId) });
    });
  });
  oracleCache = { questions, qIndex, entries, eIndex };
  return oracleCache;
}

/** The odds of every entry after these answers ([[questionId, answer], ...]) and wrong guesses. */
function oracleOdds(data, answers, rejected) {
  const n = data.entries.length;
  const logp = new Float64Array(n);
  (answers || []).forEach(([qid, ans]) => {
    const qi = data.qIndex[qid];
    const ai = ORACLE_ANSWERS.indexOf(ans);
    if (qi === undefined || ai < 0 || ans === 'dk') return;
    const like = oracleLike(data.questions[qi]);
    for (let e = 0; e < n; e++) logp[e] += Math.log(like[data.entries[e].truth[qi]][ai]);
  });
  const out = new Float64Array(n);
  const no = new Set(rejected || []);
  let max = -Infinity;
  for (let e = 0; e < n; e++) if (!no.has(data.entries[e].id) && logp[e] > max) max = logp[e];
  let sum = 0;
  for (let e = 0; e < n; e++) {
    out[e] = no.has(data.entries[e].id) ? 0 : Math.exp(logp[e] - max);
    sum += out[e];
  }
  if (sum > 0) for (let e = 0; e < n; e++) out[e] /= sum;
  return out;
}

/** The entries in order of their odds: [{ e, p }], the leader first. */
function oracleRanked(odds) {
  const out = [];
  for (let e = 0; e < odds.length; e++) if (odds[e] > 0) out.push({ e, p: odds[e] });
  return out.sort((a, b) => b.p - a.p);
}

/** The expected doubt (entropy, in nats) left after asking question qi, weighing `live`. */
function oracleExpectedDoubt(data, qi, live, doubtNow) {
  const ORACLE_LIKE = oracleLike(data.questions[qi]);
  let total = 0;
  for (let a = 0; a < 5; a++) {
    if (a === 2) {
      // «مش عارف» leaves the doubt as it was, as often as it is likely to be said.
      let s = 0;
      for (let k = 0; k < live.length; k++) s += live[k].p * ORACLE_LIKE[data.entries[live[k].e].truth[qi]][a];
      total += s * doubtNow;
      continue;
    }
    let s = 0, t = 0;
    for (let k = 0; k < live.length; k++) {
      const w = live[k].p * ORACLE_LIKE[data.entries[live[k].e].truth[qi]][a];
      if (w > 0) { s += w; t += w * Math.log(w); }
    }
    if (s > 0) total += s * Math.log(s) - t;   // s * H(posterior | a), up to the shared constant
  }
  return -total;
}

/** The questions to ask next, best first: [{ q, score }] (a higher score leaves less doubt). */
function oracleBestQuestions(data, answers, odds) {
  const asked = new Set((answers || []).map((x) => x[0]));
  const ranked = oracleRanked(odds);
  const top = ranked.length ? ranked[0].p : 0;
  // Weigh only what is still possible: an entry a firm answer ruled out doesn't count (10 Oct 2026).
  let live = ranked.filter((x) => x.p >= top * ORACLE_PRUNE && !oracleContradicts(data, data.entries[x.e], answers));
  if (!live.length) live = ranked.filter((x) => x.p >= top * ORACLE_PRUNE);
  const sum = live.reduce((s, x) => s + x.p, 0);
  live = live.map((x) => ({ e: x.e, p: x.p / sum }));
  const doubtNow = -live.reduce((s, x) => s + x.p * Math.log(x.p), 0);
  const out = [];
  // A question every likely entry answers the same way tells nothing: never ask it (the owner,
  // 10 Oct 2026: «حاجة؟» after the answers had already said what it was).
  const likely = live.filter((x) => x.p >= 0.01 * live[0].p);
  data.questions.forEach((q, qi) => {
    if (asked.has(q.id)) return;
    const first = oracleSaid(data.entries[likely[0].e].truth[qi]);
    if (likely.every((x) => oracleSaid(data.entries[x.e].truth[qi]) === first)) return;
    out.push({ q: q.id, score: oracleExpectedDoubt(data, qi, live, doubtNow) });
  });
  return out.sort((a, b) => b.score - a.score);
}

/**
 * What the oracle does next, for a game { answers, rejected, guesses }:
 * { ask: questionId } | { guess: entryId, p } | { lose: true }.
 * `rand` (0..1) varies the first questions a little, so two games don't start the same.
 */
function oracleNextStep(game, rand) {
  const data = oracleData();
  const answers = game.answers || [];
  const guessesLeft = ORACLE_GUESSES - (game.rejected || []).length;
  if (guessesLeft <= 0) return { lose: true };
  const odds = oracleOdds(data, answers, game.rejected);
  // Never guess what a firm answer ruled out (a man after «ست أو بنت؟ لأ», an animal after «حيوان؟ لأ»).
  const ranked = oracleRanked(odds).filter((x) => !oracleContradicts(data, data.entries[x.e], answers));
  if (!ranked.length) return { lose: true };
  const lead = ranked[0];
  const asked = answers.length;
  const guess = { guess: data.entries[lead.e].id, p: lead.p };
  if (asked >= ORACLE_MAX_Q) return guess;
  if (lead.p >= ORACLE_SURE[guessesLeft]) return guess;
  // With the questions running out, a guess that is ahead by far is worth taking.
  const second = ranked.length > 1 ? ranked[1].p : 0;
  if (asked >= ORACLE_MAX_Q - 3 && guessesLeft > 1 && lead.p >= 0.5 && lead.p >= 3 * second) return guess;
  const best = oracleBestQuestions(data, answers, odds);
  if (!best.length) return guess;
  // The first three questions: any of the near-best, so a game doesn't always open the same.
  let pick = best[0];
  if (asked < 3 && typeof rand === 'number') {
    const near = best.filter((x) => x.score >= best[0].score - 0.08 * Math.abs(best[0].score) - 0.02).slice(0, 4);
    pick = near[Math.min(near.length - 1, Math.floor(rand * near.length))];
  }
  return { ask: pick.q };
}

/** The answer someone who knows the entry gives to a truth: yes, maybe or no. */
const oracleSaid = (t) => (t === ORACLE_Y ? 'y' : t === ORACLE_M ? 'm' : 'n');

/** Does a firm «أيوه» / «لأ» (or «غالباً») rule this entry out? */
function oracleContradicts(data, entry, answers) {
  return (answers || []).some(([qid, ans]) => {
    const qi = data.qIndex[qid];
    if (qi === undefined || !data.questions[qi].firm) return false;
    const t = entry.truth[qi];
    if (ans === 'y') return t >= ORACLE_U;
    if (ans === 'n') return t === ORACLE_Y;
    return false;
  });
}

/** A question or an entry by its id. */
function oracleQuestion(id) { const d = oracleData(); return d.questions[d.qIndex[id]] || null; }
function oracleEntry(id) { const d = oracleData(); return d.entries[d.eIndex[id]] || null; }
