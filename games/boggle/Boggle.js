/* ============================================================================
   شبكة الحروف — LETTER GRID: the dictionary, the grid and the judge
   ----------------------------------------------------------------------------
   Both sides run this file: the page has it in the game's chunk (CHUNKS in
   tools/lazy-split.mjs), the rooms server bundles it (FILES in
   rooms-worker/build.mjs) - the server deals a room's grid and judges every
   word; the phone deals the daily and the solo grids and judges those. No DOM,
   nothing that runs at load. Every name starts with boggle / BOGGLE_.

   The dictionary is the game's own list, BOGGLE_WORDS (BoggleWords.js, 10 Oct
   2026: the owner wanted real, known words only - the lists it used to borrow
   from the other games brought obscure capitals, people's names and fragments,
   and missed everyday words). The same list on the phone and on the server. A word's letters are folded as everywhere
   (foldArabicLetters, Common.js): hamza seats to their letter, ة to ه, ى to
   ي. The article is free: a listed word written with ال (الأسد) is kept as
   أسد and scores as أسد, and a traced ال in front of a word is that word -
   but أل with its hamza is the word's own (ألوان stays ألوان, 5 letters),
   so a trace that is itself a listed word is taken as it is first
   (boggleResolve). 3 letters at least, the article not counted.

   The grid shows one shape for each folded letter (ا, ه, ي, و). A grid is
   made by weaving listed words into it along paths of touching squares
   (diagonals too), filling the rest by how often each letter comes in the
   lists, and is kept only when it holds BOGGLE_MIN_WORDS listed words, one of
   them BOGGLE_MIN_LONG letters or more (boggleMake). A daily is made from the
   date's seed (soloRng), a room's from the server's random.
   ========================================================================= */

const BOGGLE_SIZES = { 4: 120, 5: 180 };      // squares on a side -> seconds a round
const BOGGLE_ROUND_CHOICES = [1, 3, 5];         // rounds in a room (the host's pick; 3 unless changed)
const BOGGLE_MIN_LEN = 3;
const BOGGLE_MAX_LEN = 10;
const BOGGLE_MIN_WORDS = 15;
const BOGGLE_MIN_LONG = 5;
const BOGGLE_DICT = {};

/** A word's points by its letters (ال not counted): 3 = 1, 4 = 2, 5 = 3, 6 and more = 5. */
const boggleWordPts = (fold) => {
  const n = String(fold || '').length;
  return n >= 6 ? 5 : n === 5 ? 3 : n === 4 ? 2 : n === 3 ? 1 : 0;
};

/** A word's letters as the grid shows them: folded (foldArabicLetters), letters only, English in capitals. */
function boggleLetters(word, lang) {
  const f = foldArabicLetters(word).replace(/[^\p{L}]/gu, '');
  return lang === 'en' ? f.toUpperCase() : f;
}

/** A listed word's key: its letters, without the article it was written with (الأسد -> اسد; ألوان keeps its أل). */
function boggleKey(word, lang) {
  const f = boggleLetters(word, lang);
  const bare = String(word || '').trim().replace(/[ً-ْٰـ]/g, '');
  return lang !== 'en' && bare.indexOf('ال') === 0 ? f.slice(2) : f;
}

/**
 * Traced letters to the word they are: themselves when that is a listed word
 * (`listed(key)`), else without a leading ال (the article is free), else as
 * they are - a word not in the lists keeps the same rule.
 */
function boggleResolve(letters, lang, listed) {
  if (lang === 'en' || letters.indexOf('ال') !== 0 || letters.length - 2 < BOGGLE_MIN_LEN) return letters;
  return listed(letters) ? letters : letters.slice(2);
}

const boggleLettersOk = (fold, lang) => (lang === 'en' ? /^[A-Z]+$/ : /^[ء-ي]+$/).test(fold);

/** The game's words in one language (BoggleWords.js). */
function boggleBankWords(lang) {
  return (typeof BOGGLE_WORDS !== 'undefined' && BOGGLE_WORDS[lang]) || [];
}

/**
 * The dictionary of one language, built once: `show` maps each folded word to
 * the way the lists write it, `trie` walks the grid, `pool` is the letters to
 * fill a grid with (each as often as the words use it), `words` the folded
 * words in a fixed order (a seeded grid is the same on every phone).
 */
function boggleDictionary(lang) {
  if (BOGGLE_DICT[lang]) return BOGGLE_DICT[lang];
  const show = new Map();
  boggleBankWords(lang).forEach((w) => {
    const raw = String(w).trim();
    if (!raw || /\s/.test(raw)) return;
    const f = boggleKey(raw, lang);
    if (f.length < BOGGLE_MIN_LEN || f.length > BOGGLE_MAX_LEN || !boggleLettersOk(f, lang) || show.has(f)) return;
    // Shown as the lists write it, the article left off (it is free).
    const bare = raw.replace(/[ً-ْٰـ]/g, '');
    show.set(f, lang === 'en' ? f : (bare.indexOf('ال') === 0 ? bare.slice(2) : bare));
  });
  const words = [...show.keys()].sort();
  const trie = {};
  const count = {};
  words.forEach((w) => {
    let node = trie;
    for (const ch of w) { node = node[ch] || (node[ch] = {}); count[ch] = (count[ch] || 0) + 1; }
    node.$ = w;
  });
  const pool = [];
  Object.keys(count).sort().forEach((ch) => { for (let k = Math.ceil(count[ch] / 40); k > 0; k--) pool.push(ch); });
  BOGGLE_DICT[lang] = { show, words, trie, pool };
  return BOGGLE_DICT[lang];
}

/** Is this folded word in the lists? */
const boggleListed = (fold, lang) => boggleDictionary(lang).show.has(fold);

/** How the lists write a folded word (itself when it isn't listed). */
const boggleShow = (fold, lang) => boggleDictionary(lang).show.get(fold) || fold;

/** The squares that touch square i on an n x n grid, diagonals included. */
function boggleNeighbours(i, n) {
  const r = Math.floor(i / n), c = i % n, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const a = r + dr, b = c + dc;
    if (a >= 0 && b >= 0 && a < n && b < n) out.push(a * n + b);
  }
  return out;
}

/**
 * A traced path checked against the grid: squares on it, each touching the one
 * before, none twice. Returns the letters it spells (folded; boggleResolve
 * makes them a word), or '' when the path is no path or too short.
 */
function boggleTraceWord(grid, n, path, lang) {
  if (!Array.isArray(path) || path.length < 2 || path.length > n * n) return '';
  const seen = {};
  for (let k = 0; k < path.length; k++) {
    const i = path[k];
    if (!Number.isInteger(i) || i < 0 || i >= n * n || seen[i]) return '';
    if (k && boggleNeighbours(path[k - 1], n).indexOf(i) === -1) return '';
    seen[i] = true;
  }
  const f = boggleLetters(path.map((i) => grid[i]).join(''), lang);
  return f.length >= BOGGLE_MIN_LEN && boggleLettersOk(f, lang) ? f : '';
}

/** Every listed word the grid holds (folded), longest first. */
function boggleSolve(grid, n, lang) {
  const { trie } = boggleDictionary(lang);
  const found = new Set();
  const used = new Array(n * n).fill(false);
  const nb = [];
  for (let i = 0; i < n * n; i++) nb.push(boggleNeighbours(i, n));
  const go = (i, node, depth) => {
    const next = node[grid[i]];
    if (!next) return;
    if (next.$) found.add(next.$);
    if (depth >= BOGGLE_MAX_LEN) return;
    used[i] = true;
    nb[i].forEach((j) => { if (!used[j]) go(j, next, depth + 1); });
    used[i] = false;
  };
  for (let i = 0; i < n * n; i++) go(i, trie, 1);
  // A word spelled with its ال is the same word; the fold already took it off, so nothing to merge.
  return [...found].sort((a, b) => b.length - a.length || (a < b ? -1 : a > b ? 1 : 0));
}

/** Weaves one word into the grid along a path of touching squares, over blanks or its own letters. */
function boggleWeave(grid, n, word, rnd) {
  const starts = soloShuffle(grid.map((_, i) => i), rnd);
  const used = new Array(n * n).fill(false);
  const path = [];
  const go = (i, k) => {
    if (used[i] || (grid[i] && grid[i] !== word[k])) return false;
    used[i] = true;
    path.push(i);
    if (k === word.length - 1) return true;
    for (const j of soloShuffle(boggleNeighbours(i, n), rnd)) if (go(j, k + 1)) return true;
    used[i] = false;
    path.pop();
    return false;
  };
  for (const s of starts.slice(0, 8)) {
    if (go(s, 0)) { path.forEach((i, k) => { grid[i] = word[k]; }); return true; }
  }
  return false;
}

/**
 * A grid of n x n letters with at least BOGGLE_MIN_WORDS listed words, one of
 * BOGGLE_MIN_LONG letters or more: { grid, words } (words folded, longest
 * first), or null when the lists can't make one. `rnd` draws everything.
 */
function boggleMake(n, lang, rnd) {
  const dict = boggleDictionary(lang);
  const longMax = n === 4 ? 7 : 9;
  const longs = dict.words.filter((w) => w.length >= BOGGLE_MIN_LONG && w.length <= longMax);
  const shorts = dict.words.filter((w) => w.length >= 3 && w.length <= 6);
  if (!longs.length || !dict.pool.length) return null;
  let best = null;
  for (let tries = 0; tries < 30; tries++) {
    const grid = new Array(n * n).fill('');
    boggleWeave(grid, n, soloPick(longs, rnd), rnd);
    for (let k = 0; k < n * 6 && grid.some((ch) => !ch); k++) boggleWeave(grid, n, soloPick(shorts, rnd), rnd);
    for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = soloPick(dict.pool, rnd);
    const words = boggleSolve(grid, n, lang);
    const ok = words.length >= BOGGLE_MIN_WORDS && words[0] && words[0].length >= BOGGLE_MIN_LONG;
    if (ok && (!best || words.length > best.words.length)) best = { grid, words };
    if (best && best.words.length >= BOGGLE_MIN_WORDS + n * 3) break;
  }
  return best;
}
