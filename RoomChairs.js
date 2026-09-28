/* ============================================================================
   الكراسي الموسيقية — MUSICAL CHAIRS (rooms), the owner's rules of 27 Sep 2026
   ----------------------------------------------------------------------------
   Every phone is a player. The music plays (on the TV, or the host's phone),
   the server stops it at a moment nobody can predict, and every screen shows
   «اقعد!»: the fastest taps get the chairs (players − 1), the last one
   standing is out. One out a round until one is left.

   What is hidden: the stop moment, and the fake pauses. They live in
   room._chairs (never projected), like the bomb's fuse. Everything else is
   shared: the alive players, who sat in what order, the loser, the wins.

   Fair on the network: a tap carries `at`, the phone's estimate of the server
   time it was made at (the phone knows the server's clock from serverNow),
   and the server keeps it only inside the window it can prove - not before
   the music stopped, not after the tap arrived. A tap with no usable `at` is
   timed by its arrival. So a slow connection doesn't lose a chair, and a
   phone can't claim a time it hadn't seen yet.

   Phases (shared.phase):
     music   the music plays from startAt; a tap now is a false start and ends
             the round with that player out (the owner's rule)
     sit     the music stopped at stopAt; taps are ranked; closes when every
             alive player has sat or CHAIRS_SIT_MS after the stop (no tap = last)
     result  who is out, the order; the next round starts at nextAt, or on the
             host's nextRound
     gameover  one left: the winner, the places, the wins tally
   Bundled after RoomGames.js (its helpers: requireHost, roomPlayerName,
   shuffled, staleTap). Every name here starts with chairs / CHAIRS_.
   ========================================================================= */
const CHAIRS_MIN = 3;
const CHAIRS_MAX = 12;
const CHAIRS_MUSIC_MS = [5000, 20000];   // the music plays for a random length inside this
const CHAIRS_SIT_MS = 3000;             // after the stop, whoever hasn't tapped is last
const CHAIRS_FAKE_MS = 600;             // a fake pause is this long
const CHAIRS_BETWEEN_MS = 5500;         // the result stays this long before the next round
const CHAIRS_GRACE_MS = 40;             // a tap may claim up to this before the server heard the stop land (clock drift)

const chairsRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/** The players still in, in the room. */
const chairsAlive = (room) => (room.shared.alive || []).filter(id => room.players.some(p => p.id === id));

const chairsAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < CHAIRS_MIN) throw new Error('محتاجين 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const fake = payload && typeof payload.fake === 'boolean' ? payload.fake : !!(prev.settings && prev.settings.fake);
    const roster = people.slice(0, CHAIRS_MAX);
    room.secrets = {};
    room.shared = {
      settings: { fake },
      roster,
      alive: roster.slice(),
      outOrder: [],
      left: [],                       // who left the room mid-game (a win against only them isn't one)
      round: 0,
      wins: action === 'playAgain' ? (prev.wins || {}) : {},
      winnerId: null,
      loserId: null,
      loserName: '',
      why: null,
      sits: [],
      phase: 'result',
      board: []
    };
    room.shared.board = chairsBoard(room);
    room.phase = 'play';
    chairsStartRound(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'sit') {
    if (staleTap(payload, 'round', s.round)) return;
    if (chairsAlive(room).indexOf(playerId) === -1) return;          // out already, or watching
    if (s.phase === 'music') {
      // Tapped before the music stopped: out of the round at once (the owner's rule).
      chairsEndRound(room, playerId, 'early');
      return;
    }
    if (s.phase !== 'sit') return;
    if (s.sits.some(x => x.id === playerId)) return;
    const now = Date.now();
    let at = payload && typeof payload.at === 'number' && isFinite(payload.at) ? payload.at : now;
    // An honest stamp is never before the stop (the phone saw the stop after it happened)
    // and never after its arrival, so a stamp outside that is one the phone couldn't
    // have had: the arrival counts for it. A hair before the stop is clock drift.
    if (at < s.stopAt - CHAIRS_GRACE_MS || at > now) at = now;
    at = Math.max(s.stopAt, Math.min(now, at));
    s.sits.push({ id: playerId, name: roomPlayerName(room, playerId), ms: Math.max(0, at - s.stopAt) });
    s.sits.sort((a, b) => a.ms - b.ms);
    if (chairsAlive(room).every(id => s.sits.some(x => x.id === id))) chairsCloseSit(room);
    return;
  }
  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'result') return;
    chairsStartRound(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** A new round: the music starts now, the stop moment (and any fake pauses) kept on the server. */
const chairsStartRound = (room) => {
  const s = room.shared;
  const alive = chairsAlive(room);
  s.alive = alive;
  if (alive.length < 2) { chairsGameOver(room); return; }
  const now = Date.now();
  const len = chairsRand(CHAIRS_MUSIC_MS[0], CHAIRS_MUSIC_MS[1]);
  const fakes = [];
  if (s.settings && s.settings.fake && len >= 8000) {
    // One or two fake pauses, never in the first 2.5 s and never within 2 s of the real stop or of each other.
    const n = chairsRand(1, 2);
    for (let k = 0; k < n; k++) {
      const at = now + chairsRand(2500, len - 2000);
      if (fakes.every(f => Math.abs(f - at) > 2000)) fakes.push(at);
    }
    fakes.sort((a, b) => a - b);
  }
  room._chairs = { stopAt: now + len, fakes, fakeAt: 0 };
  s.round = (s.round || 0) + 1;
  s.phase = 'music';
  s.startAt = now;
  s.stopAt = null;
  s.pause = null;
  s.sits = [];
  s.loserId = null;
  s.loserName = '';
  s.why = null;
  s.nextAt = null;
  s.chairs = alive.length - 1;
  s.order = shuffled(alive);          // the order the avatars circle in on every screen
};

/** The music stops: every screen gets the button. */
const chairsStop = (room, now) => {
  const s = room.shared;
  s.phase = 'sit';
  s.stopAt = now;
  s.pause = null;
  s.sits = [];
};

/** Everyone has sat, or the window closed: the last one (or whoever didn't tap) is out. */
const chairsCloseSit = (room) => {
  const s = room.shared;
  const alive = chairsAlive(room);
  const missing = alive.filter(id => !s.sits.some(x => x.id === id));
  // Whoever didn't tap is last; among several, the order they are drawn in decides.
  missing.forEach(id => s.sits.push({ id, name: roomPlayerName(room, id), ms: null }));
  const loser = s.sits[s.sits.length - 1];
  chairsEndRound(room, loser ? loser.id : null, missing.indexOf(loser && loser.id) !== -1 ? 'late' : 'last');
};

/**
 * The round's loser leaves the ring. `why`: 'last' (the slowest), 'late' (no tap),
 * 'early' (a false start), 'left' (left the room mid-round; `name` since they are gone).
 */
const chairsEndRound = (room, loserId, why, name) => {
  const s = room.shared;
  room._chairs = null;
  s.phase = 'result';
  s.pause = null;
  if (why === 'early') { s.stopAt = s.stopAt || Date.now(); }
  s.loserId = loserId;
  s.loserName = loserId ? (roomPlayerName(room, loserId) || name || '') : '';
  s.why = why;
  if (loserId) {
    s.alive = s.alive.filter(id => id !== loserId);
    s.outOrder = (s.outOrder || []).concat([loserId]);
  }
  s.alive = chairsAlive(room);
  if (s.alive.length < 2) { chairsGameOver(room); return; }
  s.nextAt = Date.now() + CHAIRS_BETWEEN_MS;
};

const chairsGameOver = (room) => {
  const s = room.shared;
  room._chairs = null;
  s.phase = 'gameover';
  s.nextAt = null;
  s.pause = null;
  const alive = chairsAlive(room);
  s.winnerId = alive.length === 1 ? alive[0] : null;
  s.winnerName = s.winnerId ? roomPlayerName(room, s.winnerId) : '';
  // A win counts only against somebody: a game where everyone else left is nobody's.
  const left = s.left || [];
  if (s.winnerId && (s.outOrder || []).some(id => left.indexOf(id) === -1)) s.wins[s.winnerId] = (s.wins[s.winnerId] || 0) + 1;
  // The places: the winner, then the last out first.
  s.places = (s.winnerId ? [s.winnerId] : []).concat((s.outOrder || []).slice().reverse())
    .map(id => ({ id, name: roomPlayerName(room, id) }));
  s.board = chairsBoard(room);
};

/** The night's board: the wins of the evening at this game, best first. */
const chairsBoard = (room) =>
  room.players
    .filter(p => !p.bot)
    .map(p => ({ id: p.id, name: p.name, score: ((room.shared || {}).wins || {})[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

/** The server's next moment: a fake pause's start or end, the stop, the sit window, the next round. */
const chairsDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return null;
  if (s.phase === 'music') {
    const h = room._chairs;
    if (!h) return null;
    if (s.pause) return s.pause.until;
    const fake = h.fakes.find(f => f > (h.fakeAt || 0));
    return fake && fake < h.stopAt ? fake : h.stopAt;
  }
  if (s.phase === 'sit') return (s.stopAt || 0) + CHAIRS_SIT_MS;
  if (s.phase === 'result') return s.nextAt || null;
  return null;
};

const chairsTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return false;
  if (s.phase === 'music') {
    const h = room._chairs;
    if (!h) return false;
    if (s.pause) {
      if (now < s.pause.until) return false;
      s.pause = null;                      // the music goes on
      return true;
    }
    if (now >= h.stopAt) { chairsStop(room, h.stopAt); return true; }
    const fake = h.fakes.find(f => f > (h.fakeAt || 0));
    if (fake && now >= fake) {
      h.fakeAt = fake;
      s.pause = { at: fake, until: fake + CHAIRS_FAKE_MS };
      return true;
    }
    return false;
  }
  if (s.phase === 'sit') {
    if (now < (s.stopAt || 0) + CHAIRS_SIT_MS) return false;
    chairsCloseSit(room);
    return true;
  }
  if (s.phase === 'result') {
    if (!s.nextAt || now < s.nextAt) return false;
    chairsStartRound(room);
    return true;
  }
  return false;
};

/**
 * Someone left: out of the ring; one left ends the game. Leaving while the
 * chairs are being taken makes the leaver this round's one out, so nobody
 * else loses a chair to the gap (chairsCloseSit would have knocked out the
 * last to sit too). The chairs are counted again only while the music plays:
 * during the sit and the result the ring reads them as they were dealt.
 */
const chairsPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!s || room.phase !== 'play') return;
  const wasAlive = (s.alive || []).indexOf(playerId) !== -1;
  s.alive = chairsAlive(room);
  s.order = (s.order || []).filter(id => id !== playerId);
  if (s.phase === 'gameover') return;
  if (wasAlive) s.left = (s.left || []).concat([playerId]);
  if (s.sits) s.sits = s.sits.filter(x => x.id !== playerId);
  if (wasAlive && s.phase === 'sit' && s.alive.length >= 2) {
    chairsEndRound(room, playerId, 'left', name);
    return;
  }
  if (wasAlive) s.outOrder = (s.outOrder || []).concat([playerId]);
  if (s.alive.length < 2) { chairsGameOver(room); return; }
  if (s.phase === 'music') s.chairs = Math.max(0, s.alive.length - 1);
};
