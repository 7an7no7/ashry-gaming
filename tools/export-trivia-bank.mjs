/**
 * Writes the دوري المعرفة questions (JS_TriviaBoardBank.html) as trivia_bank.js,
 * the file the standalone trivia page (trivia.html) loads: window.TRIVIA_BANK.
 *
 *   npm run export:trivia -- "C:/Users/TPC/Downloads/trivia_bank.js"
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, '..', 'trivia_bank.js');

const source = await readFile(path.join(here, '..', 'JS_TriviaBoardBank.html'), 'utf8');
const BANK = new Function(source.replace(/^\s*<script>/, '').replace(/<\/script>\s*$/, '') + '\nreturn TRIVIA_BOARD_BANK;')();

const categories = BANK.map((cat) => ({
  id: cat.id,
  arName: cat.ar,
  enName: cat.en,
  questions: Object.fromEntries(Object.entries(cat.levels).map(([points, list]) =>
    [points, list.map(([qAr, aAr, qEn, aEn]) => ({ qAr, aAr, qEn, aEn }))]))
}));
const totalQuestions = categories.reduce((n, c) => n + Object.values(c.questions).reduce((m, l) => m + l.length, 0), 0);

const text = '/* Generated from Ashry Gaming (JS_TriviaBoardBank.html) by tools/export-trivia-bank.mjs.\n' +
  '   Edit the questions there and export again. */\n' +
  'window.TRIVIA_BANK = ' + JSON.stringify({ totalQuestions, categories }, null, 2) + ';\n';
await writeFile(out, text, 'utf8');
console.log(`${out}: ${categories.length} categories, ${totalQuestions} questions`);
