/**
 * Content validation for the new games.
 *
 * The one that actually breaks a game: a word appearing in two groups of the
 * same Connections puzzle. The grid would show 16 tiles with a duplicate label,
 * and tapping either would ambiguously satisfy two groups.
 */
const fs = require('fs');
const path = require('path');

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
  const CONN = load(ROOT + 'JS_Connections.html', dbName);
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

/* -------------------------------------------------------- Party content */
const PC = ROOT + 'PartyContent.js';
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
const CN = load(ROOT + 'CodenamesWords.js', 'CODENAMES_WORDS');

// Draw & Guess needs enough words that a long session never repeats, and every
// entry has to be something you can actually draw — the reason it stopped
// sharing the Codenames bank, which is full of abstractions like "time".
// The fold the rooms compare words with (normaliseClue in RoomGames.js): two
// spellings of one word are one card - بئر and بير, مغرب and المغرب - so a list
// may not hold both. A raw-string check let four such pairs into Codenames,
// where both could land on one board as two identical cards.
const clueKey = (t) => {
  let out = String(t).toLowerCase().replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/[ىی]/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (out.indexOf('the ') === 0) out = out.slice(4);
  for (let i = 0; i < 2 && out.length > 3 && out.indexOf('ال') === 0; i++) out = out.slice(2);
  return out.replace(/\s+/g, '');
};
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

// A Codenames board is 25 cards drawn without replacement.
for (const [lang, list] of Object.entries(CN)) {
  const dup = clueRepeats(list);
  if (dup.length) note(`codenames.${lang}: the same word twice ${JSON.stringify(dup)}`);
  if (list.length < 25) note(`codenames.${lang}: ${list.length} words, a board needs 25`);
  console.log(`codenames.${lang}: ${list.length} words`);
}

/* ------------------------------------------------ Wavelength & Trivia */
const WL = load(PC, 'WAVELENGTH_PAIRS');
for (const [lang, list] of Object.entries(WL)) {
  list.forEach((pair, i) => {
    if (!pair.left || !pair.left.trim()) note(`wavelength.${lang}[${i}]: empty left`);
    if (!pair.right || !pair.right.trim()) note(`wavelength.${lang}[${i}]: empty right`);
  });
  console.log(`wavelength.${lang}: ${list.length} pairs`);
}

const TRIV = load(ROOT + 'TriviaQuestions.js', 'TRIVIA_QUESTIONS');
for (const [lang, list] of Object.entries(TRIV)) {
  list.forEach((item, i) => {
    if (!item.q || !item.q.trim()) note(`trivia.${lang}[${i}]: empty question`);
    if (!Array.isArray(item.choices) || item.choices.length !== 4) note(`trivia.${lang}[${i}]: expected 4 choices`);
    if (typeof item.answer !== 'number' || item.answer < 0 || item.answer > 3) note(`trivia.${lang}[${i}]: invalid answer index`);
  });
  const dup = list.map(x => x.q).filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) note(`trivia.${lang}: duplicate questions ${JSON.stringify(dup)}`);
  console.log(`trivia.${lang}: ${list.length} questions`);
}

/* --------------------------------------------------- قبل ولا بعد (timeline) */
// Two cards with the same year would make a placement right and wrong at the
// same time, and a card missing a language would deal blank to that table.
const TL = load(ROOT + 'TimelineEvents.js', 'TIMELINE_EVENTS');
{
  const years = {};
  TL.forEach((e, i) => {
    if (typeof e.y !== 'number' || !Number.isInteger(e.y)) note(`timeline[${i}]: no year`);
    if (!e.ar || !String(e.ar).trim()) note(`timeline[${i}] (${e.y}): no Arabic`);
    if (!e.en || !String(e.en).trim()) note(`timeline[${i}] (${e.y}): no English`);
    if (years[e.y]) note(`timeline: two cards on ${e.y} - "${years[e.y]}" and "${e.ar}"`);
    years[e.y] = e.ar;
  });
  const span = TL.map(e => e.y);
  console.log(`timeline: ${TL.length} events, ${Math.min(...span)}-${Math.max(...span)}`);
}

/* ------------------------------------------------------ دوري المعرفة board */
// Each category has every level, each level enough questions for a few games,
// every item is [question ar, answer ar, question en, answer en], no question
// is asked twice, and no answer gives itself away inside its question.
{
  const BOARD = load(ROOT + 'JS_TriviaBoardBank.html', 'TRIVIA_BOARD_BANK');
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
const CHAM = load(G + 'ChameleonWords.js', 'CHAMELEON_DB');
for (const [lang, cats] of Object.entries(CHAM)) {
  cats.forEach((c, i) => {
    if (c.words.length !== 16) note(`chameleon.${lang}[${i}] ${c.category}: ${c.words.length} words, the grid needs 16`);
    const dup = c.words.filter((w, k, a) => a.indexOf(w) !== k);
    if (dup.length) note(`chameleon.${lang}[${i}] ${c.category}: duplicates ${JSON.stringify(dup)}`);
  });
  console.log(`chameleon.${lang}: ${cats.length} categories`);
}
if (CHAM.ar.length !== CHAM.en.length) note(`chameleon: ${CHAM.ar.length} ar categories vs ${CHAM.en.length} en`);

// The spy's guess is matched on the location's name, so names must be unique.
const SPY = load(G + 'SpyfallPlaces.js', 'SPYFALL_DB');
for (const [lang, locs] of Object.entries(SPY)) {
  const names = locs.map(l => l.location);
  const dup = names.filter((w, k, a) => a.indexOf(w) !== k);
  if (dup.length) note(`spyfall.${lang}: duplicate locations ${JSON.stringify(dup)}`);
  locs.forEach(l => { if (!l.roles || l.roles.length < 4) note(`spyfall.${lang} ${l.location}: too few roles`); });
  console.log(`spyfall.${lang}: ${locs.length} locations`);
}

// A repeated card goes into the deck twice.
const TU = load(G + 'JS_TimesUp.html', 'TIMESUP_DB');
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
const WORD = load(G + 'WordleWords.js', 'WORDLE_DB');
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

// Describe It: three forbidden words, and no card twice.
const DESC = load(G + 'JS_DescribeIt.html', 'DESCRIBE_DB');
for (const [lang, cards] of Object.entries(DESC)) {
  cards.forEach(c => {
    if (!Array.isArray(c.forbidden) || c.forbidden.length !== 3) note(`describe.${lang} "${c.word}": ${c.forbidden && c.forbidden.length} forbidden words, expected 3`);
  });
  const dup = repeats(cards.map(c => c.word));
  if (dup.length) note(`describe.${lang}: duplicate cards ${JSON.stringify(dup)}`);
  console.log(`describe.${lang}: ${cards.length} cards`);
}

// Charades: a card appears in one category only.
const CHAR = load(G + 'JS_Charades.html', 'CHARADES_DB');
for (const [lang, cats] of Object.entries(CHAR)) {
  const all = Object.values(cats).flat();
  const dup = repeats(all);
  if (dup.length) note(`charades.${lang}: in more than one place ${JSON.stringify(dup)}`);
  console.log(`charades.${lang}: ${all.length} cards in ${Object.keys(cats).length} categories`);
}

for (const name of ['JO_WORDS_AR', 'JO_WORDS_EN']) {
  const list = load(G + 'JS_NewGames.html', name);
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
const SPY_WORDS = load(G + 'SpyWords.js', 'SPY_WORDS');
for (const [cat, words] of Object.entries(SPY_WORDS)) {
  if (!Array.isArray(words) || words.length < 10) note(`spy "${cat}": ${words && words.length} words, wants 10+`);
  const dup = repeats(words || []);
  if (dup.length) note(`spy "${cat}": duplicates ${JSON.stringify(dup)}`);
}
console.log(`spy: ${Object.keys(SPY_WORDS).length} categories, ${Object.values(SPY_WORDS).reduce((n, w) => n + w.length, 0)} words`);

// القنبلة: a category is listed once, and there are enough to last an evening.
const BOMB = load(G + 'BombPrompts.js', 'BOMB_PROMPTS');
for (const [lang, list] of Object.entries(BOMB)) {
  const dup = repeats(list);
  if (dup.length) note(`bomb.${lang}: duplicates ${JSON.stringify(dup)}`);
  if (list.length < 60) note(`bomb.${lang}: ${list.length} categories, wants 60+`);
  if (list.some(x => !String(x || '').trim())) note(`bomb.${lang}: an empty category`);
  console.log(`bomb.${lang}: ${list.length} categories`);
}

// أتوبيس كومبليت: every category has an id and both names, none twice.
// Emoji riddles: emoji, an answer, a kind; no answer twice in a language.
const EMOJI = load(G + 'EmojiRiddles.js', 'EMOJI_RIDDLES');
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
const PROV = load(G + 'Proverbs.js', 'PROVERBS');
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
const MONKEY = load(G + 'MonkeyWords.js', 'MONKEY_LISTS');
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
  const src = ['SpyWords.js', 'MonkeyWords.js', 'StopWords.js'].map(f => fs.readFileSync(G + f, 'utf8')).join('\n;\n');
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
  const src = fs.readFileSync(G + 'JS_Nonogram.html', 'utf8').replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '');
  const N = new Function('soloRegister', 'soloPick', src + '; return { NONO_PICTURES, nonoFromPicture, nonoClues, nonoSolvable };')(() => {}, () => {});
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

const STOP_CATS = load(G + 'JS_Stop.html', 'STOP_CATEGORIES');
{
  const ids = STOP_CATS.map(c => c.id);
  const dup = repeats(ids);
  if (dup.length) note(`stop: duplicate category ids ${JSON.stringify(dup)}`);
  STOP_CATS.forEach(c => { if (!c.id || !c.ar || !c.en) note(`stop: category ${JSON.stringify(c)} is missing a field`); });
  console.log(`stop: ${STOP_CATS.length} categories`);
}

/* -------------------------------------------------------- Chess openings */
{
  const chessSrc = fs.readFileSync(ROOT + 'Chess.js', 'utf8');
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

  const OPENINGS = load(ROOT + 'JS_ChessOpenings.html', 'CH_OPENINGS');
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
  const CH = new Function(fs.readFileSync(ROOT + 'Chess.js', 'utf8') + '; return { chessFromFen, chessFen, chessPlay, chessStatus };')();
  const PUZ = load(ROOT + 'ChessPuzzles.js', 'CHESS_PUZZLES');
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

// The server reorders each question's choices, but only a valid answer index can be followed.
console.log('\n' + (problems.length ? 'PROBLEMS:' : 'no problems found'));
problems.forEach(p => console.log('  - ' + p));
process.exit(problems.length ? 1 : 0);
