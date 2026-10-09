// العرّاف (The Oracle): `npm run check:oracle` - the strict data checks (as in `npm run check`),
// then every entry played to the end by a robot that thinks of it: once answering truthfully,
// once with one answer in ten wrong. It prints how often the oracle wins (within 20 questions
// and 3 guesses), how many questions it took, and the entries it lost, with what it guessed.
// Fails when the data has a problem or the truthful games win less than MIN_TRUTHFUL.
//   npm run check:oracle                   the whole report
//   npm run check:oracle -- --entry=salah  one entry's game, question by question
//   npm run check:oracle -- --quick        the checks only, no games
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { loadOracle, loadFold, validateOracle, KIND_NAMES } = require('./oracle-data.cjs');

const MIN_TRUTHFUL = 0.9;   // the aim (notes/games/oracle.md)
const NOISE = 0.1;
const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--entry=')) || '').slice(8);
const quick = args.includes('--quick');

const O = loadOracle();
const problems = validateOracle(O, loadFold());
const data = O.oracleData();
const counts = {};
data.entries.forEach((e) => { counts[e.kind] = (counts[e.kind] || 0) + 1; });
console.log(`oracle: ${data.questions.length} questions, ${data.entries.length} entries (${Object.keys(KIND_NAMES).map((k) => `${counts[k] || 0} ${k}`).join(', ')})`);
if (problems.length) {
  console.log('\nPROBLEMS:');
  problems.forEach((p) => console.log('  - ' + p));
  process.exit(1);
}
if (quick) { console.log('no problems found'); process.exit(0); }

// A small seeded random, so a run is the same every time.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const TRUTHFUL = ['y', 'py', 'n', 'n', 'n'];   // by truth Y, M, U, N, X
const memo = new Map();

/** Plays one game for entry index `ei`; `noise` is the share of answers given wrong. */
function play(ei, noise, rand, log) {
  const target = data.entries[ei];
  const game = { answers: [], rejected: [] };
  const guesses = [];
  for (let turn = 0; turn < 60; turn++) {
    // Without noise many games share their first steps: remember them.
    const key = noise ? null : JSON.stringify(game);
    let step = key && memo.get(key);
    if (!step) { step = O.oracleNextStep(game); if (key) memo.set(key, step); }
    if (step.lose) return { win: false, asked: game.answers.length, guesses };
    if (step.guess) {
      guesses.push(step.guess);
      if (log) console.log(`   guess ${guesses.length}: ${step.guess} (${(step.p * 100).toFixed(0)}%)`);
      if (step.guess === target.id) return { win: true, asked: game.answers.length, guesses };
      game.rejected.push(step.guess);
      continue;
    }
    const qi = data.qIndex[step.ask];
    let ans = TRUTHFUL[target.truth[qi]];
    if (noise && rand() < noise) {
      const others = O.ORACLE_ANSWERS.filter((a) => a !== ans);
      ans = others[Math.floor(rand() * others.length)];
    }
    if (log) console.log(`   ${String(game.answers.length + 1).padStart(2)}. ${data.questions[qi].ar}  ${ans}`);
    game.answers.push([step.ask, ans]);
  }
  return { win: false, asked: game.answers.length, guesses };
}

if (only) {
  const ei = data.eIndex[only];
  if (ei === undefined) { console.log(`no entry "${only}"`); process.exit(1); }
  console.log(`\n${only} (${data.entries[ei].ar}), truthful:`);
  console.log(play(ei, 0, null, true).win ? '   won' : '   LOST');
  process.exit(0);
}

const t0 = Date.now();
function run(noise) {
  const rand = rng(7);
  const out = { wins: 0, first: 0, asked: 0, lost: [], byKind: {} };
  data.entries.forEach((e, ei) => {
    const r = play(ei, noise, rand, false);
    const k = out.byKind[e.kind] || (out.byKind[e.kind] = { n: 0, wins: 0 });
    k.n++;
    if (r.win) { out.wins++; k.wins++; out.asked += r.asked; if (r.guesses.length === 1) out.first++; } else out.lost.push({ e, r });
  });
  return out;
}
const pct = (a, b) => `${(100 * a / b).toFixed(1)}%`;
function report(name, res) {
  const n = data.entries.length;
  console.log(`\n${name}: won ${res.wins} of ${n} (${pct(res.wins, n)}), ${pct(res.first, n)} on the first guess, ${(res.asked / Math.max(1, res.wins)).toFixed(1)} questions on average when it won`);
  console.log('  by kind: ' + Object.keys(res.byKind).map((k) => `${k} ${pct(res.byKind[k].wins, res.byKind[k].n)}`).join(', '));
  if (res.lost.length) console.log('  lost: ' + res.lost.map(({ e, r }) => `${e.id} (guessed ${r.guesses.join(', ') || 'nothing'})`).join('; '));
}
const truthful = run(0);
report('truthful', truthful);
const noisy = run(NOISE);
report(`one answer in ${Math.round(1 / NOISE)} wrong`, noisy);
console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
const rate = truthful.wins / data.entries.length;
if (rate < MIN_TRUTHFUL) {
  console.log(`\nFAIL: the truthful games win ${pct(truthful.wins, data.entries.length)}, under ${MIN_TRUTHFUL * 100}%. Give the lost entries (above) a trait that sets them apart.`);
  process.exit(1);
}
console.log('\nno problems found');
