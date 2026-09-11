/**
 * Content validation for the new games.
 *
 * The one that actually breaks a game: a word appearing in two groups of the
 * same Connections puzzle. The grid would show 16 tiles with a duplicate label,
 * and tapping either would ambiguously satisfy two groups.
 */
const fs = require('fs');

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
const CONN = load('JS_Connections.html'.replace(/^/, 'C:/Users/TPC/Apps Script/G/'), 'CONNECTIONS_DB');
for (const [lang, puzzles] of Object.entries(CONN)) {
  puzzles.forEach((p, pi) => {
    const tag = `connections.${lang}[${pi}]`;
    if (p.groups.length !== 4) note(`${tag}: ${p.groups.length} groups, expected 4`);
    const all = [];
    p.groups.forEach((g, gi) => {
      if (g.words.length !== 4) note(`${tag}.${g.name}: ${g.words.length} words, expected 4`);
      if (!g.name) note(`${tag} group ${gi} has no name`);
      g.words.forEach(w => all.push({ w, g: g.name }));
    });
    if (all.length !== 16) note(`${tag}: ${all.length} tiles, expected 16`);
    const seen = {};
    all.forEach(({ w, g }) => {
      if (seen[w]) note(`${tag}: DUPLICATE "${w}" in both "${seen[w]}" and "${g}"`);
      else seen[w] = g;
    });
  });
  console.log(`connections.${lang}: ${puzzles.length} puzzles`);
}

/* -------------------------------------------------------- Party content */
const PC = 'C:/Users/TPC/Apps Script/G/PartyContent.js';
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
const CN = load('C:/Users/TPC/Apps Script/G/CodenamesWords.js', 'CODENAMES_WORDS');

// Draw & Guess needs enough words that a long session never repeats, and every
// entry has to be something you can actually draw — the reason it stopped
// sharing the Codenames bank, which is full of abstractions like "time".
for (const [lang, list] of Object.entries(DRAW)) {
  const dup = list.filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) note(`draw.${lang}: duplicates ${JSON.stringify(dup)}`);
  if (list.length < 100) note(`draw.${lang}: only ${list.length} words, wants 100+`);
  list.forEach((w, i) => { if (!w || !w.trim()) note(`draw.${lang}[${i}]: empty`); });
  console.log(`draw.${lang}: ${list.length} words`);
}

// A Codenames board is 25 cards drawn without replacement.
for (const [lang, list] of Object.entries(CN)) {
  const dup = list.filter((v, i, a) => a.indexOf(v) !== i);
  if (dup.length) note(`codenames.${lang}: duplicates ${JSON.stringify(dup)}`);
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

const TRIV = load(PC, 'TRIVIA_QUESTIONS');
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

console.log('\n' + (problems.length ? 'PROBLEMS:' : 'no problems found'));
problems.forEach(p => console.log('  - ' + p));
process.exit(problems.length ? 1 : 0);
