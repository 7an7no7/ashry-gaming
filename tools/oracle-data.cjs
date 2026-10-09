/**
 * العرّاف (The Oracle): loads its questions, its entries and its engine (games/oracle/) the way
 * the page does - one scope, the files in the order of their chunk - and checks the data
 * strictly. `npm run check` runs the checks (validate-content.js); `npm run check:oracle`
 * runs them and then plays every entry (oracle-check.mjs). notes/games/oracle.md, "Writing entries".
 */
const fs = require('fs');
const { srcPath } = require('./sources.cjs');

/** The data files and the engine, in the order the page reads them (CHUNKS.oracle). */
const ORACLE_FILES = ['OracleQuestions.js', 'OraclePeople.js', 'OracleCharacters.js', 'OracleAnimals.js', 'OracleThings.js', 'OracleCreators.js', 'OracleApps.js', 'OraclePlaces.js', 'Oracle.js'];
const NAMES = ['ORACLE_QUESTIONS', 'ORACLE_MAX_Q', 'ORACLE_GUESSES', 'ORACLE_KINDS', 'ORACLE_ANSWERS', 'ORACLE_LIKE',
  'oracleData', 'oracleOdds', 'oracleRanked', 'oracleNextStep', 'oracleBestQuestions', 'oracleEntryLists', 'oracleWords', 'oracleClosure'];

function loadOracle() {
  const src = ORACLE_FILES.map((f) => fs.readFileSync(srcPath(f), 'utf8')).join('\n;\n');
  return new Function(src + '\nreturn { ' + NAMES.join(', ') + ' };')();
}

/** The fold the app compares typed words with (Common.js), for names written twice. */
function loadFold() {
  return new Function(fs.readFileSync(srcPath('Common.js'), 'utf8') + '\nreturn normaliseClue;')();
}

const KIND_NAMES = { p: 'a person', c: 'a character', a: 'an animal', t: 'a thing', j: 'a job', l: 'a place' };
const ID_RE = /^[a-z][a-z0-9_]*$/;

/**
 * Every problem with the data, as lines to print (empty: all good). Strict on purpose: the
 * entries are written by hand, by several writers, and a slip makes the oracle guess wrong
 * without any error.
 */
function validateOracle(O, fold) {
  const problems = [];
  const note = (m) => problems.push(m);
  const Q = O.ORACLE_QUESTIONS;
  const byId = {};
  Q.forEach((q, i) => {
    const tag = `question ${q.id || '#' + i}`;
    if (!ID_RE.test(q.id || '')) note(`${tag}: its id must be lowercase letters, digits and _`);
    if (byId[q.id]) note(`${tag}: the id is used twice`);
    byId[q.id] = q;
    if (typeof q.ar !== 'string' || !/؟$/.test(q.ar.trim())) note(`${tag}: ar must be a question ending in ؟`);
    if (typeof q.en !== 'string' || !/\?$/.test(q.en.trim())) note(`${tag}: en must be a question ending in ?`);
    if (typeof q.kinds !== 'string' || !q.kinds || /[^pcatjl]/.test(q.kinds)) note(`${tag}: kinds must be letters of pcatjl`);
    O.oracleWords(q.auto).forEach((w) => {
      const m = /^([pcatjl]):([ynm])$/.exec(w);
      if (!m) note(`${tag}: auto "${w}" must be kind:y or kind:n`);
      else if (q.kinds.indexOf(m[1]) === -1) note(`${tag}: auto names ${m[1]}, which it is not asked about`);
    });
    if (q.implies !== undefined && !Array.isArray(q.implies)) note(`${tag}: implies must be a list`);
  });
  // Implications: known ids, about a kind in common, and no loop.
  Q.forEach((q) => (q.implies || []).forEach((id) => {
    if (!byId[id]) note(`question ${q.id}: implies "${id}", which is no question`);
    else if (![...q.kinds].some((k) => byId[id].kinds.indexOf(k) !== -1)) note(`question ${q.id}: implies "${id}", which is about other kinds`);
    else if (O.oracleClosure([id], byId).has(q.id)) note(`question ${q.id}: implies "${id}", which implies it back`);
  }));

  const ids = {};
  const namesAr = {};
  const namesEn = {};
  const yesCount = {};
  const lists = O.oracleEntryLists();
  if (lists.length < 5) note(`only ${lists.length} lists of entries: OraclePeople.js, OracleCharacters.js, OracleAnimals.js, OracleThings.js (things and jobs)`);
  lists.forEach((list) => {
    const kind = list.kind;
    if (!KIND_NAMES[kind]) { note(`a list of entries has kind "${kind}", not one of pcatjl`); return; }
    (list.list || []).forEach((e, i) => {
      const tag = `${KIND_NAMES[kind]} ${e && e.id ? e.id : '#' + i}${e && e.ar ? ' (' + e.ar + ')' : ''}`;
      if (!e || typeof e !== 'object') { note(`${tag}: not an entry`); return; }
      const allowed = ['id', 'icon', 'ar', 'en', 'yes', 'maybe', 'no'];
      Object.keys(e).forEach((k) => { if (allowed.indexOf(k) === -1) note(`${tag}: unknown field "${k}" (fields: ${allowed.join(', ')})`); });
      if (!ID_RE.test(e.id || '')) note(`${tag}: its id must be lowercase letters, digits and _`);
      else if (ids[e.id]) note(`${tag}: the id "${e.id}" is also ${ids[e.id]}`);
      else ids[e.id] = tag;
      ['ar', 'en', 'icon'].forEach((k) => { if (typeof e[k] !== 'string' || !e[k].trim()) note(`${tag}: no ${k}`); });
      if (typeof e.ar === 'string' && /[A-Za-z]/.test(e.ar)) note(`${tag}: the Arabic name has Latin letters`);
      if (typeof e.en === 'string' && /[؀-ۿ]/.test(e.en)) note(`${tag}: the English name has Arabic letters`);
      if (typeof e.ar === 'string') {
        const k = fold(e.ar);
        if (namesAr[k]) note(`${tag}: the name "${e.ar}" is also ${namesAr[k]}`);
        namesAr[k] = tag;
      }
      if (typeof e.en === 'string') {
        const k = e.en.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (namesEn[k]) note(`${tag}: the name "${e.en}" is also ${namesEn[k]}`);
        namesEn[k] = tag;
      }
      const seen = {};
      ['yes', 'maybe', 'no'].forEach((field) => {
        if (e[field] !== undefined && typeof e[field] !== 'string') { note(`${tag}: ${field} must be a string of question ids`); return; }
        O.oracleWords(e[field]).forEach((id) => {
          const q = byId[id];
          if (!q) note(`${tag}: ${field} names "${id}", which is no question`);
          else if (q.kinds.indexOf(kind) === -1) note(`${tag}: ${field} names "${id}", which is not asked about ${KIND_NAMES[kind]}s (its kinds: ${q.kinds})`);
          if (seen[id]) note(`${tag}: "${id}" is in ${seen[id]} and ${field}`);
          seen[id] = field;
        });
      });
      // A no that a yes implies: the entry says both.
      const implied = O.oracleClosure(O.oracleWords(e.yes), byId);
      O.oracleWords(e.no).forEach((id) => { if (implied.has(id)) note(`${tag}: no "${id}", but its yes list implies it`); });
      // A yes that the kind already has (auto), said again: harmless, but a sign of a misread.
      O.oracleWords(e.yes).forEach((id) => {
        const q = byId[id];
        if (q && O.oracleWords(q.auto).indexOf(kind + ':y') !== -1) note(`${tag}: "${id}" is already yes for every ${KIND_NAMES[kind]} (auto): leave it out`);
      });
      if (kind === 'c' && !('human' in seen)) note(`${tag}: a character says whether it is human (human in yes, maybe or no)`);
      implied.forEach((id) => { yesCount[id] = (yesCount[id] || 0) + 1; });
      if (implied.size < 2) note(`${tag}: fewer than 2 yes traits`);
    });
  });
  // A question nobody says yes to can only waste a turn (the kind questions have their autos).
  Q.forEach((q) => { if (!yesCount[q.id] && !/:y/.test(q.auto || '')) note(`question ${q.id}: no entry has it in its yes list`); });

  // Every two entries differ by one trait at least: one has it (yes), the other doesn't (no, or unlisted).
  if (!problems.length) {
    const data = O.oracleData();
    const E = data.entries;
    for (let a = 0; a < E.length; a++) {
      for (let b = a + 1; b < E.length; b++) {
        const ta = E[a].truth, tb = E[b].truth;
        let apart = false;
        for (let q = 0; q < ta.length && !apart; q++) apart = (ta[q] === 0 && tb[q] >= 2) || (tb[q] === 0 && ta[q] >= 2);
        if (!apart) note(`${E[a].id} (${E[a].ar}) and ${E[b].id} (${E[b].ar}) have the same answers: give one of them a trait the other hasn't`);
      }
    }
  }
  return problems;
}

module.exports = { ORACLE_FILES, loadOracle, loadFold, validateOracle, KIND_NAMES };
