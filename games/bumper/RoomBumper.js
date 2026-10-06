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
     ball      «كورة التصادم» (2 Oct 2026): a big ball, two goals, red against blue.
               Everyone picks a side in the lobby (`side`); a computer player fills
               a side only when it is empty. The TV sends each goal (`goal`), so the
               score is the server's: the clock (settings.ballSecs) ends it, a draw
               goes to a golden goal (one more minute at most), then a draw.

   shared: phase ('play' | 'over'), round, roster, colors ({ pid: index }),
   names, bots ({ pid: level }), settings { mode, ringWin, secs, ballSecs }, startAt /
   endsAt (the server's time), results, wins, board.
   The ball adds: picks ({ pid: 'red' | 'blue' }, what people chose - in the lobby
   too, with lobbyMode, the host's way so every phone shows the sides), sides (the
   match's, computer players too), cpu ({ id: level }: a filler that isn't a room
   player), score { red, blue }, goals [{ side, by, own, name, at }], golden, cut.
   Bundled after RoomGames.js (requireHost, isRoomScreen, roomPlayerName).
   Every name here starts with bumper / BUMPER_.
   ========================================================================= */
const BUMPER_MAX = 8;
const BUMPER_SECS = [60, 120, 180];
const BUMPER_MODES = ['balloons', 'points', 'ring', 'ball'];
const BUMPER_BALL_SECS = [120, 180, 300];      // «كورة التصادم»: 2, 3 or 5 minutes (the owner)
const BUMPER_GOLDEN_MS = 60000;                // a draw: the next goal wins, a minute at most
const BUMPER_BALL_GRACE_MS = 1500;             // a goal scored on the whistle may still be on its way
const BUMPER_SIDES = ['red', 'blue'];
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
    secs: pick(Number(p.secs), BUMPER_SECS, was.secs, 120),
    ballSecs: pick(Number(p.ballSecs), BUMPER_BALL_SECS, was.ballSecs, 180)
  };
};
/** Whether this way to play ends when one car is left (the clock is only its cap). */
const bumperLastStanding = (settings) => settings.mode === 'balloons' || (settings.mode === 'ring' && settings.ringWin === 'last');

/**
 * «كورة التصادم»: a driver's side. The match's own (dealt), or for someone who joined
 * mid-match the smaller side, latecomers taken in the room's order (red on a tie) - the
 * page works it out the same way (bmpSideOf), so the TV and every phone agree.
 */
const bumperSideOf = (s, players, id) => {
  const sides = (s && s.sides) || {};
  if (sides[id]) return sides[id];
  const count = { red: 0, blue: 0 };
  Object.keys(sides).forEach(k => { if (count[sides[k]] !== undefined) count[sides[k]]++; });
  const late = (players || []).filter(p => !p.bot && !sides[p.id]).map(p => p.id);
  let mine = null;
  late.forEach(pid => {
    const side = count.red <= count.blue ? 'red' : 'blue';
    count[side]++;
    if (pid === id) mine = side;
  });
  return mine;
};

/** The match's drivers: the people dealt, the room's computer players and fillers, and anyone who came in since. */
const bumperBallIds = (room, s) => {
  const ids = (s.roster || []).concat(Object.keys(s.cpu || {}));
  room.players.forEach(p => { if (!p.bot && ids.indexOf(p.id) === -1) ids.push(p.id); });
  return ids;
};

/** A filler for a side nobody is on: a computer player the page drives, not a room player. */
const bumperBallFill = (s, side, level) => {
  const id = 'cpu-' + side;
  s.cpu = s.cpu || {};
  s.cpu[id] = level || 'easy';
  s.bots[id] = s.cpu[id];
  s.sides[id] = side;
  s.colors[id] = side === 'red' ? 0 : 1;
  s.names[id] = '🤖';
};

/**
 * «كورة التصادم»: the sides. What each person picked (picks), anyone who didn't
 * on the smaller side; a side with nobody gets a computer player - the room's
 * first one the host seated, or one of the page's own (easy). The room's other
 * computer players sit this way out (the owner: a computer player only fills an
 * empty side).
 */
const bumperBallDeal = (room, prev) => {
  const people = room.players.filter(p => !p.bot).slice(0, BUMPER_MAX);
  const picks = Object.assign({}, prev.picks || {});
  const sides = {}, count = { red: 0, blue: 0 };
  people.forEach(p => { const k = picks[p.id]; if (k === 'red' || k === 'blue') { sides[p.id] = k; count[k]++; } });
  people.forEach(p => { if (!sides[p.id]) { const k = count.red <= count.blue ? 'red' : 'blue'; sides[p.id] = k; count[k]++; } });
  const roster = people.map(p => p.id);
  const colors = {}, bots = {}, names = {};
  roster.forEach(id => { colors[id] = sides[id] === 'red' ? 0 : 1; names[id] = roomPlayerName(room, id); });
  const s = { roster, colors, bots, names, sides, picks, cpu: {} };
  const seated = room.players.filter(p => p.bot);
  BUMPER_SIDES.forEach(side => {
    if (count[side]) return;
    const b = seated.shift();
    if (!b) { bumperBallFill(s, side, 'easy'); return; }
    roster.push(b.id);
    sides[b.id] = side; colors[b.id] = side === 'red' ? 0 : 1; bots[b.id] = b.bot; names[b.id] = roomPlayerName(room, b.id);
  });
  return s;
};

/** Each driver's goals (an own goal counts for nobody), for the result's rows. */
const bumperBallEnd = (room) => {
  const s = room.shared;
  const win = s.score.red > s.score.blue ? 'red' : s.score.blue > s.score.red ? 'blue' : null;
  const ids = bumperBallIds(room, s);
  // Someone who came in mid-match played it: they join the roster, so the board and the night count them.
  room.players.forEach(p => { if (!p.bot && s.roster.indexOf(p.id) === -1 && ids.indexOf(p.id) !== -1) s.roster.push(p.id); });
  const rows = ids.map(id => {
    const side = bumperSideOf(s, room.players, id) || 'red';
    return {
      id,
      name: (s.cpu && s.cpu[id]) ? s.names[id] : (roomPlayerName(room, id) || s.names[id] || ''),
      bot: !!(s.bots && s.bots[id]),
      side,
      score: s.goals.filter(g => g.by === id && !g.own).length,
      taken: s.goals.filter(g => g.by === id && g.own).length,
      lives: 0,
      // The owner: the winning side shares first place; a draw is everyone's.
      place: !win || side === win ? 1 : 2
    };
  }).sort((a, b) => (a.place - b.place) || (b.score - a.score));
  s.results = rows;
  s.reported = true;
  s.winner = win;
  if (win) rows.forEach(r => { if (r.place === 1) s.wins[r.id] = (s.wins[r.id] || 0) + 1; });
  bumperBoard(room, rows);
  s.phase = 'over';
};

/** Someone to drive, and a big screen online for the cars (the review of 1 Oct 2026). */
const bumperCanStart = (room) => {
  if (!room.players.some(p => !p.bot)) throw new Error('محتاجين لاعب واحد على الأقل');
  // room.js names the screens online for this move (_onlineScreens); without it, any screen.
  const screensOn = Array.isArray(room._onlineScreens) ? room._onlineScreens.length : (room.screens || []).length;
  if (!screensOn) throw new Error('افتح شاشة العرض الأول: العربيات بتجري عليها');
};

/** «كورة التصادم»: a match - the sides, the clock (2, 3 or 5 minutes), the score at 0 - 0. */
const bumperBallStart = (room, prev, payload) => {
  bumperCanStart(room);
  const settings = bumperSettings(payload, prev.settings);
  const deal = bumperBallDeal(room, prev);
  const now = Date.now();
  room.secrets = {};
  room.shared = Object.assign(deal, {
    phase: 'play',
    round: (prev.round || 0) + 1,
    settings,
    startAt: now + BUMPER_COUNTDOWN_MS,
    endsAt: now + BUMPER_COUNTDOWN_MS + settings.ballSecs * 1000,
    score: { red: 0, blue: 0 },
    goals: [],
    golden: false,
    cut: false,
    results: null,
    wins: prev.wins || {},
    board: prev.board || []
  });
  room.phase = 'play';
};

const bumperAction = (room, playerId, action, payload) => {
  // «كورة التصادم»: each person picks a side on their own phone, in the lobby or between matches.
  if (action === 'side') {
    const side = payload && payload.side;
    if (BUMPER_SIDES.indexOf(side) === -1) throw new Error('اختار الأحمر أو الأزرق');
    if (!room.players.some(p => p.id === playerId && !p.bot)) return;          // a screen has no car
    const s = room.shared = room.shared || {};
    if (room.phase !== 'lobby' && s.phase !== 'over') return;                  // not mid-match
    s.picks = Object.assign({}, s.picks || {});
    s.picks[playerId] = side;
    return;
  }
  // The host's way to play, so every phone's lobby shows the side picker for the ball.
  if (action === 'lobbyMode') {
    requireHost(room, playerId);
    const s = room.shared = room.shared || {};
    if (room.phase !== 'lobby' && s.phase !== 'over') return;
    const mode = payload && payload.mode;
    if (BUMPER_MODES.indexOf(mode) !== -1) s.lobbyMode = mode;
    return;
  }
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'over') return;
    if (bumperSettings(payload, prev.settings).mode === 'ball') { bumperBallStart(room, prev, payload); return; }
    const drivers = room.players.slice(0, BUMPER_MAX);
    bumperCanStart(room);
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

  const ball = s.settings && s.settings.mode === 'ball';
  if (action === 'goal') {
    // «كورة التصادم»: the TV's word on a goal, numbered (n) so a resent one counts once.
    if (!isRoomScreen(room, playerId) && room.hostId !== playerId) return;
    if (!ball || s.phase !== 'play' || staleTap(payload, 'round', s.round)) return;
    if (Number(payload && payload.n) !== s.goals.length + 1 || Date.now() < s.startAt) return;
    const side = payload.side;
    if (BUMPER_SIDES.indexOf(side) === -1) return;
    const by = String(payload.by || '');
    const who = by && bumperBallIds(room, s).indexOf(by) !== -1 ? by : '';
    const level = s.score.red === s.score.blue;
    s.score[side]++;
    s.goals.push({ side, by: who, own: !!who && bumperSideOf(s, room.players, who) !== side,
      name: who ? ((s.cpu && s.cpu[who]) ? s.names[who] : (roomPlayerName(room, who) || s.names[who] || '')) : '', at: Date.now() });
    // A goal once the clock is out that breaks a tie is the golden goal: it ends the match.
    if (level && Date.now() >= s.endsAt && !s.cut) bumperBallEnd(room);
    return;
  }
  if (action === 'finish') {
    // The TV's word on the round. Only a screen (or the host, for a screen that is a player's laptop).
    if (ball) return;                                               // the ball's score is the server's own
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
    if (ball) { s.cut = true; bumperBallEnd(room); }                  // ended by hand: no golden goal
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
  bumperBoard(room, rows);
  s.phase = 'over';
};

/** The drivers of this round only (a phone that joined to watch isn't on it), the evening's
    wins first and level wins by this round's places (`tie`, boardRowKey in RoomGames.js). */
const bumperBoard = (room, rows) => {
  const s = room.shared;
  const placeOf = (id) => { const r = s.reported ? rows.find(x => x.id === id) : null; return r ? r.place : null; };
  s.board = room.players
    .filter(p => s.roster.indexOf(p.id) !== -1)
    .map(p => ({ id: p.id, name: p.name, score: s.wins[p.id] || 0, tie: placeOf(p.id) }))
    .sort((a, b) => (b.score - a.score) || ((a.tie || 99) - (b.tie || 99)));
};

/** «كورة التصادم» as a team game for the night and the program (PROGRAM_TEAMS.bumper in
    RoomProgram.js): [winners, losers] of the match just ended, [everyone] for a draw, null
    for the other ways or a match not ended - so the losing side is second (3 points), not
    behind every winner. The room's own players only (the page's 🤖 fill-ins aren't people). */
const bumperBallTeams = (room) => {
  const s = room.shared || {};
  if (!s.settings || s.settings.mode !== 'ball' || !s.reported || !Array.isArray(s.results)) return null;
  const ids = s.results.map(r => r.id).filter(id => (room.players || []).some(p => p.id === id));
  if (!ids.length) return null;
  if (!s.winner) return [ids];
  const side = (id) => (s.results.find(r => r.id === id) || {}).side;
  return [ids.filter(id => side(id) === s.winner), ids.filter(id => side(id) !== s.winner)];
};

/** «كورة التصادم»: when the match is next looked at - the whistle, or the golden goal's last moment. */
const bumperBallDue = (s) => s.endsAt + (s.golden ? BUMPER_GOLDEN_MS : 0) + BUMPER_BALL_GRACE_MS;

const bumperDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play' || s.phase !== 'play') return null;
  if (s.settings && s.settings.mode === 'ball') return bumperBallDue(s);
  return s.endsAt + BUMPER_REPORT_MS;
};

const bumperTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play' || s.phase !== 'play') return false;
  if (s.settings && s.settings.mode === 'ball') {
    if (now < bumperBallDue(s)) return false;
    // Level at the whistle: a golden goal, a minute at most (the owner); after it, a draw.
    if (!s.golden && !s.cut && s.score.red === s.score.blue) { s.golden = true; return true; }
    bumperBallEnd(room);
    return true;
  }
  if (now < s.endsAt + BUMPER_REPORT_MS) return false;
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
  // «كورة التصادم»: a side left with nobody gets a computer player, so the match goes on.
  if (s.settings && s.settings.mode === 'ball' && s.sides) {
    // Their side stays written down: a latecomer's side is counted from the dealt ones, and must not move.
    const here = bumperBallIds(room, s).filter(id => id !== playerId);
    BUMPER_SIDES.forEach(side => {
      if (!here.some(id => bumperSideOf(s, room.players, id) === side)) bumperBallFill(s, side, 'easy');
    });
  }
};

/**
 * «كورة التصادم»: someone who comes in mid-match (room.js, on a join) drives at once, on the
 * side with fewer cars here now (red on a tie), written into the match's sides so it never moves.
 */
const bumperJoined = (room, pid) => {
  const s = room.shared;
  if (room.game !== 'bumper' || room.phase !== 'play' || !s || s.phase !== 'play' || !s.settings || s.settings.mode !== 'ball' || !s.sides || s.sides[pid]) return;
  const count = { red: 0, blue: 0 };
  room.players.forEach(p => { const k = s.sides[p.id]; if (p.id !== pid && count[k] !== undefined) count[k]++; });
  Object.keys(s.cpu || {}).forEach(id => { if (count[s.sides[id]] !== undefined) count[s.sides[id]]++; });
  const side = count.red <= count.blue ? 'red' : 'blue';
  s.sides[pid] = side;
  s.colors[pid] = side === 'red' ? 0 : 1;
  s.names[pid] = roomPlayerName(room, pid);
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
