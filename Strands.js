/* ============================================================================
   خيوط — THE THEMED WORD SEARCH: the puzzle's rules
   ----------------------------------------------------------------------------
   Moved out of JS_WordSearch.html for سباق ألغاز (26 Sep 2026): a race's grid
   is dealt on the rooms server and every traced line judged there, so the
   generator and the judge live in a file both sides bundle (the page inlines
   it, SHARED_LISTS; the Worker bundles it, FILES in rooms-worker/build.mjs).
   No DOM, nothing that runs at load; every name starts with strands / STRANDS_.
   Draws with SoloShared.js (soloShuffle, soloCategory) from CHAMELEON_DB.

   A theme's words are hidden in straight lines of a grid of letters, along
   the reading direction, down or diagonally (hard also backwards and up); the
   rest of the grid is filled with letters drawn from the theme's own words,
   so the filler looks like the words. Hamza forms and diacritics are folded
   so a grid letter is one plain letter. The filler is drawn again when it
   makes a hidden word readable a second time somewhere (strandsCopies).
   ========================================================================= */

const STRANDS_LEVELS = {
  easy:   { size: 7, words: 5, reverse: false },
  medium: { size: 8, words: 6, reverse: false },
  hard:   { size: 9, words: 8, reverse: true }
};

/** One plain letter per character: no diacritics, no tatweel, hamza seats folded. */
function strandsFold(word, lang) {
  let w = String(word || '').replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا');
  if (lang === 'en') w = w.toUpperCase();
  return w;
}

/**
 * How many straight lines of the grid read `word`, either way round (a
 * palindrome read both ways along one line counts once). A player can trace
 * any of them, so each hidden word should be there exactly once.
 */
function strandsCopies(grid, size, word) {
  const len = word.length;
  const back = word.split('').reverse().join('');
  let copies = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const r1 = r + dr * (len - 1), c1 = c + dc * (len - 1);
        if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue;
        let text = '';
        for (let k = 0; k < len; k++) text += grid[(r + dr * k) * size + (c + dc * k)];
        if (text === word || text === back) copies++;
      }
    }
  }
  return copies;
}

/**
 * { size, theme, icon, grid, words: [{ w, cells }] } or null. `themes`, when
 * given, are tried first in that order (a room deals through its memory of
 * what it dealt lately), then the whole list.
 */
function strandsMake(level, lang, rnd, themes) {
  const L = STRANDS_LEVELS[level] || STRANDS_LEVELS.easy;
  const letterRe = lang === 'en' ? /^[A-Z]+$/ : /^[ء-ي]+$/;
  const all = soloShuffle((CHAMELEON_DB[lang] || CHAMELEON_DB.ar), rnd);
  const list = themes && themes.length ? themes.concat(all.filter(t => themes.indexOf(t) === -1)) : all;
  const dirs = lang === 'en'
    ? [[0, 1], [1, 0], [1, 1]].concat(L.reverse ? [[0, -1], [-1, 0], [1, -1]] : [])
    : [[0, -1], [1, 0], [1, -1]].concat(L.reverse ? [[0, 1], [-1, 0], [1, 1]] : []);
  for (const theme of list) {
    const pool = soloShuffle(theme.words.map(w => strandsFold(w, lang)).filter(w => letterRe.test(w) && w.length >= 3 && w.length <= L.size), rnd);
    if (pool.length < L.words) continue;
    let fallback = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const grid = new Array(L.size * L.size).fill('');
      const placed = [];
      for (const w of pool) {
        if (placed.length >= L.words) break;
        let ok = false;
        const starts = soloShuffle(Array.from({ length: L.size * L.size }, (_, k) => k), rnd);
        for (const start of starts) {
          for (const [dr, dc] of soloShuffle(dirs, rnd)) {
            const r0 = Math.floor(start / L.size), c0 = start % L.size;
            const cells = [];
            let fits = true;
            for (let k = 0; k < w.length; k++) {
              const r = r0 + dr * k, c = c0 + dc * k;
              if (r < 0 || r >= L.size || c < 0 || c >= L.size) { fits = false; break; }
              const i = r * L.size + c;
              if (grid[i] && grid[i] !== w[k]) { fits = false; break; }
              cells.push(i);
            }
            if (!fits) continue;
            // A word inside another placed word (either way round) would be found twice.
            const back = w.split('').reverse().join('');
            if (placed.some(p => p.w.indexOf(w) !== -1 || w.indexOf(p.w) !== -1 || p.w.indexOf(back) !== -1 || back.indexOf(p.w) !== -1)) { fits = false; }
            if (!fits) continue;
            cells.forEach((i, k) => { grid[i] = w[k]; });
            placed.push({ w: w, cells: cells });
            ok = true;
            break;
          }
          if (ok) break;
        }
      }
      if (placed.length < L.words) continue;
      const letters = pool.join('').split('');
      const empty = [];
      for (let i = 0; i < grid.length; i++) if (!grid[i]) empty.push(i);
      // Filler drawn from the theme's letters can spell a hidden word again;
      // draw it again until every word is there once. When the words
      // themselves make a second copy, lay them out again; if every layout
      // does, the first is kept (a traced copy still counts, see strandsTrace).
      let clean = false;
      for (let fill = 0; fill < 12 && !clean; fill++) {
        empty.forEach(i => { grid[i] = letters[Math.floor(rnd() * letters.length)]; });
        clean = placed.every(p => strandsCopies(grid, L.size, p.w) === 1);
      }
      const t = soloCategory(theme.category);
      const made = { size: L.size, theme: t.name, icon: t.icon, grid: grid, words: placed };
      if (clean) return made;
      fallback = fallback || made;
    }
    if (fallback) return fallback;
  }
  return null;
}

/** A straight line of cells from a to b on a grid of `size` (a row, a column or a diagonal), or null. */
function strandsLine(size, a, b) {
  const n = size;
  const r0 = Math.floor(a / n), c0 = a % n, r1 = Math.floor(b / n), c1 = b % n;
  const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
  const len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  if (!(r0 === r1 || c0 === c1 || Math.abs(r1 - r0) === Math.abs(c1 - c0))) return null;
  return Array.from({ length: len + 1 }, (_, k) => (r0 + dr * k) * n + (c0 + dc * k));
}

/**
 * A traced line judged against the words not yet found: the index of the word
 * it reads (either way round) with its cells in reading order, or null. The
 * word lights where it was traced, even if it was planted somewhere else too.
 */
function strandsTrace(grid, words, found, cells) {
  const text = cells.map(i => grid[i]).join('');
  const back = text.split('').reverse().join('');
  const wi = words.findIndex((w, k) => found.indexOf(k) === -1 && (w.w === text || w.w === back));
  if (wi === -1) return null;
  return { wi: wi, cells: words[wi].w === text ? cells.slice() : cells.slice().reverse() };
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   A medium grid (8×8, six words) from a theme the room hasn't dealt lately;
   the grid and the words' lengths go to every phone, the words stay on the
   server. A phone sends each line it traces (`move { cells }`) and gets back
   the words it has found; the table's bar is words found of the six.
   ------------------------------------------------------------------------------ */
const STRANDS_RACE_LEVEL = 'medium';
const STRANDS_RACE = {
  deal(rnd, st, pick) {
    const lang = st.lang === 'en' ? 'en' : 'ar';
    const themes = pick && pick.many ? pick.many(CHAMELEON_DB[lang] || CHAMELEON_DB.ar, 'race_strands_' + lang, 8) : [];
    // The generator can come back empty: try again (the easy size last), never deal nothing.
    let made = null;
    for (let i = 0; !made && i < 12; i++) made = strandsMake(i < 8 ? STRANDS_RACE_LEVEL : 'easy', lang, rnd, themes);
    if (!made) throw new Error('ماعرفناش نجهّز اللوحة، جرّبوا تاني');
    return {
      pub: { size: made.size, theme: made.theme, icon: made.icon, grid: made.grid, lens: made.words.map(w => w.w.length), lang: lang },
      words: made.words
    };
  },
  board: () => ({ found: [] }),
  total: (x) => x.words.length,
  move(b, x, p) {
    const size = x.pub.size;
    const cells = Array.isArray(p.cells) ? p.cells.map(Number) : [];
    if (cells.length < 2 || cells.some(i => !Number.isInteger(i) || i < 0 || i >= size * size)) throw new Error('خط مش مظبوط');
    const line = strandsLine(size, cells[0], cells[cells.length - 1]);
    if (!line || line.length !== cells.length) throw new Error('خط مش مظبوط');
    const hit = strandsTrace(x.pub.grid, x.words, b.found.map(f => f.wi), line);
    if (!hit) return '';
    b.found.push(hit);
    return b.found.length === x.words.length ? 'won' : '';
  },
  progress: (b) => ({ done: b.found.length }),
  // The words this phone has found, with where it traced them: its own board.
  view: (b, x) => ({ found: b.found.map(f => ({ wi: f.wi, w: x.words[f.wi].w, cells: f.cells })) }),
  score: () => 0,
  reveal: (x) => ({ theme: x.pub.theme, icon: x.pub.icon, words: x.words.map(w => w.w) })
};
