/* ============================================================================
   ONE SETS, EVERYONE SOLVES — the engine (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js, whose helpers it uses (addScore,
   scoreboardOf, nextPrompt, staleTap, guessVerdict). The four games' own rules
   are SolveGames.js, shared with the page.

   The owner's decisions (23 Sep 2026, asked one by one): المشنقة's room way
   made reusable. A setter writes or picks a secret, and every other phone
   solves it on its own board - nobody sees anyone else's guesses, only how far
   each one is - and the setter moves round the table; or a race on the app's
   pick, with nobody setting. A lobby choice, "one sets, the rest solve" by
   default. Scoring as in المشنقة's race, in both ways: a solve is 10 plus a
   bonus by the order the solves came in (+5, +4 ... +1); the setter takes 5
   for every player who didn't solve it; on the board, fewer tries break a tie
   (the tries it took to get the ones a player got). 3, 5 or 10 secrets a
   game; a clock off by default; the host can move on from a quiet setter; a
   setter who leaves before setting hands it on; fewer than two ends the game;
   latecomers watch until the next secret.

   A game on the engine is a plug-in in SOLVE_KINDS: its lobby options, what a
   setter may send (`check`), the race's pick (`deal`), what the table may see
   of the secret (`pub`), a board, one guess on it (`guess`: 'won', 'miss' or
   '' for nothing), how many tries, the board as its own phone sees it
   (`view`), what the table may see of a board besides its tries (`progress`),
   and what is shown at the end (`reveal`, and `mine` for the setter's phone).
   The engine does the rest: the order, the clock, the points, leaving.

   What is hidden: the secret (room._solve.secret) until the round is scored,
   and every board (room._solve.boards), which reaches its own phone only
   (room.secrets[pid].board); the setter's phone gets the secret. `shared`
   carries only what the table may see: the public part (`pub`: a word's
   length, the range, the flag in the flag way, the emoji clue) and each
   board's tries, state and order - and for خمن الكلمة the colours of each row
   without its letters, for خمّن الدولة the closest a player has come.

   shared:
     solve     the game on the engine: 'wordle' | 'guessnum' | 'flags' | 'emoji'
     phase     'setting' | 'solving' | 'result' | 'gameover'
     settings  { mode: 'setter' | 'race', rounds, clock, lang, ...the game's }
     round · rounds · order · setterAt · setter · setterName
     pub       what everyone may see of the secret · maxTries
     progress  { pid: { n, state, at, ...the game's } } · solved [pid, …] in order
     endsAt    the clock
     result    { reveal, setter, setterName, setterPts, rows: [{ id, name, state, n, pts }] }
     scores · tries (per player, on the secrets they got) · board (best first, fewer tries on a tie)
   ========================================================================= */
const SV_GRACE_MS = 1500;
const SV_SOLVE_POINTS = 10;
const SV_SPEED_BONUS = [5, 4, 3, 2, 1];
const SV_SETTER_POINTS = 5;

const svPick = (list, v, w, dflt) => (list.indexOf(Number(v)) !== -1 ? Number(v) : (list.indexOf(Number(w)) !== -1 ? Number(w) : dflt));
const svPickStr = (list, v, w, dflt) => (list.indexOf(v) !== -1 ? v : (list.indexOf(w) !== -1 ? w : dflt));

/* --- the four games ------------------------------------------------------------- */

const SOLVE_KINDS = {
  wordle: {
    options: (p, was) => ({ len: svPick(SV_WORDLE_LENGTHS, p.len, was.len, 5) }),
    check(p) {
      const problem = svWordleProblem(p.word);
      if (problem) throw new Error(problem === 'length' ? 'الكلمة من 5 لـ 8 حروف' : 'اكتب كلمة بحروف لغة واحدة، من غير أرقام');
      const w = svWordleFold(p.word);
      const alpha = svWordleAlpha(w);
      return { w: w, show: alpha === 'en' ? w : svClean(p.word).replace(/ /g, ''), alpha: alpha };
    },
    deal(room, st) {
      const list = ((WORDLE_DB[st.lang] || WORDLE_DB.ar)[st.len]) || WORDLE_DB[st.lang][5];
      const pick = nextPrompt(room, list, 'solve_wordle_' + st.lang + '_' + st.len);
      const w = svWordleFold(pick);
      return { w: w, show: st.lang === 'en' ? w : pick, alpha: svWordleAlpha(w) || st.lang };
    },
    pub: (x) => ({ len: Array.from(x.w).length, alpha: x.alpha }),
    board: () => ({ g: [] }),
    tries: (x) => svWordleTries(Array.from(x.w).length),
    guess(b, x, p) {
      const g = svWordleFold(p.text);
      if (Array.from(g).length !== Array.from(x.w).length) throw new Error('الكلمة ' + Array.from(x.w).length + ' حروف');
      if (svWordleAlpha(g) !== x.alpha) throw new Error('حروف من الكيبورد بس');
      if (b.g.some(r => r.w === g)) return '';
      b.g.push({ w: g, c: svWordleColours(g, x.w) });
      return g === x.w ? 'won' : 'miss';
    },
    view: (b) => ({ g: b.g.map(r => ({ w: r.w, c: r.c })) }),
    // The colours of each row, never its letters: a Wordle grid as it is shared.
    progress: (b) => ({ rows: b.g.map(r => r.c) }),
    reveal: (x) => ({ word: x.show }),
    mine: (x) => ({ word: x.show })
  },

  guessnum: {
    options: (p, was) => ({ max: svPick(SV_NUM_RANGES, p.max, was.max, 100) }),
    check(p, st) {
      const n = Number(p.n);
      if (svNumProblem(n, st.max)) throw new Error('اختار رقم من 1 لـ ' + st.max);
      return { n: n };
    },
    deal: (room, st) => ({ n: 1 + Math.floor(Math.random() * st.max) }),
    pub: (x, st) => ({ max: st.max }),
    board: (x, st) => ({ g: [], lo: 1, hi: st.max }),
    tries: (x, st) => svNumTries(st.max),
    guess(b, x, p, st) {
      const n = Number(p.n);
      if (svNumProblem(n, st.max)) throw new Error('رقم من 1 لـ ' + st.max);
      if (b.g.some(r => r.n === n)) return '';
      const v = svNumVerdict(n, x.n);
      b.g.push({ n: n, v: v });
      if (v === 'higher') b.lo = Math.max(b.lo, n + 1);
      if (v === 'lower') b.hi = Math.min(b.hi, n - 1);
      return v === 'right' ? 'won' : 'miss';
    },
    // Where a board has narrowed the number to is its own: shown to another
    // solver, a range would give the number away.
    view: (b) => ({ g: b.g.map(r => ({ n: r.n, v: r.v })), lo: b.lo, hi: b.hi }),
    progress: () => ({}),
    reveal: (x) => ({ n: x.n }),
    mine: (x) => ({ n: x.n })
  },

  flags: {
    options: (p, was) => ({ clue: svPickStr(SV_FLAG_WAYS, p.clue, was.clue, 'flag'), level: svPickStr(SV_FLAG_LEVELS, p.level, was.level, 'easy') }),
    check(p) {
      const c = flagCountry(String(p.code || '').toUpperCase());
      if (!c) throw new Error('اختار دولة من القايمة');
      return { code: c.code };
    },
    deal: (room, st) => ({ code: nextPrompt(room, svCountryPool(st.level), 'solve_flags_' + st.level).code }),
    // The flag is the clue itself in the flag way; by distance nothing is shown.
    pub: (x, st) => (st.clue === 'flag' ? { clue: 'flag', flag: flagEmoji(x.code) } : { clue: 'far' }),
    board: () => ({ g: [] }),
    tries: (x, st) => FLAG_MODES[st.clue].guesses,
    guess(b, x, p) {
      const guess = flagCountry(String(p.code || '').toUpperCase());
      if (!guess) throw new Error('اختار دولة من القايمة');
      if (b.g.some(r => r.code === guess.code)) return '';
      const target = flagCountry(x.code);
      const right = guess.code === x.code;
      const km = right ? 0 : flagsDistance(guess, target);
      b.g.push({ code: guess.code, km: km, deg: right ? 0 : Math.round(flagsBearing(guess, target)), p: right ? 100 : flagsProximity(km) });
      return right ? 'won' : 'miss';
    },
    view(b, x, st) {
      const at = svFlagHintsAt(st.clue);
      const misses = b.g.filter(r => r.code !== x.code).length;
      const target = flagCountry(x.code);
      const hints = {};
      if (b.state === 'play' && misses >= at.cont) hints.cont = target.cont;
      if (b.state === 'play' && misses >= at.letter) hints.letter = svCountryLetter(target, st.lang);
      return { g: b.g.map(r => ({ code: r.code, km: r.km, deg: r.deg, p: r.p })), hints: hints };
    },
    // The closest a player has come, as a share: it names no country.
    progress: (b) => ({ best: b.g.reduce((m, r) => Math.max(m, r.p), 0) }),
    reveal: (x) => ({ code: x.code }),
    mine: (x) => ({ code: x.code })
  },

  emoji: {
    options: () => ({}),
    check(p) {
      const kind = SV_EMOJI_KINDS.indexOf(p.kind) !== -1 ? p.kind : 'thing';
      const ap = svEmojiAnswerProblem(p.answer);
      if (ap) throw new Error(ap === 'long' ? 'الإجابة لحد 8 كلمات' : 'اكتب الإجابة');
      const cp = svEmojiClueProblem(p.clue, p.answer);
      if (cp) throw new Error(cp === 'spells' ? 'الإيموجي بيتهجّى الإجابة' : (cp === 'letters' ? 'الفزورة إيموجي بس، من غير حروف' : 'اكتب الفزورة بالإيموجي'));
      return { a: svClean(p.answer), alt: [], e: String(p.clue).trim(), k: kind };
    },
    // The race deals the app's riddles, sharing the quiz's memory of what was dealt.
    deal(room, st) {
      const bank = EMOJI_RIDDLES[st.lang] || EMOJI_RIDDLES.ar;
      const r = nextPrompt(room, bank, 'emoji_' + st.lang);
      return { a: r.a, alt: r.alt || [], e: r.e, c: r.c };
    },
    pub: (x) => ({ e: x.e, k: x.k || '', c: x.c || '' }),
    board: () => ({ g: [] }),
    tries: () => SV_EMOJI_TRIES,
    guess(b, x, p, st) {
      const text = svClean(p.text).slice(0, SV_EMOJI_GUESS_MAX);
      if (!text) return '';
      if (b.g.some(r => normaliseClue(r.t) === normaliseClue(text))) return '';
      // The race's riddle is judged against its own bank (a guess naming another riddle is never right by the lenient rules).
      const bank = x.c ? (EMOJI_RIDDLES[st.lang] || EMOJI_RIDDLES.ar) : null;
      const v = guessVerdict(text, [x.a].concat(x.alt || []), bank);
      b.g.push({ t: text, v: v === 'right' ? 'right' : (v === 'close' ? 'close' : '') });
      return v === 'right' ? 'won' : 'miss';
    },
    view: (b) => ({ g: b.g.map(r => ({ t: r.t, v: r.v })) }),
    progress: () => ({}),
    reveal: (x) => ({ a: x.a, e: x.e }),
    mine: (x) => ({ a: x.a, e: x.e })
  }
};

/* --- the engine ------------------------------------------------------------------- */

/** The game a room plays on the engine, or '' (the emoji quiz is not on it). */
const svKindOf = (room) => ((room && room.shared && SOLVE_KINDS[room.shared.solve]) ? room.shared.solve : '');

/**
 * فوازير إيموجي plays three ways in a room: a player writes the riddle and the
 * app's riddles as a race are the engine's, the old quiz (the table sees every
 * wrong guess) is quizAction's. A start says which; after that the room does.
 */
const svEmojiOnEngine = (room, action, payload) => (action === 'start'
  ? !!payload && (payload.way === 'setter' || payload.way === 'race')
  : !!svKindOf(room));

const svOptions = (kind, payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const asked = p.mode || p.way;
  return Object.assign({
    mode: asked === 'race' || asked === 'setter' ? asked : (was.mode === 'race' ? 'race' : 'setter'),
    rounds: svPick(SV_ROUNDS, p.rounds, was.rounds, 5),
    clock: svPick(SV_CLOCKS[kind], p.clock, was.clock, 0),
    lang: p.lang === 'en' ? 'en' : (p.lang === 'ar' ? 'ar' : (was.lang === 'en' ? 'en' : 'ar'))
  }, SOLVE_KINDS[kind].options(p, was));
};

const svHere = (room) => room.players.map(p => p.id);
/** Who solves this secret: everyone at the table but the setter. */
const svSolvers = (room) => svHere(room).filter(id => id !== room.shared.setter);

/** Each board to its own phone; the secret to the setter's. */
const svWriteSecrets = (room) => {
  const s = room.shared;
  const h = room._solve || {};
  room.secrets = {};
  if (s.phase === 'setting' || !h.secret) return;
  const K = SOLVE_KINDS[s.solve];
  Object.keys(h.boards || {}).forEach(pid => {
    const b = h.boards[pid];
    room.secrets[pid] = { board: K.view(b, h.secret, s.settings), state: b.state, n: b.n };
  });
  if (s.setter && s.phase === 'solving') room.secrets[s.setter] = { mine: K.mine(h.secret, s.settings) };
};

/** What the table sees of one board: its tries, its state, its place, and whatever the game adds. */
const svProgressOf = (room, b, at) => {
  const s = room.shared;
  return Object.assign({ n: b.n, state: b.state, at: at }, SOLVE_KINDS[s.solve].progress(b, room._solve.secret, s.settings));
};

/** The secret is set: every solver gets a board, the clock starts. */
const svBegin = (room, secret) => {
  const s = room.shared;
  const K = SOLVE_KINDS[s.solve];
  room._solve = { secret: secret, boards: {} };
  s.progress = {};
  s.solved = [];
  svSolvers(room).forEach(pid => {
    room._solve.boards[pid] = Object.assign({ n: 0, state: 'play' }, K.board(secret, s.settings));
    s.progress[pid] = svProgressOf(room, room._solve.boards[pid], null);
  });
  s.pub = K.pub(secret, s.settings);
  s.maxTries = K.tries(secret, s.settings);
  s.phase = 'solving';
  s.roster = svHere(room);
  s.endsAt = s.settings.clock ? Date.now() + s.settings.clock * 1000 : null;
  svWriteSecrets(room);
};

/** The setter of this secret: the next in the order who is still here (latecomers join the end). */
const svNextSetter = (room) => {
  const s = room.shared;
  const here = svHere(room);
  s.order = (s.order || []).filter(id => here.indexOf(id) !== -1);
  here.forEach(id => { if (s.order.indexOf(id) === -1) s.order.push(id); });
  if (!s.order.length) return null;
  s.setterAt = ((typeof s.setterAt === 'number' ? s.setterAt : -1) + 1) % s.order.length;
  return s.order[s.setterAt];
};

/** A new secret: a setter to set it, or the app's for the race. */
const svDeal = (room) => {
  const s = room.shared;
  s.result = null;
  s.progress = {};
  s.solved = [];
  s.endsAt = null;
  s.pub = null;
  s.maxTries = 0;
  room._solve = { secret: null, boards: {} };
  if (s.settings.mode === 'race') {
    s.setter = null;
    s.setterName = '';
    svBegin(room, SOLVE_KINDS[s.solve].deal(room, s.settings));
    return;
  }
  s.setter = svNextSetter(room);
  s.setterName = roomPlayerName(room, s.setter);
  s.phase = 'setting';
  s.roster = svHere(room);
  room.secrets = {};
};

/** Every solver still here is done: solved it, or out of tries. */
const svAllDone = (room) => {
  const s = room.shared;
  const here = svHere(room);
  return Object.keys(s.progress || {}).filter(id => here.indexOf(id) !== -1).every(id => s.progress[id].state !== 'play');
};

/** The board of the game: points, best first; on a tie, fewer tries first. */
const svBoard = (room) => {
  const tries = room.shared.tries || {};
  return scoreboardOf(room).map(r => Object.assign(r, { tries: tries[r.id] || 0 }))
    .sort((a, b) => b.score - a.score || a.tries - b.tries);
};

/** The round ends: whoever is still solving has failed, and the points go on the board. */
const svEndRound = (room) => {
  const s = room.shared;
  const h = room._solve || { boards: {} };
  if (s.phase !== 'solving') return;
  const K = SOLVE_KINDS[s.solve];
  const here = svHere(room);
  const rows = [];
  let failed = 0;
  s.tries = s.tries || {};
  Object.keys(h.boards).forEach(pid => {
    const b = h.boards[pid];
    if (b.state === 'play') b.state = 'lost';
    const at = s.solved.indexOf(pid);
    let pts = 0;
    if (b.state === 'won') {
      pts = SV_SOLVE_POINTS + (at !== -1 ? (SV_SPEED_BONUS[at] || 0) : 0);
      s.tries[pid] = (s.tries[pid] || 0) + b.n;
    } else if (here.indexOf(pid) !== -1) {
      failed++;
    }
    if (pts) addScore(room, pid, pts);
    s.progress[pid] = svProgressOf(room, b, at === -1 ? null : at);
    if (here.indexOf(pid) !== -1) rows.push({ id: pid, name: roomPlayerName(room, pid), state: b.state, n: b.n, pts: pts });
  });
  let setterPts = 0;
  if (s.settings.mode !== 'race' && s.setter && here.indexOf(s.setter) !== -1) {
    setterPts = failed * SV_SETTER_POINTS;
    if (setterPts) addScore(room, s.setter, setterPts);
  }
  rows.sort((a, b) => b.pts - a.pts || a.n - b.n);
  s.result = { reveal: K.reveal(h.secret, s.settings), setter: s.setter || null, setterName: s.setterName || '', setterPts: setterPts, rows: rows };
  s.endsAt = null;
  s.board = svBoard(room);
  s.phase = s.round >= s.rounds ? 'gameover' : 'result';
  room.phase = s.phase === 'gameover' ? 'gameover' : 'play';
  svWriteSecrets(room);
};

/** Fewer than two: nobody to solve, or nobody to set for. */
const svTooFew = (room) => room.players.length < 2;

const svNewGame = (room, playerId, kind, payload, again) => {
  requireHost(room, playerId);
  if (svTooFew(room)) throw new Error('اللعبة دي محتاجة لاعبين على الأقل');
  const prev = room.shared || {};
  const settings = svOptions(kind, again ? prev.settings : payload, prev.settings);
  room.shared = {
    solve: kind,
    settings: settings,
    round: 1,
    rounds: settings.rounds,
    order: shuffled(svHere(room)),
    setterAt: -1,
    scores: {},
    tries: {},
    board: []
  };
  room.phase = 'play';
  svDeal(room);
  room.shared.board = svBoard(room);
};

const solveAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start') { svNewGame(room, playerId, room.game, p, false); return; }
  const s = room.shared;
  if (!s || !svKindOf(room)) throw new Error('اللعبة لم تبدأ بعد');
  const K = SOLVE_KINDS[s.solve];

  if (action === 'playAgain') {
    if (s.phase !== 'gameover') return;
    svNewGame(room, playerId, s.solve, p, true);
    return;
  }

  if (action === 'setSecret') {
    if (s.phase !== 'setting' || staleTap(p, 'round', s.round)) return;
    if (playerId !== s.setter) throw new Error('مش دورك');
    if (svSolvers(room).length < 1) throw new Error('مفيش حد يحلّ');
    svBegin(room, K.check(p, s.settings));
    return;
  }

  if (action === 'guess') {
    if (s.phase !== 'solving' || staleTap(p, 'round', s.round)) return;
    const h = room._solve;
    const b = h && h.boards[playerId];
    if (!b) throw new Error(playerId === s.setter ? 'انت اللي حاططها' : 'انت بتتفرج المرة دي');
    if (b.state !== 'play') return;
    const out = K.guess(b, h.secret, p, s.settings);
    if (!out) return;
    b.n++;
    if (out === 'won') b.state = 'won';
    else if (b.n >= K.tries(h.secret, s.settings)) b.state = 'lost';
    if (b.state === 'won') s.solved.push(playerId);
    s.progress[playerId] = svProgressOf(room, b, b.state === 'won' ? s.solved.length - 1 : null);
    if (svAllDone(room)) { svEndRound(room); return; }
    svWriteSecrets(room);
    return;
  }

  if (action === 'closeRound') {
    requireHost(room, playerId);
    if (s.phase !== 'solving' || staleTap(p, 'round', s.round)) return;
    svEndRound(room);
    return;
  }

  if (action === 'skipTurn') {
    // The setter's phone went quiet: the next one sets this secret.
    requireHost(room, playerId);
    if (s.phase !== 'setting' || staleTap(p, 'round', s.round)) return;
    svDeal(room);
    return;
  }

  if (action === 'nextRound') {
    requireHost(room, playerId);
    if (s.phase !== 'result') return;
    if (svTooFew(room)) throw new Error('اللعبة دي محتاجة لاعبين على الأقل');
    s.round++;
    room.phase = 'play';
    svDeal(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock --------------------------------------------------------------------- */

const svDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'solving' && s.endsAt ? s.endsAt + SV_GRACE_MS : null;
};

const svTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'solving' || !s.endsAt || now < s.endsAt + SV_GRACE_MS) return false;
  svEndRound(room);
  return true;
};

/* --- someone leaves -------------------------------------------------------------------
   A solver's board goes with them, and the round may be over without them. A
   setter who leaves before setting hands it to the next; after setting, the
   round plays on without their points. Fewer than two left ends the game.
   ----------------------------------------------------------------------------------- */
const svPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!svKindOf(room) || s.phase === 'gameover') return;
  s.order = (s.order || []).filter(id => id !== playerId);
  if (s.phase === 'solving' && room._solve && room._solve.boards[playerId]) {
    delete room._solve.boards[playerId];
    delete s.progress[playerId];
    s.solved = (s.solved || []).filter(id => id !== playerId);
  }
  if (svTooFew(room)) {
    if (s.phase === 'solving') svEndRound(room);
    s.phase = 'gameover';
    room.phase = 'gameover';
    s.endsAt = null;
    s.board = svBoard(room);
    svWriteSecrets(room);
    return;
  }
  if (s.phase === 'setting' && s.setter === playerId) {
    // The one who left was up; setterAt moves back one so the next in the order sets.
    s.setterAt = (s.setterAt || 0) - 1;
    svDeal(room);
    return;
  }
  if (s.phase === 'solving') {
    if (svAllDone(room)) { svEndRound(room); return; }
    svWriteSecrets(room);
  }
  s.board = svBoard(room);
};
