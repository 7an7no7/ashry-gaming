# Batch 2, Phase 2D: the 2D board, the view switch, the 3D board polished

The owner's words: "improve the 3d look and animations and style of the chess and also add the option
to play it normal, same look as in chess.com, so it's optional". Branch `batch2`, nothing pushed or
deployed. Tests and screenshots are outside the repo in `C:/Users/TPC/agy-tests/ashry-batch2/`
(`T2D.*.test.js`, `2d/*.mjs`, screenshots in `2d/shots/` and `2d/shots/v/`).

## Commits

| Task | Commit | Files |
| --- | --- | --- |
| T2D.1 The 2D board | `95bfebd` | `JS_Chess.html`, `Style.html`, `Controller.html`, `JS_Core.html`, `JS_RoomTournament.html` |
| T2D.2 The view switch | `669adb1` | `JS_Chess.html` |
| T2D.3 The 3D board polished | `b630347` | `JS_Chess.html`, `Style.html`, `GEMINI.md` |
| T2D.1 fix (the dots under the pieces) | `946e99e` | `Style.html` |
| T2D.3 fix: the 3D knight (review) | `36e56bc` | `JS_Chess.html` |

The fix was found while looking at the screenshots after T2D.3 had been committed (a legal-move dot was
drawn over a piece being dragged), so it is its own small commit rather than a rewrite of T2D.1.

## What was built

- **T2D.1** - `chFlatBoardHtml` / `chMakeFlat` rewritten as a real 2D board: the squares a CSS grid,
  the pieces a layer over them (each placed with a transform, so a move is a 150 ms Web Animation of
  transform), a taken piece fading under the arriving one, the rook sliding with its king, a promotion
  popping, a mated king tilting, a drag lifting the piece and following the finger (a refused drop slides
  back and shakes; a dropped piece is not slid again when the move comes back). A new piece set, our own
  drawings (`CH2_SHAPES`, Staunton silhouettes in a 45 × 45 box: the king's cross, the queen's coronet of
  balls, the rook's battlements, the bishop's mitre slit, a knight with mane, eye, mouth and nostril),
  defined once as `<symbol>`s and drawn with `<use>`, ivory with a dark line and near-black with a light
  inner line, a two-tone gradient each. Coordinates in the corners of the edge squares in the other
  square's colour, the last move yellow, dots and rings, a red glow under a king in check, arrows in an
  SVG layer. Four styles («أخضر» default `#769656`/`#eeeed2`, «خشب», «أزرق», «رخام») as tokens per
  `[data-ch2-style]`, chosen in the setup («شكل الرقعة», swatches) and behind a ⚙ on every board;
  remembered (`recallOptions('chessLook')`). The 3D board follows the style too (`CH3_STYLES`: squares,
  frame, piece finish). Sounds: the existing wooden tock / knock / double tock / check ping, plus a low
  chord for the end and a thud for the mate topple (`chSound('end' | 'thud')`, fxTone/fxNoise).
- **T2D.2** - `chViewShow` asks `chViewWant`: 2D unless the phone chose 3D; the TV always 3D (no switch);
  2D only where WebGL can't draw or three.js failed to load (`chView.no3d`, the switch hidden). «🧊 3D» /
  «▦ 2D» on every board screen (one phone, room phones, review); switching keeps the game, the selection
  and the arrows; the 2D board shows the position while three.js loads. three.js is asked for in one
  place only, `chViewLoad3D`.
- **T2D.3** - `chMake3D`: smoothed lathe profiles (spline between sharp corners, 64 segments), a green
  felt disc, the knight's head made from the 2D knight's own profile, extruded thicker, with a ridged
  mane, ears, eyes and nostrils, turned sideways so it reads from both seats; a bevelled cross, a coronet
  band; a bevelled rounded frame with grain, a varnished top with real grain (figure, pores, knots),
  inlaid coordinates; an environment of soft boxes and a rim light; soft contact shadows kept on the
  board as a piece rises. Motion: lift/arc/settle with a squash (a knight hops higher), a capture knocked
  over away from the attacker, sliding, a puff of dust, then set beside the board, the camera easing
  toward it and back; castling king and rook together; promotion sinks the pawn and raises the new piece
  in a gold sparkle; check a red pulse (three rings) and a shake; mate a slow 1.2 s topple (it falls where
  there is room), a thud, dust, the camera easing in. Camera: two fingers (pinch zoom, move to turn),
  right/middle mouse drag, the wheel, clamped (turn ±70°, tilt −26°…+40°, zoom 0.6-1.45); «⬇ من فوق»
  (a toggle) and «↺» (shown once the camera moved). The loop still draws only while something moves,
  pixel ratio ≤ 2.

## Accept when

- **A new phone opens chess in 2D** - VERIFIED: headless Chrome, a fresh browser context, `chView.r.kind`
  = `flat` at 375×812, 667×375 and 1280×720 (`2d/verify.mjs`, `2d/switch.mjs`); node test T2D.2
  (`chViewWant({})` = `flat`).
- **The switch goes to 3D and back mid-game with the position, selection and arrows kept** - VERIFIED:
  `2d/switch.mjs` (a game against the computer with the hint's arrow and g1 picked: after «🧊 3D»
  kind `3d`, history unchanged, `sel` g1, 1 arrow; back to 2D kind `flat`); `2d/verify.mjs` at 375 and
  1280 (after switch `["3d","f3",5]`, back `["flat","f3",31]`).
- **A reload keeps the choice** - VERIFIED: `2d/switch.mjs` reloads in 3D and comes back `3d`.
- **In 2D every move slides** - VERIFIED: right after a capture two Web Animations of 150 ms run on
  `.ch2-pc` elements (the slide and the fade) at all four sizes. Needs `prefers-reduced-motion:
  no-preference` emulated (see Traps in GEMINI.md).
- **A drag works** - VERIFIED: real mouse events (`Input.dispatchMouseEvent`) drag d8→d6 and g1→f3:
  played; e1→e3 refused and the game unchanged; screenshot `v/ar-375-3-dragging.png` (lifted piece,
  hover ring). A touch drag on a real phone: UNVERIFIED (needs an iPhone).
- **Legal dots and the last move show** - VERIFIED: e4 picked gives 1 dot and 1 capture ring, the last
  move and the picked square tinted (`v/*-2-picked.png`); node test T2D.1 (39 checks on the markup).
- **The four styles apply** - VERIFIED: screenshots of green / wood / blue / marble in 2D and 3D
  (`2d/shots/q-b-*.png`, `2d/shots/q3-b-*.png`); tokens defined for each (T2D.1 test).
- **Coordinates read correctly for both colours (Black at the bottom flips them)** - VERIFIED: with Black
  at the bottom the first square is h1, the last a8, the bottom-left square shows "8" and "h"
  (`v/en-1280-5-black.png`); T2D.1 test checks a1/h1/a8/h8 both ways.
- **RTL doesn't mirror the board (`dir="ltr"`)** - VERIFIED: Arabic screenshots show a-h left to right
  (`v/ar-375-*.png`); the markup carries `dir="ltr"` (T2D.1 test).
- **The 3D animations play once per move, never replay on a redraw** - VERIFIED by construction and in
  the browser: the move animates only when `m.anim.key` changes (same key as before); redraws for the
  selection/the tools during the frozen-clock run (`2d/frames3d.mjs`) replayed nothing. Frames of the
  capture, the knight hop, castling, check pulse and the mate topple: `2d/shots/f3-*.png`.
- **The TV keeps 3D** - VERIFIED: a room with two phones (separate browser contexts) and a TV: both
  phones `room-chess` / `flat`, the TV `room-tv` / `3d` with no board buttons (`v/room-tv.png`,
  `v/room-white-phone.png`, `v/room-black-phone.png`).
- **`npm run check`, `npm run test:rules` pass** - VERIFIED: check passes; test:rules passed on four
  runs, one earlier run printed "1 failed" among the room rules (not repeated in three reruns; this phase
  changed no room rules or server file - the chess page files are not bundled - so it is an existing
  flaky random test, not investigated further).
- **No three.js request while in 2D** - VERIFIED with the Network domain: 0 requests to three.js on every
  2D run at every size and on both room phones; 1 on the TV and after switching to 3D.

Also run: every edited file parses (`Controller.html` fails the check as always, template syntax);
node tests T2D.1 (39/39), T2D.2 (15/15), T2D.3 (29/29); no console errors in any browser run; no
horizontal overflow in the endgame editor at any size.

## After review: the 3D knight

The coordinator found the 3D knight read as a lump from the playing camera. It was rebuilt in
`chPieceParts`: a horse's head and neck as a side profile (chest, throat, jaw, chin, muzzle, nose bridge,
forehead, poll, the arched crest, the back of the neck) extruded with a bevel (20 curve segments), then
shaped vertex by vertex once at build (pinched 45% towards the muzzle, 18% fuller at the neck's foot);
a thin ridged mane crest standing proud along the back of the neck; two ears; cheek swells; eyes and
nostrils; a collar on the turned base. Shared geometry, nothing allocated per frame. White's knights face
left and Black's right as seen from White (a small turn towards the other side), so neither colour is
seen from behind from either seat. VERIFIED by screenshots from the default camera
(`2d/shots/k/k2-375-white.png`, `k2-375-black.png`, `k2-1280-white.png`, `k2-1280-black.png`) and
a close-up (`k2-close.png`); no console errors; T2D.3 test updated (29/29).

The marble style: it was always drawn - `m-styles.png` showed three boards because the screenshot
montage script (a test helper) dropped its fourth image, not the page. `2d/shots/q-b-marble.png` is
the 2D marble board; no code change was needed.

## Decisions made here

- 2D by default on every device that isn't the TV (the owner said "on phones"; one rule is simpler and a
  laptop is a tap away from 3D).
- The look is one remembered key, `chessLook` (`{ view, style }`) in the options store, shared by the one
  phone game, rooms and the review.
- The board's buttons (switch, ⚙, and in 3D «⬇ من فوق» / «↺») are a row over the board, a column beside
  it when the stage is wider than 5:4 (container query).
- The mated 2D king tilts; the 3D king topples towards its own edge if free, else sideways.
- Right-drag orbits the 3D board as the runbook says; T2C.8 (drawing arrows, not built yet) planned
  right-click for arrows - it will have to use right-click only in 2D, or a modifier in 3D.
- The knight faces sideways in 3D (the old three-quarter turn showed its back from its own seat); rebuilt after review (above).

## Uncertain / not verified

- On a real iPhone: the pinch and two-finger turn (`touch-action: none` on the 3D board means one finger
  on it doesn't scroll the page), a touch drag in 2D, 60 fps while moving - UNVERIFIED, needs the phone.
- At 667×375 the tools row costs the 2D board some height (squares ~30 px); the stage there is not wide
  enough for the side column.
- `npm run test:ui` (15 minutes) was not run.

## Screenshots to judge the look

1. `2d/shots/v/ar-375-2-picked.png` - 2D, Arabic light, a piece picked with its dot and ring
2. `2d/shots/v/en-1280-5-black.png` - 2D on a laptop, Black at the bottom
3. `2d/shots/m-styles.png` - green / wood / blue in 2D (marble: `2d/shots/q-b-marble.png`)
4. `2d/shots/v/ar-375-3-dragging.png` - a drag with the hover ring
5. `2d/shots/v/en-1280-6-3d.png` - the polished 3D board on a laptop
6. `2d/shots/k/k2-close.png` - the 3D pieces close up (the rebuilt knight, felt, cross, coronet)
7. `2d/shots/f3-11-mate-end.png` - the mate topple
8. `2d/shots/v/room-tv.png` - the TV in 3D during a room game
