/* ============================================================================
   الشاهد — THE WITNESS (rooms), the owner's rules of 29 Sep 2026
   ----------------------------------------------------------------------------
   A family joke of a crime (who ate the last kunafa). Each round one player is
   the witness and the next in turn the sketch artist: the witness sees a face
   for 8 seconds on their own phone, then describes it out loud in their own
   words (the jury hears it too); the artist builds it on a face builder, 90
   seconds or less. Then the jury - everyone else - votes on a lineup of six
   faces very alike. The jury a point each for the right face; the witness and
   the artist a point each for every juror right. Everyone is the witness
   once. 3-12 players, the TV optional.

   What is hidden (never in shared until the reveal):
     room._witness.face   the real face, and room._witness.real its place in
                          the lineup. The witness's own phone gets the face in
                          its slice for the look only (room.secrets[witness]),
                          and the slice is emptied when the look ends.
     room._ballots        the jury's votes, the voting engine's (RoomGames.js).
   The sketch is public as it is built (the TV shows it drawn), and so is the
   lineup once the vote opens - six faces, not which is the real one.

   Phases (shared.phase):
     ready   the witness taps «وريني الوش» when the table is listening
     look    the face on the witness's phone for WITNESS_LOOK_MS (lookEndsAt)
     draw    the artist builds (sketch, sketchN), until done or drawEndsAt
     vote    the lineup; the jury votes until all have or voteEndsAt
     reveal  the real one, the votes, the points; the host's nextRound
     gameover  everyone has been the witness: the board
   Bundled after RoomGames.js (requireHost, requireMoveOn, staleTap, shuffled,
   openVote, castVote, closeVote, voteDropPlayer, roomPlayerName). Every name
   here starts with witness / WITNESS_ (Witness.js holds the faces' rules).
   ========================================================================= */
const WITNESS_LOOK_LEAD_MS = 400;    // the face reaches the phone over the network: the 8 s count from its arrival
const WITNESS_GRACE_MS = 600;        // a clock's moment on the server after the phones' own

const witnessHere = (room, id) => room.players.some(p => p.id === id);
/** The roster still in the room. */
const witnessPresent = (room) => ((room.shared || {}).roster || []).filter(id => witnessHere(room, id));

const witnessAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < WITNESS_MIN) throw new Error('محتاجين 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const roster = people.slice(0, WITNESS_MAX);
    // A crime a round, none twice in a game and the least recently dealt first across rooms (the review of 1 Oct 2026).
    const crimes = nextPrompts(room, Array.from({ length: WITNESS_CRIMES }, (_, i) => i), 'witness_crimes', roster.length);
    room.secrets = {};
    room._witness = null;
    room._ballots = null;
    room.shared = {
      roster,
      order: shuffled(roster),       // who is the witness, in turn; the artist is the next one here
      turn: -1,
      round: 0,
      rounds: roster.length,
      crimes,
      scores: {},
      gained: {},
      board: [],
      history: [],
      phase: 'ready'
    };
    room.phase = 'play';
    witnessStartRound(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase === 'gameover') return;

  if (action === 'ready') {
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'ready' || playerId !== s.witnessId) return;
    witnessStartLook(room);
    return;
  }
  if (action === 'sketch') {
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'draw' || playerId !== s.artistId) return;
    const n = Math.floor(Number(payload && payload.n));
    // Taps can arrive out of order: only a newer sketch replaces the one shown.
    if (isFinite(n) && n <= (s.sketchN || 0)) return;
    s.sketch = witnessClean(payload && payload.face);
    s.sketchN = isFinite(n) && n > 0 ? n : (s.sketchN || 0) + 1;
    return;
  }
  if (action === 'done') {
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'draw' || playerId !== s.artistId) return;
    if (payload && payload.face) s.sketch = witnessClean(payload.face);
    witnessOpenVote(room);
    return;
  }
  if (action === 'vote') {
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'vote') return;
    if (castVote(room, playerId, String((payload && payload.option) || ''))) witnessReveal(room);
    return;
  }
  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase === 'vote' && closeVote(room)) witnessReveal(room);
    return;
  }
  if (action === 'closeDraw') {
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase === 'draw') witnessOpenVote(room);
    return;
  }
  if (action === 'skipTurn') {
    // A witness who never taps «وريني الوش» (a locked phone): the round is passed over.
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'ready') return;
    s.skipped = (s.skipped || []).concat([s.witnessId]);
    witnessStartRound(room);
    return;
  }
  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'reveal') return;
    witnessStartRound(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** The next witness still here, and the next one after them as the artist; the game ends when nobody is left to be witness. */
const witnessStartRound = (room) => {
  const s = room.shared;
  room._witness = null;
  room._ballots = null;
  room.secrets = {};
  const present = witnessPresent(room);
  if (present.length < WITNESS_MIN) { witnessGameOver(room); return; }
  let turn = s.turn;
  let witnessId = null;
  while (++turn < s.order.length) {
    if (witnessHere(room, s.order[turn])) { witnessId = s.order[turn]; break; }
  }
  if (!witnessId) { witnessGameOver(room); return; }
  s.turn = turn;
  s.round = (s.round || 0) + 1;
  s.witnessId = witnessId;
  s.artistId = witnessNextAfter(room, witnessId, [witnessId]);
  s.crime = s.crimes[(s.round - 1) % s.crimes.length];
  s.phase = 'ready';
  s.lookEndsAt = null;
  s.drawEndsAt = null;
  s.voteEndsAt = null;
  s.sketch = null;
  s.sketchN = 0;
  s.lineup = null;
  s.vote = null;
  s.realIdx = null;
  s.right = null;
  s.picks = null;
  s.jury = null;
  s.gained = {};
  s.early = false;
};

/** The first one here after `id` in the order, going round, who isn't in `not`. */
const witnessNextAfter = (room, id, not) => {
  const o = room.shared.order;
  const at = o.indexOf(id);
  for (let k = 1; k <= o.length; k++) {
    const c = o[(at + k) % o.length];
    if (not.indexOf(c) === -1 && witnessHere(room, c)) return c;
  }
  return null;
};

/** The face is dealt now, when the witness is ready, and goes to their phone only. */
const witnessStartLook = (room) => {
  const s = room.shared;
  const lineup = witnessLineup(Math.random);
  room._witness = { faces: lineup.faces, real: lineup.real };
  room.secrets = {};
  room.secrets[s.witnessId] = { face: lineup.faces[lineup.real] };
  s.phase = 'look';
  s.lookEndsAt = Date.now() + WITNESS_LOOK_LEAD_MS + WITNESS_LOOK_MS;
};

/** The look is over: the face leaves the witness's phone, and the artist has the pencil. */
const witnessStartDraw = (room) => {
  const s = room.shared;
  room.secrets = {};
  s.phase = 'draw';
  s.drawEndsAt = Date.now() + WITNESS_DRAW_MS;
  s.sketch = witnessBlank('m');
  s.sketchN = 0;
};

/** The lineup goes up; the jury is everyone here but the witness and the artist. */
const witnessOpenVote = (room) => {
  const s = room.shared;
  const h = room._witness;
  if (!h) { witnessStartRound(room); return; }
  s.early = s.phase === 'draw' && Date.now() < (s.drawEndsAt || 0) - 1000;
  s.phase = 'vote';
  s.lineup = h.faces;
  s.drawEndsAt = null;
  const jury = witnessPresent(room).filter(id => id !== s.witnessId && id !== s.artistId);
  s.jury = jury;
  openVote(room, h.faces.map((_, i) => ({ id: 's' + (i + 1), label: String(i + 1) })), jury);
  s.voteEndsAt = Date.now() + WITNESS_VOTE_MS;
  // Nobody left to vote (they all left the room): straight to the answer.
  if (!jury.length && closeVote(room)) witnessReveal(room);
};

/** The real one, who picked it, and the points: a point a juror right; as many to the witness and the artist. */
const witnessReveal = (room) => {
  const s = room.shared;
  const h = room._witness;
  if (!h || s.phase !== 'vote') return;
  const ballots = room._ballots || {};
  const realId = 's' + (h.real + 1);
  const right = Object.keys(ballots).filter(id => ballots[id] === realId);
  s.phase = 'reveal';
  s.realIdx = h.real;
  s.voteEndsAt = null;
  // Who picked what, public now: the coins under each suspect.
  s.picks = {};
  Object.keys(ballots).forEach(id => { s.picks[id] = Number(String(ballots[id]).slice(1)) - 1; });
  s.right = right;
  s.gained = {};
  right.forEach(id => { addScore(room, id, 1); s.gained[id] = (s.gained[id] || 0) + 1; });
  [s.witnessId, s.artistId].forEach(id => {
    if (!id || !right.length) return;
    addScore(room, id, right.length);
    s.gained[id] = (s.gained[id] || 0) + right.length;
  });
  s.history = (s.history || []).concat([{ round: s.round, witnessId: s.witnessId, artistId: s.artistId, right: right.length, jury: (s.jury || []).length }]);
  s.board = witnessBoard(room);
  room._witness = null;
};

const witnessGameOver = (room) => {
  const s = room.shared;
  room._witness = null;
  room.secrets = {};
  s.phase = 'gameover';
  s.lookEndsAt = s.drawEndsAt = s.voteEndsAt = null;
  s.board = witnessBoard(room);
};

/** The board: everyone who played and is still here, best first. */
const witnessBoard = (room) => {
  const s = room.shared || {};
  return (s.roster || [])
    .filter(id => witnessHere(room, id))
    .map(id => ({ id, name: roomPlayerName(room, id), score: (s.scores || {})[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

/** The server's next moment: the end of the look, of the drawing, of the vote. */
const witnessDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return null;
  if (s.phase === 'look' && s.lookEndsAt) return s.lookEndsAt;
  if (s.phase === 'draw' && s.drawEndsAt) return s.drawEndsAt + WITNESS_GRACE_MS;
  if (s.phase === 'vote' && s.voteEndsAt) return s.voteEndsAt + WITNESS_GRACE_MS;
  return null;
};

const witnessTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return false;
  if (s.phase === 'look' && s.lookEndsAt && now >= s.lookEndsAt) { witnessStartDraw(room); return true; }
  if (s.phase === 'draw' && s.drawEndsAt && now >= s.drawEndsAt + WITNESS_GRACE_MS) { witnessOpenVote(room); return true; }
  if (s.phase === 'vote' && s.voteEndsAt && now >= s.voteEndsAt + WITNESS_GRACE_MS) {
    if (closeVote(room)) witnessReveal(room);
    return true;
  }
  return false;
};

/**
 * Someone left. Before the drawing starts, a witness gone passes the round over
 * and an artist gone hands the pencil to the next one here; mid-drawing, an
 * artist gone sends the sketch as it is to the vote. A juror gone takes their
 * ballot with them (the vote may close). Fewer than three to start a round ends
 * the game.
 */
const witnessPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || room.phase !== 'play' || s.phase === 'gameover') return;
  if (s.phase === 'ready' || s.phase === 'look') {
    if (witnessPresent(room).length < WITNESS_MIN) { witnessGameOver(room); return; }
    if (playerId === s.witnessId) { s.skipped = (s.skipped || []).concat([playerId]); witnessStartRound(room); return; }
    if (playerId === s.artistId) s.artistId = witnessNextAfter(room, s.witnessId, [s.witnessId]);
    return;
  }
  if (s.phase === 'draw') {
    if (playerId === s.artistId) witnessOpenVote(room);
    return;
  }
  if (s.phase === 'vote') {
    if (voteDropPlayer(room, playerId)) witnessReveal(room);
    return;
  }
  if (s.phase === 'reveal') s.board = witnessBoard(room);
};
