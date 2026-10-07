/**
 * Each game's styles travel with its code (the owner's B2, 7 Oct 2026). Used by
 * lazy-split.mjs: the stylesheet parts (Style*.html) stay as they are written, and
 * the build takes out of the page every rule it can prove belongs to one game's
 * chunk alone, and gives it to that chunk (lzStyle in JS_Lazy.html puts it at the
 * end of <body> as the chunk runs, before its screens and code).
 *
 * Why it has to be proved, rule by rule: the parts are one cascade. Later
 * sections restyle earlier ones (the arcade look, its reviews), so a rule that
 * moves to the end of the page wins every tie it used to lose. A rule moves only
 * when both hold:
 *
 *  1. It matches only that game's elements. Every selector in its list names, in
 *     one of its compounds (not inside :not, :has, :is or :where), a class or id
 *     that only that chunk's files write - its JS_*.html, its lists, its screens'
 *     markup (lazy-split.mjs moves those too). Such an element is in the page
 *     only once the chunk has run, and the rule is in the page from then on.
 *  2. Nothing it ties with comes after it. For each of its declarations, no rule
 *     that stays in the page after it, and no rule that moves to another chunk,
 *     sets a property of the same family with the same importance, with a selector
 *     of the same specificity whose subject could be the same element (its classes
 *     and ids are all ones this game's elements can carry: written by the shell, by
 *     this chunk or a chunk it loads or that loads it; a subject with none could be
 *     anything). A tie is decided by order, and only a tie.
 *
 * A @keyframes moves with its game when its name is defined once and only that
 * game's moved rules (and its files) name it. @media, @supports and @container
 * wrap what they wrapped. Anything else (@property, @font-face) stays.
 *
 * Tailwind's utilities come before every part, so no rule of theirs is ever after.
 */
import postcss from 'postcss';
import * as acorn from 'acorn';
import selectorParser from 'postcss-selector-parser';

const WRAPPERS = new Set(['media', 'supports', 'container']);

/* Classes the shell's code adds (classList.add) only to elements that never carry a game's own
   class, checked by hand on 7 Oct 2026; any other class the shell adds is taken to be possible
   on any element. */
export const SHELL_PUTS_CHECKED = {
  'modal-ghost': "modalExitGhost's copy of a popup's overlay (every popup's overlay is modal-overlay, hidden, or qm-sheet)",
  'modal-overlay--ghost': 'the same copy',
  'motion-row-ghost': "motionRowsSwap's leaving row: the rows of a room's lobby (JS_Room.html) and the counter's (JS_Utils.html), the shell's markup"
};

/** The family a property's ties are decided in: a shorthand and its longhands are one. */
function family(prop) {
  const p = prop.toLowerCase().replace(/^-(webkit|moz|ms)-/, '');
  if (p.startsWith('--')) return p;
  if (/^(inset|top|right|bottom|left)(-|$)/.test(p)) return 'inset';
  if (/^(width|height|inline-size|block-size|min-|max-)/.test(p)) return 'size';
  if (/^(place|align|justify)-/.test(p)) return 'align';
  if (/^(gap|row-gap|column-gap|grid)/.test(p)) return 'grid';
  if (/^(font|line-height)/.test(p)) return 'font';
  if (/^(transform|translate|rotate|scale)/.test(p)) return 'transform';
  if (/^(overflow)/.test(p)) return 'overflow';
  return p.split('-')[0];
}

/** Specificity as [ids, classes, types], of a selector node (postcss-selector-parser). */
function specOf(sel) {
  let a = 0, b = 0, c = 0;
  const max = (list) => list.reduce((m, s) => { const x = specOf(s); return cmpSpec(x, m) > 0 ? x : m; }, [0, 0, 0]);
  for (const n of sel.nodes) {
    if (n.type === 'id') a++;
    else if (n.type === 'class' || n.type === 'attribute') b++;
    else if (n.type === 'tag') c++;
    else if (n.type === 'pseudo') {
      const name = n.value.toLowerCase();
      if (name.startsWith('::') || /^:(before|after|first-line|first-letter)$/.test(name)) c++;
      else if (name === ':where') { /* nothing */ }
      else if (/^:(not|is|has|matches|-webkit-any)$/.test(name)) { const m = max(n.nodes); a += m[0]; b += m[1]; c += m[2]; }
      else if (/^:nth-(last-)?child$/.test(name) && n.nodes.length > 1) { const m = max(n.nodes.slice(1)); a += m[0]; b += m[1] + 1; c += m[2]; }
      else b++;
    }
  }
  return [a, b, c];
}
const cmpSpec = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];

/** A selector's facts: its specificity, the classes and ids it requires (outside pseudo arguments), and its subject's. */
function selectorFacts(text) {
  const out = [];
  selectorParser((root) => {
    root.each((sel) => {
      const required = [], subject = { tokens: [], tag: null, pe: '' };
      let current = [];
      const compounds = [current];
      for (const n of sel.nodes) {
        if (n.type === 'combinator') { current = []; compounds.push(current); continue; }
        current.push(n);
      }
      compounds.forEach((nodes, i) => {
        for (const n of nodes) {
          if (n.type === 'class') required.push('.' + n.value);
          if (n.type === 'id') required.push('#' + n.value);
        }
        if (i === compounds.length - 1) {
          for (const n of nodes) {
            if (n.type === 'class') subject.tokens.push('.' + n.value);
            if (n.type === 'id') subject.tokens.push('#' + n.value);
            if (n.type === 'attribute') subject.tokens.push('[' + n.attribute);
            if (n.type === 'tag') subject.tag = n.value.toLowerCase();
            // ::before and ::after are boxes of their own: they tie only with each other's kind.
            if (n.type === 'pseudo' && (/^::/.test(n.value) || /^:(before|after|first-line|first-letter)$/i.test(n.value))) subject.pe = n.value.replace(/^::?/, '::').toLowerCase();
          }
        }
      });
      out.push({ spec: specOf(sel), required, subject });
    });
  }).processSync(text);
  return out;
}

/** The words of a source (class names, ids, the prefixes code builds names from). */
const WORD = /[A-Za-z_][\w-]*/g;

/* Where a class name can be written: the strings of the code (a class is put on an element as
   a string: markup in a template, classList, className) and the values of the markup's
   attributes - never a name in the code or a comment, or every class called "tour" or "ex"
   would be written by every file that has a variable of that name. */
function stringsOf(kind, text) {
  const out = [];
  const js = (src) => {
    try {
      for (const t of acorn.tokenizer(src, { ecmaVersion: 'latest', allowHashBang: true })) {
        if (t.type === acorn.tokTypes.string || t.type === acorn.tokTypes.template) out.push(String(t.value));
      }
    } catch (e) { out.push(src); }   // unreadable: every word counts (the safe side)
  };
  if (kind === 'js') js(text);
  else {
    const scripts = [];
    const markup = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (m, code) => { scripts.push(code); return ' '; });
    scripts.forEach(js);
    // A tag's names and values (an attribute selector names an attribute), not the text between tags.
    for (const m of markup.matchAll(/<[a-zA-Z][^>]*>/g)) out.push(m[0]);
  }
  return out.join('\n');
}

/**
 * styleParts: [[name, html]] in the page's order. owners: [[owner, kind, text]] where owner is
 * 'shell' or a chunk id and kind 'js' or 'html' (every page script, list and piece of markup).
 * related(c): the chunks that can be in the page with c's elements (it loads them or they load it).
 * Returns { parts: Map(name -> html), byChunk: { chunk: css }, stats, explain }.
 */
export function splitStyles({ styleParts, owners, related, closure }) {
  // Who writes each word.
  const wordOwners = new Map();
  for (const [owner, kind, text] of owners) for (const m of stringsOf(kind, text).matchAll(WORD)) {
    let s = wordOwners.get(m[0]);
    if (!s) wordOwners.set(m[0], (s = new Set()));
    s.add(owner);
  }
  // The classes each piece of code adds to elements it may not have made (classList.add / toggle /
  // replace, className +=). className = … sets every class at once, so it writes an element's
  // classes as its markup does.
  const puts = new Map();   // owner -> Set of words
  for (const [owner, , text] of owners) {
    let s = puts.get(owner);
    if (!s) puts.set(owner, (s = new Set()));
    for (const m of text.matchAll(/classList\.(?:add|toggle|replace)\(([^)]*)\)|className\s*\+=\s*([^;\n]*)/g)) {
      for (const q of (m[1] || m[2] || '').matchAll(/(['"`])([^'"`]*)\1/g)) for (const w of q[2].matchAll(WORD)) s.add(w[0]);
    }
  }
  /** Who writes a class or id: the name itself, or the longest prefix code builds it from ('ludo-av--' + c). */
  const tokenOwners = (tok) => {
    const name = tok.slice(1);
    if (wordOwners.has(name)) return wordOwners.get(name);
    for (let i = name.length - 2; i >= 3; i--) {
      if (name[i] !== '-' && name[i] !== '_') continue;
      const pre = name.slice(0, i + 1);
      if (wordOwners.has(pre)) return wordOwners.get(pre);
    }
    return null;
  };
  /* Of a set of chunks, the one every other one loads (chess, of chess and chessrooms:
     chessrooms never runs without it); null when there is none. */
  const common = (set) => [...set].find((x) => [...set].every((d) => closure(d).has(x))) || null;
  /* The one that each of them is loaded with: of chess and chessrooms, chessrooms (a selector
     that needs both matches only once chessrooms, and so chess, is in). */
  const highest = (set) => [...set].find((x) => [...set].every((d) => closure(x).has(d))) || null;
  /* The chunk whose elements alone carry a token: the one chunk that writes it, or, when
     several do, the one each of them loads. */
  const ownCache = new Map();
  const ownChunk = (tok) => {
    if (ownCache.has(tok)) return ownCache.get(tok);
    const o = tokenOwners(tok);
    const c = o && !o.has('shell') ? common(o) : null;
    ownCache.set(tok, c);
    return c;
  };
  const relatedCache = new Map();
  const reach = (c) => {
    if (!relatedCache.has(c)) relatedCache.set(c, new Set(['shell', ...related(c)]));
    return relatedCache.get(c);
  };
  /** Whether an element inside chunk c's markup can carry the token: written by the shell or a chunk that runs with c. */
  const reachable = (tok, c) => {
    if (tok[0] === '[') return true;   // an attribute: dataset and setAttribute write them under other names
    const o = tokenOwners(tok);
    if (!o) return false;   // nothing writes it: no element has it
    const r = reach(c);
    for (const x of o) if (r.has(x)) return true;
    return false;
  };
  /* Whether an element that carries `own` (a class only chunk c's elements carry) can carry `tok`
     as well. An element's classes are written together, by the code that makes it (its markup,
     a template, className =), so `tok` has to be written by one of the writers of `own`; or it is
     added afterwards (classList) by code that runs with c - the shell's own additions as checked
     in SHELL_PUTS_CHECKED. An attribute may be set by anyone. */
  const together = (tok, own, c) => {
    if (tok[0] === '[') return true;
    const o = tokenOwners(tok);
    if (!o) return false;
    const writers = tokenOwners(own) || new Set();
    for (const w of writers) if (o.has(w)) return true;
    const name = tok.slice(1);
    for (const x of reach(c)) {
      const p = puts.get(x);
      if (p && p.has(name) && !(x === 'shell' && SHELL_PUTS_CHECKED[name])) return true;
    }
    return false;
  };

  // Every rule, in the page's order, with what it is wrapped in.
  const units = [];
  const roots = new Map();
  const keyframes = new Map();   // name -> [{ node, part }]
  styleParts.forEach(([name, html]) => {
    const m = /^([\s\S]*?<style[^>]*>)([\s\S]*)(<\/style>[\s\S]*)$/.exec(html);
    if (!m) throw new Error(`css-split: ${name} isn't one <style> block`);
    const root = postcss.parse(m[2]);
    roots.set(name, { root, head: m[1], tail: m[3] });
    const visit = (container, wraps) => {
      container.each((node) => {
        if (node.type === 'rule') units.push({ node, part: name, wraps, i: units.length });
        else if (node.type === 'atrule' && WRAPPERS.has(node.name.toLowerCase())) visit(node, wraps.concat([`@${node.name} ${node.params}`]));
        else if (node.type === 'atrule' && /keyframes$/i.test(node.name)) {
          if (!keyframes.has(node.params)) keyframes.set(node.params, []);
          keyframes.get(node.params).push({ node, part: name, wraps });
        }
      });
    };
    visit(root, []);
  });

  // 1. Whose is each rule? A selector needs the elements of the chunks of its own tokens; it
  // belongs to the one of them that is loaded with all the others.
  for (const u of units) {
    u.decls = [];
    u.node.each((d) => { if (d.type === 'decl') u.decls.push({ fam: family(d.prop), imp: !!d.important, prop: d.prop, value: d.value }); });
    try { u.sels = selectorFacts(u.node.selector); } catch (e) { u.sels = null; }
    if (!u.sels || !u.sels.length) { u.chunk = null; continue; }
    let chunk;
    for (const s of u.sels) {
      const mine = new Set(s.required.map(ownChunk).filter(Boolean));
      const c = mine.size ? highest(mine) : null;
      if (!c) { chunk = null; break; }
      if (chunk === undefined) chunk = c; else if (chunk !== c) { chunk = null; break; }
    }
    u.chunk = chunk || null;
  }
  const byFamily = new Map();
  for (const u of units) for (const d of u.decls) {
    const fams = d.fam === 'all' ? ['*'] : [d.fam];
    for (const f of fams) { if (!byFamily.has(f)) byFamily.set(f, new Set()); byFamily.get(f).add(u); }
  }
  const allRules = byFamily.get('*') || new Set();

  // 2. Ties: drop a candidate that ties with a rule after it that doesn't move with it, or with one
  // that moves to another chunk, until nothing changes.
  const moving = new Set(units.filter((u) => u.chunk));
  /** A selector that needs a token only an unrelated chunk's elements carry never matches inside c's markup. */
  const foreign = (s, c) => s.required.some((t) => { const d = ownChunk(t); return d && d !== c && !reach(c).has(d); });
  const couldMatch = (x, u) => {
    // x's selectors against u's: the same specificity, and a subject that can be u's element.
    for (const sx of x.sels || []) for (const su of u.sels) {
      if (cmpSpec(sx.spec, su.spec) !== 0) continue;
      if (sx.subject.pe !== su.subject.pe) continue;
      if (sx.subject.tag && su.subject.tag && sx.subject.tag !== su.subject.tag) continue;
      if (foreign(sx, u.chunk)) continue;
      const own = su.subject.tokens.find((t) => t[0] !== '[' && ownChunk(t) && reach(u.chunk).has(ownChunk(t)));
      if (sx.subject.tokens.every((t) => (own ? together(t, own, u.chunk) : reachable(t, u.chunk)))) return true;
    }
    return false;
  };
  const ties = (u, x) => {
    if (x === u || (moving.has(x) && x.chunk === u.chunk)) return false;
    if (!moving.has(x) && x.i < u.i) return false;   // before it, and it stays before it
    if (!x.sels) return true;                          // unparsed: assume the worst
    for (const d of u.decls) for (const e of x.decls) {
      if (d.imp !== e.imp) continue;
      if (d.fam !== e.fam && d.fam !== 'all' && e.fam !== 'all') continue;
      if (couldMatch(x, u)) return true;
    }
    return false;
  };
  const why = new Map();
  for (let changed = true; changed;) {
    changed = false;
    for (const u of [...moving]) {
      const seen = new Set();
      const fams = new Set(u.decls.map((d) => d.fam));
      let hit = null;
      const lists = fams.has('all') ? [new Set(units)] : [...fams].map((f) => byFamily.get(f) || new Set()).concat([allRules]);
      for (const list of lists) {
        for (const x of list) { if (seen.has(x)) continue; seen.add(x); if (ties(u, x)) { hit = x; break; } }
        if (hit) break;
      }
      if (hit) { moving.delete(u); why.set(u, hit); changed = true; }
    }
  }

  // 3. Keyframes: a name defined once, named only by one chunk's moving rules and files.
  const kfMoving = new Map();
  const animNames = (u) => u.decls.filter((d) => /^(-webkit-)?animation(-name)?$/.test(d.prop)).flatMap((d) => d.value.split(/[\s,]+/));
  const namedBy = new Map();
  for (const u of units) for (const n of animNames(u)) { if (!namedBy.has(n)) namedBy.set(n, []); namedBy.get(n).push(u); }
  for (const [name, defs] of keyframes) {
    if (defs.length !== 1) continue;
    const users = namedBy.get(name) || [];
    if (!users.length || !users.every((u) => moving.has(u))) continue;
    const chunks = new Set(users.map((u) => u.chunk));
    if (chunks.size !== 1) continue;
    const [c] = chunks;
    const o = wordOwners.get(name);
    if (o && [...o].some((x) => x !== c)) continue;
    kfMoving.set(defs[0].node, c);
  }

  // 4. Out of the page, into the chunks, in the page's order.
  const pieces = [];
  for (const u of moving) pieces.push({ node: u.node, chunk: u.chunk, wraps: u.wraps, part: u.part });
  for (const [, defs] of keyframes) for (const d of defs) if (kfMoving.has(d.node)) pieces.push({ node: d.node, chunk: kfMoving.get(d.node), wraps: d.wraps, part: d.part });
  const partIndex = new Map(styleParts.map(([n], i) => [n, i]));
  pieces.sort((a, b) => partIndex.get(a.part) - partIndex.get(b.part) || a.node.source.start.offset - b.node.source.start.offset);
  // Each chunk's pieces in order; neighbours (in that chunk) under the same wrappers share one block.
  const groups = {};
  const stats = {};
  for (const p of pieces) {
    const list = (groups[p.chunk] ||= []);
    const key = p.wraps.join('|');
    const last = list[list.length - 1];
    if (last && last.key === key) last.items.push(p.node.toString().trim());
    else list.push({ key, wraps: p.wraps, items: [p.node.toString().trim()] });
    stats[p.chunk] = (stats[p.chunk] || 0) + p.node.toString().length;
  }
  const byChunk = {};
  for (const [c, list] of Object.entries(groups)) {
    byChunk[c] = list.map((g) => g.wraps.reduceRight((inner, w) => w + ' {\n' + inner + '\n}', g.items.join('\n'))).join('\n');
  }
  for (const p of pieces) {
    const parent = p.node.parent;
    p.node.remove();
    // A wrapper left empty goes too.
    for (let w = parent; w && w.type === 'atrule' && !w.nodes.length;) { const up = w.parent; w.remove(); w = up; }
  }
  const parts = new Map();
  for (const [name, { root, head, tail }] of roots) parts.set(name, head + root.toString() + tail);
  const kept = units.filter((u) => u.chunk && !moving.has(u));
  return {
    parts,
    byChunk,
    stats: { moved: stats, rules: moving.size, keyframes: kfMoving.size, owned: units.filter((u) => u.chunk).length, kept: kept.length },
    explain: (filter) => kept.filter((u) => !filter || u.chunk === filter).map((u) => `${u.chunk}: ${u.node.selector.replace(/\s+/g, ' ')}  ⟂  ${why.get(u) ? why.get(u).node.selector.replace(/\s+/g, ' ') + ' (' + why.get(u).part + ')' : '?'}`)
  };
}
