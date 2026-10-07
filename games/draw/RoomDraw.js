// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   رسم وتخمين — DRAW & GUESS
   --------------------------------------------------------------------------
   One player draws, everyone else types guesses. Finished strokes are appended
   in small batches and never re-sent; the line still under the drawer's finger
   is relayed live by the room server without being stored (JS_RoomDraw.html).
   The round goes to whoever gets there first.

   Coordinates are quantised to 0–255 and packed flat ([x,y,x,y,…]) so a whole
   drawing stays small: a phone that reconnects is sent all of it again.
   ========================================================================== */

/** The word's shape for the guessers: a dash per letter, spaces kept. */
const drawHint = (word) => String(word || '').split('').map(ch => ch === ' ' ? ' ' : '_').join(' ');

/** How alike two folded words are, 0 to 1 (Levenshtein). */
const stringSimilarity = (a, b) => {
  const longer = a.length < b.length ? b : a, shorter = a.length < b.length ? a : b;
  if (!longer.length) return 1;
  const costs = [];
  for (let i = 0; i <= a.length; i++) {
    let last = i;
    for (let j = 0; j <= b.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let v = costs[j - 1];
        if (a.charAt(i - 1) !== b.charAt(j - 1)) v = Math.min(v, last, costs[j]) + 1;
        costs[j - 1] = last; last = v;
      }
    }
    if (i > 0) costs[b.length] = last;
  }
  return (longer.length - costs[b.length]) / longer.length;
};

/* --- Judging a typed guess ---------------------------------------------------
   A guess is judged the way the table would hear it (the owner, 17 Sep 2026:
   طماطم for طماطماية came back "wrong", with no nudge). guessVerdict(text,
   answers) says 'right', 'close' or '':
   - right: the same word after normaliseClue; the same stem, where a stem
     drops one unit or plural ending (طماطماية/طماطم, تفاحة/تفاح,
     مهندسين/مهندس, cats/cat); the same once the measure words are dropped
     (حبة طماطم, كوب شاي, slice of pizza); or one letter off in a word of
     five letters or more - the forgiveness the Stop dictionary already has;
   - close: most of the letters (similarity 0.6), the same first four letters,
     or all but one word of a longer answer. A nudge on the screen, never a
     point.
   Draw & Guess, the fake artist's guess and the quiz cards judge through it.
   The fold stays normaliseClue (app/Common.js; the page's foldWord is the same function). */
const GUESS_MEASURE_WORDS = new Set([
  'حبه', 'حبايه', 'كوب', 'كوبايه', 'فنجان', 'طبق', 'عربيه', 'سياره', 'كاس', 'علبه', 'كيس', 'قطعه', 'حته',
  'عنقود', 'زجاجه', 'قزازه', 'برطمان', 'لوح', 'كوز', 'قرن', 'فص', 'كورنيه', 'صينيه', 'سله', 'رغيف', 'مج', 'كانز',
  'a', 'an', 'of', 'cup', 'mug', 'glass', 'bowl', 'plate', 'slice', 'bar', 'bag', 'bottle', 'jar', 'can', 'carton',
  'bunch', 'loaf', 'piece', 'cone', 'pot', 'box', 'pair'
]);

/** The folded words of a phrase, each without its article. */
const guessWords = (text) => foldArabicLetters(text)
  .replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean)
  .map(w => {
    if (w.indexOf('the') === 0 && w.length > 3) w = w.slice(3);
    for (let i = 0; i < 2 && w.length > 3 && w.indexOf('ال') === 0; i++) w = w.slice(2);
    return w;
  }).filter(Boolean);

/** A word without one unit or plural ending, when enough letters remain (three; four for ون, or زيتون would be زيت). */
const guessStem = (w) => {
  const rules = [[/ايه$/, '', 3], [/ات$/, '', 3], [/ين$/, '', 3], [/ون$/, '', 4], [/يه$/, '', 3], [/ه$/, '', 3], [/ies$/, 'y', 3], [/es$/, '', 3], [/s$/, '', 3]];
  for (const [re, to, min] of rules) {
    if (re.test(w)) { const out = w.replace(re, to); if (out.length >= min) return out; }
  }
  return w;
};

/** A game's own list, folded the way a guess is, once per list. */
const GUESS_BANKS = new WeakMap();
const guessBankSet = (bank) => {
  if (!Array.isArray(bank)) return null;
  let set = GUESS_BANKS.get(bank);
  if (!set) {
    set = new Set(bank.map(w => guessWords(typeof w === 'string' ? w : ((w && w.a) || '')).join('')).filter(Boolean));
    GUESS_BANKS.set(bank, set);
  }
  return set;
};

const guessDistance = (a, b) => Math.round((1 - stringSimilarity(a, b)) * Math.max(a.length, b.length));

/** Two stems are one word; the unit ending swallows a final و or ا (مانجو → مانجاية, كولا → كولاية). */
const sameStem = (a, b) => a === b || (a.length >= 3 && (a + 'و' === b || a + 'ا' === b)) || (b.length >= 3 && (b + 'و' === a || b + 'ا' === a));

/**
 * `bank` (optional) is the game's own list. A guess that is another word on it
 * names a different thing - House for Horse, Monkey for Donkey, شمس for شمسية,
 * يد for عربية يد - so the lenient rules below, which are for spellings of the
 * answer, don't make it right; it can still be close.
 */
const guessVerdict = (text, answers, bank) => {
  const g = guessWords(text);
  if (!g.length) return '';
  const gWhole = g.join('');
  const gCore = (() => { const rest = g.filter(w => !GUESS_MEASURE_WORDS.has(w)); return (rest.length ? rest : g).map(guessStem).join(''); })();
  const bankSet = guessBankSet(bank);
  const namesOther = !!bankSet && bankSet.has(gWhole) && !(answers || []).some(a => guessWords(a).join('') === gWhole);
  let close = false;
  for (const answer of answers || []) {
    const a = guessWords(answer);
    if (!a.length) continue;
    const aWhole = a.join('');
    if (gWhole === aWhole) return 'right';
    const aRest = a.filter(w => !GUESS_MEASURE_WORDS.has(w));
    const aCore = (aRest.length ? aRest : a).map(guessStem).join('');
    if (!namesOther && sameStem(gCore, aCore)) return 'right';
    if (!namesOther && Math.min(gCore.length, aCore.length) >= 5 && guessDistance(gCore, aCore) <= 1) return 'right';
    // Close: most of the letters, the same start, or all but one word of a phrase.
    if (stringSimilarity(gWhole, aWhole) >= 0.6 || stringSimilarity(gCore, aCore) >= 0.6) close = true;
    else if (Math.min(gWhole.length, aWhole.length) >= 4 && (gWhole.indexOf(aWhole.slice(0, 4)) === 0 || aWhole.indexOf(gWhole.slice(0, 4)) === 0)) close = true;
    else if (a.length >= 2 && g.length >= 1 && g.every(w => a.indexOf(w) !== -1) && g.length >= a.length - 1) close = true;
  }
  return close ? 'close' : '';
};

const DRAW_MAX_POINTS = 2600;     // ~15KB of JSON, however long the round
const DRAW_ROUND_SECONDS = 90;    // the default the host can change
const DRAW_ROUND_MIN = 30;
const DRAW_ROUND_MAX = 240;

/* Tools a stroke may carry. Absent means freehand, which is what every stroke
   made before this existed is, so old rooms replay unchanged. */
const DRAW_TOOLS = ['f', 'l', 'r', 'o', 'b'];
/* How many numbers each tool's `p` must hold. Freehand is variable. */
const DRAW_TOOL_POINTS = { l: 4, r: 4, o: 4, b: 2 };

const drawGuessAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId, action === 'nextRound');
    // Once the word is out only (a win or a reveal), so a double tap can't skip a drawer.
    if (action === 'nextRound' && !(room.shared && room.shared.word)) return;
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const round = ((room.shared && room.shared.round) || 0) + 1;
    const scores = (room.shared && room.shared.scores) || {};

    // The host picks the length in the lobby; later rounds reuse it rather than
    // asking again. Clamped here because the client is not the authority on it.
    const asked = Number(payload.seconds) || (room.shared && room.shared.roundSeconds);
    const seconds = Math.max(DRAW_ROUND_MIN,
                             Math.min(DRAW_ROUND_MAX, Math.round(asked || DRAW_ROUND_SECONDS)));

    // The drawer walks a shuffled order so everyone gets a turn, once each, however the table changes.
    const turn = roomTurnStep(action === 'start' ? {} : (room.shared || {}), room.players);
    const drawer = turn.player;
    // «كلماتنا»: the family's own words, when the lobby chose them.
    const family = roomPackWords(room);
    const word = family ? nextPrompt(room, family, 'draw_pack_' + room._pack.code) : nextPrompt(room, DRAW_WORDS[lang], 'draw_' + lang);

    room._word = word;
    room.secrets = {};
    // Only the drawer is told the word.
    room.secrets[drawer.id] = { word: word };

    room.shared = {
      round: round,
      lang: lang,
      drawerId: drawer.id,
      drawerName: drawer.name,
      turnOrder: turn.order,
      turnAt: turn.at,
      strokes: [],
      guesses: [],
      winnerId: null,
      roundSeconds: seconds,
      endsAt: Date.now() + seconds * 1000,
      scores: scores,
      roster: room.players.map(p => p.id),
      hint: drawHint(word),
      // The word has a kind the drawer may tell («قول الفئة», 567); the family's own words have none.
      catOk: !family && !!drawWordCategory(lang, word)
    };
    room.phase = 'drawing';
    return;
  }

  if (action === 'addStrokes') {
    const s = room.shared;
    if (playerId !== s.drawerId) throw new Error('الرسام فقط');
    // s.word is only set once the round is over — by a win or by giving up.
    if (s.word) return;

    const batch = Array.isArray(payload.strokes) ? payload.strokes : [];
    let points = s.strokes.reduce((n, st) => n + (st.p ? st.p.length : 0), 0);

    batch.forEach(st => {
      const room_left = DRAW_MAX_POINTS - points;
      if (room_left < 2) return;

      const tool = DRAW_TOOLS.indexOf(String(st.t || 'f')) !== -1 ? String(st.t || 'f') : 'f';
      let pts = (st.p || []).map(n => Math.max(0, Math.min(255, Math.round(Number(n) || 0))));

      const exact = DRAW_TOOL_POINTS[tool];
      if (exact) {
        // A shape is its two corners. Truncating one would draw nonsense, so a
        // shape that does not fit the budget is dropped instead.
        if (pts.length !== exact || room_left < exact) return;
      } else {
        // Freehand truncates rather than being rejected, keeping pairs intact,
        // so a long stroke draws as far as the budget allows.
        if (pts.length > room_left) pts = pts.slice(0, room_left - (room_left % 2));
        if (pts.length < 2) return;
      }

      const stroke = {
        c: String(st.c || '#111').slice(0, 8),
        w: Math.max(1, Math.min(48, Number(st.w) || 4)),
        p: pts
      };
      // Only carried when it means something, so freehand stays as compact as
      // it was and rooms mid-round keep working.
      if (tool !== 'f') stroke.t = tool;
      s.strokes.push(stroke);
      points += pts.length;
    });
    return;
  }

  if (action === 'clearCanvas') {
    if (playerId !== room.shared.drawerId) throw new Error('الرسام فقط');
    if (room.shared.word) return;      // the round is over
    room.shared.strokes = [];
    return;
  }

  if (action === 'undoStroke') {
    const s = room.shared;
    if (playerId !== s.drawerId) throw new Error('الرسام فقط');
    if (s.word) return;
    // One step per press. Viewers see the list shrink and repaint from scratch,
    // which is already how a clear is handled.
    if (s.strokes.length) s.strokes.pop();
    return;
  }

  if (action === 'guess') {
    const s = room.shared;
    if (playerId === s.drawerId) throw new Error('الرسام لا يخمّن');
    // `word` is set the moment the round ends - by a win or by giving up. It
    // was only checking winnerId, so after a reveal the answer was on screen
    // and could still be typed back in for the points.
    if (s.word) throw new Error('انتهت الجولة');
    const player = room.players.find(p => p.id === playerId);
    if (!player) throw new Error('ستدخل من الجولة القادمة');
    // Off the roster (joined mid-round): guesses for fun, marked 👀, no points,
    // and a right one doesn't end the round (the owner's 569, 7 Oct 2026).
    const watcher = (s.roster || []).indexOf(playerId) === -1;

    const text = String(payload.guess || '').trim().slice(0, 40);
    if (!text) return;
    // Judged the way the table hears it (guessVerdict): طماطم is طماطماية, a
    // letter off in a long word still counts, and a near miss gets a nudge.
    const verdict = guessVerdict(text, [room._word], roomPackWords(room) || DRAW_WORDS[s.lang] || DRAW_WORDS.ar);
    const right = verdict === 'right';
    const close = verdict === 'close';

    // A close guess (and a watcher's right one) is printed only on the
    // guesser's own phone (the owner's 565): everyone else reads «🔥 خالد
    // قرّب», so nobody copies the near spelling for the points. The text sits
    // in the guesser's own slice under the guess's number.
    const hidden = close || (watcher && right);
    s.guessSeq = (s.guessSeq || 0) + 1;
    const entry = { n: s.guessSeq, name: player.name, text: hidden ? '' : text, right: right, close: close };
    if (watcher) entry.watcher = true;
    s.guesses.push(entry);
    if (s.guesses.length > 30) s.guesses = s.guesses.slice(-30);
    if (hidden) {
      const mine = room.secrets[playerId] = room.secrets[playerId] || {};
      mine.guesses = (mine.guesses || []).concat([{ n: s.guessSeq, text: text }]).slice(-30);
    }

    if (right && !watcher) {
      s.winnerId = playerId;
      s.word = room._word;          // safe to publish now
      // The guesser and the drawer both score; drawing well is half the game.
      // Guessed in the first third of the clock: +1 more to each (566, the ⚡
      // on the stamp). A drawer who told the category gave their point up (567).
      const len = (s.roundSeconds || DRAW_ROUND_SECONDS) * 1000;
      s.quick = !!s.endsAt && Date.now() - (s.endsAt - len) <= len / 3;
      addScore(room, playerId, s.quick ? 3 : 2);
      if (!s.category) addScore(room, s.drawerId, s.quick ? 2 : 1);
      s.board = scoreboardOf(room);
      room.phase = 'result';
    }
    return;
  }

  if (action === 'tellCategory') {
    // «قول الفئة» (567): the drawer tells the guessers what kind of thing the
    // word is, and gives up their point for the round.
    const s = room.shared;
    if (playerId !== s.drawerId) throw new Error('الرسام فقط');
    if (s.word || s.category) return;
    const cat = roomPackWords(room) ? '' : drawWordCategory(s.lang, room._word);
    if (!cat) throw new Error('الكلمة دي ملهاش فئة');
    s.category = cat;
    return;
  }

  if (action === 'giveUp') {
    // The drawer can reveal too — they're the one who knows it's hopeless.
    if (room.hostId !== playerId && room.shared.drawerId !== playerId) {
      throw new Error('المضيف أو الرسام فقط');
    }
    revealDrawWord(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** Ends a round nobody guessed: the word goes public. False if it already was. */
const revealDrawWord = (room) => {
  const s = room.shared;
  if (s.word) return false;
  s.word = room._word;
  s.board = scoreboardOf(room);
  room.phase = 'result';
  return true;
};
