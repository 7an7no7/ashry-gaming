/* ============================================================================
   «انقل بياناتي»: everything this phone keeps, moved to another phone (7 Oct 2026)
   ----------------------------------------------------------------------------
   The owner (7 Oct 2026): everything a person keeps lives only in the phone's
   localStorage, with no backup. Settings → «انقل لموبايل تاني»: the old phone
   sends it all to the rooms server under a 6-letter code (the packs' alphabet),
   kept 24 hours and readable as often as wanted in that time (a phone and a
   tablet); the new phone types the code and the data is MERGED into what it
   has, never wiped. EVERYTHING moves: names and groups, «الشلة» and the quiz
   codes, the streaks and the bests, the daily history, the saved chess games,
   the settings.

   One copy, both sides: on the page it is a list in the chunk 'move' (with
   JS_Move.html, tools/lazy-split.mjs), on the server one of FILES in
   rooms-worker/build.mjs (the limits; rooms-worker/src/move.js keeps the entry),
   and rooms-worker/test/rules.mjs tests the merge from node. Only values and
   pure functions: nothing here reads the page or the storage - the page hands
   in what it read and writes back what comes out (JS_Move.html).

     moveCollect(read)                 -> { keys } the raw strings worth moving
     moveFit(keys)                     -> { keys, trimmed } or { error: 'too_big' }
     moveMerge(here, incoming, opts)   -> { write, got }   (the rules below)
     moveExpired(at, now)              -> past its 24 hours
   ========================================================================= */

// Kept 24 hours from the send, whoever reads it (the owner, 7 Oct 2026).
const MOVE_TTL_MS = 24 * 60 * 60 * 1000;
// The payload's UTF-8 size at most. A heavy phone built on 7 Oct 2026 from the real shapes
// and word lists (every list half dealt, 20 chess games each with its review, a year of
// dailies, 60 nights, 40 names in 6 groups, 3 crews, 10 quizzes of 40 questions and the
// family words) came to 822 KB: the reviews 313, the "already dealt" lists 240, the
// quizzes 90, the dailies 37; 459 KB without the reviews. The cap leaves that phone
// room; past it moveFit trims what can be made again (188 KB for that phone).
const MOVE_MAX_BYTES = 1024 * 1024;
const MOVE_FORMAT = 1;

/**
 * What moves, and how each one is merged into the new phone's own (moveMerge).
 * Not here, on purpose: a room's seat and the last room (a key to someone's seat:
 * two phones would be one player), a game in progress and «كمّل» (they belong to
 * the screen they were left on), drafts of a round, the install prompts, the
 * screen size (ashryUiScale: a TV's 150% is no phone's), the sound setting
 * (ashrySound: per device, so a TV keeps its own - notes/sound.md), and the crews'
 * cached pages (fetched again with the key that moves).
 */
const MOVE_KEYS = {
  ashryName: 'fill',                 // the name in rooms: only when this phone has none
  ashryFace: 'fill',                 // the face made in the name sheet (1282, rooms/Faces.js): likewise
  ashryPlayers_v1: 'names',          // the saved names: both, one spelling each (the name fold)
  ashry_saved_groups: 'groups',      // the groups: both; one name on both phones gets everyone
  ashryCrews_v1: 'crews',            // «الشلة»: every crew, with its key
  ashryPacks_v1: 'packs',            // «اعمل مسابقتك» and «كلماتنا»: every quiz, the family words
  ashryDaily_v1: 'daily',            // تحدي اليوم's history: by date, so the streak is both phones'
  ashryDailyPlay_v1: 'dailyPlay',    // today's daily put aside mid-way
  ashrySoloBest_v1: 'bests',         // the solo games' bests: the better of the two
  ashryMemoryBest_v1: 'memoryBest',  // الذاكرة's bests: fewer moves, then fewer seconds
  ashryConnections_v1: 'fill',       // an unfinished Connections board
  ashryChessGames_v1: 'chess',       // the saved chess games: both, newest 20
  ashryNights_v1: 'nights',          // «ليالينا»: both, the last 60
  ashrySeen_v1: 'seen',              // what each list has dealt: both, so neither repeats
  ashryFirstPlay_v1: 'set',          // the first-play cards already seen
  ashryPlayed_v1: 'set',             // the games this phone has started (readPlayed / markPlayed, JS_Catalog.html): both
  ashryRecent_v1: 'recent',          // the home's recent row: this phone's first
  ashryOptions_v1: 'options',        // every setup's remembered choices: where this phone has none
  gameTrackerState_v1: 'app',        // the theme, the language, the games' language, the chess rating (nothing else of it)
  ashrySnakesMaps_v1: 'snakesMaps',  // «خرايطنا»: both, by id, the newest 12 (audit 7 Oct 2026, D1)
  ashryMotion: 'pref',
  ashryColorShapes: 'pref',
  ashryQueensPatterns: 'pref',       // الملكات «نقشة لكل لون» (audit 7 Oct 2026, D1)
  ashryTriviaTeams: 'fill',
  ashryTriviaCount: 'fill', ashryTriviaCat: 'fill', ashryWhoamiRoomCat: 'fill',
  ashryStopRoomOpts: 'fill', ashrySpyfallRoomOpts: 'fill', ashryMonkeyRoomOpts: 'fill',
  ashryImposterRoomOpts: 'fill', ashryBombRoomOpts: 'fill', ashryHerdOpts: 'fill', ashryMafiaOpts: 'fill',
  ashryScrewOpts: 'fill', ashryScrewVote: 'fill', ashryHumRoom: 'fill', ashryDrawRoomSeconds: 'fill',
  ashryFiveRounds: 'fill', ashryBuzzerPenalty: 'fill', ashryQuizCount_emoji: 'fill',
  ashryQuizCount_proverbs: 'fill', ashryConnectLevel: 'fill', ashryHearInk: 'fill',
  ashryMissionSetup_v1: 'fill', ashryMissionShe_v1: 'fill', ashryProgramDraft_v1: 'fill'
};
// A 'pref' is taken only while this phone still has its default.
const MOVE_PREF_DEFAULTS = { ashryMotion: 'auto', ashryColorShapes: '0', ashryQueensPatterns: '0' };
// The app's own settings in gameTrackerState_v1, and their defaults (the theme's is the
// device's own: the page passes it in opts.defaults).
const MOVE_APP_FIELDS = { lang: 'ar', gameLang: 'auto', isDarkMode: false };
const MOVE_CHESS_KEEP = 20;      // CH_KEEP, JS_ChessReview.html
const MOVE_NIGHTS_KEEP = 60;     // NIGHTS_KEEP, JS_Room.html
const MOVE_RECENT_KEEP = 6;      // RECENT_MAX, JS_Catalog.html
const MOVE_SNAKES_MAPS_KEEP = 12; // SNK_MAPS_MAX, JS_Snakes.html
/** A chess rating worth moving: rated games played ({ r, n }, appState.shatranj.rating). */
const moveChessRatingOk = (x) => moveIsObj(x) && typeof x.r === 'number' && typeof x.n === 'number' && x.n > 0;

const moveExpired = (at, now) => !(Number(at) > 0) || now - Number(at) > MOVE_TTL_MS;

const moveBytes = (s) => new TextEncoder().encode(String(s)).length;

const moveParse = (raw, fallback) => {
  if (raw == null || raw === '') return fallback;
  try { const v = JSON.parse(raw); return v == null ? fallback : v; } catch (e) { return fallback; }
};
const moveIsObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** A person's name as samePlayer compares it (JS_Core.html): أحمد and احمد are one. */
const moveFoldName = (s) => foldArabicLetters(String(s || '').trim()).replace(/\s+/g, ' ');

/** Both lists of names, this phone's spelling first, each person once. */
const moveUnionNames = (a, b) => {
  const out = [], seen = new Set();
  let added = 0;
  [a, b].forEach((list, side) => (Array.isArray(list) ? list : []).forEach((n) => {
    if (typeof n !== 'string' || !n.trim()) return;
    const k = moveFoldName(n);
    if (seen.has(k)) return;
    seen.add(k); out.push(n);
    if (side === 1) added++;
  }));
  return { list: out, added };
};

/**
 * The raw strings worth moving, read through `read(key)` (localStorage.getItem on the page).
 * Of the app's settings only those the person chose: one still at this device's default
 * (`opts.defaults`, the theme's being the device's own) is no choice, and a light phone
 * sending its light would turn a dark phone light (seen on 7 Oct 2026, a dark tablet).
 */
function moveCollect(read, opts) {
  const defaults = Object.assign({}, MOVE_APP_FIELDS, (opts && opts.defaults) || {});
  const keys = {};
  Object.keys(MOVE_KEYS).forEach((k) => {
    let v = null;
    try { v = read(k); } catch (e) { v = null; }
    if (typeof v !== 'string' || v === '') return;
    if (k === 'gameTrackerState_v1') {
      // Only the settings travel, never the game on the screen.
      const st = moveParse(v, null);
      if (!moveIsObj(st)) return;
      const keep = {};
      Object.keys(MOVE_APP_FIELDS).forEach((f) => { if (f in st && st[f] !== defaults[f]) keep[f] = st[f]; });
      // The chess rating against the computer travels too, once rated games made it (audit 7 Oct 2026, D1).
      if (moveIsObj(st.shatranj) && moveChessRatingOk(st.shatranj.rating)) keep.chessRating = { r: st.shatranj.rating.r, n: st.shatranj.rating.n };
      if (!Object.keys(keep).length) return;
      v = JSON.stringify(keep);
    }
    keys[k] = v;
  });
  return { keys };
}

/**
 * The payload within MOVE_MAX_BYTES: over it, what can be made again goes first -
 * the chess reviews (worked out again on opening), then the "already dealt" lists,
 * then the oldest chess games. { keys, trimmed: [what went] } or { error: 'too_big' }.
 */
function moveFit(keys, max) {
  const cap = max || MOVE_MAX_BYTES;
  const out = Object.assign({}, keys);
  const trimmed = [];
  const size = () => moveBytes(JSON.stringify({ v: MOVE_FORMAT, keys: out })) + 64;
  if (size() <= cap) return { keys: out, trimmed };
  const games = moveParse(out.ashryChessGames_v1, null);
  if (Array.isArray(games) && games.some((g) => g && g.review)) {
    out.ashryChessGames_v1 = JSON.stringify(games.map((g) => Object.assign({}, g, { review: null })));
    trimmed.push('reviews');
    if (size() <= cap) return { keys: out, trimmed };
  }
  if (out.ashrySeen_v1) {
    delete out.ashrySeen_v1;
    trimmed.push('seen');
    if (size() <= cap) return { keys: out, trimmed };
  }
  let list = moveParse(out.ashryChessGames_v1, null);
  while (Array.isArray(list) && list.length && size() > cap) {
    list = list.slice(0, -1);
    out.ashryChessGames_v1 = JSON.stringify(list);
    if (trimmed.indexOf('chess') === -1) trimmed.push('chess');
  }
  return size() <= cap ? { keys: out, trimmed } : { error: 'too_big' };
}

/** Which of two solo bests is better: a time, a guess count or strokes are better low, a score high. */
const moveBestBetter = (a, b) => {
  if (!moveIsObj(b)) return moveIsObj(a);
  if (!moveIsObj(a)) return false;
  for (const low of ['seconds', 'guesses', 'total']) {
    if (typeof a[low] === 'number' && typeof b[low] === 'number') return a[low] < b[low];
  }
  if (typeof a.score === 'number' && typeof b.score === 'number') {
    return a.score > b.score || (a.score === b.score && (a.tile || 0) > (b.tile || 0));
  }
  // تانجو's three-minute run is better high; a Connections tally { solved, perfect, played } is
  // never summed (the same code merged twice must change nothing): the one with more played
  // wins (audit 7 Oct 2026, D2).
  if (typeof a.count === 'number' && typeof b.count === 'number') return a.count > b.count;
  if (typeof a.played === 'number' && typeof b.played === 'number') {
    return a.played > b.played || (a.played === b.played && (a.solved || 0) > (b.solved || 0));
  }
  return false;
};

/**
 * The incoming data merged into this phone's. `here` and `incoming` map a key of
 * MOVE_KEYS to its raw string (null: none). `opts.defaults` the device's own defaults
 * for the app's settings ({ isDarkMode }). -> { write: { key: raw } only what changes,
 * got: { names, groups, crews, quizzes, words, bests, days, chess, nights, settings } }
 * - how many new things came over, for «جه: ...».
 *
 * The rules (the owner: merged, never wiped, 7 Oct 2026):
 *   names     both lists, each person once (the name fold), this phone's spelling
 *   groups    both; a group on both phones keeps everyone in either
 *   crews     every crew; one on both keeps this phone's key, the latest use
 *   packs     every quiz (one code once: the later change, a key from either);
 *             the family words: this phone's, unless it has none (one pack a phone)
 *   daily     by date: every day's games from both (a result over a bare "done")
 *   bests     the better of the two (moveBestBetter); الذاكرة: fewer moves, then seconds
 *   chess     both, by id (and by game), the newest MOVE_CHESS_KEEP
 *   nights    both, by room and day, the last MOVE_NIGHTS_KEEP
 *   seen      each list's dealt items from both (this phone's order first)
 *   set       both (the first-play cards seen)
 *   recent    this phone's first, then the other's, MOVE_RECENT_KEEP
 *   options   a choice this phone has never made comes from the other
 *   app       the theme, the language and the games' language only where this
 *             phone still has its default; the chess rating only where this phone
 *             has no rated games
 *   snakesMaps «خرايطنا»: both, by id (one seed and look once), the first 12
 *   pref      the same, for a setting kept under its own key
 *   fill      the other's only when this phone has none
 */
function moveMerge(here, incoming, opts) {
  const defaults = Object.assign({}, MOVE_APP_FIELDS, (opts && opts.defaults) || {});
  const write = {};
  const got = { names: 0, groups: 0, crews: 0, quizzes: 0, words: 0, bests: 0, days: 0, chess: 0, nights: 0, settings: 0 };
  const put = (k, v) => { const s = JSON.stringify(v); if (s !== here[k]) write[k] = s; };

  Object.keys(MOVE_KEYS).forEach((k) => {
    const raw = incoming ? incoming[k] : null;
    if (typeof raw !== 'string' || raw === '') return;
    const mine = here ? here[k] : null;
    const kind = MOVE_KEYS[k];

    if (kind === 'fill') {
      if (mine == null || mine === '') { write[k] = raw; if (k !== 'ashryConnections_v1') got.settings++; }
      return;
    }
    if (kind === 'pref') {
      if ((mine == null || mine === '' || mine === MOVE_PREF_DEFAULTS[k]) && raw !== mine && raw !== MOVE_PREF_DEFAULTS[k]) { write[k] = raw; got.settings++; }
      return;
    }
    if (kind === 'names') {
      const u = moveUnionNames(moveParse(mine, []), moveParse(raw, []));
      got.names += u.added;
      if (u.added) put(k, u.list);
      return;
    }
    if (kind === 'groups') {
      const a = moveParse(mine, {}), b = moveParse(raw, {});
      if (!moveIsObj(b)) return;
      const out = moveIsObj(a) ? Object.assign({}, a) : {};
      let changed = false;
      Object.keys(b).forEach((g) => {
        if (!Array.isArray(b[g])) return;
        const same = Object.keys(out).find((x) => moveFoldName(x) === moveFoldName(g));
        if (!same) { out[g] = b[g].slice(); got.groups++; changed = true; return; }
        const u = moveUnionNames(out[same], b[g]);
        if (u.added) { out[same] = u.list; changed = true; }
      });
      if (changed) put(k, out);
      return;
    }
    if (kind === 'crews') {
      const a = moveParse(mine, null), b = moveParse(raw, null);
      if (!b || !Array.isArray(b.list)) return;
      const out = a && Array.isArray(a.list) ? Object.assign({}, a, { list: a.list.slice() }) : { list: [] };
      let changed = false;
      b.list.forEach((c) => {
        if (!c || !c.code) return;
        const i = out.list.findIndex((x) => x && x.code === c.code);
        if (i === -1) { out.list.push(c); got.crews++; changed = true; return; }
        const m = out.list[i];
        if (!m.key && c.key) { out.list[i] = Object.assign({}, c, { at: Math.max(m.at || 0, c.at || 0) }); changed = true; }
      });
      if (changed) put(k, out);
      return;
    }
    if (kind === 'packs') {
      const a = moveParse(mine, {}), b = moveParse(raw, {});
      if (!moveIsObj(b)) return;
      const out = moveIsObj(a) ? Object.assign({}, a) : {};
      const quizzes = Array.isArray(out.quizzes) ? out.quizzes.slice() : [];
      let changed = false;
      (Array.isArray(b.quizzes) ? b.quizzes : []).forEach((q) => {
        if (!moveIsObj(q)) return;
        const i = quizzes.findIndex((x) => x && ((q.code && x.code === q.code) || (q.id && x.id === q.id)));
        if (i === -1) { quizzes.push(q); got.quizzes++; changed = true; return; }
        const m = quizzes[i];
        const newer = (q.updated || 0) > (m.updated || 0) ? q : m;
        const next = Object.assign({}, newer, { id: m.id, key: m.key || q.key || null });
        if (JSON.stringify(next) !== JSON.stringify(m)) { quizzes[i] = next; changed = true; }
      });
      out.quizzes = quizzes;
      const wa = moveIsObj(out.words) ? out.words : null, wb = moveIsObj(b.words) ? b.words : null;
      const empty = (w) => !w || (!w.code && !(Array.isArray(w.words) && w.words.length));
      if (wb && empty(wa) && !empty(wb)) { out.words = wb; got.words++; changed = true; }
      else if (wb && wa && wa.code && wa.code === wb.code) {
        const newer = (wb.updated || 0) > (wa.updated || 0) ? wb : wa;
        const next = Object.assign({}, newer, { id: wa.id, key: wa.key || wb.key || null });
        if (JSON.stringify(next) !== JSON.stringify(wa)) { out.words = next; changed = true; }
      }
      // A crew's family words (crewWords, crewWordsSync): every crew's, by its code (audit 7 Oct 2026, D3).
      const cw = Array.isArray(out.crewWords) ? out.crewWords.slice() : [];
      (Array.isArray(b.crewWords) ? b.crewWords : []).forEach((w) => {
        if (moveIsObj(w) && w.code && Array.isArray(w.words) && !cw.some((x) => x && x.code === w.code)) { cw.push(w); changed = true; }
      });
      if (cw.length) out.crewWords = cw;
      if (changed) put(k, out);
      return;
    }
    if (kind === 'snakesMaps') {
      // «خرايطنا» (JS_Snakes.html): both phones' maps by id, one map (seed and look) once, the newest first.
      const a = moveParse(mine, []), b = moveParse(raw, []);
      if (!Array.isArray(b)) return;
      const out = Array.isArray(a) ? a.filter((m) => moveIsObj(m)) : [];
      let added = 0;
      b.forEach((m) => {
        if (!moveIsObj(m) || typeof m.id !== 'string' || typeof m.name !== 'string') return;
        if (out.some((x) => x.id === m.id || (x.seed === m.seed && x.theme === m.theme))) return;
        out.push(m); added++;
      });
      if (!added) return;
      const kept = out.slice(0, MOVE_SNAKES_MAPS_KEEP);
      const took = b.filter((m) => kept.indexOf(m) !== -1).length;
      if (!took) return;
      got.settings += took;
      put(k, kept);
      return;
    }
    if (kind === 'daily') {
      const a = moveParse(mine, {}), b = moveParse(raw, {});
      if (!moveIsObj(b)) return;
      const out = moveIsObj(a) ? Object.assign({}, a) : {};
      let changed = false;
      Object.keys(b).forEach((day) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !moveIsObj(b[day])) return;
        const had = moveIsObj(out[day]) ? out[day] : {};
        const next = Object.assign({}, had);
        Object.keys(b[day]).forEach((g) => {
          if (!next[g] || (next[g] === 1 && moveIsObj(b[day][g]))) next[g] = b[day][g];
        });
        if (!Object.keys(had).length && Object.keys(next).length) got.days++;
        if (JSON.stringify(next) !== JSON.stringify(had)) { out[day] = next; changed = true; }
      });
      if (changed) put(k, out);
      return;
    }
    if (kind === 'dailyPlay') {
      const a = moveParse(mine, {}), b = moveParse(raw, {});
      if (!moveIsObj(b)) return;
      const out = moveIsObj(a) ? Object.assign({}, a) : {};
      let changed = false;
      Object.keys(b).forEach((g) => { if (!out[g] && b[g]) { out[g] = b[g]; changed = true; } });
      if (changed) put(k, out);
      return;
    }
    if (kind === 'bests' || kind === 'memoryBest') {
      const a = moveParse(mine, {}), b = moveParse(raw, {});
      if (!moveIsObj(b)) return;
      const out = moveIsObj(a) ? Object.assign({}, a) : {};
      const better = kind === 'bests' ? moveBestBetter
        : (x, y) => !moveIsObj(y) || x.moves < y.moves || (x.moves === y.moves && x.seconds < y.seconds);
      let changed = false;
      Object.keys(b).forEach((id) => {
        if (!moveIsObj(b[id])) return;
        if (!out[id] || better(b[id], out[id])) { out[id] = b[id]; got.bests++; changed = true; }
      });
      if (changed) put(k, out);
      return;
    }
    if (kind === 'chess') {
      const a = moveParse(mine, []), b = moveParse(raw, []);
      if (!Array.isArray(b)) return;
      const out = Array.isArray(a) ? a.slice() : [];
      let added = 0;
      b.forEach((g) => {
        if (!moveIsObj(g) || !Array.isArray(g.moves)) return;
        if (out.some((x) => x && ((g.id && x.id === g.id) || (g.key && x.key === g.key)))) return;
        out.push(g); added++;
      });
      if (!added) return;
      out.sort((x, y) => (y.at || 0) - (x.at || 0));
      const kept = out.slice(0, MOVE_CHESS_KEEP);
      got.chess += b.filter((g) => kept.indexOf(g) !== -1).length;
      put(k, kept);
      return;
    }
    if (kind === 'nights') {
      const a = moveParse(mine, []), b = moveParse(raw, []);
      if (!Array.isArray(b)) return;
      const out = Array.isArray(a) ? a.slice() : [];
      let added = 0;
      b.forEach((n) => {
        if (!moveIsObj(n) || !n.day) return;
        if (out.some((x) => x && x.code === n.code && x.day === n.day)) return;
        out.push(n); added++;
      });
      if (!added) return;
      out.sort((x, y) => String(x.day).localeCompare(String(y.day)));
      const kept = out.slice(-MOVE_NIGHTS_KEEP);
      got.nights += b.filter((n) => kept.indexOf(n) !== -1).length;
      put(k, kept);
      return;
    }
    if (kind === 'seen') {
      const a = moveParse(mine, {}), b = moveParse(raw, {});
      if (!moveIsObj(b)) return;
      const out = moveIsObj(a) ? Object.assign({}, a) : {};
      let changed = false;
      Object.keys(b).forEach((list) => {
        if (!Array.isArray(b[list])) return;
        const had = Array.isArray(out[list]) ? out[list] : [];
        const set = new Set(had);
        const more = b[list].filter((x) => !set.has(x));
        if (more.length) { out[list] = had.concat(more.filter((x, i) => more.indexOf(x) === i)); changed = true; }
      });
      if (changed) put(k, out);
      return;
    }
    if (kind === 'set' || kind === 'recent') {
      const a = moveParse(mine, []), b = moveParse(raw, []);
      if (!Array.isArray(b)) return;
      const had = Array.isArray(a) ? a : [];
      let out = had.concat(b.filter((x) => had.indexOf(x) === -1));
      out = out.filter((x, i) => out.indexOf(x) === i);
      if (kind === 'recent') out = out.slice(0, MOVE_RECENT_KEEP);
      if (out.length !== had.length) put(k, out);
      return;
    }
    if (kind === 'options') {
      const a = moveParse(mine, {}), b = moveParse(raw, {});
      if (!moveIsObj(b)) return;
      const out = moveIsObj(a) ? Object.assign({}, a) : {};
      let changed = false;
      Object.keys(b).forEach((o) => {
        if (!(o in out)) { out[o] = b[o]; got.settings++; changed = true; return; }
        if (moveIsObj(out[o]) && moveIsObj(b[o])) {
          const inner = Object.assign({}, out[o]);
          let more = false;
          Object.keys(b[o]).forEach((f) => { if (!(f in inner)) { inner[f] = b[o][f]; more = true; } });
          if (more) { out[o] = inner; changed = true; }
        }
      });
      if (changed) put(k, out);
      return;
    }
    if (kind === 'app') {
      const a = moveParse(mine, null), b = moveParse(raw, {});
      if (!moveIsObj(b)) return;
      const out = moveIsObj(a) ? Object.assign({}, a) : {};
      let changed = false;
      Object.keys(MOVE_APP_FIELDS).forEach((f) => {
        if (!(f in b) || typeof b[f] !== typeof MOVE_APP_FIELDS[f]) return;
        const cur = f in out ? out[f] : defaults[f];
        if (cur === defaults[f] && b[f] !== cur) { out[f] = b[f]; got.settings++; changed = true; }
      });
      // The chess rating: taken only by a phone with no rated games of its own (audit 7 Oct 2026, D1).
      if (moveChessRatingOk(b.chessRating) && !moveChessRatingOk(out.chessRating)) {
        out.chessRating = { r: b.chessRating.r, n: b.chessRating.n }; got.bests++; changed = true;
      }
      if (changed) put(k, out);
    }
  });
  return { write, got };
}
