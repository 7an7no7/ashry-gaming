/* ============================================================================
   كونكت ٤ · نقط ومربعات · إكس أو in rooms: who plays next (5 Oct 2026)
   ----------------------------------------------------------------------------
   The winner-stays line, read the same way by the server (RoomDuels.js, which
   seats the next game) and the phones (JS_RoomConnect4.html, which show who is
   next) - one copy instead of two kept in step. `players` is the room's list,
   `shared` its shared state (room.shared on the server, state.shared on a
   phone).
   ========================================================================== */

/**
 * Who is waiting, in order: the line as it was, then anyone in the room who
 * is on it nowhere yet (they joined since), less `exclude` and anyone gone.
 */
function duelWaitingOf(players, shared, exclude) {
  const here = (players || []).map(p => p.id);
  const skip = exclude || [];
  const out = ((shared && shared.line) || []).filter(id => here.indexOf(id) !== -1 && skip.indexOf(id) === -1);
  here.forEach(id => { if (out.indexOf(id) === -1 && skip.indexOf(id) === -1) out.push(id); });
  return out;
}

/**
 * Who sits down for the next game: { seats: [first to move, second], line },
 * or null when fewer than two are here. The champion stays and the first in
 * line challenges, moving first; with only the same two in the room, they swap
 * who goes first; with no champion (they left), the first two in line.
 */
function duelNextOf(players, shared) {
  const s = shared || {};
  const here = (players || []).map(p => p.id);
  const last = s.seats || [];
  const champ = s.champ && here.indexOf(s.champ) !== -1 ? s.champ : null;
  const waiting = duelWaitingOf(players, s, champ ? [champ] : []);
  if (champ && waiting.length === 1 && here.length === 2 && last.indexOf(waiting[0]) !== -1 && last.indexOf(champ) !== -1) {
    return { seats: [last[1], last[0]], line: [] };
  }
  if (champ && waiting.length) return { seats: [waiting[0], champ], line: waiting.slice(1) };
  if (!champ && waiting.length >= 2) return { seats: [waiting[0], waiting[1]], line: waiting.slice(2) };
  return null;
}

/**
 * The think clock's choices in winner stays (the owner's picks 1022 and 1031, 7 Oct 2026), in
 * seconds a move, 0 off (the default): the lobby offers them and the server takes only these.
 */
const DUEL_THINK = { connect4: [0, 15, 30], dots: [0, 20, 40] };
