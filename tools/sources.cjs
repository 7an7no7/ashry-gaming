/**
 * Where the app's source files live (5 Oct 2026). The sources are in folders -
 * app/ (the shell), styles/, rooms/ (the room engine), content/ (word lists
 * several games deal from) and games/<id>/ (one folder per game) - and every
 * file keeps a name no other file has. So the build, the checks and the tests
 * name a file the way they always did (JS_Core.html, RoomUno.js, Chess.js) and
 * ask this module where it is:
 *
 *   const { srcPath, srcFiles } = require('./sources.cjs');      // or import
 *   fs.readFileSync(srcPath('Games.js'), 'utf8');
 *   srcFiles(/^JS_.*\.html$/)    // every page script, by name, sorted
 *
 * A name in two folders fails at once: a name is one file in the whole tree.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIRS = ['app', 'styles', 'rooms', 'content', 'games'];

let index = null;
function build() {
  index = new Map();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|html)$/.test(e.name)) continue;
      if (index.has(e.name)) throw new Error(`sources: ${e.name} is in two folders (${path.relative(ROOT, index.get(e.name))}, ${path.relative(ROOT, p)}): a file's name must be unique`);
      index.set(e.name, p);
    }
  };
  for (const d of SOURCE_DIRS) if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d));
  return index;
}

/** The full path of a source file, by its name ('JS_Core.html', 'Games.js'). */
function srcPath(name) {
  const p = (index || build()).get(name);
  if (!p) throw new Error(`sources: no source file named ${name} (in ${SOURCE_DIRS.join('/, ')}/)`);
  return p;
}

/** Whether a source file of that name exists. */
function srcHas(name) { return (index || build()).has(name); }

/** The names of every source file matching `re`, sorted. */
function srcFiles(re = /./) { return [...(index || build()).keys()].filter((n) => re.test(n)).sort(); }

/** A source file's path from the project root, with forward slashes (games/uno/RoomUno.js). */
function srcRel(name) { return path.relative(ROOT, srcPath(name)).replace(/\\/g, '/'); }

/** Reads a source file by name. */
function srcRead(name) { return fs.readFileSync(srcPath(name), 'utf8'); }

/** Forget the index (a script that creates or moves files). */
function srcRescan() { index = null; }

module.exports = { ROOT, SOURCE_DIRS, srcPath, srcHas, srcFiles, srcRel, srcRead, srcRescan };
