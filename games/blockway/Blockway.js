/* ============================================================================
   سد الطريق (Block the Way): the board and its rules, read the same way by the
   rooms server (RoomBlockway.js judges every move) and the phones
   (JS_RoomBlockway.html: the squares you can step to, the ghost wall going red,
   the line saying how a wall changes each way home). Quoridor, rebuilt ours.

   A 9×9 board. A board `b` is plain data, kept in room.shared:
     sides  each seat's side: 'b' bottom (goes to row 0), 't' top (to row 8),
            'l' left (to column 8), 'r' right (to column 0)
     pos    each seat's square [row, col]; null once the seat has left
     walls  [{ r, c, o, by }]: a wall two squares long whose middle is the
            corner below-right of square (r, c), r and c 0..7; o 'h' lies
            between rows r and r+1 over columns c and c+1, 'v' between columns
            c and c+1 over rows r and r+1; `by` the seat that put it
     left   walls each seat still has
   A turn is one step or one wall. A wall may cross or lie on no other, and may
   never shut anyone (still on the board) in: a way home must stay open.
   Face to face: jump straight over; a wall (or a piece, or the edge) behind
   the other piece: a step to either side of it instead.
   ========================================================================== */
const BW_N = 9;
const BW_WALLS = { 2: 10, 4: 5 };
const BW_SIDES = { 2: ['b', 't'], 4: ['b', 'l', 't', 'r'] };
const BW_START = { b: [8, 4], t: [0, 4], l: [4, 0], r: [4, 8] };
const BW_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/** A fresh board for 2 or 4 seats. */
function bwNewBoard(n) {
  const sides = BW_SIDES[n === 4 ? 4 : 2];
  return {
    sides: sides.slice(),
    pos: sides.map(sd => BW_START[sd].slice()),
    walls: [],
    left: sides.map(() => BW_WALLS[sides.length])
  };
}

/** Is (r, c) home for a seat on `side`? */
function bwAtGoal(side, r, c) {
  return side === 'b' ? r === 0 : side === 't' ? r === BW_N - 1 : side === 'l' ? c === BW_N - 1 : c === 0;
}

/** The walls as two 8×8 maps, for quick looks: { h, v }. */
function bwGrid(walls) {
  const g = { h: new Uint8Array(64), v: new Uint8Array(64) };
  (walls || []).forEach(w => { (w.o === 'h' ? g.h : g.v)[w.r * 8 + w.c] = 1; });
  return g;
}

const bwIn = (r, c) => r >= 0 && r < BW_N && c >= 0 && c < BW_N;
const bwSlot = (m, r, c) => r >= 0 && r < 8 && c >= 0 && c < 8 && m[r * 8 + c] === 1;

/** Can a piece go from (r, c) to the square next to it (r2, c2), with no wall between? */
function bwOpen(g, r, c, r2, c2) {
  if (!bwIn(r2, c2)) return false;
  if (r2 === r - 1) return !(bwSlot(g.h, r - 1, c) || bwSlot(g.h, r - 1, c - 1));
  if (r2 === r + 1) return !(bwSlot(g.h, r, c) || bwSlot(g.h, r, c - 1));
  if (c2 === c + 1) return !(bwSlot(g.v, r, c) || bwSlot(g.v, r - 1, c));
  if (c2 === c - 1) return !(bwSlot(g.v, r, c - 1) || bwSlot(g.v, r - 1, c - 1));
  return false;
}

/**
 * Steps home from every square for a seat on `side`, walls only (pieces don't
 * block a way home): an array of 81, -1 where home can't be reached.
 */
function bwDistMap(g, side) {
  const d = new Array(81).fill(-1);
  const q = [];
  for (let r = 0; r < BW_N; r++) for (let c = 0; c < BW_N; c++) {
    if (bwAtGoal(side, r, c)) { d[r * 9 + c] = 0; q.push(r * 9 + c); }
  }
  for (let i = 0; i < q.length; i++) {
    const k = q[i], r = Math.floor(k / 9), c = k % 9;
    for (const [dr, dc] of BW_DIRS) {
      const r2 = r + dr, c2 = c + dc;
      if (!bwIn(r2, c2) || d[r2 * 9 + c2] !== -1 || !bwOpen(g, r, c, r2, c2)) continue;
      d[r2 * 9 + c2] = d[k] + 1;
      q.push(r2 * 9 + c2);
    }
  }
  return d;
}

/** Each seat's steps home (walls only), -1 for none, null for a seat that has left. */
function bwStepsHome(b, walls) {
  const g = bwGrid(walls || b.walls);
  return b.sides.map((sd, i) => (b.pos[i] ? bwDistMap(g, sd)[b.pos[i][0] * 9 + b.pos[i][1]] : null));
}

/** The seat on (r, c), or -1. */
function bwWhoAt(b, r, c) {
  for (let i = 0; i < b.pos.length; i++) if (b.pos[i] && b.pos[i][0] === r && b.pos[i][1] === c) return i;
  return -1;
}

/**
 * The squares `seat` can step to: [{ r, c, jump }] - next to it, over a piece
 * face to face, or beside that piece when something stands behind it.
 */
function bwSteps(b, seat, g) {
  const p = b.pos[seat];
  if (!p) return [];
  g = g || bwGrid(b.walls);
  const out = [];
  const add = (r, c, jump) => { if (!out.some(x => x.r === r && x.c === c)) out.push({ r, c, jump: !!jump }); };
  const [r, c] = p;
  for (const [dr, dc] of BW_DIRS) {
    const r1 = r + dr, c1 = c + dc;
    if (!bwOpen(g, r, c, r1, c1)) continue;
    if (bwWhoAt(b, r1, c1) === -1) { add(r1, c1, false); continue; }
    const r2 = r1 + dr, c2 = c1 + dc;
    if (bwOpen(g, r1, c1, r2, c2) && bwWhoAt(b, r2, c2) === -1) { add(r2, c2, true); continue; }
    // Something behind them: a step to either side of the piece in front.
    const side = dr ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
    side.forEach(([sr, sc]) => {
      const r3 = r1 + sr, c3 = c1 + sc;
      if (bwOpen(g, r1, c1, r3, c3) && bwWhoAt(b, r3, c3) === -1 && !(r3 === r && c3 === c)) add(r3, c3, true);
    });
  }
  return out;
}

/**
 * Can wall `w` go down? { why: '' , steps } when it can (`steps`: each seat's
 * steps home with it down, null for a seat that has left); else why: 'bounds',
 * 'overlap' (it lies on or crosses one), or 'shut' with `who` (the seats it
 * would shut in).
 */
function bwWallCheck(b, w) {
  const r = Number(w && w.r), c = Number(w && w.c), o = w && w.o;
  if (!(o === 'h' || o === 'v') || !(r >= 0 && r < 8 && c >= 0 && c < 8) || Math.floor(r) !== r || Math.floor(c) !== c) return { why: 'bounds' };
  const g = bwGrid(b.walls);
  const hit = o === 'h'
    ? bwSlot(g.h, r, c) || bwSlot(g.h, r, c - 1) || bwSlot(g.h, r, c + 1) || bwSlot(g.v, r, c)
    : bwSlot(g.v, r, c) || bwSlot(g.v, r - 1, c) || bwSlot(g.v, r + 1, c) || bwSlot(g.h, r, c);
  if (hit) return { why: 'overlap' };
  (o === 'h' ? g.h : g.v)[r * 8 + c] = 1;
  const who = [];
  const steps = b.sides.map((sd, i) => {
    if (!b.pos[i]) return null;
    const d = bwDistMap(g, sd)[b.pos[i][0] * 9 + b.pos[i][1]];
    if (d < 0) who.push(i);
    return d;
  });
  return who.length ? { why: 'shut', who } : { why: '', steps };
}

/**
 * One move by `seat`: { to: [r, c] } a step, or { wall: { r, c, o } }.
 * Applied to `b`; returns { kind: 'step' | 'wall', home, jump, from }.
 * Throws (in the app's words) on anything the rules don't allow.
 */
function bwPlay(b, seat, m) {
  if (!b.pos[seat]) throw new Error('انت خرجت من اللعبة دي');
  if (m && m.wall) {
    if (!(b.left[seat] > 0)) throw new Error('خلصت أسوارك');
    const w = { r: Number(m.wall.r), c: Number(m.wall.c), o: m.wall.o === 'v' ? 'v' : 'h' };
    const chk = bwWallCheck(b, w);
    if (chk.why === 'shut') throw new Error('السور ده يقفل الطريق خالص');
    if (chk.why) throw new Error('السور ده مش هينفع هنا');
    w.by = seat;
    b.walls.push(w);
    b.left[seat] -= 1;
    return { kind: 'wall', home: false, jump: false, wall: w };
  }
  const to = m && Array.isArray(m.to) ? [Number(m.to[0]), Number(m.to[1])] : null;
  const step = to && bwSteps(b, seat).find(x => x.r === to[0] && x.c === to[1]);
  if (!step) throw new Error('مش هتعرف تروح المربع ده');
  const from = b.pos[seat].slice();
  b.pos[seat] = [step.r, step.c];
  return { kind: 'step', home: bwAtGoal(b.sides[seat], step.r, step.c), jump: step.jump, from };
}

/* --- seeing the board from your own side ---------------------------------------
   A phone turns the board so its own piece starts at the bottom: `k` quarter
   turns anticlockwise (the seat's place in BW_SIDES' order). bwTurnSq / bwTurnWall
   take a square or a wall from the board to the screen; bwUnturn* the way back. */
function bwTurnSq(r, c, k) {
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) { const t = r; r = 8 - c; c = t; }
  return [r, c];
}
function bwUnturnSq(r, c, k) {
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) { const t = c; c = 8 - r; r = t; }
  return [r, c];
}
function bwTurnWall(w, k) {
  let r = w.r, c = w.c, o = w.o;
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) { const t = r; r = 7 - c; c = t; o = o === 'h' ? 'v' : 'h'; }
  return { r, c, o };
}
function bwUnturnWall(w, k) {
  let r = w.r, c = w.c, o = w.o;
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) { const t = c; c = 7 - r; r = t; o = o === 'h' ? 'v' : 'h'; }
  return { r, c, o };
}

/** The computer players' levels: the host's lobby choice. */
const BW_LEVELS = ['easy', 'mid', 'hard'];
