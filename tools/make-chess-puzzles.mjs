/**
 * The chess puzzle bank: ChessPuzzles.js at the project root, made by the app's
 * own engine (Chess.js). Run by hand, not part of build:site:
 *
 *   cd tools && npm run build:puzzles
 *
 * How (notes/BATCH3_RUNBOOK.md, T3.1):
 *   1. Computer-vs-computer games, from the openings of the explorer
 *      (JS_ChessOpenings.html) and from random Chess960 starts, each side a
 *      rating from 1000 to 1800 (chessBestMove's noise and slips are where the
 *      tactics come from).
 *   2. Every position is screened with a quick analysis: a candidate is a
 *      position where the side to move is suddenly winning (the move before it
 *      was a mistake by at least two pawns, and the side to move wasn't already
 *      well ahead).
 *   3. A candidate is checked properly: the best move must be the only one that
 *      wins - a mate while nothing else mates, or +300 and at least 250 better
 *      than any other move. The line is followed (the reply is the engine's
 *      best) while the next move is again the only winner, up to three moves of
 *      the player. A mate must be seen through to the mate; a material puzzle
 *      must really win material by its end (two pawns or more, after the reply).
 *   4. Recaptures that only restore the balance, positions where every legal
 *      move takes the same piece, and a forced first move are thrown out.
 *
 * The second-best move is measured by playing each of the strongest few
 * alternatives and analysing the position after it with a full window (a
 * multi-line analysis ranks all the moves, but a move outside its first lines
 * only gets a bound: it can show the best move's own score).
 *
 * Deterministic: every game is seeded (mulberry32) from its number, every
 * search is bounded by positions, never by time (the clock handed to the
 * engine stands still), so two runs write the same file, whatever the number
 * of worker threads. Results per game are kept in the OS temp folder, so a run
 * that was stopped carries on where it was (delete the folder to start over).
 */
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');

/* ---- the settings; changing any of them changes the file ---- */
const CFG = {
  seed: 0x5ee0c0de,
  games: Number(process.env.PUZZLE_GAMES) || 2400,   // how many games are played (fixed, so the result is too)
  maxPly: 140,
  elo: [1000, 1800],
  playNodes: 20000,          // the players' search, at most
  screenNodes: 20000,        // the quick look at every position
  bestNodes: 200000,         // the best move of a candidate (the runbook's 200,000)
  rankNodes: 12000,          // every move ranked, to pick the alternatives worth a real look
  altCount: 4,               // how many alternatives are analysed properly
  altNodes: 60000,           // each alternative's position
  gap: 250, win: 300,        // the only winning move: +300 at least, 250 better than any other
  blunder: 200,              // the mistake that made the position: at least two pawns
  wasAhead: 400,             // ... by a side that wasn't already this far ahead
  minGain: 200,              // a material puzzle wins at least two pawns
  maxMoves: 3,               // player moves in a line
  branchRate: 0.5,           // how often a position also tries a mistake the game didn't make
  maxBranches: 30,           // ... at most this many a game
  plainRate: 0.15,           // how often a slip that just leaves a piece hanging is tried
  simpleRate: 0.3,
  mateRate: 0.5,             // how often a slip into a mate is preferred to the subtlest slip           // how often a candidate the shallowest search solves with a capture is checked
  per: { 1: 540, 2: 540, 3: 500 }, minPer: 400, maxBytes: 250 * 1024,
  rateDepth: 6,              // how deep the rating's search goes to find the first move
  hidden: 4,                 // the engine had to look this deep (or deeper) to find it: one level up
  samePly: 6,                // puzzles of one game at least this many plies apart
  sampleNodes: 1000000, sampleCount: 30
};
// Settings only the selection reads: changing them doesn't need the games played again.
const MAIN_ONLY = ['games', 'per', 'minPer', 'maxBytes', 'hidden', 'samePly', 'sampleNodes', 'sampleCount'];
// What a game's result depends on: the settings, the engine and the worker's code
// (not the selection below it), so the kept results are reused only when they would be the same.
function workerSource() {
  const src = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  return src.slice(src.indexOf('/* === worker'), src.indexOf('/* === main'));
}
const CFG_HASH = createHash('sha1').update(JSON.stringify(Object.fromEntries(Object.entries(CFG).filter(([k]) => !MAIN_ONLY.includes(k)))) + readFileSync(path.join(ROOT, 'Chess.js'), 'utf8') + workerSource()).digest('hex').slice(0, 10);

/* ---- the engine, loaded the way rooms-worker/test/rules.mjs does ---- */
function loadEngine() {
  const src = readFileSync(path.join(ROOT, 'Chess.js'), 'utf8');
  const CH = new Function(src + '\nreturn { chessNew, chessFromFen, chessFen, chessPlay, chessStatus, chessLegalMoves, chessBestMove, chessAnalyse, chess960Random, chessIsSacrifice, chessHanging, chessMaterialDiff, chessCloneGame, chessPos, chessLegalPos, chessSanPos, chessSqName, chessMFrom, chessMTo, chessMPromo, chessPromoLetter, CHESS_MATE };')();
  const op = readFileSync(path.join(ROOT, 'JS_ChessOpenings.html'), 'utf8').replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
  const OPEN = new Function(op + '; return CH_OPENINGS;')();
  return { CH, OPEN };
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const still = () => 0;                         // the engine's clock: never runs out, only the node counts stop it
const uci = (m) => m.from + m.to + (m.promo || '');
const fromUci = (s) => ({ from: s.slice(0, 2), to: s.slice(2, 4), promo: s.slice(4, 5) });
const posKey = (fen) => fen.split(' ').slice(0, 4).join(' ');

/* === worker ============================================================== */
function workerMain() {
  const { CH, OPEN } = loadEngine();
  const MATE = CH.CHESS_MATE;
  const isMate = (sc) => sc > MATE - 1000;
  const mateMoves = (sc) => Math.ceil((MATE - sc + 1) / 2);     // a mating score (for the player) in moves

  function sanOf(g, mv) {
    const q = CH.chessCloneGame(g);
    const info = CH.chessPlay(q, mv);
    return info ? info.san : '?';
  }

  // One step of a puzzle: is there exactly one move that wins here?
  function uniqueStep(g, first) {
    const A = CH.chessAnalyse(g, { nodes: CFG.bestNodes, now: still });
    if (A.over || !A.move) return null;
    const mateBest = A.mate > 0;
    if (!mateBest && A.score < CFG.win) return null;
    const legal = CH.chessLegalMoves(g);
    if (legal.length === 1) return first ? null : { move: A.move, score: A.score, mate: A.mate, second: -Infinity, only: true };
    const bestU = uci(A.move);
    // Every move ranked cheaply, then the strongest alternatives looked at properly.
    const R = CH.chessAnalyse(g, { nodes: CFG.rankNodes, lines: legal.length, now: still });
    const alts = (R.lines || []).map(l => l.move).filter(m => uci(m) !== bestU).slice(0, CFG.altCount);
    let second = -Infinity;
    for (const alt of alts) {
      const q = CH.chessCloneGame(g);
      const info = CH.chessPlay(q, alt);
      if (!info) continue;
      let sc;
      if (info.status.over) sc = info.status.reason === 'mate' ? MATE : 0;
      else sc = -CH.chessAnalyse(q, { nodes: CFG.altNodes, now: still }).score;
      if (sc > second) second = sc;
      // Another move does the job too: a mate as fast, or a win not 250 worse.
      if (mateBest ? isMate(sc) && mateMoves(sc) <= A.mate : A.score - sc < CFG.gap) return null;
    }
    if (!mateBest && second > A.score) return null;
    return { move: A.move, score: A.score, mate: A.mate, second: second };
  }

  // A candidate position (the player to move) turned into a puzzle, or null.
  function makePuzzle(fen, lastTo, fenBefore) {
    const g0 = CH.chessFromFen(fen);
    const legal0 = CH.chessLegalMoves(g0);
    // Every legal move takes the same piece: nothing to find.
    if (legal0.length && legal0.every(m => m.capture && m.to === legal0[0].to)) return null;
    const s1 = uniqueStep(g0, true);
    if (!s1) return null;
    const mateIn = s1.mate > 0 ? s1.mate : 0;
    if (mateIn > CFG.maxMoves) return null;
    const g = CH.chessFromFen(fen);
    const player = g.turn;
    const moves = [];
    const sans = [];
    let step = s1, mated = false;
    for (let k = 0; k < CFG.maxMoves; k++) {
      const info = CH.chessPlay(g, step.move);
      moves.push(uci(step.move)); sans.push(info.san);
      if (info.status.over) {
        if (info.status.reason === 'mate') { mated = true; break; }
        return null;                                   // a stalemate or a draw is no solution
      }
      if (mateIn && k + 1 >= mateIn) return null;       // the mate should have come by now
      if (k + 1 >= CFG.maxMoves) break;
      const R = CH.chessAnalyse(g, { nodes: CFG.bestNodes, now: still });
      if (!R.move) break;
      const replyInfo = CH.chessPlay(g, R.move);
      if (replyInfo.status.over) return null;
      const next = uniqueStep(g, false);
      if (!next) {
        if (mateIn) return null;                       // a mate not forced to the end
        // Undo the reply: the puzzle ends on the player's last move.
        return finish(fen, moves, sans, lastTo, fenBefore, player, g0, s1);
      }
      moves.push(uci(R.move)); sans.push(replyInfo.san);
      step = next;
    }
    if (mateIn) return mated ? { fen, moves, sans, theme: 'mate', mateIn: Math.ceil(moves.length / 2), first: s1 } : null;
    if (mated) return { fen, moves, sans, theme: 'mate', mateIn: Math.ceil(moves.length / 2), first: s1 };
    return finish(fen, moves, sans, lastTo, fenBefore, player, g0, s1);
  }

  // A material puzzle: the line, then the opponent's best reply, must have won something.
  function finish(fen, moves, sans, lastTo, fenBefore, player, g0, s1) {
    // A line ends on a blow (a capture, a check, a promotion): a quiet defensive
    // move after the material is won is not part of the puzzle.
    const sharp = [];
    const t = CH.chessFromFen(fen);
    for (const m of moves) { const info = CH.chessPlay(t, fromUci(m)); sharp.push(!!(info.capture || info.check || info.promo)); }
    while (moves.length > 1 && !sharp[moves.length - 1]) { moves = moves.slice(0, -2); sans = sans.slice(0, -2); }
    const g = CH.chessFromFen(fen);
    for (const m of moves) CH.chessPlay(g, fromUci(m));
    if (!CH.chessStatus(g).over) {
      const R = CH.chessAnalyse(g, { nodes: CFG.altNodes, now: still });
      if (R.move) CH.chessPlay(g, R.move);
    }
    const end = CH.chessMaterialDiff(g.board, player);
    const gain = end - CH.chessMaterialDiff(g0.board, player);
    if (gain < CFG.minGain) return null;
    // Taking back what was just taken, and nothing more: not a puzzle.
    const firstTo = moves[0].slice(2, 4);
    if (lastTo && firstTo === lastTo && fenBefore) {
      const before = CH.chessMaterialDiff(CH.chessFromFen(fenBefore).board, player);
      if (end - before < CFG.minGain) return null;
    }
    return { fen, moves, sans, theme: 'material', first: s1, gain };
  }

  // What the level and the rating are made from (worked out in main, so they can be
  // tuned without playing the games again): the player's moves, whether the first one
  // takes something or gives something up, and how many positions the engine needed
  // to look to find it (the depth: the deeper, the better hidden).
  function featuresOf(p, g0) {
    const n = Math.ceil(p.moves.length / 2);
    const cap = CH.chessLegalMoves(g0).some(m => uci(m) === p.moves[0] && m.capture);
    const sac = !!CH.chessIsSacrifice(g0, fromUci(p.moves[0]), p.first.score);
    let hid = CFG.rateDepth + 1;
    for (let d = 1; d <= CFG.rateDepth; d++) {
      const a = CH.chessAnalyse(g0, { depth: d, nodes: CFG.bestNodes, now: still });
      if (a.move && uci(a.move) === p.moves[0]) { hid = d; break; }
    }
    return { n, cap, sac, hid };
  }

  function playGame(i) {
    const rnd = mulberry32((CFG.seed ^ Math.imul(i + 1, 0x9E3779B1)) >>> 0);
    const eloPick = () => CFG.elo[0] + 100 * Math.floor(rnd() * ((CFG.elo[1] - CFG.elo[0]) / 100 + 1));
    const elos = [eloPick(), eloPick()];
    let g, is960 = false;
    if (rnd() < 0.2) { g = CH.chessFromFen(CH.chess960Random(rnd)); is960 = true; }
    else {
      g = CH.chessNew();
      const op = OPEN[Math.floor(rnd() * OPEN.length)];
      for (const san of op.moves.trim().split(/\s+/)) {
        const lm = CH.chessLegalMoves(g).find(m => sanOf(g, m).replace(/[+#]/g, '') === san.replace(/[+#?!]/g, ''));
        if (!lm) break;
        CH.chessPlay(g, lm);
      }
    }
    const found = [];
    let prev = null;             // the previous position's quick look, its FEN and the move played from it
    let screened = 0, candidates = 0, branches = 0;
    const tryCandidate = (fen, lastTo, fenBefore, ply, how) => {
      // A capture the shallowest search already sees, and nothing more: the bank has
      // plenty of those, so most are not even checked (the time goes to the longer ones).
      const g1 = CH.chessFromFen(fen);
      const q1 = CH.chessAnalyse(g1, { depth: 1, now: still });
      const q3 = CH.chessAnalyse(g1, { depth: 3, nodes: CFG.screenNodes, now: still });
      const simple = q1.move && q3.move && uci(q1.move) === uci(q3.move) && !(q3.mate > 0) &&
        CH.chessLegalMoves(g1).some(m => uci(m) === uci(q1.move) && m.capture);
      if (simple && rnd() >= CFG.simpleRate) return;
      candidates++;
      const p = makePuzzle(fen, lastTo, fenBefore);
      if (!p) return;
      const g0 = CH.chessFromFen(fen);
      const rec = { fen: p.fen, moves: p.moves, sans: p.sans, theme: p.theme, feat: featuresOf(p, g0), game: i, ply, how };
      if (p.mateIn) rec.mateIn = p.mateIn;
      rec.plain = plainGrab(p, g0);
      found.push(rec);
    };
    for (let ply = 0; ply < CFG.maxPly; ply++) {
      if (CH.chessStatus(g).over) break;
      const fen = CH.chessFen(g);
      // Every move ranked with a full window: the position's score, and the mistakes it offers.
      const S = CH.chessAnalyse(g, { nodes: CFG.screenNodes, lines: 256, now: still });
      screened++;
      if (prev && !(is960 && g.castle)) {
        const now = S.mate > 0 ? MATE : S.score;
        const before = prev.S.mate < 0 ? MATE : -prev.S.score;       // the player's view of the position before the mistake
        const winning = S.mate > 0 ? S.mate <= CFG.maxMoves : S.score >= CFG.win;
        if (winning && !(prev.S.mate < 0) && before <= CFG.wasAhead && now - before >= CFG.blunder) tryCandidate(fen, prev.to, prev.fen, ply, 'game');
      }
      // A mistake the side to move could have made here: the least bad of those that
      // hand the other side a winning position (a subtle slip, not a queen left hanging).
      if (branches < CFG.maxBranches && rnd() < CFG.branchRate && S.mate <= 0 && S.score >= -CFG.wasAhead && S.lines) {
        const slips = S.lines.slice(1).filter(l => {
          const theirs = l.mate < 0 ? (-l.mate <= CFG.maxMoves ? MATE : -Infinity) : -l.score;
          return theirs >= CFG.win && S.score - l.score >= CFG.blunder;
        });
        // A slip that leaves a piece hanging makes a one-capture puzzle, which the bank has
        // plenty of: those are tried only now and then; a slip that leaves nothing hanging
        // (a fork, a pin, a mate, a piece overloaded) is what the longer puzzles come from.
        let pick = null, q = null;
        // A slip that walks into a mate is taken half the time: the mates are the best puzzles.
        const mates = slips.filter(l => l.mate < 0);
        const order = mates.length && rnd() < CFG.mateRate ? mates.concat(slips.filter(l => l.mate >= 0)) : slips;
        for (const l of order) {
          const t = CH.chessCloneGame(g);
          CH.chessPlay(t, l.move);
          const hangs = t.board.some((pc, sq) => pc && (pc >> 3) === g.turn && CH.chessHanging(t.board, sq));
          if (!hangs || rnd() < CFG.plainRate) { pick = l; q = t; break; }
        }
        if (pick) {
          if (!CH.chessStatus(q).over && !(is960 && q.castle)) {
            branches++;
            tryCandidate(CH.chessFen(q), pick.move.to, fen, ply + 1, 'slip');
          }
        }
      }
      const L = CH.chessBestMove(g, { elo: elos[g.turn], rnd, now: still, nodes: CFG.playNodes });
      if (!L) break;
      prev = { S, fen, to: L.to };
      CH.chessPlay(g, L);
    }
    return { game: i, found, screened, candidates };
  }

  // One move that takes a piece nobody was guarding: the plainest puzzle there is.
  function plainGrab(p, g0) {
    if (p.moves.length !== 1 || p.theme === 'mate') return false;
    const m = CH.chessLegalMoves(g0).find(x => uci(x) === p.moves[0]);
    if (!m || !m.capture) return false;
    const q = CH.chessCloneGame(g0);
    CH.chessPlay(q, m);
    // After the capture, can the other side take back on that square?
    return !CH.chessLegalMoves(q).some(x => x.to === m.to && x.capture);
  }

  function sampleCheck(p) {
    const g = CH.chessFromFen(p.fen);
    const A = CH.chessAnalyse(g, { nodes: CFG.sampleNodes, now: still });
    const ok = A.move && uci(A.move) === p.moves[0] && (A.mate > 0 || A.score >= CFG.win);
    return { ok, move: A.move ? uci(A.move) : '', score: A.score, mate: A.mate };
  }

  parentPort.on('message', (msg) => {
    if (msg.type === 'game') parentPort.postMessage({ type: 'game', res: playGame(msg.i) });
    else if (msg.type === 'sample') parentPort.postMessage({ type: 'sample', id: msg.p.id, res: sampleCheck(msg.p) });
    else if (msg.type === 'stop') process.exit(0);
  });
}

/* === main ================================================================ */

// The level, by how long and how hidden (the runbook's rule): mate in n is level n; one
// move that takes something (or promotes) is 1; two moves, or a quiet first move (not a
// capture, a check or a promotion), 2; three moves, a sacrifice leading a longer line, or
// both of level 2's (two moves opened by a quiet one) 3; and one up when the engine had
// to look deep to find the first move.
const forcing = (p) => p.feat.cap || /[+#=]/.test(p.sans[0]);
function levelOf(p) {
  if (p.theme === 'mate') return Math.min(3, p.mateIn);
  const f = p.feat;
  const quiet = !forcing(p);
  let L = f.n >= 3 || (f.sac && f.n >= 2) || (f.n === 2 && quiet) ? 3 : (f.n === 2 || quiet || f.sac) ? 2 : 1;
  if (L < 3 && f.hid >= CFG.hidden) L++;
  return L;
}

// About 600 / 1100 / 1600, more when the engine needed more positions to find it, the
// line is longer or it mates.
function ratingOf(p) {
  const base = { 1: 600, 2: 1100, 3: 1600 }[p.level];
  const f = p.feat;
  const r = base - 150 + (f.hid - 1) * 60 + (f.n - 1) * 50 + (f.sac ? 60 : 0) + (forcing(p) ? 0 : 60) + (p.theme === 'mate' ? 30 : 0) + Math.min(90, p.fen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length * 3);
  return Math.max(base - 250, Math.min(base + 250, Math.round(r / 10) * 10));
}
async function main() {
  const t0 = Date.now();
  const cacheDir = path.join(os.tmpdir(), 'ashry-chess-puzzles', CFG_HASH);
  mkdirSync(cacheDir, { recursive: true });
  const nWorkers = Math.max(1, Math.min(Number(process.env.PUZZLE_WORKERS) || os.cpus().length - 2, 24));
  const self = fileURLToPath(import.meta.url);
  const workers = Array.from({ length: nWorkers }, () => new Worker(self, { workerData: { worker: true } }));
  const results = new Array(CFG.games);
  const todo = [];
  for (let i = 0; i < CFG.games; i++) {
    const f = path.join(cacheDir, `g${i}.json`);
    if (existsSync(f)) results[i] = JSON.parse(readFileSync(f, 'utf8'));
    else todo.push(i);
  }
  console.log(`chess puzzles: ${CFG.games} games (${CFG.games - todo.length} kept from an earlier run), ${nWorkers} threads, cache ${cacheDir}`);
  let done = 0, found = results.filter(Boolean).reduce((s, r) => s + r.found.length, 0);
  const total = todo.length;
  await Promise.all(workers.map(w => new Promise((resolve, reject) => {
    const next = () => {
      if (!todo.length) { resolve(); return; }
      w.postMessage({ type: 'game', i: todo.shift() });
    };
    w.on('message', (msg) => {
      if (msg.type !== 'game') return;
      const r = msg.res;
      results[r.game] = r;
      writeFileSync(path.join(cacheDir, `g${r.game}.json`), JSON.stringify(r));
      done++; found += r.found.length;
      if (done % 25 === 0 || done === total) {
        const el = (Date.now() - t0) / 1000;
        console.log(`  ${done}/${total} games, ${found} puzzles so far, ${el.toFixed(0)}s` + (done < total ? `, ~${Math.round(el / done * (total - done))}s to go` : ''));
      }
      next();
    });
    w.on('error', reject);
    next();
  })));

  // Every game's puzzles in order of game and ply; one per position, and not two from
  // the same moment of a game (the same tactic a move later is the same puzzle).
  const all = [];
  const seen = new Set();
  results.forEach(r => {
    let lastPly = -99;
    r.found.forEach(p => {
      const k = posKey(p.fen);
      if (seen.has(k) || p.ply - lastPly <= CFG.samePly) return;
      seen.add(k);
      lastPly = p.ply;
      p.level = levelOf(p);
      p.rating = ratingOf(p);
      all.push(p);
    });
  });
  const by = { 1: [], 2: [], 3: [] };
  all.forEach(p => by[p.level].push(p));
  console.log(`found ${all.length} distinct puzzles: level 1 ${by[1].length}, level 2 ${by[2].length}, level 3 ${by[3].length}`);
  for (const L of [1, 2, 3]) if (by[L].length < CFG.minPer) console.log(`  WARNING: level ${L} has ${by[L].length} < ${CFG.minPer}`);

  // The bank: the quota per level, spread over the games (a stride, not the first ones).
  const spread = (list, n) => {
    if (list.length <= n) return list.slice();
    const out = [];
    for (let j = 0; j < n; j++) out.push(list[Math.floor(j * list.length / n)]);
    return out;
  };
  const line = (p) => {
    const o = { id: p.id, fen: p.fen, moves: p.moves, theme: p.theme };
    if (p.mateIn) o.mateIn = p.mateIn;
    o.level = p.level; o.rating = p.rating;
    return JSON.stringify(o);
  };
  // Level 1: the tactics first; a piece simply left hanging only to make up the number.
  const pickLevel = (L, n) => {
    const list = by[L];
    const sharp = list.filter(p => !p.plain);
    if (sharp.length >= n) return spread(sharp, n);
    const plain = spread(list.filter(p => p.plain), n - sharp.length);
    return list.filter(p => sharp.includes(p) || plain.includes(p));
  };
  let per = { ...CFG.per };
  let bank, text;
  for (;;) {
    bank = [];
    for (const L of [1, 2, 3]) pickLevel(L, per[L]).forEach(p => bank.push(p));
    bank.forEach((p, j) => { p.id = j + 1; });
    text = header(bank) + 'const CHESS_PUZZLES = [\n' + bank.map(line).join(',\n') + '\n];\n';
    if (Buffer.byteLength(text) <= CFG.maxBytes) break;
    for (const L of [1, 2, 3]) per[L] = Math.max(CFG.minPer, Math.floor(per[L] * 0.95));
    if (per[1] === CFG.minPer && per[2] === CFG.minPer && per[3] === CFG.minPer) break;
  }
  const out = path.join(ROOT, 'ChessPuzzles.js');
  writeFileSync(out, text, 'utf8');
  const counts = [1, 2, 3].map(L => bank.filter(p => p.level === L).length);
  console.log(`wrote ChessPuzzles.js: ${bank.length} puzzles (level 1 ${counts[0]}, level 2 ${counts[1]}, level 3 ${counts[2]}), ${statSync(out).size} bytes`);
  const themes = { mate: 0, material: 0 };
  bank.forEach(p => { themes[p.theme]++; });
  console.log(`themes: ${themes.mate} mates, ${themes.material} material`);

  // Ten of each level, to look at.
  for (const L of [1, 2, 3]) {
    console.log(`\n--- level ${L}, ten puzzles ---`);
    spread(bank.filter(p => p.level === L), 10).forEach(p => console.log(`#${p.id} [${p.theme}${p.mateIn ? ' in ' + p.mateIn : ''}, ${p.rating}] ${p.fen}  ${p.sans.join(' ')}`));
  }

  // A sample of 30 checked again with five times the nodes.
  const sample = spread(bank, CFG.sampleCount);
  let sampleOk = 0;
  const pending = sample.slice();
  const checks = [];
  await Promise.all(workers.map(w => new Promise((resolve) => {
    const next = () => { if (!pending.length) { resolve(); return; } w.postMessage({ type: 'sample', p: pending.shift() }); };
    w.removeAllListeners('message');
    w.on('message', (msg) => { if (msg.type === 'sample') { checks.push(msg); next(); } });
    next();
  })));
  checks.sort((a, b) => a.id - b.id);
  console.log(`\n--- sample check: ${CFG.sampleCount} puzzles re-analysed at ${CFG.sampleNodes} nodes ---`);
  checks.forEach(c => {
    const p = bank.find(x => x.id === c.id);
    if (c.res.ok) sampleOk++;
    console.log(`  #${c.id} ${c.res.ok ? 'OK ' : 'BAD'} expected ${p.moves[0]}, engine ${c.res.move} (${c.res.mate > 0 ? 'mate in ' + c.res.mate : c.res.score})`);
  });
  console.log(`sample: ${sampleOk}/${checks.length} confirmed`);
  workers.forEach(w => w.postMessage({ type: 'stop' }));
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

function header(bank) {
  return `/**
 * Chess puzzles, made by the app's own engine (Chess.js) - ${bank.length} of them.
 * GENERATED by tools/make-chess-puzzles.mjs (cd tools && npm run build:puzzles);
 * do not edit by hand. Inlined into the page (SHARED_LISTS), not the rooms server.
 *
 * { id, fen, moves: [player, reply, player, ...] in UCI (e2e4, e7e8q),
 *   theme: 'mate' | 'material', mateIn?, level: 1 | 2 | 3, rating }
 * The side to move in fen is the player; every player move is the only one
 * that wins there. Checked by tools/validate-content.js.
 */
`;
}

if (isMainThread) main().catch(e => { console.error(e); process.exit(1); });
else if (workerData && workerData.worker) workerMain();
