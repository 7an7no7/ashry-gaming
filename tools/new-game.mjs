/**
 * A new game, wired in everywhere (5 Oct 2026; npm run new:game).
 *
 *   npm run new:game -- <id> --ar "اسم اللعبة" --en "Game name" [options]
 *
 *   --modes room | device | room,device   rooms and the TV (default), one phone, or both
 *   --icon 🎯          its icon (an emoji; draw it in ICON_ART later for a real one)
 *   --accent teal      its colour: violet indigo blue teal green amber orange rose pink
 *   --group party      its home section (deduce words party quiz table duo sports puzzle brain)
 *   --crew fast        the title of الشلة a win counts toward (CREW_TITLES in Crew.js)
 *   --players 2-12     how many play;  --mins 10  how long, roughly
 *   --dry              say what it would write, write nothing
 *
 * It makes games/<id>/ - the game's code, its words and rules (<id>.text.js) -
 * and puts its line in every list a game has to be in (GEMINI.md, *A new game,
 * start to finish*): GAME_LIST, «الليلة دي؟», the page's screens and include,
 * VIEW_META, Help, the markers for its words and rules, its chunk, the rooms
 * server's FILES, the robots, the leak check, test:changed, its notes file
 * and its line in GEMINI.md's index. A room game registers its rules itself
 * (ROOM_RULES in RoomGames.js), and a one-phone game its way back after a
 * reload (VIEW_RESTORE in JS_Core.html), so the engine's own files only gain
 * a line where a list is a list.
 *
 * What it writes is a small working game, not an empty one, so every check
 * and test passes from the first minute: each person has a secret number on
 * their own phone, taps «+1» until they think they reached it, and the
 * nearest wins (on one phone: the same, passed round). Replace it with the
 * real game - after the owner has answered its rules and picked its look
 * (GEMINI.md, *How we work*).
 */
import fs from 'node:fs';
import path from 'node:path';
import * as acorn from 'acorn';
import srcMod from './sources.cjs';

const { ROOT, srcPath, srcHas } = srcMod;

/* --- the request --------------------------------------------------------------- */

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i === -1 ? dflt : args[i + 1]; };
const DRY = args.includes('--dry');
const VALUED = ['ar', 'en', 'modes', 'icon', 'accent', 'group', 'crew', 'players', 'mins'];
const id = args.find((a, i) => !a.startsWith('--') && !(i > 0 && VALUED.includes(args[i - 1].slice(2))));
const fail = (msg) => { console.error('new-game: ' + msg); process.exit(1); };
if (!id) fail('usage: npm run new:game -- <id> --ar "اسم" --en "Name" [--modes room|device|room,device] [--icon 🎯] [--accent teal] [--group party] [--crew fast] [--players 2-12] [--mins 10] [--dry]');
if (!/^[a-z][a-z0-9]{2,15}$/.test(id)) fail(`'${id}': an id is 3-16 lower-case letters and digits, starting with a letter`);
const nameAr = opt('ar'), nameEn = opt('en');
if (!nameAr || !nameEn) fail('--ar and --en: its name in Arabic and in English');
const modes = (opt('modes', 'room')).split(',').map((m) => m.trim());
if (!modes.every((m) => m === 'room' || m === 'device')) fail('--modes: room, device, or room,device');
const ROOM = modes.includes('room'), DEVICE = modes.includes('device');
const icon = opt('icon', '🎲');
const accent = opt('accent', 'teal');
if (!['violet', 'indigo', 'blue', 'teal', 'green', 'amber', 'orange', 'rose', 'pink'].includes(accent)) fail(`--accent ${accent}: not one of the palettes`);
const group = opt('group', 'party');
const crew = opt('crew', 'fast');
const [pMin, pMax] = (opt('players', ROOM ? '2-12' : '1-8')).split('-').map(Number);
const mins = Number(opt('mins', '10'));
const P = id[0].toUpperCase() + id.slice(1);          // file names: JS_<P>.html, Room<P>.js
const ID = id.toUpperCase();
const today = new Date().toISOString().slice(0, 10);

/* --- is the name free? ------------------------------------------------------------ */

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const gamesJs = read('app/Games.js');
const GL = new Function(gamesJs + '\nreturn { GAME_LIST, ROOM_GAME_IDS };')();
if (GL.GAME_LIST.some((g) => g.id === id) || GL.ROOM_GAME_IDS.includes(id)) fail(`'${id}' is already a game`);
if (fs.existsSync(path.join(ROOT, 'games', id))) fail(`games/${id}/ already exists`);
const titles = new Function(read('games/crew/Crew.js') + '\nreturn CREW_TITLES;')();
if (ROOM && !titles.includes(crew)) fail(`--crew ${crew}: not a title in CREW_TITLES (${titles.join(', ')})`);
for (const f of [`JS_${P}.html`, `JS_Room${P}.html`, `Room${P}.js`]) if (srcHas(f)) fail(`${f} already exists`);
// The name taken anywhere a game is known by it (GEMINI.md, *A name the app already uses is taken in every file*).
const taken = [['app/JS_Utils.html', `key: '${id}'`], ['app/JS_Core.html', `'setup-${id}'`], ['app/JS_Core.html', `'room-${id}'`],
  ['app/Controller.html', `view-room-${id}"`], ['app/Controller.html', `view-setup-${id}"`]];
for (const [f, needle] of taken) if (read(f).includes(needle)) fail(`'${id}' is already used in ${f} (${needle})`);

/* --- editing a list in place ------------------------------------------------------- */

const writes = new Map();   // rel -> new text (edits pile up on the same file)
const text = (rel) => (writes.has(rel) ? writes.get(rel) : read(rel));
const put = (rel, s) => writes.set(rel, s);

/** The scripts of a file, with where each starts: an .html file's <script> blocks, a .js file whole. */
function scripts(rel, src) {
  if (!rel.endsWith('.html')) return [{ code: src, at: 0 }];
  return [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => ({ code: m[1].replace(/<\?!?=[\s\S]*?\?>/g, (x) => ' '.repeat(x.length)), at: m.index + '<script>'.length }));
}

/** The literal a top-level `const NAME =` (or `export const`) holds: { node, at } (positions in the file). */
function literalOf(rel, name) {
  const src = text(rel);
  for (const s of scripts(rel, src)) {
    let ast;
    try { ast = acorn.parse(s.code, { ecmaVersion: 'latest', sourceType: /\.mjs$/.test(rel) ? 'module' : 'script', allowReturnOutsideFunction: true }); }
    catch (e) { continue; }
    for (const st of ast.body) {
      const d = st.type === 'ExportNamedDeclaration' ? st.declaration : st;
      if (!d || d.type !== 'VariableDeclaration') continue;
      const dec = d.declarations.find((x) => x.id.name === name);
      if (dec) return { node: dec.init, at: s.at };
    }
  }
  throw new Error(`${rel}: no const ${name} found`);
}

/** Adds `lines` (each a whole line, indented) at the end of an array or object literal, one item per line. */
function appendLines(rel, node, at, lines) {
  let src = text(rel);
  const items = node.type === 'ArrayExpression' ? node.elements : node.properties;
  const last = items[items.length - 1];
  const close = at + node.end - 1;
  const lineStart = src.lastIndexOf('\n', close - 1) + 1;
  // The last item needs its comma.
  const afterLast = src.slice(at + last.end, lineStart);
  if (!/^\s*,/.test(afterLast)) src = src.slice(0, at + last.end) + ',' + src.slice(at + last.end);
  const shift = /^\s*,/.test(afterLast) ? 0 : 1;
  const ls = lineStart + shift;
  src = src.slice(0, ls) + lines.map((l) => l + '\n').join('') + src.slice(ls);
  put(rel, src);
}
/** The same at the end of a one-line list: `, 'x'` after its last item. */
function appendInline(rel, node, at, itemSrc) {
  const src = text(rel);
  const items = node.type === 'ArrayExpression' ? node.elements : node.properties;
  const end = at + items[items.length - 1].end;
  put(rel, src.slice(0, end) + ', ' + itemSrc + src.slice(end));
}
function appendTo(rel, name, lines) { const { node, at } = literalOf(rel, name); appendLines(rel, node, at, lines); }
/** Into the `lang` block of a `{ ar: {…}, en: {…} }` literal. */
function appendToLang(rel, name, lang, lines) {
  const { node, at } = literalOf(rel, name);
  const block = node.properties.find((p) => (p.key.name || p.key.value) === lang).value;
  // A block whose last line is a game's marker: a plain line after it.
  const src = text(rel);
  const close = at + block.end - 1;
  const lineStart = src.lastIndexOf('\n', close - 1) + 1;
  put(rel, src.slice(0, lineStart) + lines.map((l) => l + '\n').join('') + src.slice(lineStart));
}
/** A line before `anchor` (a whole line that must be there exactly once). */
function insertBefore(rel, anchor, lines) {
  const src = text(rel);
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(`${rel}: the anchor ${JSON.stringify(anchor.trim())} is there ${n} times, not once`);
  const i = src.indexOf(anchor);
  put(rel, src.slice(0, i) + lines.map((l) => l + '\n').join('') + src.slice(i));
}
const create = (rel, s) => { if (fs.existsSync(path.join(ROOT, rel))) throw new Error(rel + ' exists'); put(rel, s); };

/* --- the game's own files ---------------------------------------------------------------- */

const q = (s) => JSON.stringify(s);
const words = {
  ar: {
    [`setup_${id}`]: nameAr,
    [`cat_${id}`]: 'رقم سري لكل واحد: دوس لحد ما توصله، والأقرب يكسب',
    [`${id}_your_number`]: 'رقمك السري',
    [`${id}_tap`]: '+1',
    [`${id}_done`]: 'خلصت',
    [`${id}_wait`]: 'مستنيين الباقيين…',
    [`${id}_finish`]: 'خلّص الجولة',
    [`${id}_result`]: 'النتيجة',
    [`${id}_of`]: 'من',
    [`${id}_lobby_hint`]: 'كل واحد هيجيله رقم سري على موبايله. دوس +1 لحد ما توصله، وبعدين خلصت.',
    [`${id}_tv_wait`]: 'كل واحد بيعدّ على موبايله',
    [`${id}_turn_of`]: 'الدور على',
    [`${id}_pass`]: 'ادّي الموبايل لـ',
    [`${id}_show`]: 'وريني رقمي'
  },
  en: {
    [`setup_${id}`]: nameEn,
    [`cat_${id}`]: 'A secret number each: tap until you reach it, the nearest wins',
    [`${id}_your_number`]: 'Your secret number',
    [`${id}_tap`]: '+1',
    [`${id}_done`]: 'Done',
    [`${id}_wait`]: 'Waiting for the others…',
    [`${id}_finish`]: 'End the round',
    [`${id}_result`]: 'The result',
    [`${id}_of`]: 'of',
    [`${id}_lobby_hint`]: 'Everyone gets a secret number on their phone. Tap +1 until you reach it, then Done.',
    [`${id}_tv_wait`]: 'Everyone is counting on their phone',
    [`${id}_turn_of`]: 'Turn of',
    [`${id}_pass`]: 'Pass the phone to',
    [`${id}_show`]: 'Show my number'
  }
};
const rules = {
  ar: `\`
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بيجيله رقم سري من 3 لـ 9، محدش غيره يشوفه.</li>
                <li>دوس <b>+1</b> لحد ما توصل لرقمك، وبعدين <b>خلصت</b>.</li>
                <li>اللي يقرب من رقمه أكتر يكسب.</li>
            </ol>\``,
  en: `\`
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone gets a secret number from 3 to 9 that nobody else sees.</li>
                <li>Tap <b>+1</b> until you reach it, then <b>Done</b>.</li>
                <li>Whoever lands nearest their number wins.</li>
            </ol>\``
};
const textFile = `/* ${nameEn} (${nameAr}): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].${id}, as everywhere. Made by tools/new-game.mjs. */
gameText({
  translations: {
${['ar', 'en'].map((l) => `    ${l}: {\n${Object.entries(words[l]).map(([k, v]) => `      ${k}: ${q(v)},`).join('\n')}\n    }`).join(',\n')}
  },
  rules: {
${['ar', 'en'].map((l) => `    ${l}: {\n      ${id}: ${rules[l]},\n    }`).join(',\n')}
  }
});
`;

const serverFile = `// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   ${nameAr} — ${nameEn} in rooms (made by tools/new-game.mjs, ${today})
   --------------------------------------------------------------------------
   The game every new room game starts as, to be replaced by the real one:
   each person is dealt a secret number (3 to 9) only their own phone sees,
   taps «+1» until they think they have reached it, and says «خلصت». When
   everyone has (or the clock runs out, or the host ends the round), the
   numbers go on the table and the nearest wins.

   What it shows, as the pattern for the real game: a secret in
   room.secrets[pid] and nowhere else until the result; a clock the server
   keeps (deadline, timeout); a tap that says which round it was for
   (staleTap); the host's way forward (finish, requireMoveOn); someone leaving
   mid-round (left); and a board, best first, with a score, for the night's
   points. The rules register themselves: ROOM_RULES in RoomGames.js.
   ========================================================================== */
const ${ID}_MIN_PLAYERS = ${Math.max(1, pMin)};
const ${ID}_ROUND_MS = 60000;

/** Everyone dealt in who is still here. */
const ${id}Seated = (room) => activeRoster(room, room.shared.roster);

/** Deals a round: a fresh secret each, everyone at 0, the clock started. */
const ${id}Deal = (room) => {
  const roster = room.players.map(p => p.id);
  room.secrets = {};
  roster.forEach(pid => { room.secrets[pid] = { target: 3 + Math.floor(Math.random() * 7) }; });
  room.shared = { phase: 'play', round: 1, roster, counts: {}, done: [], endsAt: Date.now() + ${ID}_ROUND_MS };
  room.phase = 'play';
};

/** The result: every secret on the table, the board best first (the nearest wins). */
const ${id}Finish = (room) => {
  const s = room.shared;
  if (s.phase !== 'play') return;
  const targets = {};
  s.board = s.roster.map(pid => {
    const target = (room.secrets[pid] || {}).target || 0;
    const count = s.counts[pid] || 0;
    targets[pid] = target;
    return { id: pid, name: roomPlayerName(room, pid), count, target, score: Math.max(0, 10 - Math.abs(target - count)) };
  }).sort((a, b) => b.score - a.score);
  s.targets = targets;
  s.phase = 'gameover';
  s.endsAt = null;
  room.phase = 'gameover';
};

/** Everyone still here has said «خلصت»: the result. */
const ${id}Check = (room) => {
  const s = room.shared;
  if (s.phase === 'play' && ${id}Seated(room).every(pid => s.done.indexOf(pid) !== -1)) ${id}Finish(room);
};

ROOM_RULES.${id} = {
  action(room, playerId, action, payload) {
    if (action === 'start' || action === 'playAgain') {
      requireHost(room, playerId);
      if (room.players.length < ${ID}_MIN_PLAYERS) throw new Error('تحتاج لاعبين على الأقل');
      if (action === 'playAgain' && (room.shared || {}).phase !== 'gameover') return;
      ${id}Deal(room);
      return;
    }
    const s = room.shared;
    if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');
    const mine = s.roster.indexOf(playerId) !== -1 && s.done.indexOf(playerId) === -1;
    if (action === 'tap') {
      if (s.phase !== 'play' || staleTap(payload, 'round', s.round) || !mine) return;
      s.counts[playerId] = (s.counts[playerId] || 0) + 1;
      return;
    }
    if (action === 'done') {
      if (s.phase !== 'play' || staleTap(payload, 'round', s.round) || !mine) return;
      s.done.push(playerId);
      ${id}Check(room);
      return;
    }
    if (action === 'finish') {
      requireMoveOn(room, playerId);
      if (staleTap(payload, 'round', s.round)) return;
      ${id}Finish(room);
      return;
    }
    throw new Error('إجراء غير معروف');
  },
  deadline(room) {
    const s = room.shared || {};
    return s.phase === 'play' && s.endsAt ? s.endsAt : null;
  },
  timeout(room, now) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.endsAt || now < s.endsAt) return false;
    ${id}Finish(room);
    return true;
  },
  left(room) {
    ${id}Check(room);
  }
};
`;

const roomClient = `<script>
/* ============================================================================
   ${nameAr} — ${nameEn} in rooms: the phones and the TV (made by
   tools/new-game.mjs, ${today}). The rules are ROOM_RULES.${id} in Room${P}.js.
   A phone sees its own secret number (state.you.target), taps «+1» and says
   «خلصت»; the TV shows who has finished, then the result on a podium.
   ========================================================================= */

/** The words, in the language of the app. */
const ${id}T = () => TRANSLATIONS[appState.lang] || TRANSLATIONS.ar;

function ${id}Tap() { haptic('light'); roomAct('tap', { round: (Room.state.shared || {}).round }); }
function ${id}Done() { haptic('medium'); roomAct('done', { round: (Room.state.shared || {}).round }); }
function ${id}Finish() { roomAct('finish', { round: (Room.state.shared || {}).round }); }

/** The result's rows: each name, where they stopped and their number. */
function ${id}ResultRows(s, t) {
  return (s.board || []).map(r => \`
    <div class="row"><span>\${escapeHTML(r.name)}</span><span class="metric">\${ltrFrac(r.count, r.target)}</span></div>\`).join('');
}

ROOM_GAMES.${id} = {
  lobbyOptions() {
    return \`<p class="field__hint" style="text-align:center">\${escapeHTML(${id}T().${id}_lobby_hint)}</p>\`;
  },
  startPayload() { return {}; },

  render(state) {
    if (appState.currentView !== 'room-${id}') setView('room-${id}');
    const el = document.getElementById('view-room-${id}');
    if (!el) return;
    const t = ${id}T();
    const s = state.shared || {};

    if (s.phase === 'gameover') {
      const fresh = renderRoomFrame(el, ['${id}-over', state.youAreHost, appState.lang].join('|'), () => \`
        <div class="card" style="text-align:center">
          <div class="card__title">\${escapeHTML(t.${id}_result)}</div>
          \${renderPodium(state, s.board) || \`<div class="metric metric--md">🏆 \${escapeHTML(((s.board || [])[0] || {}).name || '')}</div>\`}
          \${${id}ResultRows(s, t)}
        </div>
        \${state.youAreHost
          ? \`<div class="btn-stack">
               <button class="btn btn--primary btn--lg" onclick="roomAct('playAgain')">\${escapeHTML(t.play_again || '')}</button>
               <button class="btn btn--ghost" onclick="roomAct('backToHub')">\${escapeHTML(t.room_another_game || '')}</button>
             </div>\`
          : \`<div class="waiting-note">\${escapeHTML(t.room_wait_host || '')}</div>\`}
        \${renderRoomPlayerStrip(state)}\`);
      if (fresh) afterReveal(el, () => { if (typeof confetti === 'function') confetti({ particleCount: 80, spread: 70 }); });
      refreshRoomPlayerStrip(el, state);
      return;
    }

    const inRound = (s.roster || []).indexOf(Room.me) !== -1;
    const done = (s.done || []).indexOf(Room.me) !== -1;
    const count = (s.counts || {})[Room.me] || 0;
    renderRoomFrame(el, ['${id}-play', s.round, inRound, done, count, state.youAreHost, appState.lang].join('|'), () => \`
      <div class="card" style="text-align:center">
        \${inRound ? \`
          <p class="sheet__subtitle">\${escapeHTML(t.${id}_your_number)}</p>
          <div class="metric metric--lg">\${(state.you || {}).target || '?'}</div>
          <div class="metric metric--md">\${count}</div>
          \${done ? \`<p class="sheet__subtitle">\${escapeHTML(t.${id}_wait)}</p>\` : \`
            <div class="btn-stack">
              <button class="btn btn--primary btn--lg" onclick="${id}Tap()">\${escapeHTML(t.${id}_tap)}</button>
              <button class="btn btn--secondary" onclick="${id}Done()">\${escapeHTML(t.${id}_done)}</button>
            </div>\`}\` : \`<p class="sheet__subtitle">\${escapeHTML(t.vote_spectating || '')}</p>\`}
      </div>
      \${roomMoveOnHtml(state, \`<div class="btn-stack"><button class="btn btn--ghost btn--sm" onclick="${id}Finish()">\${escapeHTML(t.${id}_finish)}</button></div>\`)}
      \${renderRoomPlayerStrip(state)}\`);
    refreshRoomPlayerStrip(el, state);
  }
};

TV_GAMES.${id} = {
  sig: (state) => [state.shared.phase, (state.shared.done || []).length, (state.shared.roster || []).length].join('|'),
  frame(state, t) {
    const s = state.shared;
    t = ${id}T();
    const host = (html) => (state.youAreHost ? \`<div class="tv-actions">\${html}</div>\` : '');
    if (s.phase === 'gameover') {
      return \`
        <div class="tv-vote">
          <div class="tv-title tv-center-text">\${escapeHTML(t.${id}_result)}</div>
          \${renderPodium(state, s.board)}
          \${host(tvBtn(t.play_again, "roomAct('playAgain')") + tvBtn(t.room_another_game, "roomAct('backToHub')", 'ghost'))}
        </div>\`;
    }
    return \`
      <div class="tv-center">
        <div class="tv-big-icon" aria-hidden="true">${icon}</div>
        <div class="tv-title">\${escapeHTML(t.${id}_tv_wait)}</div>
        \${tvWaitChips(state, s.roster || [], s.done || [])}
        \${roomMoveOnHtml(state, \`<div class="tv-actions">\${tvBtn(t.${id}_finish, '${id}Finish()', 'ghost')}</div>\`)}
      </div>\`;
  }
};
</script>
`;

const deviceClient = `<script>
/* ============================================================================
   ${nameAr} — ${nameEn} on one phone (made by tools/new-game.mjs, ${today})
   ----------------------------------------------------------------------------
   The phone goes round: each player sees their secret number, taps «+1»
   until they think they have reached it, and passes it on; then the nearest
   wins. The whole game is in appState.${id}, so a reload comes back to it
   (VIEW_RESTORE, JS_Core.html). Replace it with the real game.
   ========================================================================= */

const ${id}T = () => TRANSLATIONS[appState.lang] || TRANSLATIONS.ar;

function ${id}State() {
  if (!appState.${id}) appState.${id} = null;
  return appState.${id};
}

/** Its card on the home, and its setup screen. */
function setup${P}() { setView('setup-${id}'); }

function start${P}() {
  // Who plays: the players picked on this phone, or «مين بيلعب؟» asks for them first.
  const names = (appState.activePlayers || []).slice(0, ${pMax});
  if (names.length < ${Math.max(1, pMin)}) { askPlayers(${Math.max(1, pMin)}, () => start${P}(), { max: ${pMax} }); return; }
  const players = names.map(name => ({ name, target: 3 + Math.floor(Math.random() * 7), count: 0 }));
  appState.${id} = { players, at: 0, shown: false, phase: 'play' };
  saveToLocal();
  setView('play-${id}');
  render${P}();
}

function ${id}Show() { appState.${id}.shown = true; saveToLocal(); render${P}(); }
function ${id}Tap() { haptic('light'); appState.${id}.players[appState.${id}.at].count++; saveToLocal(); render${P}(); }
function ${id}Next() {
  const g = appState.${id};
  g.at++;
  g.shown = false;
  if (g.at >= g.players.length) g.phase = 'over';
  saveToLocal();
  render${P}();
  scrollToAction();
}

function render${P}() {
  const el = document.getElementById('${id}-stage');
  const g = ${id}State();
  if (!el || !g) return;
  const t = ${id}T();
  if (g.phase === 'over') {
    const board = g.players.map(p => ({ name: p.name, score: Math.max(0, 10 - Math.abs(p.target - p.count)), count: p.count, target: p.target }))
      .sort((a, b) => b.score - a.score);
    el.innerHTML = \`
      <div class="card" style="text-align:center">
        <div class="card__title">\${escapeHTML(t.${id}_result)}</div>
        \${board.map(r => \`<div class="row"><span>\${escapeHTML(r.name)}</span><span class="metric">\${ltrFrac(r.count, r.target)}</span></div>\`).join('')}
        <button class="btn btn--primary btn--lg" onclick="start${P}()">\${escapeHTML(t.play_again || '')}</button>
      </div>
      <div class="play-exit-row"><button type="button" class="btn btn--ghost btn--sm btn--auto play-exit" onclick="playExit(() => setView('setup-${id}'))">\${escapeHTML(t.exit || '')}</button></div>\`;
    return;
  }
  const p = g.players[g.at];
  el.innerHTML = \`
    <div class="card" style="text-align:center">
      <p class="sheet__subtitle">\${escapeHTML(t.${id}_turn_of)} <bdi>\${escapeHTML(p.name)}</bdi></p>
      \${g.shown ? \`
        <div class="metric metric--lg">\${p.target}</div>
        <div class="metric metric--md">\${p.count}</div>
        <div class="btn-stack">
          <button class="btn btn--primary btn--lg" onclick="${id}Tap()">\${escapeHTML(t.${id}_tap)}</button>
          <button class="btn btn--secondary" onclick="${id}Next()">\${escapeHTML(t.${id}_done)}</button>
        </div>\` : \`<button class="btn btn--primary btn--lg" onclick="${id}Show()">\${escapeHTML(t.${id}_show)}</button>\`}
    </div>
    <div class="play-exit-row"><button type="button" class="btn btn--ghost btn--sm btn--auto play-exit" onclick="playExit(() => setView('setup-${id}'))">\${escapeHTML(t.exit || '')}</button></div>\`;
}

// A reload: the setup as it was, or the game where it was.
VIEW_RESTORE['setup-${id}'] = () => {};
VIEW_RESTORE['play-${id}'] = () => { if (${id}State()) render${P}(); else setTimeout(() => setView('setup-${id}'), 50); };
</script>
`;

const notes = `# ${nameAr} — ${nameEn}

Made by \`npm run new:game\` on ${today}: games/${id}/ holds its code, its words and its rules.
What is there now is the starting game every new game gets (a secret number each, tap «+1»
until you reach it, the nearest wins). Replace it with the real game once the owner has
answered its rules and picked its look from a sheet of three (GEMINI.md, *How we work*).

## The owner's spec

(The rules as the owner answered them, one question at a time.)

## How it is built

- ${[ROOM && `Rooms: \`Room${P}.js\` (the rules, ROOM_RULES.${id}), \`JS_Room${P}.html\` (ROOM_GAMES.${id} and TV_GAMES.${id})`, DEVICE && `One phone: \`JS_${P}.html\` (setup${P}, start${P}, VIEW_RESTORE for a reload)`].filter(Boolean).join('\n- ')}
- Its words and rules: \`${id}.text.js\`.
`;

/* --- the plan --------------------------------------------------------------------- */

create(`games/${id}/${id}.text.js`, textFile);
if (ROOM) {
  create(`games/${id}/Room${P}.js`, serverFile);
  create(`games/${id}/JS_Room${P}.html`, roomClient);
}
if (DEVICE) create(`games/${id}/JS_${P}.html`, deviceClient);
create(`notes/games/${id}.md`, notes);

// The one list of games.
const entry = [`id: '${id}'`, `icon: '${icon}'`, `title: 'setup_${id}'`, `desc: 'cat_${id}'`, `accent: '${accent}'`,
  `players: [${pMin}, ${pMax}]`, `mins: ${mins}`, `modes: [${[DEVICE && "'device'", ROOM && "'room', 'tv'"].filter(Boolean).join(', ')}]`,
  `group: '${group}'`, DEVICE && `setup: 'setup-${id}'`, ROOM && `room: { min: ${Math.max(1, pMin)} }`, ROOM && `crew: '${crew}'`,
  DEVICE && `open: 'setup${P}'`].filter(Boolean).join(', ');
insertBefore('app/Games.js', '  /* --- أدوات --- */\n', [`  { ${entry} },   // tools/new-game.mjs, ${today}`]);
// «الليلة دي؟»
{ const { node, at } = literalOf('app/JS_Catalog.html', 'TONIGHT_ORDER'); appendInline('app/JS_Catalog.html', node, at, `'${id}'`); }

// The page: its screens and its file.
const views = [];
if (DEVICE) {
  views.push(`      <div id="view-setup-${id}" class="hidden" data-accent="${accent}">`,
    `        <div class="card">`,
    `          <p class="field__hint" data-i18n="cat_${id}">${words.ar[`cat_${id}`]}</p>`,
    `          <button onclick="start${P}()" class="btn btn--primary btn--lg" data-i18n="start">ابدأ</button>`,
    `        </div>`,
    `      </div>`,
    `      <div id="view-play-${id}" class="hidden" data-accent="${accent}"><div id="${id}-stage"></div></div>`);
}
if (ROOM) views.push(`      <div id="view-room-${id}" class="hidden" data-accent="${accent}"></div>`);
insertBefore('app/Controller.html', '      </main>\n', [`      <!-- ${nameEn} (${nameAr}): games/${id}/ -->`, ...views]);
insertBefore('app/Controller.html', "    <?!= include('JS_RoomChat'); ?>\n",
  [DEVICE && `    <?!= include('JS_${P}'); ?>`, ROOM && `    <?!= include('JS_Room${P}'); ?>`].filter(Boolean));

// Screens, Help.
appendTo('app/JS_Core.html', 'VIEW_META', [
  DEVICE && `    'setup-${id}': { title: 'setup_${id}', up: 'menu', accent: '${accent}' },`,
  DEVICE && `    'play-${id}': { title: 'setup_${id}', up: 'setup-${id}', accent: '${accent}' },`,
  ROOM && `    'room-${id}': { title: 'setup_${id}', up: 'menu', accent: '${accent}' },`].filter(Boolean));
appendTo('app/JS_Utils.html', 'HELP_ENTRIES', [`  { key: '${id}', title: 'setup_${id}', icon: '${icon}', accent: '${accent}', group: 'games'${ROOM && DEVICE ? ', room: true' : ROOM ? ', roomOnly: true' : ''} },`]);
appendTo('app/JS_Utils.html', 'HELP_FOR_VIEW', [`  ${[DEVICE && `'setup-${id}': '${id}', 'play-${id}': '${id}'`, ROOM && `'room-${id}': '${id}'`].filter(Boolean).join(', ')},`]);

// Its words and rules go in at their markers.
for (const lang of ['ar', 'en']) {
  appendToLang('app/JS_Translations.html', 'TRANSLATIONS', lang, [`      /* @game-text ${lang} ${id} */`]);
  appendToLang('app/JS_GameRules.html', 'GAME_RULES', lang, [`        /* @game-text ${lang} ${id} */`]);
}

// Its chunk.
appendTo('tools/lazy-split.mjs', 'CHUNKS', [`  ${id}: [${[DEVICE && `'JS_${P}'`, ROOM && `'JS_Room${P}'`].filter(Boolean).join(', ')}],   // tools/new-game.mjs, ${today}`]);
// test:changed: its files run its own tests.
appendTo('tools/test-changed.mjs', 'MAP', [`  { files: /^(${[DEVICE && `JS_${P}\\.html`, ROOM && `JS_Room${P}\\.html`, ROOM && `Room${P}\\.js`, `${id}\\.text\\.js`].filter(Boolean).join('|')})$/, ${ROOM ? `robots: ['${id}'], ui: ['${id}']` : 'screens: true'} },`]);

if (ROOM) {
  { const { node, at } = literalOf('rooms-worker/build.mjs', 'FILES'); appendInline('rooms-worker/build.mjs', node, at, `'Room${P}.js'`); }
  // The robots: one whole game on four phones and a TV.
  insertBefore('rooms-worker/test/play-all.mjs', 'const SEGMENTS = [\n', [`async function ${id}Robots() {
  console.log('• ${nameAr} (made by tools/new-game.mjs: a secret each, the taps, the result, play again)');
  const H = await Bot.host('حسام', null);
  const J = await Bot.join(H.code, 'Jana');
  const K = await Bot.join(H.code, 'كريم');
  const TV = await Bot.join(H.code, '', true);
  const people = [H, J, K];
  await H.must('chooseGame', { game: '${id}' });
  check((await J.act('start', {})).ok === false, '${id}: only the host starts');
  await H.must('start', {});
  await all(people.concat([TV]), (s) => s.game === '${id}' && s.shared.phase === 'play', '${id}: the round reaches every phone and the TV');
  check(TV.state.you === null, '${id}: the TV has no secret');
  check(people.every((p) => p.state.you && p.state.you.target >= 3 && p.state.you.target <= 9) && !('targets' in H.state.shared), "${id}: each phone has its own number, the table none");
  for (const p of people) {
    for (let i = 0; i < p.state.you.target; i++) await p.must('tap', { round: 1 });
    await p.must('done', { round: 1 });
  }
  await all(people.concat([TV]), (s) => s.shared.phase === 'gameover' && s.shared.board.length === 3 && s.shared.board[0].score === 10, '${id}: everyone landed on their number: the result on every screen');
  await H.must('playAgain', {});
  await H.waitFor((s) => s.shared.phase === 'play' && (s.shared.done || []).length === 0, '${id}: play again deals a new round');
  await H.must('finish', { round: 1 });
  await H.waitFor((s) => s.shared.phase === 'gameover', '${id}: the host ends a round');
  await H.must('backToHub');
  await H.waitFor((x) => x.phase === 'lobby', '${id}: back in the hub');
  [H, J, K, TV].forEach((x) => x.close());
}
`]);
  appendTo('rooms-worker/test/play-all.mjs', 'SEGMENTS', [`  { name: '${id}', run: ${id}Robots, secs: 5 },`]);
  // The leak check: a whole game, and the rule its secret keeps.
  appendTo('rooms-worker/test/leaks.mjs', 'PROBES', [`  // ${nameAr} (tools/new-game.mjs): a phone's number on its own phone only, and on the table only at the result.
  ${id}(room) {
    const s = room.shared || {};
    const live = s.phase === 'play';
    return [
      probe("a phone's number is its own, exactly", live, (view, pid) => {
        if (pid === SCREEN) return null;
        const want = (room.secrets[pid] || {}).target;
        return want === undefined || (view.you && view.you.target === want) ? null : 'you.target';
      }),
      probe('no number on the table before the result', live, (view) => (hasKey(view.shared, 'targets') || hasKey(view.shared, 'board') ? 'shared.targets' : null))
    ];
  },`]);
  appendTo('rooms-worker/test/leaks.mjs', 'DRIVERS', [`  ${id}() {
    // Four at the table: everyone taps a little and says done, then a second round the clock ends.
    const T = table('${id}', 4);
    must(T, T.host, 'start', {});
    T.ids.forEach((pid, i) => { for (let k = 0; k < i + 2; k++) must(T, pid, 'tap', { round: 1 }); must(T, pid, 'done', { round: 1 }); });
    if (S(T).phase !== 'gameover') return false;
    must(T, T.host, 'playAgain', {});
    must(T, T.ids[1], 'tap', { round: 1 });
    runClock(T, (r) => r.shared.phase === 'gameover');
    return S(T).phase === 'gameover';
  },`]);
}

// The guide's index: one line for the game.
insertBefore('GEMINI.md', '\n### The app around the games\n', [`- ${icon} ${nameAr} (${nameEn}; made by \`npm run new:game\` on ${today}) - \`notes/games/${id}.md\`.`]);

/* --- write ------------------------------------------------------------------------ */

const rels = [...writes.keys()];
console.log(`new-game: ${id} (${nameAr} / ${nameEn}), ${modes.join(' + ')}`);
for (const rel of rels) console.log(`  ${fs.existsSync(path.join(ROOT, rel)) ? 'edit  ' : 'create'} ${rel}`);
if (DRY) { console.log('(--dry: nothing written)'); process.exit(0); }
for (const rel of rels) {
  fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, rel), writes.get(rel));
}
console.log(`
Next:
  cd tools && npm run check                     (the names, the words, the lists)
  cd rooms-worker && npm run test:rules         (the leak check plays it)${ROOM ? `
  cd rooms-worker && npm run dev, then node test/play-all.mjs --only=${id}` : ''}
  cd tools && npm run build:preview, and play it at 375, 667 and 1280 wide
Then make it the real game: games/${id}/, its rules in ${id}.text.js, notes/games/${id}.md.`);
