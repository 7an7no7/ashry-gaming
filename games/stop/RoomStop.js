// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   أتوبيس كومبليت — STOP THE BUS (rooms)
   The same paper game, with every phone as the paper. A letter is dealt,
   everyone types an answer per category, and the first to press وقف closes
   the round for the whole table: the other phones get a few seconds to send
   what they had typed. وقف itself is refused until every box of that sheet
   holds a word starting with the letter (stopAnswerFits). The server then
   scores by comparing the answers - 10 for an answer nobody else had, 5 for
   one somebody shared, 0 for a blank or a word that doesn't start with the
   letter - and checks each against the dictionary for its category
   (stopWordKnown, StopWords.js): a word it doesn't know scores 0 and is marked
   for the host (word: 'unknown'), unless another player wrote the same word
   too, which a made-up word almost never is. The host can correct any cell
   before the points are banked.

   Answers stay in room._answers (never projected) until the round closes,
   so a phone that finished early cannot show its list to the table.
   ========================================================================== */
const STOP_CAT_IDS = ['name', 'animal', 'plant', 'thing', 'country', 'city', 'food', 'brand', 'job', 'color'];
const STOP_LETTERS_BY_LANG = {
  ar: 'ا ب ت ث ج ح خ د ر ز س ش ص ض ط ع غ ف ق ك ل م ن ه و ي'.split(' '),
  en: 'A B C D E F G H I J K L M N O P R S T V W'.split(' ')
};
const STOP_TIMERS = [60, 90, 120, 0];
const STOP_ROUNDS = [3, 5, 7, 10];
const STOP_POINT_STEPS = [10, 5, 0];
const STOP_COLLECT_MS = 4000;     // after وقف, the other phones send what they typed
const STOP_GRACE_MS = 1500;       // the clock ran out: how late a submit still counts

// foldArabicLetters, the letters people spell one word with, is in app/Common.js (the phones run it too).

// foldStopAnswer, stopAnswerFits and stopWordKnown are in StopWords.js, shared with the page.

const stopAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound' || action === 'playAgain') {
    requireHost(room, playerId, action === 'nextRound');
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    const prev = room.shared || {};

    if (action === 'start') {
      const lang = roomLangOf(room, payload);
      const cats = (Array.isArray(payload && payload.cats) ? payload.cats : [])
        .map(String).filter((c, i, arr) => STOP_CAT_IDS.indexOf(c) !== -1 && arr.indexOf(c) === i);
      const timer = Number(payload && payload.timer);
      const rounds = Number(payload && payload.rounds);
      room._stopOpts = {
        lang: lang,
        cats: cats.length >= 2 ? cats : ['name', 'animal', 'plant', 'thing', 'country'],
        timer: STOP_TIMERS.indexOf(timer) !== -1 ? timer : 90,
        rounds: STOP_ROUNDS.indexOf(rounds) !== -1 ? rounds : 5,
        lenient: !!(payload && payload.lenient)
      };
      room._stopTotals = {};
      room._stopRound = 0;
    } else if (action === 'nextRound') {
      // From the review only, and the points as corrected are banked here.
      if (prev.phase !== 'review') return;
      bankStopRound(room);
      if (room._stopRound >= room._stopOpts.rounds) {
        prev.phase = 'done';
        prev.board = stopBoard(room);
        prev.results = null;
        return;
      }
    } else {
      if (prev.phase !== 'done') return;
      room._stopTotals = {};
      room._stopRound = 0;
    }
    dealStopLetter(room);
    return;
  }

  const s = room.shared;
  if (!s || room.game !== 'stop') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'submit') {
    // A sheet from the last round, arriving after the next letter was dealt, is not this round's.
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'writing' && s.phase !== 'collecting') return;
    if ((s.roster || []).indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');
    if (s.submitted.indexOf(playerId) !== -1) return;
    const given = (payload && payload.answers) || {};
    const answers = {};
    s.cats.forEach(c => { answers[c] = String(given[c] || '').trim().slice(0, 30); });
    // وقف closes everyone's sheet, so it needs a full one: every box a word on the letter.
    if (s.phase === 'writing' && payload && payload.stop && !s.cats.every(c => stopAnswerFits(answers[c], s.lang, s.letter))) {
      throw new Error('املأ كل الخانات بكلمات بتبدأ بالحرف قبل ما توقف');
    }
    room._answers = room._answers || {};
    room._answers[playerId] = answers;
    s.submitted.push(playerId);
    if (s.phase === 'writing' && payload && payload.stop) {
      s.stopperId = playerId;
      s.stopperName = (room.players.find(p => p.id === playerId) || {}).name || '';
      s.phase = 'collecting';
      s.collectEndsAt = Date.now() + STOP_COLLECT_MS;
    }
    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) scoreStopRound(room);
    return;
  }

  if (action === 'timeUp') {
    // Anyone may say the clock ran out, but only once it has.
    if (s.phase !== 'writing' || !s.endsAt || Date.now() < s.endsAt) return;
    s.phase = 'collecting';
    s.collectEndsAt = Date.now() + STOP_COLLECT_MS;
    return;
  }

  if (action === 'adjust') {
    requireHost(room, playerId);
    if (s.phase !== 'review') return;
    const pid = String((payload && payload.playerId) || '');
    const cat = String((payload && payload.cat) || '');
    const pts = Number(payload && payload.pts);
    // Only a player and a category of this round: a name like '__proto__' must
    // never reach an object's prototype (it is shared by every room in the isolate).
    const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
    const row = own(s.results, pid) ? s.results[pid] : null;
    if (!row || (s.cats || []).indexOf(cat) === -1 || !own(row, cat) || !row[cat] ||
        STOP_POINT_STEPS.indexOf(pts) === -1) return;
    const prevPts = row[cat].pts;
    const cellWord = row[cat].word;
    const cellText = row[cat].text;
    row[cat].pts = pts;
    row[cat].manual = true;
    s.roundTotals[pid] = s.cats.reduce((sum, c) => sum + (row[c] ? row[c].pts : 0), 0);
    // Logged once a cell: a host cycling it through 0 and back is one table's
    // one decision, not several.
    if ((cellWord === 'unknown' || cellWord === 'shared') && prevPts === 0 && pts > 0 && !row[cat].logged) {
      row[cat].logged = true;
      room._stopTaps = room._stopTaps || [];
      room._stopTaps.push({ lang: s.lang || 'ar', cat: cat, word: cellText });
    }
    return;
  }

  throw new Error('إجراء غير معروف');
};

const dealStopLetter = (room) => {
  const o = room._stopOpts;
  room._stopRound += 1;
  room._answers = {};
  // Only letters every chosen category can answer (stopLettersFor, StopWords.js): وقف needs a full sheet.
  // The full list keeps its memory key; a narrower one has its own, per set of categories.
  const all = STOP_LETTERS_BY_LANG[o.lang] || STOP_LETTERS_BY_LANG.ar;
  const pool = stopLettersFor(o.lang, o.cats, all);
  const letter = nextPrompt(room, pool, pool.length === all.length ? 'stop_' + o.lang : 'stop_' + o.lang + '_' + o.cats.slice().sort().join('.'));
  room.secrets = {};
  room.shared = {
    lang: o.lang,
    cats: o.cats.slice(),
    timer: o.timer,
    rounds: o.rounds,
    lenient: !!o.lenient,
    settings: { lenient: !!o.lenient },
    round: room._stopRound,
    letter: letter,
    phase: 'writing',
    endsAt: o.timer ? Date.now() + o.timer * 1000 : 0,
    collectEndsAt: 0,
    submitted: [],
    stopperId: null,
    stopperName: '',
    results: null,
    roundTotals: {},
    totals: Object.assign({}, room._stopTotals),
    roster: room.players.map(p => p.id),
    board: stopBoard(room)
  };
  room.phase = 'play';
};

/** Compares the answers and writes the table everybody sees. Safe to call twice. */
const scoreStopRound = (room) => {
  const s = room.shared;
  if (s.phase !== 'writing' && s.phase !== 'collecting') return;
  const answers = room._answers || {};
  const letter = foldStopAnswer(s.letter, s.lang);
  const results = {};
  const roundTotals = {};
  const roster = s.roster || [];

  s.cats.forEach(cat => {
    const folded = {};
    roster.forEach(pid => {
      const raw = (answers[pid] || {})[cat] || '';
      const f = foldStopAnswer(raw, s.lang, letter);
      const ok = f.length >= 2 && f.charAt(0) === letter;
      folded[pid] = { raw: raw, f: f, ok: ok, known: ok && stopWordKnown(s.lang, cat, raw) !== false };
    });
    const counts = {};
    roster.forEach(pid => { if (folded[pid].ok) counts[folded[pid].f] = (counts[folded[pid].f] || 0) + 1; });
    roster.forEach(pid => {
      const a = folded[pid];
      const shared = a.ok && counts[a.f] > 1;
      // known: in the dictionary; shared: not, but someone else wrote it too; unknown: the host decides.
      const word = !a.ok ? '' : a.known ? 'known' : shared ? 'shared' : 'unknown';
      const pts = !a.ok ? 0 : word === 'unknown' ? (s.lenient ? 10 : 0) : (shared ? 5 : 10);
      results[pid] = results[pid] || {};
      results[pid][cat] = { text: a.raw, pts: pts, ok: a.ok, word: word, manual: false };
    });
  });
  roster.forEach(pid => {
    roundTotals[pid] = s.cats.reduce((sum, c) => sum + results[pid][c].pts, 0);
  });
  s.results = results;
  s.roundTotals = roundTotals;
  s.phase = 'review';
};

const bankStopRound = (room) => {
  const s = room.shared;
  Object.keys(s.roundTotals || {}).forEach(pid => {
    room._stopTotals[pid] = (room._stopTotals[pid] || 0) + (s.roundTotals[pid] || 0);
  });
  s.totals = Object.assign({}, room._stopTotals);
  s.board = stopBoard(room);
};

const stopBoard = (room) =>
  room.players
    .map(p => ({ id: p.id, name: p.name, score: (room._stopTotals || {})[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);
