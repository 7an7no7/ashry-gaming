/* ============================================================================
   برنامج السهرة — THE NIGHT'S PROGRAM (the night as a show)
   ----------------------------------------------------------------------------
   The owner's decisions (30 Sep 2026, every point asked):
   - The host picks every game of the program, in order (3 to 8 here; the owner
     said 3 to about 6), reordering and removing before it starts; the host can
     end it early.
   - Between two games a standings card of about 10 s (the night's table so far
     and the next game with a countdown), then the next game starts by itself;
     the host (or a stand-in once the host is away) can skip ahead or pause.
   - The night's score is places, not each game's own points: 1st 5, 2nd 3,
     3rd 2, everyone else who played 1 (PROGRAM_PLACE_POINTS); a co-op game gives
     everyone who played the same (they all share the first place); tied players
     share the place's points. So a big-score game can't swamp a small one.
   - The finale: the champion of the night, a podium with the cast, playful awards
     from real play, each with the moment that earned it, a share card, and a hook
     for «الشلة» (nightProgramFinished, below: another branch wires it).

   How it runs (all on the server, so a locked host phone never stops it):
     room.program   public: the list (ids only), where it is, the table, the last
                    game's places, the clock of a pause, and at the end the finale.
     room._progOpts private: each game's start payload, the host's options as they
                    were captured when the game was added (the lobby's own
                    startPayload() on the host's phone).
     room._progLog  private: the highlights the awards are made from (a lie in
                    كدّاب is secret until the game is over, so the log is too).

   program.phase  'between'  the standings card (at: -1 before the first game: the
                             line-up), a pause of PROGRAM_BETWEEN_MS, then the next
                             game is chosen and started with its payload;
                  'waiting'  its start was refused (seats to pick, sides, too few
                             people): the room sits in that game's lobby and the
                             host presses Start as ever - the program carries on;
                  'playing'  the game is on; programSync notices its end
                             (programGameOver) after every move and every clock;
                  'result'   the game's own result stays up PROGRAM_RESULT_MS
                             (its podium, its reveal), its places already banked;
                  'final'    the finale, until the host closes it.
   Every phase change raises program.seq; the host's taps carry it (a double tap,
   or a tap aimed at the pause before, does nothing).
   ========================================================================== */

const PROGRAM_MIN_GAMES = 3;
const PROGRAM_MAX_GAMES = 8;
const PROGRAM_PLACE_POINTS = NIGHT_PLACES;   // 1st, 2nd, 3rd: 5, 3, 2 (the night's, RoomGames.js)
const PROGRAM_PLAYED_POINTS = NIGHT_PLAYED;  // everyone else who played: 1
const PROGRAM_FIRST_MS = 8000;            // the line-up before the first game
const PROGRAM_BETWEEN_MS = 10000;         // the standings card between two games
const PROGRAM_RESULT_MS = 9000;           // a game's own result, before the standings
const PROGRAM_RESULT_LONG = { telephone: 6000, witness: 12000, box: 12000, hear: 12000, mafia: 12000 };
const PROGRAM_OPTS_MAX = 4000;            // characters of one game's start payload
const PROGRAM_AWARDS_MAX = 8;
const PROGRAM_AWARDS_EACH = 2;            // awards one person can take

/* Games everybody plays together, with nobody placed above anybody: everyone who
   played shares the first place (the owner's "co-op games give everyone the same"). */
const PROGRAM_COOP = { mind: true, wire: true, darkroom: true, exact: true, telephone: true, wouldyou: true };

/* Games with no end of their own (round after round until the host moves on): in a
   program they end after this many rounds - decided while building, open to change. */
// PROGRAM_ROUNDS: `room.rounds` in Games.js.

const programOn = (room) => !!(room.program && room.program.phase !== 'final');
const programCurrent = (room) => {
  const p = room.program;
  return p && p.at >= 0 && p.at < p.games.length ? p.games[p.at] : null;
};
const programPeople = (room) => room.players.filter(p => !p.bot);

/** Has the game in the room reached its end, as far as the program is concerned? */
const programGameOver = (room) => {
  if (!room.game || room.phase === 'lobby') return false;
  // الحرباء's «مين فضحها؟» is still to come: bank after its −1, not before (audit 7 Oct 2026, E1).
  if (room.game === 'chameleon' && (room.shared || {}).blamePending) return false;
  if (roomGameIsOver(room)) return true;
  const s = room.shared || {};
  const cap = PROGRAM_ROUNDS[room.game];
  switch (room.game) {
    case 'whoami': return room.phase === 'result';
    case 'stop': return s.phase === 'done';
    case 'telephone': return s.phase === 'done';
    case 'bomb': return s.phase === 'boom' && (s.round || 1) >= cap;
    // A family quiz on the buzzer ends with its last question (its round goes up twice a right answer).
    case 'buzzer': return s.quiz ? !!s.quiz.done : (s.round || 1) > cap;
    case 'justone': return room.phase === 'result' && (s.round || 1) >= cap;
    case 'drawguess': {
      const turns = Math.min(cap, Math.max(1, (s.roster || room.players).length));
      return room.phase === 'result' && (s.round || 1) >= turns;
    }
    default:
      if (cap && AUTONEXT_GAMES[room.game]) return AUTONEXT_GAMES[room.game].ready(s) && (s.round || 1) >= cap;
      return false;
  }
};

/* --- places ------------------------------------------------------------------ */

/* Team games: the winning side first, the other after it (dense: the losing side is second). */
const PROGRAM_TEAMS = {
  codenames: (room) => {
    const s = room.shared || {};
    if (!s.winner || !s.teams) return null;
    const ids = Object.keys(s.teams);
    return [ids.filter(id => s.teams[id].team === s.winner), ids.filter(id => s.teams[id].team !== s.winner)];
  },
  // السلم والتعبان in teams (2 Oct 2026): the teams in the order they got home (null playing each for themselves).
  snakes: (room) => snakesTeamResult(room),
  // «أونو اتنين اتنين» (2 Oct 2026): the pairs in their places (null playing each for themselves).
  uno: (room) => unoTeamResult(room),
  // كونكت ٤ team against team (2 Oct 2026): the side with more wins first (null in winner stays).
  connect4: (room) => c4TeamPlaces(room),
  votechess: (room) => programTwoTeams(room),
  // المشنقة's team way (RoomHangman.js); its other ways place by the board (null here).
  hangman: (room) => hmProgramTeams(room),
  handbrain: (room) => programTwoTeams(room),
  // «كورة التصادم»: the winning side, then the losing one (null in the other ways; RoomBumper.js).
  bumper: (room) => bumperBallTeams(room),
  bughouse: (room) => {
    const s = room.shared || {};
    const r = s.result;
    if (!r || !Array.isArray(r.winners) || !Array.isArray(s.seats)) return null;
    return [r.winners.slice(), s.seats.filter(id => r.winners.indexOf(id) === -1)];
  },
  // سكرو's صاحب صاحبه: the winning side (lowest total), then the other; level sides share first.
  screw: (room) => {
    const s = room.shared || {};
    if (s.phase !== 'gameover' || !Array.isArray(s.teams) || !Array.isArray(s.winnerTeams)) return null;
    const won = (i) => s.winnerTeams.indexOf(SKREW_TEAM_KEYS[i]) !== -1;
    const flat = (pick) => s.teams.reduce((a, t, i) => (pick(i) ? a.concat(t) : a), []);
    const w = flat(won), l = flat(i => !won(i));
    return l.length ? [w, l] : [w];
  },
  // الدومينو in teams: the side that reached the target, then the other (null each for themselves).
  domino: (room) => {
    const s = room.shared || {};
    if (s.phase !== 'gameover' || !Array.isArray(s.teams)) return null;
    const k = DOMINO_TEAM_KEYS.indexOf(s.winner);
    if (k === -1) return null;
    return [s.teams[k].slice(), (s.teams[1 - k] || []).slice()];
  },
  // شطرنج الأربعة in teams: red + yellow against blue + green (null in FFA); a draw puts all four first.
  chess4: (room) => {
    const s = room.shared || {};
    const g = s.g;
    if (!g || !g.over || g.mode !== 'teams' || !g.result || !Array.isArray(s.seats)) return null;
    const side = (k) => CHESS4_SEATS.filter(t => chess4Team(t) === k).map(t => s.seats[t]).filter(Boolean);
    const team = g.result.team;
    if (team !== 0 && team !== 1) return [side(0).concat(side(1))];
    return [side(team), side(1 - team)];
  }
};
const programTwoTeams = (room) => {
  const s = room.shared || {};
  const r = s.result;
  if (!r || !Array.isArray(s.teams)) return null;
  const all = (k) => [].concat(s.teams[k] || []).reduce((a, x) => a.concat(x), []);
  if (r.winner !== 0 && r.winner !== 1) return [all(0).concat(all(1))];   // a draw: both sides first
  return [all(r.winner), all(1 - r.winner)];
};

/**
 * The places of the game that just ended: [{ id, place }] for everyone who played
 * (computer players included - they take a place, the points skip them), and
 * whether it was a co-op game (or everyone level). One rule with the room's own night:
 * nightPlacesOf (RoomGames.js) places a game for both, and bankNightPoints banks inside a
 * program exactly what programBank banked (the review of 1 Oct 2026).
 */
const programPlaces = (room, cut) => nightPlacesOf(room, (room.shared || {}).board, cut);

const programPointsFor = (place) => PROGRAM_PLACE_POINTS[place - 1] || PROGRAM_PLAYED_POINTS;

/** Banks the game that ended (or was cut short) into the night's table. */
const programBank = (room, cut) => {
  const p = room.program;
  const cur = programCurrent(room);
  if (!p || !cur || p.banked === p.at) return;
  const res = programPlaces(room, cut);
  const gained = {};
  const places = [];
  res.rows.forEach(r => {
    if (isRoomBot(room, r.id)) return;
    const name = roomPlayerName(room, r.id) || (p.names || {})[r.id] || '';
    if (!name) return;
    const pts = programPointsFor(r.place);
    const row = p.table[r.id] || (p.table[r.id] = { pts: 0, firsts: 0 });
    row.pts += pts;
    if (r.place === 1 && !res.coop) row.firsts += 1;
    p.names[r.id] = name;
    gained[r.id] = pts;
    places.push({ id: r.id, place: r.place, pts });
  });
  // Everyone in the room has a row, the ones who sat this game out with 0.
  programPeople(room).forEach(x => {
    if (!p.table[x.id]) p.table[x.id] = { pts: 0, firsts: 0 };
    p.names[x.id] = x.name;
  });
  places.sort((a, b) => a.place - b.place);
  p.banked = p.at;
  p.gained = gained;
  p.done.push({ id: cur.id, coop: !!res.coop, cut: !!cut, places });
  p.order = programOrder(p);
  p.orders.push(p.order.slice());
  programLogEnd(room, res);
};

/** The table, best first: points, then first places, then the name. */
const programOrder = (p) => Object.keys(p.table)
  .sort((a, b) => (p.table[b].pts - p.table[a].pts) || (p.table[b].firsts - p.table[a].firsts) ||
    String(p.names[a] || '').localeCompare(String(p.names[b] || '')));

/* --- the flow ------------------------------------------------------------------ */

const programBump = (room, phase, ms) => {
  const p = room.program;
  p.phase = phase;
  p.seq = (p.seq || 0) + 1;
  p.paused = false;
  p.left = null;
  p.endsAt = ms ? Date.now() + ms : null;
  p.ms = ms || null;
};

/** The room leaves the game that ended for the standings card (as the host's «ارجع للألعاب» would). */
const programLeaveGame = (room) => {
  if (room.game) {
    bankNightPoints(room, (room.shared || {}).board);
    settlePredictions(room);
  }
  clearGameState(room);
  room.game = null;
  room.phase = 'lobby';
  room._autoNext = false;
  parkRoomBots(room);
};

/** The next game: chosen and started with the host's options; a refused start waits in its lobby. */
const programDealNext = (room) => {
  const p = room.program;
  const next = p.at + 1;
  if (next >= p.games.length) { programFinish(room); return; }
  p.at = next;
  p.banked = null;
  p.gained = null;
  p.waitWhy = null;
  const id = p.games[next].id;
  // Switched off since the program was set, or gone from the list in a deploy (a program
  // outlives one, in the room's storage): skipped, or its clock would throw every 30 s.
  if (roomGameIsOff(id) || ROOM_GAME_IDS.indexOf(id) === -1) {
    p.done.push({ id, coop: true, cut: true, skipped: true, places: [] });
    programBump(room, 'between', PROGRAM_BETWEEN_MS);
    return;
  }
  const opts = Object.assign({}, (room._progOpts || [])[next] || {});
  // A program runs by itself: «التالي لوحده» is on for the games that have it.
  if (AUTONEXT_GAMES[id]) opts.autoNext = true;
  room._progInside = true;
  try {
    applyRoomAction(room, room.hostId, 'chooseGame', { game: id });
  } finally { room._progInside = false; }
  p.present = programPeople(room).map(x => x.id);
  const trial = structuredClone(room);
  let why = '';
  trial._progInside = true;
  try { applyRoomAction(trial, room.hostId, 'start', opts); }
  catch (err) { why = String((err && err.message) || err || ''); }
  if (!why && trial.phase === 'lobby') why = '-';
  if (!why) {
    delete trial._progInside;
    Object.keys(room).forEach(k => { delete room[k]; });
    Object.assign(room, trial);
    programBump(room, 'playing', 0);
    return;
  }
  p.waitWhy = why === '-' ? '' : why.slice(0, 140);
  programBump(room, 'waiting', 0);
};

/** The finale: the table, the champions and the awards, and the crew's hook. */
const programFinish = (room) => {
  const p = room.program;
  if (room.game) programLeaveGame(room);
  const order = programOrder(p).filter(id => p.table[id].pts > 0 || p.done.some(g => g.places.some(x => x.id === id)));
  const table = order.map((id, i) => {
    const pts = p.table[id].pts;
    return { id, name: p.names[id] || '', pts, firsts: p.table[id].firsts,
      place: 1 + order.findIndex(x => p.table[x].pts === pts) };
  });
  const top = table.length ? table[0].pts : 0;
  const champions = top > 0 ? table.filter(r => r.pts === top).map(r => r.id) : [];
  p.final = { table, champions, awards: programAwards(room, table), games: p.done.filter(g => !g.skipped).length,
    minutes: Math.max(1, Math.round((Date.now() - (p.startedAt || Date.now())) / 60000)),
    stats: programStatsOf(room) };
  p.at = p.games.length;
  programBump(room, 'final', 0);
  roomEvent(room, 'programEnd', { names: champions.map(id => p.names[id] || '').filter(Boolean).join('، ') });
  nightProgramFinished(room, {
    code: room.code || '', at: Date.now(), startedAt: p.startedAt,
    games: p.done.map(g => ({ id: g.id, coop: g.coop, cut: g.cut, skipped: !!g.skipped,
      places: g.places.map(x => ({ id: x.id, name: p.names[x.id] || '', place: x.place, pts: x.pts })) })),
    table: table.map(r => Object.assign({}, r)),
    champions: champions.slice(),
    awards: p.final.awards.map(a => Object.assign({}, a))
  });
};

/**
 * «الشلة» (crews) hook: called once when a program reaches its finale, with
 *   summary = { code, at, startedAt,
 *               games:  [{ id, coop, cut, skipped, places: [{ id, name, place, pts }] }],
 *               table:  [{ id, name, pts, firsts, place }]   (best first; ids are the room's player ids),
 *               champions: [ids], awards: [{ k, id, name, v, g, with, from?, how? }] }
 * Two places keep it, both private (never projected by view.js):
 *   room.nightx.programs  the night's programs (the last 5), beside what bankNightPoints notes for
 *                         the crew: the crew's night recording (room.js sends the night to its crew
 *                         whenever room.night / room.nightx change, after a move and after the alarm)
 *                         reads it from there - crewNightInput (Crew.js) maps each id to its member
 *                         with room.crewLinks, as it does the night's rows (notes/games/program.md);
 *   room._nightSummary    the last one, for anything else that wants it (kept until the program is
 *                         closed or another starts).
 * Every game of a program is also banked on the room's own night table (bankNightPoints), with the
 * very places the program banked, so a crew's night counts a program's games like any other and the
 * two tables agree; the program's own table and its awards are the extra this hook adds.
 */
function nightProgramFinished(room, summary) {
  room._nightSummary = summary;
  const x = nightExtras(room);
  x.programs = (x.programs || []).concat([summary]).slice(-5);
}

/** After every move and every clock: a game that reached its end, a start pressed by hand. */
const programSync = (room) => {
  const p = room.program;
  if (!p || p.phase === 'final' || p.phase === 'between') return;
  const cur = programCurrent(room);
  if (!cur) return;
  if (p.phase === 'waiting') {
    if (room.game === cur.id && room.phase !== 'lobby') { programBump(room, 'playing', 0); p.present = programPeople(room).map(x => x.id); }
    else return;
  }
  if (p.phase === 'playing' && room.game === cur.id) {
    programObserve(room);
    if (programGameOver(room)) {
      programBank(room, false);
      // The game's own count to a next round is the program's now.
      const s = room.shared || {};
      ['nextAt', 'nextMs', 'nextFor', 'nextPaused'].forEach(k => { if (s && k in s) delete s[k]; });
      room._autoNext = false;
      programBump(room, 'result', PROGRAM_RESULT_LONG[room.game] || PROGRAM_RESULT_MS);
    }
  }
};

const programDeadline = (room) => {
  const p = room.program;
  if (!p || p.paused || typeof p.endsAt !== 'number') return null;
  return (p.phase === 'result' || p.phase === 'between') ? p.endsAt : null;
};

/** The program's own clock ran out: the result gives way to the standings, the standings to the next game. */
const programTimeout = (room, now) => {
  const due = programDeadline(room);
  if (due === null || now < due) return false;
  programAdvance(room);
  return true;
};

const programAdvance = (room) => {
  const p = room.program;
  if (p.phase === 'result') {
    programLeaveGame(room);
    if (p.at + 1 >= p.games.length) { programFinish(room); return; }
    programBump(room, 'between', PROGRAM_BETWEEN_MS);
    return;
  }
  if (p.phase === 'between') { programDealNext(room); return; }
};

/** True when the program's timeout due now starts a game that deals from a list: room.js loads the prompt memory. */
const programTimeoutDeals = (room, now) => {
  const due = programDeadline(room);
  return due !== null && now >= due && room.program.phase === 'between';
};

/* --- the host's actions (room-level, before any game's) ------------------------ */

const programCleanOpts = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  let text = '';
  try { text = JSON.stringify(raw); } catch (e) { return {}; }
  if (text.length > PROGRAM_OPTS_MAX) throw new Error('إعدادات لعبة من البرنامج كبيرة قوي');
  return JSON.parse(text);
};

/** A move-on tap aimed at a phase the program has already left does nothing. */
const programStale = (room, payload) => staleTap(payload, 'seq', room.program.seq);

/** True when `action` was one of the program's. */
const programAction = (room, playerId, action, payload) => {
  const p = room.program;
  const pl = payload || {};

  if (action === 'programStart') {
    requireHost(room, playerId);
    if (programOn(room)) throw new Error('فيه برنامج شغال دلوقتي');
    if (room.game) throw new Error('ارجعوا لقايمة الألعاب الأول');
    const list = Array.isArray(pl.games) ? pl.games : [];
    if (list.length < PROGRAM_MIN_GAMES) throw new Error('البرنامج محتاج 3 ألعاب على الأقل');
    if (list.length > PROGRAM_MAX_GAMES) throw new Error('البرنامج لحد 8 ألعاب');
    const games = [];
    const opts = [];
    list.forEach(g => {
      const id = String((g && g.id) || '');
      if (ROOM_GAME_IDS.indexOf(id) === -1) throw new Error('لعبة غير معروفة');
      if (roomGameIsOff(id)) throw new Error('اللعبة دي واقفة شوية عشان بنصلّحها، وهترجع قريب');
      games.push({ id });
      opts.push(programCleanOpts(g && g.opts));
    });
    const names = {};
    programPeople(room).forEach(x => { names[x.id] = x.name; });
    const table = {};
    programPeople(room).forEach(x => { table[x.id] = { pts: 0, firsts: 0 }; });
    room.program = { id: newDealId(), games, at: -1, seq: 0, phase: 'between', table, names, order: Object.keys(table),
      orders: [], done: [], gained: null, banked: null, startedAt: Date.now(), final: null, waitWhy: null, present: null };
    room._progOpts = opts;
    room._progLog = { buzz: [], trivia: [], chairs: [], liar: {}, caught: {}, lies: {}, detective: {}, sly: {}, strikes: {}, prophet: {}, seen: {}, dseq: 0, n: programCountsNew() };
    room._nightSummary = null;
    programBump(room, 'between', PROGRAM_FIRST_MS);
    roomEvent(room, 'programStart', { n: games.length });
    return true;
  }

  if (!p) {
    if (/^program/.test(action)) throw new Error('مفيش برنامج شغال');
    return false;
  }

  if (action === 'programSkip') {
    // The host, or a stand-in once the host is away: on to what comes next, now.
    requireMoveOn(room, playerId);
    if (programStale(room, pl)) return true;
    if (p.phase === 'result' || p.phase === 'between') { programAdvance(room); return true; }
    if (p.phase === 'playing' || p.phase === 'waiting') {
      // «⏭ اللعبة الجاية»: this game ends here, counted as it stands (a game nobody
      // scored in yet counts as everyone level), or not at all if it was never started.
      if (p.phase === 'playing' && room.game) programBank(room, true);
      else p.done.push({ id: (programCurrent(room) || {}).id, coop: true, cut: true, skipped: true, places: [] });
      programLeaveGame(room);
      if (p.at + 1 >= p.games.length) programFinish(room);
      else programBump(room, 'between', PROGRAM_BETWEEN_MS);
    }
    return true;
  }

  if (action === 'programEdit') {
    // «عدّل البرنامج وانت ماشي» (the owner's pick of 7 Oct 2026): between two games (or on the
    // line-up) the host re-sets what is still to come - added, removed, reordered - without
    // ending the program. Each coming game is { keep: i } (one of the program's own, i past the
    // games already dealt, its saved options kept: the options never leave the server) or
    // { id, opts } (a new one, or one whose options the host changed). The games played stay.
    requireHost(room, playerId);
    if (programStale(room, pl)) throw new Error('البرنامج اتحرك: افتح التعديل تاني');
    if (p.phase !== 'between') throw new Error('التعديل بين لعبتين بس');
    const played = p.at + 1;
    const list = Array.isArray(pl.games) ? pl.games : [];
    if (played + list.length > PROGRAM_MAX_GAMES) throw new Error('البرنامج لحد 8 ألعاب');
    if (played + list.length < PROGRAM_MIN_GAMES) throw new Error('البرنامج محتاج 3 ألعاب على الأقل');
    const games = [];
    const opts = [];
    list.forEach(g => {
      const keep = g && g.keep;
      if (typeof keep === 'number') {
        if (!(Number.isInteger(keep) && keep >= played && keep < p.games.length)) throw new Error('لعبة غير معروفة');
        games.push({ id: p.games[keep].id });
        opts.push(Object.assign({}, (room._progOpts || [])[keep] || {}));
        return;
      }
      const id = String((g && g.id) || '');
      if (ROOM_GAME_IDS.indexOf(id) === -1) throw new Error('لعبة غير معروفة');
      if (roomGameIsOff(id)) throw new Error('اللعبة دي واقفة شوية عشان بنصلّحها، وهترجع قريب');
      games.push({ id });
      opts.push(programCleanOpts(g && g.opts));
    });
    p.games = p.games.slice(0, played).concat(games);
    room._progOpts = (room._progOpts || []).slice(0, played).concat(opts);
    // The countdown starts again with the new next game (and the pause the editor took is over).
    programBump(room, 'between', played ? PROGRAM_BETWEEN_MS : PROGRAM_FIRST_MS);
    return true;
  }

  if (action === 'programPause') {
    requireMoveOn(room, playerId);
    if (programStale(room, pl)) return true;
    if (p.phase !== 'result' && p.phase !== 'between') return true;
    if (pl.on === false) {
      if (!p.paused) return true;
      p.paused = false;
      p.endsAt = Date.now() + Math.max(1500, p.left || 0);
      p.left = null;
    } else {
      if (p.paused || typeof p.endsAt !== 'number') return true;
      p.paused = true;
      p.left = Math.max(0, p.endsAt - Date.now());
    }
    return true;
  }

  if (action === 'programEnd') {
    // The host ends the night early: the game on now doesn't count (it wasn't finished);
    // one already banked (its result showing) does.
    requireHost(room, playerId);
    if (p.phase === 'final') return true;
    programFinish(room);
    return true;
  }

  if (action === 'programClose') {
    requireHost(room, playerId);
    if (p.phase !== 'final') throw new Error('البرنامج لسه شغال');
    room.program = null;
    room._progOpts = null;
    room._progLog = null;
    room._nightSummary = null;
    return true;
  }
  return false;
};

/**
 * Room-level moves the program changes while it runs: taking the room back to the
 * hub ends the game on now (the host's «⏭» by another door), a new game is the
 * program's to pick, and a game over stays over (its "play again" would start a
 * game the program already counted). Returns true when the move was handled here.
 */
const programGuard = (room, playerId, action, payload) => {
  const p = room.program;
  if (!p || room._progInside) return false;
  if (p.phase === 'final') {
    // A new game after the finale closes it (the table is already on the phones' «ليالينا»).
    if (action === 'chooseGame') { requireHost(room, playerId); room.program = null; room._progOpts = null; room._progLog = null; }
    return false;
  }
  if (action === 'backToHub') {
    requireHost(room, playerId);
    // Already between games (a double tap on «لعبة أخرى»): nothing more, or it would deal the next game.
    if (p.phase === 'between' || !room.game) return true;
    return programAction(room, playerId, 'programSkip', { seq: p.seq });
  }
  if (action === 'chooseGame') throw new Error('البرنامج شغال: اللعبة الجاية بتيجي لوحدها');
  if (p.phase === 'result' && (action === 'playAgain' || action === 'restart' || action === 'tourNew' || action === 'nextRound' || action === 'nextQuestion' || action === 'nextGame')) {
    throw new Error('البرنامج هيكمّل لوحده');
  }
  return false;
};

/* --- the highlights (the awards are made from them) --------------------------- */

const programLogKey = (room, k) => {
  const log = room._progLog;
  if (!log) return false;
  if (log.seen[k]) return false;
  log.seen[k] = 1;
  return true;
};

/*
 * «السهرة بالأرقام» (the owner's pick of 7 Oct 2026, 780): the finale counts the night up before
 * the champion - the games and the time (final.games, final.minutes, as before) and what the log
 * saw on the way (final.stats): questions asked (room trivia's and the buzzer's judged ones), presses
 * on the buzzer, lies told in كدّاب, strikes at bowling. Only what really happened; a zero isn't shown.
 */
const programCountsNew = () => ({ questions: 0, presses: 0, fibs: 0, knocks: 0 });
const programCount = (room, k, by) => {
  const log = room._progLog;
  if (!log) return;
  log.n = log.n || programCountsNew();
  log.n[k] = (log.n[k] || 0) + (by === undefined ? 1 : by);
};
const programStatsOf = (room) => Object.assign(programCountsNew(), ((room._progLog || {}).n) || {});

/** Before a move is applied: what the move is about to wipe (the buzzer's line). */
const programBeforeMove = (room, playerId, action, payload) => {
  const p = room.program;
  const log = room._progLog;
  if (!p || p.phase !== 'playing' || !log || !room.shared) return;
  // One count per question, keyed on it: a ✅ undone by ↶ then given again, or a stale ✅ for
  // an earlier first in line, used to count it twice (audit 7 Oct 2026, P4).
  if (room.game === 'buzzer' && action === 'correct' && room.hostId === playerId) {
    const b = room.shared.buzzes || [];
    const fresh = b.length && !(payload && payload.id !== undefined && b[0] && payload.id !== b[0].id);
    if (fresh && programLogKey(room, 'bq' + (room.shared.dealId || '') + ':' + room.shared.round)) programCount(room, 'questions');
  }
  if (room.game === 'buzzer' && action === 'correct' && room.hostId === playerId) {
    const b = room.shared.buzzes || [];
    if (b.length >= 2 && b[0].id && b[1].id && typeof b[0].at === 'number' && typeof b[1].at === 'number') {
      log.buzz.push({ id: b[0].id, ms: Math.max(0, b[1].at - b[0].at), with: b[1].id });
    }
  }
};

/** After every move and clock, while a program game is on: what the state shows now. */
const programObserve = (room) => {
  const log = room._progLog;
  const s = room.shared;
  if (!log || !s || typeof s !== 'object') return;
  const deal = s.dealId || '';
  const g = room.game;
  if (g === 'trivia' && s.phase === 'results' && programLogKey(room, 'tqn' + deal + ':' + s.qIndex)) programCount(room, 'questions');
  if (g === 'buzzer' && Array.isArray(s.buzzes)) {
    s.buzzes.forEach(b => { if (b && b.id && programLogKey(room, 'bp' + deal + ':' + s.round + ':' + b.id)) programCount(room, 'presses'); });
  }
  if (g === 'trivia' && s.phase === 'results' && Array.isArray(s.order) && s.order.length && programLogKey(room, 'tq' + deal + ':' + s.qIndex)) {
    const id = s.order[0];
    const a = (room._answers || {})[id];
    if (a && typeof room._qStart === 'number') log.trivia.push({ id, ms: Math.max(0, a.time - room._qStart) });
  }
  if (g === 'chairs' && Array.isArray(s.sits) && (s.phase === 'result' || s.phase === 'gameover') && programLogKey(room, 'ch' + deal + ':' + s.round)) {
    const first = s.sits.find(x => typeof x.ms === 'number');
    if (first && first.id) log.chairs.push({ id: first.id, ms: first.ms });
  }
  if (g === 'doubt' && Array.isArray(s.events)) {
    s.events.forEach(ev => {
      if (!ev || ev.seq <= (log.dseq || 0)) return;
      log.dseq = ev.seq;
      if (ev.type === 'play' && ev.id && room._doubt && Array.isArray(room._doubt.pile)) {
        const pl = room._doubt.pile.find(x => x.id === ev.id);
        if (pl) log.lies[ev.id] = { pid: ev.pid, lie: pl.cards.some(c => pcRank(c.c) !== pl.rank) };
      }
      if (ev.type === 'call' && ev.id) {
        if (log.lies[ev.id]) log.lies[ev.id].called = true;
        if (ev.truth === false && ev.pid) log.caught[ev.pid] = (log.caught[ev.pid] || 0) + 1;
      }
    });
  }
  // The spy games, once decided: who pointed at the spy, and a spy who got away.
  const spyGame = g === 'imposter' || g === 'chameleon' || g === 'spyfall' || g === 'fakeartist';
  const decided = spyGame && (s.outcome || s.winner) && (room.phase === 'result' || s.phase === 'results');
  if (decided && programLogKey(room, 'spy' + deal)) {
    const spies = g === 'chameleon' ? [s.chameleonId] : g === 'fakeartist' ? [s.fakeId] : (s.spyIds || []);
    const accused = g === 'fakeartist' ? (s.fakeCaught ? s.fakeId : null) : s.accusedId;
    const results = (s.vote && s.vote.results) || [];
    if (accused && spies.indexOf(accused) !== -1) {
      const opt = results.find(r => r.id === accused || r.ownerId === accused);
      ((opt && opt.voters) || []).forEach(name => {
        const pl = room.players.find(x => x.name === name);
        if (pl && spies.indexOf(pl.id) === -1) log.detective[pl.id] = { n: ((log.detective[pl.id] || {}).n || 0) + 1, g };
      });
    }
    const escaped = g === 'fakeartist' ? s.winner === 'fake' : (s.outcome && s.outcome !== 'caught' && s.outcome !== 'revealed');
    if (escaped) spies.forEach(id => { if (id) log.sly[id] = { g, how: s.outcome || 'escaped' }; });
  }
};

/** When a game ends: the tallies only its final state holds. */
const programLogEnd = (room, res) => {
  const log = room._progLog;
  const s = room.shared || {};
  if (!log) return;
  if (room.game === 'doubt') {
    Object.keys(log.lies).forEach(k => {
      const x = log.lies[k];
      if (x.lie && !x.called) log.liar[x.pid] = (log.liar[x.pid] || 0) + 1;
      // Counted once the game is over: until then a lie nobody called is still a secret.
      if (x.lie) programCount(room, 'fibs');
    });
    log.lies = {};
    log.dseq = 0;
  }
  if (room.game === 'bowling' && s.cards) {
    Object.keys(s.cards).forEach(id => {
      const n = programStrikes(s.cards[id]);
      if (n > (log.strikes[id] || 0)) log.strikes[id] = n;
      programCount(room, 'knocks', n);
    });
  }
  // «مين هيكسب؟»: a right guess on the game's winner (the first place).
  const pr = room.predict;
  if (pr && pr.game === room.game && res && !res.coop) {
    const winners = res.rows.filter(r => r.place === 1).map(r => r.id);
    Object.keys(pr.picks || {}).forEach(v => {
      if (winners.indexOf(pr.picks[v]) !== -1) log.prophet[v] = (log.prophet[v] || 0) + 1;
    });
  }
};

/** Strikes on a bowling card: the first ball of a rack knocking all ten down. */
const programStrikes = (card) => {
  let n = 0;
  (card.frames || []).forEach((fr, f) => {
    const last = f === (card.frames.length - 1) && fr.length > 2;
    if (fr[0] === 10) n++;
    if (last && fr[0] === 10 && fr[1] === 10) n++;
    if (last && fr.length > 2 && fr[2] === 10 && (fr[1] === 10 || (fr[0] + fr[1]) === 10)) n++;
  });
  return n;
};

/**
 * The awards: each from something that really happened tonight, each with its moment
 * ({ k, id, name, v, g, with }: the kind, who, a number, the game, someone else in it).
 * The words are the phones' (both languages); never a mean title.
 */
const programAwards = (room, table) => {
  const p = room.program;
  const log = room._progLog || {};
  const nameOf = (id) => (p.names || {})[id] || roomPlayerName(room, id) || '';
  const people = (id) => !!nameOf(id) && !isRoomBot(room, id);
  const out = [];
  const add = (a) => { if (a && people(a.id)) out.push(Object.assign({ name: nameOf(a.id) }, a)); };
  const minOf = (list) => (list || []).filter(x => people(x.id)).reduce((m, x) => (!m || x.ms < m.ms ? x : m), null);
  const maxOf = (map, least) => {
    let best = null;
    Object.keys(map || {}).forEach(id => {
      const v = typeof map[id] === 'number' ? map[id] : (map[id] || {}).n;
      if (!people(id) || !(v >= least)) return;
      if (!best || v > best.v) best = { id, v };
    });
    return best;
  };

  const buzz = minOf(log.buzz);
  if (buzz) add({ k: 'buzz', id: buzz.id, v: buzz.ms, g: 'buzzer', with: nameOf(buzz.with) });
  const tq = minOf(log.trivia);
  if (tq) add({ k: 'trivia', id: tq.id, v: tq.ms, g: 'trivia' });
  const liar = maxOf(log.liar, 2);
  if (liar) add({ k: 'liar', id: liar.id, v: liar.v, g: 'doubt' });
  const caught = maxOf(log.caught, 2);
  if (caught) add({ k: 'catcher', id: caught.id, v: caught.v, g: 'doubt' });
  const det = maxOf(log.detective, 1);
  if (det) add({ k: 'detective', id: det.id, v: det.v, g: (log.detective[det.id] || {}).g });
  const slyId = Object.keys(log.sly || {}).find(people);
  if (slyId) add({ k: 'sly', id: slyId, v: 1, g: log.sly[slyId].g, how: log.sly[slyId].how });
  const strike = maxOf(log.strikes, 2);
  if (strike) add({ k: 'strike', id: strike.id, v: strike.v, g: 'bowling' });
  const chair = minOf(log.chairs);
  if (chair) add({ k: 'chair', id: chair.id, v: chair.ms, g: 'chairs' });
  const prophet = maxOf(log.prophet, 1);
  if (prophet) add({ k: 'prophet', id: prophet.id, v: prophet.v });

  // From the night's own table: first places in a row, and the biggest climb.
  let streak = null;
  const runs = {};
  (p.done || []).forEach(gm => {
    const firsts = gm.coop || gm.skipped ? [] : gm.places.filter(x => x.place === 1).map(x => x.id);
    Object.keys(p.table).forEach(id => {
      runs[id] = firsts.indexOf(id) !== -1 ? (runs[id] || 0) + 1 : 0;
      if (runs[id] >= 2 && (!streak || runs[id] > streak.v)) streak = { id, v: runs[id] };
    });
  });
  if (streak) add({ k: 'streak', id: streak.id, v: streak.v });
  const orders = p.orders || [];
  if (orders.length >= 2) {
    const first = orders[0];
    const last = orders[orders.length - 1];
    let climb = null;
    last.forEach((id, i) => {
      const was = first.indexOf(id);
      if (was === -1) return;
      const up = was - i;
      if (up >= 2 && (!climb || up > climb.up)) climb = { id, up, from: was + 1, to: i + 1 };
    });
    if (climb) add({ k: 'climb', id: climb.id, v: climb.to, from: climb.from });
  }

  // Varied: at most two awards a person, the kinds in the order above.
  const each = {};
  return out.filter(a => {
    each[a.id] = (each[a.id] || 0) + 1;
    return each[a.id] <= PROGRAM_AWARDS_EACH;
  }).slice(0, PROGRAM_AWARDS_MAX);
};

/** A person left: their row stays on the night's table under their name. Nothing else to do. */
const programPlayerLeft = (room, playerId, name) => {
  const p = room.program;
  if (!p) return;
  // Kept for anyone, not only a row already on the table: a game they played may still be banked.
  if (name) p.names[playerId] = p.names[playerId] || name;
  programSync(room);
};
