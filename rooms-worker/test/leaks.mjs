/**
 * The leak check: every room game played through, and after every move - a
 * phone's, a computer player's, the server's clock - every phone's view built
 * with the server's own projection (src/view.js) and searched for what that
 * phone must not know. The answer key is the server's own hidden state
 * (room._*, the other phones' slices), read here directly.
 *
 *   npm run test:rules      (runs this after rules.mjs; builds generated/rules.js first)
 *   node test/leaks.mjs     (this alone, once generated/rules.js is built)
 *   node test/leaks.mjs uno domino   (just those games)
 *
 * The rules are applied the way room.js applies them: on a copy of the room,
 * kept only when the move didn't throw. A refused move is not a failure here;
 * a driver that can't finish its game is.
 *
 * Adding a room game: give it a driver in DRIVERS (a whole game, start to end)
 * and its secrets in PROBES. A probe that never came up during its game fails
 * the run too, so a probe can't pass by never looking.
 */
import { readFileSync } from 'node:fs';
import { applyRoomAction, roomDeadline, roomTimeout, normaliseClue, guessVerdict, ROOM_GAME_IDS, roomPlayerLeft, missionJoined, missionPlayerLeft } from '../generated/rules.js';
import { roomView } from '../src/view.js';
import srcMod from '../../tools/sources.cjs';
const { srcPath } = srcMod;

// The countries, for the engine's خمّن الدولة driver to guess with (one sets, everyone solves).
const SOLVE_LISTS = new Function(readFileSync(srcPath('Countries.js'), 'utf8') + '\nreturn { COUNTRIES };')();

// الأوضة المضلمة's maps, for its driver to find a way through a level.
const DARK = new Function(readFileSync(srcPath('Dark.js'), 'utf8') + ';return { darkMap, darkBlocked, darkDynCell, DARK_DIRS, DARK_TICK };')();

// دندنها's songs: the answer key for the probes, and the right title for the driver to type.
const HUM = new Function(readFileSync(srcPath('Songs.js'), 'utf8') + ';return { HUM_SONGS };')();

// خمّن مين's faces, to know the real face of الشاهد by what can be seen of it.
const WIT = new Function(readFileSync(srcPath('GuessWho.js'), 'utf8') + ';return { gwSignature };')();

// ارسم اللي بتسمعه's pictures, for its driver to trace one.
const HEAR = new Function(readFileSync(srcPath('Hear.js'), 'utf8') + ';return { hearOutlines };')();
// الخزنة's notebook, to know a page's words when they are found on a phone.
const VAULT = new Function(readFileSync(srcPath('Vault.js'), 'utf8') + ';return { vaultPageData, vaultLightAnswer };')();

const realNow = Date.now;
let clock = realNow();
Date.now = () => clock;

const SCREEN = 'the-screen';   // not 'tv': that is Tuvalu, a country خمّن الدولة can deal
const ONLINE = { has: () => true };        // every phone connected
// Each name carries its seat's number, so no name is ever a word a game deals: a word wheel's answers
// come from every bank (the Stop names included), and هنا in players.4.name once read as its solution.
const NAMES = ['نور 1', 'Adam 2', 'سلمى 3', 'Omar 4', 'هنا 5', 'Karim 6', 'ليلى 7', 'Sam 8'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* --- finding a value in a view --------------------------------------------------- */

const fold = (x) => (typeof x === 'string' ? normaliseClue(x) : x);

/** Every key and primitive in a view, once, so each probe is a lookup. */
const indexView = (view) => {
  const str = new Map(), num = new Map(), keys = [];
  const add = (map, k, path) => { const l = map.get(k); if (l) l.push(path); else map.set(k, [path]); };
  const walk = (node, path) => {
    if (node === null || node === undefined) return;
    if (typeof node === 'object') {
      for (const k of Object.keys(node)) { keys.push(path ? path + '.' + k : k); walk(node[k], path ? path + '.' + k : k); }
      return;
    }
    if (typeof node === 'number') add(num, node, path);
    else if (typeof node === 'string') add(str, fold(node), path);
  };
  walk(view, '');
  return {
    keys,
    /** The first path holding `value`, or null. `except`: paths where it may be (a public list). */
    find(value, opts = {}) {
      if (value === null || value === undefined) return null;
      const skip = (p) => (opts.except || []).some((e) => p === e || p.indexOf(e + '.') === 0);
      if (typeof value === 'number') return (num.get(value) || []).find((p) => !skip(p)) || null;
      const want = fold(String(value));
      if (!want) return null;
      const hit = (str.get(want) || []).find((p) => !skip(p));
      if (hit || !opts.sub || want.length < 4) return hit || null;
      for (const [got, paths] of str) if (got.indexOf(want) !== -1) { const p = paths.find((x) => !skip(x)); if (p) return p; }
      return null;
    }
  };
};

/* --- the rules a view is held to -------------------------------------------------- */

// A probe is { name, active, check(view, pid, idx) -> a problem, or null }.
const probe = (name, active, check) => ({ name, active: !!active, check });
/** `value` may be seen by the phones in `allowed` only (a screen never). */
const secret = (name, value, allowed, opts) => probe(name, value !== null && value !== undefined && value !== '',
  (view, pid, idx) => (allowed.indexOf(pid) !== -1 ? null : idx.find(value, opts)));
const others = (room, ...mine) => room.players.map((p) => p.id).filter((id) => mine.indexOf(id) === -1);
const hasKey = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== null && obj[key] !== undefined;

// For every game, every move.
const GENERIC = (room) => {
  const v = room.shared && room.shared.vote;
  return [
    probe('no server-only field reaches a phone', true, (view, pid, idx) => idx.keys.find((k) => /(^|\.)_/.test(k)) || null),
    probe('a screen is sent no secret', true, (view, pid) => (pid === SCREEN && view.you !== null ? 'you' : null)),
    // The ideas of 7 Oct 2026 (view.js): the night's leavers are names only, of people banked on the night
    // and gone from the room (never a computer player); «لعبناها» is room game ids; the TV's QR a time.
    probe('the night names only who has left it, and only their names', true, (view) => {
      const nn = view.nightNames || {};
      const bots = (room.nightx && room.nightx.bots) || [];
      for (const id of Object.keys(nn)) {
        if (typeof nn[id] !== 'string') return 'nightNames.' + id + ' (not a name)';
        if (!(room.night || {})[id]) return 'nightNames.' + id + ' (not on the night)';
        if (room.players.some((p) => p.id === id)) return 'nightNames.' + id + ' (still in the room)';
        if (bots.indexOf(id) !== -1) return 'nightNames.' + id + ' (a computer player)';
      }
      if (!Array.isArray(view.played) || view.played.some((g) => ROOM_GAME_IDS.indexOf(g) === -1)) return 'played (not room game ids)';
      if (typeof view.tvQrAt !== 'number') return 'tvQrAt';
      return null;
    }),
    probe('a vote shows who voted, not what, until it closes', v && v.phase === 'voting', (view, pid) => {
      const sv = view.shared.vote || {};
      if (hasKey(sv, 'results') || hasKey(sv, 'totalVotes')) return 'shared.vote.results';
      if (room._voteOwners && (sv.options || []).some((o) => 'ownerId' in o)) return 'shared.vote.options.ownerId';
      const own = view.you && view.you.voteOwn;
      if (own && room._voteOwners && room._voteOwners[own] !== pid) return 'you.voteOwn (someone else\'s)';
      return null;
    })
  ];
};

/* --- سباق ألغاز: what each game's solution is, and what a board holds (PROBES.race) -------
   RACE_PROBES[id](room, secret, hidden) -> {
     secrets: [{ value, knows: [pids], except: [paths] }]   values nobody (but `knows`) may see
     probes:  [probe(...)]                                    anything else the game must keep
     own(youBoard, serverBoard, pid, view) -> a problem, or null   the board on a phone is exactly its own
   } */
const RACE_PROBES = {
  // RACE_PROBES:wordwheel
  wordwheel: (room, x, h) => ({
    secrets: x.words.map((w, wi) => ({ value: w, knows: Object.keys(h.boards).filter((id) => h.boards[id].found.indexOf(wi) !== -1) }))
      .concat(x.bonus.map((w) => ({ value: w, knows: Object.keys(h.boards).filter((id) => h.boards[id].bonus.indexOf(w) !== -1) }))),
    own: (yb, b) => (JSON.stringify((yb.found || []).map((f) => f.wi)) === JSON.stringify(b.found) && JSON.stringify(yb.bonus || []) === JSON.stringify(b.bonus) ? null : 'you.board')
  }),
  // RACE_PROBES:connections
  connections: (room, x, h) => ({
    secrets: x.groups.map((g, gi) => ({ value: g.name, knows: Object.keys(h.boards).filter((id) => h.boards[id].solved.indexOf(gi) !== -1) })),
    own: (yb, b) => (JSON.stringify((yb.solved || []).map((g) => g.gi)) === JSON.stringify(b.solved) && yb.mistakes === b.mistakes ? null : 'you.board')
  }),
  // RACE_PROBES:pinpoint
  pinpoint: (room, x, h) => ({
    // A round's answer is known once a phone has answered it; a clue once it has been shown to that phone.
    secrets: x.rounds.flatMap((r, k) => [{ value: r.name, knows: Object.keys(h.boards).filter((id) => h.boards[id].rounds[k].points !== null), except: ['shared.pub'] }]
    ),
    // A clue not yet shown is on no phone - except where that same word is a clue this phone has already been shown (decoys share words across rounds).
    probes: x.rounds.flatMap((r, k) => r.clues.map((c, ci) => probe('pinpoint: a clue not yet shown is on no phone', true, (view, pid, idx) => {
      const b = h.boards[pid];
      if (b && (b.rounds[k].shown > ci || b.rounds[k].points !== null)) return null;
      const shown = ['shared.pub'];
      (b ? b.rounds : []).forEach((br, j) => { const n = br.points !== null ? x.rounds[j].clues.length : br.shown; for (let i = 0; i < n; i++) shown.push('you.board.rounds.' + j + '.clues.' + i); });
      return idx.find(c, { except: shown });
    }))),
    own: (yb, b) => (yb.cur === b.cur && JSON.stringify((yb.rounds || []).map((r) => [r.shown, r.wrong, r.points])) === JSON.stringify(b.rounds.map((r) => [r.shown, r.wrong, r.points])) ? null : 'you.board')
  }),
  // RACE_PROBES:tango
  tango: (room, x, h) => ({
    secrets: [],
    probes: [probe("tango: the solution is on no phone that hasn't solved it", true, (view, pid) => {
      if (h.boards[pid] && h.boards[pid].state === 'won') return null;
      const sol = x.solution;
      const seen = (node) => (Array.isArray(node) && node.length === sol.length && node.every((v, i) => v === sol[i]))
        || (!!node && typeof node === 'object' && Object.keys(node).some((k) => seen(node[k])));
      return seen(view) ? 'the solution' : null;
    })],
    own: (yb, b) => (JSON.stringify(yb.cells || null) === JSON.stringify(b.cells || null) ? null : 'you.board.cells')
  }),
  // RACE_PROBES:nonogram
  nonogram: (room, x, h) => ({
    secrets: x.pic ? [{ value: x.pic.ar, knows: [] }, { value: x.pic.en, knows: [] }, { value: x.pic.e, knows: [] }] : [],
    probes: [probe("nonogram: the picture is on no phone that hasn't painted it", true, (view, pid) => {
      if (h.boards[pid] && h.boards[pid].state === 'won') return null;
      const sol = x.solution;
      const seen = (node) => (Array.isArray(node) && node.length === sol.length && node.every((v, i) => v === sol[i]))
        || (!!node && typeof node === 'object' && Object.keys(node).some((k) => seen(node[k])));
      return seen(view) ? 'the solution' : null;
    })],
    own: (yb, b) => (JSON.stringify(yb.cells || null) === JSON.stringify(b.cells || null) ? null : 'you.board.cells')
  }),
  // RACE_PROBES:mines
  mines: (room, x, h) => ({
    secrets: [],
    probes: [probe('mines: a mine reaches no phone whose board is still in play', true, (view, pid) => {
      const b = h.boards[pid];
      if (b && b.boom >= 0) {
        // Out of the round: the mine it hit while the others race, the field only once the round is over.
        const mb = view.you && view.you.board && view.you.board.mines;
        return room.shared.phase === 'solving' && mb && mb.length > 1 ? 'the field while the others race' : null;
      }
      const s = JSON.stringify(view);
      if (s.indexOf('"mines":[') !== -1) return 'mines';
      const open = view.you && view.you.board && view.you.board.open;
      if (open && open.some((o) => o.n === 9)) return 'you.board.open (a mine)';
      return null;
    })],
    own: (yb, b) => (JSON.stringify((yb.open || []).map((o) => o.i)) === JSON.stringify(b.open.map((o) => o.i)) ? null : 'you.board.open')
  }),
  // RACE_PROBES:streak
  streak: (room, x, h) => ({
    // The answer of the question up is a secret until answered; the questions to come are secrets entirely.
    secrets: x.qs.flatMap((q, k) => [{ value: q.options[q.answer], knows: Object.keys(h.boards).filter((id) => h.boards[id].asked > k), except: ['you.board.q.options', 'you.board.last'] }]
      .concat(k > 0 && q.prompt ? [{ value: q.prompt, knows: Object.keys(h.boards).filter((id) => h.boards[id].asked >= k) }] : [])),
    // An emoji clue is looked for as written: folded, 3️⃣👨👨👨 is just "3", which a trivia option may be.
    probes: x.qs.map((q, k) => probe('streak: an emoji riddle to come is on no phone', k > 0 && !q.prompt && !!q.big, (view, pid) =>
      (h.boards[pid] && h.boards[pid].asked >= k) || JSON.stringify(view).indexOf(JSON.stringify(q.big)) === -1 ? null : 'an emoji riddle to come')),
    own: (yb, b) => (yb.asked === b.asked && yb.right === b.right ? null : 'you.board')
  }),
  // RACE_PROBES:sudoku
  sudoku: (room, x, h) => ({
    secrets: [{ value: x.solution, knows: Object.keys(h.boards).filter((id) => h.boards[id].state === 'won') }],
    own: (yb, b) => ((yb.cells || null) === (b.cells || null) ? null : 'you.board.cells')
  }),
  queens: (room, x, h) => ({
    secrets: [],
    probes: [probe('queens: the solution\'s crowns are on no phone', true, (view) => {
      const sol = x.solution;
      const seen = (node) => (Array.isArray(node) && node.length === sol.length && node.every((v, i) => v === sol[i]))
        || (!!node && typeof node === 'object' && Object.keys(node).some((k) => seen(node[k])));
      return seen(view) ? 'the solution' : null;
    })],
    own: (yb, b) => (JSON.stringify(yb.marks || null) === JSON.stringify(b.marks || null) ? null : 'you.board.marks')
  }),
  // RACE_PROBES:strands
  strands: (room, x, h) => ({
    // A word is known to a phone once it has found it.
    secrets: x.words.map((w, wi) => ({ value: w.w, knows: Object.keys(h.boards).filter((id) => h.boards[id].found.some((f) => f.wi === wi)), except: ['shared.pub.theme'] })),
    own: (yb, b) => (JSON.stringify((yb.found || []).map((f) => [f.wi, f.cells])) === JSON.stringify(b.found.map((f) => [f.wi, f.cells])) ? null : 'you.board.found')
  }),
  // RACE_PROBES:wordwheel
  // RACE_PROBES:connections
  // RACE_PROBES:pinpoint
  // RACE_PROBES:tango
  // RACE_PROBES:nonogram
  // RACE_PROBES:mines
  // RACE_PROBES:streak
  // RACE_PROBES:sudoku
};

const PROBES = {
  imposter(room) {
    const s = room.shared || {};
    const live = ['reveal', 'discuss', 'voting', 'guess'].indexOf(room.phase) !== -1;
    const spies = room._impSpies || [];
    const holders = others(room, ...spies);
    const out = [
      probe('who the spies are stays hidden until the result', live, (view) =>
        ['spies', 'spyIds', 'secretWord', 'pairOther'].find((k) => hasKey(view.shared, k)) ? 'shared.spies' : null)
    ];
    if (!live) return out;
    if (s.undercover) {
      out.push(secret('المختلف: the table\'s word is not on the odd one\'s phone', room._impSecret, holders));
      out.push(secret('المختلف: the odd word is only on the odd one\'s phone', room._impPairOther, spies));
      out.push(probe('المختلف: every slice says "player"', true, (view, pid) => (view.you && view.you.role !== 'player' ? 'you.role' : null)));
    } else {
      out.push(secret('the word is not on a spy\'s phone', room._impSecret, holders, { except: room.phase === 'guess' ? ['shared.options'] : [] }));
    }
    return out;
  },
  justone(room) {
    const s = room.shared || {};
    const open = s.phase === 'writing' || s.phase === 'guessing';
    const out = [secret('the word is not on the guesser\'s phone', open ? room._joWord : null, others(room, s.guesserId))];
    const texts = room._clueText || {};
    for (const id of Object.keys(texts)) {
      const removed = (s.clues || []).some((c) => c.id === id && c.removed);
      if (s.phase === 'writing' || (s.phase === 'guessing' && removed)) out.push(secret('a clue stays with its writer until it may be shown', texts[id], [id]));
    }
    return out;
  },
  whoami(room) {
    const a = room._assignments || {};
    return room.phase === 'playing'
      ? Object.keys(a).map((id) => secret('nobody is shown their own character', a[id], others(room, id)))
      : [];
  },
  codenames(room) {
    const s = room.shared || {};
    const playing = room.phase === 'playing' && !s.winner;
    const masters = Object.keys(s.teams || {}).filter((id) => s.teams[id].role === 'spymaster');
    return [
      probe('an unturned card carries no colour', playing, (view) =>
        ((view.shared.board || []).some((c) => !c.revealed && hasKey(c, 'colour')) ? 'shared.board.colour' : null)),
      probe('only a spymaster holds the key', playing, (view, pid) =>
        (masters.indexOf(pid) === -1 && view.you && view.you.key ? 'you.key' : null))
    ];
  },
  fibbage(room) {
    const s = room.shared || {};
    const out = [];
    if (s.phase === 'writing') {
      out.push(secret('the true answer stays on the server while lies are written', room._truth, []));
      for (const id of Object.keys(room._lies || {})) out.push(secret('a lie stays with its writer until the vote', room._lies[id], [id]));
    }
    out.push(probe('nothing names the truth while voting', s.phase === 'voting', (view) =>
      (hasKey(view.shared, 'truth') || hasKey(view.shared, 'truthId') ? 'shared.truth' : null)));
    // «متأكد ✌️» (591): who is sure is their own business until the reveal.
    const sure = Object.keys(room._fibSure || {});
    out.push(probe('who is sure stays on their own phone while voting', s.phase === 'voting' && sure.length > 0, (view, pid) =>
      (hasKey(view.shared, 'sure') ? 'shared.sure'
        : view.you && 'fibSure' in view.you && sure.indexOf(pid) === -1 ? 'you.fibSure' : null)));
    return out;
  },
  drawguess(room) {
    const s = room.shared || {};
    const out = [secret('only the drawer is told the word', s.word ? null : room._word, [s.drawerId])];
    // A close guess's spelling stays on its guesser's phone (the owner's 565, 7 Oct 2026).
    for (const p of room.players) {
      for (const g of ((room.secrets || {})[p.id] || {}).guesses || []) out.push(secret("a close guess is spelled only on its guesser's phone", g.text, [p.id]));
    }
    return out;
  },
  fakeartist(room) {
    const s = room.shared || {};
    const open = s.phase !== 'results';
    return [
      secret('the word is not on the fake\'s phone', open ? room._word : null, others(room, room._fakeId)),
      probe('who the fake is stays hidden until the vote closes', s.phase === 'drawing' || s.phase === 'voting', (view) =>
        (hasKey(view.shared, 'fakeId') ? 'shared.fakeId' : null))
    ];
  },
  trivia(room) {
    const s = room.shared || {};
    const out = [probe('the right answer stays on the server while answering', s.phase === 'answering', (view) =>
      (hasKey(view.shared, 'correctAnswer') ? 'shared.correctAnswer' : null))];
    const deck = room._deck || [];
    for (let k = (room._qIdx || 0) + 1; k < deck.length; k++) out.push(secret('questions to come stay on the server', deck[k].q, []));
    return out;
  },
  stop(room) {
    const s = room.shared || {};
    const open = s.phase === 'writing' || s.phase === 'collecting';
    const out = [];
    if (open) for (const id of Object.keys(room._answers || {})) {
      for (const text of Object.values(room._answers[id] || {})) if (String(text || '').trim()) out.push(secret('a sheet stays on the server until the round is scored', text, [id]));
    }
    return out;
  },
  chameleon(room) {
    const s = room.shared || {};
    const open = s.phase === 'clues' || s.phase === 'voting' || s.phase === 'tiebreak' || s.phase === 'guess';
    return [
      probe('the word stays hidden until the result', open, (view) => (hasKey(view.shared, 'secretWord') ? 'shared.secretWord' : null)),
      probe('the chameleon is told nothing', open, (view, pid) => (pid === room._chamId && view.you && 'secret' in view.you ? 'you.secret' : null)),
      probe('who the chameleon is stays hidden until the vote', s.phase === 'clues' || s.phase === 'voting' || s.phase === 'tiebreak', (view) =>
        (hasKey(view.shared, 'chameleonId') ? 'shared.chameleonId' : null))
    ];
  },
  spyfall(room) {
    const s = room.shared || {};
    const open = s.phase === 'play' || s.phase === 'voting' || s.phase === 'guess';
    return [
      secret('the place is not on a spy\'s phone', open ? room._spyLoc : null, others(room, ...(room._spyIds || [])), { except: ['shared.locations'] }),
      probe('who the spy is stays hidden until the result', open, (view) => (hasKey(view.shared, 'spyIds') || hasKey(view.shared, 'location') ? 'shared.spyIds' : null))
    ];
  },
  bomb(room) {
    const ticking = (room.shared || {}).phase === 'ticking';
    return [
      // When it goes off. (When it was lit is no secret: everyone saw it start.)
      secret('the fuse stays on the server', ticking ? room._bombEndsAt : null, [])
    ];
  },
  twotruths(room) {
    const s = room.shared || {};
    const out = [probe('the lie is not shown while the table votes', s.phase === 'voting', (view) =>
      (typeof view.shared.lieIndex === 'number' ? 'shared.lieIndex' : null))];
    const done = (s.order || []).slice(0, Math.max(0, (s.turn || 0) + 1));
    for (const id of Object.keys(room._tt || {})) {
      if (done.indexOf(id) !== -1) continue;
      for (const text of room._tt[id].items) out.push(secret('statements wait until it is their writer\'s turn', text, [id]));
    }
    return out;
  },
  // فوازير إيموجي: the quiz, or a riddle on the engine (one sets, everyone solves).
  emoji: (room) => ((room.shared || {}).solve ? PROBES.solve(room) : PROBES.quiz(room)),
  wordle: (room) => PROBES.solve(room),
  guessnum: (room) => PROBES.solve(room),
  flags: (room) => PROBES.solve(room),
  // One sets, everyone solves (RoomSolve.js): the secret on the setter's phone
  // only until the round is scored, each board on its own phone only, and the
  // table told how far each board is - never a guess.
  solve(room) {
    const s = room.shared || {};
    const h = room._solve || { boards: {} };
    const x = h.secret;
    const live = s.phase === 'solving' && !!x;
    const out = [];
    if (!live) return out;
    // Whoever solved it has typed it on their own board; the setter wrote it.
    const knows = Object.keys(h.boards).filter((id) => h.boards[id].state === 'won').concat(s.setter ? [s.setter] : []);
    // Where a number may be any count or score, and a word a setting ('ar' is Argentina's code too).
    const counts = ['shared.settings', 'shared.scores', 'shared.board', 'shared.tries', 'shared.progress', 'shared.round', 'shared.rounds',
      'shared.maxTries', 'shared.pub', 'shared.setterAt', 'shared.endsAt', 'you.board.hints', 'you.n', 'version',
      // The night's leaderboard: every player's night points, a count like any other.
      'night',
      // The chat's message ids and times, and the audience's cheer count and guessing deadline.
      'chat', 'cheer', 'predict',
      // Where a solver's own board has narrowed the number to: its own deduction, which may land on it.
      'you.board.lo', 'you.board.hi'];
    const words = ['shared.settings', 'you.board.hints'];
    const country = SOLVE_LISTS.COUNTRIES.find((c) => c.code === x.code) || {};
    const values = s.solve === 'wordle' ? [x.w, x.show]
      : s.solve === 'guessnum' ? [x.n]
      : s.solve === 'flags' ? [x.code, country.ar, country.en]
      : [x.a].concat(x.alt || []);
    for (const v of values) {
      out.push(secret('the secret is on the setter\'s phone only, until the round is scored', v, knows, { except: typeof v === 'number' ? counts : words }));
    }
    const guessOf = (g) => (g.w !== undefined ? g.w : g.n !== undefined ? g.n : g.code !== undefined ? g.code : g.t);
    out.push(probe('a board reaches its own phone only', true, (view, pid) => {
      const you = view.you;
      if (!you) return null;
      if (you.mine) return pid === s.setter ? null : 'you.mine';
      const b = h.boards[pid];
      if (!b) return you.board ? 'you.board (not a solver)' : null;
      const mine = (you.board && you.board.g) || [];
      const own = b.g.map(guessOf);
      return mine.length !== own.length || mine.some((g, i) => guessOf(g) !== own[i]) ? 'you.board.g' : null;
    }));
    out.push(probe('the table sees how far each board is, never a guess', true, (view) => {
      const prog = view.shared.progress || {};
      for (const id of Object.keys(prog)) {
        const bad = Object.keys(prog[id]).find((k) => ['n', 'state', 'at', 'rows', 'best', 'pins'].indexOf(k) === -1);
        if (bad) return 'shared.progress.' + id + '.' + bad;
        if ((prog[id].rows || []).some((r) => !/^[cpa]+$/.test(r))) return 'shared.progress.' + id + '.rows (a letter)';
        // خمّن الدولة's map on the TV (idea 450): a wrong guess's country and its colour step, never the
        // kilometres, never a pin on the answer (the right guess), and only for a game of countries.
        const pins = prog[id].pins;
        if (pins && s.solve !== 'flags') return 'shared.progress.' + id + '.pins (not a game of countries)';
        if ((pins || []).some((p) => Object.keys(p).join() !== 'c,s' || p.c === x.code || !(p.s >= 0 && p.s <= 4))) return 'shared.progress.' + id + '.pins (the answer, or more than a colour)';
      }
      return null;
    }));
    // The owner, 2 Oct 2026: while a round of خمّن الدولة is played nobody - the TV included - sees
    // anyone's guesses, only how many; the pins and the closest share come when it is over.
    if (s.solve === 'flags') out.push(probe('خمّن الدولة: no guess of a board reaches the table before the round is over',
      Object.keys(h.boards || {}).some((id) => h.boards[id].g.length > 0), (view) => {
        const prog = view.shared.progress || {};
        const id = Object.keys(prog).find((k) => hasKey(prog[k], 'pins') || hasKey(prog[k], 'best'));
        return id ? 'shared.progress.' + id + (hasKey(prog[id], 'pins') ? '.pins' : '.best') + ' (mid-round)' : null;
      }));
    return out;
  },
  // سباق ألغاز (RoomRace.js): the ten solo puzzles as a race on the engine. The puzzle reaches
  // everyone, the solution nobody until the round is over, a board its own phone only, and the
  // table sees progress only (done / total, state, place, seconds). Each game says what its
  // solution is and what its board holds (RACE_PROBES).
  strands: (room) => PROBES.race(room),
  wordwheel: (room) => PROBES.race(room),
  connections: (room) => PROBES.race(room),
  pinpoint: (room) => PROBES.race(room),
  queens: (room) => PROBES.race(room),
  tango: (room) => PROBES.race(room),
  nonogram: (room) => PROBES.race(room),
  mines: (room) => PROBES.race(room),
  streak: (room) => PROBES.race(room),
  sudoku: (room) => PROBES.race(room),
  race(room) {
    const s = room.shared || {};
    const h = room._solve || { boards: {} };
    const x = h.secret;
    const live = s.phase === 'solving' && !!x;
    const out = [];
    if (!live) return out;
    const G = RACE_PROBES[s.solve] ? RACE_PROBES[s.solve](room, x, h) : { secrets: [], own: () => null };
    // Where a number may be any count: the progress, the scores, the clock, the chat, the audience.
    const counts = ['shared.settings', 'shared.scores', 'shared.board', 'shared.tries', 'shared.secs', 'shared.progress', 'shared.round', 'shared.rounds',
      'shared.maxTries', 'shared.setterAt', 'shared.endsAt', 'shared.startAt', 'shared.closeAt', 'you.n', 'version', 'night', 'chat', 'cheer', 'predict', 'serverNow'];
    for (const v of G.secrets) {
      out.push(secret('the solution stays on the server until the round is over', v.value, v.knows || [], { except: (v.except || []).concat(typeof v.value === 'number' ? counts : ['shared.settings']) }));
    }
    for (const p of G.probes || []) out.push(p);
    out.push(probe('a board reaches its own phone only', true, (view, pid) => {
      const you = view.you;
      if (!you) return null;
      const b = h.boards[pid];
      if (!b) return you.board ? 'you.board (not a solver)' : null;
      return G.own(you.board || {}, b, pid, view);
    }));
    out.push(probe('the table sees how far each board is, never its content', true, (view) => {
      const prog = view.shared.progress || {};
      for (const id of Object.keys(prog)) {
        const bad = Object.keys(prog[id]).find((k) => ['n', 'state', 'at', 'done', 'total', 'secs'].indexOf(k) === -1);
        if (bad) return 'shared.progress.' + id + '.' + bad;
      }
      return null;
    }));
    return out;
  },
  proverbs: (room) => PROBES.quiz(room),
  quiz(room) {
    const s = room.shared || {};
    const card = room._card || {};
    const out = [];
    if (s.phase === 'answering') {
      // كمّل المثل's three choices (612) carry the word, once their time has come: there only.
      const except = Array.isArray(s.choices) ? ['shared.choices'] : [];
      out.push(secret('the answer stays on the server while answering', card.a, [], { except }));
      for (const alt of card.alt || []) out.push(secret('the other spellings of the answer too', alt, [], { except }));
      if (s.choicesAt) out.push(probe('the choices wait for their time', !s.choices, (view) =>
        (hasKey(view.shared, 'choices') ? 'shared.choices' : null)));
      // A near miss's text is on its guesser's phone only (603, 611).
      for (const id of Object.keys(room.secrets || {})) {
        const q = (room.secrets[id] || {}).quiz;
        if (!q) continue;
        for (const text of Object.values(q.close || {})) out.push(secret('a close guess is shown to its guesser only', text, [id]));
        if (q.near) out.push(secret('a close answer is shown to its writer only', q.near, [id]));
      }
    }
    const deck = room._deck || [];
    // Two cards of a deck can end in the same word (several proverbs do): once the card
    // on the table is revealed, its answer is public, and a card to come with the same
    // answer gives nothing away. It failed about one run in forty before this.
    const shown = String(card.a || '').trim();
    for (let k = (room._qIdx || 0) + 1; k < deck.length; k++) {
      const next = String(deck[k].a || '').trim();
      if (s.phase !== 'answering' && shown && next && (shown.indexOf(next) !== -1 || next.indexOf(shown) !== -1)) continue;
      out.push(secret('cards to come stay on the server', deck[k].a, []));
    }
    return out;
  },
  fiveseconds(room) {
    return (room._fiveDeck || []).map((p) => secret('categories to come stay on the server', p, []));
  },
  telephone(room) {
    const s = room.shared || {};
    const out = [];
    if (s.phase !== 'working' && s.phase !== 'collecting') return out;
    const holders = {};
    for (const p of room.players) {
      const task = (room.secrets[p.id] || {}).task;
      if (task && task.prev && task.prev.kind === 'text') (holders[task.prev.text] = holders[task.prev.text] || []).push(p.id);
    }
    for (const chain of room._chains || []) {
      for (const step of chain.steps) {
        if (!step || step.kind !== 'text' || !step.text) continue;
        out.push(secret('a chain\'s words reach only the phone that works on them next', step.text, [step.by].concat(holders[step.text] || [])));
      }
    }
    return out;
  },
  herd(room) {
    const s = room.shared || {};
    const answers = (room._herd && room._herd.answers) || {};
    return s.phase === 'writing'
      ? Object.keys(answers).map((id) => secret('answers stay on the server until everyone has written', answers[id], [id]))
      : [];
  },
  mafia(room) {
    const s = room.shared || {};
    const m = room._mafia || { roles: {} };
    const live = !!s.phase && s.phase !== 'gameover';
    const lawyer = Object.keys(m.roles).find((id) => m.roles[id] === 'lawyer');
    return [
      probe('the roles stay hidden until the end', live, (view) => (hasKey(view.shared, 'roles') ? 'shared.roles' : null)),
      probe('each phone holds its own role, and only the mafia and the lawyer hold the mafia list', live, (view, pid) => {
        const you = view.you;
        if (!you) return null;
        if (you.role && you.role !== m.roles[pid]) return 'you.role';
        const role = m.roles[pid];
        if (you.mafia && role !== 'mafia' && role !== 'lawyer') return 'you.mafia';
        if (you.picks && role !== 'mafia') return 'you.picks';
        // A mafia phone may name the lawyer as its pick; it must never list them as one of its own.
        if (role === 'mafia' && lawyer && (you.mafia || []).some((x) => x.id === lawyer)) return 'you.mafia (lists the lawyer)';
        return null;
      }),
      // Idea 538: the front row (every role, the night's picks) is an out player's alone.
      probe('only a player who is out watches everything', live && (s.out || []).length > 0, (view, pid) => {
        const you = view.you;
        if (!you || !you.spectate) return null;
        if ((s.alive || []).indexOf(pid) !== -1) return 'you.spectate (still in)';
        if (s.outSee === false) return 'you.spectate (switch off)';
        if ((s.roster || []).indexOf(pid) === -1) return 'you.spectate (not in the game)';
        return null;
      })
    ];
  },
  mind(room) {
    const out = [];
    for (const p of room.players) {
      const mine = ((room.secrets[p.id] || {}).cards || []).slice();
      out.push(probe('a number in a hand is on that phone only', mine.length, (view, pid) => {
        if (pid === p.id) return null;
        const seen = (view.you && view.you.cards) || [];
        if (mine.some((n) => seen.indexOf(n) !== -1)) return 'you.cards';
        return hasKey(view.shared, 'hands') || hasKey(view.shared, 'cards') ? 'shared.cards' : null;
      }));
    }
    return out;
  },
  timeline(room) {
    const hands = (room._timeline && room._timeline.hands) || {};
    const s = room.shared || {};
    // Two cards may share a year: one the table has seen (on the line, or the
    // last card shown) is out in the open, whichever card carries it.
    const shown = ((s.timeline || []).map((c) => c.y)).concat(s.last ? [s.last.y] : []);
    const out = [];
    for (const id of Object.keys(hands)) for (const card of hands[id]) {
      if (shown.indexOf(card.y) === -1) out.push(secret('a card\'s year stays on the server while it is in a hand', card.y, []));
      out.push(secret('a card in a hand is on that phone only', card.id, [id]));
    }
    return out;
  },
  screw(room) {
    const s = room.shared || {};
    const g = room._screw || {};
    const playing = s.phase === 'play' || s.phase === 'memorize' || s.phase === 'thiefGuess';
    return [
      probe('a face-down card is never on the table', playing, (view) => {
        for (const id of Object.keys(view.shared.hands || {})) {
          for (const e of view.shared.hands[id]) {
            if ('card' in e) return 'shared.hands.card';
            const real = (g.hands[id] || []).find((x) => x.id === e.id);
            if (hasKey(e, 'up') && !(real && real.shown)) return 'shared.hands.up (' + e.id + ')';
          }
        }
        return null;
      }),
      probe('the deck and the pile under the top stay on the server', playing, (view) => (hasKey(view.shared, 'deck') ? 'shared.deck' : null)),
      probe('a drawn card is on the drawer\'s phone only', playing && g.drawn, (view, pid) =>
        (s.turn && pid !== s.turn.pid && view.you && hasKey(view.you, 'drawn') ? 'you.drawn' : null)),
      probe('the thief vote says who voted, not whom, until it closes', s.phase === 'thiefGuess', (view) =>
        (JSON.stringify(view.shared).indexOf('"votes"') !== -1 ? 'shared.votes' : null))
    ];
  },
  uno(room) {
    const s = room.shared || {};
    const g = room._uno || { hands: {}, deck: [] };
    const where = {};
    for (const id of Object.keys(g.hands)) for (const c of g.hands[id]) where[c.i] = id;
    for (const c of g.deck) where[c.i] = 'deck';
    const cardsIn = (node, out = []) => {
      if (!node || typeof node !== 'object') return out;
      if ('i' in node && 'k' in node) out.push(node);
      for (const k of Object.keys(node)) cardsIn(node[k], out);
      return out;
    };
    return [probe('a card in a hand is on that phone only, and the deck on none', s.phase === 'play', (view, pid) => {
      const seen = cardsIn(view.shared).concat(view.you && view.you.hand ? [] : cardsIn(view.you));
      const bad = seen.find((c) => where[c.i] !== undefined && where[c.i] !== pid);
      return bad ? 'a ' + (where[bad.i] === 'deck' ? 'deck' : 'hand') + ' card (' + bad.i + ')' : null;
    })];
  },
  domino(room) {
    const s = room.shared || {};
    const d = room._domino || { hands: {}, bone: [] };
    const out = [];
    if (s.phase !== 'play') return out;
    for (const id of Object.keys(d.hands)) for (const t of d.hands[id]) out.push(secret('a tile in a hand is on that phone only', t, [id]));
    for (const t of d.bone) out.push(secret('the tiles left to draw stay on the server', t, []));
    return out;
  },
  bank(room) {
    const decks = (room._bank && room._bank.decks) || null;
    return [probe('the order of the decks stays on the server', !!decks, (view) => {
      const text = JSON.stringify(view);
      if (text.indexOf('"decks"') !== -1) return 'decks';
      for (const k of Object.keys(decks)) if (decks[k].length > 3 && text.indexOf(JSON.stringify(decks[k])) !== -1) return 'the ' + k + ' deck';
      return null;
    })];
  },
  guesswho(room) {
    const s = room.shared || {};
    const g = room._gw || { secret: [] };
    const live = s.phase === 'play' || s.phase === 'pick';
    // «فريق ضد فريق»: a "seat" is a team; its face and its proposed guess are its members' only.
    const teams = !!(s.settings && s.settings.teams && Array.isArray(s.teams));
    const seatOf = (pid) => (teams ? [0, 1].find((k) => (s.teams[k] || []).indexOf(pid) !== -1) : (s.seats || []).indexOf(pid));
    const out = [
      probe('a secret face is on its own phone only (in teams, the team\'s phones)', live, (view, pid) => {
        if (!view.you || view.you.face === undefined) return null;
        const seat = seatOf(pid);
        return seat === undefined || seat === -1 || g.secret[seat] !== view.you.face ? 'you.face' : null;
      }),
      probe('the faces are shown only once the game is over', live, (view) => (hasKey(view.shared, 'reveal') ? 'shared.reveal' : null))
    ];
    if (teams) {
      const pr = g.propose;
      out.push(probe('a team\'s proposed guess is on that team\'s phones only, until agreed', live && !!pr, (view, pid) => {
        if (hasKey(view.shared.propose || {}, 'face')) return 'shared.propose.face';
        const mine = seatOf(pid) === pr.team;
        const has = !!view.you && view.you.propose !== undefined;
        if (has && (!mine || view.you.propose !== pr.face)) return 'you.propose';
        return null;
      }));
    }
    return out;
  },
  battleship(room) {
    const s = room.shared || {};
    const fleets = (room._bs || {}).fleets || [];
    const live = s.phase === 'place' || s.phase === 'play';
    const seas = s.seas || [];
    const afloat = (k, i) => !((seas[k] || {}).sunk || []).some((x) => x.i === i);
    return [
      probe('a fleet is on its own phone only', live, (view, pid) => {
        if (!view.you || view.you.fleet === undefined) return null;
        const seat = (s.seats || []).indexOf(pid);
        return seat === -1 || JSON.stringify(view.you.fleet) !== JSON.stringify(fleets[seat]) ? 'you.fleet' : null;
      }),
      probe('the table is sent no fleet while it is played', live, (view, pid, idx) =>
        (hasKey(view.shared, 'reveal') ? 'shared.reveal' : idx.keys.find((k) => /fleet/i.test(k) && k.indexOf('you.') !== 0) || null)),
      probe('a ship is public only once it has sunk, and then where it really is', live && seas.some((x) => (x.sunk || []).length), (view) => {
        const vs = (view.shared || {}).seas || [];
        for (let k = 0; k < 2; k++) {
          for (const x of ((vs[k] || {}).sunk || [])) {
            const p = (fleets[k] || [])[x.i];
            if (!p || p.x !== x.x || p.y !== x.y || p.d !== x.d) return 'shared.seas.' + k + '.sunk';
          }
        }
        return null;
      }),
      // «الرادار»: where a sweep went is public; its count only on the sweeper's phone and the screen.
      probe("a radar's count reaches the one who swept and the screen only", live && ((room._bs || {}).radar || []).some(Boolean), (view, pid, idx) => {
        const radar = (room._bs || {}).radar || [];
        const seat = (s.seats || []).indexOf(pid);
        if (idx.keys.find((k) => /count/i.test(k) && k.indexOf('shared.') === 0)) return 'shared count';
        const mine = view.you && view.you.radar;
        if (mine && (seat === -1 || !radar[seat] || mine.count !== radar[seat].count || mine.cell !== radar[seat].cell)) return 'you.radar';
        if (view.screen && view.screen.bsRadar && pid !== SCREEN) return 'screen.bsRadar';
        return null;
      }),
      probe('a square shows a ship only once it has been hit', live, (view) => {
        const vs = (view.shared || {}).seas || [];
        for (let k = 0; k < 2; k++) {
          const g = (vs[k] || {}).grid || [];
          const occ = new Set();
          (fleets[k] || []).forEach((p, i) => { const len = [5, 4, 3, 3, 2][i]; for (let n = 0; n < len; n++) occ.add(p.d === 'v' ? (p.y + n) * 10 + p.x : p.y * 10 + p.x + n); });
          for (let c = 0; c < g.length; c++) {
            if ((g[c] === 2 || g[c] === 3) !== occ.has(c) && g[c] !== 0) return 'shared.seas.' + k + '.grid.' + c;
            if ((g[c] === 1 || g[c] === 4) && occ.has(c)) return 'shared.seas.' + k + '.grid.' + c;
          }
          for (let i = 0; i < 5; i++) if (afloat(k, i) && (vs[k].sunk || []).some((x) => x.i === i)) return 'shared.seas.' + k + '.sunk';
        }
        return null;
      })
    ];
  },
  hangman(room) {
    const s = room.shared || {};
    const h = room._hm || { boards: {} };
    const live = s.phase === 'guessing';
    const teams = !!(s.settings && s.settings.mode === 'teams');
    const hints = h.hints || [];
    const opens = (b) => [0, 2, 4].filter((m) => (b ? b.miss.length : 0) >= m).length;
    return [
      secret('the word is on the writer\'s phone only, until the word ends', live ? h.word : null, s.setter ? [s.setter] : []),
      probe('a board\'s letters reach its own phone only', live && !teams, (view, pid) => {
        if (!view.you || view.you.word !== undefined) return null;
        const b = h.boards[pid];
        return !b || JSON.stringify(view.you.g) !== JSON.stringify(b.g) ? 'you.g' : null;
      }),
      probe('a lifeline\'s letters (shown or greyed) reach their own board\'s phone only', live && !teams && Object.values(h.boards).some((b) => b.lr || b.lx), (view, pid) => {
        if (view.shared.tb) return 'shared.tb';
        if (!view.you || view.you.word !== undefined) return null;
        const b = h.boards[pid];
        if (!b) return view.you.x || view.you.g ? 'you' : null;
        return JSON.stringify(view.you.x || []) !== JSON.stringify(b.x || []) || !!view.you.lr !== !!b.lr ? 'you.x' : null;
      }),
      probe('a hint the writer wrote opens on a board\'s 2nd and 4th miss, on that board\'s phone only', live && hints.length > 1, (view, pid, idx) => {
        if (pid === s.setter) return null;
        const b = teams ? h.boards.team : h.boards[pid];
        const open = opens(b);
        for (let i = open; i < hints.length; i++) { const at = idx.find(hints[i]); if (at) return at + ' (hint ' + (i + 1) + ')'; }
        return null;
      }),
      probe('the team\'s board is the table\'s, and only the word stays on the writer\'s phone', live && teams, (view, pid) => {
        const b = h.boards.team;
        if (!b || !view.shared.tb) return 'shared.tb';
        if (JSON.stringify(view.shared.tb.g) !== JSON.stringify(b.g)) return 'shared.tb.g';
        return view.you && pid !== s.setter ? 'you' : null;
      }),
      probe('the table sees how far each board is, never its letters', live, (view) => {
        const bad = Object.keys(view.shared.progress || {}).find((id) =>
          Object.keys(view.shared.progress[id]).some((k) => ['n', 'miss', 'state', 'at', 'end'].indexOf(k) === -1));
        return bad ? 'shared.progress.' + bad : null;
      })
    ];
  },
  doubt(room) {
    const s = room.shared || {};
    const g = room._doubt || { hands: {}, pile: [] };
    const where = {};
    for (const id of Object.keys(g.hands)) for (const c of g.hands[id]) where[c.i] = id;
    for (const pl of g.pile) for (const c of pl.cards) where[c.i] = 'pile';
    const cardsIn = (node, out = []) => {
      if (!node || typeof node !== 'object') return out;
      if ('i' in node && 'c' in node) out.push(node);
      for (const k of Object.keys(node)) cardsIn(node[k], out);
      return out;
    };
    const FACE = /"(?:A|[2-9]|10|J|Q|K)[shdc]"/;
    return [
      probe('a card in a hand is on that phone only, and the pile on none', s.phase === 'play', (view, pid) => {
        const seen = cardsIn(view.shared).concat(cardsIn(view.you));
        const bad = seen.find((c) => where[c.i] !== undefined && where[c.i] !== pid);
        return bad ? 'a ' + (where[bad.i] === 'pile' ? 'pile' : 'hand') + ' card (' + bad.i + ')' : null;
      }),
      probe('the table sees a face only once a call turns its play over', s.phase === 'play', (view) => {
        const sh = Object.assign({}, view.shared, { events: (view.shared.events || []).filter((e) => e.type !== 'call') });
        return FACE.test(JSON.stringify(sh)) ? 'shared (a card face)' : null;
      })
    ];
  },
  // جمجمة: a disc face down is on its owner's phone only; the table sees a face once it is turned over;
  // the disc a skull took is on the bidder's phone only; «هيعملها؟»'s answers stay hidden until the result.
  skull(room) {
    const s = room.shared || {};
    const g = room._skull || { discs: {}, piles: {}, guesses: {}, lost: {} };
    const owner = {};
    for (const id of Object.keys(g.discs)) for (const d of g.discs[id]) owner[d.i] = id;
    // A disc a skull took keeps its owner: only the bidder's phone may ever hold it.
    for (const id of Object.keys(g.lost || {})) for (const d of g.lost[id]) owner[d.i] = id;
    const discsIn = (node, out = []) => {
      if (!node || typeof node !== 'object') return out;
      if ('i' in node && 'f' in node) out.push(node);
      for (const k of Object.keys(node)) discsIn(node[k], out);
      return out;
    };
    const live = ['place', 'add', 'bid', 'guess', 'flip', 'lose', 'result'].indexOf(s.phase) !== -1;
    const anyLost = Object.keys(g.lost || {}).some((id) => (g.lost[id] || []).length);
    const guessing = (s.phase === 'guess' || s.phase === 'flip') && Object.keys(g.guesses || {}).length > 0;
    return [
      probe('a disc is on its owner\'s phone only, and the table holds none', live, (view, pid) => {
        if (discsIn(view.shared).length) return 'shared (a disc)';
        const bad = discsIn(view.you).find((d) => owner[d.i] !== undefined && owner[d.i] !== pid);
        return bad ? 'you (someone else\'s disc ' + bad.i + ')' : null;
      }),
      probe('a face on the table only where a disc was turned over (or a seat\'s flower, which is public)', live, (view) => {
        const FACES = ['rose', 'jasmine', 'lotus', 'skull'];
        const ok = (path) => /^flowers\.[^.]+$/.test(path) || /^flipped\.\d+\.f$/.test(path) ||
          /^events\.\d+\.(f|type|faces\.\d+)$/.test(path);
        let bad = null;
        const walk = (node, path) => {
          if (bad || node === null || node === undefined) return;
          if (typeof node === 'object') { for (const k of Object.keys(node)) walk(node[k], path ? path + '.' + k : k); return; }
          if (typeof node === 'string' && FACES.indexOf(node) !== -1 && !ok(path)) bad = 'shared.' + path;
        };
        walk(view.shared, '');
        return bad;
      }),
      probe('the table sees exactly the discs turned over, from the top of each pile', s.phase === 'flip' && (s.flipped || []).length > 0, (view) => {
        const flipped = view.shared.flipped || [];
        const byOwner = {};
        flipped.forEach((x) => { (byOwner[x.owner] = byOwner[x.owner] || []).push(x.f); });
        for (const id of Object.keys(byOwner)) {
          const pile = (g.piles[id] || []).map((i) => (g.discs[id].find((d) => d.i === i) || {}).f);
          const top = pile.slice(pile.length - byOwner[id].length).reverse();
          if (top.join() !== byOwner[id].join()) return 'shared.flipped (' + id + ')';
        }
        return null;
      }),
      probe('the disc a skull took is on the bidder\'s phone only', anyLost, (view, pid) => {
        if (/"lost":\[/.test(JSON.stringify(view.shared))) return 'shared (lost)';
        if ((view.shared.events || []).some((e) => e.type === 'lost' && 'f' in e)) return 'shared.events (a lost face)';
        const mine = view.you && view.you.lost;
        if (mine && JSON.stringify(mine) !== JSON.stringify(g.lost[pid] || [])) return 'you.lost (not its own)';
        return null;
      }),
      // A lost disc leaves no trace in the public counts until the next deal: a hand or a pile one
      // short would say where it was (the skull kept in hand, say). So in every seat still at the
      // table (or out this round) hand + pile is what it held when the round was dealt.
      probe('a lost disc leaves the hand and pile counts as dealt until the next deal', live && anyLost, (view) => {
        const sh = view.shared;
        const r = sh.result || {};
        const seats = (s.alive || []).concat(r.out ? [r.out] : []);
        for (const id of seats) {
          const dealt = (g.discs[id] || []).length + (g.lost[id] || []).filter((l) => l.round === s.round).length;
          const shown = (Number((sh.hands || {})[id]) || 0) + (Number((sh.piles || {})[id]) || 0);
          if (shown !== dealt) return 'shared.hands/piles (' + id + ': ' + shown + ' for ' + dealt + ')';
        }
        return null;
      }),
      probe('«هيعملها؟»: who answered is public, what they answered is not, until the result', guessing, (view, pid) => {
        const sh = JSON.stringify(view.shared);
        if (/"guesses":\{"/.test(sh) && !(view.shared.result && view.shared.phase === 'result')) return 'shared (guesses)';
        const own = view.you ? view.you.guess : undefined;
        if (own !== undefined && own !== g.guesses[pid]) return 'you.guess (not its own)';
        return null;
      })
    ];
  },
  // إستميشن: a card still in a hand is on that seat's phone only; the table sees a face once it is played.
  estimation(room) {
    const s = room.shared || {};
    const g = room._est || { hands: [[], [], [], []] };
    const live = ['dash', 'bid', 'call', 'play'].indexOf(s.phase) !== -1;
    const holder = {};
    (g.hands || []).forEach((h, k) => h.forEach((c) => { holder[c] = (s.seats || [])[k]; }));
    const FACES = /"((?:A|[2-9]|10|J|Q|K)[shdc])"/g;
    return [
      probe('a card in a hand is on its own phone only - never the table, another phone or the screen', live, (view, pid) => {
        const text = JSON.stringify({ shared: view.shared, you: view.you });
        for (const m of text.matchAll(FACES)) if (holder[m[1]] && holder[m[1]] !== pid) return 'a card of ' + holder[m[1]] + '\'s hand (' + m[1] + ')';
        return null;
      }),
      probe('a phone\'s hand is its own seat\'s, whole', live, (view, pid) => {
        const k = (s.seats || []).indexOf(pid);
        if (k === -1) return view.you && view.you.hand ? 'you.hand (a phone not seated)' : null;
        const mine = (view.you && view.you.hand) || [];
        return mine.slice().sort().join() === g.hands[k].slice().sort().join() ? null : 'you.hand (not its own)';
      })
    ];
  },
  oldmaid(room) {
    const s = room.shared || {};
    const g = room._om || { hands: {} };
    const live = s.phase === 'play';
    const where = {};
    for (const id of Object.keys(g.hands)) for (const c of g.hands[id]) where[c.i] = id;
    return [
      probe('a hand is on its own phone only', live, (view, pid) => {
        if (pid === SCREEN) return null;
        const mine = (view.you && view.you.hand) || [];
        return mine.some((c) => where[c.i] !== pid) ? 'you.hand' : null;
      }),
      probe('who holds الشايب, and what was drawn, stay hidden until the end', live, (view) => {
        const sh = Object.assign({}, view.shared, { thrown: [], events: (view.shared.events || []).filter((e) => e.type !== 'pairs') });
        const text = JSON.stringify(sh);
        return /"OM"|"(?:A|[2-9]|10|J|Q|K)[shdc]"/.test(text) || hasKey(view.shared, 'reveal') ? 'shared' : null;
      })
    ];
  },
  // الكراسي الموسيقية: the stop moment (and the fake pauses) never leave the server while the music plays.
  // «الدي جي»: in a DJ's round the stop is the DJ's press, and no phone (theirs included) is sent a
  // moment before it; once the server takes a round over (the DJ gone) its stop is a secret again.
  chairs(room) {
    const h = room._chairs;
    const live = (room.shared || {}).phase === 'music' && !!h;
    return [
      secret('the stop moment stays on the server', live && !h.dj ? h.stopAt : null, []),
      probe('no fake pause is announced before it comes', live && h.fakes.length > 0, (view) => (hasKey(view.shared, 'fakes') ? 'shared.fakes' : null)),
      probe("a DJ's round: no stop moment on any phone (the DJ's too) before the DJ presses", live && !!h.dj,
        (view, pid, idx) => (hasKey(view.shared, 'stopAt') ? 'shared.stopAt' : view.you ? 'you' : idx.find(h.stopAt))),
      probe('a round the server took over from its DJ: the secret stop again', live && !h.dj && !!(room.shared || {}).djLost,
        (view, pid, idx) => idx.find(h.stopAt))
    ];
  },
  // رد الفعل «أسرع إيد»: the green moment, which rounds have a fake, and a fake's moment and kind
  // never leave the server before they happen.
  reaction(room) {
    const s = room.shared || {};
    const h = room._reaction;
    const red = s.phase === 'wait' && !!h;
    const fakeAhead = red && !!h.fake && !h.fake.shown;
    return [
      secret('the green moment stays on the server until it comes', red ? h.greenAt : null, []),
      secret("a fake's moment stays on the server until it comes", fakeAhead ? h.fake.at : null, []),
      probe('no fake is on the screens before it comes', fakeAhead, (view) => (hasKey(view.shared, 'fake') ? 'shared.fake' : null)),
      probe('the rounds with a fake are never sent', !!h, (view) => (hasKey(view.shared, 'plan') ? 'shared.plan' : null)),
      // «ركّز!» (875): the words still to come, and the one that agrees, stay on the server.
      probe('the words to come are never sent', red && !!(h.words || []).length, (view) => (hasKey(view.shared, 'words') ? 'shared.words' : null)),
      probe('the word that agrees is not on the screens before its moment', red && !!h.match, (view) => {
        const w = (view.shared || {}).word;
        if (hasKey(view.shared, 'match')) return 'shared.match';
        return w && w.w === w.ink ? 'shared.word' : null;
      })
    ];
  },
  // بالظبط ٣!: a phone's secret (a colour, a shape, a number, a word) on its own phone only, and on no
  // other screen until the verdict publishes them all; every tap's exact events stay on the server.
  exact(room) {
    const s = room.shared || {};
    const h = room._exact;
    const open = !!h && (s.phase === 'ready' || s.phase === 'go');
    const withSecrets = open && Object.keys(h.mine || {}).length > 0;
    return [
      probe("a phone's secret is its own, exactly", withSecrets, (view, pid) => {
        if (pid === SCREEN) return null;
        const mine = (view.you && view.you.mine) || null;
        const want = h.mine[pid] || null;
        return JSON.stringify(mine) === JSON.stringify(want) ? null : 'you.mine';
      }),
      probe('no secret on the table before the verdict', withSecrets, (view) => {
        const sv = view.shared || {};
        if (hasKey(sv, 'result')) return 'shared.result';
        const o = sv.order || {};
        return ['mine', 'c', 'sh', 'say', 'reveal'].find((k) => hasKey(o, k)) ? 'shared.order' : null;
      }),
      probe("a tap's exact moment stays on the server while the order is open", open, (view) => {
        const sv = view.shared || {};
        return hasKey(sv, 'ev') || (sv.live && hasKey(sv.live, 'ev')) ? 'shared.ev' : null;
      })
    ];
  },
  // الشاهد: the real face on the witness's phone only, and only while they look; which suspect it is, hidden until the reveal.
  witness(room) {
    const s = room.shared || {};
    const h = room._witness;
    const realSig = h ? WIT.gwSignature(h.faces[h.real]) : null;
    const faceSigs = (node, skip, out = []) => {
      if (!node || typeof node !== 'object' || skip.indexOf(node) !== -1) return out;
      if (typeof node.g === 'string' && 'shirt' in node) out.push(WIT.gwSignature(node));
      Object.keys(node).forEach((k) => faceSigs(node[k], skip, out));
      return out;
    };
    return [
      probe("the real face is on the witness's phone only, and only while they look", !!h && (s.phase === 'look' || s.phase === 'draw'), (view, pid) => {
        if (pid === s.witnessId && s.phase === 'look') return null;
        const skip = [view.shared && view.shared.sketch].filter(Boolean);
        return faceSigs(view, skip).indexOf(realSig) !== -1 ? 'the real face' : null;
      }),
      probe('which suspect is the real one stays hidden until the reveal', !!h && s.phase === 'vote', (view) => {
        const sv = view.shared || {};
        if (typeof sv.realIdx === 'number') return 'shared.realIdx';
        if (sv.picks) return 'shared.picks';
        // «الرسم مطابق» measures the sketch against the real face: its ticks would name it (2 Oct 2026).
        if (sv.match) return 'shared.match';
        if (view.you && view.you.face) return 'you.face';
        return null;
      }),
      // «ممنوع تقول…» (7 Oct 2026): the taboo on the witness's phone and the screen only, until the reveal.
      probe("the witness's taboo is on their phone and the screen only, until the reveal", !!h && !!h.taboo && s.phase !== 'reveal', (view, pid) => {
        if (pid === s.witnessId || pid === SCREEN) return null;
        if ((view.shared || {}).taboo) return 'shared.taboo';
        return JSON.stringify(view).indexOf('"taboo":"') !== -1 ? 'the taboo' : null;
      })
    ];
  },
  // ارسم اللي بتسمعه: the picture on the describer's phone only, and no drawing on any phone, until the grading.
  hear(room) {
    const s = room.shared || {};
    const h = room._hear;
    const before = s.phase === 'ready' || s.phase === 'draw' || s.phase === 'collect';
    const picSig = h && h.pic && h.pic.s.length ? JSON.stringify(h.pic.s[0]) : null;
    const inks = h && h.ink ? Object.keys(h.ink).map((id) => ({ id, strokes: h.ink[id] })).filter((x) => x.strokes.length) : [];
    return [
      probe("the picture is on the describer's phone only, until the grading", before && !!picSig, (view, pid) => {
        if (pid === s.describerId) return null;
        if (view.you && view.you.pic) return 'you.pic';
        if (view.shared && view.shared.pic) return 'shared.pic';
        return JSON.stringify(view).indexOf(picSig) !== -1 ? 'the picture' : null;
      }),
      probe('what the picture is (its thing) stays off the other phones until the grading', before && !!(h && h.pic && h.pic.thing), (view, pid) => {
        if (pid === s.describerId) return null;
        return JSON.stringify(view).indexOf('"' + h.pic.thing + '"') !== -1 ? 'the thing' : null;
      }),
      probe('no drawing reaches any phone (its own neither) before the grading', before && inks.length > 0, (view) => {
        const all = JSON.stringify(view);
        const hit = inks.find((x) => x.strokes.some((st) => all.indexOf(JSON.stringify(st.p)) !== -1));
        if (hit) return 'the drawing of ' + hit.id;
        return view.shared && view.shared.drawings ? 'shared.drawings' : null;
      })
    ];
  },
  // سلك مقطوع: each phone its own panel; the orders are public, but never who holds their control.
  wire(room) {
    const w = room._wire;
    const live = !!w && (room.shared || {}).phase !== 'gameover';
    return [
      probe('a phone is sent its own panel, no other', live, (view, pid) => {
        if (pid === SCREEN) return view.you ? 'you' : null;
        const mine = (w.panels[pid] || []).join();
        const got = ((view.you && view.you.panel) || []).map((x) => x.c).join();
        return got === mine ? null : 'you.panel';
      }),
      probe('no phone is told whose panel an order waits on', live, (view) => {
        const o = view.shared.orders || {};
        if (hasKey(view.shared, 'panels') || hasKey(view.shared, 'vals')) return 'shared.panels';
        return Object.keys(o).some((k) => o[k] && (hasKey(o[k], 'by') || hasKey(o[k], 'holder') || hasKey(o[k], 'pid') || hasKey(o[k], 'base'))) ? 'shared.orders' : null;
      })
    ];
  },
  // الخزنة: a lock's look only on the phone that holds it (or the screen when the TV opens), a page
  // only on the phone it was dealt to, the opener never the page for its own lock, no answer anywhere.
  vault(room) {
    const v = room._vault;
    const s = room.shared || {};
    const live = !!(v && v.safe && s.sides) && s.phase !== 'gameover';
    if (!live) return [probe('vault: a phone is sent exactly what it holds', false, () => null), probe("vault: a lock's look reaches only its holder", false, () => null),
      probe('vault: a page reaches only the phone it was dealt to', false, () => null), probe('vault: no phone holds a lock and the page that opens it', false, () => null),
      probe('vault: the table\'s state holds no look, page or answer', false, () => null)];
    const holders = {};       // pid -> { locks: [i], pages: [u] }, across the sides
    let tvOpens = false;
    Object.keys(s.sides).forEach((k) => {
      const side = s.sides[k];
      if (side.opener === 'tv') tvOpens = true;
      Object.keys(side.holders).forEach((pid) => { holders[pid] = side.holders[pid]; });
    });
    const lookJson = v.safe.locks.map((l) => JSON.stringify(l.look));
    const pageJson = (u) => JSON.stringify(VAULT.vaultPageData(v.manual, u));
    const allUnits = [...new Set([].concat(...Object.values(holders).map((h) => h.pages)))];
    const lone = (pid) => Object.keys(s.sides).some((k) => s.sides[k].ids.length === 1 && s.sides[k].ids[0] === pid);
    return [
      probe('vault: a phone is sent exactly what it holds', true, (view, pid) => {
        if (pid === SCREEN) {
          if (!tvOpens) return view.screen ? 'screen' : null;
          const got = ((view.screen || {}).locks || []).map((l) => l.i).join();
          return got === s.locks.map((l) => l.i).join() ? null : 'screen.locks';
        }
        const h = holders[pid];
        const you = view.you || {};
        if (!h) return view.you ? 'you (not at the table)' : null;
        if ((you.locks || []).map((l) => l.i).join() !== h.locks.join()) return 'you.locks';
        if ((you.pages || []).map((p) => p.u).join() !== h.pages.join()) return 'you.pages';
        return null;
      }),
      probe("vault: a lock's look reaches only its holder", true, (view, pid) => {
        const json = JSON.stringify(view);
        for (let i = 0; i < lookJson.length; i++) {
          const mayLook = pid === SCREEN ? tvOpens : !!(holders[pid] && holders[pid].locks.indexOf(i) !== -1)
            // «فريقين»: both openers see the same safe; a look equal to the one they hold is theirs.
            || (holders[pid] && holders[pid].locks.some((j) => lookJson[j] === lookJson[i]));
          if (!mayLook && json.indexOf(lookJson[i]) !== -1) return 'the look of lock ' + i;
        }
        return null;
      }),
      probe('vault: a page reaches only the phone it was dealt to', allUnits.length > 0, (view, pid) => {
        const json = JSON.stringify(view);
        const mine = (holders[pid] || {}).pages || [];
        const hit = allUnits.find((u) => mine.indexOf(u) === -1 && json.indexOf(pageJson(u)) !== -1);
        return hit ? 'page ' + hit : null;
      }),
      probe('vault: no phone holds a lock and the page that opens it', true, (view, pid) => {
        const you = view.you || {};
        if (!you.locks || !you.locks.length || lone(pid)) return null;
        const kinds = you.locks.map((l) => l.k);
        // «الكل» with every kind on one phone (a table shrunk by leavers) has no other page to give.
        const p = (you.pages || []).find((x) => kinds.indexOf(x.k) !== -1);
        return p ? 'you.pages ' + p.u : null;
      }),
      probe('vault: the table\'s state holds no look, page or answer', true, (view) => {
        // «ليه كده؟» (7 Oct 2026): a safe's explanation only once it is over.
        if ((view.shared || {}).phase === 'play' && ((view.shared || {}).result || {}).explain) return 'result.explain during play';
        const json = JSON.stringify(view.shared || {});
        return ['"look"', '"sol"', '"manual"', '"seed"', '"rules"', '"cols"', '"codes"', '"prog"'].find((k) => json.indexOf(k) !== -1) || null;
      })
    ];
  },
  // افتح يا صندوق: the box's contents on no phone before it opens (a key's peek on its holder's alone);
  // every clue on its own phone only; the bids hidden until all are in.
  box(room) {
    const s = room.shared || {};
    const h = room._box;
    // «عرض الحاج» (7 Oct 2026): the box stays shut while its winner is offered the money.
    const closed = !!h && (s.phase === 'talk' || s.phase === 'bid' || s.phase === 'offer');
    return [
      probe('the box on the table is on no phone before it opens', closed, (view, pid, idx) => {
        const sv = view.shared || {};
        if (hasKey(sv, 'deck')) return 'shared.deck';
        if (sv.result && sv.result.box === s.box) return 'shared.result';
        // Its kind anywhere but in the boxes already opened, a clue (which may name it among others) or a key's peek.
        return idx.find(h.deck[s.box].kind + '', { except: ['shared.opened', 'shared.result', 'you.clue', 'you.peek'] });
      }),
      probe("a key's peek at the next box reaches its holder only", !!h && Object.keys(h.peeks || {}).length > 0, (view, pid) => {
        const p = view.you && view.you.peek;
        if (!p) return null;
        return h.peeks[pid] && h.peeks[pid].box === p.box && h.peeks[pid].kind === p.kind ? null : 'you.peek (someone else\'s)';
      }),
      probe("a phone's clue is its own, and nobody else's is on it", closed, (view, pid) => {
        if (hasKey(view.shared, 'clues')) return 'shared.clues';
        const c = view.you && view.you.clue;
        if (!c) return null;
        return JSON.stringify(c) === JSON.stringify(h.clues[pid]) ? null : 'you.clue (someone else\'s)';
      }),
      probe('the bids are hidden until all are in', closed, (view, pid) => {
        if (hasKey(view.shared, 'bids')) return 'shared.bids';
        const b = view.you && view.you.bid;
        if (b === undefined || b === null) return null;
        return h.bids[pid] === b ? null : 'you.bid (someone else\'s)';
      }),
      // «تأمين» (7 Oct 2026): who insured is a phone's own until the opening.
      probe('an insurance is on its own phone only, until the opening', closed && Object.keys(h.insured || {}).length > 0, (view, pid) => {
        if (hasKey(view.shared, 'insured')) return 'shared.insured';
        return view.you && view.you.insured && !(h.insured || {})[pid] ? 'you.insured (someone else\'s)' : null;
      })
    ];
  },
  // الأوضة المضلمة: the map (its seed) and where the traps are never reach the mover's phone, nor anything public.
  darkroom(room) {
    const s = room.shared || {};
    const h = room._dark;
    const live = !!h && !!h.seed && s.phase !== 'gameover';
    const pev = (h && h.pev) || [];
    return [
      probe("the map's seed is never on the mover's phone, nor anywhere public", live, (view, pid, idx) => {
        if (pid === s.moverId) return idx.find(h.seed);
        return idx.find(h.seed, { except: ['you', 'screen'] });
      }),
      probe("the mover's phone has only the echo: no map, no near misses", live, (view, pid) => {
        if (pid !== s.moverId) return null;
        const y = view.you || {};
        if (y.g) return 'you.g';
        if (y.pev) return 'you.pev';
        // «دايخ!» (7 Oct 2026): the guides are told the mover is dizzy; the mover never.
        if (y.dz !== undefined || JSON.stringify(view.shared || {}).indexOf('dizzy') !== -1) return "dizzy on the mover's phone";
        if (view.screen) return 'screen';
        return null;
      }),
      probe('where a trap is (a near miss, the one that caught the mover) is not public', live && pev.length > 0, (view) => {
        const sh = JSON.stringify(view.shared || {});
        return pev.some((e) => sh.indexOf('"x":' + e.x + ',"y":' + e.y) !== -1 && e.type) ? 'shared (a trap\'s place)' : null;
      })
    ];
  },
  // Nothing hidden: the generic rules still hold.
  wouldyou: () => [], mostlikely: () => [], buzzer: () => [], monkey: () => [],
  // عربيات التصادم: the TV runs the cars; the server holds nothing but the round.
  bumper: () => [],
  connect4: () => [], dots: () => [], xo: () => [], ludo: () => [], bowling: () => [],
  // السلم والتعبان: the whole game is on the table; the server holds nothing but the dice it hasn't rolled.
  snakes: () => [],
  // شطرنج: the whole game is on the table.
  chess: () => [],
  // الوزير المستخبي (a chess room with variant 'hq'): each hidden pawn's square on its owner's phone
  // only, until it is revealed, taken, promoted or the game ends; the table sees who has picked.
  'chess:hq'(room) {
    const s = room.shared || {};
    const bd = s.chess || {};
    const h = room._chq;
    const live = !!(h && bd.hq && !bd.hq.end && s.phase === 'play');
    const name = (i) => 'abcdefgh'[i & 7] + ((i >> 3) + 1);
    return [
      probe('hidden queen: a hidden pawn\'s square is on its own phone only', live, (view, pid) => {
        const you = view.you;
        if (!you || you.hq === undefined) return null;
        const seat = (s.seats || []).indexOf(pid);
        if (seat === -1) return 'you.hq (a phone not playing)';
        return you.hq === (h.sq[seat] >= 0 ? name(h.sq[seat]) : '') ? null : 'you.hq (not its own)';
      }),
      probe('hidden queen: the table sees who picked and what was revealed, never a hidden square', live, (view) => {
        const vh = ((view.shared || {}).chess || {}).hq;
        if (!vh) return 'shared.chess.hq (missing)';
        const extra = Object.keys(vh).find((k) => ['picking', 'picked', 'pickEnds', 'events', 'end'].indexOf(k) === -1);
        if (extra) return 'shared.chess.hq.' + extra;
        if (vh.end) return 'shared.chess.hq.end (before the end)';
        if ((vh.picked || []).some((x) => typeof x !== 'boolean')) return 'shared.chess.hq.picked';
        if ((vh.events || []).some((e) => h.sq[e.seat] >= 0 || (e.kind !== 'reveal' && e.kind !== 'captured'))) return 'shared.chess.hq.events (a queen still hidden)';
        const last = (view.shared.chess || {}).last;
        if (last && last.hq && Object.keys(last.hq).some((k) => k !== 'reveal' && k !== 'captured')) return 'shared.chess.last.hq';
        if (/"(sq|pick|how|at)":\[/.test(JSON.stringify(view.shared))) return 'shared (a secret\'s shape)';
        return null;
      }),
      probe('hidden queen: both picks are shown once the game is over', !!(bd.hq && bd.hq.end && h), (view) => {
        const end = ((view.shared.chess || {}).hq || {}).end || [];
        return [0, 1].every((c) => h.pick[c] < 0 || (end[c] && end[c].pick === name(h.pick[c]))) ? null : 'shared.chess.hq.end';
      })
    ];
  },
  // «اعمل مسابقتك» in trivia: the bank's rules, and the family's quiz itself never leaves the server.
  'trivia:quiz'(room) {
    const s = room.shared || {};
    const out = PROBES.trivia(room);
    out.push(probe('the quiz as the author wrote it stays on the server', !!room._pack, (view) =>
      (JSON.stringify(view).indexOf('"questions":') !== -1 ? 'the pack' : null)));
    out.push(probe('a quiz question\'s answer is not sent while it is asked', s.phase === 'answering' && !!s.quiz, (view) =>
      (hasKey(view.shared, 'correctAnswer') || (view.you && 'answer' in view.you) ? 'the answer' : null)));
    return out;
  },
  // «اعمل مسابقتك» on the buzzer: the answer on the host's phone only, until it is shown.
  'buzzer:quiz'(room) {
    const s = room.shared || {};
    const q = s.quiz;
    const hidden = !!(q && !q.done && q.answer === null);
    const right = hidden && room._bzDeck ? room._bzDeck[q.n] : null;
    const out = [
      probe('buzzer quiz: the right answer is on the host\'s phone only', hidden, (view, pid) => {
        if (hasKey(view.shared.quiz || {}, 'answer')) return 'shared.quiz.answer';
        const y = view.you || {};
        if (pid !== room.hostId && 'answer' in y) return 'you.answer';
        if (pid === room.hostId && pid !== SCREEN && y.answer !== right.answer) return 'you.answer (the host\'s is wrong)';
        return null;
      }),
      probe('buzzer quiz: questions to come stay on the server', !!(q && room._bzDeck), (view, pid, idx) => {
        for (let k = (q.n || 0) + 1; k < room._bzDeck.length; k++) { const hit = idx.find(room._bzDeck[k].q); if (hit) return hit; }
        return null;
      }),
      probe('the quiz as the author wrote it stays on the server', !!room._pack, (view) =>
        (JSON.stringify(view).indexOf('"questions":') !== -1 ? 'the pack' : null))
    ];
    return out;
  },
  // «كلماتنا» in الجاسوس: the family's word is on the players' phones only, like the app's.
  'imposter:words'(room) {
    return PROBES.imposter(room).concat([probe('the family\'s list stays on the server', !!room._pack, (view) =>
      (JSON.stringify(view).indexOf('"words":[') !== -1 && !(view.shared && view.shared.words) ? 'the pack' : null))]);
  },
  // شطرنج بالتصويت: what anyone voted stays on their own phone until the move is played.
  votechess(room) {
    const s = room.shared || {};
    const votes = (room._vc && room._vc.votes) || {};
    const open = s.phase === 'play' && !!s.vote && Object.keys(votes).length > 0;
    return [
      probe('a vote stays on the phone of whoever cast it until the move is played', open, (view, pid) => {
        const sv = view.shared.vote || {};
        const extra = Object.keys(sv).find((k) => ['team', 'n', 'endsAt', 'voted'].indexOf(k) === -1);
        if (extra) return 'shared.vote.' + extra;
        if (JSON.stringify(view.shared).indexOf('"votes":') !== -1) return 'shared (votes)';
        if ((view.shared.tallies || []).some((t) => t.n === s.vote.n)) return 'shared.tallies (this move)';
        const mine = view.you && view.you.vote;
        if (mine && JSON.stringify(mine) !== JSON.stringify(votes[pid])) return 'you.vote (not your own)';
        if (view.you && Object.keys(view.you).some((k) => k !== 'vote' && k !== 'n')) return 'you';
        return null;
      })
    ];
  },
  // المخ والإيد: the whole game is on the table (what the Brain named is said out loud).
  handbrain: () => [],
  // باغ هاوس: nothing is hidden - the hands are on the table - but check anyway: no phone is sent
  // a slice of its own, and every phone and the screen see both boards and all four hands.
  bughouse(room) {
    const s = room.shared || {};
    return [
      probe('bughouse: no phone is dealt anything in secret', true, (view) => (view.you ? 'you' : null)),
      probe('bughouse: both boards and both hands of each on every phone', Array.isArray(s.boards), (view) => {
        const b = (view.shared || {}).boards || [];
        return b.length === 2 && b.every((x) => x.g && x.g.hand && x.g.hand.w && x.g.hand.b) ? null : 'shared.boards';
      })
    ];
  },
  // شطرنج الأربعة: the whole game is on the table too.
  chess4: () => [],
  // دندنها: the song - its title, the names it goes by, the singer, the trackId, Apple's address - is on no
  // guesser's phone and not the screen until the reveal (the four choices aside, where the right title sits
  // among three others); in «دندنة» the hummer alone holds it and the round's token; the right choice's place
  // and the picks wait for the reveal; a phone's pick and near miss are its own.
  hum(room) {
    const s = room.shared || {};
    const h = room._hum;
    const open = !!h && h.cur !== null && h.cur !== undefined && ['listen', 'count', 'type', 'choices'].indexOf(s.phase) !== -1;
    const song = open ? HUM.HUM_SONGS[h.cur] : null;
    const allowed = s.mode === 'hum' && s.hummerId ? [s.hummerId] : [];
    const choices = ['shared.choices'];
    return [
      secret("the song's title is on no guesser's phone or the screen before the reveal (the four choices aside)", song && song.t, allowed, { except: choices }),
      secret('the names the song goes by are on no guesser\'s phone before the reveal', song && (song.alt || [])[0], allowed),
      secret("the singer is on no guesser's phone or the screen before the reveal (the four choices aside)", song && song.s, allowed, { except: choices }),
      secret('the song in English is on no guesser\'s phone before the reveal (the four choices aside)', song && song.en, allowed, { except: choices }),
      probe("the song's ids and its sources' addresses reach no phone and not the screen", open, (view, pid, idx) => {
        const text = JSON.stringify(view);
        return idx.find(song.id) || (song.also ? idx.find(song.also.id) : null) || ['apple.com', 'dzcdn', 'deezer', 'itunes'].find((w) => text.indexOf(w) !== -1) || null;
      }),
      probe("in «دندنة» the round's token is the hummer's alone", open && s.mode === 'hum', (view, pid, idx) => (pid === s.hummerId ? null : idx.find(h.token))),
      // «الظرف التلاتة»: the three sealed envelopes' titles are on the hummer's phone alone.
      ...[0, 1, 2].map((k) => {
        const env = s.envelope && h && h.offer ? HUM.HUM_SONGS[h.offer[k]] : null;
        return secret(`envelope ${k + 1}'s title is on the hummer's phone alone`, env && env.t, allowed);
      }),
      probe('which choice is right, and the picks, stay hidden until the reveal', open && s.phase === 'choices', (view) => {
        const sv = view.shared || {};
        if (typeof sv.correct === 'number') return 'shared.correct';
        if (sv.picks) return 'shared.picks';
        return sv.song ? 'shared.song' : null;
      }),
      probe("a phone's pick and its near misses are its own", open && Object.keys(room.secrets || {}).length > 0, (view, pid) => {
        const y = view.you;
        if (!y) return null;
        if (typeof y.pick === 'number' && h.picks[pid] !== y.pick) return 'you.pick (not its own)';
        if (y.miss && !(room.secrets[pid] && room.secrets[pid].miss)) return 'you.miss (not its own)';
        return null;
      })
    ];
  },
  // الليزر: while hiding, a phone has its own spot and aim only; nobody's spot is on the table
  // (nor who is ready) until the reveal.
  laser(room) {
    const s = room.shared || {};
    const hiding = s.phase === 'hide';
    return [
      probe("a phone's spot is its own, exactly", hiding, (view, pid) => {
        if (pid === SCREEN) return view.you ? 'you' : null;
        const want = room.secrets[pid];
        if (!want) return null;
        const you = view.you || {};
        return you.x === want.x && you.y === want.y && you.a === want.a ? null : 'you';
      }),
      probe('no spot, beam or mine on the table while hiding', hiding, (view) => (['shots', 'hit', 'beams', 'mines', 'out'].find(k => hasKey(view.shared, k)) ? 'shared' : null)),
      // A teammate's spot only to its own team, and only with team sight on (round two, 6 Oct 2026).
      probe("a teammate's spot only to its team, with team sight", hiding && !!s.teams, (view, pid) => {
        const mates = (view.you || {}).mates;
        if (!mates) return null;
        if (!s.opts.sight) return 'you.mates (sight off)';
        const bad = Object.keys(mates).find(id => s.teams[id] !== s.teams[pid] || (s.alive || []).indexOf(id) === -1);
        return bad ? 'you.mates.' + bad : null;
      }),
      // A ghost's mine is its own: nobody else's view carries it.
      probe("a ghost's mine only on its own phone", hiding && Object.keys(room.secrets).some(id => (room.secrets[id] || {}).mine), (view, pid) => {
        const text = JSON.stringify(view);
        const other = Object.keys(room.secrets).find(id => id !== pid && room.secrets[id] && room.secrets[id].mine &&
          text.indexOf('"x":' + room.secrets[id].mine.x + ',"y":' + room.secrets[id].mine.y) !== -1);
        return other ? 'mine of ' + other : null;
      }),
      // A pickup chosen for this round, and a second beam's aim, are secrets until the reveal.
      probe('a pickup used and a second aim are secret while hiding', hiding && Object.keys(room.secrets).some(id => (room.secrets[id] || {}).use), (view, pid) => {
        if (JSON.stringify(view.shared || {}).indexOf('"use":') !== -1) return 'shared use';
        const mates = JSON.stringify((view.you || {}).mates || {});
        return mates.indexOf('"use"') !== -1 || mates.indexOf('"a2"') !== -1 ? 'you.mates' : null;
      }),
      // A raised shield is a secret until the reveal (its own phone, and with sight its teammates).
      probe('a shield is not seen while hiding', hiding, (view, pid) => {
        const text = JSON.stringify(view.shared || {});
        return text.indexOf('"shield":true') !== -1 ? 'shared shield' : null;
      }),
      probe("nobody's spot but your own anywhere in your view", hiding, (view, pid) => {
        const text = JSON.stringify(view.shared || {});
        const other = Object.keys(room.secrets).find(id => id !== pid && room.secrets[id] && (s.alive || []).indexOf(id) !== -1 &&
          text.indexOf('"x":' + room.secrets[id].x + ',"y":' + room.secrets[id].y) !== -1);
        return other ? 'spot of ' + other : null;
      })
    ];
  },

};

/*
 * A duels' tournament (RoomTournament.js): every match is held to its game's
 * own rules, on a view of just that match - its game from shared.games, and
 * the phone's secret only when the secret names that match (you.tm) - so a
 * face or a fleet of one match on a phone of another fails the game's own
 * probe. And a secret always names its match, on a phone seated in it.
 */
const tourProbes = (room, game) => {
  const s = room.shared || {};
  const t = s.tour;
  if (!t) return [];
  const out = [
    probe('tournament: a secret names its match, and is on a phone seated in it', true, (view, pid) => {
      const you = view.you;
      if (!you) return null;
      const m = t.matches.find((x) => x.id === you.tm);
      return !m || (m.seats || m.p).indexOf(pid) === -1 ? 'you.tm' : null;
    })
  ];
  t.matches.forEach((m) => {
    const g = (s.games || {})[m.id];
    if (!g) return;
    const hidden = (room._tourHidden || {})[m.id] || {};
    const small = Object.assign({ players: room.players, screens: room.screens, shared: g, secrets: {} }, hidden);
    (PROBES[game] || (() => []))(small).forEach((pr) => out.push(probe(pr.name, pr.active, (view, pid) => {
      const mine = view.you && view.you.tm === m.id ? view.you : null;
      const part = { shared: (view.shared.games || {})[m.id] || {}, you: mine };
      return pr.check(part, pid, indexView(part));
    })));
  });
  return out;
};

/* --- the table ------------------------------------------------------------------ */

const report = new Map();     // game -> { moves, probes: Map(name -> checked), leaks: Map(name -> sample) }
let failed = 0;

const viewersOf = (room) => room.players.map((p) => p.id).concat((room.screens || []).map((s) => s.id));

const scan = (T, after) => {
  const room = T.room;
  const game = T.game;
  const r = report.get(game);
  r.moves++;
  const views = viewersOf(room).map((pid) => {
    const view = roomView(room, pid, ONLINE);
    return { pid, view, idx: indexView(view) };
  });
  // A night's program (T.dynamic) plays several games: each step is held to the probes of the game on now.
  const probeGame = T.dynamic ? room.game : game;
  const probes = GENERIC(room).concat(T.tourOf ? tourProbes(room, T.tourOf) : (PROBES[probeGame] || (() => []))(room))
    .concat(T.dynamic ? PROGRAM_PROBES(room) : [])
    .concat(MISSION_PROBES(room));
  for (const p of probes) {
    if (!r.probes.has(p.name)) r.probes.set(p.name, 0);
    if (!p.active) continue;
    r.probes.set(p.name, r.probes.get(p.name) + 1);
    for (const { pid, view, idx } of views) {
      const where = p.check(view, pid, idx);
      if (where && !r.leaks.has(p.name)) r.leaks.set(p.name, `${pid === SCREEN ? 'the screen' : pid} after ${after}, at ${where}`);
    }
  }
};

const table = (game, n, opts = {}) => {
  const ids = Array.from({ length: n }, (_, i) => 'p' + (i + 1));
  const room = {
    code: 'LEAK', version: 1, game: null, phase: 'lobby', hostId: opts.screenHost ? SCREEN : ids[0],
    players: ids.map((id, i) => ({ id, name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ' ' + i : '') })),
    screens: [{ id: SCREEN }], shared: {}, secrets: {}
  };
  if (!report.has(game)) report.set(game, { moves: 0, probes: new Map(), leaks: new Map() });
  // opts.tourOf: a tournament of that duel, reported under its own name ('tour:guesswho').
  const T = { room, game, ids, host: room.hostId, tourOf: opts.tourOf || null };
  must(T, T.host, 'chooseGame', { game: opts.tourOf || opts.gameId || game });
  return T;
};

/** A move, applied as room.js applies one. False when the rules refuse it. */
const act = (T, pid, action, payload = {}) => {
  const next = structuredClone(T.room);
  // A pack named by the lobby (a family quiz, «كلماتنا»): room.js loads it for this one move.
  if (payload && payload.pack && T.pack) next._packIn = T.pack;
  try {
    applyRoomAction(next, pid, action, payload);
  } catch (e) {
    T.lastError = e.message;
    return false;
  }
  delete next._packIn;
  T.room = next;
  scan(T, action);
  return true;
};
const must = (T, pid, action, payload) => {
  if (!act(T, pid, action, payload)) throw new Error(`${T.game}: ${action} by ${pid} was refused: ${T.lastError}`);
};

/** Lets the server's clock (and the computer players on it) run until `done`. */
const runClock = (T, done, maxSteps = 4000) => {
  let idle = 0;
  for (let step = 0; step < maxSteps; step++) {
    if (done(T.room)) return true;
    const due = roomDeadline(T.room);
    if (due === null) return done(T.room);
    clock = Math.max(clock + 1, due);
    const next = structuredClone(T.room);
    if (roomTimeout(next, clock)) { T.room = next; scan(T, 'the clock'); idle = 0; }
    else if (++idle > 5) return done(T.room);
    else clock += 1000;
  }
  return done(T.room);
};

const S = (T) => T.room.shared || {};
const seatOf = (T, pid) => T.room.players.find((p) => p.id === pid);

/* --- a whole game of each ----------------------------------------------------------- */

/* الخزنة: the table works the locks - each move from the phone (or screen) holding the lock, right
   or wrong, the answer read from the server's own safe; the candles burn now and then. The first
   safe of a game is always played right, so a game always gets past it. */
const vaultBurn = (T, ms) => {
  clock += ms;
  const due = roomDeadline(T.room);
  if (due === null || due > clock) return;
  const next = structuredClone(T.room);
  if (roomTimeout(next, clock)) { T.room = next; scan(T, 'the clock'); }
};
const vaultPlay = (T, pRight, maxMoves) => {
  for (let guard = 0; guard < maxMoves && S(T).phase !== 'gameover'; guard++) {
    const s = S(T), v = T.room._vault;
    if (s.phase !== 'play') { runClock(T, (r) => r.shared.phase === 'play' || r.shared.phase === 'gameover', 6); continue; }
    const keys = Object.keys(s.sides).filter((k) => !s.sides[k].done);
    if (!keys.length) { runClock(T, (r) => r.shared.phase !== 'play', 4); continue; }
    const key = pick(keys), side = s.sides[key];
    const l = pick(s.locks.filter((x) => !side.open[x.i]));
    const lock = v.safe.locks[l.i];
    const who = side.opener === 'tv' ? SCREEN : Object.keys(side.holders).find((id) => side.holders[id].locks.indexOf(l.i) !== -1);
    const right = s.safeNo === 1 || Math.random() < pRight;
    const pay = { i: l.i, safe: s.safeNo };
    const pr = v.prog[key][l.i];
    if (lock.k === 'wires') {
      const w = right ? lock.sol : lock.look.wires.findIndex((c, x) => x !== lock.sol && pr.cut.indexOf(x) === -1);
      act(T, who, 'cut', Object.assign(pay, { w: w < 0 ? lock.sol : w }));
    } else if (lock.k === 'symbols') {
      const want = lock.sol[pr.pressed.length];
      act(T, who, 'sym', Object.assign(pay, { s: right ? want : (lock.sol.find((x) => x !== want && pr.pressed.indexOf(x) === -1) || want) }));
    } else if (lock.k === 'dial') {
      act(T, who, 'dial', Object.assign(pay, { code: right ? lock.sol : lock.sol.map((d) => (d + 3) % 10) }));
    } else {
      const ans = VAULT.vaultLightAnswer(v.manual.lights, lock.look.seq, side.mistakes);
      act(T, who, 'light', Object.assign(pay, { c: right ? ans[pr.n] : ['r', 'b', 'g', 'y'].find((c) => c !== ans[pr.n]) }));
    }
    if (Math.random() < 0.12) vaultBurn(T, 12000);
  }
};

PROBES['vault:all'] = PROBES['vault:teams'] = PROBES['vault:tv'] = PROBES.vault;

/* «خماسي السهرة» (RoomRace.js): every round held to the race's probes for its own puzzle; the
   line-up is the puzzles' names and nothing else; and between rounds the only puzzle on any
   phone is the one just played - the next is dealt when its round starts. */
const MIX_IDS = ['strands', 'wordwheel', 'connections', 'pinpoint', 'queens', 'tango', 'nonogram', 'mines', 'streak', 'sudoku'];
PROBES['race:mix'] = (room) => {
  const s = room.shared || {};
  const lineup = (s.settings && s.settings.lineup) || s.lineup;
  const h = room._solve || {};
  return PROBES.race(room).concat([
    probe('pentathlon: the line-up is the puzzles\' names, nothing of their content', !!lineup, (view) => {
      const v = view.shared || {};
      const l = (v.settings && v.settings.lineup) || v.lineup;
      return Array.isArray(l) && l.every((id) => MIX_IDS.indexOf(id) !== -1) ? null : 'shared.lineup';
    }),
    probe('pentathlon: between rounds nothing of the next puzzle is dealt', s.phase === 'result' && !!(s.settings || {}).lineup && !!h.secret, (view) => {
      const v = view.shared;
      if (v.solve !== v.settings.lineup[v.round - 1]) return 'shared.solve';
      return JSON.stringify(v.pub) === JSON.stringify(h.secret.pub) ? null : 'shared.pub';
    })
  ]);
};

const DRIVERS = {
  imposter() {
    const T = table('imposter', 5);
    must(T, T.host, 'start', { category: 'حيوانات', spies: 1 });
    must(T, T.host, 'beginDiscussion');
    must(T, T.host, 'startVote');
    const spy = T.room._impSpies[0];
    for (const id of T.ids) must(T, id, 'vote', { option: id === spy ? T.ids.find((x) => x !== spy) : spy });
    const wrong = S(T).options.find((w) => w !== T.room._impSecret);
    must(T, spy, 'guess', { word: wrong });
    must(T, T.host, 'restart');
    // «مين يسأل مين؟» and «أنا الجاسوس» (7 Oct 2026): the pair walked, then the spy owns up and misses.
    must(T, T.host, 'start', { category: 'حيوانات', spies: 1, director: true });
    must(T, T.host, 'beginDiscussion');
    must(T, S(T).dir.askerId, 'dirNext', { turn: S(T).dir.turn });
    const spy2 = T.room._impSpies[0];
    must(T, spy2, 'spyClaim');
    must(T, spy2, 'guess', { word: S(T).options.find((w) => w !== T.room._impSecret) });
    must(T, T.host, 'restart');
    must(T, T.host, 'start', { undercover: true, spies: 1 });
    must(T, T.host, 'beginDiscussion');
    must(T, T.host, 'startVote');
    for (const id of T.ids) act(T, id, 'vote', { option: pick(T.ids.filter((x) => x !== id)) });
    act(T, T.host, 'closeVote');
    return T.room.phase === 'result' || T.room.phase === 'guess';
  },
  justone() {
    const T = table('justone', 4);
    must(T, T.host, 'start', {});
    for (let round = 0; round < 2; round++) {
      if (round) must(T, T.host, 'nextRound', { round });
      const s = S(T);
      const writers = T.ids.filter((id) => id !== s.guesserId);
      must(T, writers[0], 'submitClue', { clue: 'شجرة' });
      must(T, writers[1], 'submitClue', { clue: 'الشجره' });
      must(T, writers[2], 'submitClue', { clue: 'سما' });
      must(T, s.guesserId, 'submitGuess', { guess: 'بحرزز' }); // never the word: an exact guess judges itself (676)
      must(T, T.host, 'judge', { correct: false });
    }
    return S(T).phase === 'result';
  },
  whoami() {
    const T = table('whoami', 4);
    must(T, T.host, 'start', { words: ['أسد', 'قمر', 'بحر', 'نار', 'شمس'] });
    must(T, 'p2', 'gotIt');
    must(T, 'p3', 'gotIt');
    must(T, 'p3', 'notYet');
    must(T, T.host, 'reveal');
    return T.room.phase === 'result';
  },
  codenames() {
    const T = table('codenames', 4);
    must(T, 'p1', 'setTeam', { team: 'red', role: 'spymaster' });
    must(T, 'p2', 'setTeam', { team: 'red', role: 'operative' });
    must(T, 'p3', 'setTeam', { team: 'blue', role: 'spymaster' });
    must(T, 'p4', 'setTeam', { team: 'blue', role: 'operative' });
    must(T, T.host, 'start', { lang: 'ar' });
    for (let turn = 0; turn < 12 && !S(T).winner; turn++) {
      const s = S(T);
      const master = s.turn === 'red' ? 'p1' : 'p3';
      const op = s.turn === 'red' ? 'p2' : 'p4';
      must(T, master, 'giveClue', { word: 'تلميح' + turn, count: 1 });
      const key = T.room._key;
      const mine = key.findIndex((c, i) => c === s.turn && !S(T).board[i].revealed);
      // Right guesses for a few turns, then the assassin, which ends it.
      must(T, op, 'guess', { index: turn < 4 && mine !== -1 ? mine : key.indexOf('assassin') });
      if (!S(T).winner && S(T).turn === s.turn) act(T, op, 'endTurn');
    }
    return !!S(T).winner;
  },
  wouldyou() {
    const T = table('wouldyou', 4);
    must(T, T.host, 'start', { lang: 'ar' });
    for (const id of T.ids) must(T, id, 'vote', { option: pick(['a', 'b']) });
    must(T, T.host, 'nextRound', { lang: 'ar', round: 1 });
    act(T, 'p2', 'vote', { option: 'a' });
    must(T, T.host, 'closeVote');
    return S(T).vote.phase === 'results';
  },
  mostlikely() {
    const T = table('mostlikely', 4);
    must(T, T.host, 'start', { lang: 'ar' });
    for (const id of T.ids) must(T, id, 'vote', { option: pick(T.ids) });
    return S(T).phase === 'results';
  },
  fibbage() {
    const T = table('fibbage', 4);
    must(T, T.host, 'start', { lang: 'ar' });
    T.ids.forEach((id, i) => must(T, id, 'submitLie', { lie: 'كذبة رقم ' + (i + 1) }));
    T.ids.forEach((id, i) => {
      const own = (T.room.secrets[id] || {}).voteOwn;
      // The first is sure with the vote, the second after it (591).
      must(T, id, 'vote', { option: S(T).vote.options.find((o) => o.id !== own).id, round: S(T).round, sure: i === 0 });
      if (i === 1) must(T, id, 'sure', { round: S(T).round });
    });
    return S(T).phase === 'results';
  },
  drawguess() {
    const T = table('drawguess', 4);
    must(T, T.host, 'start', { lang: 'ar', seconds: 30 });
    for (let round = 0; round < 3; round++) {
      if (round) must(T, T.host, 'nextRound', { lang: 'ar', round });
      const s = S(T);
      must(T, s.drawerId, 'addStrokes', { strokes: [{ c: '#111111', w: 4, p: [1, 2, 30, 40] }] });
      const guesser = T.ids.find((id) => id !== s.drawerId);
      must(T, guesser, 'guess', { guess: 'مش هي خالص' });
      // A near miss (565): its spelling must stay on this phone. One that doesn't spell the word inside it.
      const w = T.room._word;
      const near = [w.slice(0, -1) + 'ققق', 'ق' + w.slice(1) + 'ق', w.slice(0, 4) + 'ققققق'].find((c) => c.indexOf(w) === -1 && guessVerdict(c, [w]) === 'close');
      if (near) must(T, guesser, 'guess', { guess: near });
      if (round === 0) must(T, guesser, 'guess', { guess: T.room._word });
      else if (round === 1) must(T, T.host, 'giveUp');
      else runClock(T, (r) => !!r.shared.word);
    }
    return !!S(T).word;
  },
  fakeartist() {
    const T = table('fakeartist', 4);
    must(T, T.host, 'start', { lang: 'ar' });
    for (let k = 0; k < 8 && S(T).phase === 'drawing'; k++) must(T, S(T).currentDrawerId, 'sendStroke', { stroke: { p: [k, 5, k + 30, 60] } });
    const fake = T.room._fakeId;
    for (const id of T.ids) must(T, id, 'vote', { option: id === fake ? T.ids.find((x) => x !== fake) : fake });
    if (S(T).phase === 'guessing') must(T, fake, 'fakeGuess', { guess: 'مش عارف' });
    return S(T).phase === 'results';
  },
  trivia() {
    const T = table('trivia', 4);
    must(T, T.host, 'start', { lang: 'ar', count: 5 });
    for (let q = 0; q < 5; q++) {
      if (q) must(T, T.host, 'nextQuestion');
      if (q === 2) { runClock(T, (r) => r.shared.phase === 'results'); continue; }
      for (const id of T.ids) must(T, id, 'answer', { choice: Math.floor(Math.random() * 4) });
    }
    must(T, T.host, 'nextQuestion');
    return S(T).phase === 'gameover';
  },
  buzzer() {
    const T = table('buzzer', 3);
    must(T, T.host, 'start', {});
    must(T, 'p2', 'buzz');
    must(T, 'p3', 'buzz');
    must(T, T.host, 'correct', { id: 'p2' });
    return true;
  },
  stop() {
    const T = table('stop', 3);
    must(T, T.host, 'start', { lang: 'ar', cats: ['name', 'animal', 'food'], timer: 0, rounds: 2 });
    const L = S(T).letter;
    must(T, 'p1', 'submit', { answers: { name: L + 'ألف', animal: L + 'باء', food: L + 'تاء' } });
    must(T, 'p2', 'submit', { answers: { name: L + 'ثاء', animal: L + 'جيم', food: '' } });
    must(T, 'p3', 'submit', { answers: { name: L + 'حاء', animal: L + 'خاء', food: L + 'دال' } });
    return S(T).phase === 'review';
  },
  chameleon() {
    const T = table('chameleon', 4);
    must(T, T.host, 'start', { lang: 'ar' });
    must(T, T.host, 'startVote');
    const cham = T.room._chamId;
    for (const id of T.ids) must(T, id, 'vote', { option: id === cham ? T.ids.find((x) => x !== cham) : cham });
    const secretIdx = S(T).words.indexOf(T.room._chamSecret);
    if (S(T).phase === 'guess') must(T, cham, 'guess', { index: (secretIdx + 1) % 16 });
    // «الإعادة»: a tie between two innocents, the replay between them only; then a stolen
    // word and «مين فضحها؟» (7 Oct 2026).
    must(T, T.host, 'nextRound', { lang: 'ar' });
    must(T, T.host, 'startVote');
    const ch2 = T.room._chamId;
    const [a, b, c] = T.ids.filter((x) => x !== ch2);
    const first = { [ch2]: a, [a]: b, [b]: a, [c]: b };
    for (const id of T.ids) must(T, id, 'vote', { option: first[id] });
    if (S(T).phase !== 'tiebreak') return false;
    must(T, T.host, 'revote');
    for (const id of T.ids) must(T, id, 'vote', { option: id === a ? b : a });
    must(T, T.host, 'nextRound', { lang: 'ar' });
    must(T, T.host, 'startVote');
    const ch3 = T.room._chamId;
    for (const id of T.ids) must(T, id, 'vote', { option: id === ch3 ? T.ids.find((x) => x !== ch3) : ch3 });
    must(T, ch3, 'guess', { index: T.room._chamSecret });
    must(T, ch3, 'blame', { id: T.ids.find((x) => x !== ch3) });
    return S(T).phase === 'results' && S(T).blamedId;
  },
  spyfall() {
    const T = table('spyfall', 4);
    must(T, T.host, 'start', { lang: 'ar', minutes: 5 });
    must(T, T.host, 'startVote');
    const spy = T.room._spyIds[0];
    for (const id of T.ids) must(T, id, 'vote', { option: id === spy ? T.ids.find((x) => x !== spy) : spy });
    if (S(T).phase === 'guess') must(T, spy, 'spyGuess', { location: S(T).locations.find((l) => l !== T.room._spyLoc) });
    must(T, T.host, 'nextRound', { lang: 'ar' });
    runClock(T, (r) => r.shared.phase !== 'play');
    return S(T).phase !== 'play';
  },
  bomb() {
    const T = table('bomb', 3);
    must(T, T.host, 'start', { lang: 'ar', mode: 'category', fuse: 'short' });
    must(T, S(T).holderId, 'pass');
    return runClock(T, (r) => r.shared.phase === 'boom');
  },
  twotruths() {
    const T = table('twotruths', 3);
    must(T, T.host, 'start', {});
    // The last writer is late (596): the host starts the turns without them, and their sheet
    // comes in while the first storyteller is being voted on.
    T.ids.slice(0, -1).forEach((id) => must(T, id, 'submit', { statements: [id + ' جملة أولى', id + ' جملة تانية', id + ' جملة تالتة'], lie: 1 }));
    must(T, T.host, 'closeWriting');
    const lateId = T.ids[T.ids.length - 1];
    must(T, lateId, 'submit', { statements: [lateId + ' جملة أولى', lateId + ' جملة تانية', lateId + ' جملة تالتة'], lie: 1 });
    for (let guard = 0; guard < 8 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      if (s.phase === 'voting') for (const id of T.ids) if (id !== s.subjectId) act(T, id, 'vote', { option: 'i' + Math.floor(Math.random() * 3) });
      if (S(T).phase === 'result') must(T, T.host, 'next');
    }
    return S(T).phase === 'gameover';
  },
  // The quiz, then a riddle a player writes and the race on the app's (RoomSolve.js).
  emoji: () => DRIVERS.quizGame('emoji') && DRIVERS.solveGame('emoji'),
  wordle: () => DRIVERS.solveGame('wordle'),
  guessnum: () => DRIVERS.solveGame('guessnum'),
  flags: () => DRIVERS.solveGame('flags'),
  /** One sets, everyone solves: both ways, with the clock, the host's close and skip, and right and wrong guesses. */
  solveGame(game) {
    const AR = 'ضصثقفغعهخحجدشسيبلاتنمكطئءؤرذىةوزظ'.split('');
    const EN = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('');
    const codes = SOLVE_LISTS.COUNTRIES.map((c) => c.code);
    const setters = {
      wordle: () => ({ word: pick(['مدرسة', 'ليمون', 'سفينة', 'HOUSE', 'PLANTS', 'طماطم']) }),
      guessnum: (s) => ({ n: 11 + Math.floor(Math.random() * (s.settings.max - 11)) }),
      flags: () => ({ code: pick(codes) }),
      emoji: () => pick([{ answer: 'الفيل الأزرق', clue: '🐘🔵', kind: 'film' }, { answer: 'ملوخية', clue: '🥬🍲', kind: 'dish' }, { answer: 'الأهرامات', clue: '🔺🔺🔺🐫', kind: 'place' }])
    };
    const guesses = {
      wordle: (s) => ({ text: Array.from({ length: s.pub.len }, () => pick(s.pub.alpha === 'en' ? EN : AR)).join('') }),
      guessnum: (s) => ({ n: 1 + Math.floor(Math.random() * s.pub.max) }),
      flags: () => ({ code: pick(codes) }),
      emoji: () => ({ text: pick(['قطة', 'بيت كبير', 'Car', 'شاي بلبن']) })
    };
    const right = { wordle: (x) => ({ text: x.w }), guessnum: (x) => ({ n: x.n }), flags: (x) => ({ code: x.code }), emoji: (x) => ({ text: x.a }) };
    let T = null;
    const play = () => {
      for (let guard = 0; guard < 600 && S(T).phase !== 'gameover'; guard++) {
        const s = S(T);
        if (s.phase === 'setting') {
          if (guard % 9 === 4) { must(T, T.host, 'skipTurn', { round: s.round }); continue; }
          act(T, s.setter, 'setSecret', Object.assign({ round: s.round }, setters[game](s)));
          continue;
        }
        if (s.phase === 'result') { must(T, T.host, 'nextRound', { round: s.round }); continue; }
        if (guard % 13 === 7) { runClock(T, (r) => r.shared.phase !== 'solving', 20); continue; }
        if (guard % 17 === 11) { act(T, T.host, 'closeRound', { round: s.round }); continue; }
        const x = T.room._solve.secret;
        const playing = Object.keys(s.progress).filter((id) => s.progress[id].state === 'play');
        if (!playing.length) break;
        for (const id of playing) act(T, id, 'guess', Object.assign({ round: s.round }, Math.random() < 0.2 ? right[game](x) : guesses[game](s)));
      }
    };
    const opts = { wordle: { len: 6 }, guessnum: { max: 1000 }, flags: { clue: 'flag', level: 'hard' }, emoji: {} }[game];
    const clock = game === 'wordle' ? 90 : 60;
    T = table(game, 4);
    must(T, T.host, 'start', Object.assign({ way: 'setter', mode: 'setter', rounds: 5, lang: 'ar', clock: clock }, opts));
    play();
    if (S(T).phase !== 'gameover') return false;
    must(T, T.host, 'backToHub');
    must(T, T.host, 'chooseGame', { game });
    must(T, T.host, 'start', Object.assign({ way: 'race', mode: 'race', rounds: 3, lang: 'ar', clock: clock }, opts, game === 'flags' ? { clue: 'far' } : {}));
    play();
    return S(T).phase === 'gameover';
  },
  /* --- سباق ألغاز (RoomRace.js): a race of each puzzle, both endings, the clock, «استسلم», leaving ---- */
  /** The race's engine on a game: `solve(T, pid)` plays the solution for a phone, `partly(T, pid)` a move that isn't done, `wrong(T, pid)` a move that fails (or null). */
  raceGame(game, plays, opts = {}) {
    const start = (T, finish) => must(T, T.host, 'start', Object.assign({ finish, rounds: 3, lang: 'ar' }, opts.start || {}));
    // Fast 3 with five: three finish, a fourth inside the grace, the clock closes it; a stale move; a wrong move.
    let T = table(game, 5);
    start(T, 'fast3');
    if (S(T).settings.finish !== 'fast3' || S(T).phase !== 'solving') return false;
    plays.partly(T, 'p1');
    if (plays.wrong) plays.wrong(T, 'p2');
    act(T, 'p1', 'move', Object.assign({ round: 99 }, plays.stale ? plays.stale(T, 'p1') : { cells: [0, 1] }));
    for (const id of ['p1', 'p2', 'p3']) { clock += 3000; plays.solve(T, id); }
    if (!S(T).closeAt) return false;
    clock += 2000; plays.solve(T, 'p4');
    runClock(T, (r) => r.shared.phase !== 'solving', 30);
    if (S(T).phase !== 'result') return false;
    must(T, T.host, 'nextRound', { round: 1 });
    // «استسلم» and the host's close.
    plays.partly(T, 'p1');
    must(T, 'p2', 'giveUp', { round: 2 });
    must(T, T.host, 'closeRound', { round: 2 });
    must(T, T.host, 'nextRound', { round: 2 });
    // The clock ends the last round; play again.
    plays.solve(T, 'p3');
    runClock(T, (r) => r.shared.phase !== 'solving', 30);
    if (S(T).phase !== 'gameover') return false;
    must(T, T.host, 'playAgain', {});
    if (S(T).round !== 1 || S(T).phase !== 'solving') return false;
    // «الكل يخلّص» with four, one leaving mid-round, everyone done ends it.
    must(T, T.host, 'backToHub');
    T = table(game, 4, { gameId: game });
    start(T, 'all');
    plays.partly(T, 'p2');
    plays.solve(T, 'p1');
    T.room.players = T.room.players.filter((p) => p.id !== 'p4');
    roomPlayerLeft(T.room, 'p4', NAMES[3]);
    scan(T, 'leave');
    plays.solve(T, 'p2');
    must(T, 'p3', 'giveUp', { round: 1 });
    if (S(T).phase !== 'result') return false;
    for (let round = 2; round <= 3; round++) {
      must(T, T.host, 'nextRound', { round: round - 1 });
      for (const id of ['p1', 'p2', 'p3']) { clock += 1000; plays.solve(T, id); }
    }
    return S(T).phase === 'gameover';
  },
  // RACE_DRIVERS:wordwheel
  wordwheel() {
    return DRIVERS.raceGame('wordwheel', {
      partly: (T, pid) => act(T, pid, 'move', { word: T.room._solve.secret.words[0], round: S(T).round }),
      solve: (T, pid) => T.room._solve.secret.words.forEach((w) => act(T, pid, 'move', { word: w, round: S(T).round })),
      wrong: (T, pid) => { act(T, pid, 'move', { word: 'ززززز', round: S(T).round }); const b = T.room._solve.secret.bonus[0]; if (b) act(T, pid, 'move', { word: b, round: S(T).round }); },
      stale: (T) => ({ word: T.room._solve.secret.words[1] })
    });
  },
  // RACE_DRIVERS:connections
  connections() {
    return DRIVERS.raceGame('connections', {
      partly: (T, pid) => act(T, pid, 'move', { words: T.room._solve.secret.groups[0].words, round: S(T).round }),
      solve: (T, pid) => T.room._solve.secret.groups.forEach((g) => act(T, pid, 'move', { words: g.words, round: S(T).round })),
      wrong: (T, pid) => { const g = T.room._solve.secret.groups; act(T, pid, 'move', { words: [g[0].words[0], g[1].words[0], g[2].words[0], g[3].words[0]], round: S(T).round }); act(T, pid, 'move', { words: g[1].words.slice(0, 3).concat([g[2].words[1]]), round: S(T).round }); },
      stale: (T) => ({ words: T.room._solve.secret.groups[1].words })
    });
  },
  // RACE_DRIVERS:pinpoint
  pinpoint() {
    const pickFor = (T, pid, right) => { const b = T.room._solve.boards[pid]; const r = T.room._solve.secret.rounds[b.cur]; return { k: b.cur, i: right ? r.answer : (r.answer + 1) % 6, round: S(T).round }; };
    return DRIVERS.raceGame('pinpoint', {
      partly: (T, pid) => act(T, pid, 'move', pickFor(T, pid, true)),
      solve: (T, pid) => { for (let k = 0; k < 5; k++) { const b = T.room._solve.boards[pid]; if (!b || b.cur >= 5) break; act(T, pid, 'move', pickFor(T, pid, true)); } },
      wrong: (T, pid) => act(T, pid, 'move', pickFor(T, pid, false)),
      stale: (T) => ({ k: 0, i: 0 })
    });
  },
  // RACE_DRIVERS:tango
  tango() {
    const sol = (T) => T.room._solve.secret.solution;
    return DRIVERS.raceGame('tango', {
      partly: (T, pid) => act(T, pid, 'move', { cells: S(T).pub.givens.map((v, i) => v || (i < 12 ? sol(T)[i] : 0)), round: S(T).round }),
      solve: (T, pid) => act(T, pid, 'move', { cells: sol(T).slice(), round: S(T).round }),
      wrong: (T, pid) => act(T, pid, 'move', { cells: [1, 2, 3], round: S(T).round }),
      stale: (T) => ({ cells: sol(T).slice() })
    });
  },
  // RACE_DRIVERS:nonogram
  nonogram() {
    const sol = (T) => T.room._solve.secret.solution;
    return DRIVERS.raceGame('nonogram', {
      partly: (T, pid) => act(T, pid, 'move', { cells: sol(T).map((v, i) => (i < 16 ? v : 0)), round: S(T).round }),
      solve: (T, pid) => act(T, pid, 'move', { cells: sol(T).slice(), round: S(T).round }),
      wrong: (T, pid) => act(T, pid, 'move', { cells: [1], round: S(T).round }),
      stale: (T) => ({ cells: sol(T).slice() })
    });
  },
  // RACE_DRIVERS:mines
  mines() {
    const safe = (T) => { const x = T.room._solve.secret; const m = new Set(x.mines); return Array.from({ length: x.pub.cols * x.pub.rows }, (_, i) => i).filter((i) => !m.has(i)); };
    return DRIVERS.raceGame('mines', {
      partly: (T, pid) => { const b = T.room._solve.boards[pid]; const open = new Set(b.open.map((o) => o.i)); const c = safe(T).find((i) => !open.has(i)); if (c !== undefined) act(T, pid, 'move', { cells: [c], round: S(T).round }); },
      solve: (T, pid) => { const cells = safe(T); for (let k = 0; k < cells.length; k += 6) { const b = T.room._solve.boards[pid]; if (!b || b.boom >= 0 || T.room.shared.progress[pid].state !== 'play') break; act(T, pid, 'move', { cells: cells.slice(k, k + 6), round: S(T).round }); } },
      // A mine puts the fifth phone out with 0 (the round goes on for the others; the three finishers still close Fast 3).
      wrong: (T) => act(T, T.ids[4] || T.ids[T.ids.length - 1], 'move', { cells: [T.room._solve.secret.mines[0]], round: S(T).round }),
      stale: (T) => ({ cells: [safe(T)[0]] })
    });
  },
  // RACE_DRIVERS:streak
  streak() {
    const qs = (T) => T.room._solve.secret.qs;
    return DRIVERS.raceGame('streak', {
      partly: (T, pid) => { const b = T.room._solve.boards[pid]; act(T, pid, 'move', { q: b.asked, i: qs(T)[b.asked].answer, round: S(T).round }); },
      solve: (T, pid) => { for (let k = 0; k < 10; k++) { const b = T.room._solve.boards[pid]; if (!b || b.asked >= 10) break; act(T, pid, 'move', { q: b.asked, i: k % 3 === 2 ? (qs(T)[b.asked].answer + 1) % 4 : qs(T)[b.asked].answer, round: S(T).round }); } },
      wrong: (T, pid) => { const b = T.room._solve.boards[pid]; act(T, pid, 'move', { q: b.asked, i: (qs(T)[b.asked].answer + 1) % 4, round: S(T).round }); },
      stale: (T) => ({ q: 0, i: 0 })
    });
  },
  // RACE_DRIVERS:sudoku
  sudoku() {
    const sol = (T) => T.room._solve.secret.solution;
    return DRIVERS.raceGame('sudoku', {
      partly: (T, pid) => act(T, pid, 'move', { cells: Array.from(S(T).pub.puzzle).map((ch, i) => (ch !== '0' ? ch : (i < 30 ? sol(T)[i] : '0'))).join(''), round: S(T).round }),
      solve: (T, pid) => act(T, pid, 'move', { cells: sol(T), round: S(T).round }),
      wrong: (T, pid) => act(T, pid, 'move', { cells: '12', round: S(T).round }),
      stale: (T) => ({ cells: sol(T) })
    });
  },
  queens() {
    const marks = (T, rows) => { const x = T.room._solve.secret; const n = S(T).pub.n; const m = new Array(n * n).fill(0); rows.forEach((r) => { m[r * n + x.solution[r]] = 2; }); return m; };
    return DRIVERS.raceGame('queens', {
      partly: (T, pid) => act(T, pid, 'move', { marks: marks(T, [0, 1]), round: S(T).round }),
      solve: (T, pid) => act(T, pid, 'move', { marks: marks(T, [0, 1, 2, 3, 4, 5, 6]), round: S(T).round }),
      wrong: (T, pid) => act(T, pid, 'move', { marks: [1], round: S(T).round }),
      stale: (T) => ({ marks: marks(T, [0]) })
    });
  },
  // RACE_DRIVERS:strands
  strands() {
    return DRIVERS.raceGame('strands', {
      partly: (T, pid) => act(T, pid, 'move', { cells: T.room._solve.secret.words[0].cells, round: S(T).round }),
      solve: (T, pid) => T.room._solve.secret.words.forEach((w) => act(T, pid, 'move', { cells: w.cells.slice().reverse(), round: S(T).round })),
      wrong: (T, pid) => act(T, pid, 'move', { cells: [0, 1, 2], round: S(T).round }),
      stale: (T) => ({ cells: T.room._solve.secret.words[1].cells })
    });
  },
  // RACE_DRIVERS:wordwheel
  // RACE_DRIVERS:connections
  // RACE_DRIVERS:pinpoint
  // RACE_DRIVERS:tango
  // RACE_DRIVERS:nonogram
  // RACE_DRIVERS:mines
  // RACE_DRIVERS:streak
  // RACE_DRIVERS:sudoku
  proverbs: () => DRIVERS.quizGame('proverbs'),
  quizGame(game) {
    const T = table(game, 3);
    must(T, T.host, 'start', { lang: 'ar', count: 5 });
    for (let q = 0; q < 5; q++) {
      if (q) must(T, T.host, 'nextQuestion');
      must(T, 'p2', 'guess', { text: 'غلط تماما' });
      // A near miss: the answer and one more letter (close, never right, for a word of 3+).
      if (q === 0) must(T, 'p3', 'guess', { text: T.room._card.a + 'كك' });
      if (q === 1) must(T, 'p3', 'guess', { text: T.room._card.a });
      // The choices come down by the clock (كمّل المثل), and one is picked.
      if (q === 2 && S(T).choicesAt) {
        runClock(T, (r) => Array.isArray(r.shared.choices));
        must(T, 'p3', 'pick', { i: 0, qIndex: S(T).qIndex });
      }
      if (q === 3) runClock(T, (r) => r.shared.phase === 'results');
      else act(T, T.host, 'closeQuestion');
    }
    must(T, T.host, 'nextQuestion');
    return S(T).phase === 'gameover';
  },
  fiveseconds() {
    const T = table('fiveseconds', 3);
    must(T, T.host, 'start', { lang: 'ar', rounds: 1 });
    for (let turn = 0; turn < 3; turn++) {
      must(T, S(T).turnId, 'go', {});
      runClock(T, (r) => r.shared.phase === 'judging');
      must(T, T.host, 'judge', { ok: turn % 2 === 0 });
    }
    return true;
  },
  telephone() {
    const T = table('telephone', 4);
    must(T, T.host, 'start', { lang: 'ar' });
    for (let guard = 0; guard < 6 && S(T).phase === 'working'; guard++) {
      for (const id of T.ids) {
        const task = (T.room.secrets[id] || {}).task;
        if (!task) continue;
        act(T, id, 'submit', task.kind === 'draw' ? { strokes: [{ c: '#111111', w: 4, p: [1, 1, 50, 50] }], step: S(T).step } : { text: 'وصف ' + id + ' ' + guard, step: S(T).step });
      }
    }
    for (let i = 0; i < 30 && S(T).phase === 'reveal'; i++) must(T, T.host, 'revealNext');
    return S(T).phase === 'done';
  },
  monkey() {
    const T = table('monkey', 3);
    must(T, T.host, 'start', { lang: 'ar', mode: 'letters', category: 'countries', timer: 0, winners: 1, autoPenalty: true });
    for (const ch of ['م', 'ص', 'ر', 'ذ']) must(T, S(T).turnId, 'letter', { ch });
    act(T, T.ids.find((id) => id !== S(T).turnId), 'liar', {});
    return true;
  },
  herd() {
    const T = table('herd', 4);
    must(T, T.host, 'start', { lang: 'ar', target: 5 });
    ['قطة', 'القطه', 'كلب', 'أسد'].forEach((text, i) => must(T, T.ids[i], 'submit', { text }));
    must(T, T.host, 'score');
    return S(T).phase === 'result';
  },
  mafia() {
    const T = table('mafia', 7);
    must(T, T.host, 'start', { mode: 'roles', revealRoles: false, discuss: 2, night: 30 });
    for (let guard = 0; guard < 40 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      const roles = T.room._mafia.roles;
      const alive = s.alive || T.ids;
      if (s.phase === 'roles' || s.phase === 'dayResult') { must(T, T.host, 'startNight'); continue; }
      if (s.phase === 'night') {
        for (const id of alive) {
          const role = roles[id];
          const choices = alive.filter((x) => x !== id && (role !== 'mafia' || roles[x] !== 'mafia') && (role !== 'doctor' || x !== T.room._mafia.lastSave));
          if (choices.length) act(T, id, 'nightPick', { target: pick(choices) });
        }
        if (S(T).phase === 'night') runClock(T, (r) => r.shared.phase !== 'night');
        continue;
      }
      if (s.phase === 'day') { must(T, T.host, 'startVote'); continue; }
      if (s.phase === 'voting') {
        const mafiaLeft = alive.filter((x) => roles[x] === 'mafia');
        for (const id of alive) act(T, id, 'vote', { option: pick(mafiaLeft.filter((x) => x !== id).concat(['nobody'])) });
        act(T, T.host, 'closeVote');
        continue;
      }
      break;
    }
    return S(T).phase === 'gameover';
  },
  mind() {
    const T = table('mind', 3);
    must(T, T.host, 'start', {});
    for (let guard = 0; guard < 60 && S(T).phase !== 'gameover' && S(T).phase !== 'won'; guard++) {
      const s = S(T);
      if (s.phase === 'levelDone') { must(T, T.host, 'nextLevel'); continue; }
      if (s.phase !== 'play') break;
      const holding = T.ids.filter((id) => ((T.room.secrets[id] || {}).cards || []).length);
      if (!holding.length) break;
      // In order most of the time; now and then out of order, which turns cards face up.
      const sorted = holding.slice().sort((a, b) => T.room.secrets[a].cards[0] - T.room.secrets[b].cards[0]);
      must(T, Math.random() < 0.8 ? sorted[0] : sorted[sorted.length - 1], 'play');
    }
    return true;
  },
  timeline() {
    const T = table('timeline', 4);
    must(T, T.host, 'start', { lang: 'ar' });
    for (let guard = 0; guard < 80 && S(T).phase === 'play'; guard++) {
      const s = S(T);
      const hand = (T.room.secrets[s.turnId] || {}).cards || [];
      if (!hand.length) { must(T, T.host, 'skipTurn'); continue; }
      must(T, s.turnId, 'place', { card: hand[0].id, at: Math.floor(Math.random() * (s.timeline.length + 1)) });
    }
    return S(T).phase === 'gameover';
  },
  screw() {
    const T = table('screw', 4);
    must(T, T.host, 'start', { edition: 'general', rounds: 3, screwFromLap: 1, turnClock: 0, memorizeSecs: 0, basraCount: 4 });
    for (let guard = 0; guard < 3000 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      const seq = s.turnSeq;
      const slotOf = (id) => ((s.hands || {})[id] || [])[0];
      if (s.phase === 'memorize') { for (const id of s.order) if (s.ready.indexOf(id) === -1) act(T, id, 'ready', {}); continue; }
      if (s.phase === 'thiefGuess') { for (const id of s.order) act(T, id, 'thiefVote', { pid: pick(s.order) }); act(T, T.host, 'closeThiefVote'); continue; }
      if (s.phase === 'reveal') { must(T, T.host, 'nextRound'); continue; }
      if (s.phase !== 'play') break;
      const t = s.turn || {};
      const me = t.pid;
      let ok = false;
      if (t.stage === 'boom') { for (const id of (s.boom || {}).waiting || []) { const e = slotOf(id); if (e) act(T, id, 'boomPick', { slot: e.id }); } ok = true; }
      else if (t.stage === 'choose') {
        if (s.lap >= s.settings.screwFromLap && !s.caller && !s.lastLap && Math.random() < 0.12) ok = act(T, me, 'screw', { seq });
        if (!ok) ok = act(T, me, 'draw', { seq }) || act(T, me, 'pass', { seq });
      } else if (t.stage === 'drawn') {
        const e = slotOf(me);
        ok = (Math.random() < 0.5 && act(T, me, 'discard', { seq })) || (e && act(T, me, 'keep', { slot: e.id, seq })) || act(T, me, 'discard', { seq });
      } else if (t.stage === 'power') ok = act(T, me, 'skipPower', { seq });
      else if (t.stage === 'seeSwap') ok = act(T, me, 'seeSwapDo', { seq });
      else if (t.stage === 'khoshaf') ok = act(T, me, 'khoshafPick', { index: 0, seq });
      else if (t.stage === 'steal') { const e = slotOf(me); ok = !!e && act(T, me, 'stealSwap', { slot: e.id, seq }); }
      if (!ok) act(T, T.host, 'skipTurn', {});
    }
    return S(T).phase === 'gameover';
  },
  doubt: () => DRIVERS.withBots('doubt', 3, { turnClock: 30, end: 'places' }),
  oldmaid() {
    const T = table('oldmaid', 4);
    const play = () => {
      for (let guard = 0; guard < 600 && S(T).phase === 'play'; guard++) {
        const s = S(T);
        const from = s.turn.from;
        const hand = (T.room.secrets[from] || {}).hand || [];
        if (s.settings.mode === 'drag' && hand.length > 1 && Math.random() < 0.3) act(T, from, 'move', { card: pick(hand).i, to: Math.floor(Math.random() * hand.length) });
        if (guard % 9 === 4) { runClock(T, (r) => r.shared.turnSeq !== s.turnSeq || r.shared.phase !== 'play'); continue; }
        must(T, s.turn.pid, 'lift', { pos: Math.floor(Math.random() * s.counts[from]), seq: s.turnSeq });
        must(T, S(T).turn.pid, 'take', { seq: S(T).turnSeq });
      }
    };
    must(T, T.host, 'start', { turnClock: 15 });
    play();
    must(T, T.host, 'playAgain', { mode: 'shuffle' });
    play();
    return S(T).phase === 'gameover' && !!S(T).loser;
  },
  // The four with computer players: one person, bots for the rest, the turn clock for the person.
  // One person and three computer players, 13 rounds, the clock playing for the person.
  estimation: () => DRIVERS.withBots('estimation', 3, { turnClock: 30, rounds: 13 }),
  // A game each for themselves, then «أونو اتنين اتنين»: the person and five computer players in
  // three pairs, the partners never seeing each other's cards (2 Oct 2026).
  uno() {
    const solo = DRIVERS.withBots('uno', 3, { turnClock: 30 });
    const T = table('uno', 1);
    for (let i = 0; i < 5; i++) must(T, T.host, 'addBot', { level: i % 2 ? 'hard' : 'easy', name: 'زيزو' });
    must(T, T.host, 'teams', { on: true });
    must(T, T.host, 'team', { team: 2 });
    must(T, T.host, 'start', { turnClock: 30, length: 'rounds', rounds: 3 });
    for (let round = 0; round < 5; round++) {
      runClock(T, (r) => r.shared.phase === 'gameover' || r.shared.phase === 'roundOver', 4000);
      if (S(T).phase !== 'roundOver') break;
      must(T, T.host, 'nextRound', { round: S(T).round });
    }
    // A long round of six can outlast the steps: what matters is that the pairs were played, every move checked.
    return solo && Array.isArray(S(T).teams) && S(T).teams.length === 3 && (S(T).round > 1 || S(T).phase !== 'lobby');
  },
  domino: () => DRIVERS.withBots('domino', 3, { turnClock: 30 }),
  ludo: () => DRIVERS.withBots('ludo', 3, { turnClock: 15 }),
  // The third round (2 Oct 2026): teams of 2, a themed map, the surprise squares and the moving map, on the clock.
  snakes() {
    const T = table('snakes', 1);
    for (let i = 0; i < 3; i++) must(T, T.host, 'addBot', { level: 'easy', name: 'زيزو' });
    must(T, T.host, 'teamMode', { size: 2 });
    must(T, T.host, 'start', { turnClock: 15, theme: 'desert', surprises: true, moving: true });
    runClock(T, (r) => r.shared.phase === 'gameover', 12000);
    return S(T).phase === 'gameover' && Array.isArray(S(T).teams) && S(T).theme === 'desert';
  },
  bank: () => DRIVERS.withBots('bank', 2, { length: 30, turnClock: 60 }, 2500),
  withBots(game, bots, options, steps) {
    const T = table(game, 1);
    for (let i = 0; i < bots; i++) must(T, T.host, 'addBot', { level: i % 2 ? 'hard' : 'easy', name: 'زيزو' });
    must(T, T.host, 'start', options);
    const over = (r) => r.shared.phase === 'gameover' || r.shared.phase === 'over';
    // A game of rounds (domino, uno's rounds) waits between them for the host's
    // "next round", which no clock presses: press it, as a host would.
    for (let round = 0; round < 30; round++) {
      runClock(T, (r) => over(r) || r.shared.phase === 'roundOver', steps || 4000);
      if (S(T).phase !== 'roundOver') break;
      must(T, T.host, 'nextRound', { round: S(T).round });
    }
    return report.get(game).moves > 20;
  },
  connect4() {
    const T = table('connect4', 3);
    must(T, T.host, 'start', { mode: 4 });
    for (let guard = 0; guard < 60 && S(T).phase === 'play'; guard++) {
      const s = S(T);
      const cols = Array.from({ length: s.cols || 7 }, (_, c) => c).sort(() => Math.random() - 0.5);
      for (const col of cols) if (act(T, s.seats[s.turn], 'move', { col, move: s.moves })) break;
    }
    if (S(T).phase !== 'over') return false;
    // Team against team (2 Oct 2026): sides picked in the lobby, a relay, and half the discs dropped by the clock.
    const R = table('connect4', 5);
    must(R, R.host, 'teams', { on: true });
    must(R, R.ids[0], 'side', { side: 0 });
    must(R, R.ids[1], 'side', { side: 1 });
    must(R, R.ids[2], 'side', { side: 1 });
    must(R, R.host, 'start', { mode: 4 });
    for (let guard = 0; guard < 80 && S(R).phase === 'play'; guard++) {
      const s = S(R);
      if (guard % 2) { runClock(R, (r) => r.shared.moves > s.moves || r.shared.phase !== 'play', 3); continue; }
      const cols = Array.from({ length: s.cols || 7 }, (_, c) => c).sort(() => Math.random() - 0.5);
      for (const col of cols) if (act(R, s.upId, 'move', { col, move: s.moves })) break;
    }
    return S(R).phase === 'over';
  },
  battleship() {
    const T = table('battleship', 3);
    const play = () => {
      for (let guard = 0; guard < 400 && (S(T).phase === 'play' || S(T).phase === 'place'); guard++) {
        const s = S(T);
        if (s.phase === 'place') {
          s.seats.forEach((id, k) => { if (!s.ready[k]) must(T, id, 'place', { fleet: T.room.secrets[id].fleet }); });
          continue;
        }
        // «الرادار»: each sweeps once, somewhere along the way.
        if (s.settings.radar && !(s.radar || [])[s.turn] && Math.random() < 0.15) { must(T, s.seats[s.turn], 'radar', { cell: Math.floor(Math.random() * 100), seq: s.turnSeq }); continue; }
        const open = s.seas[1 - s.turn].grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
        must(T, s.seats[s.turn], 'fire', { cell: pick(open), seq: s.turnSeq });
      }
    };
    must(T, T.host, 'start', {});
    play();
    must(T, T.host, 'nextRound', { round: S(T).round });
    play();
    must(T, T.host, 'backToHub');
    must(T, T.host, 'chooseGame', { game: 'battleship' });
    // A clock this time: placing runs out, and every shot is the phone's.
    must(T, T.host, 'start', { turnClock: 15 });
    runClock(T, (r) => r.shared.phase === 'over', 400);
    return S(T).phase === 'over';
  },
  guesswho() {
    const T = table('guesswho', 3);
    const up = (s, seat) => s.faces.map((_, i) => i).filter((i) => s.down[seat].indexOf(i) === -1);
    const play = () => {
      for (let guard = 0; guard < 200 && (S(T).phase === 'play' || S(T).phase === 'pick'); guard++) {
        const s = S(T);
        if (s.phase === 'pick') { s.seats.forEach((id, k) => { if (!s.picked[k]) act(T, id, 'pick', { face: pick(s.faces.map((_, i) => i)) }); }); continue; }
        const me = s.seats[s.turn], other = s.seats[1 - s.turn], seq = s.turnSeq;
        // Every question is out loud or typed, and any answer is taken as given.
        if (s.stage === 'answer') { must(T, other, 'answer', { yes: Math.random() < 0.5, seq }); continue; }
        if (s.stage === 'flip') { act(T, me, 'flip', { face: pick(up(s, s.turn)), down: true }); must(T, me, 'done', { seq: S(T).turnSeq }); continue; }
        // A random flip by hand can put down the face being looked for: late on, guess any face not guessed yet.
        const tried = s.log.filter((e) => e.kind === 'guess' && e.seat === s.turn).map((e) => e.face);
        const fresh = s.faces.map((_, i) => i).filter((i) => tried.indexOf(i) === -1);
        const left = up(s, s.turn).filter((i) => tried.indexOf(i) === -1);
        if (left.length <= 2 || guard > 40) { must(T, me, 'guess', { face: pick(left.length && guard <= 60 ? left : fresh), seq }); continue; }
        if (Math.random() < 0.5) { must(T, me, 'loud', { seq }); continue; }
        must(T, me, 'typed', { text: pick(['لابسة طرحة؟', 'Is she smiling?', 'لابس حاجة زرقا؟']), seq });
      }
    };
    must(T, T.host, 'start', {});
    play();
    must(T, T.host, 'nextRound', { round: S(T).round });
    play();
    must(T, T.host, 'backToHub');
    must(T, T.host, 'chooseGame', { game: 'guesswho' });
    must(T, T.host, 'start', { pick: 'choose', wrong: 'turn', size: 16 });
    play();
    if (S(T).phase !== 'over') return false;

    // «فريق ضد فريق»: five people, sides picked on the phones, one board and one face a team, the
    // final guess proposed by one and agreed by another (now and then cancelled, or left to lapse).
    const U = table('guesswho', 5);
    must(U, U.host, 'gwTeams', { on: true });
    U.ids.forEach((id, i) => { if (i < 4) must(U, id, 'side', { side: i % 2 }); });
    const playTeams = () => {
      for (let guard = 0; guard < 300 && S(U).phase === 'play'; guard++) {
        const s = S(U);
        const mine = s.teams[s.turn], theirs = s.teams[1 - s.turn], seq = s.turnSeq;
        if (s.stage === 'answer') { must(U, pick(theirs), 'answer', { yes: Math.random() < 0.5, seq }); continue; }
        if (s.stage === 'flip') { act(U, pick(mine), 'flip', { face: pick(up(s, s.turn)), down: true }); must(U, pick(mine), 'done', { seq: S(U).turnSeq }); continue; }
        if (s.propose) {
          const r = Math.random();
          if (r < 0.15) { must(U, s.propose.by, 'unpropose', { n: s.propose.n }); continue; }
          if (r < 0.25) { runClock(U, (x) => !x.shared.propose, 30); continue; }
          must(U, pick(mine.filter((id) => id !== s.propose.by)), 'agree', { n: s.propose.n, seq });
          continue;
        }
        const left = up(s, s.turn);
        if (left.length <= 3 || guard > 40 || Math.random() < 0.2) { must(U, pick(mine), 'propose', { face: pick(left.length ? left : s.faces.map((_, i) => i)), seq }); continue; }
        if (Math.random() < 0.5) { must(U, pick(mine), 'loud', { seq }); continue; }
        must(U, pick(mine), 'typed', { text: pick(['لابسة طرحة؟', 'Is she smiling?']), seq });
      }
    };
    must(U, U.host, 'start', { wrong: 'turn', size: 16 });
    playTeams();
    must(U, U.ids[1], 'side', { side: 0 });
    must(U, U.host, 'nextRound', { round: S(U).round });
    playTeams();
    return S(U).phase === 'over';
  },
  hangman() {
    let T = table('hangman', 3);
    const AR = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');
    // A guess, now and then a lifeline (once a word each, refused after) or a whole word.
    // The first two moves are the lifelines, so their probe always has its case.
    let moves = 0;
    const move = (id, s) => {
      const r = moves < 2 ? moves * 0.1 : Math.random();
      moves++;
      if (r < 0.06) act(T, id, 'reveal', { round: s.round });
      else if (r < 0.12) act(T, id, 'remove', { round: s.round });
      else if (r < 0.18) act(T, id, 'whole', { text: pick(['موز', 'مدرسه', 'برتقال']), round: s.round });
      else act(T, id, 'guess', { letter: pick(AR), round: s.round });
    };
    // The writer gives one hint, three, or none (the 2nd and 3rd open on a board's misses).
    // In turn, three first, so the probe of the hints always has its case (never left to chance).
    let hintTurn = 0;
    const hints = () => [['حاجة', 'بنشوفها كتير', 'في كل حتة'], [], ['مكان']][hintTurn++ % 3];
    const play = () => {
      for (let guard = 0; guard < 600 && S(T).phase !== 'gameover'; guard++) {
        const s = S(T);
        if (s.phase === 'writing') { must(T, s.setter, 'setWord', { word: pick(['مدرسة', 'برتقال', 'قطة', 'زرافة']), hints: hints(), round: s.round }); continue; }
        if (s.phase === 'result') { must(T, T.host, 'nextRound', { round: s.round }); continue; }
        if (s.settings.mode === 'teams') {
          if (!s.tb || s.tb.state !== 'play') break;
          move(s.captain, s);
          continue;
        }
        const playing = Object.keys(s.progress).filter((id) => s.progress[id].state === 'play');
        if (!playing.length) break;
        for (const id of playing) move(id, s);
      }
    };
    must(T, T.host, 'start', { rounds: 3, level: 'easy' });
    play();
    must(T, T.host, 'backToHub');
    must(T, T.host, 'chooseGame', { game: 'hangman' });
    must(T, T.host, 'start', { mode: 'race', rounds: 3, lang: 'ar', clock: 60, level: 'hard', cat: 'food' });
    play();
    if (S(T).phase !== 'gameover') return false;
    // Team against team: four players, the host's split, a captain tapping for each team (play() reads T).
    T = table('hangman', 4);
    must(T, T.host, 'sides', {});
    must(T, T.host, 'start', { mode: 'teams', rounds: 4 });
    play();
    return S(T).phase === 'gameover';
  },
  minigolf() {
    // Every putt is on the table, so only the generic rules apply; played both ways, the clock finishing what the players don't.
    const T = table('minigolf', 3);
    const play = () => {
      for (let guard = 0; guard < 600 && S(T).phase !== 'gameover'; guard++) {
        const s = S(T);
        if (s.phase === 'between') { runClock(T, (r) => r.shared.phase !== 'between'); continue; }
        const up = s.settings.mode === 'turns' ? [s.turn] : s.order.filter((id) => s.balls[id] && !s.balls[id].done);
        if (!up.length || !up[0]) break;
        const id = pick(up);
        if (Math.random() < 0.6) {
          act(T, id, 'putt', { dx: Math.round(Math.random() * 2000 - 1000), dy: Math.round(Math.random() * 1000), power: 40 + Math.floor(Math.random() * 500), t0: clock - s.startedAt, hole: s.hole, n: s.balls[id].n });
        } else {
          const seq = s.shotSeq;
          runClock(T, (r) => r.shared.shotSeq !== seq || r.shared.phase !== 'play', 20);
        }
        clock += 500;
      }
    };
    must(T, T.host, 'start', { holes: 3, clock: 20 });
    play();
    must(T, T.host, 'backToHub');
    must(T, T.host, 'chooseGame', { game: 'minigolf' });
    must(T, T.host, 'start', { mode: 'turns', holes: 9, clock: 20, guide: true, level: 'hard' });
    play();
    return S(T).phase === 'gameover';
  },
  bowling() {
    // Nothing is hidden; the driver plays a whole game: thrown balls, the clock's ball and the host's.
    const T = table('bowling', 3);
    must(T, T.host, 'start', { frames: 5, clock: 20 });
    for (let guard = 0; guard < 80 && S(T).phase === 'play'; guard++) {
      const s = S(T);
      if (guard % 7 === 3) { runClock(T, (r) => r.shared.throwSeq > s.throwSeq, 4); continue; }
      if (guard % 11 === 5) { must(T, T.host, 'skipTurn', { seq: s.turnSeq }); continue; }
      must(T, s.turn.pid, 'throw', { x: Math.round(Math.random() * 40 - 20), aim: Math.round(Math.random() * 30 - 15), speed: 500 + Math.round(Math.random() * 400), spin: Math.round(Math.random() * 120 - 60), seq: s.turnSeq });
    }
    return S(T).phase === 'gameover';
  },
  bumper() {
    // Three drivers and the screen: a round the TV reports, one the host ends early, one nobody reports.
    const T = table('bumper', 3);
    must(T, T.host, 'start', { mode: 'points', secs: 60 });
    clock += 64000;
    must(T, SCREEN, 'finish', { round: S(T).round, scores: { p1: { score: 4, taken: 1 }, p2: { score: 2, taken: 3 } } });
    must(T, T.host, 'playAgain', {});
    must(T, T.host, 'endNow', {});
    must(T, SCREEN, 'finish', { round: S(T).round, scores: { p3: { score: 1, taken: 0 } } });
    must(T, T.host, 'playAgain', { mode: 'balloons' });
    must(T, SCREEN, 'finish', { round: S(T).round, done: true, scores: { p1: { place: 1, lives: 2 } } });
    must(T, T.host, 'playAgain', { mode: 'ring', ringWin: 'clock' });
    clock += 200000;
    runClock(T, (r) => r.shared.phase === 'over', 3);
    // «كورة التصادم»: sides picked between matches, goals from the screen, a golden goal.
    must(T, 'p2', 'side', { side: 'blue' });
    must(T, T.host, 'playAgain', { mode: 'ball', ballSecs: 120 });
    clock = S(T).startAt + 1000;
    must(T, SCREEN, 'goal', { round: S(T).round, n: 1, side: 'blue', by: 'p2' });
    must(T, SCREEN, 'goal', { round: S(T).round, n: 2, side: 'red', by: 'p1' });
    clock = S(T).endsAt + 1500;
    runClock(T, (r) => r.shared.golden, 3);
    must(T, SCREEN, 'goal', { round: S(T).round, n: 3, side: 'red', by: 'p3' });
    return S(T).phase === 'over' && S(T).round === 5 && S(T).winner === 'red';
  },
  skull() {
    // Three people and two computer players: every person lays, adds, bets, passes, answers
    // «هيعملها؟», flips and chooses a disc to lose by hand; the bots and the clock do the rest.
    // A skull taking a disc and a pile half turned over don't come up in every game, so it
    // plays again until both have (a check can't pass, or fail, by chance).
    const T = table('skull', 3);
    must(T, T.host, 'addBot', { level: 'easy', name: 'زيزو' });
    must(T, T.host, 'addBot', { level: 'hard', name: 'بندق' });
    must(T, T.host, 'start', { turnClock: 30 });
    const seen = { lost: false, midFlip: false, guess: false };
    const people = T.ids;
    for (let guard = 0; guard < 4000; guard++) {
      const r = T.room;
      const s = S(T);
      const g = r._skull;
      if (Object.keys(g.lost).some((id) => g.lost[id].length)) seen.lost = true;
      if (s.phase === 'flip' && (s.flipped || []).length) seen.midFlip = true;
      if (s.phase === 'gameover') {
        if (seen.lost && seen.midFlip && seen.guess) break;
        must(T, T.host, 'playAgain', {});
        continue;
      }
      const up = s.turn && s.turn.pid;
      const person = (id) => people.indexOf(id) !== -1;
      let moved = false;
      if (s.phase === 'place') {
        const id = s.alive.find((x) => person(x) && s.placed.indexOf(x) === -1);
        if (id) moved = act(T, id, 'place', { disc: pick(g.hands[id]), round: s.round });
      } else if (s.phase === 'guess') {
        const id = people.find((x) => x !== s.flip.pid && s.guessed.indexOf(x) === -1);
        if (id) { moved = act(T, id, 'guess', { yes: Math.random() < 0.5, round: s.round }); seen.guess = true; }
      } else if (up && person(up)) {
        const seq = s.turnSeq;
        if (s.phase === 'add') {
          moved = g.hands[up].length && Math.random() < 0.5 ? act(T, up, 'add', { disc: pick(g.hands[up]), seq }) : act(T, up, 'bid', { n: 1 + Math.floor(Math.random() * Math.min(3, s.total)), seq });
        } else if (s.phase === 'bid') {
          moved = s.bid.n < s.total && Math.random() < 0.3 ? act(T, up, 'bid', { n: s.bid.n + 1, seq }) : act(T, up, 'pass', { seq });
        } else if (s.phase === 'flip') {
          const open = s.alive.filter((x) => x !== up && (g.piles[x] || []).length > (s.flipped || []).filter((f) => f.owner === x).length);
          moved = act(T, up, 'flip', { target: s.flip.own ? pick(open) : up, seq });
        } else if (s.phase === 'lose') {
          moved = act(T, up, 'lose', { disc: pick(g.discs[up]).i, seq });
        }
      }
      if (!moved) runClock(T, (room) => room.shared !== s || room.shared.phase === 'gameover', 3);
    }
    return seen.lost && seen.midFlip && seen.guess;
  },
  darkroom() {
    // Four at the table: a level walked (a trap on the way), the next one with a guide leaving and the turn
    // passed, the traps to the end of the hearts; then play again in the tomb with the joystick.
    const T = table('darkroom', 4);
    must(T, T.host, 'start', { story: 'home', mode: 'steps' });
    const mapOf = () => DARK.darkMap(S(T).story, S(T).level, T.room._dark.seed);
    const at = (k) => { clock = S(T).t0 + k * DARK.DARK_TICK + 5; };
    const cellOf = (m) => Math.floor(S(T).pos.y) * m.w + Math.floor(S(T).pos.x);
    const dirTo = (m, a, b) => ({ 1: 'R', [-1]: 'L', [m.w]: 'D', [-m.w]: 'U' })[b - a];
    // A way over (cell, tick) to a target, avoiding still and moving traps unless the target is one.
    const plan = (m, to) => {
      const W = m.w, from = cellOf(m), k0 = Math.max(0, Math.ceil((clock - S(T).t0) / DARK.DARK_TICK));
      const still = new Set(m.traps.map((t) => t.y * W + t.x));
      const prev = new Map([[from + '|' + k0, null]]);
      let front = [from];
      for (let k = k0; k < k0 + 2000 && front.length; k++) {
        const next = [];
        for (const c of front) {
          if (c === to) { const out = []; for (let key = c + '|' + k; key; key = prev.get(key)) out.push([Number(key.split('|')[0]), Number(key.split('|')[1])]); return out.reverse(); }
          const x = c % W, y = Math.floor(c / W);
          const opts = [c];
          for (const d of Object.values(DARK.DARK_DIRS)) if (!DARK.darkBlocked(m, x, y, d[0], d[1])) opts.push((y + d[1]) * W + x + d[0]);
          for (const n of opts) {
            const key = n + '|' + (k + 1);
            if (prev.has(key) || (n !== to && (still.has(n) || m.dyn.some((d) => DARK.darkDynCell(m, d, k + 1) === n)))) continue;
            prev.set(key, c + '|' + k); next.push(n);
          }
        }
        front = next;
      }
      return null;
    };
    const go = (to) => {
      const m = mapOf();
      const path = plan(m, to);
      if (!path) return false;
      for (let i = 1; i < path.length && S(T).phase === 'play'; i++) {
        at(path[i][1]);
        let d = dirTo(m, path[i - 1][0], path[i][0]);
        // «دايخ!» (7 Oct 2026): while the mover is dizzy the server swaps left and right, so the walker
        // presses the other one, as a guide would tell them to.
        if ((T.room._dark || {}).dizzyUntil > clock && (d === 'L' || d === 'R')) d = d === 'L' ? 'R' : 'L';
        if (d) must(T, S(T).moverId, 'step', { d, run: S(T).run });
      }
      return true;
    };
    // The first still trap there is a way to without another trap or the goal on it: a random map may put
    // traps[0] behind other traps (grandpa's creaky tile behind a Lego brick), or the way to it over the
    // goal, which wins the level instead (the same flake rules.mjs had, 1 run in 40).
    const trapOnce = () => {
      const m = mapOf(), goal = m.goal[1] * m.w + m.goal[0];
      const t = m.traps.find((tr) => { const p = plan(m, tr.y * m.w + tr.x); return p && !p.some(([c]) => c === goal); });
      if (!t) return;
      go(t.y * m.w + t.x);
      runClock(T, (r) => r.shared.phase !== 'trap', 4);
    };
    const win = () => { const m = mapOf(); go(m.goal[1] * m.w + m.goal[0]); runClock(T, (r) => r.shared.phase !== 'won', 4); };
    trapOnce();
    win();
    if (S(T).level !== 2) return false;
    // A guide leaves; the host passes the mover's turn.
    const guide = S(T).guides[0];
    T.room.players = T.room.players.filter((p) => p.id !== guide);
    const next = structuredClone(T.room); roomPlayerLeft(next, guide, 'X'); T.room = next; scan(T, 'left');
    must(T, T.host, 'passMover', { run: S(T).run });
    // Wait on the start while the moving traps go round (the server's clock), then walk the level.
    at(3);
    win();
    for (let guard = 0; guard < 8 && S(T).phase !== 'gameover'; guard++) trapOnce();
    if (S(T).phase !== 'gameover') return false;
    // The tomb, with the joystick.
    must(T, T.host, 'playAgain', { story: 'tomb', mode: 'stick' });
    at(2);
    for (let guard = 0; guard < 30 && S(T).phase === 'play'; guard++) {
      const m = mapOf();
      const t = m.traps[0];
      const x = S(T).pos.x, y = S(T).pos.y;
      const dx = t.x + 0.5 - x, dy = t.y + 0.5 - y, l = Math.hypot(dx, dy) || 1;
      must(T, S(T).moverId, 'stick', { vx: dx / l, vy: dy / l, run: S(T).run });
      clock += 300;
    }
    runClock(T, (r) => r.shared.phase !== 'trap', 4);
    return S(T).level >= 1;
  },
  witness() {
    // Five at the table: every one the witness once - a sketch built, votes changed, a vote on the clock,
    // a quiet witness passed over, a drawing closed by the host, a juror leaving mid-vote - to the board.
    const T = table('witness', 5);
    must(T, T.host, 'start', {});
    for (let guard = 0; guard < 60 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      if (s.phase === 'ready') {
        if (s.round === 3) { must(T, T.host, 'skipTurn', { round: s.round }); continue; }
        must(T, s.witnessId, 'ready', { round: s.round });
        // «ممنوع تقول…» comes one round in three: the first round has one for sure, as the server would deal it.
        if (s.round === 1 && T.room._witness && !T.room._witness.taboo) {
          T.room._witness.taboo = 'colors';
          T.room.secrets[s.witnessId] = Object.assign({}, T.room.secrets[s.witnessId], { taboo: 'colors' });
          T.room.screenOnly = { taboo: 'colors' };
          scan(T, 'a taboo dealt');
        }
        continue;
      }
      if (s.phase === 'look') { runClock(T, (r) => r.shared.phase !== 'look', 3); continue; }
      if (s.phase === 'draw') {
        const face = Object.assign({}, s.sketch, { hair: pick(['black', 'brown', 'red']), glasses: Math.random() < 0.5, g: pick(['m', 'f']) });
        must(T, s.artistId, 'sketch', { round: s.round, n: (s.sketchN || 0) + 1, face });
        if (s.round === 2) runClock(T, (r) => r.shared.phase !== 'draw', 3);
        else if (s.round === 4) must(T, T.host, 'closeDraw', { round: s.round });
        else must(T, s.artistId, 'done', { round: s.round });
        continue;
      }
      if (s.phase === 'vote') {
        const jury = s.vote.eligible;
        if (s.round === 2) { runClock(T, (r) => r.shared.phase !== 'vote', 3); continue; }
        jury.slice(0, jury.length - 1).forEach((id) => {
          act(T, id, 'vote', { option: 's' + (1 + Math.floor(Math.random() * 6)), round: s.round });
          act(T, id, 'vote', { option: 's' + (1 + Math.floor(Math.random() * 6)), round: s.round });
        });
        if (S(T).phase === 'vote') {
          if (s.round === 5 && jury.length > 1) {
            const gone = jury[jury.length - 1];
            T.room.players = T.room.players.filter((p) => p.id !== gone);
            const next = structuredClone(T.room);
            roomPlayerLeft(next, gone, 'X');
            T.room = next;
            scan(T, 'left');
          } else act(T, jury[jury.length - 1], 'vote', { option: 's1', round: s.round });
        }
        if (S(T).phase === 'vote') must(T, T.host, 'closeVote', { round: s.round });
        continue;
      }
      if (s.phase === 'reveal') { must(T, T.host, 'nextRound', { round: s.round }); continue; }
    }
    return S(T).phase === 'gameover';
  },
  hear() {
    // Five at the table, everyone describes once: a picture swapped, drawings sent and handed in (one a
    // trace of the picture, one blank, one scribbled), «خلّصت», a round on the clock, the host closing a
    // drawing and a vote, a quiet describer passed over, a drawer leaving mid-drawing - to the board.
    const T = table('hear', 5);
    must(T, T.host, 'start', { seconds: 60, kind: 'mix', level: 'hard', laps: 1 });
    const scribble = () => ({ c: '#111827', w: 5, p: Array.from({ length: 40 }, () => Math.floor(Math.random() * 256)) });
    const trace = () => HEAR.hearOutlines(T.room._hear.pic.s).map((l) => ({ c: '#111827', w: 5, p: l.flatMap(([x, y]) => [Math.round(x * 2.55), Math.round(y * 2.55)]) }));
    for (let guard = 0; guard < 80 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      if (s.phase === 'ready') {
        if (s.round === 3) { must(T, T.host, 'skipTurn', { round: s.round }); continue; }
        if (s.round === 1) { must(T, s.describerId, 'swap', { round: s.round }); must(T, s.describerId, 'swap', { round: s.round }); }
        must(T, s.describerId, 'go', { round: s.round });
        continue;
      }
      if (s.phase === 'draw') {
        const drawers = s.drawers.slice();
        drawers.forEach((id, i) => {
          const strokes = i === 0 ? trace() : i === 1 ? [] : [scribble(), scribble()];
          must(T, id, 'ink', { round: s.round, strokes });
        });
        if (s.round === 2) { must(T, s.describerId, 'done', { round: s.round }); runClock(T, (r) => r.shared.phase === 'grade', 6); continue; }
        if (s.round === 4) {
          const gone = drawers[drawers.length - 1];
          T.room.players = T.room.players.filter((p) => p.id !== gone);
          const next = structuredClone(T.room);
          roomPlayerLeft(next, gone, 'X');
          T.room = next;
          scan(T, 'left');
          must(T, T.host, 'closeDraw', { round: s.round });
          runClock(T, (r) => r.shared.phase === 'grade', 4);
          continue;
        }
        drawers.forEach((id) => act(T, id, 'hand', { round: s.round }));
        continue;
      }
      if (s.phase === 'collect') { runClock(T, (r) => r.shared.phase !== 'collect', 3); continue; }
      if (s.phase === 'grade') {
        if (s.round === 1) runClock(T, (r) => r.shared.phase !== 'grade', 3);
        else must(T, T.host, 'toVote', { round: s.round });
        continue;
      }
      if (s.phase === 'vote') {
        const v = s.vote;
        if (s.round === 2) { runClock(T, (r) => r.shared.phase !== 'vote', 3); continue; }
        v.eligible.slice(0, -1).forEach((id) => {
          const opt = v.options.find((o) => o.ownerId !== id);
          act(T, id, 'vote', { option: opt.id, round: s.round });
        });
        if (S(T).phase === 'vote') must(T, T.host, 'closeVote', { round: s.round });
        continue;
      }
      if (s.phase === 'result') { must(T, T.host, 'nextRound', { round: s.round }); continue; }
    }
    return S(T).phase === 'gameover';
  },
  box() {
    // Five at the table, the eight boxes: bids in early, the minute and the last call on the clock,
    // the host calling and closing the bids, a key (its peek) on the table, a player leaving mid-bid.
    const T = table('box', 5);
    must(T, T.host, 'start', {});
    T.room._box.deck[2] = { kind: 'key', value: null };
    T.room._box.offerAt = [0, 6];          // «عرض الحاج» at two boxes the driver plays through
    for (let guard = 0; guard < 80 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      if (s.phase === 'talk' || s.phase === 'bid') {
        const here = s.roster.filter((id) => T.room.players.some((p) => p.id === id)).filter((id) => s.done.indexOf(id) === -1);
        if (s.box === 1) { runClock(T, (r) => r.shared.phase === 'open', 5); continue; }
        if (s.box === 3 && s.phase === 'talk') { must(T, T.host, 'openBids', { box: s.box }); continue; }
        if (s.box === 4) { act(T, here[0], 'bid', { box: s.box, amount: 50 }); must(T, T.host, 'closeBids', { box: s.box }); continue; }
        if (s.box === 5 && here.length > 1 && T.room.players.length === 5) {
          act(T, here[0], 'bid', { box: s.box, amount: 120 });
          const goneId = here[here.length - 1];
          T.room.players = T.room.players.filter((p) => p.id !== goneId);
          const next = structuredClone(T.room);
          roomPlayerLeft(next, goneId, 'X');
          T.room = next;
          scan(T, 'left');
          continue;
        }
        here.forEach((id, i) => act(T, id, 'bid', { box: s.box, amount: 10 + 10 * Math.floor(Math.random() * 30), insure: i % 2 === 0 }));
        continue;
      }
      if (s.phase === 'offer') {
        if (s.box === 0) must(T, s.offer.winnerId, 'deal', { box: s.box, take: true });
        else runClock(T, (r) => r.shared.phase !== 'offer', 3);
        continue;
      }
      if (s.phase === 'open') {
        if (s.box % 2) runClock(T, (r) => r.shared.phase !== 'open', 3);
        else { clock += 11000; must(T, T.host, 'nextBox', { box: s.box }); }
        continue;
      }
    }
    return S(T).phase === 'gameover';
  },
  exact() {
    // Five at the table from level 6, so every order comes up (the ones with secrets among them):
    // random hands down and up on each, the host moving a verdict on now and then, to the last glass.
    const T = table('exact', 5);
    must(T, T.host, 'start', {});
    T.room.shared.level = 6;
    T.room.shared.lives = 60;
    const kinds = new Set();
    for (let guard = 0; guard < 600 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      if (kinds.size >= 14 && s.lives > 1) T.room.shared.lives = 1;
      if (s.phase === 'ready') { kinds.add(s.order.kind); runClock(T, (r) => r.shared.phase !== 'ready', 3); continue; }
      if (s.phase === 'go') {
        T.ids.forEach((id, i) => {
          if (Math.random() < 0.55) {
            clock += 40;
            act(T, id, 'down', { round: s.round, at: clock });
            if (i % 2) { clock += 120; act(T, id, 'up', { round: s.round, at: clock }); }
          }
        });
        runClock(T, (r) => r.shared.phase !== 'go', 3);
        continue;
      }
      if (s.phase === 'reveal') {
        if (guard % 3 === 0) must(T, T.host, 'nextRound', { round: s.round });
        else runClock(T, (r) => r.shared.phase !== 'reveal', 3);
      }
    }
    return S(T).phase === 'gameover' && kinds.size === 14;
  },
  chairs() {
    // Four in the ring: a false start, taps timed by their stamps, a round nobody finishes, to one left.
    // Fake pauses come only with 8 s of music or more, so now and then a whole game has none and
    // the fake-pause probe never came up: play again until one has (a check can't fail by chance).
    const T = table('chairs', 4);
    must(T, T.host, 'start', { fake: true });
    let sawFake = false;
    for (let guard = 0; guard < 240 && !(S(T).phase === 'gameover' && sawFake); guard++) {
      if (S(T).phase === 'gameover') { must(T, T.host, 'playAgain', { fake: true }); continue; }
      if (T.room._chairs && T.room._chairs.fakes.length) sawFake = true;
      const s = S(T);
      if (s.phase === 'result') { runClock(T, (r) => r.shared.phase !== 'result', 6); continue; }
      if (s.phase === 'music') {
        if (guard === 0) { must(T, s.alive[1], 'sit', { round: s.round, at: clock }); continue; }     // a false start
        runClock(T, (r) => r.shared.phase !== 'music', 12);
        continue;
      }
      if (s.phase === 'sit') {
        const alive = s.alive.slice();
        alive.slice(0, alive.length - 1).forEach((id, i) => must(T, id, 'sit', { round: s.round, at: s.stopAt + 100 + i * 50 }));
        runClock(T, (r) => r.shared.phase !== 'sit', 6);                                             // the last never taps
      }
    }
    if (!(S(T).phase === 'gameover' && !!S(T).winnerId)) return false;
    // «الدي جي»: a false start, then a DJ's fake that catches one, then a DJ whose phone goes away.
    must(T, T.host, 'playAgain', { fake: true, dj: true });
    let djRounds = 0;
    let tookOver = false;
    for (let guard = 0; guard < 200 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      if (s.phase === 'result') { runClock(T, (r) => r.shared.phase !== 'result', 6); continue; }
      if (s.phase === 'sit') {
        s.alive.slice(0, s.alive.length - 1).forEach((id, i) => must(T, id, 'sit', { round: s.round, at: s.stopAt + 100 + i * 50 }));
        runClock(T, (r) => r.shared.phase !== 'sit', 6);
        continue;
      }
      if (s.phase !== 'music') break;
      if (!s.dj) {
        if (s.round === 1) { must(T, s.alive[1], 'sit', { round: s.round, at: clock }); continue; }
        runClock(T, (r) => r.shared.phase !== 'music', 12);
        continue;
      }
      djRounds++;
      clock = Math.max(clock, s.startAt + 4500);
      if (djRounds === 1) {
        must(T, s.dj, 'djFake', { round: s.round });
        must(T, s.alive[1], 'sit', { round: s.round, at: clock });           // caught by the fake
        continue;
      }
      if (!tookOver) {
        tookOver = true;
        T.room.lastSeen = { [s.dj]: clock };
        runClock(T, (r) => !r.shared.dj, 6);
        delete T.room.lastSeen;
        continue;
      }
      must(T, s.dj, 'djStop', { round: s.round });
    }
    return S(T).phase === 'gameover' && djRounds >= 2 && tookOver && !!S(T).bestDj;
  },
  reaction() {
    // Four phones: a tap on red (✖), taps timed by their stamps, one phone that never taps, the
    // host moving a round on; played again until a game has shown a fake and someone fell for it
    // (the plan is random, so a check can't pass by never looking).
    const T = table('reaction', 4);
    must(T, T.host, 'start', { fakes: true });
    let sawFake = false, fooled = false;
    for (let guard = 0; guard < 400 && !(S(T).phase === 'gameover' && sawFake && fooled); guard++) {
      if (S(T).phase === 'gameover') { must(T, T.host, 'playAgain', { fakes: true }); continue; }
      const s = S(T);
      if (s.fake) {
        sawFake = true;
        if (!fooled) { must(T, T.ids[1], 'tap', { round: s.round, at: clock }); fooled = true; continue; }
      }
      if (s.phase === 'wait') {
        if (guard === 0) { must(T, T.ids[2], 'tap', { round: s.round, at: clock }); continue; }    // on red
        runClock(T, (r) => r.shared.phase !== 'wait' || (!fooled && !!r.shared.fake), 12);
        continue;
      }
      if (s.phase === 'go') {
        T.ids.slice(0, 3).forEach((id, i) => { if (!s.taps.some((x) => x.id === id)) act(T, id, 'tap', { round: s.round, at: s.greenAt + 150 + i * 60 }); });
        runClock(T, (r) => r.shared.phase !== 'go', 6);                                              // the fourth never taps
        continue;
      }
      if (s.phase === 'result') {
        if (guard % 3 === 0) must(T, T.host, 'nextRound', { round: s.round });
        else runClock(T, (r) => r.shared.phase !== 'result', 6);
      }
    }
    if (!(S(T).phase === 'gameover' && sawFake && fooled && S(T).board.length === 4)) return false;
    // «ركّز!» in «خروج المغلوب» (875, 877): someone taps a word that doesn't agree; the rest tap the
    // match; one goes out a round until the final's best of three.
    const U = table('reaction', 4);
    must(U, U.host, 'start', { focus: true, mode: 'knockout' });
    let fell = false;
    for (let guard = 0; guard < 400 && S(U).phase !== 'gameover'; guard++) {
      const s = S(U);
      if (s.phase === 'wait') {
        if (!fell && s.word) { must(U, s.alive[0], 'tap', { round: s.round, at: clock }); fell = true; continue; }
        runClock(U, (r) => r.shared.phase !== 'wait' || (r.shared.word && r.shared.word.n !== s.word.n), 12);
        continue;
      }
      if (s.phase === 'go') {
        s.alive.forEach((id, i) => { if (!s.taps.some((x) => x.id === id)) act(U, id, 'tap', { round: s.round, at: s.greenAt + 150 + i * 40 }); });
        runClock(U, (r) => r.shared.phase !== 'go', 6);
        continue;
      }
      if (s.phase === 'result') runClock(U, (r) => r.shared.phase !== 'result', 6);
    }
    return S(U).phase === 'gameover' && fell && !!S(U).final && !!S(U).final.winner;
  },
  wire() {
    // Four at the kitchen with the surprises on: most orders done by whoever holds them, some let
    // go (damage), the smoke wiped, the shake made or missed, levels won until the table loses.
    const T = table('wire', 4);
    must(T, T.host, 'start', { place: 'kitchen', surprises: true });
    let played = 0;
    for (let guard = 0; guard < 6000 && S(T).phase !== 'gameover'; guard++) {
      const s = S(T);
      const w = T.room._wire;
      if (s.phase !== 'play') { runClock(T, (r) => r.shared.phase === 'play' || r.shared.phase === 'gameover', 6); continue; }
      if (s.shake && Math.random() < 0.7) { const who = s.alive.find((id) => s.shake.done.indexOf(id) === -1); if (who) { must(T, who, 'shake', { id: s.shake.id }); continue; } }
      const smoke = Object.keys(w.broken).find((c) => w.broken[c].k === 'smoke');
      if (smoke && Math.random() < 0.5) { const h = Object.keys(w.panels).find((id) => w.panels[id].indexOf(smoke) !== -1); must(T, h, 'wipe', { c: smoke, lv: s.level }); continue; }
      const pid = Object.keys(s.orders).find((id) => s.orders[id]);
      // Harder levels let more go, so the game ends.
      if (pid && Math.random() < Math.max(0.3, 0.97 - 0.12 * s.level)) {
        const o = s.orders[pid];
        const h = Object.keys(w.panels).find((id) => w.panels[id].indexOf(o.c) !== -1);
        if (o.n) { for (let k = 0; k < o.n; k++) act(T, h, 'press', { c: o.c, lv: s.level }); }
        else act(T, h, 'ctl', { c: o.c, v: o.v, lv: s.level });
        played++;
        continue;
      }
      runClock(T, (r) => r.shared !== s || r.shared.phase !== 'play' || JSON.stringify(r.shared.orders) !== JSON.stringify(s.orders), 3);
    }
    return S(T).phase === 'gameover' && played > 10;
  },
  vault() {
    // «واحد بيفتح», endless: the opener works the locks from what it was sent (right three times in four),
    // the readers' pages unread, levels until a safe is lost; a reader leaves on the way, play again.
    const T = table('vault', 5);
    must(T, T.host, 'start', { way: 'one', mistakes: 'strikes', win: 'levels' });
    vaultPlay(T, 0.78, 900);
    if (S(T).phase !== 'gameover' || S(T).levelsWon < 1) return false;
    must(T, T.host, 'playAgain', { way: 'one', mistakes: 'time', win: 'levels' });
    vaultPlay(T, 0.9, 40);
    T.room.players = T.room.players.filter((p) => p.id !== 'p3');
    const next = structuredClone(T.room); roomPlayerLeft(next, 'p3', 'X'); T.room = next; scan(T, 'left');
    vaultPlay(T, 0.6, 900);
    return S(T).phase === 'gameover';
  },
  chess4() {
    // Two people and computer players, both ways: random moves for the people, the host playing
    // for someone now and then, a resignation (FFA), the clock running out.
    const C4 = new Function(readFileSync(srcPath('Chess4.js'), 'utf8') + ';return { chess4Legal };')();
    const game = (mode) => {
      const T = table('chess4', 2);
      must(T, T.host, 'options', { mode: mode, clock: 1 });
      must(T, T.host, 'addBot', { level: 'hard', name: 'زيزو' });
      must(T, T.host, 'start', { botNames: ['بندق'] });
      for (let guard = 0; guard < 3000 && S(T).phase === 'play'; guard++) {
        const s = S(T);
        const up = s.seats[s.g.turn];
        if (T.ids.indexOf(up) === -1) { runClock(T, (r) => r.shared.phase !== 'play' || T.ids.indexOf(r.shared.seats[r.shared.g.turn]) !== -1, 60); continue; }
        if (guard % 37 === 5) { act(T, T.host, 'skipTurn', { seq: s.turnSeq }); continue; }
        if (guard === 300 && mode === 'ffa') { act(T, up, 'resign', {}); continue; }
        if (guard % 53 === 7) { clock += 90000; runClock(T, (r) => r.shared.phase !== 'play' || r.shared.turnSeq !== s.turnSeq, 3); continue; }
        const mv = pick(C4.chess4Legal(s.g));
        act(T, up, 'move', { from: mv.from, to: mv.to, seq: s.turnSeq });
      }
      return S(T).phase === 'over';
    };
    return game('ffa') && game('teams');
  },
  chess() {
    // Moves at random until the game ends (mate, a draw, or a resignation after 200), then the next game on a clock that runs out.
    const CH = new Function(readFileSync(srcPath('Chess.js'), 'utf8') + ';return { chessLegalMoves };')();
    const T = table('chess', 3);
    const play = () => {
      for (let guard = 0; guard < 200 && S(T).phase === 'play'; guard++) {
        const s = S(T);
        const all = CH.chessLegalMoves(s.chess.g);
        const m = pick(all);
        if (guard === 7) must(T, s.seats[s.chess.g.turn], 'offerDraw', { move: s.chess.moves });
        if (guard === 8 && S(T).chess.offer) must(T, s.seats[s.chess.g.turn], 'answerDraw', { accept: false });
        must(T, s.seats[S(T).chess.g.turn], 'move', { from: m.from, to: m.to, promo: m.promo, move: S(T).chess.moves });
      }
      if (S(T).phase === 'play') must(T, S(T).seats[0], 'resign', { round: S(T).round });
    };
    must(T, T.host, 'start', {});
    play();
    must(T, T.host, 'nextRound', { round: S(T).round });
    play();
    must(T, T.host, 'backToHub');
    must(T, T.host, 'chooseGame', { game: 'chess' });
    must(T, T.host, 'start', { clock: '3+2' });
    const s = S(T);
    const first = CH.chessLegalMoves(s.chess.g)[0];
    must(T, s.seats[0], 'move', { from: first.from, to: first.to, promo: first.promo, move: 0 });
    runClock(T, (r) => r.shared.phase === 'over', 50);
    return S(T).phase === 'over';
  },
  votechess() {
    // Random votes (changed now and then), the clock closing a vote nobody finished, the host closing one, then a team resigning by vote.
    const CH = new Function(readFileSync(srcPath('Chess.js'), 'utf8') + ';return { chessLegalMoves };')();
    const T = table('votechess', 5);
    must(T, T.host, 'sides', { shuffle: true });
    must(T, T.host, 'start', { secs: 20 });
    const play = (limit) => {
      for (let guard = 0; guard < limit && S(T).phase === 'play'; guard++) {
        const s = S(T);
        const team = s.teams[s.vote.team];
        const n = s.chess.moves;
        const legal = CH.chessLegalMoves(s.chess.g);
        if (guard % 9 === 4) { must(T, team[0], 'vote', { ...pick(legal), n }); runClock(T, (r) => r.shared.chess.moves !== n || r.shared.phase !== 'play', 10); continue; }
        if (guard % 13 === 6) { must(T, team[0], 'vote', { ...pick(legal), n }); must(T, T.host, 'closeVote', { n }); continue; }
        for (const id of team) {
          if (S(T).chess.moves !== n) break;
          act(T, id, 'vote', { ...pick(legal), n });
          if (S(T).chess.moves === n && Math.random() < 0.3) act(T, id, 'vote', { ...pick(legal), n });
        }
      }
    };
    play(60);
    while (S(T).phase === 'play') {
      const s = S(T);
      const n = s.chess.moves;
      s.teams[s.vote.team].forEach((id) => act(T, id, 'vote', { resign: true, n }));
    }
    must(T, T.host, 'playAgain', {});
    play(30);
    if (S(T).phase === 'play') { const s = S(T); s.teams[s.vote.team].forEach((id) => act(T, id, 'vote', { resign: true, n: s.chess.moves })); }
    return S(T).phase === 'over';
  },
  handbrain() {
    // Three people and a computer player: the Brains name, the Hands move, the computer on the clock, the host's "play for".
    const CH = new Function(readFileSync(srcPath('Chess.js'), 'utf8') + ';return { chessLegalMoves };')();
    const T = table('handbrain', 3);
    must(T, T.host, 'seats', {});
    must(T, T.host, 'start', { clock: '10+0', botNames: ['زيزو'] });
    const kindAt = (g, sq) => g.board['abcdefgh'.indexOf(sq[0]) + 8 * (Number(sq[1]) - 1)] & 7;
    const play = (limit) => {
      for (let guard = 0; guard < limit && S(T).phase === 'play'; guard++) {
        const s = S(T);
        const g = s.chess.g;
        const up = s.teams[g.turn][s.stage === 'name' ? 0 : 1];
        if (T.room.players.some((p) => p.id === up && p.bot)) { runClock(T, (r) => r.shared.chess.moves !== s.chess.moves || r.shared.stage !== s.stage || r.shared.phase !== 'play', 10); continue; }
        if (guard % 11 === 5) { must(T, T.host, 'skipTurn', { move: s.chess.moves, stage: s.stage }); continue; }
        const legal = CH.chessLegalMoves(g);
        if (s.stage === 'name') must(T, up, 'name', { kind: kindAt(g, pick(legal).from), n: s.chess.moves });
        else must(T, up, 'move', { ...pick(legal.filter((m) => kindAt(g, m.from) === s.named.kind)), move: s.chess.moves });
      }
    };
    play(300);
    if (S(T).phase === 'play') must(T, S(T).teams[0][0], 'resign', { round: S(T).round });
    must(T, T.host, 'playAgain', {});
    play(60);
    if (S(T).phase === 'play') must(T, S(T).teams[1][1], 'resign', { round: S(T).round });
    return S(T).phase === 'over';
  },
  bughouse() {
    // Two people and two computer players: random moves and drops on both boards, the host playing for
    // someone, the game to its end (a mate or a flag), and play again on a clock that runs out.
    const CH = new Function(readFileSync(srcPath('Chess.js'), 'utf8') + ';return { chessLegalMoves, chessBugDrops };')();
    const T = table('bughouse', 2);
    must(T, T.host, 'start', { clock: '2+0', botNames: ['زيزو', 'بندق'] });
    const people = () => T.ids.filter((id) => S(T).seats.indexOf(id) !== -1);
    for (let guard = 0; guard < 400 && S(T).phase === 'play'; guard++) {
      const s = S(T);
      if (guard === 40) { must(T, T.host, 'skipTurn', { board: 1, move: s.boards[1].moves }); continue; }
      const mine = people().map((id) => ({ id, k: s.seats.indexOf(id) })).filter((x) => s.boards[x.k >> 1].g.turn === (x.k & 1));
      if (!mine.length || guard % 4 === 3) { runClock(T, (r) => r.shared.phase !== 'play' || r.shared.boards.some((b, i) => b.moves !== s.boards[i].moves), 3); continue; }
      const { id, k } = pick(mine);
      const bd = s.boards[k >> 1];
      const drops = CH.chessBugDrops(bd.g), moves = CH.chessLegalMoves(bd.g);
      if (drops.length && (Math.random() < 0.5 || !moves.length)) { const d = pick(drops); act(T, id, 'drop', { drop: d.drop, to: d.to, move: bd.moves }); continue; }
      if (moves.length) { const m = pick(moves); act(T, id, 'move', { from: m.from, to: m.to, promo: m.promo, move: bd.moves }); }
    }
    runClock(T, (r) => r.shared.phase === 'over');
    if (S(T).phase !== 'over') return false;
    must(T, T.host, 'playAgain', { round: S(T).round });
    runClock(T, (r) => r.shared.phase === 'over');
    return S(T).phase === 'over' && !!S(T).result;
  },
  xo() {
    const T = table('xo', 3);
    const play = () => {
      for (let guard = 0; guard < 200 && S(T).phase === 'play'; guard++) {
        const s = S(T);
        const free = s.cells.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
        act(T, s.seats[s.turn], 'move', { cell: pick(free), move: s.moves });
      }
    };
    must(T, T.host, 'start', { three: true });
    play();
    must(T, T.host, 'nextRound', { round: S(T).round });
    play();
    return S(T).phase === 'over';
  },
  dots() {
    const T = table('dots', 2);
    must(T, T.host, 'start', { size: 4 });
    for (let guard = 0; guard < 80 && S(T).phase === 'play'; guard++) {
      const s = S(T);
      const free = s.lines.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      must(T, s.seats[s.turn], 'move', { edge: pick(free), move: s.moves });
    }
    return S(T).phase === 'over';
  },
  hum() {
    // «دندنة» with four: the hummer in turn, a preview that won't load (a new song by itself), wrong, close and
    // right typed answers, the hummer refused, the choices on the clock, a skip, a leaver mid-song - to the board.
    // Then «سمّع» «بتطول» with three: the ▶ round, the countdown, the clips growing, the choices, play again.
    const withAlt = HUM.HUM_SONGS.findIndex((x) => (x.alt || []).length);
    const playHum = (T, round) => {
      const s = S(T);
      const h = T.room._hum;
      const song = HUM.HUM_SONGS[h.cur];
      if (s.phase === 'listen') {
        if (round === 3) { runClock(T, (r) => r.shared.phase !== 'listen', 3); return; }
        // «الظرف التلاتة»: the hummer picks the envelope they know.
        if (s.envelope) { must(T, s.hummerId, 'envelope', { deal: s.deal, i: round % 3 }); return; }
        if (round === 2 && !s.redeals) { must(T, s.hummerId, 'broken', { deal: s.deal }); return; }
        must(T, s.hummerId, 'heard', { deal: s.deal });
        return;
      }
      if (s.phase === 'count') { runClock(T, (r) => r.shared.phase !== 'count', 3); return; }
      if (s.phase === 'type') {
        const guessers = s.roster.filter((id) => id !== s.hummerId && T.room.players.some((p) => p.id === id));
        if (s.hummerId) act(T, s.hummerId, 'guess', { deal: s.deal, text: song.t });
        act(T, guessers[0], 'guess', { deal: s.deal, text: 'مش عارف' });
        act(T, guessers[0], 'guess', { deal: s.deal, text: song.t.slice(0, Math.max(2, song.t.length - 3)) });
        if (round === 4 && s.mode === 'hum') { must(T, T.host, 'skipSong', { deal: s.deal }); return; }
        act(T, guessers[0], 'guess', { deal: s.deal, text: (song.alt || [])[0] || song.t });
        if (round === 5 && s.mode === 'hum' && guessers.length > 2) {
          // Someone leaves mid-song: the table goes on without them.
          const gone = guessers[guessers.length - 1];
          T.room.players = T.room.players.filter((p) => p.id !== gone);
          const next = structuredClone(T.room);
          roomPlayerLeft(next, gone, 'X');
          T.room = next;
          scan(T, 'left');
        }
        if (round % 2 === 0 && S(T).phase === 'type') guessers.slice(1).forEach((id) => act(T, id, 'guess', { deal: s.deal, text: song.t }));
        if (S(T).phase === 'type') runClock(T, (r) => r.shared.phase !== 'type', 3);
        return;
      }
      if (s.phase === 'choices') {
        const left = s.roster.filter((id) => id !== s.hummerId && !s.right.some((r) => r.id === id) && T.room.players.some((p) => p.id === id));
        left.slice(0, Math.max(1, left.length - 1)).forEach((id) => act(T, id, 'pick', { deal: s.deal, i: Math.floor(Math.random() * 4) }));
        if (S(T).phase === 'choices') runClock(T, (r) => r.shared.phase !== 'choices', 3);
        return;
      }
      if (s.phase === 'reveal') { must(T, T.host, 'nextRound', { round: s.round }); return; }
    };
    const T = table('hum', 4);
    must(T, T.host, 'start', { mode: 'hum', count: 5 });
    // The first round's picked envelope (the second of deck[0..2], i = round % 3) has a name it goes by:
    // swapped in, so no song is dealt twice. The envelopes were dealt at the start, so the hummer's are put right too.
    const deck = T.room._hum.deck, at = deck.indexOf(withAlt);
    if (at !== 1) {
      if (at >= 0) deck[at] = deck[1];
      deck[1] = withAlt;
      T.room._hum.offer = deck.slice(0, 3);
      const H0 = S(T).hummerId, E = (i) => ({ t: HUM.HUM_SONGS[i].t, s: HUM.HUM_SONGS[i].s, en: HUM.HUM_SONGS[i].en, se: HUM.HUM_SONGS[i].se });
      T.room.secrets[H0] = { deal: S(T).deal, envelopes: T.room._hum.offer.map(E) };
    }
    for (let guard = 0; guard < 120 && S(T).phase !== 'gameover'; guard++) playHum(T, S(T).round);
    if (S(T).phase !== 'gameover') return false;
    const L = table('hum', 3);
    must(L, L.host, 'start', { mode: 'listen', replay: 'grow', count: 5 });
    act(L, L.ids[1], 'arm', {});
    must(L, L.host, 'go', {});
    for (let guard = 0; guard < 120 && S(L).phase !== 'gameover'; guard++) playHum(L, S(L).round);
    if (S(L).phase !== 'gameover') return false;
    must(L, L.host, 'playAgain', {});
    act(L, L.ids[0], 'arm', {});
    act(L, L.ids[1], 'arm', {});
    act(L, L.ids[2], 'arm', {});
    return S(L).phase === 'count' && S(L).round === 1;
  },
  laser() {
    // Places everyone standing as given ([x, y, a] by player), all ready: the reveal, then its end.
    const round = (T, spots) => {
      const s = S(T);
      if (s.phase !== 'hide') return false;
      s.alive.forEach((pid) => { const [x, y, a] = spots[pid] || [0, 0, 270]; must(T, pid, 'place', { round: s.round, x, y, a }); });
      s.alive.forEach((pid) => must(T, pid, 'ready', { round: s.round }));
      if (S(T).phase !== 'reveal') return false;
      return runClock(T, (r) => r.shared.phase === 'hide' || r.shared.phase === 'gameover');
    };
    // Three: all out together (a tie: all three play on), then one hit, then the last two.
    const T = table('laser', 3);
    const [a, b, c] = T.ids;
    must(T, T.host, 'start', { teams: 0, map: 'hex', turret: true });
    // The room's first laser game: the practice round first (866), with the turret (867) on.
    if (!S(T).practice || !round(T, { [a]: [-0.4, 0.3, 0], [b]: [0, 0.3, 180], [c]: [0.4, -0.3, 180] })) return false;
    if (S(T).practice || S(T).round !== 1 || S(T).alive.length !== 3) return false;
    T.room.shared.turret = null;
    if (!round(T,{ [a]: [-0.4, 0, 0], [b]: [0, 0, 180], [c]: [0.4, 0, 180] })) return false;
    if (!S(T).tie || S(T).alive.length !== 3 || S(T).round !== 2) return false;
    if (!round(T, { [a]: [-0.3, 0, 0], [b]: [0.3, 0, 90], [c]: [0, 0.4, 90] })) return false;
    if (S(T).alive.length !== 2) return false;
    // A round the clock ends: nobody presses ready.
    runClock(T, (r) => r.shared.phase === 'reveal');
    runClock(T, (r) => r.shared.phase === 'hide' || r.shared.phase === 'gameover');
    if (S(T).phase === 'hide' && !round(T, { [a]: [-0.2, 0, 0], [c]: [0.2, 0, 90] })) return false;
    if (S(T).phase !== 'gameover') return false;
    // Four in two teams: the first in the line fires along it, sparing its teammate.
    const U = table('laser', 4);
    must(U, U.host, 'start', { teams: 2, map: 'hex', practice: false });
    if (S(U).phase !== 'teams') return false;
    must(U, U.host, 'shuffle', {});
    must(U, U.host, 'go', {});
    const line = {};
    U.ids.forEach((pid, i) => { line[pid] = [-0.5 + 0.3 * i, 0, i === 0 ? 0 : 270]; });
    if (!round(U, line)) return false;
    if (!(S(U).phase === 'gameover' && S(U).winnerTeam === S(U).teams[U.ids[0]])) return false;
    // Round two: hearts, a shield, a ghost's mine and its swap, bouncing, teams that see each other.
    const V = table('laser', 4);
    const [p, q, r, w] = V.ids;
    must(V, V.host, 'start', { teams: 0, hearts: 2, swap: true, bounce: true, map: 'hex', pickups: false, practice: false });
    must(V, q, 'shield', { round: 1, on: true });
    if (!round(V, { [p]: [-0.5, 0, 0], [q]: [0, 0, 90], [r]: [0.4, 0.5, 270], [w]: [-0.4, 0.5, 270] })) return false;
    if (S(V).hearts[q] !== 2 || !S(V).shieldUsed[q]) return false;
    // Two rounds hit q twice: out, a ghost; its mine catches r.
    for (let i = 0; i < 2 && S(V).alive.indexOf(q) !== -1; i++) {
      if (!round(V, { [p]: [-0.5, 0, 0], [q]: [0, 0, 90], [r]: [0.4, 0.5, 270], [w]: [-0.4, 0.5, 270] })) return false;
    }
    if (S(V).alive.indexOf(q) !== -1 || !V.room.secrets[q].ghost) return false;
    // r has two hearts: the mine takes both, and with the swap q stands again.
    for (let i = 0; i < 2 && S(V).alive.indexOf(q) === -1; i++) {
      must(V, q, 'mine', { round: S(V).round, x: 0.3, y: 0.31 });
      if (!round(V, { [p]: [-0.6, -0.3, 270], [r]: [0.3, 0.3, 270], [w]: [-0.4, 0.5, 270] })) return false;
    }
    if (S(V).alive.indexOf(q) === -1 || S(V).alive.indexOf(r) !== -1) return false;
    const X = table('laser', 4);
    must(X, X.host, 'start', { teams: 2, sight: true, map: 'circle', pillars: true, pieces: true, mirrors: true, turret: true, practice: false });
    must(X, X.host, 'go', {});
    X.ids.forEach((pid, i) => must(X, pid, 'place', { round: 1, x: -0.4 + 0.25 * i, y: 0.3, a: 270 }));
    must(X, X.ids[0], 'shield', { round: 1, on: true });
    X.room.shared.held = { [X.ids[1]]: 'second' };
    must(X, X.ids[1], 'place', { round: 1, x: -0.15, y: 0.3, a: 270, a2: 45 });
    must(X, X.ids[1], 'use', { round: 1, on: true });
    return runClock(X, (rm) => rm.shared.phase === 'reveal') && runClock(X, (rm) => rm.shared.phase !== 'reveal');
  },

};

/*
 * A tournament of each duel with a secret, and one without: five or six
 * players (byes), every match played to its end, and every phone checked
 * after every move against every match's own rules.
 */
const TOUR_DRIVERS = {
  'tour:guesswho'() {
    const T = table('tour:guesswho', 6, { tourOf: 'guesswho' });
    must(T, T.host, 'start', { tournament: true, pick: 'choose', size: 16 });
    for (let guard = 0; guard < 3000 && S(T).tour.phase === 'play'; guard++) {
      const s = S(T);
      const live = s.tour.matches.filter((m) => m.state === 'play');
      if (!live.length) { runClock(T, (r) => r.shared.tour.phase !== 'play' || r.shared.tour.matches.some((m) => m.state === 'play'), 20); continue; }
      const m = pick(live);
      const g = s.games[m.id];
      const base = { match: m.id, mg: m.games };
      if (g.phase === 'pick') { g.seats.forEach((id, k) => { if (!g.picked[k]) act(T, id, 'pick', Object.assign({ face: pick(g.faces.map((_, i) => i)) }, base)); }); continue; }
      const me = g.seats[g.turn], other = g.seats[1 - g.turn], seq = g.turnSeq;
      if (g.stage === 'answer') { act(T, other, 'answer', Object.assign({ yes: Math.random() < 0.5, seq }, base)); continue; }
      if (g.stage === 'flip') { act(T, me, 'done', Object.assign({ seq }, base)); continue; }
      if (Math.random() < 0.3) { act(T, me, 'guess', Object.assign({ face: pick(g.faces.map((_, i) => i)), seq }, base)); continue; }
      act(T, me, Math.random() < 0.5 ? 'loud' : 'typed', Object.assign({ seq, text: 'بيضحك؟' }, base));
    }
    return S(T).tour.phase === 'over';
  },
  'tour:battleship'() {
    const T = table('tour:battleship', 5, { tourOf: 'battleship' });
    must(T, T.host, 'start', { tournament: true, turnClock: 15 });
    for (let guard = 0; guard < 6000 && S(T).tour.phase === 'play'; guard++) {
      const s = S(T);
      const live = s.tour.matches.filter((m) => m.state === 'play');
      if (!live.length || guard % 9 === 0) { runClock(T, (r) => r.shared.tour.phase !== 'play' || r.shared.tour.matches.some((m) => m.state === 'play'), 3); if (!live.length) continue; }
      const m = pick(live);
      const g = s.games[m.id];
      if (!g) continue;
      const base = { match: m.id, mg: m.games };
      if (g.phase === 'place') {
        g.seats.forEach((id, k) => { if (!g.ready[k] && T.room.secrets[id] && T.room.secrets[id].fleet) act(T, id, 'place', Object.assign({ fleet: T.room.secrets[id].fleet }, base)); });
        continue;
      }
      if (g.phase !== 'play') continue;
      if (g.settings.radar && !(g.radar || [])[g.turn] && Math.random() < 0.15) { act(T, g.seats[g.turn], 'radar', Object.assign({ cell: Math.floor(Math.random() * 100), seq: g.turnSeq }, base)); continue; }
      const open = g.seas[1 - g.turn].grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
      act(T, g.seats[g.turn], 'fire', Object.assign({ cell: pick(open), seq: g.turnSeq }, base));
    }
    return S(T).tour.phase === 'over';
  },
  'tour:connect4'() {
    const T = table('tour:connect4', 5, { tourOf: 'connect4' });
    must(T, T.host, 'start', { tournament: true, mode: 4 });
    for (let guard = 0; guard < 3000 && S(T).tour.phase === 'play'; guard++) {
      const s = S(T);
      const live = s.tour.matches.filter((m) => m.state === 'play');
      if (!live.length) { runClock(T, (r) => r.shared.tour.phase !== 'play' || r.shared.tour.matches.some((m) => m.state === 'play'), 20); continue; }
      const m = pick(live);
      const g = s.games[m.id];
      act(T, g.seats[g.turn], 'move', { col: Math.floor(Math.random() * g.cols), move: g.moves, match: m.id, mg: m.games });
    }
    return S(T).tour.phase === 'over';
  },
  'tour:chess'() {
    // Nothing hidden, but every match on its own board: random moves, a draw agreed now and then (the
    // replay and Armageddon), the host playing for someone, a resignation after 30 moves, a clock that runs out.
    const CH = new Function(readFileSync(srcPath('Chess.js'), 'utf8') + ';return { chessLegalMoves };')();
    const T = table('tour:chess', 5, { tourOf: 'chess' });
    must(T, T.host, 'start', { tournament: true, clock: '3+2' });
    for (let guard = 0; guard < 6000 && S(T).tour.phase === 'play'; guard++) {
      const s = S(T);
      const live = s.tour.matches.filter((m) => m.state === 'play');
      if (!live.length || guard % 97 === 0) { runClock(T, (r) => r.shared.tour.phase !== 'play' || r.shared.tour.matches.some((m) => m.state === 'play'), 3); if (!live.length) continue; }
      const m = pick(live);
      const g = s.games[m.id];
      if (!g || g.phase !== 'play') continue;
      const bd = g.chess;
      const base = { match: m.id, mg: m.games };
      const up = g.seats[bd.g.turn];
      if (bd.offer) { act(T, g.seats[1 - bd.offer.seat], 'answerDraw', Object.assign({ accept: Math.random() < 0.7 }, base)); continue; }
      if (bd.moves === 4 && Math.random() < 0.5) { act(T, up, 'offerDraw', Object.assign({ move: bd.moves }, base)); continue; }
      if (bd.moves === 6 && Math.random() < 0.3) { act(T, T.host, 'skipTurn', Object.assign({ move: bd.moves }, base)); continue; }
      if (bd.moves >= 30) { act(T, up, 'resign', Object.assign({ round: g.round }, base)); continue; }
      const mv = pick(CH.chessLegalMoves(bd.g));
      act(T, up, 'move', Object.assign({ from: mv.from, to: mv.to, promo: mv.promo, move: bd.moves }, base));
    }
    return S(T).tour.phase === 'over';
  }
};

/* A family quiz and a word pack for the pack drivers (as the rooms server keeps them). */
const LEAK_QUIZ = { code: 'QZ7K2A', kind: 'quiz', pack: { title: 'مسابقة العيد', emoji: '🎉', questions: [
  { q: 'مين أول واحد في العيلة اتجوز؟', e: '💍', c: ['خالو حسن', 'عمو مجدي', 'طنط نادية', 'بابا'], a: 1 },
  { q: 'آخر مصيف روحناه سوا كان فين؟', e: '🏖️', c: ['رأس البر', 'مرسى مطروح', 'الغردقة', 'بلطيم'], a: 0 },
  { q: 'تيتا بتعمل كحك العيد بكام كيلو دقيق؟', e: '', c: ['اتنين', 'خمسة', 'عشرة', 'تلاتة'], a: 1 },
  { q: 'كريم بيشجع أنهي نادي في السر؟', e: '⚽', c: ['الأهلي', 'الزمالك', 'الإسماعيلي', 'المصري'], a: 2 }
] } };
const LEAK_WORDS = { code: 'WRD234', kind: 'words', pack: { title: 'كلماتنا', words: ['خالو حسن', 'الكنبة الكبيرة', 'بطاطس تيتا', 'المصيف', 'التكييف البايظ', 'قطة الجيران', 'عربية بابا', 'الريموت'] } };

/* A variant of a room game, played through and held to its own probes (PROBES['chess:hq']). */
/* برنامج السهرة (RoomProgram.js): its public state never carries a game's options or the
   highlights the awards are made from (a lie in كدّاب nobody called is a secret until the
   game is over), and the awards appear only with the finale. */
const PROGRAM_PROBES = (room) => {
  const p = room.program;
  if (!p) return [];
  return [
    probe('program: no game options or highlight log in its public state', true, (view) => {
      const pv = view.program || {};
      const text = JSON.stringify(pv);
      const bad = /"(opts|lies|liar|caught|prophet|detective|sly|strikes|dseq|seen|buzz|trivia|chairs)":/.exec(text);
      if (bad) return 'program.' + bad[1];
      return null;
    }),
    probe('program: the awards only with the finale', p.phase !== 'final', (view) => ((view.program || {}).final ? 'program.final' : null))
  ];
};

/* المهمة السرية (RoomMission.js): a phone holds its own file and nobody else's, an ask reaches its
   target alone, a screen holds nothing private, a wrong «كشفتك!» is told to the guesser alone,
   and the public part carries no open file. Held on every move, beside the game on now. */
const MISSION_PROBES = (room) => {
  const m = room.mission;
  if (!m) return [];
  const h = room._mission || {};
  const of = h.of || {};
  const people = room.players.filter((p) => !p.bot).map((p) => p.id);
  const live = !!(m.on && m.phase === 'on');
  const PUBLIC = ['on', 'phase', 'place', 'co', 'swap', 'catch', 'paused', 'score', 'names', 'feed', 'startedAt', 'reveal', 'me', 'asks', 'gift'];
  return [
    probe('mission: a phone holds its own file and no one else\'s', live && Object.keys(of).length > 0, (view, pid) => {
      const mine = (view.mission || {}).me;
      const f = of[pid];
      if (pid === SCREEN || people.indexOf(pid) === -1) return mine ? 'mission.me on a screen' : null;
      if (!f) return mine && mine.m ? 'mission.me with no file' : null;
      return mine && mine.m === f.m && mine.to === f.to && mine.n === f.n ? null : 'mission.me';
    }),
    probe('mission: an ask reaches its target alone', live && (h.asks || []).length > 0, (view, pid) => {
      const asks = (view.mission || {}).asks || [];
      const want = (h.asks || []).filter((a) => a.to === pid).map((a) => a.id).sort().join(',');
      return asks.map((a) => a.id).sort().join(',') === want ? null : 'mission.asks';
    }),
    probe('mission: a wrong «كشفتك!» is told to the guesser alone', live && Object.keys(h.lastCatch || {}).length > 0, (view, pid) => {
      const me = (view.mission || {}).me;
      const got = me && me.caught ? JSON.stringify(me.caught) : 'null';
      const want = (h.lastCatch || {})[pid] ? JSON.stringify(h.lastCatch[pid]) : 'null';
      return got === want ? null : 'mission.me.caught';
    }),
    probe('mission: the public part carries no open file', true, (view) => {
      const v = view.mission || {};
      const extra = Object.keys(v).find((k) => PUBLIC.indexOf(k) === -1);
      if (extra) return 'mission.' + extra;
      if (live && v.reveal) return 'mission.reveal while it runs';
      // A wrong «كشفتك!» gives the one named a point: who got it, never who named them.
      if (v.gift && Object.keys(v.gift).some((k) => ['seq', 'to', 'at'].indexOf(k) === -1)) return 'mission.gift (more than who got the point)';
      // The ticker names a file once it is closed, never one still open (its holder's next is dealt).
      const open = (v.feed || []).find((e) => e.k !== 'done' && e.m);
      if (open) return 'mission.feed (a mission that is not done)';
      const held = (v.feed || []).find((e) => e.k === 'done' && of[e.by] && of[e.by].m === e.m && of[e.by].to === e.to);
      return held ? 'mission.feed (the doer\'s open file)' : null;
    })
  ];
};

const VARIANT_DRIVERS = {
  'race:mix'() {
    // «خماسي السهرة»: five rounds, five puzzles - a swap in the lobby, a give-up, the clock, the host's close, play again.
    const T = table('race:mix', 4, { gameId: 'queens' });
    must(T, T.host, 'raceLineup', { on: true, rounds: 5 });
    must(T, T.host, 'raceLineup', { at: 2, was: S(T).lineup[2] });
    must(T, T.host, 'start', { finish: 'all', lang: 'ar' });
    for (let round = 1; round <= 5; round++) {
      if (S(T).solve !== S(T).settings.lineup[round - 1]) return false;
      must(T, 'p2', 'giveUp', { round });
      if (round % 2) runClock(T, (r) => r.shared.phase !== 'solving', 30);
      else must(T, T.host, 'closeRound', { round });
      if (round < 5) must(T, T.host, 'nextRound', { round });
    }
    if (S(T).phase !== 'gameover') return false;
    must(T, T.host, 'playAgain', {});
    return S(T).round === 1 && S(T).solve === S(T).settings.lineup[0];
  },
  'xo:big'() {
    // «إكس أو الكبير»: nothing is secret on the nine boards; the generic probes (no `_` key, nobody else's
    // slice) are held over a whole game and the next, every move on the board the robot was sent to.
    const XB = new Function(readFileSync(srcPath('TicTacToe.js'), 'utf8') + ';return { xoBigLegal };')();
    const T = table('xo:big', 3, { gameId: 'xo' });
    const play = () => {
      for (let guard = 0; guard < 120 && S(T).phase === 'play'; guard++) {
        const s = S(T);
        act(T, s.seats[s.turn], 'move', { cell: pick(XB.xoBigLegal({ cells: s.cells, minis: s.minis, send: s.send })), move: s.moves });
      }
    };
    must(T, T.host, 'start', { size: 'big' });
    play();
    must(T, T.host, 'nextRound', { round: S(T).round });
    play();
    return S(T).phase === 'over' && S(T).big === true;
  },
  mission() {
    // المهمة السرية beside a night: files done (yes and no), swapped, caught right and wrong, taken
    // back; a game of المختلف played meanwhile; someone joining and someone leaving; then off - the
    // reveal - and closed.
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const room = {
      code: 'LEAK', version: 1, game: null, phase: 'lobby', hostId: 'p1',
      players: ids.map((id, i) => ({ id, name: NAMES[i] })), screens: [{ id: SCREEN }], shared: {}, secrets: {}
    };
    if (!report.has('mission')) report.set('mission', { moves: 0, probes: new Map(), leaks: new Map() });
    const T = { room, game: 'mission', ids, host: 'p1', dynamic: true };
    const H = () => T.room._mission || {};
    const tally = { yes: 0, no: 0, swap: 0, right: 0, wrong: 0 };
    must(T, 'p1', 'missionSet', { on: true, place: 'home', co: 'friends' });
    const step = () => {
      const people = T.room.players.filter((p) => !p.bot).map((p) => p.id);
      const pid = pick(people);
      const f = H().of && H().of[pid];
      const ask = (H().asks || []).find((a) => a.to === pid);
      if (ask) {
        const yes = Math.random() < 0.7;
        if (act(T, pid, 'missionAnswer', { id: ask.id, yes })) tally[yes ? 'yes' : 'no']++;
        return;
      }
      if (!f) return;
      const r = Math.random();
      if (r < 0.45) act(T, pid, 'missionDone', { n: f.n });
      else if (r < 0.55) { clock += 11 * 60 * 1000; if (act(T, pid, 'missionSwap', { n: f.n })) tally.swap++; }
      else if (r < 0.7) {
        clock += 6 * 60 * 1000;
        const who = pick(people.filter((x) => x !== pid));
        const right = H().of[who] && H().of[who].to === pid && !H().of[who].asked;
        if (act(T, pid, 'missionCatch', { who })) tally[right ? 'right' : 'wrong']++;
      } else if (r < 0.75) act(T, pid, 'missionCancel', {});
    };
    for (let i = 0; i < 120; i++) step();
    // A game beside it.
    must(T, 'p1', 'chooseGame', { game: 'imposter' });
    must(T, 'p1', 'start', { category: 'حيوانات', spies: 1 });
    for (let i = 0; i < 30; i++) step();
    must(T, 'p1', 'beginDiscussion');
    must(T, 'p1', 'startVote');
    for (const id of ids) { act(T, id, 'vote', { option: pick(ids.filter((x) => x !== id)) }); step(); }
    act(T, 'p1', 'closeVote');
    must(T, 'p1', 'backToHub');
    // Someone joins, someone leaves.
    T.room.players.push({ id: 'p6', name: NAMES[5] });
    missionJoined(T.room); scan(T, 'a join');
    T.room.players = T.room.players.filter((p) => p.id !== 'p2');
    missionPlayerLeft(T.room); scan(T, 'a leave');
    for (let i = 0; i < 120; i++) step();
    must(T, 'p1', 'missionSet', { on: false });
    must(T, 'p1', 'missionClose');
    return T.room.mission.phase === 'off' && tally.yes > 2 && tally.no > 0 && tally.swap > 0 && tally.right + tally.wrong > 0;
  },

  program() {
    // A night of three games: كدّاب played out by its turn clock (lies and calls on the pile),
    // المختلف cut short by the host, the trivia played out by its own clocks, to the finale.
    const ids = ['p1', 'p2', 'p3', 'p4'];
    const room = {
      code: 'LEAK', version: 1, game: null, phase: 'lobby', hostId: 'p1',
      players: ids.map((id, i) => ({ id, name: NAMES[i] })), screens: [{ id: SCREEN }], shared: {}, secrets: {}
    };
    if (!report.has('program')) report.set('program', { moves: 0, probes: new Map(), leaks: new Map() });
    const T = { room, game: 'program', ids, host: 'p1', dynamic: true };
    must(T, 'p1', 'programStart', { games: [
      { id: 'doubt', opts: { turnClock: 30, end: 'first' } },
      { id: 'imposter', opts: { undercover: true, lang: 'ar' } },
      { id: 'trivia', opts: { count: 5, lang: 'ar' } }
    ] });
    const P = () => T.room.program || {};
    runClock(T, (r) => r.game === 'doubt' && r.program.phase === 'playing', 20);
    // The table plays: whoever is up lays one card (truly or not); now and then someone calls.
    for (let guard = 0; guard < 3000 && P().phase === 'playing' && T.room.game === 'doubt'; guard++) {
      const s = S(T);
      if (s.last && Math.random() < 0.2) {
        const caller = ids.find((id) => id !== s.last.pid && (s.counts || {})[id] > 0);
        if (caller && act(T, caller, 'call', { play: s.last.id })) continue;
      }
      const up = s.turn && s.turn.pid;
      const hand = ((T.room.secrets || {})[up] || {}).hand || [];
      if (!up || !hand.length) { runClock(T, (r) => r.program.phase !== 'playing' || (r.shared.turn || {}).pid !== up, 3); continue; }
      const lead = s.turn.stage === 'lead';
      const rankOf = (c) => String(c.c).slice(0, -1);
      // Mostly the truth (all of a rank), a lie a quarter of the time.
      const rank = lead ? rankOf(pick(hand)) : s.rank;
      const same = hand.filter((c) => rankOf(c) === rank);
      const cards = same.length && Math.random() < 0.75 ? same : [pick(hand)];
      if (!act(T, up, 'play', { cards: cards.map((c) => c.i), rank: lead ? rank : undefined, seq: s.turnSeq })) {
        runClock(T, (r) => (r.shared.turn || {}).pid !== up || r.program.phase !== 'playing', 3);
      }
    }
    if (P().phase !== 'result') return false;
    runClock(T, (r) => r.game === 'imposter' && r.program.phase === 'playing', 40);
    must(T, 'p1', 'programSkip', { seq: P().seq });
    runClock(T, (r) => r.program.phase === 'final', 4000);
    return P().phase === 'final' && P().final.games === 3;
  },

  'trivia:quiz'() {
    const T = table('trivia:quiz', 4, { gameId: 'trivia' });
    T.pack = LEAK_QUIZ;
    must(T, T.host, 'start', { lang: 'ar', count: 5, pack: 'QZ7K2A' });
    for (let q = 0; q < 4; q++) {
      if (q) must(T, T.host, 'nextQuestion', { qIndex: q - 1 });
      if (q === 2) { runClock(T, (r) => r.shared.phase === 'results'); continue; }
      for (const id of T.ids) must(T, id, 'answer', { choice: Math.floor(Math.random() * 4), qIndex: q });
    }
    must(T, T.host, 'nextQuestion', { qIndex: 3 });
    must(T, T.host, 'playAgain', { lang: 'ar' });
    for (const id of T.ids) must(T, id, 'answer', { choice: 0, qIndex: 0 });
    return S(T).phase === 'results' && !!S(T).quiz;
  },
  'buzzer:quiz'() {
    const T = table('buzzer:quiz', 3, { gameId: 'buzzer' });
    T.pack = LEAK_QUIZ;
    must(T, T.host, 'start', { pack: 'QZ7K2A' });
    must(T, 'p2', 'buzz', { round: S(T).round });
    must(T, T.host, 'wrong', { id: 'p2' });
    must(T, 'p3', 'buzz', { round: S(T).round });
    must(T, T.host, 'correct', { id: 'p3' });
    must(T, T.host, 'quizNext', { n: 0 });
    must(T, T.host, 'quizReveal', { n: 1 });
    must(T, T.host, 'quizNext', { n: 1 });
    must(T, 'p2', 'buzz', { round: S(T).round });
    must(T, T.host, 'correct', { id: 'p2' });
    must(T, T.host, 'quizNext', { n: 2 });
    must(T, T.host, 'quizNext', { n: 3 });
    const done = S(T).quiz.done;
    // A TV host: nothing on the screen but what the table sees.
    const T2 = table('buzzer:quiz', 3, { gameId: 'buzzer', screenHost: true });
    T2.pack = LEAK_QUIZ;
    must(T2, T2.host, 'start', { pack: 'QZ7K2A' });
    must(T2, 'p1', 'buzz', { round: S(T2).round });
    must(T2, T2.host, 'quizReveal', { n: 0 });
    return done && S(T2).quiz.answer !== null;
  },
  'vault:all'() {
    // «الكل», a set of 3: every phone its lock and someone else's page; the set to its board.
    const T = table('vault:all', 5, { gameId: 'vault' });
    must(T, T.host, 'start', { way: 'all', mistakes: 'strikes', win: 'set', count: 3 });
    vaultPlay(T, 0.8, 1500);
    return S(T).phase === 'gameover' && S(T).why === 'done' && S(T).board.some((r) => r.score > 0);
  },
  'vault:teams'() {
    // «فريقين»: the same safe on both openers, the readers of each team their own pages; a leaver.
    const T = table('vault:teams', 6, { gameId: 'vault' });
    must(T, T.host, 'start', { way: 'teams', mistakes: 'time', count: 3 });
    vaultPlay(T, 0.85, 60);
    T.room.players = T.room.players.filter((p) => p.id !== 'p6');
    const next = structuredClone(T.room); roomPlayerLeft(next, 'p6', 'X'); T.room = next; scan(T, 'left');
    vaultPlay(T, 0.85, 1500);
    return S(T).phase === 'gameover';
  },
  'vault:tv'() {
    // The TV opens: its slice alone has the looks, every phone a page; a phone takes over half way.
    const T = table('vault:tv', 3, { gameId: 'vault' });
    must(T, T.host, 'start', { way: 'one', opener: 'tv', mistakes: 'strikes', win: 'set', count: 3 });
    if (!S(T).tvOpens) return false;
    vaultPlay(T, 0.85, 15);
    must(T, T.host, 'takeOver', {});
    vaultPlay(T, 0.85, 1500);
    return S(T).phase === 'gameover' && !S(T).tvOpens;
  },
  'imposter:words'() {
    const T = table('imposter:words', 4, { gameId: 'imposter' });
    T.pack = LEAK_WORDS;
    must(T, T.host, 'start', { category: '✍️ كلماتنا', spies: 1, pack: 'WRD234' });
    must(T, T.host, 'beginDiscussion');
    must(T, T.host, 'startVote');
    const spy = T.room._impSpies[0];
    for (const id of T.ids) act(T, id, 'vote', { option: id === spy ? T.ids.find((x) => x !== spy) : spy });
    if (S(T).guesserId) must(T, S(T).guesserId, 'guess', { word: S(T).options[0] });
    return T.room.phase === 'result';
  },
  'chess:hq'() {
    // Two games: one on a clock (White picks, Black's pick by the clock), one where the host picks for both;
    // moves at random, a hidden queen moved like a pawn now and then and like a queen a third of the time.
    const CH = new Function(readFileSync(srcPath('Chess.js'), 'utf8') + ';return { chessLegalMoves, chessHqMoves };')();
    const T = table('chess:hq', 3, { gameId: 'chess' });
    const play = () => {
      for (let guard = 0; guard < 160 && S(T).phase === 'play'; guard++) {
        const s = S(T);
        const up = s.seats[s.chess.g.turn];
        const mine = ((T.room.secrets || {})[up] || {}).hq || '';
        const extra = mine ? CH.chessHqMoves(s.chess.g, mine) : [];
        const legal = CH.chessLegalMoves(s.chess.g);
        const own = legal.filter((m) => m.from === mine);
        const m = extra.length && Math.random() < 0.33 ? pick(extra) : own.length && Math.random() < 0.4 ? pick(own) : pick(legal);
        must(T, up, 'move', { from: m.from, to: m.to, promo: m.promo, move: s.chess.moves });
      }
      if (S(T).phase === 'play') must(T, S(T).seats[0], 'resign', { round: S(T).round });
    };
    must(T, T.host, 'start', { variant: 'hq', clock: '3+2' });
    let s = S(T);
    const white = s.seats[0];
    must(T, white, 'hqPick', { sq: 'e2', round: s.round });
    runClock(T, (r) => !r.shared.chess.hq.picking, 5);
    if (S(T).chess.hq.picking) return false;
    play();
    must(T, T.host, 'nextRound', { round: S(T).round });
    must(T, T.host, 'skipTurn', { move: 0 });
    // A host sitting at the board picks their own pawn (the skip only picks for the other seat).
    [0, 1].forEach((c) => { if (S(T).chess.hq.picking && !S(T).chess.hq.picked[c]) must(T, S(T).seats[c], 'hqPick', { sq: c ? 'e7' : 'e2', round: S(T).round }); });
    play();
    s = S(T);
    return s.phase === 'over' && !!s.chess.hq.end;
  }
};

/* --- run ---------------------------------------------------------------------- */

console.log('• the leak check: every game played through, every phone checked after every move');
const only = process.argv.slice(2);
for (const game of ROOM_GAME_IDS.concat(Object.keys(TOUR_DRIVERS), Object.keys(VARIANT_DRIVERS)).filter((g) => !only.length || only.indexOf(g) !== -1)) {
  const driver = DRIVERS[game] || TOUR_DRIVERS[game] || VARIANT_DRIVERS[game];
  if (!driver) { failed++; console.log(`  ✗ ${game}: no driver in test/leaks.mjs, so its phones are not checked`); continue; }
  let finished = false, error = null;
  try { finished = driver.call(DRIVERS); } catch (e) { error = e.message; }
  const r = report.get(game) || { moves: 0, probes: new Map(), leaks: new Map() };
  const quiet = [...r.probes].filter(([, n]) => n === 0).map(([name]) => name).filter((n) => n.indexOf('vote shows') === -1);
  const problems = [];
  if (error) problems.push('the driver broke: ' + error);
  else if (!finished) problems.push('the driver did not reach the end of the game');
  for (const [name, where] of r.leaks) problems.push(`LEAK: ${name} (${where})`);
  for (const name of quiet) problems.push(`never came up, so never checked: ${name}`);
  if (problems.length) { failed++; problems.forEach((p) => console.log(`  ✗ ${game}: ${p}`)); }
  else console.log(`  ✓ ${game}: ${[...r.probes].filter(([, n]) => n).length} rules on every phone and the screen, ${r.moves} moves`);
}

Date.now = realNow;
console.log(failed ? `\n${failed} game(s) with a problem` : '\nno secret reached a phone it was not meant for');
process.exitCode = failed ? 1 : 0;
