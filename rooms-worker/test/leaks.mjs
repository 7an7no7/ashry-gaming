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
import { applyRoomAction, roomDeadline, roomTimeout, normaliseClue, ROOM_GAME_IDS } from '../generated/rules.js';
import { roomView } from '../src/view.js';

// The countries, for the engine's خمّن الدولة driver to guess with (one sets, everyone solves).
const SOLVE_LISTS = new Function(readFileSync(new URL('../../Countries.js', import.meta.url), 'utf8') + '\nreturn { COUNTRIES };')();

const realNow = Date.now;
let clock = realNow();
Date.now = () => clock;

const SCREEN = 'the-screen';   // not 'tv': that is Tuvalu, a country خمّن الدولة can deal
const ONLINE = { has: () => true };        // every phone connected
const NAMES = ['نور', 'Adam', 'سلمى', 'Omar', 'هنا', 'Karim', 'ليلى', 'Sam'];
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
    return out;
  },
  drawguess(room) {
    const s = room.shared || {};
    return [secret('only the drawer is told the word', s.word ? null : room._word, [s.drawerId])];
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
  wavelength(room) {
    const s = room.shared || {};
    const open = s.phase === 'clue' || s.phase === 'dial';
    return [probe('only the psychic sees the target', open, (view, pid) =>
      (hasKey(view.shared, 'target') ? 'shared.target' : (pid !== s.psychicId && view.you && 'target' in view.you ? 'you.target' : null)))];
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
    const open = s.phase === 'clues' || s.phase === 'voting' || s.phase === 'guess';
    return [
      probe('the word stays hidden until the result', open, (view) => (hasKey(view.shared, 'secretWord') ? 'shared.secretWord' : null)),
      probe('the chameleon is told nothing', open, (view, pid) => (pid === room._chamId && view.you && 'secret' in view.you ? 'you.secret' : null)),
      probe('who the chameleon is stays hidden until the vote', s.phase === 'clues' || s.phase === 'voting', (view) =>
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
      'shared.maxTries', 'shared.pub', 'shared.setterAt', 'shared.endsAt', 'you.board.hints', 'you.n',
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
        const bad = Object.keys(prog[id]).find((k) => ['n', 'state', 'at', 'rows', 'best'].indexOf(k) === -1);
        if (bad) return 'shared.progress.' + id + '.' + bad;
        if ((prog[id].rows || []).some((r) => !/^[cpa]+$/.test(r))) return 'shared.progress.' + id + '.rows (a letter)';
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
      out.push(secret('the answer stays on the server while answering', card.a, []));
      for (const alt of card.alt || []) out.push(secret('the other spellings of the answer too', alt, []));
    }
    const deck = room._deck || [];
    for (let k = (room._qIdx || 0) + 1; k < deck.length; k++) out.push(secret('cards to come stay on the server', deck[k].a, []));
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
    const out = [];
    for (const id of Object.keys(hands)) for (const card of hands[id]) {
      out.push(secret('a card\'s year stays on the server while it is in a hand', card.y, []));
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
    return [
      probe('a secret face is on its own phone only', live, (view, pid) => {
        if (!view.you || view.you.face === undefined) return null;
        const seat = (s.seats || []).indexOf(pid);
        return seat === -1 || g.secret[seat] !== view.you.face ? 'you.face' : null;
      }),
      probe('the faces are shown only once the game is over', live, (view) => (hasKey(view.shared, 'reveal') ? 'shared.reveal' : null))
    ];
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
    return [
      secret('the word is on the writer\'s phone only, until the word ends', live ? h.word : null, s.setter ? [s.setter] : []),
      probe('a board\'s letters reach its own phone only', live, (view, pid) => {
        if (!view.you || view.you.word !== undefined) return null;
        const b = h.boards[pid];
        return !b || JSON.stringify(view.you.g) !== JSON.stringify(b.g) ? 'you.g' : null;
      }),
      probe('the table sees how far each board is, never its letters', live, (view) => {
        const bad = Object.keys(view.shared.progress || {}).find((id) =>
          Object.keys(view.shared.progress[id]).some((k) => ['n', 'miss', 'state', 'at'].indexOf(k) === -1));
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
  // Nothing hidden: the generic rules still hold.
  wouldyou: () => [], mostlikely: () => [], buzzer: () => [], monkey: () => [],
  connect4: () => [], dots: () => [], xo: () => [], ludo: () => [], bowling: () => [],
  // شطرنج: the whole game is on the table.
  chess: () => []
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
  const probes = GENERIC(room).concat(T.tourOf ? tourProbes(room, T.tourOf) : (PROBES[game] || (() => []))(room));
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
  must(T, T.host, 'chooseGame', { game: opts.tourOf || game });
  return T;
};

/** A move, applied as room.js applies one. False when the rules refuse it. */
const act = (T, pid, action, payload = {}) => {
  const next = structuredClone(T.room);
  try {
    applyRoomAction(next, pid, action, payload);
  } catch (e) {
    T.lastError = e.message;
    return false;
  }
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
      must(T, s.guesserId, 'submitGuess', { guess: 'بحر' });
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
    for (const id of T.ids) {
      const own = (T.room.secrets[id] || {}).voteOwn;
      must(T, id, 'vote', { option: S(T).vote.options.find((o) => o.id !== own).id });
    }
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
  wavelength() {
    const T = table('wavelength', 3);
    must(T, T.host, 'start', { lang: 'ar' });
    const s = S(T);
    must(T, s.psychicId, 'giveClue', { clue: 'سخن' });
    must(T, T.ids.find((id) => id !== s.psychicId), 'setDial', { dial: 40 });
    must(T, T.host, 'lockDial');
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
    return S(T).phase === 'results';
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
    for (const id of T.ids) must(T, id, 'submit', { statements: [id + ' جملة أولى', id + ' جملة تانية', id + ' جملة تالتة'], lie: 1 });
    for (let guard = 0; guard < 6 && S(T).phase !== 'gameover'; guard++) {
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
  proverbs: () => DRIVERS.quizGame('proverbs'),
  quizGame(game) {
    const T = table(game, 3);
    must(T, T.host, 'start', { lang: 'ar', count: 5 });
    for (let q = 0; q < 5; q++) {
      if (q) must(T, T.host, 'nextQuestion');
      must(T, 'p2', 'guess', { text: 'غلط تماما' });
      if (q === 1) must(T, 'p3', 'guess', { text: T.room._card.a });
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
  uno: () => DRIVERS.withBots('uno', 3, { turnClock: 30 }),
  domino: () => DRIVERS.withBots('domino', 3, { turnClock: 30 }),
  ludo: () => DRIVERS.withBots('ludo', 3, { turnClock: 15 }),
  bank: () => DRIVERS.withBots('bank', 2, { length: 30, turnClock: 60 }, 2500),
  withBots(game, bots, options, steps) {
    const T = table(game, 1);
    for (let i = 0; i < bots; i++) must(T, T.host, 'addBot', { level: i % 2 ? 'hard' : 'easy', name: 'زيزو' });
    must(T, T.host, 'start', options);
    runClock(T, (r) => r.shared.phase === 'gameover' || r.shared.phase === 'over', steps || 4000);
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
    return S(T).phase === 'over';
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
        // A list answer must be the truth (a wrong one is refused); out loud or typed, anything goes.
        if (s.stage === 'answer') { const y = Math.random() < 0.5; if (!act(T, other, 'answer', { yes: y, seq })) must(T, other, 'answer', { yes: !y, seq }); continue; }
        if (s.stage === 'flip') { act(T, me, 'flip', { face: pick(up(s, s.turn)), down: true }); must(T, me, 'done', { seq: S(T).turnSeq }); continue; }
        // A random flip by hand can put down the face being looked for: late on, guess any face not guessed yet.
        const tried = s.log.filter((e) => e.kind === 'guess' && e.seat === s.turn).map((e) => e.face);
        const fresh = s.faces.map((_, i) => i).filter((i) => tried.indexOf(i) === -1);
        const left = up(s, s.turn).filter((i) => tried.indexOf(i) === -1);
        if (left.length <= 2 || guard > 40) { must(T, me, 'guess', { face: pick(left.length && guard <= 60 ? left : fresh), seq }); continue; }
        if (Math.random() < 0.15) { must(T, me, 'loud', { seq }); continue; }
        if (Math.random() < 0.15) { must(T, me, 'typed', { text: pick(['شعره طويل؟', 'Is she smiling?']), seq }); continue; }
        const open = Array.from({ length: 18 }, (_, i) => i).filter((i) => s.asked[s.turn].indexOf(i) === -1);
        if (!open.length || !act(T, me, 'ask', { q: pick(open), seq })) must(T, me, 'guess', { face: pick(left), seq });
      }
    };
    must(T, T.host, 'start', {});
    play();
    must(T, T.host, 'nextRound', { round: S(T).round });
    play();
    must(T, T.host, 'backToHub');
    must(T, T.host, 'chooseGame', { game: 'guesswho' });
    must(T, T.host, 'start', { pick: 'choose', autoFlip: false, wrong: 'turn', size: 16 });
    play();
    return S(T).phase === 'over';
  },
  hangman() {
    const T = table('hangman', 3);
    const AR = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' ');
    const play = () => {
      for (let guard = 0; guard < 400 && S(T).phase !== 'gameover'; guard++) {
        const s = S(T);
        if (s.phase === 'writing') { must(T, s.setter, 'setWord', { word: pick(['مدرسة', 'برتقال', 'قطة', 'زرافة']), round: s.round }); continue; }
        if (s.phase === 'result') { must(T, T.host, 'nextRound', { round: s.round }); continue; }
        const playing = Object.keys(s.progress).filter((id) => s.progress[id].state === 'play');
        if (!playing.length) break;
        for (const id of playing) {
          if (Math.random() < 0.08) act(T, id, 'whole', { text: pick(['موز', 'مدرسه', 'برتقال']), round: s.round });
          else act(T, id, 'guess', { letter: pick(AR), round: s.round });
        }
      }
    };
    must(T, T.host, 'start', { rounds: 3 });
    play();
    must(T, T.host, 'backToHub');
    must(T, T.host, 'chooseGame', { game: 'hangman' });
    must(T, T.host, 'start', { mode: 'race', rounds: 3, lang: 'ar', clock: 60 });
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
  chess() {
    // Moves at random until the game ends (mate, a draw, or a resignation after 200), then the next game on a clock that runs out.
    const CH = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') + ';return { chessLegalMoves };')();
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
  }
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
      if (g.stage === 'answer') { const y = Math.random() < 0.5; if (!act(T, other, 'answer', Object.assign({ yes: y, seq }, base))) act(T, other, 'answer', Object.assign({ yes: !y, seq }, base)); continue; }
      if (g.stage === 'flip') { act(T, me, 'done', Object.assign({ seq }, base)); continue; }
      if (Math.random() < 0.3) { act(T, me, 'guess', Object.assign({ face: pick(g.faces.map((_, i) => i)), seq }, base)); continue; }
      const open = Array.from({ length: 18 }, (_, i) => i).filter((i) => g.asked[g.turn].indexOf(i) === -1);
      if (!open.length || !act(T, me, 'ask', Object.assign({ q: pick(open), seq }, base))) act(T, me, 'loud', Object.assign({ seq }, base));
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
    const CH = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') + ';return { chessLegalMoves };')();
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

/* --- run ---------------------------------------------------------------------- */

console.log('• the leak check: every game played through, every phone checked after every move');
const only = process.argv.slice(2);
for (const game of ROOM_GAME_IDS.concat(Object.keys(TOUR_DRIVERS)).filter((g) => !only.length || only.indexOf(g) !== -1)) {
  const driver = DRIVERS[game] || TOUR_DRIVERS[game];
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
