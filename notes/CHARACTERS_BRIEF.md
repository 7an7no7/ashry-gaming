# Living characters: the shared brief (27 Sep 2026)

The owner saw what المشنقة became (a flat-cartoon man with a face, moods, an occasional
speech bubble, a comic end and an escape, played on every screen at the table) and asked
for the same treatment in six more places. **Read `JS_Hangman.html` (the top, `HM_PARTS`,
`hmGallowsSvg`, `hmAfterBoard`, `hmRowMoments`, `hmRoomHold`) and section 25 of
`Style.html` (from `/* The man, look أ` to `@keyframes hm-jolt`) first: that is the model,
and your work must look like it belongs to the same cast.**

## The look: flat cartoon, look أ (the owner's pick)
- Bold dark ink outlines that stay dark in dark mode (a token like `--hm-ink`, never
  `var(--text)`: on the owner's iPhone in dark mode the outlines turned white and the man
  became a sticker), flat fills, the game's `--accent` where the character has a main colour,
  skin `#f6c9a5`, big simple hands and shoes, dot eyes, a mouth that changes with the mood.
- Inline SVG built by a JS function, with no ids inside (a page can hold many), every moving
  piece a `<g>` with `transform-box: view-box` and `transform-origin` at its joint (the
  drawing's own units), CSS keyframes for the loops, `animation-delay: var(--x-late, 0ms)`
  on every one-shot so a redraw mid-way carries on (see `hmRowMoments` / `--hm-late`).
- **Transform and opacity only.** Every one-shot also settles by a timer or `forwards`,
  never only by an animation event. Every reveal keyed with `motionFirst` so a room's redraw
  doesn't replay it. `motionOff()` before moving anything; add your classes to a
  `@media (prefers-reduced-motion: reduce)` block that stills them (the app's `applyMotionPref`
  lifts those blocks by the setting).
- A speech bubble, where the character talks: two seconds every nine or so, never constant,
  a different line per state, translation keys in both `ar` and `en` blocks of `TRANSLATIONS`
  (JS_Core.html) with `data-i18n`-free markup (you write the text through `t.key`), never on
  the TV's small figures. Egyptian, funny, family-clean.
- Sounds through `FX` in `JS_Sounds.html` (`fxTone` / `fxNoise`, short, named after the game,
  e.g. `mkChest`), played with `playFx`; only on the phone that did the thing; the TV is the
  room's one voice for the table (see `duelRoomLoud` / the domino's pattern).
- The TV (`TV_GAMES.<id>`) shows the same character big where the game has a TV frame.

## Rules of the codebase you must keep
- Edit the sources at the project root only (`JS_*.html`, `Style.html`, `JS_Core.html` for
  strings). Never `docs/`. Never the rooms server (`RoomGames.js`, `Room*.js`, `rooms-worker/`):
  everything here is page-side; the server already sends what you need.
- **CSS goes in a NEW section appended at the very end of `Style.html`** (after the last `}`
  and before `</style>`), headed `/* ==== NN. <game>: the living <thing> ==== */`, with its
  own reduced-motion block. Do not edit other sections (six branches merge at once).
- **Translation keys**: add yours right after the game's own existing keys in each block
  (find a key of that game in the `ar` block and the same key in the `en` block), not at the
  end of the blocks. Same keys in both. `cd tools && npm run check` must say `i18n OK`.
- One scope: every `JS_*.html` shares one global scope. Prefix every new top-level name with
  the game's prefix and grep the tree before adding a name (`grep -rn "^function NAME\|const NAME"`).
- Parse-check every file you touch after every edit:
  `node -e "const fs=require('fs'),vm=require('vm');const s=fs.readFileSync(process.argv[1],'utf8');[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].forEach(m=>{try{new vm.Script(m[1])}catch(e){console.log('FAIL',e.message)}})" FILE.html`
  and count `{` against `}` and `/*` against `*/` in Style.html.
- The working copy may be CRLF: use the Edit tool (exact match) or a node script that
  normalises and restores line endings; never shell heredocs for file content.
- Reuse the motion toolkit where it fits (`flyEmoji`, `countUp`, `afterReveal`, `motionFirst`,
  `spinLetter`, `flipGrid`); don't invent a second one.

## Looking at it (required before you report)
Build the preview: `cd tools && ROOMS_URL=http://127.0.0.1:<ROOMS_PORT> npm run build:preview`
(the preview is `.preview/index.html`; serve it with `npx http-server .preview -p <PREVIEW_PORT>`
from the worktree root). For a room game start your own rooms server from the worktree:
`cd rooms-worker && node build.mjs && npx wrangler dev --port <ROOMS_PORT> --persist-to C:/wrdev-<N>`
(the ports are assigned in your task; ports 8787, 4321, 8797 and 4341 belong to other
sessions - never use them). Drive headless Chrome over the DevTools protocol the way
`notes/hangman-look.mjs.txt` and `notes/hangman-two-look.mjs.txt` do (copy one into your
scratchpad, change BASE to your preview port, give each phone its own browser context, emulate
`prefers-reduced-motion: no-preference`, take screenshots mid-animation with waits) and LOOK
at the screenshots with the Read tool: at 375×812 Arabic light and 1280×720 English dark at
least, plus the TV at 1920×1080 for a room game; a reload mid-game; no console errors. Fix
what you see. Clean up the Chrome profiles you made.

## When done
- A short note in GEMINI.md under the game's own section (how it works, the classes, the
  decisions), and one line in *The log* (a `- **27 Sep 2026, …**` entry, appended after the
  last log entry).
- `cd tools && npm run check` passes. Commit on your branch with a message that says what the
  table sees. Report: what you built, what you looked at, anything left undecided.
