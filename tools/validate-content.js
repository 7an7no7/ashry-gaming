/**
 * Content validation for the new games.
 *
 * The one that actually breaks a game: a word appearing in two groups of the
 * same Connections puzzle. The grid would show 16 tiles with a duplicate label,
 * and tapping either would ambiguously satisfy two groups.
 */
const fs = require('fs');
const path = require('path');
const { srcPath, srcFiles } = require('./sources.cjs');

// The project root: the content files sit next to tools/.
const ROOT = path.join(__dirname, '..') + path.sep;

const load = (file, name) => {
  // JS_*.html files wrap their code in a <script> tag; strip it before eval.
  const src = fs.readFileSync(file, 'utf8')
    .replace(/^\s*<script>/, '')
    .replace(/<\/script>\s*$/, '');
  return new Function(src + '; return ' + name + ';')();
};

const problems = [];
const note = (msg) => problems.push(msg);

/* ---------------------------------------------------------- Connections */
// Three difficulties, one shape: every group is 4 words, and a word appears once per board.
for (const [dbName, groupCount] of [['CONNECTIONS_EASY', 3], ['CONNECTIONS_DB', 4], ['CONNECTIONS_HARD', 5]]) {
  const CONN = load(srcPath('ConnectionsWords.js'), dbName);
  for (const [lang, puzzles] of Object.entries(CONN)) {
    puzzles.forEach((p, pi) => {
      const tag = `${dbName}.${lang}[${pi}]`;
      if (p.groups.length !== groupCount) note(`${tag}: ${p.groups.length} groups, expected ${groupCount}`);
      const all = [];
      const names = {};
      p.groups.forEach((g, gi) => {
        if (g.words.length !== 4) note(`${tag}.${g.name}: ${g.words.length} words, expected 4`);
        if (!g.name) note(`${tag} group ${gi} has no name`);
        if (names[g.name]) note(`${tag}: two groups called "${g.name}"`);
        names[g.name] = true;
        g.words.forEach(w => all.push({ w, g: g.name }));
      });
      if (all.length !== groupCount * 4) note(`${tag}: ${all.length} tiles, expected ${groupCount * 4}`);
      const seen = {};
      all.forEach(({ w, g }) => {
        if (seen[w]) note(`${tag}: DUPLICATE "${w}" in both "${seen[w]}" and "${g}"`);
        else seen[w] = g;
      });
    });
    console.log(`${dbName}.${lang}: ${puzzles.length} puzzles`);
  }
}

// Near-duplicate puzzles (the review of 1 Oct 2026: two hard puzzles with the same five
// "parts of …" groups, the same Korean brands twice). Within one level, two puzzles may not
// share three category names (folded: case, hamza, ة/ه, ى/ي, "ال"/"the", spaces); a hard
// puzzle may not repeat another hard puzzle's whole group, either (the same four words, in
// any order). Easy and medium boards are made of the basic kinds - the seasons, the colours -
// which can only be one set of four, so a repeated group is allowed there.
{
  const foldName = (s) => String(s).toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^a-z0-9\u0621-\u064A]/g, '').replace(/^(ال|the)/, '');
  for (const dbName of ['CONNECTIONS_EASY', 'CONNECTIONS_DB', 'CONNECTIONS_HARD']) {
    const CONN = load(srcPath('ConnectionsWords.js'), dbName);
    for (const [lang, puzzles] of Object.entries(CONN)) {
      const names = puzzles.map(p => p.groups.map(g => foldName(g.name)));
      const sets = puzzles.map(p => p.groups.map(g => g.words.map(foldName).sort().join('|')));
      for (let a = 0; a < puzzles.length; a++) {
        for (let b = a + 1; b < puzzles.length; b++) {
          const shared = names[a].filter(n => names[b].indexOf(n) !== -1);
          if (shared.length >= 3) note(`${dbName}.${lang}[${a}] and [${b}]: ${shared.length} category names in common - one is a near copy of the other`);
          if (dbName === 'CONNECTIONS_HARD') {
            const same = puzzles[a].groups.filter((g, i) => sets[b].indexOf(sets[a][i]) !== -1).map(g => g.name);
            if (same.length) note(`${dbName}.${lang}[${a}] and [${b}]: the same group twice (${same.join(', ')})`);
          }
        }
      }
    }
  }
}

/* -------------------------------------------------------- Party content */
const PC = srcPath('PartyContent.js');
const WYR = load(PC, 'WOULD_YOU_RATHER');
const MLT = load(PC, 'MOST_LIKELY_TO');
const FIB = load(PC, 'FIBBAGE');

for (const [lang, list] of Object.entries(WYR)) {
  list.forEach((pair, i) => {
    if (!Array.isArray(pair) || pair.length !== 2) note(`wyr.${lang}[${i}]: not a pair`);
    else pair.forEach((o, j) => { if (!o || !o.trim()) note(`wyr.${lang}[${i}][${j}]: empty`); });
  });
  const dup = list.map(p => p.join('|')).filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) note(`wyr.${lang}: duplicates ${JSON.stringify(dup)}`);
  console.log(`wyr.${lang}: ${list.length} pairs`);
}

for (const [lang, list] of Object.entries(MLT)) {
  list.forEach((q, i) => { if (!q || !q.trim()) note(`mlt.${lang}[${i}]: empty`); });
  const dup = list.filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) note(`mlt.${lang}: duplicates ${JSON.stringify(dup)}`);
  console.log(`mlt.${lang}: ${list.length} prompts`);
}

for (const [lang, list] of Object.entries(FIB)) {
  list.forEach((item, i) => {
    if (!item.q || !item.a) note(`fibbage.${lang}[${i}]: missing q or a`);
    // Without the blank the player has nothing to fill in.
    else if (item.q.indexOf('___') === -1) note(`fibbage.${lang}[${i}]: question has no ___ blank`);
    if (item.a && item.a.length > 20) note(`fibbage.${lang}[${i}]: answer too long to be guessable ("${item.a}")`);
  });
  const dup = list.map(x => x.q).filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) note(`fibbage.${lang}: duplicate questions ${JSON.stringify(dup)}`);
  console.log(`fibbage.${lang}: ${list.length} questions`);
}

/* --------------------------------------------------- Word banks (server) */
const DRAW = load(PC, 'DRAW_WORDS');
const CN = load(srcPath('CodenamesWords.js'), 'CODENAMES_WORDS');

// Draw & Guess needs enough words that a long session never repeats, and every
// entry has to be something you can actually draw — the reason it stopped
// sharing the Codenames bank, which is full of abstractions like "time".
// The fold the rooms compare words with (normaliseClue, app/Common.js): two
// spellings of one word are one card - بئر and بير, مغرب and المغرب - so a list
// may not hold both. A raw-string check let four such pairs into Codenames,
// where both could land on one board as two identical cards.
const clueKey = new Function(fs.readFileSync(srcPath('Common.js'), 'utf8') + '\nreturn normaliseClue;')();
const clueRepeats = (list) => {
  const seen = new Map();
  const out = [];
  list.forEach((w) => { const k = clueKey(w); if (seen.has(k)) out.push(seen.get(k) + ' / ' + w); else seen.set(k, w); });
  return out;
};

for (const [lang, list] of Object.entries(DRAW)) {
  const dup = clueRepeats(list);
  if (dup.length) note(`draw.${lang}: the same word twice ${JSON.stringify(dup)}`);
  if (list.length < 100) note(`draw.${lang}: only ${list.length} words, wants 100+`);
  list.forEach((w, i) => { if (!w || !w.trim()) note(`draw.${lang}[${i}]: empty`); });
  console.log(`draw.${lang}: ${list.length} words`);
}
// The same words grouped by kind (الفنان المزيف tells the fake the category): every
// category has words, a category is a name of its own in each language, and no word
// is spelled inside its own category's name (the fake would be told it).
const DRAW_CATS = load(PC, 'DRAW_WORD_CATS');
for (const [lang, cats] of Object.entries(DRAW_CATS)) {
  for (const [cat, words] of Object.entries(cats)) {
    if (!cat.trim() || !Array.isArray(words) || words.length < 5) note(`draw.${lang} "${cat}": a category needs a name and 5+ words`);
    (words || []).forEach((w) => { if (clueKey(cat).indexOf(clueKey(w)) !== -1) note(`draw.${lang} "${cat}": the word "${w}" is inside its category's name`); });
  }
  console.log(`draw.${lang}: ${Object.keys(cats).length} categories`);
}

// A Codenames board is 25 cards drawn without replacement.
for (const [lang, list] of Object.entries(CN)) {
  const dup = clueRepeats(list);
  if (dup.length) note(`codenames.${lang}: the same word twice ${JSON.stringify(dup)}`);
  if (list.length < 25) note(`codenames.${lang}: ${list.length} words, a board needs 25`);
  console.log(`codenames.${lang}: ${list.length} words`);
}

/* ------------------------------------------------ Trivia */
const TRIV = load(srcPath('TriviaQuestions.js'), 'TRIVIA_QUESTIONS');
// The server's categories, and the lobby's (JS_RoomTrivia.html), which adds 'all'.
const listIn = (file, name) => {
  const m = fs.readFileSync(srcPath(file), 'utf8').match(new RegExp('const ' + name + ' = (\\[[^\\]]*\\])'));
  if (!m) throw new Error(name + ' not found in ' + file);
  return JSON.parse(m[1].replace(/'/g, '"'));
};
const TRIVIA_CATS = listIn('RoomTrivia.js', 'TRIVIA_CATS');
if (listIn('JS_RoomTrivia.html', 'TRIVIA_ROOM_CATS').join() !== ['all'].concat(TRIVIA_CATS).join()) {
  note('trivia: TRIVIA_ROOM_CATS (JS_RoomTrivia.html) must be \'all\' and then TRIVIA_CATS (RoomTrivia.js)');
}
for (const [lang, list] of Object.entries(TRIV)) {
  list.forEach((item, i) => {
    if (!item.q || !item.q.trim()) note(`trivia.${lang}[${i}]: empty question`);
    if (!Array.isArray(item.choices) || item.choices.length !== 4) note(`trivia.${lang}[${i}]: expected 4 choices`);
    if (typeof item.answer !== 'number' || item.answer < 0 || item.answer > 3) note(`trivia.${lang}[${i}]: invalid answer index`);
    // The room's lobby deals one category (TRIVIA_CATS in RoomTrivia.js).
    if (TRIVIA_CATS.indexOf(item.c) === -1) note(`trivia.${lang}[${i}]: category "${item.c}" is not one of ${TRIVIA_CATS.join(', ')}`);
  });
  const dup = list.map(x => x.q).filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) note(`trivia.${lang}: duplicate questions ${JSON.stringify(dup)}`);
  // A category under a full game (20) is topped up from the rest: fine now and
  // then, but a category the lobby offers should mostly deal itself.
  const byCat = {};
  list.forEach(item => { byCat[item.c] = (byCat[item.c] || 0) + 1; });
  TRIVIA_CATS.forEach(c => { if ((byCat[c] || 0) < 40) note(`trivia.${lang}: only ${byCat[c] || 0} questions in "${c}" (40 or more)`); });
  console.log(`trivia.${lang}: ${list.length} questions (${TRIVIA_CATS.map(c => c + ' ' + (byCat[c] || 0)).join(', ')})`);
}

/* --------------------------------------------------- قبل ولا بعد (timeline) */
// A card missing a language would deal blank to that table, and an event
// listed twice could be dealt twice in one game. Two cards may share a year:
// timelineFits (RoomGames.js) takes a card beside one of its own year on
// either side (the review of 1 Oct 2026).
const TL = load(srcPath('TimelineEvents.js'), 'TIMELINE_EVENTS');
{
  const seen = {};
  TL.forEach((e, i) => {
    if (typeof e.y !== 'number' || !Number.isInteger(e.y)) note(`timeline[${i}]: no year`);
    if (!e.ar || !String(e.ar).trim()) note(`timeline[${i}] (${e.y}): no Arabic`);
    if (!e.en || !String(e.en).trim()) note(`timeline[${i}] (${e.y}): no English`);
    for (const k of ['ar:' + String(e.ar || '').trim(), 'en:' + String(e.en || '').toLowerCase().trim()]) {
      if (seen[k]) note(`timeline: "${k}" is listed twice (${seen[k]} and ${e.y})`);
      seen[k] = e.y;
    }
  });
  const span = TL.map(e => e.y);
  console.log(`timeline: ${TL.length} events, ${Math.min(...span)}-${Math.max(...span)}`);
}

/* ------------------------------------------------------ دوري المعرفة board */
// Each category has every level, each level enough questions for a few games,
// every item is [question ar, answer ar, question en, answer en], no question
// is asked twice, and no answer gives itself away inside its question.
{
  const BOARD = load(srcPath('JS_TriviaBoardBank.html'), 'TRIVIA_BOARD_BANK');
  const fold = (s) => String(s || '').toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/^the\s+/, '').replace(/[^a-z0-9\u0621-\u064A]/g, '');
  const ids = {};
  const asked = { ar: {}, en: {} };
  let total = 0;
  BOARD.forEach((cat) => {
    if (!cat.id || ids[cat.id]) note(`board: category id "${cat.id}" missing or repeated`);
    ids[cat.id] = true;
    if (!cat.ar || !cat.en) note(`board.${cat.id}: needs an Arabic and an English name`);
    [100, 200, 300, 400, 500].forEach((level) => {
      const list = (cat.levels || {})[level] || [];
      if (list.length < 5) note(`board.${cat.id}.${level}: ${list.length} questions, wants 5+`);
      list.forEach((item, i) => {
        const tag = `board.${cat.id}.${level}[${i}]`;
        total++;
        if (!Array.isArray(item) || item.length !== 4 || item.some(s => typeof s !== 'string' || !s.trim())) {
          note(`${tag}: must be [question ar, answer ar, question en, answer en]`);
          return;
        }
        [['ar', 0], ['en', 2]].forEach(([lang, k]) => {
          const question = fold(item[k]);
          const answer = fold(item[k + 1]);
          if (asked[lang][question]) note(`${tag}: same ${lang} question as ${asked[lang][question]}`);
          else asked[lang][question] = tag;
          if (answer.length >= 4 && question.indexOf(answer) !== -1) note(`${tag}: the ${lang} answer is inside the question`);
        });
      });
    });
  });
  if (BOARD.length < 5) note(`board: ${BOARD.length} categories, a round needs 5`);
  console.log(`trivia board: ${BOARD.length} categories, ${total} questions`);
}

/* ------------------------------------------- Pass-the-phone deduction games */
const G = ROOT;

// The Chameleon's board is a 4×4 grid: exactly 16 words, and a repeat would
// make the chameleon's final guess ambiguous. The two languages are listed in
// the same order, which is what lets a category pick survive a language switch.
const CHAM = load(srcPath('ChameleonWords.js'), 'CHAMELEON_DB');
for (const [lang, cats] of Object.entries(CHAM)) {
  cats.forEach((c, i) => {
    if (c.words.length !== 16) note(`chameleon.${lang}[${i}] ${c.category}: ${c.words.length} words, the grid needs 16`);
    const dup = c.words.filter((w, k, a) => a.indexOf(w) !== k);
    if (dup.length) note(`chameleon.${lang}[${i}] ${c.category}: duplicates ${JSON.stringify(dup)}`);
  });
  console.log(`chameleon.${lang}: ${cats.length} categories`);
}
if (CHAM.ar.length !== CHAM.en.length) note(`chameleon: ${CHAM.ar.length} ar categories vs ${CHAM.en.length} en`);
// إيه اللي يجمعهم؟ offers six of these side by side as an icon and a name, so in one language
// no two categories share either (the review of 1 Oct 2026: two "Sports", two 🌳).
{
  const head = load(srcPath('SoloShared.js'), 'soloCategory');
  for (const [lang, cats] of Object.entries(CHAM)) {
    const heads = cats.map(c => head(c.category));
    const twice = (key) => [...new Set(heads.map(key).filter((v, i, a) => !v || a.indexOf(v) !== i))];
    const icons = twice(h => h.icon), names = twice(h => h.name.toLowerCase());
    if (icons.length) note(`chameleon.${lang}: the same icon on two categories (or none) ${JSON.stringify(icons)}`);
    if (names.length) note(`chameleon.${lang}: two categories with the same name ${JSON.stringify(names)}`);
  }
}

// The spy's guess is matched on the location's name, so names must be unique.
const SPY = load(srcPath('SpyfallPlaces.js'), 'SPYFALL_DB');
for (const [lang, locs] of Object.entries(SPY)) {
  const names = locs.map(l => l.location);
  const dup = names.filter((w, k, a) => a.indexOf(w) !== k);
  if (dup.length) note(`spyfall.${lang}: duplicate locations ${JSON.stringify(dup)}`);
  locs.forEach(l => { if (!l.roles || l.roles.length < 4) note(`spyfall.${lang} ${l.location}: too few roles`); });
  console.log(`spyfall.${lang}: ${locs.length} locations`);
}

// A repeated card goes into the deck twice.
const TU = load(srcPath('JS_TimesUp.html'), 'TIMESUP_DB');
for (const [lang, list] of Object.entries(TU)) {
  const dup = list.filter((w, k, a) => a.indexOf(w) !== k);
  if (dup.length) note(`timesup.${lang}: duplicates ${JSON.stringify([...new Set(dup)])}`);
  console.log(`timesup.${lang}: ${list.length} cards`);
}

/* ------------------------------------------------ single-device word games */
// The same spelling rules the games compare with (normaliseClue in RoomGames.js):
// alef forms, taa marbuta, harakat, ؤ/ئ, and a leading "ال" or "the", so a bank
// cannot hold a word twice in two spellings the game would call one answer.
const fold = (t) => {
  let out = String(t).toLowerCase().replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/[ىی]/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').trim();
  if (out.indexOf('the ') === 0) out = out.slice(4);
  for (let i = 0; i < 2 && out.length > 3 && out.indexOf('ال') === 0; i++) out = out.slice(2);
  return out;
};
const repeats = (list, key = fold) => [...new Set(list.map(key).filter((v, i, a) => a.indexOf(v) !== i))];

// Wordle only works if every word is exactly its length and typeable on the
// keypad (hamza-on-alef is folded to plain alef when a word is dealt).
const WORD = load(srcPath('WordleWords.js'), 'WORDLE_DB');
for (const [lang, byLen] of Object.entries(WORD)) {
  for (const [len, list] of Object.entries(byLen)) {
    const bad = list.filter(w => [...w].length !== Number(len)
      || (lang === 'en' ? !/^[A-Za-z]+$/.test(w) : !/^[\u0621-\u064A]+$/.test(w)));
    if (bad.length) note(`wordle.${lang}.${len}: wrong length or letters ${JSON.stringify(bad)}`);
    const dup = repeats(list, w => fold(w).replace(/[أإآ]/g, 'ا'));
    if (dup.length) note(`wordle.${lang}.${len}: duplicates ${JSON.stringify(dup)}`);
  }
  console.log(`wordle.${lang}: ${Object.values(byLen).reduce((n, l) => n + l.length, 0)} words`);
}
// The daily's skip list names words the 5-letter list has (a typo there would skip nothing),
// and leaves the daily a list long enough to go round for months.
{
  const SKIP = load(srcPath('WordleWords.js'), 'WORDLE_DAILY_SKIP');
  const safe = load(srcPath('WordleWords.js'), 'wordleDailySafe');
  for (const [lang, list] of Object.entries(SKIP)) {
    const five = (WORD[lang] || {})[5] || [];
    const missing = list.filter(w => five.indexOf(w) === -1);
    if (missing.length) note(`wordle daily skip ${lang}: not in the 5-letter list ${JSON.stringify(missing)}`);
    const left = five.filter(w => safe(w, lang)).length;
    if (left < 200) note(`wordle daily ${lang}: only ${left} words left for the daily`);
    console.log(`wordle daily ${lang}: ${left} of ${five.length} words`);
  }
}

// Describe It: three forbidden words, and no card twice.
const DESC = load(srcPath('JS_DescribeIt.html'), 'DESCRIBE_DB');
for (const [lang, cards] of Object.entries(DESC)) {
  cards.forEach(c => {
    if (!Array.isArray(c.forbidden) || c.forbidden.length !== 3) note(`describe.${lang} "${c.word}": ${c.forbidden && c.forbidden.length} forbidden words, expected 3`);
  });
  const dup = repeats(cards.map(c => c.word));
  if (dup.length) note(`describe.${lang}: duplicate cards ${JSON.stringify(dup)}`);
  console.log(`describe.${lang}: ${cards.length} cards`);
}

// Charades: a card appears in one category only.
const CHAR = load(srcPath('JS_Charades.html'), 'CHARADES_DB');
for (const [lang, cats] of Object.entries(CHAR)) {
  const all = Object.values(cats).flat();
  const dup = repeats(all);
  if (dup.length) note(`charades.${lang}: in more than one place ${JSON.stringify(dup)}`);
  console.log(`charades.${lang}: ${all.length} cards in ${Object.keys(cats).length} categories`);
}

for (const name of ['JO_WORDS_AR', 'JO_WORDS_EN']) {
  const list = load(srcPath('JS_JustOne.html'), name);
  const dup = repeats(list);
  if (dup.length) note(`${name}: duplicates ${JSON.stringify(dup)}`);
  console.log(`${name}: ${list.length} words`);
}

// Trivia: four different choices. Written as data, "10" and "-10" read the same.
for (const [lang, list] of Object.entries(TRIV)) {
  list.forEach((item, i) => {
    if (Array.isArray(item.choices) && repeats(item.choices, c => fold(c).replace(/[^\p{L}\p{N}]/gu, '')).length) {
      note(`trivia.${lang}[${i}]: two choices read the same`);
    }
  });
}

// الجاسوس: every category has words, and none twice.
const SPY_WORDS = load(srcPath('SpyWords.js'), 'SPY_WORDS');
for (const [cat, words] of Object.entries(SPY_WORDS)) {
  if (!Array.isArray(words) || words.length < 10) note(`spy "${cat}": ${words && words.length} words, wants 10+`);
  const dup = repeats(words || []);
  if (dup.length) note(`spy "${cat}": duplicates ${JSON.stringify(dup)}`);
}
console.log(`spy: ${Object.keys(SPY_WORDS).length} categories, ${Object.values(SPY_WORDS).reduce((n, w) => n + w.length, 0)} words`);

// The English game (SPY_WORDS_EN): the same checks, a category for every
// Arabic one, no name shared with an Arabic category (the rooms server finds a
// category in either list by its name), and no Arabic letters in it.
const SPY_WORDS_EN = load(srcPath('SpyWords.js'), 'SPY_WORDS_EN');
for (const [cat, words] of Object.entries(SPY_WORDS_EN)) {
  if (!Array.isArray(words) || words.length < 10) note(`spy.en "${cat}": ${words && words.length} words, wants 10+`);
  const dup = repeats(words || []);
  if (dup.length) note(`spy.en "${cat}": duplicates ${JSON.stringify(dup)}`);
  if (SPY_WORDS[cat]) note(`spy.en "${cat}": the same name as an Arabic category`);
  const arabic = (words || []).filter(w => /[؀-ۿ]/.test(w));
  if (arabic.length || /[؀-ۿ]/.test(cat)) note(`spy.en "${cat}": Arabic in the English list ${JSON.stringify(arabic)}`);
}
if (Object.keys(SPY_WORDS_EN).length !== Object.keys(SPY_WORDS).filter(k => k.indexOf('🔒') === -1).length) {
  note(`spy.en: ${Object.keys(SPY_WORDS_EN).length} categories vs ${Object.keys(SPY_WORDS).length} Arabic`);
}
console.log(`spy.en: ${Object.keys(SPY_WORDS_EN).length} categories, ${Object.values(SPY_WORDS_EN).reduce((n, w) => n + w.length, 0)} words`);

// المختلف: two different words a pair, no pair twice, in both languages.
for (const [name, pairs] of [['SPY_PAIRS', load(srcPath('SpyWords.js'), 'SPY_PAIRS')], ['SPY_PAIRS_EN', load(srcPath('SpyWords.js'), 'SPY_PAIRS_EN')]]) {
  pairs.forEach((p, i) => {
    if (!Array.isArray(p) || p.length !== 2 || !p[0] || !p[1] || fold(p[0]) === fold(p[1])) note(`${name}[${i}]: not two different words`);
  });
  const dup = repeats(pairs.map(p => [...p].map(fold).sort().join('|')));
  if (dup.length) note(`${name}: pairs twice ${JSON.stringify(dup)}`);
  console.log(`${name}: ${pairs.length} pairs`);
}

// القنبلة: a category is listed once, and there are enough to last an evening.
const BOMB = load(srcPath('BombPrompts.js'), 'BOMB_PROMPTS');
for (const [lang, list] of Object.entries(BOMB)) {
  const dup = repeats(list);
  if (dup.length) note(`bomb.${lang}: duplicates ${JSON.stringify(dup)}`);
  if (list.length < 60) note(`bomb.${lang}: ${list.length} categories, wants 60+`);
  if (list.some(x => !String(x || '').trim())) note(`bomb.${lang}: an empty category`);
  console.log(`bomb.${lang}: ${list.length} categories`);
}

// أتوبيس كومبليت: every category has an id and both names, none twice.
// Emoji riddles: emoji, an answer, a kind; no answer twice in a language.
const EMOJI = load(srcPath('EmojiRiddles.js'), 'EMOJI_RIDDLES');
for (const [lang, list] of Object.entries(EMOJI)) {
  list.forEach((r, i) => {
    if (!r.e || !r.a || !r.c) note(`emoji.${lang} #${i}: missing emoji, answer or kind ${JSON.stringify(r)}`);
    if (/[A-Za-z\u0600-\u06FF]/.test(r.e || '')) note(`emoji.${lang} "${r.a}": letters in the emoji`);
    if (r.alt && !Array.isArray(r.alt)) note(`emoji.${lang} "${r.a}": alt must be a list`);
  });
  const dup = repeats(list.map(r => r.a));
  if (dup.length) note(`emoji.${lang}: answers listed twice ${JSON.stringify(dup)}`);
  const dupE = repeats(list.map(r => r.e), e => e);
  if (dupE.length) note(`emoji.${lang}: the same emoji twice ${JSON.stringify(dupE)}`);
  console.log(`emoji.${lang}: ${list.length} riddles`);
}

// Proverbs: one blank, a word that isn't already written in the proverb, no proverb twice.
const PROV = load(srcPath('Proverbs.js'), 'PROVERBS');
for (const [lang, list] of Object.entries(PROV)) {
  list.forEach((r, i) => {
    if ((r.p || '').split('___').length !== 2) note(`proverbs.${lang} #${i}: needs exactly one ___ ${JSON.stringify(r.p)}`);
    if (!r.a) note(`proverbs.${lang} #${i}: no answer`);
    else if (fold(r.p || '').indexOf(fold(r.a)) !== -1) note(`proverbs.${lang} "${r.p}": the answer is written in the proverb`);
  });
  const dup = repeats(list.map(r => r.p));
  if (dup.length) note(`proverbs.${lang}: proverbs listed twice ${JSON.stringify(dup)}`);
  console.log(`proverbs.${lang}: ${list.length} proverbs`);
}

// The monkey's dictionaries: nothing empty, nothing twice once the letters are folded.
const MONKEY = load(srcPath('MonkeyWords.js'), 'MONKEY_LISTS');
const mfold = (t) => String(t).toLowerCase().replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/[^\p{L}\p{N}]/gu, '');
for (const [lang, lists] of Object.entries(MONKEY)) {
  for (const [kind, list] of Object.entries(lists)) {
    if (list.some(w => !mfold(w))) note(`monkey.${lang}.${kind}: an empty name`);
    const dup = repeats(list, mfold);
    if (dup.length) note(`monkey.${lang}.${kind}: names listed twice ${JSON.stringify(dup)}`);
    console.log(`monkey.${lang}.${kind}: ${list.length} names`);
  }
}

// أتوبيس كومبليت's dictionary: nothing empty, nothing twice in one list, and
// how many letters each category can answer (a gap is a note, not a failure:
// no country starts with ث).
{
  const src = ['Common.js', 'SpyWords.js', 'MonkeyWords.js', 'StopWords.js'].map(f => fs.readFileSync(srcPath(f), 'utf8')).join('\n;\n');
  const S = new Function(src + '; return { STOP_WORDS, stopDictFold, stopDictionary, stopLetterFold };')();
  for (const [lang, lists] of Object.entries(S.STOP_WORDS)) {
    for (const [kind, list] of Object.entries(lists)) {
      if (list.some(w => !S.stopDictFold(w))) note(`stop words.${lang}.${kind}: an empty word`);
      const dup = repeats(list, S.stopDictFold);
      if (dup.length) note(`stop words.${lang}.${kind}: listed twice ${JSON.stringify(dup)}`);
    }
  }
  const LETTERS = { ar: 'ا ب ت ث ج ح خ د ر ز س ش ص ض ط ع غ ف ق ك ل م ن ه و ي'.split(' '), en: 'ABCDEFGHIJKLMNOPRSTVW'.split('') };
  for (const lang of ['ar', 'en']) {
    const line = ['name', 'animal', 'plant', 'thing', 'country', 'city', 'food', 'brand', 'job', 'color'].map(cat => {
      const words = [...S.stopDictionary(lang, cat)];
      const gaps = LETTERS[lang].filter(L => !words.some(w => w.charAt(0) === S.stopLetterFold(L)));
      return `${cat} ${words.length}${gaps.length ? ' (no ' + gaps.join('') + ')' : ''}`;
    });
    console.log(`stop dictionary.${lang}: ${line.join(', ')}`);
  }
}

// Nonogram pictures: the right size, and solvable line by line (one solution, no guessing).
{
  // The pictures live in Nonogram.js (shared with the rooms server since سباق ألغاز, 26 Sep 2026).
  const src = fs.readFileSync(srcPath('SoloShared.js'), 'utf8') + fs.readFileSync(srcPath('Nonogram.js'), 'utf8');
  const N = new Function(src + '; return { NONO_PICTURES, nonoFromPicture, nonoClues, nonoSolvable };')();
  let count = 0;
  for (const [size, pics] of Object.entries(N.NONO_PICTURES)) {
    const n = Number(size);
    pics.forEach(p => {
      count++;
      if (!p.ar || !p.en || !p.e) note(`nonogram ${size}: a picture without its names or emoji`);
      if (p.rows.length !== n || p.rows.some(r => r.length !== n || /[^#.]/.test(r))) { note(`nonogram ${size} "${p.en}": not ${n}×${n} of # and .`); return; }
      const sol = N.nonoFromPicture(p);
      const cl = N.nonoClues(n, sol);
      if (!N.nonoSolvable(n, cl.rows, cl.cols)) note(`nonogram ${size} "${p.en}": can't be solved line by line (needs a guess)`);
    });
  }
  console.log(`nonogram: ${count} pictures`);
}

const STOP_CATS = load(srcPath('JS_Stop.html'), 'STOP_CATEGORIES');
{
  const ids = STOP_CATS.map(c => c.id);
  const dup = repeats(ids);
  if (dup.length) note(`stop: duplicate category ids ${JSON.stringify(dup)}`);
  STOP_CATS.forEach(c => { if (!c.id || !c.ar || !c.en) note(`stop: category ${JSON.stringify(c)} is missing a field`); });
  console.log(`stop: ${STOP_CATS.length} categories`);
}

/* -------------------------------------------------------- Chess openings */
{
  const chessSrc = fs.readFileSync(srcPath('Chess.js'), 'utf8');
  const CH = new Function(chessSrc + '; return { chessNew, chessPlay, chessPlacement, chessPos, chessLegalPos, chessSanPos, chessSqName, chessMFrom, chessMTo, chessMPromo, chessPromoLetter };')();

  function chFindSan(g, san) {
    const p = CH.chessPos(g);
    const legal = CH.chessLegalPos(p);
    const clean = san.replace(/[+#?!]/g, '').replace(/0-0-0/g, 'O-O-O').replace(/0-0/g, 'O-O');
    for (let i = 0; i < legal.length; i++) {
      const s = CH.chessSanPos(p, legal[i], legal).replace(/[+#?!]/g, '');
      if (s === clean) {
        return {
          from: CH.chessSqName(CH.chessMFrom(legal[i])),
          to: CH.chessSqName(CH.chessMTo(legal[i])),
          promo: CH.chessPromoLetter(CH.chessMPromo(legal[i]))
        };
      }
    }
    return null;
  }

  const OPENINGS = load(srcPath('JS_ChessOpenings.html'), 'CH_OPENINGS');
  if (!Array.isArray(OPENINGS) || OPENINGS.length < 120 || OPENINGS.length > 160) {
    note(`chess openings: expected 120-160 entries, got ${OPENINGS ? OPENINGS.length : 0}`);
  }
  const seen = new Map();
  (OPENINGS || []).forEach((op, i) => {
    if (!op.ar || !op.ar.trim()) note(`chess opening [${i}]: missing Arabic name`);
    if (!op.en || !op.en.trim()) note(`chess opening [${i}]: missing English name`);
    if (!op.moves || !op.moves.trim()) {
      note(`chess opening [${i}] ("${op.en}"): missing moves`);
      return;
    }
    const g = CH.chessNew();
    const moves = op.moves.trim().split(/\s+/);
    for (const m of moves) {
      const mv = chFindSan(g, m);
      if (!mv) {
        note(`chess opening [${i}] ("${op.en}"): illegal move "${m}"`);
        return;
      }
      CH.chessPlay(g, mv);
    }
    const placement = CH.chessPlacement(g.board);
    if (seen.has(placement)) {
      note(`chess openings: duplicate final position between "${seen.get(placement)}" and "${op.en}"`);
    } else {
      seen.set(placement, op.en);
    }
  });
  console.log(`chess openings: ${OPENINGS ? OPENINGS.length : 0} openings`);
}

/* -------------------------------------------------------- Chess puzzles */
// ChessPuzzles.js, made by tools/make-chess-puzzles.mjs: every position real, every
// move legal in order, a mate that mates, no id or position twice, enough of each level.
{
  const CH = new Function(fs.readFileSync(srcPath('Chess.js'), 'utf8') + '; return { chessFromFen, chessFen, chessPlay, chessStatus };')();
  const PUZ = load(srcPath('ChessPuzzles.js'), 'CHESS_PUZZLES');
  const ids = new Set();
  const spots = new Set();
  const levels = { 1: 0, 2: 0, 3: 0 };
  if (!Array.isArray(PUZ) || !PUZ.length) note('chess puzzles: CHESS_PUZZLES is empty');
  (PUZ || []).forEach((p, i) => {
    const tag = `chess puzzle [${i}] (id ${p && p.id})`;
    if (!p || p.id === undefined || p.id === null) { note(`${tag}: no id`); return; }
    if (ids.has(p.id)) note(`${tag}: id used twice`);
    ids.add(p.id);
    if (!(p.level in levels)) note(`${tag}: level ${p.level} is not 1, 2 or 3`);
    else levels[p.level]++;
    if (p.theme !== 'mate' && p.theme !== 'material') note(`${tag}: theme "${p.theme}"`);
    // The motif (the review of 1 Oct 2026): the first hint and the word said once it is solved.
    if (['mate', 'fork', 'pin', 'skewer', 'discovered', 'promotion', 'hanging', 'sacrifice', 'material'].indexOf(p.motif) === -1) note(`${tag}: motif "${p.motif}"`);
    else if ((p.motif === 'mate') !== (p.theme === 'mate')) note(`${tag}: motif "${p.motif}" with theme "${p.theme}"`);
    if (typeof p.rating !== 'number' || !(p.rating > 0)) note(`${tag}: no rating`);
    if (!Array.isArray(p.moves) || !p.moves.length || p.moves.length % 2 !== 1) { note(`${tag}: the moves must be player, reply, …, player`); return; }
    let g;
    try { g = CH.chessFromFen(p.fen); } catch (e) { g = null; }
    if (!g || CH.chessFen(g) !== p.fen) { note(`${tag}: FEN "${p.fen}" is not valid`); return; }
    if (CH.chessStatus(g).over) { note(`${tag}: the game is already over`); return; }
    const spot = p.fen.split(' ').slice(0, 4).join(' ');
    if (spots.has(spot)) note(`${tag}: the same position as another puzzle`);
    spots.add(spot);
    let last = null;
    for (let k = 0; k < p.moves.length; k++) {
      const m = String(p.moves[k]);
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m)) { note(`${tag}: move ${k + 1} "${m}" is not a move`); return; }
      last = CH.chessPlay(g, { from: m.slice(0, 2), to: m.slice(2, 4), promo: m.slice(4, 5) });
      if (!last) { note(`${tag}: move ${k + 1} "${m}" is not legal`); return; }
      if (last.status.over && k < p.moves.length - 1) { note(`${tag}: the game ends at move ${k + 1}, before the line does`); return; }
    }
    if (p.theme === 'mate') {
      if (!(last.status.over && last.status.reason === 'mate')) note(`${tag}: a mate puzzle whose last move doesn't mate`);
      if (p.mateIn !== (p.moves.length + 1) / 2) note(`${tag}: mateIn ${p.mateIn}, but the line mates in ${(p.moves.length + 1) / 2}`);
    }
  });
  [1, 2, 3].forEach(L => { if (levels[L] < 300) note(`chess puzzles: level ${L} has ${levels[L]}, fewer than 300`); });
  console.log(`chess puzzles: ${(PUZ || []).length} (level 1 ${levels[1]}, level 2 ${levels[2]}, level 3 ${levels[3]})`);
}

/* ------------------------------------------------ the games (Games.js) */
// GAME_LIST is the one list of games: the home's catalog, a room's list, the server's room
// games, the ids /count and /report take (the audit of 28 Sep 2026), «التالي لوحده», the
// program's rounds and الشلة's titles are all built from it (2 Oct 2026).
{
  const gamesJs = fs.readFileSync(srcPath('Games.js'), 'utf8');
  const G = new Function(gamesJs + '\nreturn { GAME_LIST, ROOM_LIST_ORDER, APP_REPORT_IDS, ROOM_GAME_IDS };')();
  const block = (/const GAME_LIST = \[([\s\S]*?)\r?\n\];/.exec(gamesJs) || [])[1] || '';
  const catIds = G.GAME_LIST.map(g => g.id);
  const reportIds = G.APP_REPORT_IDS;
  const titles = load(srcPath('Crew.js'), 'CREW_TITLES');
  if (!catIds.length) note('Games.js: GAME_LIST is empty');
  // A merge once left two half-lines side by side: an id listed twice is a bad merge.
  catIds.filter((id, k) => catIds.indexOf(id) !== k).forEach(id => note(`Games.js: '${id}' is in GAME_LIST twice`));
  G.ROOM_GAME_IDS.filter((id, k) => G.ROOM_GAME_IDS.indexOf(id) !== k).forEach(id => note(`Games.js: the room game '${id}' twice`));
  G.GAME_LIST.forEach(g => {
    ['icon', 'title', 'accent', 'group'].forEach(k => { if (!g[k]) note(`Games.js: '${g.id}' has no ${k}`); });
    if (g.room && !(g.room.min >= 1)) note(`Games.js: '${g.id}' is a room game with no room.min`);
    if (g.room && !(g.modes || []).includes('room')) note(`Games.js: '${g.id}' has room but no 'room' in modes`);
    if (g.crew && titles.indexOf(g.crew) === -1) note(`Games.js: '${g.id}' counts toward '${g.crew}', not a title in CREW_TITLES`);
    if (g.room && !g.crew) note(`Games.js: the room game '${g.id}' has no crew title (CREW_TITLES)`);
    if (!g.open && !g.setup && !g.room) note(`Games.js: '${g.id}' has no open, setup or room: its card does nothing`);
  });
  G.ROOM_LIST_ORDER.filter(id => G.ROOM_GAME_IDS.indexOf(id) === -1).forEach(id => note(`Games.js: ROOM_LIST_ORDER names '${id}', not a room game`));
  // Every «في غلطة؟» button names an id the server takes.
  srcFiles(/^JS_.*\.html$/).forEach(f => {
    const src = fs.readFileSync(srcPath(f), 'utf8');
    (src.match(/reportBtnHtml\('([^']+)'/g) || []).forEach(m => {
      const id = /'([^']+)'/.exec(m)[1];
      if (reportIds.indexOf(id) === -1) note(`${f}: reportBtnHtml('${id}') is not in APP_REPORT_IDS (Games.js)`);
    });
  });
  console.log(`games: ${catIds.length} (room games ${G.ROOM_GAME_IDS.length})`);
  const cat = fs.readFileSync(srcPath('JS_Catalog.html'), 'utf8');
  // «الليلة دي؟» ranks games by TONIGHT_ORDER, and a game missing from it always came last
  // (the review of 1 Oct 2026: every game from 27 Sep on). Every game with its own card has a place.
  const order = ((/const TONIGHT_ORDER = \[([\s\S]*?)\];/.exec(cat) || [])[1] || '').match(/'[^']+'/g) || [];
  const tonight = order.map(x => x.slice(1, -1));
  const ownCards = (block.match(/^\s*\{\s*id:\s*'[^']+'.*$/mg) || [])
    .filter(l => /players:/.test(l) && !/group:\s*'tools'/.test(l) && !/hub:\s*'/.test(l))
    .map(l => /'([^']+)'/.exec(l)[1]);
  if (!tonight.length) note('JS_Catalog.html: could not read TONIGHT_ORDER');
  ownCards.filter(id => tonight.indexOf(id) === -1).forEach(id => note(`JS_Catalog.html: '${id}' has no place in TONIGHT_ORDER («الليلة دي؟»)`));
  tonight.filter(id => catIds.indexOf(id) === -1).forEach(id => note(`JS_Catalog.html: TONIGHT_ORDER names '${id}', not in GAME_CATALOG`));
  tonight.filter((id, k) => tonight.indexOf(id) !== k).forEach(id => note(`JS_Catalog.html: '${id}' is in TONIGHT_ORDER twice`));
}

/* ------------------------------------------ ارسم اللي بتسمعه: the pictures the app makes */
// Hear.js makes every picture from a seed: each thing at each level, and shapes, must stay inside the
// page, have its name in both languages, and a trace of its own lines must score full marks.
{
  const H = load(srcPath('Hear.js'), '{ hearPicture, hearOutlines, hearScore, HEAR_THING_IDS, HEAR_THING_NAMES }');
  let n = 0;
  H.HEAR_THING_IDS.forEach(id => {
    const nm = H.HEAR_THING_NAMES[id];
    if (!nm || !nm.ar || !nm.en) note(`Hear.js: '${id}' has no name in both languages`);
  });
  ['shapes', 'things'].forEach(kind => ['easy', 'mid', 'hard'].forEach(level => {
    for (let i = 0; i < 60; i++) {
      const pic = H.hearPicture(7 + i * 104729, kind, level, kind === 'things' ? H.HEAR_THING_IDS[i % H.HEAR_THING_IDS.length] : '');
      n++;
      const lines = H.hearOutlines(pic.s);
      if (!lines.length) { note(`Hear.js: an empty ${kind}/${level} picture (seed ${7 + i * 104729})`); continue; }
      if (lines.some(l => l.some(([x, y]) => !(x >= -0.5 && x <= 100.5 && y >= -0.5 && y <= 100.5)))) note(`Hear.js: a ${kind}/${level} ${pic.thing || ''} picture leaves the page (seed ${7 + i * 104729})`);
      const trace = lines.map(l => ({ c: '#111', w: 5, p: l.flatMap(([x, y]) => [Math.round(x * 2.55), Math.round(y * 2.55)]) }));
      if (H.hearScore(pic.s, trace) < 90) note(`Hear.js: its own lines score under 90% on a ${kind}/${level} ${pic.thing || ''} picture`);
    }
  }));
  console.log(`hear: ${H.HEAR_THING_IDS.length} things, ${n} pictures checked`);
}

/* ------------------------------------------ السلم والتعبان: the sneak's crawl */
// The owner's review (29 Sep 2026): the snake that catches a sneak crawls over the board to him and
// back, and must never tie itself in a knot. Over 150 maps, every square beside a ladder's foot and the
// snake nearest to it, the way snkCrawlPlan picks keeps the body from crossing or overlapping itself at
// every moment of the crawl, and on the board. (The straight way it replaced tangled in about 4 of 10.)
{
  const strip = (f) => fs.readFileSync(srcPath(f), 'utf8').replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
  const stub = 'const window = { addEventListener() {} }, document = { addEventListener() {} }; const requestAnimationFrame = () => 0, cancelAnimationFrame = () => {};\n';
  const K = new Function(stub + fs.readFileSync(srcPath('Snakes.js'), 'utf8') + '\n' + strip('JS_Snakes.html') +
    '\n; return { snakesGenMap, snakesCellXY, snakesNearestSnake, snkWay, snkSample, snkCrawlPlan };')();
  let cases = 0, tangled = 0, turned = 0, worst = '';
  for (let seed = 1; seed <= 150; seed++) {
    const m = K.snakesGenMap(seed * 7919);
    const rnd = (() => { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
    const shapes = {};
    m.snakes.forEach(sn => { shapes[sn.h] = K.snkSample(K.snkWay(sn, rnd)).pts; });
    const busy = new Set();
    m.snakes.forEach(sn => { busy.add(sn.h); busy.add(sn.t); });
    m.ladders.forEach(l => { busy.add(l.f); busy.add(l.t); });
    m.ladders.forEach(l => {
      [l.f - 1, l.f + 1].forEach(walk => {
        if (walk < 1 || walk > 99 || busy.has(walk) || m.snakes.some(sn => Math.abs(sn.h - walk) === 1)) return;
        const sn = K.snakesNearestSnake(m, walk);
        const a = K.snakesCellXY(l.f), b = K.snakesCellXY(l.t);
        const at = { x: a.x + (b.x - a.x) * 0.3, y: a.y + 2 + (b.y - a.y) * 0.3 };
        const plan = K.snkCrawlPlan(shapes[sn.h], at, 17.5);
        cases++;
        const pts = shapes[sn.h], H = pts[0], B = pts[5], fx = H.x - B.x, fy = H.y - B.y;
        if (fx * (at.x - H.x) + fy * (at.y - H.y) < 0) turned++;
        if (plan.knots) { tangled++; worst = worst || `map ${seed * 7919}, ${walk} beside ${l.f}, snake ${sn.h}: ${plan.knots}`; }
      });
    });
  }
  if (tangled) note(`snakes: the sneak's crawl tangles in ${tangled} of ${cases} cases (first: ${worst})`);
  console.log(`snakes: the sneak's crawl clean in ${cases - tangled} of ${cases} cases (${turned} with him behind the snake's head)`);
}

// المهمة السرية (Missions.js): every mission tagged with real places and a real company, written
// to be dealt («خلّي {target} …» / «Get {target} …», the name once, quoted whole by the ticker),
// no id or wording twice (Arabic spelling folded), and at least MISSION_MIN_POOL to deal from in
// every place × company the host can pick (the owner: plenty for each, 40 or more).
{
  const MS = new Function(fs.readFileSync(srcPath('Missions.js'), 'utf8') +
    '; return { MISSIONS, MISSION_PLACES, MISSION_COMPANIES, MISSION_MIN_POOL, missionPool, missionQuote };')();
  const fold = (s) => String(s).toLowerCase().replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[«»"'.,!?؟،()]/g, '').replace(/\s+/g, ' ').trim();
  const ids = {}, ar = {}, en = {};
  MS.MISSIONS.forEach((m, i) => {
    const tag = `missions[${i}]${m && m[0] ? ' ' + m[0] : ''}`;
    if (!Array.isArray(m) || m.length !== 6) { note(`${tag}: not [id, places, company, ar, en, arF]`); return; }
    const [id, places, co, a, e, af] = m;
    // The Arabic to a girl: the same opening, the name once, and really another wording.
    if (typeof af !== 'string' || !af.startsWith('خلّي {target} ') || af.split('{target}').length !== 2 || /[{}]/.test(af.replace('{target}', ''))) note(`${tag}: the girl's Arabic starts «خلّي {target} », the name once`);
    else if (af === a) note(`${tag}: the girl's Arabic is the same as the boy's`);
    else if (MS.missionQuote(id, 'ar', 'منى', 'سارة', true).indexOf('منى: «خلّي سارة ') !== 0) note(`${tag}: the ticker can't quote the girl's wording`);
    if (!/^[a-z]\d\d$/.test(id)) note(`${tag}: an id is a letter and two digits`);
    if (ids[id]) note(`${tag}: the id ${id} twice`); ids[id] = true;
    if (places !== '*' && !/^[hco]+$/.test(places)) note(`${tag}: places "${places}" (* or the letters h, c, o)`);
    if (places !== '*' && new Set(places).size !== places.length) note(`${tag}: a place twice in "${places}"`);
    if (co !== 'a' && co !== 'f') note(`${tag}: company "${co}" (a: everyone, f: friends only)`);
    if (!a.startsWith('خلّي {target} ')) note(`${tag}: the Arabic starts «خلّي {target} »`);
    if (!e.startsWith('Get {target} ')) note(`${tag}: the English starts "Get {target} "`);
    if (a.split('{target}').length !== 2 || e.split('{target}').length !== 2) note(`${tag}: {target} once in each language`);
    if (/[{}]/.test(a.replace('{target}', '')) || /[{}]/.test(e.replace('{target}', ''))) note(`${tag}: a stray brace`);
    if (MS.missionQuote(id, 'ar', 'منى', 'حسن').indexOf('منى: «خلّي حسن ') !== 0 || MS.missionQuote(id, 'en', 'Mona', 'Hassan').indexOf('Mona: “Get Hassan ') !== 0) note(`${tag}: the ticker can't quote it`);
    const fa = fold(a), fe = fold(e);
    if (ar[fa]) note(`${tag}: the same Arabic as ${ar[fa]}`); ar[fa] = id;
    if (en[fe]) note(`${tag}: the same English as ${en[fe]}`); en[fe] = id;
  });
  const sizes = [];
  MS.MISSION_PLACES.forEach((pl) => MS.MISSION_COMPANIES.forEach((co) => {
    const n = MS.missionPool(pl, co).length;
    sizes.push(`${pl}×${co} ${n}`);
    if (n < MS.MISSION_MIN_POOL) note(`missions: only ${n} for ${pl} × ${co} (at least ${MS.MISSION_MIN_POOL})`);
  }));
  // «في أي حتة» deals the talking missions only, so a place's own must not be talking ones by mistake:
  // every place has missions of its own too.
  ['h', 'c', 'o'].forEach((l) => {
    const own = MS.MISSIONS.filter((m) => m[1] !== '*' && m[1].indexOf(l) !== -1).length;
    if (own < 10) note(`missions: only ${own} of the place ${l}'s own`);
  });
  console.log(`missions: ${MS.MISSIONS.length} (${sizes.join(', ')})`);
}

/* ------------------------------------------------------------- الخزنة */
// Every safe and notebook is generated (Vault.js): the drawings are distinct, and over many seeds
// every notebook is sound (codes distinct, read backwards a different code, the light rows never
// press a colour itself) and every safe has one answer the notebook gives (one column of symbols).
{
  const V = new Function(fs.readFileSync(srcPath('Vault.js'), 'utf8') + '; return { VAULT_SYMBOLS, VAULT_SYMBOL_IDS, VAULT_SHAPES, VAULT_SHAPE_IDS, VAULT_LOCKS, VAULT_LIGHT_COLORS, VAULT_COLS, VAULT_COL_LEN, vaultManual, vaultMakeSafe, vaultLevel, vaultSymbolCol, vaultWireAnswer, vaultUnits, vaultPageData };')();
  const paths = V.VAULT_SYMBOL_IDS.map((id) => V.VAULT_SYMBOLS[id]);
  if (new Set(paths).size !== paths.length) note('vault: two symbols drawn the same');
  if (V.VAULT_SYMBOL_IDS.length < V.VAULT_COLS * 3) note(`vault: ${V.VAULT_SYMBOL_IDS.length} symbols is too few for ${V.VAULT_COLS} columns`);
  if (V.VAULT_SHAPE_IDS.length < 9 || V.VAULT_SHAPE_IDS.some((s) => !V.VAULT_SHAPES[s].ar || !V.VAULT_SHAPES[s].en || !V.VAULT_SHAPES[s].d)) note('vault: a dial shape without its names or drawing');
  let safes = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const m = V.vaultManual(seed * 7907);
    const codes = V.VAULT_SHAPE_IDS.map((s) => m.dial.codes[s].join(''));
    if (new Set(codes).size !== codes.length || V.VAULT_SHAPE_IDS.some((s) => { const c = m.dial.codes[s]; return c[0] === c[2] || codes.indexOf(c.slice().reverse().join('')) !== -1; })) note(`vault: notebook ${seed}: dial codes not distinct both ways`);
    if (m.lights.some((row) => V.VAULT_LIGHT_COLORS.some((c) => row[c] === c))) note(`vault: notebook ${seed}: a light presses its own colour`);
    if (m.symbols.some((col) => new Set(col).size !== V.VAULT_COL_LEN)) note(`vault: notebook ${seed}: a column with a symbol twice`);
    [3, 4, 5, 6].forEach((n) => { if (!m.wires[n] || m.wires[n].length !== 4 || m.wires[n][3].if !== null) note(`vault: notebook ${seed}: ${n} wires have no three rules and an otherwise`); });
    for (let lv = 1; lv <= 7; lv++) {
      const L = V.vaultLevel(lv, 'one');
      const safe = V.vaultMakeSafe(seed * 31 + lv, m, V.VAULT_LOCKS, L);
      safes++;
      safe.locks.forEach((l) => {
        if (l.k === 'wires' && !(l.sol >= 0 && l.sol < l.look.wires.length && l.sol === V.vaultWireAnswer(m.wires, l.look.wires))) note(`vault: safe ${seed}/${lv}: no wire to cut`);
        if (l.k === 'symbols' && (V.vaultSymbolCol(m.symbols, l.look.syms) < 0 || l.sol.length !== L.syms)) note(`vault: safe ${seed}/${lv}: the symbols are not in exactly one column`);
        if (l.k === 'dial' && !(l.sol && l.sol.length === 3)) note(`vault: safe ${seed}/${lv}: the dial has no code`);
      });
    }
    // Every page a reader can be dealt reads back from the notebook.
    V.vaultUnits(V.VAULT_LOCKS, 8).forEach((u) => { const p = V.vaultPageData(m, u); if (!p || p.k !== u.split('.')[0]) note(`vault: page ${u} reads nothing`); });
  }
  console.log(`vault: ${V.VAULT_SYMBOL_IDS.length} symbols, ${V.VAULT_SHAPE_IDS.length} shapes, 300 notebooks and ${safes} safes sound`);
}

/* ------------------------------------------------------ دندنها: the songs */
// Songs.js (1 Oct 2026), offline: every field there, a pin to one source - { src: 'itunes' | 'deezer', id: a
// whole number } - and, if it has one, a second pin (`also`) to the other source; one of the three eras; no
// song twice (by any of its pins, or by a name folded the way a guess is - a title, one of its alternatives or
// its English title must name one song only), and enough in every era for the four choices to come from it.
// `npm run check:songs` (check-songs.mjs) asks Apple and Deezer that every pin still has its preview.
{
  const SONGS = load(srcPath('Songs.js'), 'HUM_SONGS');
  const ERAS = ['classic', 'pop', 'new'];
  const owner = {};
  const ids = {};
  const byEra = {};
  SONGS.forEach((x, i) => {
    const tag = `Songs.js[${i}] ${x && x.t}`;
    const SOURCES = ['itunes', 'deezer'];
    const pinOk = (p) => !!p && SOURCES.indexOf(p.src) !== -1 && Number.isInteger(p.id) && p.id > 0;
    if (!pinOk(x)) note(`${tag}: no pin (src 'itunes' or 'deezer', and a whole-number id)`);
    if (x && x.also !== undefined && (!pinOk(x.also) || x.also.src === x.src)) note(`${tag}: its second pin must be the other source`);
    ['t', 's', 'en', 'se'].forEach(k => { if (!x || typeof x[k] !== 'string' || !x[k].trim()) note(`${tag}: no ${k}`); });
    if (!x || !Array.isArray(x.alt)) note(`${tag}: alt must be a list`);
    if (!x || ERAS.indexOf(x.era) === -1) note(`${tag}: era must be one of ${ERAS.join(', ')}`);
    if (!x) return;
    [x].concat(x.also ? [x.also] : []).forEach(p => {
      const key = p.src + ':' + p.id;
      if (ids[key] !== undefined) note(`${tag}: ${key} is also song ${ids[key]}`);
      ids[key] = i;
    });
    byEra[x.era] = (byEra[x.era] || 0) + 1;
    // The English title is an answer too (a Latin keyboard), so it must name one song only as well.
    [x.t].concat(x.alt || [], [x.en]).forEach(name => {
      const k = fold(name).replace(/[^\p{L}\p{N}]/gu, '');
      if (!k) return note(`${tag}: an empty name`);
      if (owner[k] !== undefined && owner[k] !== i) note(`${tag}: "${name}" also names song ${owner[k]} (${SONGS[owner[k]].t})`);
      owner[k] = i;
    });
    if (fold(x.t).replace(/[^\p{L}\p{N}]/gu, '') === fold(x.s).replace(/[^\p{L}\p{N}]/gu, '')) note(`${tag}: the title is the singer's name`);
  });
  if (SONGS.length < 150) note(`Songs.js: ${SONGS.length} songs, fewer than 150`);
  ERAS.forEach(e => { if ((byEra[e] || 0) < 4) note(`Songs.js: ${byEra[e] || 0} songs of the ${e} era; the choices need 4`); });
  const bySrc = SONGS.reduce((m, x) => { m[x.src] = (m[x.src] || 0) + 1; return m; }, {});
  console.log(`songs: ${SONGS.length} (${ERAS.map(e => e + ' ' + (byEra[e] || 0)).join(', ')}; from ${Object.keys(bySrc).map(k => k + ' ' + bySrc[k]).join(', ')}, ${SONGS.filter(x => x.also).length} with a second source)`);
}

/* --------------------------------------------------------- العرّاف (oracle) */
// The questions and the entries (games/oracle/), strictly: ids, names in both languages, every
// trait a known question about the entry's kind, and every two entries apart by one trait at
// least. `npm run check:oracle` also plays every entry (notes/games/oracle.md, "Writing entries").
{
  const { loadOracle, loadFold, validateOracle } = require('./oracle-data.cjs');
  const O = loadOracle();
  validateOracle(O, loadFold()).forEach(p => note('oracle: ' + p));
  const d = O.oracleData();
  console.log(`oracle: ${d.questions.length} questions, ${d.entries.length} entries`);
}

// The server reorders each question's choices, but only a valid answer index can be followed.
console.log('\n' + (problems.length ? 'PROBLEMS:' : 'no problems found'));
problems.forEach(p => console.log('  - ' + p));
process.exit(problems.length ? 1 : 0);
