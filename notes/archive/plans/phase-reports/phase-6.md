# Phase 6 — A result card you can send

Written by Claude (agy was still out of quota; the owner asked for the phases to be carried on here). One commit, `817d7d4`.

New file: `JS_ShareCard.html`, included from `Controller.html` after `JS_Motion`.

## T6.1 — Draw the card

`shareResultCard({ title, icon, rows, footer, text, maxRows })` draws a 1080×1920 PNG and sends it. `drawShareCard` does the drawing; `shareResultCard` does the sending.

| Criterion | Verdict |
|---|---|
| A card renders with three players, with eight, and with one | VERIFIED — rendered in the preview and looked at: 1 row (a daily), 3 (room trivia), 8 (أتوبيس كومبليت) and 10 (the تحدي اليوم hub), in Arabic and in English |
| A long Arabic name is truncated, not overflowed | VERIFIED — `shareCardFit` shortens until `measureText` fits and adds an ellipsis; "كريم عبد الرحمن الشربيني الطويل" came out as "كريم عبد الرحمن الشربي…". Pinned by `T6.test.js` §2 |
| With no `navigator.canShare({files})`, it downloads instead | VERIFIED — forced in the browser: returned `downloaded`, saved as `ashry-2026-09-20.png` |
| …and with neither, it copies the text | VERIFIED — forced by making `toBlob` yield null: returned `copied`, and the clipboard got "plain words\n<the app link>" — the same `shareOrCopy` the app used before this existed |
| With a share sheet that takes files | VERIFIED — returned `shared`, and the sheet received one `image/png` file over 1000 bytes |
| Nothing is drawn until the button is pressed | VERIFIED — the canvas is created in exactly one place, inside `drawShareCard`, and nothing at the top level of the file touches a canvas (`T6.test.js` §1) |
| Arabic shapes on a canvas | VERIFIED BY EYE, as the runbook asked — `ctx.direction = 'rtl'` with the alignment flipped per row. "تحدى المعلومات" and "أحمد المنصورى" join correctly; the letters are not disconnected |

Decided while building:

- **The colours are read off the mark**, not written again: `shareCardColours()` takes the three violet stops out of `#ashry-g-m` in `Logo.html` and the amber of the full stop out of its own circle, so the card follows whatever colourway `iconVariant` ships. The only hex values in the file are those same five, as the fallback for a page with no mark — `T6.test.js` §7 fails if another one appears.
  - One trap met: the mark also carries two white circles as light, so `circle[fill^="#"]` picked white rather than amber. It now takes the first coloured one.
- **The mark is drawn from the page's own `<symbol>`**, wrapped in a standalone `<svg>` and handed over as a `data:` URL. A canvas cannot `<use>` a symbol, and a data URL leaves the canvas untainted so `toBlob` works. If the mark is missing the card still draws, without it.
- **The rows share a fixed 830px of the card.** One row is large, ten are smaller, and whatever room they leave is split above and below — a card with three names and a field of nothing underneath looked unfinished. The footer line is clamped so a full plate never pushes it into the mark. Hard maximum ten rows.
- **A row's count is drawn in the amber**, the name in white, with the leader's name bold. In Arabic the name is at the right edge and the count at the left; in English the other way round.
- **`document.fonts.ready` is awaited** before drawing, or the card comes out in the canvas default instead of Cairo.

## T6.2 — Put it where a result already is

| Criterion | Verdict |
|---|---|
| The daily's share still carries its own text line (the streak and the grid), now with the card | VERIFIED — `soloResult`'s share builds the card from `soloLastResult` (the same icon, title, number and lines) with the game's share text as the footer, and passes that whole text to `navigator.share` so the words travel with the picture |
| A room's end-of-game share names the game and the top three | VERIFIED — `shareRoomResult` takes the game's icon and name from `CATALOG_BY_ID` and the rows from the board it was handed, with 🏆 and the leader as the footer |
| The button does nothing surprising when a game ended with no scores | VERIFIED — `roomShareBtnHtml` returns `''` when no row scored, and `''` on a big screen. There is no button to press (`T6.test.js` §5, and checked in the browser with a zeroed board, an empty board and `youAreScreen`) |
| A second button keeps the plain text | VERIFIED — `soloResultShareText()` on the result sheet and `shareDailyText()` on the تحدي اليوم hub, both ghost buttons beside the picture one, hidden and shown with it |

Where the button now is: the solo result sheet, the تحدي اليوم hub, and the six room games that end on a podium with a real score board — تحدي المعلومات, فوازير إيموجي and كمّل المثل (one renderer), خمس ثواني, صدق ولا كذب, أتوبيس كومبليت and زي الكل.

**Not done, deliberately:** سكرو and مافيا. سكرو's podium is lowest-wins and `renderPodium` is fed an inverted score there, so a card built from that board would print numbers that are not anyone's total; it needs its own rows, and its own decision about whether the card shows the totals or the places. مافيا ends with roles rather than a score board. Both are a small follow-up rather than a silent half-measure.

**زي الكل hands over its own board.** Most room games publish `shared.board`, but زي الكل works one out (`herdBoard`), so `roomShareBtnHtml(state, board)` takes the board from the frame that draws it and remembers it with the game it came from — a board left over from the previous game is never sent.

### Tests

- `C:/Users/TPC/agy-tests/phase-6/T6.test.js` — passes. It loads the real `shareCardFit` and `shareBoardRows` out of the file, checks the order of the three ways out, the wiring in all nine files, the keys in both languages, and that no brand colour is hardcoded.
- `cd tools && npm run check` — **no problems found**, **i18n OK**.
- No server change, so `test:rules` and the robot suite were not affected.

## Not verified — needs a live test

- **`navigator.share` with files on a real iPhone.** The blob is built before the call, as the runbook said, but `canvas.toBlob` is asynchronous and iOS is strict about a share being inside the gesture. If it refuses, the card falls through to the download — which on iOS Safari opens the picture rather than saving it. This is the one thing that has to be tried on the owner's phone.
- Whether the card is legible in a WhatsApp thumbnail at 1080×1920 (it is a 9:16 portrait, the shape WhatsApp and Instagram stories both expect).
- The card on a phone whose system font stack has no Cairo yet at the moment of the tap — `document.fonts.ready` covers the app's own load, but a cold cache on a slow connection was not simulated.
