/* ============================================================================
   عربيات التصادم — BUMPER CARS (rooms), 28 Sep 2026
   ----------------------------------------------------------------------------
   The TV is the game and every phone a controller, like a console. It began as
   the test of that idea; the owner then asked for it to be a game of its own
   (the owner's specs): three ways to play, a 3D fairground rink,
   computer players, and on the phone lives and score, a boost and a horn.

   The split is not the one every other room game has. The TV runs the game
   (the cars, the knocks, the balloons, the ring, the computer players' driving,
   the score) and the server only:
     - deals a round (who drives, the colours, the way to play, the clock), and
     - passes each phone's controls to the screens as they happen, never stored
       (room.js, relayDrive), and a screen's short answer (a ping's echo, a
       knock, the phone's lives and place) back to that one phone.
   The TV sends the round's result with `finish`: at the clock, or as soon as
   one car is left in Balloons and in «آخر واحد في الحلبة». A round with no
   screen to report ends on the server's clock with no result.

   The ways to play (settings.mode):
     balloons  3 balloons each; a knock pops one of the knocked car's; with
               none left a car drives on as a ghost; the last with balloons wins
     points    the most knocks landed when the clock runs out
     ring      a round platform with no rail: push the others off. settings.ringWin
               'clock' - a push-off is a point, the pushed car is back in 3 s,
               most points at the clock; 'last' - off is out, the last one on wins

   shared: phase ('play' | 'over'), round, roster, colors ({ pid: index }),
   names, bots ({ pid: level }), settings { mode, ringWin, secs }, startAt /
   endsAt (the server's time), results, wins, board.
   Bundled after RoomGames.js (requireHost, isRoomScreen, roomPlayerName).
   Every name here starts with bumper / BUMPER_.
   ========================================================================= */
const BUMPER_MAX = 8;
const BUMPER_SECS = [60, 120, 180];
const BUMPER_MODES = ['balloons', 'points', 'ring'];
const BUMPER_RING_WINS = ['clock', 'last'];
const BUMPER_LONGEST_MS = 180000;       // Balloons and «آخر واحد» end by themselves; this is their cap
const BUMPER_COUNTDOWN_MS = 3500;       // "3, 2, 1" before the cars can move
const BUMPER_REPORT_MS = 8000;          // how long the server waits for the TV's result

/** The host's choices, anything missing or unknown put back to what it was (or the default). */
const bumperSettings = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const pick = (v, list, old, dflt) => (list.indexOf(v) !== -1 ? v : list.indexOf(old) !== -1 ? old : dflt);
  return {
    mode: pick(p.mode, BUMPER_MODES, was.mode, 'balloons'),
    ringWin: pick(p.ringWin, BUMPER_RING_WINS, was.ringWin, 'clock'),
    secs: pick(Number(p.secs), BUMPER_SECS, was.secs, 120)
  };
};
/** Whether this way to play ends when one car is left (the clock is only its cap). */
const bumperLastStanding = (settings) => settings.mode === 'balloons' || (settings.mode === 'ring' && settings.ringWin === 'last');

const bumperAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'over') return;
    const drivers = room.players.slice(0, BUMPER_MAX);
    if (!drivers.some(p => !p.bot)) throw new Error('محتاجين لاعب واحد على الأقل');
    const settings = bumperSettings(payload, prev.settings);
    if (drivers.length < 2 && bumperLastStanding(settings)) throw new Error('الطريقة دي محتاجة عربيتين على الأقل: ضيف عربية كمبيوتر');
    const roster = drivers.map(p => p.id);
    const colors = {}, bots = {};
    roster.forEach((id, k) => { colors[id] = k; });
    drivers.forEach(p => { if (p.bot) bots[p.id] = p.bot; });
    const now = Date.now();
    const len = bumperLastStanding(settings) ? BUMPER_LONGEST_MS : settings.secs * 1000;
    room.secrets = {};
    room.shared = {
      phase: 'play',
      round: (prev.round || 0) + 1,
      roster,
      colors,
      bots,
      names: roster.reduce((m, id) => { m[id] = roomPlayerName(room, id); return m; }, {}),
      settings,
      startAt: now + BUMPER_COUNTDOWN_MS,
      endsAt: now + BUMPER_COUNTDOWN_MS + len,
      results: null,
      wins: prev.wins || {},
      board: prev.board || []
    };
    room.phase = 'play';
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'finish') {
    // The TV's word on the round. Only a screen (or the host, for a screen that is a player's laptop).
    if (!isRoomScreen(room, playerId) && room.hostId !== playerId) return;
    if (s.phase !== 'play' || staleTap(payload, 'round', s.round)) return;
    const early = payload && payload.done && bumperLastStanding(s.settings);
    if (!early && Date.now() < s.endsAt - 2000) return;             // a round on a clock ends on its clock
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

/**
 * The round's result, from the TV's scores: { pid: { score, taken, lives, place } }.
 * A place the TV gave orders the table (ties share a place); without one, the
 * score does. Whatever is missing counts 0. The first place wins, against somebody.
 * A driver the TV didn't report (a car it had already dropped) goes last: judging
 * the places on the reported rows only, so one missing place can't throw the TV's
 * order away and let a ghost win on its knocks.
 */
const bumperEnd = (room, scores) => {
  const s = room.shared;
  const num = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  const got = scores && typeof scores === 'object' ? scores : {};
  const known = (id) => s.roster.indexOf(id) !== -1 || room.players.some(p => p.id === id);
  const ids = s.roster.concat(Object.keys(got).filter(id => s.roster.indexOf(id) === -1 && known(id))).slice(0, BUMPER_MAX * 2);
  const rows = ids.map(id => {
    const g = got[id] || {};
    return {
      id,
      rep: !!got[id],
      name: roomPlayerName(room, id) || s.names[id] || '',
      bot: !!(s.bots && s.bots[id]),
      score: num(g.score !== undefined ? g.score : g.hits, 9999),
      taken: num(g.taken, 9999),
      lives: num(g.lives, 3),
      place: num(g.place, 99)
    };
  });
  const reported = rows.filter(r => r.rep);
  const placed = reported.length > 0 && reported.every(r => r.place >= 1);
  rows.sort((a, b) => (b.rep - a.rep) || (placed && a.rep ? a.place - b.place : 0) || b.score - a.score || a.taken - b.taken);
  if (placed) {
    // The unreported, after the TV's last place, ranked among themselves by score.
    let base = reported.reduce((m, r) => Math.max(m, r.place), 0);
    rows.forEach((r, i) => {
      if (r.rep) return;
      const prev = rows[i - 1];
      r.place = prev && !prev.rep && prev.score === r.score && prev.taken === r.taken ? prev.place : ++base;
    });
  } else {
    rows.forEach((r, i) => { r.place = i && rows[i - 1].score === r.score && rows[i - 1].taken === r.taken ? rows[i - 1].place : i + 1; });
  }
  rows.forEach(r => { delete r.rep; });
  s.results = rows;
  s.reported = !!scores;
  const winners = rows.filter(r => r.place === 1 && (r.score > 0 || bumperLastStanding(s.settings)));
  if (s.reported && rows.length > 1 && winners.length && winners.length < rows.length) {
    winners.forEach(r => { s.wins[r.id] = (s.wins[r.id] || 0) + 1; });
  }
  s.board = room.players
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

/**
 * Someone left mid-round: their car leaves the rink (the TV drops it from the
 * room's players) and their name leaves the round's roster, so the result
 * doesn't carry a driver nobody reported.
 */
const bumperPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || room.phase !== 'play' || s.phase !== 'play') return;
  if (Array.isArray(s.roster)) s.roster = s.roster.filter(id => id !== playerId);
};

/** Whether a device's live message is passed on, and to whom: see room.js relayDrive. */
const bumperRelaying = (room) => room.game === 'bumper' && room.phase === 'play' && (room.shared || {}).phase === 'play';

// Computer players sit in the lobby like anywhere else; the TV drives them (their cars are its to run),
// so the server has no move to make for them.
ROOM_BOT_GAMES.bumper = {
  max: BUMPER_MAX,
  pending: () => null,
  decide: () => null,
  fallback: () => null
};
