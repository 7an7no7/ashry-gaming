/**
 * The names check (npm run check:names, part of npm run check; 5 Oct 2026).
 *
 * Every page script (every JS_*.html and the shared lists) runs in one global
 * scope, and so does the rooms server's bundle (rooms-worker/build.mjs's FILES).
 * Two things go wrong there without any error at the time:
 *
 *  - a top-level name declared in two files: the later file's function silently
 *    replaces the earlier one (the room trivia clock stood still for as long as
 *    two paintTriviaTimer existed, GEMINI.md *Traps*), and two `const`s of one
 *    name throw when the second script loads;
 *  - a name used that nothing declares (a typo, a constant only the other side
 *    has - FAKE_ARTIST_COLOURS on the server): found only when that line runs.
 *
 * This reads both scopes and fails on either. A use guarded by `typeof x` is
 * fine, and so is anything the browser (or a Worker) provides. The page's
 * inline handlers (onclick="fn()") are not read: the build's chunk check
 * (tools/lazy-split.mjs) already fails on a screen button calling code its
 * chunk doesn't load.
 *
 *   node check-names.mjs           # both scopes
 *   node check-names.mjs --list    # every top-level name and its file
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { Linter } from 'eslint';
import globals from 'globals';
import { readPage } from './lazy-split.mjs';
import srcMod from './sources.cjs';
import { serverFiles } from '../rooms-worker/fingerprint.mjs';

const { srcPath, srcRel } = srcMod;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Names a scope may use without declaring them, beyond the browser's or the
   Worker's own: the CDN libraries (loaded async, used behind a typeof or once
   they arrived) and what the build writes into the page. */
const PAGE_EXTRA = ['confetti', 'QRCode', 'THREE', 'SERVER_DATA', 'ROOMS_URL'];
// rooms-worker/build.mjs's prelude, written before the files.
const SERVER_EXTRA = ['getSpyData', 'PropertiesService', 'withPromptMemory', 'promptMemory', 'RULES_HASH'];

/** The scripts of a file: an .html file's <script> blocks, or a .js file whole. */
function scriptsOf(name, text) {
  if (!name.endsWith('.html')) return [{ code: text, line: 1 }];
  const out = [];
  for (const m of text.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(m[1] || '') || /type=["'](?!text\/javascript|module)/.test(m[1] || '')) continue;
    // Apps Script template tags (Controller.html) stand for a value.
    const code = m[2].replace(/<\?!?=[\s\S]*?\?>/g, 'null');
    out.push({ code, line: text.slice(0, m.index).split('\n').length });
  }
  return out;
}

function patNames(p, add) {
  if (!p) return;
  if (p.type === 'Identifier') add(p.name);
  else if (p.type === 'ObjectPattern') p.properties.forEach((q) => patNames(q.type === 'RestElement' ? q.argument : q.value, add));
  else if (p.type === 'ArrayPattern') p.elements.forEach((q) => patNames(q, add));
  else if (p.type === 'RestElement') patNames(p.argument, add);
  else if (p.type === 'AssignmentPattern') patNames(p.left, add);
}

/** Top-level declarations of one script: [{ name, kind, line }]. */
function declsOf(code, sourceType) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType, allowReturnOutsideFunction: true, locations: true });
  const out = [];
  for (const st of ast.body) {
    const node = st.type === 'ExportNamedDeclaration' ? st.declaration : st;
    if (!node) continue;
    if ((node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') && node.id) {
      out.push({ name: node.id.name, kind: node.type === 'ClassDeclaration' ? 'class' : 'function', line: node.loc.start.line });
    }
    if (node.type === 'VariableDeclaration') {
      node.declarations.forEach((d) => patNames(d.id, (name) => out.push({ name, kind: node.kind, line: d.loc.start.line })));
    }
  }
  // window.x = … makes a global too.
  const assigned = [...code.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)].map((m) => m[1]);
  return { decls: out, assigned };
}

/** Checks one scope. files: [{ name, scripts }]. Returns the problems. */
function checkScope(label, files, { sourceType, envGlobals, extra }) {
  const problems = [];
  const where = new Map();   // name -> [{ file, kind, line }]
  const loose = new Set();   // window.x = …
  for (const f of files) {
    for (const s of f.scripts) {
      let d;
      try { d = declsOf(s.code, sourceType); }
      catch (e) { problems.push(`${srcRel(f.name)}: doesn't parse: ${e.message}`); continue; }
      d.decls.forEach((x) => {
        if (!where.has(x.name)) where.set(x.name, []);
        where.get(x.name).push({ file: f.name, kind: x.kind, line: s.line + x.line - 1 });
      });
      d.assigned.forEach((n) => loose.add(n));
    }
  }
  // Declared twice. Two `var`s of one name in one file are one variable (and
  // legal), but anything else declared twice is two things fighting over a name.
  for (const [name, list] of where) {
    if (list.length < 2) continue;
    if (list.every((x) => x.kind === 'var') && new Set(list.map((x) => x.file)).size === 1) continue;
    problems.push(`${label}: '${name}' is declared ${list.length} times - ${list.map((x) => `${srcRel(x.file)}:${x.line} (${x.kind})`).join(', ')}`);
  }
  // Used and never declared.
  const known = Object.assign({}, envGlobals);
  for (const n of [...where.keys(), ...loose, ...extra]) known[n] = 'writable';
  const linter = new Linter({ configType: 'flat' });
  const config = [{
    languageOptions: { ecmaVersion: 'latest', sourceType, globals: known },
    rules: { 'no-undef': 'error' }
  }];
  for (const f of files) {
    for (const s of f.scripts) {
      const msgs = linter.verify(s.code, config, { filename: f.name.replace(/\.html$/, '.js') });
      for (const m of msgs) {
        if (m.fatal) continue; // reported above
        // A name the file checks with typeof first (typeof X !== 'undefined' && X…) is guarded.
        const undef = /^'([^']+)' is not defined/.exec(m.message);
        if (undef && new RegExp('typeof\\s*\\(?\\s*' + undef[1].replace(/\$/g, '\\$') + '\\b').test(s.code)) continue;
        problems.push(`${label}: ${srcRel(f.name)}:${s.line + m.line - 1}: ${m.message}`);
      }
    }
  }
  return { problems, where };
}

// ---- the page ----
const page = await readPage(root, readFile, path);
const pageFiles = page.order.map((n) => {
  const name = /\.(js|html)$/.test(n) ? n : `${n}.html`;
  return { name, scripts: scriptsOf(name, page.sources.get(n)) };
});
// Controller.html's own scripts (the page data, the intro's two).
pageFiles.unshift({ name: 'Controller.html', scripts: scriptsOf('Controller.html', page.controller.replace(/<\?!=\s*include\([^)]*\);?\s*\?>/g, '')) });
const pageResult = checkScope('page', pageFiles, {
  sourceType: 'script',
  envGlobals: { ...globals.browser, ...globals.es2025 },
  extra: PAGE_EXTRA
});

// ---- the rooms server ----
const serverList = await serverFiles();
const serverFilesRead = await Promise.all(serverList.map(async (name) => ({
  name, scripts: [{ code: (await readFile(srcPath(name), 'utf8')), line: 1 }]
})));
const serverResult = checkScope('server', serverFilesRead, {
  sourceType: 'module',
  envGlobals: { ...globals.es2025, ...globals.worker, ...globals.serviceworker },
  extra: SERVER_EXTRA
});

if (process.argv.includes('--list')) {
  for (const [label, r] of [['page', pageResult], ['server', serverResult]]) {
    for (const [name, list] of [...r.where].sort()) console.log(`${label}\t${name}\t${list.map((x) => srcRel(x.file)).join(', ')}`);
  }
}

const problems = [...pageResult.problems, ...serverResult.problems];
console.log(`names: page ${pageResult.where.size} top-level names in ${pageFiles.length} files, server ${serverResult.where.size} in ${serverFilesRead.length}`);
if (problems.length) {
  problems.forEach((p) => console.log('  ✗ ' + p));
  console.log(`names: ${problems.length} problem${problems.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('names OK');
