/* ============================================================================
   عربيات التصادم — BUMPER CARS (rooms), the TV-and-controllers test of 28 Sep 2026
   ----------------------------------------------------------------------------
   The owner's idea: the TV is the game and every phone a controller, like a
   console. This is the test of it before a real racing game: a top-down arena
   on the TV, each phone steering its own car.

   The split is not the one every other room game has. Here the TV runs the
   game (the cars, the knocks, the score) and the server only:
     - deals a round (who drives, the colours, when it starts and ends), and
     - passes each phone's steering to the screens as it happens, never stored
       (room.js, relayDrive: the drawer's live line's channel, opened to every
       player of this game) - and a screen's short answer (a ping's echo, a
       knock to buzz) back to that one phone.
   The TV sends the round's scores with `finish`; a round with no screen to
   report ends on the server's clock with no scores.

   shared: phase ('play' | 'over'), round, roster, colors ({ pid: index }),
   names, startAt / endsAt (the server's time), settings.secs, results,
   wins, board.
   Bundled after RoomGames.js (requireHost, isRoomScreen, roomPlayerName).
   Every name here starts with bumper / BUMPER_.
   ========================================================================= */
const BUMPER_MAX = 8;
const BUMPER_SECS = [60, 120, 180];
const BUMPER_COUNTDOWN_MS = 3500;       // "3, 2, 1" before the cars can move
const BUMPER_REPORT_MS = 8000;          // how long the server waits for the TV's scores

const bumperAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'over') return;
    const people = room.players.filter(p => !p.bot);
    if (!people.length) throw new Error('محتاجين لاعب واحد على الأقل');
    const want = payload && Number(payload.secs);
    const secs = BUMPER_SECS.indexOf(want) !== -1 ? want
      : (prev.settings && BUMPER_SECS.indexOf(prev.settings.secs) !== -1 ? prev.settings.secs : 120);
    const roster = people.slice(0, BUMPER_MAX).map(p => p.id);
    const colors = {};
    roster.forEach((id, k) => { colors[id] = k; });
    const now = Date.now();
    room.secrets = {};
    room.shared = {
      phase: 'play',
      round: (prev.round || 0) + 1,
      roster,
      colors,
      names: roster.reduce((m, id) => { m[id] = roomPlayerName(room, id); return m; }, {}),
      settings: { secs },
      startAt: now + BUMPER_COUNTDOWN_MS,
      endsAt: now + BUMPER_COUNTDOWN_MS + secs * 1000,
      results: null,
      wins: action === 'playAgain' || prev.wins ? (prev.wins || {}) : {},
      board: prev.board || []
    };
    room.phase = 'play';
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'finish') {
    // The TV's word on the round: knocks landed and taken, per driver.
    if (!isRoomScreen(room, playerId) && room.hostId !== playerId) return;
    if (s.phase !== 'play' || staleTap(payload, 'round', s.round)) return;
    if (Date.now() < s.endsAt - 2000) return;             // a round ends on its clock
    bumperEnd(room, payload && payload.scores);
    return;
  }
  if (action === 'endNow') {
    requireHost(room, playerId);
    if (s.phase !== 'play') return;
    s.endsAt = Math.min(s.endsAt, Date.now());
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** The round's result, from the TV's scores (whatever is missing counts 0). */
const bumperEnd = (room, scores) => {
  const s = room.shared;
  const clean = (v) => Math.max(0, Math.min(9999, Math.floor(Number(v) || 0)));
  const got = scores && typeof scores === 'object' ? scores : {};
  const ids = s.roster.concat(Object.keys(got).filter(id => s.roster.indexOf(id) === -1 && room.players.some(p => p.id === id)))
    .slice(0, BUMPER_MAX * 2);
  s.results = ids.map(id => ({
    id,
    name: roomPlayerName(room, id) || s.names[id] || '',
    hits: clean(got[id] && got[id].hits),
    taken: clean(got[id] && got[id].taken)
  })).sort((a, b) => b.hits - a.hits || a.taken - b.taken);
  s.reported = !!scores;
  const top = s.results[0];
  if (top && top.hits > 0 && s.results.length > 1) s.wins[top.id] = (s.wins[top.id] || 0) + 1;
  s.board = room.players.filter(p => !p.bot)
    .map(p => ({ id: p.id, name: p.name, score: s.wins[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);
  s.phase = 'over';
};

const bumperDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play' || s.phase !== 'play') return null;
  return s.endsAt + BUMPER_REPORT_MS;
};

const bumperTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play' || s.phase !== 'play' || now < s.endsAt + BUMPER_REPORT_MS) return false;
  bumperEnd(room, null);
  return true;
};

/** Whether a device's live message is passed on, and to whom: see room.js relayDrive. */
const bumperRelaying = (room) => room.game === 'bumper' && room.phase === 'play' && (room.shared || {}).phase === 'play';
