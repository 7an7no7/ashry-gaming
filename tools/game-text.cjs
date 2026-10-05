/**
 * Each game's own words, in its folder (5 Oct 2026).
 *
 * A game's strings - the keys only its own files read - and its rules for Help
 * and the first-play card live beside its code, in games/<id>/<id>.text.js:
 *
 *   gameText({
 *     translations: {
 *       ar: {
 *         uno_draw: "اسحب",
 *       },
 *       en: {
 *         uno_draw: "Draw",
 *       },
 *     },
 *     rules: {
 *       ar: {
 *         uno: `<ol>…</ol>`,
 *       },
 *       en: {
 *         uno: `<ol>…</ol>`,
 *       },
 *     },
 *   });
 *
 * The page has one TRANSLATIONS (app/JS_Translations.html) and one GAME_RULES
 * (app/JS_GameRules.html), as before: the build puts every game's entries
 * into them where their `/* @game-text ar *\/` and `/* @game-text en *\/`
 * markers are (tools/lazy-split.mjs readPage, through mergeGameText), so the
 * app reads t.uno_draw and GAME_RULES.ar.uno exactly as it always did. Words
 * more than one game (or the app) uses stay in JS_Translations.html.
 *
 * Every tool that reads those two files reads them merged: check:i18n, the
 * names check, the share pictures (make-og.mjs). A key in two places (the app
 * and a game, or two games) is a key defined twice in one block, and
 * check:i18n fails on it.
 */
const fs = require('fs');
const acorn = require('acorn');
const { srcFiles, srcPath, srcRel } = require('./sources.cjs');

/** The two files that take games' entries, and the part of a text file each takes. */
const TARGETS = {
  'JS_Translations.html': { part: 'translations', indent: '      ' },
  'JS_GameRules.html': { part: 'rules', indent: '        ' }
};

/** Every game's text file, by name, in folder order. */
function gameTextFiles() {
  return srcFiles(/\.text\.js$/).sort((a, b) => srcRel(a).localeCompare(srcRel(b)));
}

/**
 * One text file: { translations: { ar: [{ key, src }], en: [...] }, rules: {...} },
 * each entry's source exactly as written (a rule's HTML keeps its own spacing).
 */
function readGameText(name, text) {
  const src = (text == null ? fs.readFileSync(srcPath(name), 'utf8') : text).replace(/\r\n/g, '\n');
  let ast;
  try { ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' }); }
  catch (e) { throw new Error(`${srcRel(name)} doesn't parse: ${e.message}`); }
  const call = ast.body.length === 1 && ast.body[0].type === 'ExpressionStatement' && ast.body[0].expression;
  if (!call || call.type !== 'CallExpression' || call.callee.name !== 'gameText' || call.arguments.length !== 1 || call.arguments[0].type !== 'ObjectExpression') {
    throw new Error(`${srcRel(name)}: a game's text file is one gameText({ translations, rules }) call`);
  }
  const keyOf = (p) => p.key.type === 'Identifier' ? p.key.name : String(p.key.value);
  const out = {};
  for (const part of call.arguments[0].properties) {
    const partName = keyOf(part);
    if (!Object.values(TARGETS).some((t) => t.part === partName)) throw new Error(`${srcRel(name)}: '${partName}' is neither translations nor rules`);
    out[partName] = {};
    for (const lang of part.value.properties) {
      const l = keyOf(lang);
      if (l !== 'ar' && l !== 'en') throw new Error(`${srcRel(name)}: ${partName}.${l}: only ar and en`);
      out[partName][l] = lang.value.properties.map((p) => {
        if (p.type !== 'Property' || p.computed || p.kind !== 'init') throw new Error(`${srcRel(name)}: ${partName}.${l}: plain key: value entries only`);
        return { key: keyOf(p), src: src.slice(p.start, p.end) };
      });
    }
  }
  return out;
}

/**
 * The source of JS_Translations.html or JS_GameRules.html with every game's
 * entries in place of its markers; any other file comes back as it was.
 */
function mergeGameText(name, src) {
  const target = TARGETS[name];
  if (!target) return src;
  const texts = new Map(gameTextFiles().map((f) => [f.replace(/\.text\.js$/, ''), { f, t: readGameText(f) }]));
  const used = new Set();
  // `/* @game-text ar uno */` is where uno's Arabic entries go: where they were
  // before they moved, so the words of the app and of each game keep their order
  // (and the page compresses as well as it did: 6 KB more with every game at the end).
  src = src.replace(/^[ \t]*\/\* @game-text (ar|en) ([\w-]+) \*\/[ \t]*\n/gm, (m, lang, id) => {
    const text = texts.get(id);
    if (!text) throw new Error(`${name}: /* @game-text ${lang} ${id} */ names no games/${id}/${id}.text.js`);
    const entries = (text.t[target.part] || {})[lang] || [];
    if (!entries.length) throw new Error(`${name}: /* @game-text ${lang} ${id} */, but ${srcRel(text.f)} has no ${target.part}.${lang}`);
    if (used.has(lang + ' ' + id)) throw new Error(`${name}: /* @game-text ${lang} ${id} */ twice`);
    used.add(lang + ' ' + id);
    return [`${target.indent}// ${srcRel(text.f)}`].concat(entries.map((e) => `${target.indent}${e.src},`)).join('\n') + '\n';
  });
  for (const [id, { f, t }] of texts) {
    for (const lang of ['ar', 'en']) {
      if (((t[target.part] || {})[lang] || []).length && !used.has(lang + ' ' + id)) {
        throw new Error(`${srcRel(f)} has ${target.part}.${lang}, but ${name} has no /* @game-text ${lang} ${id} */ to put it at`);
      }
    }
  }
  return src;
}

/** Reads a source file by name, merged when it is one of the two. */
function readMerged(name) {
  return mergeGameText(name, fs.readFileSync(srcPath(name), 'utf8').replace(/\r\n/g, '\n'));
}

module.exports = { TARGETS, gameTextFiles, readGameText, mergeGameText, readMerged };
