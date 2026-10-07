/**
 * Each game's words travel with its code (8 Oct 2026). Used by lazy-split.mjs:
 * app/JS_Translations.html stays as it is written (with every game's
 * <id>.text.js put in, game-text.cjs), and the build takes out of the page's
 * TRANSLATIONS every key it can prove only one chunk reads, and gives it to that
 * chunk: lzWords in JS_Lazy.html puts the chunk's keys back into TRANSLATIONS as
 * the chunk runs, before its styles, its screens (whose data-i18n they fill) and
 * its code. The code still reads t.<key>, as it always did.
 *
 * A key moves to chunk C only when:
 *
 *  1. Its name is written (as a word: t.key, 'key', data-i18n="key", a list of
 *     keys) in C's files, its screens' markup, or the files of chunks that all
 *     load C - and nowhere else: not in a shell file (the shell's scripts and
 *     lists, the page's markup, GAME_RULES, the stylesheets), not in another
 *     chunk, and not in anything the rooms server runs (every file of FILES in
 *     rooms-worker/build.mjs, rooms-worker/src/): a key the server sends (a
 *     chat event, a log line) can be shown by the shell from a room's history
 *     with the game's chunk never loaded, so it stays.
 *  2. No file outside those builds it from parts: a quoted prefix followed by
 *     + or ${ ('setup_' + id, `ch_piece_${p}`), any quoted string ending in _ or -
 *     (a prefix handed to startsWith or kept for later), or a quoted suffix after
 *     + or } (key + '_line'), anywhere outside C, keeps every key it could build.
 *  3. No chunk defines the key in a text table of its own (RACE_TEXT, XO_TR…:
 *     `key:` in a chunk file), so the order the two are put in can't matter.
 *
 * So shell code can only come to hold a moved key's name from C's code at run
 * time (C has run, its words are in) - or from what C saved on the phone, which
 * the shell reads by its own keys (checked on 8 Oct 2026: the shell's lookups of
 * a key it holds in a variable read its own lists, the room's state behind the
 * room's door, or a caller's argument).
 */
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const WORD = /[A-Za-z_$][\w$]*/g;
const PLAIN_KEY = /^[A-Za-z_$][\w$]*$/;

/** The TRANSLATIONS object of the script: its ar and en ObjectExpressions. */
function translationsAst(code) {
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
  for (const st of ast.body) {
    if (st.type !== 'VariableDeclaration') continue;
    for (const d of st.declarations) {
      if (d.id.name !== 'TRANSLATIONS' || !d.init || d.init.type !== 'ObjectExpression') continue;
      const langs = {};
      for (const p of d.init.properties) {
        const k = p.key && (p.key.name || p.key.value);
        if (p.type !== 'Property' || p.computed || p.value.type !== 'ObjectExpression') throw new Error('text-split: TRANSLATIONS must be { ar: {…}, en: {…} }');
        langs[k] = p.value;
      }
      return langs;
    }
  }
  throw new Error('text-split: no const TRANSLATIONS = {…} in JS_Translations.html');
}

/**
 * owners: [[owner ('shell' or a chunk id), text]] - everything that can name a key.
 * closure(id): the chunks id loads (itself included). chunkFiles: [[chunk, text]] of
 * the chunks' own scripts, to find keys a chunk defines itself.
 * Returns { source: JS_Translations.html without the moved keys,
 *           byChunk: { chunk: '{ar:{…},en:{…}}' (source text) }, stats }.
 */
export function splitWords({ translations, owners, closure, chunkFiles }) {
  const m = /^([\s\S]*?<script\b[^>]*>)([\s\S]*?)(<\/script>[\s\S]*)$/.exec(translations);
  if (!m || /<script\b/.test(m[3])) throw new Error('text-split: JS_Translations.html must be one <script>');
  const [, head, code, tail] = m;
  const langs = translationsAst(code);
  const langIds = Object.keys(langs);
  const props = {};
  for (const l of langIds) {
    props[l] = new Map();
    for (const p of langs[l].properties) {
      if (p.type !== 'Property' || p.computed) throw new Error('text-split: a spread or computed key in TRANSLATIONS');
      props[l].set(p.key.type === 'Identifier' ? p.key.name : String(p.key.value), p);
    }
  }

  // Who names each word; and the prefixes and suffixes keys can be built from.
  const named = new Map();
  const pre = [], suf = [];
  for (const [o, text] of owners) {
    for (const w of text.match(WORD) || []) { let s = named.get(w); if (!s) named.set(w, (s = new Set())); s.add(o); }
    // A prefix is three characters at least (no key starts its own name in fewer: 'cn_',
    // 'mg_h_'), a suffix starts with _ or - ('_line'): shorter pieces are a class, a unit, a sign.
    for (const x of text.matchAll(/(['"`])([\w$-]{3,})\1\s*\+/g)) pre.push([o, x[2]]);
    for (const x of text.matchAll(/`([\w$-]{3,})\$\{/g)) pre.push([o, x[1]]);
    for (const x of text.matchAll(/(['"`])([\w$]{2,}[_-])\1/g)) pre.push([o, x[2]]);
    for (const x of text.matchAll(/\+\s*(['"`])([_-][\w$-]+)\1/g)) suf.push([o, x[2]]);
    for (const x of text.matchAll(/\}([_-][\w$-]+)`/g)) suf.push([o, x[1]]);
  }
  // Keys of an object literal in a chunk's code (a text table of its own).
  const selfDefined = new Set();
  for (const [, src] of chunkFiles) {
    const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true });
    walk.simple(ast, { Property(p) { if (!p.computed && p.key) selfDefined.add(p.key.type === 'Identifier' ? p.key.name : String(p.key.value)); } });
  }

  const moved = new Map();   // key -> chunk
  // Why each key that stays stays (named by the shell, a prefix or suffix the shell builds keys
  // from, defined by a chunk, read by chunks none of which loads the others): chunkWords(…).reasons.
  const reasons = {};
  const why = (r, k) => { (reasons[r] ||= []).push(k); };
  const keys = [...props[langIds[0]].keys()];
  for (const k of keys) {
    if (!PLAIN_KEY.test(k) || langIds.some((l) => !props[l].has(k))) { why('odd', k); continue; }
    if (selfDefined.has(k)) { why('self', k); continue; }
    const who = new Set(named.get(k) || []);
    if (who.has('shell')) { why('named', k); continue; }
    for (const [o, p] of pre) if (p !== k && k.startsWith(p)) { if (o === 'shell' && !who.has('shell')) why('pre:' + p, k); who.add(o); }
    for (const [o, s] of suf) if (s !== k && k.endsWith(s)) { if (o === 'shell' && !who.has('shell')) why('suf:' + s, k); who.add(o); }
    if (!who.size) { why('unnamed', k); continue; }
    if (who.has('shell')) continue;
    const list = [...who];
    const home = list.find((c) => list.every((o) => closure(o).has(c)));
    if (home) moved.set(k, home); else why('chunks', k);
  }

  // The page's TRANSLATIONS without them: each kept entry exactly as written.
  let out = code;
  const cuts = [];
  for (const l of langIds) {
    const obj = langs[l];
    const kept = obj.properties.filter((p) => !moved.has(p.key.type === 'Identifier' ? p.key.name : String(p.key.value)));
    cuts.push([obj.start, obj.end, '{\n' + kept.map((p) => '      ' + code.slice(p.start, p.end)).join(',\n') + '\n    }']);
  }
  cuts.sort((a, b) => b[0] - a[0]).forEach(([s, e, r]) => { out = out.slice(0, s) + r + out.slice(e); });

  const byChunk = {};
  const per = {};
  for (const [k, c] of moved) (per[c] ||= []).push(k);
  for (const [c, ks] of Object.entries(per)) {
    byChunk[c] = '{' + langIds.map((l) => `${l}:{` + ks.map((k) => code.slice(props[l].get(k).start, props[l].get(k).end)).join(',') + '}').join(',') + '}';
  }
  return { source: head + out + tail, byChunk, stats: { keys: keys.length, moved: moved.size, chunks: Object.keys(byChunk).length }, reasons };
}
