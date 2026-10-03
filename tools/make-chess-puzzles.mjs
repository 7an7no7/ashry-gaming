/**
 * The chess puzzle bank: ChessPuzzles.js at the project root, made by the app's
 * own engine (Chess.js). Run by hand, not part of build:site:
 *
 *   cd tools && npm run build:puzzles
 *
 * How (notes/archive/plans/BATCH3_RUNBOOK.md, T3.1):
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
 *   5. Each puzzle is measured (featuresOf: moves, positions the engine needs,
 *      tempting wrong moves) and its motif tagged (motifOf: fork, skewer, pin,
 *      discovered, mate, ...); the selection in main rates the bank by
 *      difficulty, evenly from 400 to 2000, and its thirds are the levels.
 *      PUZZLE_OUT=<file> writes the bank somewhere else (to look before keeping).
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
  simpleRate: 0.15,
  mateRate: 0.5,             // how often a slip into a mate is preferred to the subtlest slip           // how often a candidate the shallowest search solves with a capture is checked
  total: 1500, maxGrab: 120, maxMate1: 140, minPer: 400, maxBytes: 270 * 1024,   // the bank: how many, how many single grabs at most
  rateDepth: 6,              // how deep the rating's search goes to find the first move
  hidden: 4,                 // the engine had to look this deep (or deeper) to find it: one level up
  samePly: 6,                // puzzles of one game at least this many plies apart
  sampleNodes: 1000000, sampleCount: 30
};
// Settings only the selection reads: changing them doesn't need the games played again.
const MAIN_ONLY = ['games', 'total', 'maxGrab', 'maxMate1', 'minPer', 'maxBytes', 'hidden', 'samePly', 'sampleNodes', 'sampleCount'];
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
  const CH = new Function(src + '\nreturn { chessNew, chessFromFen, chessFen, chessPlay, chessStatus, chessLegalMoves, chessBestMove, chessAnalyse, chess960Random, chessIsSacrifice, chessHanging, chessMaterialDiff, chessCloneGame, chessPos, chessLegalPos, chessSanPos, chessSqName, chessMFrom, chessMTo, chessMPromo, chessPromoLetter, chessMoveGood, chessForked, chessPins, chessAttacksFrom, chessSq, CHESS_MATE, CHESS_VALUE };')();
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
    // Tempting wrong moves: what looks as good as the answer at a glance (two plies,
    // every move scored with a full window), and the other checks and captures on offer.
    const legal = CH.chessLegalMoves(g0);
    const A2 = CH.chessAnalyse(g0, { depth: 2, nodes: CFG.rankNodes, lines: legal.length, now: still });
    const lines = A2.lines || [];
    const mine = lines.find(l => uci(l.move) === p.moves[0]);
    const bar = Math.min(mine ? mine.score : -Infinity, lines.length ? lines[0].score : -Infinity) - 60;
    const tempt = lines.filter(l => uci(l.move) !== p.moves[0] && l.score >= bar).length;
    const forcingAlts = legal.filter(m => uci(m) !== p.moves[0] && (m.capture || sanOf(g0, m).includes('+'))).length;
    // ... and at one ply (with its captures played out): the moves within a pawn and a half.
    const A1 = CH.chessAnalyse(g0, { depth: 1, nodes: CFG.rankNodes, lines: legal.length, now: still });
    const l1 = A1.lines || [];
    const mine1 = l1.find(l => uci(l.move) === p.moves[0]);
    const tempt1 = mine1 ? l1.filter(l => uci(l.move) !== p.moves[0] && l.score >= mine1.score - 150).length : l1.length;
    // How many positions the engine needs to look at before it settles on the answer.
    let hidNodes = 0;
    for (const nodes of [50, 150, 500, 1500, 5000, 15000, 50000]) {
      const a = CH.chessAnalyse(g0, { nodes, now: still });
      if (a.move && uci(a.move) === p.moves[0]) { hidNodes = nodes; break; }
    }
    return { n, cap, sac, hid, tempt, tempt1, forcingAlts, legal: legal.length, hidNodes: hidNodes || 150000 };
  }

  // The motif, from what the line does (Chess.js's own reasons, chessMoveGood, for the
  // fork): mate, fork, skewer, pin, a discovered attack, a promotion, a piece left
  // hanging, a sacrifice, or plain material.
  function motifOf(p, g0, feat) {
    if (p.theme === 'mate') return 'mate';
    const g = CH.chessFromFen(p.fen);
    const me = g.turn;
    const mv = p.moves.map(fromUci);
    const SQ = CH.chessSq;
    const dir = (a, b) => [Math.sign((b & 7) - (a & 7)), Math.sign((b >> 3) - (a >> 3))];
    const onRay = (a, b) => { const df = (b & 7) - (a & 7), dr = (b >> 3) - (a >> 3); return df === 0 || dr === 0 || Math.abs(df) === Math.abs(dr); };
    const seq = [];                 // every position before each move
    for (let k = 0; k < mv.length; k++) { seq.push(CH.chessCloneGame(g)); CH.chessPlay(g, mv[k]); }
    const laterTakes = (k, sq) => { for (let j = k + 2; j < mv.length; j += 2) if (mv[j].to === sq) return j; return -1; };
    for (let k = 0; k < mv.length; k += 2) {
      const before = seq[k];
      const after = CH.chessCloneGame(before);
      const info = CH.chessPlay(after, mv[k]);
      if (!info) break;
      const to = SQ(mv[k].to), from = SQ(mv[k].from);
      const kind = after.board[to] & 7;
      // A fork: the moved piece hits two worth having (chessMoveGood's reason), and the line cashes one.
      const fork = CH.chessMoveGood(before, mv[k], null).find(r => r.k === 'fork');
      if (fork && fork.targets.some(t => laterTakes(k, t) >= 0)) return 'fork';
      // A skewer: a line piece hits something big, it steps away, the piece behind it falls.
      if ((kind === 3 || kind === 4 || kind === 5) && k + 2 < mv.length) {
        const away = SQ(mv[k + 1].from), take = SQ(mv[k + 2].to);
        if (SQ(mv[k + 2].from) === to && CH.chessAttacksFrom(after.board, to).includes(away) && onRay(to, take)) {
          const d1 = dir(to, away), d2 = dir(to, take);
          const front = after.board[away], back = after.board[take];
          if (d1[0] === d2[0] && d1[1] === d2[1] && Math.max(Math.abs((take & 7) - (to & 7)), Math.abs((take >> 3) - (to >> 3))) > Math.max(Math.abs((away & 7) - (to & 7)), Math.abs((away >> 3) - (to >> 3))) &&
              front && back && ((front & 7) === 6 || CH.CHESS_VALUE[front & 7] >= CH.CHESS_VALUE[back & 7])) return 'skewer';
        }
      }
      // A pin: the move pins one of theirs, and the line takes the pinned piece.
      const pinsBefore = CH.chessPins(before.board, me ^ 1).map(x => x.sq);
      const pin = CH.chessPins(after.board, me ^ 1).find(x => x.by === mv[k].to && !pinsBefore.includes(x.sq));
      if (pin && laterTakes(k, pin.sq) >= 0) return 'pin';
      // A discovered attack: the move uncovers another piece of ours (a bishop, rook or
      // queen that stayed put) that now checks, or that later takes what it uncovered.
      for (let s = 0; s < 64; s++) {
        const pc = after.board[s];
        if (!pc || (pc >> 3) !== me || s === to || [3, 4, 5].indexOf(pc & 7) === -1) continue;
        const was = CH.chessAttacksFrom(before.board, s), now = CH.chessAttacksFrom(after.board, s);
        const fresh = now.filter(t => !was.includes(t) && after.board[t] && (after.board[t] >> 3) !== me);
        if (fresh.some(t => (after.board[t] & 7) === 6) && mv.length > k + 2) return 'discovered';
        for (const t of fresh) {
          const j = laterTakes(k, CH.chessSqName(t));
          if (j >= 0 && SQ(mv[j].from) === s && CH.CHESS_VALUE[after.board[t] & 7] >= 300) return 'discovered';
        }
      }
      if (info.promo || mv[k].promo) return 'promotion';
    }
    if (p.plain) return 'hanging';
    if (feat.sac) return 'sacrifice';
    return 'material';
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
      rec.motif = motifOf(rec, g0, rec.feat);
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

// How hard a puzzle really is, as one number (the review of 1 Oct 2026: the old rule gave
// three bands of ratings with gaps between them, and easy was nearly all one capture):
// the player's moves; how many positions the engine needed before it settled on the
// first move (hidNodes); the tempting wrong moves - how many others look about as good
// at one ply and at two (tempt1, tempt) - and how many other checks and captures are on
// offer; a quiet first move; a sacrifice; a busy board. A piece simply left hanging is
// the plainest of all.
const forcing = (p) => p.feat.cap || /[+#=]/.test(p.sans[0]);
function difficultyOf(p) {
  const f = p.feat;
  const pieces = p.fen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length;
  let d = (f.n - 1) * 0.6;
  d += 0.35 * Math.log10(Math.max(1, (f.hidNodes || 50) / 50));
  d += 0.08 * Math.min(15, f.tempt1 || 0);
  d += 0.15 * Math.min(6, f.tempt || 0);
  d += 0.05 * Math.min(10, f.forcingAlts || 0);
  if (!forcing(p)) d += 0.6;
  if (f.sac) d += 0.5;
  if (p.motif === 'hanging') d -= 0.4;
  d += Math.min(0.4, pieces * 0.012);
  return Math.round(d * 1000) / 1000;
}

// One move that takes something (the plainest kind): the bank keeps only so many.
const isGrab = (p) => p.theme !== 'mate' && p.feat.n === 1 && p.feat.cap;
// A mate in one: plenty of those too.
const isMate1 = (p) => p.theme === 'mate' && p.mateIn === 1;

// The ratings: the bank in order of difficulty, spread evenly from RATING_LO to RATING_HI
// (equal difficulty, equal rating), and the levels its thirds.
const RATING_LO = 400, RATING_HI = 2000;
function rateBank(bank) {
  const order = bank.slice().sort((a, b) => a.diff - b.diff || a.game - b.game || a.ply - b.ply);
  const n = order.length;
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && order[j + 1].diff === order[i].diff) j++;
    const mid = (i + j) / 2;
    const r = Math.round((RATING_LO + (RATING_HI - RATING_LO) * (n > 1 ? mid / (n - 1) : 0)) / 10) * 10;
    for (let k = i; k <= j; k++) order[k].rating = r;
    i = j + 1;
  }
  const cut1 = RATING_LO + (RATING_HI - RATING_LO) / 3, cut2 = RATING_LO + 2 * (RATING_HI - RATING_LO) / 3;
  bank.forEach(p => { p.level = p.rating < cut1 ? 1 : p.rating < cut2 ? 2 : 3; });
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
      p.diff = difficultyOf(p);
      all.push(p);
    });
  });
  const motifCount = (list) => { const m = {}; list.forEach(p => { m[p.motif] = (m[p.motif] || 0) + 1; }); return Object.entries(m).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${v}`).join(', '); };
  console.log(`found ${all.length} distinct puzzles (${all.filter(isGrab).length} single grabs): ${motifCount(all)}`);

  // The bank: spread over the whole range of difficulty (a stride through the puzzles in
  // order of difficulty), with at most maxGrab single grabs and maxMate1 mates in one, so
  // the easy third is made of forks, skewers and short mates too, and not only "take the
  // free piece".
  const spread = (list, n) => {
    if (list.length <= n) return list.slice();
    const out = [];
    for (let j = 0; j < n; j++) out.push(list[Math.floor(j * list.length / n)]);
    return out;
  };
  const byDiff = (list) => list.slice().sort((a, b) => a.diff - b.diff || a.game - b.game || a.ply - b.ply);
  const line = (p) => {
    const o = { id: p.id, fen: p.fen, moves: p.moves, theme: p.theme, motif: p.motif };
    if (p.mateIn) o.mateIn = p.mateIn;
    o.level = p.level; o.rating = p.rating;
    return JSON.stringify(o);
  };
  const grabs = byDiff(all.filter(isGrab)), mate1 = byDiff(all.filter(isMate1)), rest = byDiff(all.filter(p => !isGrab(p) && !isMate1(p)));
  let size = CFG.total;
  let bank, text;
  for (;;) {
    const nGrab = Math.min(CFG.maxGrab, grabs.length, Math.round(size * CFG.maxGrab / CFG.total));
    const nMate1 = Math.min(CFG.maxMate1, mate1.length, Math.round(size * CFG.maxMate1 / CFG.total));
    bank = spread(rest, size - nGrab - nMate1).concat(spread(grabs, nGrab), spread(mate1, nMate1));
    rateBank(bank);
    // Each level in the order its games were played, so a level's neighbours differ.
    bank.sort((a, b) => a.level - b.level || a.game - b.game || a.ply - b.ply);
    bank.forEach((p, j) => { p.id = j + 1; });
    text = header(bank) + 'const CHESS_PUZZLES = [\n' + bank.map(line).join(',\n') + '\n];\n';
    if (Buffer.byteLength(text) <= CFG.maxBytes || size <= 3 * CFG.minPer) break;
    size = Math.floor(size * 0.97);
  }
  for (const L of [1, 2, 3]) { const n = bank.filter(p => p.level === L).length; if (n < CFG.minPer) console.log(`  WARNING: level ${L} has ${n} < ${CFG.minPer}`); }
  const out = process.env.PUZZLE_OUT ? path.resolve(process.env.PUZZLE_OUT) : path.join(ROOT, 'ChessPuzzles.js');
  writeFileSync(out, text, 'utf8');
  const counts = [1, 2, 3].map(L => bank.filter(p => p.level === L).length);
  console.log(`wrote ChessPuzzles.js: ${bank.length} puzzles (level 1 ${counts[0]}, level 2 ${counts[1]}, level 3 ${counts[2]}), ${statSync(out).size} bytes`);
  const themes = { mate: 0, material: 0 };
  bank.forEach(p => { themes[p.theme]++; });
  console.log(`themes: ${themes.mate} mates, ${themes.material} material`);
  for (const L of [1, 2, 3]) {
    const lv = bank.filter(p => p.level === L);
    const rs = lv.map(p => p.rating);
    console.log(`level ${L}: ratings ${Math.min(...rs)}-${Math.max(...rs)}, ${lv.filter(isGrab).length} single grabs, ${lv.filter(isMate1).length} mates in one, motifs: ${motifCount(lv)}, moves 1/2/3: ${[1, 2, 3].map(n => lv.filter(p => p.feat.n === n).length).join('/')}`);
  }
  const hist = {};
  bank.forEach(p => { const b = Math.floor(p.rating / 200) * 200; hist[b] = (hist[b] || 0) + 1; });
  console.log('ratings by 200: ' + Object.keys(hist).sort((a, b) => a - b).map(k => `${k}: ${hist[k]}`).join(', '));

  // Ten of each level, to look at.
  for (const L of [1, 2, 3]) {
    console.log(`\n--- level ${L}, ten puzzles ---`);
    spread(bank.filter(p => p.level === L), 10).forEach(p => console.log(`#${p.id} [${p.motif}${p.mateIn ? ' in ' + p.mateIn : ''}, ${p.rating}, d ${p.diff}] ${p.fen}  ${p.sans.join(' ')}`));
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
 *   theme: 'mate' | 'material', motif: 'mate' | 'fork' | 'pin' | 'skewer' |
 *   'discovered' | 'promotion' | 'hanging' | 'sacrifice' | 'material',
 *   mateIn?, level: 1 | 2 | 3, rating (400-2000, spread by difficulty) }
 * The side to move in fen is the player; every player move is the only one
 * that wins there. Checked by tools/validate-content.js.
 */
`;
}

if (isMainThread) main().catch(e => { console.error(e); process.exit(1); });
else if (workerData && workerData.worker) workerMain();
