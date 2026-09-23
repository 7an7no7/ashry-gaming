/* ============================================================================
   إكس أو — the rules, once, for the page and the rooms server
   ----------------------------------------------------------------------------
   Inlined into the page (SHARED_LISTS in tools/build-*.mjs) for the game on
   one phone (JS_XO.html) and the room's phones (JS_RoomXO.html), and bundled
   into the Worker (FILES in rooms-worker/build.mjs) for the room
   (DUEL_KINDS.xo in RoomDuels.js): a mark on one phone and a mark in a room
   are judged by the same xoMark and xoWinner. No DOM, nothing that runs at
   load; every name starts with xo / XO_, since the page and the Worker are
   each one scope.

   A board is 9 cells ('' | 'X' | 'O'), 0-2 the top row, left to right.
   3 marks only (the owner, 22 Sep 2026): each side keeps XO_KEEP marks; a
   fourth takes the place of that side's oldest (`order[mark]`, oldest first),
   and the new mark can't go on the square of the one leaving - it is still on
   the board while the move is chosen. Six marks never fill nine squares, so
   with the rule there is no draw: play goes on until three in a row.
   ========================================================================= */

const XO_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const XO_KEEP = 3;          // marks a side keeps with the 3-marks rule

/** Three in a row ({ mark, line }), a full board ({ mark: 'D', line: null }), or null. */
function xoWinner(board) {
  for (const line of XO_LINES) {
    const a = line[0], b = line[1], c = line[2];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { mark: board[a], line: line };
  }
  return board.every(Boolean) ? { mark: 'D', line: null } : null;
}

/**
 * `mark` at `cell` on `board`, in place: null when the square is taken or not
 * on the board; otherwise { gone }, the square the mark took off with the
 * 3-marks rule (-1 when none). `order` is { X: [], O: [] }, kept for the rule.
 */
function xoMark(board, order, rule3, cell, mark) {
  const i = Number(cell);
  if (!(i >= 0 && i < 9 && Math.floor(i) === i) || board[i] || (mark !== 'X' && mark !== 'O')) return null;
  board[i] = mark;
  let gone = -1;
  if (rule3) {
    const mine = order[mark] || (order[mark] = []);
    mine.push(i);
    if (mine.length > XO_KEEP) {
      gone = mine.shift();
      board[gone] = '';
    }
  }
  return { gone: gone };
}
