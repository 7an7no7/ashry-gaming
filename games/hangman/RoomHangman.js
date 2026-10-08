/* ============================================================================
   المشنقة — HANGMAN in rooms
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js; the letters and the judging are
   Hangman.js, shared with the page.

   The owner's rules for a room (22 Sep 2026): two ways, the host's choice.
   "One writes, the rest guess" (the default): the writer types a word, a
   name or a film (up to three words, a hint if they like), and everyone else guesses it on their own board, each
   with their own man; the writer moves round the table. "A race": the app
   deals one word, with its category as the hint, and everyone races on their
   own board. A word ends when every guesser has solved it or been hanged, on
   the clock (off, 60 or 90 seconds: whoever hasn't solved it by then has
   failed), or when the host closes it. 3, 5 or 10 words make a game.
   Scoring: a solve is 10 plus a bonus by the order the solves came in (+5,
   +4 ... +1), in both ways (the owner, 24 Sep 2026: the first to get it gets
   the most); with a writer, the writer also scores 5 for every guesser who
   didn't - only when somebody solved it, and never more than the best solver
   took for that word (the review of 1 Oct 2026: a word nobody could get paid
   its writer most). No computer players.

   The next round (the owner, 2 Oct 2026):
   - A third way, team against team: two teams (the host's split in the lobby);
     one member of one team writes (in turn), the other team guesses on one
     board out loud and its captain (in turn, a new one every word) taps the
     letters; the teams swap every word. The team's points go to every member,
     so the room's board, the night and the program read the teams.
     Decided here: a team's solve is 10 (no order, one board), the streak and
     the lifelines as below; a word the team fails scores nobody (both teams
     write alike, and a writer must not gain by an impossible word).
   - Levels: Easy 8 misses, Normal 6, Hard 4 (settings.level). The race's level
     picks the words' length too, and Hard hides the category.
   - The race's category: «من كل حاجة», or one of the app's lists (HM_CATS).
   - Lifelines, each once a word on each board: «اكشف حرف» (reveal) and «شيل ٣
     حروف غلط» (remove); each used takes 3 off that word's points if solved.
   - The writer's hints: up to 3; the first from the start (shared.cat), the
     2nd on a board's 2nd miss, the 3rd on its 4th - on that board's own phone.
   - The streak: the 2nd word solved in a row +2, the 3rd +4 … up to +10; a
     fail resets it (shared.streak, by player, or by team).
   - The endings: each board that is solved or hanged gets one of eight
     endings of its kind (progress.end / tb.end), never the one picked last.

   What is hidden: the word (room._hm.word) until the word ends, the hints not
   yet opened (room._hm.hints), and each board's letters, which reach their
   own phone only (room.secrets[pid]); the writer's phone gets the word and its
   hints. `shared.progress` is what the table may see of each board: how many
   of the word's letters it shows, how many misses, whether it is solved or
   hanged, and its ending - never which letters. In the team way the one board
   is the table's (shared.tb: the team talks it over out loud), the word still
   only on the writer's phone.

   shared:
     phase     'writing' | 'guessing' | 'result' | 'gameover'
     settings  { mode: 'setter' | 'race' | 'teams', rounds, clock, lang, level, cat }
     max       the misses a board takes (the level)
     round     the word number (1..rounds) · rounds
     order     the writers' order (setter) · setter, setterName
     len       the word's letters · shape  each word's length, for the blanks
     alpha     'ar' | 'en' · cat  the first hint: the race's category, or the writer's (optional)
     progress  { pid: { n, miss, state, at, end } } · solved  [pid, …] in order
     streak    { pid | 't0' | 't1': words solved in a row }
     endsAt    the word's clock
     openAt    1200: a written word's guessing opens here (5 s after «جاهزة», while its writer may take it back)
     teams     [[ids], [ids]] · gt the team guessing this word · captain, captainName
     tpts      [team 0's points, team 1's] · tb the team's board { pattern, g, miss, x, state, lr, lx, hints, end }
     result    { word, cat, setter, setterName, setterPts, rows: [{ id, name, state, miss, pts, end, run, life }], team }
     scores / board   the game's points, best first
   ========================================================================= */
const HM_GRACE_MS = 1500;
const HM_ROUNDS = [3, 5, 10];
const HM_ROUNDS_TEAMS = [4, 6, 10];
const HM_CLOCKS = [0, 60, 90];
const HM_SOLVE_POINTS = 10;
const HM_SPEED_BONUS = [5, 4, 3, 2, 1];
const HM_SETTER_POINTS = 5;
// 1200 (the owner's picks of 7 Oct 2026): «اتكتبت غلط؟» - after «جاهزة» the writer has 5 s to take the
// word back and fix it, and nobody guesses before then. The hold is asked for by the page (`hold` on
// setWord), so a phone on an older page (and the robots) plays on as before. A second's grace for the
// writer's tap on its way.
const HM_TAKE_BACK_MS = 5000;
const HM_TAKE_BACK_GRACE_MS = 1000;

const hmRoomOptions = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const modes = ['setter', 'race', 'teams'];
  const mode = modes.indexOf(p.mode) !== -1 ? p.mode : (modes.indexOf(was.mode) !== -1 ? was.mode : 'setter');
  const pickN = (list, v, w, dflt) => (list.indexOf(Number(v)) !== -1 ? Number(v) : (list.indexOf(Number(w)) !== -1 ? Number(w) : dflt));
  const rounds = mode === 'teams' ? HM_ROUNDS_TEAMS : HM_ROUNDS;
  return {
    mode: mode,
    rounds: pickN(rounds, p.rounds, was.rounds, mode === 'teams' ? 6 : 5),
    clock: pickN(HM_CLOCKS, p.clock, was.clock, 0),
    lang: p.lang === 'en' ? 'en' : (p.lang === 'ar' ? 'ar' : (was.lang === 'en' ? 'en' : 'ar')),
    // Every field new on 2 Oct 2026 is optional: a phone on an older page plays Normal, «من كل حاجة».
    level: hmLevelOf(p.level !== undefined ? p.level : was.level),
    cat: hmCatKey(p.cat !== undefined ? p.cat : was.cat)
  };
};

const hmHere = (room) => room.players.map(p => p.id);
const hmTeamsWay = (s) => !!(s && s.settings && s.settings.mode === 'teams');

/** Who guesses this word: everyone at the table but the writer. */
const hmGuessers = (room) => {
  const s = room.shared;
  return hmHere(room).filter(id => id !== s.setter);
};

/** The hints a board has opened: the first from the start, the next on its 2nd and 4th miss. */
const hmOpenHints = (room, b) => {
  const hints = ((room._hm || {}).hints || []);
  return hints.slice(0, hmHintsOpen(b ? b.miss.length : 0));
};

/** What one board looks like to whoever may see it: its letters, never the word. */
const hmBoardView = (room, b) => {
  const h = room._hm || {};
  const v = { g: b.g.slice(), miss: b.miss.slice(), state: b.state, pattern: hmPattern(h.word, b.g) };
  if (b.x && b.x.length) v.x = b.x.slice();
  if (b.lr) v.lr = typeof b.lr === 'string' ? b.lr : true;   // the letter it showed: already on the board, nothing new
  if (b.lx) v.lx = true;
  if (b.end !== undefined) v.end = b.end;
  const hints = hmOpenHints(room, b);
  if (hints.length > 1) v.hints = hints;
  return v;
};

/** Each board's letters to its own phone; the word (and its hints) to the writer's. In the team way the board is the table's. */
const hmWriteSecrets = (room) => {
  const s = room.shared;
  const h = room._hm || {};
  room.secrets = {};
  if (s.phase !== 'guessing') return;
  if (hmTeamsWay(s)) {
    const b = h.boards && h.boards.team;
    if (b) s.tb = hmBoardView(room, b);
  } else {
    Object.keys(h.boards || {}).forEach(pid => { room.secrets[pid] = hmBoardView(room, h.boards[pid]); });
  }
  if (s.setter && h.word) room.secrets[s.setter] = { word: h.word, hints: (h.hints || []).slice() };
};

/** What the table sees of one board. */
const hmProgressOf = (word, b, at) => {
  const out = { n: hmFound(hmPattern(word, b.g)), miss: b.miss.length, state: b.state, at: at };
  if (b.end !== undefined) out.end = b.end;
  return out;
};

/**
 * A board that has just been solved or has run out of misses gets its ending: one of the eight of
 * its kind, never the last one picked in the room nor this player's own last (the owner: never the
 * same twice in a row). A board the clock or the host closes keeps the frozen man (⏰), no ending.
 */
const hmGiveEnd = (room, id, b) => {
  if (b.end !== undefined || b.state === 'play') return;
  const kind = b.state === 'won' ? 'won' : 'lost';
  const mem = room._hmEnd || (room._hmEnd = { won: -1, lost: -1, by: {} });
  const mine = mem.by[id] || (mem.by[id] = {});
  b.end = hmPickEnd([mem[kind], mine[kind]]);
  mem[kind] = b.end;
  mine[kind] = b.end;
};

/** The word is out: every guesser gets a board (the team one board), the clock starts (after the hold, 1200). */
const hmBeginGuessing = (room, word, hints, hold) => {
  const s = room.shared;
  const list = (hints || []).filter(Boolean);
  room._hm = { word: word, boards: {}, hints: list };
  s.progress = {};
  s.solved = [];
  if (hmTeamsWay(s)) {
    room._hm.boards.team = hmNewBoard(s.max);
  } else {
    hmGuessers(room).forEach(pid => { room._hm.boards[pid] = hmNewBoard(s.max); s.progress[pid] = hmProgressOf(word, room._hm.boards[pid], null); });
  }
  s.len = hmLettersOf(word).length;
  s.shape = hmShape(word);
  s.alpha = hmAlphaOf(word);
  s.cat = list[0] || '';
  s.hintsN = list.length;
  s.phase = 'guessing';
  s.roster = hmHere(room);
  s.openAt = hold ? Date.now() + HM_TAKE_BACK_MS : null;
  s.endsAt = s.settings.clock ? (s.openAt || Date.now()) + s.settings.clock * 1000 : null;
  hmWriteSecrets(room);
};

/** 1200: the word is still on hold - nobody guesses yet. */
const hmOnHold = (s) => !!(s.openAt && Date.now() < s.openAt);

/** 1200: nothing has been played on any board of this word yet. */
const hmWordUntouched = (room) => Object.values((room._hm || {}).boards || {})
  .every(b => !b.g.length && !b.miss.length && !b.lr && !b.lx && !(b.x && b.x.length));

/** 1200: «رجّعها» - the word goes back to its writer's form, written as it was (the writer's slice only). */
const hmTakeBack = (room) => {
  const s = room.shared;
  const h = room._hm || {};
  const draft = { word: h.word || '', hints: (h.hints || []).slice() };
  room._hm = { word: '', boards: {}, hints: [] };
  s.phase = 'writing';
  s.progress = {};
  s.solved = [];
  s.endsAt = null;
  s.openAt = null;
  s.cat = '';
  s.hintsN = 0;
  s.len = 0;
  s.shape = [];
  if (hmTeamsWay(s)) s.tb = null;
  room.secrets = { [s.setter]: { draft: draft } };
};

/** The writer of this word: the next in the order who is still here (latecomers join the end). */
const hmNextSetter = (room) => {
  const s = room.shared;
  const here = hmHere(room);
  s.order = (s.order || []).filter(id => here.indexOf(id) !== -1);
  here.forEach(id => { if (s.order.indexOf(id) === -1) s.order.push(id); });
  if (!s.order.length) return null;
  s.setterAt = ((typeof s.setterAt === 'number' ? s.setterAt : -1) + 1) % s.order.length;
  return s.order[s.setterAt];
};

/* --- the team way ---------------------------------------------------------------- */

/** The team (0 or 1) a player is on, or -1. */
const hmTeamOf = (s, pid) => ((s.teams || [])[0] || []).indexOf(pid) !== -1 ? 0 : (((s.teams || [])[1] || []).indexOf(pid) !== -1 ? 1 : -1);

/** The members of team k still here. */
const hmTeamHere = (room, k) => {
  const here = hmHere(room);
  return (((room.shared.teams || [])[k]) || []).filter(id => here.indexOf(id) !== -1);
};

/** Whoever is here and on no team (a latecomer) joins the smaller one, with that team's points so far. */
const hmTeamsFit = (room) => {
  const s = room.shared;
  s.teams = s.teams || [[], []];
  const here = hmHere(room);
  s.teams = s.teams.map(t => t.filter(id => here.indexOf(id) !== -1));
  here.forEach(id => {
    if (hmTeamOf(s, id) !== -1) return;
    const k = s.teams[0].length <= s.teams[1].length ? 0 : 1;
    s.teams[k].push(id);
    s.scores = s.scores || {};
    s.scores[id] = (s.tpts || [0, 0])[k] || 0;
  });
};

/** The next of team k in its turn (`key`: 'wAt' the writers, 'cAt' the captains). */
const hmTeamNext = (room, k, key) => {
  const s = room.shared;
  const list = hmTeamHere(room, k);
  if (!list.length) return null;
  s[key] = s[key] || [-1, -1];
  s[key][k] = ((typeof s[key][k] === 'number' ? s[key][k] : -1) + 1) % list.length;
  return list[s[key][k]];
};

/** The team that hasn't anyone here any more: the game can't go on. */
const hmTeamsShort = (room) => hmTeamHere(room, 0).length < 1 || hmTeamHere(room, 1).length < 1;

/** The team guessing word `round`: they swap every word, the first one drawn at the start. */
const hmGuessTeam = (s) => ((s.round - 1) + (s.firstTeam || 0)) % 2;

/** A new word in the team way: the other team's next writer writes, this team's next captain taps. */
const hmTeamDeal = (room) => {
  const s = room.shared;
  hmTeamsFit(room);
  s.gt = hmGuessTeam(s);
  s.tb = null;
  s.setter = hmTeamNext(room, 1 - s.gt, 'wAt');
  s.setterName = roomPlayerName(room, s.setter);
  s.captain = hmTeamNext(room, s.gt, 'cAt');
  s.captainName = roomPlayerName(room, s.captain);
  s.phase = 'writing';
  s.roster = hmHere(room);
  room.secrets = {};
};

/** Places for the night and the program (PROGRAM_TEAMS in RoomProgram.js): the team that won first, or both level. */
const hmProgramTeams = (room) => {
  const s = room.shared || {};
  if (!hmTeamsWay(s) || s.phase !== 'gameover' || !Array.isArray(s.teams)) return null;
  const p = s.tpts || [0, 0];
  const t = s.teams;
  // A team that left whole is no place: the team still here is first (not 2nd behind an empty group).
  if (!t[0].length || !t[1].length) return [t[0].concat(t[1])];
  if (p[0] === p[1]) return [t[0].concat(t[1])];
  return p[0] > p[1] ? [t[0].slice(), t[1].slice()] : [t[1].slice(), t[0].slice()];
};

/* --- dealing ----------------------------------------------------------------------- */

/** A new word: a writer to write one, or the app's for the race. */
const hmDeal = (room) => {
  const s = room.shared;
  s.result = null;
  s.progress = {};
  s.solved = [];
  s.endsAt = null;
  s.openAt = null;
  s.cat = '';
  s.hintsN = 0;
  s.len = 0;
  s.shape = [];
  room._hm = { word: '', boards: {}, hints: [] };
  if (s.settings.mode === 'race') {
    const pool = hmPool(s.settings.lang);
    if (!pool.length) throw new Error('مفيش كلمات');
    const accept = hmDealFilter(pool, s.settings.cat, s.settings.level);
    const pick = accept ? nextPrompts(room, pool, 'hangman_' + s.settings.lang, 1, accept)[0] : nextPrompt(room, pool, 'hangman_' + s.settings.lang);
    s.setter = null;
    s.setterName = '';
    // Hard hides the category (the owner, 2 Oct 2026).
    hmBeginGuessing(room, pick.w, s.settings.level === 'hard' ? [] : [pick.c]);
    return;
  }
  if (hmTeamsWay(s)) { hmTeamDeal(room); return; }
  s.setter = hmNextSetter(room);
  s.setterName = roomPlayerName(room, s.setter);
  s.phase = 'writing';
  s.roster = hmHere(room);
  room.secrets = {};
};

/** Every guesser still here is done: solved or hanged (in the team way, the one board). */
const hmAllDone = (room) => {
  const s = room.shared;
  if (hmTeamsWay(s)) { const b = room._hm && room._hm.boards.team; return !b || b.state !== 'play'; }
  const here = hmHere(room);
  return Object.keys(s.progress || {}).filter(id => here.indexOf(id) !== -1).every(id => s.progress[id].state !== 'play');
};

/** A word's points for a solve: 10, the order's bonus, the streak's, less 3 a lifeline. */
const hmSolvePoints = (bonus, run, b) => Math.max(0, HM_SOLVE_POINTS + (bonus || 0) + hmStreakBonus(run) - HM_LIFE_COST * hmLifeUsed(b));

/** The word ends: whoever is still guessing has failed, and the points go on the board. */
const hmEndWord = (room) => {
  const s = room.shared;
  const h = room._hm || { boards: {} };
  if (s.phase !== 'guessing') return;
  s.streak = s.streak || {};
  if (hmTeamsWay(s)) { hmEndTeamWord(room); return; }
  const race = s.settings.mode === 'race';
  const here = hmHere(room);
  const rows = [];
  let failed = 0;
  let top = 0;      // the best solver's points for this word: the writer's ceiling
  Object.keys(h.boards).forEach(pid => {
    const b = h.boards[pid];
    if (b.state === 'play') b.state = 'lost';
    const present = here.indexOf(pid) !== -1;
    let pts = 0;
    if (b.state === 'won') {
      const at = s.solved.indexOf(pid);
      s.streak[pid] = (s.streak[pid] || 0) + 1;
      pts = hmSolvePoints(at !== -1 ? (HM_SPEED_BONUS[at] || 0) : 0, s.streak[pid], b);
    } else {
      s.streak[pid] = 0;
      if (present) failed++;
    }
    if (pts) addScore(room, pid, pts);
    if (pts > top) top = pts;
    s.progress[pid] = hmProgressOf(h.word, b, s.solved.indexOf(pid) === -1 ? null : s.solved.indexOf(pid));
    if (present) {
      const row = { id: pid, name: roomPlayerName(room, pid), state: b.state, miss: b.miss.length, pts: pts, run: s.streak[pid], life: hmLifeUsed(b) };
      if (b.end !== undefined) row.end = b.end;
      rows.push(row);
    }
  });
  let setterPts = 0;
  if (!race && s.setter && here.indexOf(s.setter) !== -1) {
    // A word nobody solved earns its writer nothing, and a word only a few solved
    // can't pay the writer more than the best of them took.
    setterPts = top ? Math.min(failed * HM_SETTER_POINTS, top) : 0;
    if (setterPts) addScore(room, s.setter, setterPts);
  }
  rows.sort((a, b) => b.pts - a.pts);
  s.result = { word: h.word, cat: s.cat, setter: s.setter || null, setterName: s.setterName || '', setterPts: setterPts, rows: rows, hints: (h.hints || []).slice() };
  hmFinishWord(room);
};

/** The team's word ends: a solve pays every member of the team guessing; a fail pays nobody. */
const hmEndTeamWord = (room) => {
  const s = room.shared;
  const h = room._hm || { boards: {} };
  const b = h.boards.team || hmNewBoard(s.max);
  if (b.state === 'play') b.state = 'lost';
  const key = 't' + s.gt;
  s.tpts = s.tpts || [0, 0];
  let pts = 0;
  if (b.state === 'won') {
    s.streak[key] = (s.streak[key] || 0) + 1;
    pts = hmSolvePoints(0, s.streak[key], b);
    s.tpts[s.gt] += pts;
    (s.teams[s.gt] || []).forEach(id => addScore(room, id, pts));
  } else {
    s.streak[key] = 0;
  }
  s.tb = hmBoardView(room, b);
  const row = { id: key, team: s.gt, state: b.state, miss: b.miss.length, pts: pts, run: s.streak[key], life: hmLifeUsed(b) };
  if (b.end !== undefined) row.end = b.end;
  s.result = { word: h.word, cat: s.cat, setter: s.setter || null, setterName: s.setterName || '', setterPts: 0, rows: [row], team: s.gt,
    captainName: s.captainName || '', hints: (h.hints || []).slice() };
  hmFinishWord(room);
};

const hmFinishWord = (room) => {
  const s = room.shared;
  s.endsAt = null;
  s.openAt = null;
  s.board = scoreboardOf(room);
  s.phase = s.round >= s.rounds ? 'gameover' : 'result';
  room.phase = s.phase === 'gameover' ? 'gameover' : 'play';
  room.secrets = {};
};

/** Room-level: fewer than two left means there is nobody to guess, or nobody to write for (or a team is empty). */
const hmTooFew = (room) => room.players.length < 2 || (hmTeamsWay(room.shared) && hmTeamsShort(room));

/** The host's split for the team way, before a game (vote chess's: `{ shuffle }` draws again, `{ move: pid }` swaps one). */
const hmLobbySides = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  // { clear }: the host left the team way - no split on anyone's lobby.
  if (p.clear) { if (room.shared) delete room.shared.lobby; return; }
  const ids = hmHere(room);
  room.shared = room.shared || {};
  const was = (room.shared.lobby && room.shared.lobby.sides) || null;
  let sides;
  if (p.shuffle || !was) sides = vcRandomSides(ids);
  else {
    sides = Object.assign({}, was);
    const who = String(p.move || '');
    if (ids.indexOf(who) !== -1 && (sides[who] === 0 || sides[who] === 1)) sides[who] = 1 - sides[who];
    sides = vcFitSides(ids, sides);
  }
  room.shared.lobby = { sides: sides };
};

const hmNewRoomGame = (room, playerId, payload, again) => {
  requireHost(room, playerId);
  if (room.players.length < 2) throw new Error('المشنقة محتاجة لاعبين على الأقل');
  const prev = room.shared || {};
  const settings = hmRoomOptions(again ? prev.settings : payload, prev.settings);
  room.shared = {
    settings: settings,
    max: hmMaxOf(settings.level),
    round: 1,
    rounds: settings.rounds,
    order: shuffled(hmHere(room)),
    setterAt: -1,
    scores: {},
    streak: {},
    board: []
  };
  if (settings.mode === 'teams') {
    const ids = hmHere(room);
    let sides;
    if (again && Array.isArray(prev.teams)) {
      // Play again keeps the teams; the team that guessed second goes first.
      sides = {};
      prev.teams.forEach((t, k) => t.forEach(id => { sides[id] = k; }));
      room.shared.firstTeam = 1 - (prev.firstTeam || 0);
    } else {
      sides = (prev.lobby && prev.lobby.sides) || vcRandomSides(ids);
      room.shared.firstTeam = 0;
    }
    sides = vcFitSides(ids, sides);
    room.shared.teams = [ids.filter(id => sides[id] === 0), ids.filter(id => sides[id] === 1)];
    room.shared.tpts = [0, 0];
    room.shared.wAt = [-1, -1];
    room.shared.cAt = [-1, -1];
  }
  room.phase = 'play';
  hmDeal(room);
  room.shared.board = scoreboardOf(room);
};

/** The board this move plays on: the player's own, or in the team way the team's - and only its captain taps. */
const hmBoardFor = (room, playerId) => {
  const s = room.shared;
  const h = room._hm;
  if (hmTeamsWay(s)) {
    if (playerId !== s.captain) throw new Error(playerId === s.setter ? 'انت اللي كاتب الكلمة' : 'الكابتن بس اللي بيدوس، قولّه الحرف');
    return { id: 't' + s.gt, b: h && h.boards.team };
  }
  const b = h && h.boards[playerId];
  if (!b) throw new Error(playerId === s.setter ? 'انت اللي كاتب الكلمة' : 'انت بتتفرج الكلمة دي');
  return { id: playerId, b: b };
};

/** After a move on a board: its progress, its ending, and whether the word is over. */
const hmAfterMove = (room, playerId, who, out) => {
  const s = room.shared;
  const h = room._hm;
  if (out === 'won' && !hmTeamsWay(s)) s.solved.push(playerId);
  if (out === 'won' || out === 'lost') hmGiveEnd(room, who.id, who.b);
  if (!hmTeamsWay(s)) s.progress[playerId] = hmProgressOf(h.word, who.b, out === 'won' ? s.solved.length - 1 : (s.progress[playerId] || {}).at);
  if (hmAllDone(room)) { hmEndWord(room); return; }
  hmWriteSecrets(room);
};

const hangmanAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'sides') { hmLobbySides(room, playerId, p); return; }
  if (action === 'start') { hmNewRoomGame(room, playerId, p, false); return; }
  const s = room.shared;
  if (!s || !s.settings) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'playAgain') {
    if (s.phase !== 'gameover') return;
    hmNewRoomGame(room, playerId, p, true);
    return;
  }

  if (action === 'setWord') {
    if (s.phase !== 'writing' || staleTap(p, 'round', s.round)) return;
    if (playerId !== s.setter) throw new Error('مش انت اللي بتكتب الكلمة دي');
    const problem = hmWordProblem(p.word);
    if (problem) throw new Error(problem === 'sentence' ? 'كلمة أو اسم لحد 3 كلمات بس، مش جملة' : 'اكتب كلمة أو اسم من 3 لـ 20 حرف، حروف بس');
    if (!hmTeamsWay(s) && hmGuessers(room).length < 1) throw new Error('مفيش حد يخمّن');
    // The hints are the writer's choice: up to three (`hints`), or the one `hint` of an older page.
    const raw = Array.isArray(p.hints) ? p.hints.slice(0, HM_HINTS_MAX) : [p.hint];
    // A hint that would open only with the losing miss can never help: it isn't kept (an older page could send it).
    const hints = raw.map(hmCleanHint).filter(Boolean).slice(0, hmHintsUsable(s.max));
    if (hints.some(x => hmHintProblem(x, p.word))) throw new Error('التلميح فيه الكلمة نفسها');
    hmBeginGuessing(room, hmClean(p.word), hints, p.hold === true);
    return;
  }

  if (action === 'takeBack') {
    // 1200: the writer's «رجّعها», within the 5 s and before any board has moved.
    if (s.phase !== 'guessing' || staleTap(p, 'round', s.round)) return;
    if (playerId !== s.setter) throw new Error('مش انت اللي كاتب الكلمة');
    if (!s.openAt || Date.now() > s.openAt + HM_TAKE_BACK_GRACE_MS || !hmWordUntouched(room)) throw new Error('فات الوقت، الكلمة اتلعبت');
    hmTakeBack(room);
    return;
  }

  if (action === 'guess' || action === 'whole') {
    if (s.phase !== 'guessing' || staleTap(p, 'round', s.round) || hmOnHold(s)) return;
    const who = hmBoardFor(room, playerId);
    if (!who.b) return;
    const out = hmApply(who.b, room._hm.word, action === 'whole' ? p.text : p.letter, action === 'whole');
    if (!out) return;
    hmAfterMove(room, playerId, who, out);
    return;
  }

  if (action === 'reveal' || action === 'remove') {
    // A lifeline: decided here, where the word is.
    if (s.phase !== 'guessing' || staleTap(p, 'round', s.round) || hmOnHold(s)) return;
    const who = hmBoardFor(room, playerId);
    if (!who.b) return;
    if (action === 'reveal') {
      if (!hmReveal(who.b, room._hm.word)) {
        // Unused and still playing: one letter left, which a lifeline never gives - say so, not nothing.
        if (!who.b.lr && who.b.state === 'play') throw new Error('فاضل حرف واحد: خمّنه انت!');
        return;
      }
    } else if (!hmRemoveWrong(who.b, room._hm.word).length) return;
    hmAfterMove(room, playerId, who, 'hit');
    return;
  }

  if (action === 'closeWord') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'guessing' || staleTap(p, 'round', s.round)) return;
    hmEndWord(room);
    return;
  }

  if (action === 'skipTurn') {
    // The writer's phone went quiet: the next one writes this word.
    requireMoveOn(room, playerId);
    // The writer it was pressed for, too: a double tap must not skip the next writer as well.
    if (s.phase !== 'writing' || staleTap(p, 'round', s.round) || staleTap(p, 'setter', s.setter)) return;
    if (hmTeamsWay(s)) {
      s.setter = hmTeamNext(room, 1 - s.gt, 'wAt');
      s.setterName = roomPlayerName(room, s.setter);
      return;
    }
    hmDeal(room);
    return;
  }

  if (action === 'nextCaptain') {
    // The team way: the captain's phone went quiet - the next one on the team taps.
    requireMoveOn(room, playerId);
    if (!hmTeamsWay(s) || (s.phase !== 'guessing' && s.phase !== 'writing') || staleTap(p, 'round', s.round) || staleTap(p, 'captain', s.captain)) return;
    s.captain = hmTeamNext(room, s.gt, 'cAt');
    s.captainName = roomPlayerName(room, s.captain);
    return;
  }

  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'result') return;
    if (hmTooFew(room)) throw new Error('المشنقة محتاجة لاعبين على الأقل');
    s.round++;
    room.phase = 'play';
    hmDeal(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const hmDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'guessing' && s.endsAt ? s.endsAt + HM_GRACE_MS : null;
};

const hmTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'guessing' || !s.endsAt || now < s.endsAt + HM_GRACE_MS) return false;
  hmEndWord(room);
  return true;
};

/* --- someone leaves -------------------------------------------------------------
   A guesser's board goes with them, and the word may be over without them. A
   writer who leaves before writing hands the word to the next; after writing,
   the word plays on without their points. Fewer than two left ends the game.
   In the team way: a captain who leaves hands the board to the next on the
   team, a writer who leaves before writing to the next on theirs, and a team
   with nobody left ends the game.
   ------------------------------------------------------------------------------ */
const hmPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.settings || s.phase === 'gameover') return;
  // The next setter is counted from setterAt: someone leaving at or before it moves it back one,
  // or the next one in the order would be skipped (and the one before would set twice).
  const leftAt = (s.order || []).indexOf(playerId);
  if (leftAt !== -1 && typeof s.setterAt === 'number' && leftAt <= s.setterAt) s.setterAt -= 1;
  s.order = (s.order || []).filter(id => id !== playerId);
  const team = hmTeamsWay(s) ? hmTeamOf(s, playerId) : -1;
  if (team !== -1) {
    // The same for each team's turns: the ones after the leaver move back one.
    ['wAt', 'cAt'].forEach(key => {
      const at = (s.teams[team] || []).indexOf(playerId);
      if (s[key] && at !== -1 && typeof s[key][team] === 'number' && at <= s[key][team]) s[key][team] -= 1;
    });
    s.teams[team] = s.teams[team].filter(id => id !== playerId);
  }
  if (s.phase === 'guessing' && room._hm && room._hm.boards[playerId]) {
    delete room._hm.boards[playerId];
    delete s.progress[playerId];
    s.solved = (s.solved || []).filter(id => id !== playerId);
  }
  if (hmTooFew(room)) {
    if (s.phase === 'guessing') hmEndWord(room);
    s.phase = 'gameover';
    room.phase = 'gameover';
    s.endsAt = null;
    s.board = scoreboardOf(room);
    room.secrets = {};
    return;
  }
  if (s.phase === 'writing' && s.setter === playerId) {
    if (hmTeamsWay(s)) {
      s.setter = hmTeamNext(room, 1 - s.gt, 'wAt');
      s.setterName = roomPlayerName(room, s.setter);
      return;
    }
    // The one who left was up (setterAt has moved back one above): the next in the order writes.
    hmDeal(room);
    return;
  }
  if (hmTeamsWay(s) && s.captain === playerId && (s.phase === 'writing' || s.phase === 'guessing')) {
    s.captain = hmTeamNext(room, s.gt, 'cAt');
    s.captainName = roomPlayerName(room, s.captain);
  }
  if (s.phase === 'guessing') {
    if (hmAllDone(room)) { hmEndWord(room); return; }
    hmWriteSecrets(room);
  }
  s.board = scoreboardOf(room);
};
