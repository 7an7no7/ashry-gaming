# The design system, the long version (the arcade look, one voice, the intro, motion, toasts, performance, layouts)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **The slow-load scenes** - the owner's decisions of 28 Sep 2026, from a
  design sheet of six scenes (*The design system*, "The intro"):
  - **Up to 2.5 s nothing changes**: today's intro exactly; a page ready
    sooner never shows anything new. Past 2.5 s still loading, **one scene of
    six, chosen at random on each slow visit**, fades in under the name (the
    thin line fades out): the dice, the cards, the dominoes, Connect 4, the
    bus, and **the fuse, improved**: the loading line is القنبلة's fuse, the
    spark runs along it to a small cartoon bomb that gets nervous as it
    nears, then pops with «بوم!» / "Pop!" into confetti in the app's colours
    (never a scary blast), and a fresh bomb drops in with a bounce.
  - **A line under it every 3 s**: each scene has its own pool of five and
    there is a general pool of twelve (the owner's own words); the first line
    is the scene's own, then a general one and the scene's in turn, drawn at
    random with none twice until its pool is used up, and at 12 s once «أول
    مرة بس… المرة الجاية هيفتح في ثانية» / "First time only. Next time it
    opens in a second".
  - When the app is ready the scene fades and the logo flies home as before.
  - Decided here: «لسه بنجيب أكتر من ٧٠ لعبة» / "70+ games" (the owner's
    list said 80; the catalog has 71 games and 16 tools).

## From GEMINI.md: The design system

**The arcade look** (the owner, 26 Sep 2026: "rebuild the whole UI style ...
more premium look and easy to use"; picked as «د · أركيد» from a sheet of four
styles - a cover-card feed, iOS-style grouped lists, an icon grid, a game
store - each shown in three colours; colour ١ is the light theme, ٢ the dark
one). It is **section 39 of `Style_Arcade.html`, the last section on purpose**: it
re-tokens and restyles the pieces every screen is built from, and the game
boards keep their own sections untouched. What it is:

- **Every game is a poster** (`catalogCard`, `.gcard`): the game's own colour
  as the ground (a gradient of `--accent` to `--accent-hover`), its icon big,
  its name at the foot over a dark fade, the players as a badge (no mode
  icons since 26 Sep 2026: the owner's word; the setup hero says how a game
  plays); three across on a phone (`auto-fill`, 6.5rem), more on a laptop.
  Under a real mouse a poster lifts (`translate` and `scale`, not
  `transform`, which the rise-in holds for the first visit) with
  `--poster-shadow-hover`. The description is the card's `title` (a tooltip) and no
  longer drawn - the "two lines" rule below is history. A section of one game
  is a wide poster (`.gcard--spotlight`, the same markup as before).
- **A featured poster on the home** (`catalogFeatured`, `.home-feat`): «★
  الليلة دي؟», one of `STARTER_SHELF` dealt afresh each time the home opens (`freshPick('home_feat')`, so all eight come round before one repeats; the owner, 26 Sep 2026, over a daily pick), with «▶ العب»
  and «🎲 غيرها» (the tonight sheet). It is a `.gcard` with `data-game`, so a
  search or a chip hides it like any card and the icon flight finds its
  `.gcard__icon`. Its `min-height`, `aspect-ratio` and the art's placement
  are on `.gcard.home-feat` (two classes: `.gcard` sets both later in the
  section). On a phone the art sits above the text; sideways and on a laptop
  the art sits at the inline end with the fade coming from the text's side.
  When the home is drawn again with another day's game, the new poster fades
  and rises in (`home-feat--in`, `featLastId` in `JS_Catalog.html`); never on
  the first paint of a visit, never with motion off.
- **Sections are shelves on a laptop and a TV** (from 900px wide and 501px
  tall): each section's grid (`.gcard-grid--shelf`, marked by `renderHome`
  and `renderTogether`; a section of one game keeps its spotlight) is one row
  of 9.5rem posters that scrolls sideways with snap and `hscroll-fade`'s
  edges. «الكل ›» at the end of the head (`.section__all`, `toggleShelf`,
  `home_shelf_all` / `home_shelf_less`) opens it back into a wrapping grid
  (`.section.is-open`, kept for the visit in `shelfOpen`); it shows only when
  the row runs past the edge or the section is open (`syncShelves`, run after
  the screen shows, on resize and after every filter). A search lays every
  shelf out as a grid (`#view-menu.is-searching`), so no result is scrolled
  out of sight. Phones keep the wrapping grid.
- **The bar has a raised centre button, «افتح غرفة»** (`#nav-room`,
  `.nav-item--room`, `.nav-room__btn`, in `Controller.html` between مع بعض and
  الأدوات): the most important action, under the thumb. In the landscape
  rail it is a round button among the tabs. The home's compact row of ways
  in dropped its «افتح غرفة» tile for it (three pills: join, TV, tonight);
  the first-visit start and the مع بعض tab keep theirs.
- **The setup hero is a poster** (`catalogHeroHtml`): `.game-hero__art`
  (the accent gradient with the icon big, fading into the card) with the
  rules button as a glass pill in its corner, then the title, the line and
  the meta as pills. The `.game-hero__icon` is still what the icon flights
  land on. The tab heads of مع بعض and الأدوات are the same kind of band.
- **The options under a setup hero** (26 Sep 2026, CSS only, scoped to
  `[id^="view-setup-"]` so the lobbies, Settings and the boards keep theirs):
  every `.field` - and a `<div>` whose first child is its `.field__label` and
  that holds no field or card - is a calm rounded row (`--surface-2`,
  `--r-lg`; `--surface-solid` inside «خيارات أكتر»); a label is `--fs-sm`
  700 in `--text-2`, no capitals or tracking; a count sits at the end of its
  label's row (`:has(> .field__label:first-child + .stepper)`, the stepper
  9.5rem) with round accent-soft − and + and the number in the display face;
  a segmented is a pill track with the accent thumb (`--accent-on` on it),
  but six options or more (شطرنج's seven clocks) keep rounded boxes, or the
  pill's ends cut their words; a switch glows when on; a list has the accent
  chevron (the saved-groups list's `background` shorthand had dropped it, so
  the chevron's size, repeat and place are set again). The segmented's words
  stay in the reading face: Kufi is too wide for seven clocks. بدون كلام's
  category and clock were loose labels in the card and are `.field`s now.
- **Tool rows** (the الأدوات tab, the score keepers too): one line of a 3rem
  poster thumb (the recents' gradient, the shadow on the glyph through
  `text-shadow`), the name over its line, the chevron.
- **Start is amber** (`--pop`, `--pop-on`, `--pop-glow`: the one colour that
  is no game's), on the Start bars (`.view-actions--start`, `.lobby-start`)
  and the featured poster's play; every other primary button keeps its
  screen's accent, with a glow.
- **The type**: Noto Kufi Arabic (`--font-display`) on what names a screen
  (`.shell__title`, section titles, card titles, sheet titles, the posters'
  names, the room code, `.btn`), IBM Plex Sans Arabic (`--font`) for reading.
  Baloo Bhaijaan 2 draws only the card games' numerals (سكرو, أونو, the
  playing cards, كدّاب's rank chips), so it is not in the page's font link:
  `ensureBalooFont()` in `JS_Core.html` adds its stylesheet the first time a
  view in `BALOO_VIEWS` opens (the five card rooms and `room-tv`), and the
  worker's `warm` fetches it and its font files after a first visit so it
  is there offline. A new rule that names Baloo puts its view in the list. Cairo is gone from the page; the share card and the chess canvas
  draw with Plex. Plex Arabic stops at 700, so the scale's 800 and 900 fall
  to it (the headings are Kufi, which goes to 900).
- **The tokens**: a violet-white ground with a still violet glow at the top
  and amber low at one side (`body::before`), `--surface-*` a shade of
  violet, violet-tinted shadows and `--poster-shadow` / `--poster-fade`;
  dark is near-black violet (`#0d0b16`) with the same glow stronger. Radii:
  cards 24px, sheets 28px. Every `[data-accent]` palette is as it was, so the
  game boards' colours didn't move.
- Decided while building (each one place): the featured game rotates by the
  day, not the phone's recents, so a table sees something new; tool rows keep their shape with a gradient icon tile; the
  room hub's tiles and every game screen are untouched.

Traps met (each also in *Traps*): a rule on `.gcard > *:not(.ripple)`
weighs (0,2,0), so a poster's badge must be placed with `.gcard > .gcard__badge`
or it stays in the flow; `.home-feat` written before `.gcard` in the same
section loses `aspect-ratio` and `min-height` to it; `body.dark .home-hero`
outweighs `.home-hero--compact`, so the compact row's `background: none`
needs the dark selector too; the first-play `<details>` is `width: 100%`
and needs `width: auto` when given side margins; and `body.dark .gcard`
(section 17's corner wash, and `body.dark .gcard--spotlight`) outweighs a
plain `.gcard`, so every dark poster was near-black until the gradient was
written with the dark selector too (found 26 Sep 2026). The
posters' badge and the setup hero's rules pill have no `backdrop-filter`
(a darker solid tint instead): thirty blurred badges over a scrolling grid
cost a phone frames.

**One voice** is section 17 of `Style_Cards.html`, the pass that made a lift to one
screen a lift to all of them. Four things were true everywhere, and none of
them was a bug, which is why they lasted:

- **There was no weight under 600 in the app**, so nothing could read as
  emphatic - a card's title and its description were both heavy and three
  pixels apart. Cairo and Baloo Bhaijaan 2 are asked for as **variable**
  ranges now (`wght@300..900` and `wght@400..800`), which is *fewer* bytes
  than the six static cuts they replaced, and `--fw-quiet` … `--fw-black`
  is the scale. Secondary text (a card's description, a hero's line, a meta
  row, a settings hint) sits at 400-600; the top of the range is kept for
  what names a screen.
- **Titles are set in `--font-display`** (Baloo Bhaijaan 2, already on the
  wire for سكرو's card numerals): a rounded Arabic-and-Latin face against
  Cairo's neutral reading voice. Deliberately **not** on `.metric` - clocks
  and scores need Cairo's tabular figures, or a counting timer jitters.
- **The ground is warm paper, and dark is ink** rather than cold slate. The
  `--n-*` ramp is untouched (a few rules read it directly); what changed is
  the surfaces built on it, each held within ~1% of the luminance it had, so
  every ratio the file fought for still holds. Shadows are warm-neutral: a
  blue-black shadow on warm paper reads as dirt.
- **A card carries its game's colour in one corner.** The note on `.gcard`
  is right that thirty tinted cards made the home a rainbow, but the answer
  was never "no colour at all" - it is the corner wash the setup heroes have
  always used, `color-mix(in srgb, var(--accent) 9%, transparent)` (16% in
  dark) blooming behind the icon and nowhere else, so a section reads as a
  family and a card still reads as white paper. `--wash-x` flips it to the
  inline-start corner in both directions.

Also there: a press is proportional to what is pressed (a 150px card moves
2%, a 44px chip 7% - one scale for both made the card lurch), the mode
glyphs on a card are quiet ink so the game's own icon owns it, and the
section rule fades away from its title instead of running flat to the edge.
Sticky section heads were tried and dropped: the page ground is a
viewport-fixed gradient, so a sticky band either mismatches it or needs
`background-attachment: fixed`, which iOS Safari does not honour.

**The finish** is section 11 of `Style_Finish.html`: a still glow behind the top of
the page, a header that turns frosted with a hairline once the page has
scrolled under it (`.shell.is-scrolled`, set by a scroll listener in
`initializeApp`), a top light on `.btn--primary`, icon tiles with a soft
gradient and a hairline of the game's colour, grain on the home hero, hover
lifts only under a real mouse (`hover: hover` and `pointer: fine`), and the
home's cards rising in sequence. Nothing in it moves by itself; keep it that
way, and keep any new polish in that section rather than scattered.

**The intro** is what the page opens on, chosen by the owner from three
takes on 16 Sep 2026 ("the logo flies home"). `#app-loader` and its first-paint
styles are the critical CSS in `Controller.html`, so they are on screen before
any script: the mark settles, a line draws under it and shimmers for as long
as a slow phone is still loading, the name appears. A tiny inline script right
after it applies the saved theme and language (`gameTrackerState_v1`) so the
intro doesn't switch halfway, and notes `INTRO_T0`. `initializeApp` calls
`introExit` once `loadFromLocal` has settled which screen the app opens on.
On the home, and no sooner than `INTRO_MIN_MS` after the intro went up, the
mark flies (Web Animations, measured with `getBoundingClientRect`) onto the
header's `.mark--title`, which stays `visibility: hidden` under
`body.intro-flying` until it lands; the ground fades and `body.intro-reveal`
raises the home and the nav. Anywhere else - a game or a room restored by a
reload, a `?room=` link, the install steps, a hidden tab, reduced motion - and
after a tap on the intro (`skipIntro`), it is a short fade. Every step runs on
a timer, and `initializeApp` sets a safety fade too.

**A slow first load gets a scene** (the owner, 28 Sep 2026; *The owner's
specs*). An ES5 script and a small stylesheet in `Controller.html`, after the
intro's own scripts and before `Tailwind.html` - so the logo still comes first
and the scenes have arrived long before they are needed - set a timer for
2.5 s after `INTRO_T0`. If the app hasn't taken the intro away by then, it
builds one scene (`#intro-scene`, chosen at random; `window.INTRO_SCENE =
'fuse'` set before the page loads forces one for a test) and appends it to
`#app-loader`; `has-scene` fades the line out and grows the scene's height, so
the mark and the name glide up to make room. Each scene is CSS shapes and a
little SVG on a 200 × 72 stage (`.isc`, prefix `isc-`), transform and opacity
only; the dominoes, the bus and the fuse are mirrored in Arabic
(`.isc-r`, the «بوم!» turned back) so they move the way the page reads. The
line (`.isc-m`, the phone's own font - the app's haven't arrived) changes every
3 s with a fade (`POOL`: each scene's five and twelve general, `[ar, en]`, in
the saved language or the device's); a die gets new pips each throw
(`animationiteration`). Reduced motion, or Settings → الحركة → مقفولة read from
`ashryMotion`, shows the scene still (`is-still`: each piece's own resting
place) and still changes the line. `window.introSceneStop()` clears its
timers and fades the scene, returning how long that takes; `introExit`
(through `introSceneEnd`) waits that long before the flight, and `introFade`,
`introDone` and `skipIntro` call it too, so nothing is left running once the
app opens (`introDone` then hides the loader, which ends every animation).

**Motion** is section 14, with its script in `JS_Motion.html`: the intro's
idea - something flies to where it lives rather than vanishing and
reappearing - used where the player has just done something, and nowhere
else. `flyEmoji(emoji, fromRect, fromFontPx, target)` flies a copy of an icon
from one place onto an element and pops the element when it arrives (a timer
lands it too). The flight is a Web Animation of `transform` only, aimed at
where the element comes to rest (`restingRect` seeks the animations it rides
on - its screen sliding in - to their end, measures, and puts them back in the
same task): the browser runs it off the main thread and starts its clock on
the first frame it draws. It used to chase the element from a
`requestAnimationFrame` loop, and going back to the home - 600 elements to
draw - ate the start of the path and stuttered, while opening a light setup
screen looked fine. The ghost is drawn at the larger of the two sizes and
only scaled down, so the emoji stays sharp. It flies twice: the tapped card's
icon to the game's hero (`catalogIconFlight`, which `catalogOpen` measures
before the screen changes - cards pass themselves as `this`), and a room
dealing a game from the lobby (`playRoomGameStart`, from `Room.onChange` when
the stage leaves the lobby), which shows the game big on every phone and the
TV for under a second, then flies its icon into the header's
`#app-title-icon`. `animateScoreboards` counts up any
score that rose and slides any player whose place changed, from what the last
board in that room and game showed (`scoreMemo`); `renderScoreboard` gives
each row `data-pid` and `data-score` for it, and a score that went down means
a new game, so nothing moves. The bottom bar's highlight is one sliding
`::before` on `.shell__nav` placed by `syncNavPill` (run in the same
coalesced pass as the segmented thumbs), a new room code drops in letter by
letter, and a player who joins after you pops into the lobby
(`status-row--new`, `lobbySeen`). All of it is still under reduced motion and
in a tab that isn't showing.

**Filtering rearranges; it does not redraw.** Every catalog in the app filters
by toggling `.hidden`, which is `display: none` - so the most-used gesture on
the busiest screen (a filter chip on the home) was the one thing in the app
with no motion at all: cards vanished, sections collapsed, everything below
jumped. `flipGrid(root, mutate)` in `JS_Motion.html` reads where the items
are, hands the mutation straight through to the caller (so the filtering
logic is untouched and still the only thing deciding what is shown), reads
where they ended up, and runs the survivors back from their old place while
the newcomers fade up - transform and opacity, on the compositor. Two things
it has to get right, and both were found the hard way:

- **Measure relative to the container, not the viewport.** Hiding half a grid
  can make the scroller clamp its own `scrollTop`, and viewport coordinates
  read that clamp as every card flying hundreds of pixels at once.
- **Only animate what someone can see.** A catalog is several screens long;
  the first cut put 60 layers on the compositor to move things below the
  fold. Bounded to a screen either side of the viewport it is 11-13.

A caller that is painting for the first time passes `{ animate: false }`
(`applyHomeFilter` does): there is nothing to move from, and the cards are
already rising in sequence. A new screen that filters or reorders a list
should go through it rather than toggling classes on its own.

**Reveals play once per thing.** A room redraws a screen for reasons the
table never sees (the host changed, the language), so a reveal asks
`motionFirst(key)` while its markup is built: true the first time that key is
drawn on this phone with motion on, and a redraw shows the thing settled.
Anything that celebrates after a reveal goes through `afterReveal(el, fn)`,
which waits for the longest `data-reveal-ms` drawn into `el`, so confetti
lands with the answer rather than before it. The reveals:

- **Vote results** (`renderVoteResults` → `voteRevealTimes`): the bars grow
  one at a time from the bottom of the list up, and the winning (or
  highlighted) row last, after a beat; `--at` on each row is its moment, and
  `opts.delay` holds the whole list back (Fake Artist waits for its card).
- **"The spy was…"** (`spyRevealParts`, used by the الجاسوس, الحرباء,
  الموقع السري and الفنان المزيف results): the result card lies face down in
  the game's colour with a question mark and three soft ticks for 1.1s, then
  turns over; the cover goes when the card is edge-on.
  **The living spy** stands behind that card (`spyCastHtml(key, verdict, { kind,
  tv, loud, cls })` in `JS_Motion.html` 8b, section 44 of `Style_Living.html`, the
  cast of المشنقة's man: a trench coat, a hat, dark glasses). While the card
  is down he peeks over its top edge, peering over his glasses («مش أنا…»);
  as it turns he steps out and plays the verdict: `caught` - the cuffs snap
  on (`FX.spyCuffs`), the hat falls, he sulks («يااااه», now and then after);
  `escaped` (a wrong vote, a tie, or the word/place guessed) - a wink, a wave
  («سلامو عليكو!»), a whoosh (`FX.spyWhoosh`) and he tiptoes off the edge the
  way the page reads, leaving footprints; `revealed` (the host showed it with
  no vote) draws nothing (`spyCastVerdict`). `kind`: `spy` (الجاسوس), `chameleon`
  (a green coat with spots, الحرباء), `spyfall` (a suitcase, الموقع السري),
  `fake` (a beret, a brush, paint on the coat, الفنان المزيف). One phone's
  الجاسوس has no vote, so there he is `ask`: he stands there innocent and
  «اتمسك» / «هرب» under the question let the table tell the phone
  (`spcVerdict`, decided here). Keyed `spc|` + the card's key with
  `motionFirst` (the TV `spc|tv|`); drawn again while it plays it carries on
  (`spcLive`, `--spc-late`); afterwards, with motion off and in reduced motion,
  settled (cuffed and sulking; gone, only the footprints, the strip shorter).
  The stage clips only its bottom (`clip-path: inset(-100vh -100vw 0 -100vw)`),
  so the card's edge is his floor and he can still walk off the screen. Sounds
  by the room's one voice (`spyCastLoud`: the TV if there is one, else every
  phone). The TV frames of the four games draw him big above the result line.
  A layer on the card: the rules, the votes and the server are untouched.
- **The podium** (`renderPodium(state, board)`, at the end of the trivia,
  emoji, proverbs, five seconds, two truths and Stop rooms): the top three,
  second on one side of the winner and third on the other, rising 3-2-1.
  Ties share a place and its height. Fewer than two players or nobody scoring,
  and it returns '' so the screen keeps its plain champion line. The TV
  trivia podium rises the same way (`tv-podium--rise`).
  **Its options** (`renderPodium(state, board, { low, unit, noScore })`, the
  owner's picks 939 + 1225 of 7 Oct 2026): `low` ranks the lowest score first
  whatever order the board comes in, prints the real numbers (0 and below
  stand on a step too: nobody is dropped for "not scoring"), so a game that
  wins low never mirrors its board and patches the numbers back (سكرو's
  `skrPodiumHtml` and `skPodiumHtml`, ميني جولف's `mgPodiumHtml`, the card
  score keepers' كونكان); `unit` writes a small word under each number
  (`.podium__unit`); `noScore` leaves the numbers out when the places are the
  ranking (the bracket's champion, `tourneyChampionHtml`). Never write a
  regex over its markup again: give it the option.
  **A figure of the cast stands on every step** (the owner, 27 Sep 2026, the
  living characters; `podCastDress` in `JS_Motion.html`, section 44 of
  `Style.html`): the winner jumps with both arms up, a crown landing on its
  head; the second claps and nods; the third sulks with crossed arms and a
  pout, shrugs, then claps too (a ten-second loop). Flat cartoon, المشنقة's
  cast (ink outlines that stay dark in dark mode, skin, a shirt in the step's
  colour: the game's accent, silver, bronze), the name's first letter on
  the shirt. **No caller draws them**: a MutationObserver dresses any
  `.podium` or `.tv-podium` put into the page (renderPodium's, the card
  games', لودو's, بنك الحظ's, the tournament's, the TV trivia's) before it
  is painted, reading the rank from `podium__place--rankN` /
  `tv-podium__place--N`; ties each stand on their own step side by side. They
  hop on after their step rises only under `podium--rise` /
  `tv-podium--rise` (the caller's `motionFirst` key), so a redraw shows them
  settled (the third starts in its clapping, `--pod-d3`). A bubble now and
  then (`pod_bub_*`): the winner's on its own step under its feet, so no name
  or score is covered, the third's while it sulks; never on the TV. On
  تحدي المعلومات's TV cards the figures stand on top of the card
  (absolute), so the steps keep their heights. `.podium--plain` opts out.
  No sound: the callers' confetti and fanfare are the moment's.
- **A letter** (`spinLetter`, أتوبيس كومبليت on one phone, in rooms and on
  the TV): letters from `STOP_LETTERS` flick past, slowing, and the real one
  pops in; the cue sound plays when it lands.

Three more are moves rather than reveals: a solved Connections group's tiles
fly into the row that took their place while the tiles left behind slide from
where they were (`flyConnectGroup`, measured by `connectTileRects` before the
grid is redrawn, the finish waiting for the last row); the team generator
deals the names into their teams one at a time in the order they were drawn
(`dealTeams`, ghosts above the page because the team cards clip, each landing
on the name itself); and going back from a game's screen to the home, مع بعض
or الأدوات flies its hero icon home to the tile it was opened from
(`heroHomeFlight` from `setView`, `catalogReturn` remembering whether that
was the recent tile or the card).

**Pass-the-phone roles are held, not tapped.** الجاسوس, الحرباء and الموقع
السري on one phone put the role on the back of a `.hold-card`: it turns over
only while a finger, the mouse or Space is on it, and turns back the moment
it lets go, so the next player never catches it. The role is filled in when
the player's name is shown (`showRevealStep`, `showChameleonRevealStep`,
`showSpyfallRevealStep`), `holdCardReset` puts the card face down with the
done button hidden, and the button (`data-next`) appears once the role has
been up for `HOLD_SEEN_MS`. The handlers are delegated in `JS_Motion.html`,
so a new `.hold-card` needs no setup. The faces swap `visibility` halfway
through the turn as well as relying on `backface-visibility`, and nothing on
these screens may play a sound that differs by role: the old chameleon and
spy reveals played an alarm for the impostor and a chime for everyone else,
which told the whole table.

**Motion everywhere** (the owner, 26 Sep 2026: "smooth, nice motion
everywhere, on every screen and not only in some games"). The plain screens
share one small system, `JS_Motion.html` section 13 and `Style.html` section
41, so a new screen gets it by being the right kind of screen, not by code of
its own:
- **A screen entered rises in.** `setView` calls `motionEnterView` (only when
  the screen changed, never on a redraw or a room's state update); for the
  screens `viewRises` allows - every `setup-*` (the daily hub, أرقامي and the
  archive included), `play-cs-*`, and the list `RISE_VIEWS` (`room-lobby`,
  `room-join`, `timers`, `play-universal`, `play-tourney`, `results-teams`,
  `input-whoami`) - its first cards, and when there are only two or three of
  them their first rows too, rise one after another (`motionRiseIn`: 12px and
  a fade, 320ms, 40ms apart, only what is on screen). Every other `play-*` and
  `room-*` screen is left to its game's own choreography; `RISE_SKIP` opts a
  listed screen out. A popup opened in the same moment takes the stage.
- **A popup opens with a spring** (`dialogSpring`, 260ms, `backwards` so an
  open dialog carries no transform) and its rows rise under it
  (`motionRiseModal`, called by `hoistModals`' observer when an overlay loses
  `hidden`). The close is still `modalExitGhost`.
- **Controls answer**: chips and segmented options give under the finger and
  spring back (a delegated press, `PRESS_TARGETS`); a stepper's number, the
  counter's score and the timer's display pop when they change
  (`motionBump(el)`); a `<select>`'s label flashes when its choice changes;
  the lobby's Start breathes once when enough people are in (`motionNudge`).
- **Lists**: the lobby's rows go through `motionRowsSwap(list, mutate)` -
  whoever stays slides, whoever left fades where they stood (a ghost of the
  old row, removed by a timer); a new set of help results rises in.
- **The header**: the title cross-fades with a 4px rise, the back chevron
  fades and grows in.
All of it is Web Animations of the individual `translate` / `scale` /
`opacity` properties (they add to whatever `transform` a component uses) with
no fill after the end, each run finished by a timer too, and nothing when
`motionOff()`. To give a new plain screen the entrance, its view id matches
`viewRises`; to give a changing number its pop, call `motionBump` after
writing it; to animate a rewritten list of rows, wrap the write in
`motionRowsSwap`.

**The dice and the coin** are section 13: a real cube of six pip faces in 3D
(`DIE_PIPS` draws the pips into a 3x3 grid, `DIE_LANDING` says what to rotate
the cube to for the value that was actually rolled, opposite faces adding to
seven) and a coin that is tossed on a wrapper while it turns on its own X axis
(`coinTurns` only ever grows, so it always spins forwards and lands heads at a
whole turn, tails half a turn past). `--die` is the cube's size, and the faces'
`translateZ` is half of it, so a short screen shrinks the whole die by changing
one value. Both fall back to the result with no motion under
`prefers-reduced-motion` - which the desktop app's preview pane reports, so
the tumble cannot be seen there without overriding both the CSS and
`matchMedia`.

**Smoothness** is section 12 of `Style_Finish.html`, with its script in
`JS_Core.html` and `JS_Catalog.html`. A phone with recents gets the home hero
folded to one row of the ways in (`home-hero--compact`, *The catalog and the
home screen*); a game card is one shape
(icon and mode icons on one row, two lines of text, players and minutes on
one line); every setup screen's Start is moved once at start-up into a
sticky `.view-actions--start` bar at the foot of its panel
(`stickySetupStarts`, keyed on the button's `data-i18n`); the filter and
recents rows fade at the edge they can still scroll toward (`hscroll-fade`,
`watchScrollFade`); the home, مع بعض and الأدوات animate in only the first
time in a session (`settleStagger`) and come back where they were scrolled
(`viewScroll` in `setView`, on the way back only); the segmented control's
thumb slides (`syncSegmented`: the active option's place as `--seg-x` /
`--seg-w`, re-read by a MutationObserver on class changes, on each
`setView` and on resize, `has-thumb` once measured); counts are steppers
(`stepField`, `data-min` / `data-max` / `data-step` on a read-only input
with the old id, so the games read `.value` as before); Settings rows carry
a hint (`setting-row__hint`); and the lobby shows a shimmering skeleton
(`lobbySkeleton`) while a room is created or joined.

`Style.html` is a token-driven design system. Read its section header before
changing anything: colour, spacing, radius, duration and elevation all come from
custom properties in section 1, so a change happens in one place.

**Toasts stack** (`showToast(msg, type)` in `JS_Core.html`, 28 Sep 2026; the
signature and its 145 callers unchanged). They go into one `#toast-stack`
(`.toast-stack`, `--z-toast`, `--z-full-toast` over a full-screen tool), which
sits where a toast always sat - above the bottom bar, at the foot on a phone
on its side - with the newest at the bottom and three at most (two on a screen under 500px
tall, a phone on its side): one more sends the oldest away first (`toastMax`). A toast stays 2.5 s + 60 ms a character,
2.5 to 7 s, an error a second more (`toastMs`); the same words and type again
while it shows restart its clock with a small pop instead of stacking a
second; a tap takes it away and the ones above slide into its place
(`toastDismiss`). It is `role="status" aria-live="polite"`, an error
`role="alert"`, and its words go in just after it is in the page so a screen
reader hears them. In and out with transform and opacity; with motion off
(`motionOff()`) it simply appears and goes. The stack lets taps through
around its toasts; a toast itself takes one (to be dismissed). The new-version
note (`.toast--action`) is its own fixed toast, as before. Found on the way: in
dark mode a success or error toast was grey with dark ink (`body.dark .toast`
outweighed `.toast.error`); both colours carry the dark selector now.

**A popup closes with motion, and still closes at once** (26 Sep 2026, P14).
`closeModal` and `closeAllModals` hide the real overlay straight away - so a
popup opened next, the history (`navReconcile` counts
`.modal-overlay:not(.hidden)`) and the clocks all see it closed - and
`modalExitGhost` lays a copy over it that scales down and fades
(`.modal-overlay--ghost`: no ids, no taps, not a `.modal-overlay`), removed by
its animation and by a timer. Nothing when motion is off. **Every popup closes
through them** (26 Sep 2026): the seven that were hidden by adding `hidden`
directly (the reorder list, the switch and its confirm, the mid-game player, the
status edit, the timeout sheet, the countries list) call `closeModal` now, and
the edge swipe's close of a popup with no id lays the ghost itself. Only the
start-up sweep in `initializeApp` hides them plainly (nothing is on screen yet).
A new popup is closed with `closeModal(id)`, never `classList.add('hidden')`.

**Keys look like keys** (Wordle, ربع قرد's letters): `.key` is white paper
with a hairline and a lower edge, like the phone's own keyboard - it was
`--surface-3`, #f7f5f1 on a #f5f3ee page, and the keyboard all but vanished.
Dark mode keeps `--surface-3` through `:where(body.dark) .key`, weightless so
the right/present/absent colours still win.

**Performance: what makes a style recalc slow** (28 Sep 2026, measured in
headless Chrome at 6x CPU throttling, the numbers are that throttled time).
Room screens rebuild their `innerHTML` on every state push, so the cost of
styling new elements is paid all evening. What it cost, and what it costs now:

| action (host phone, 375x812) | before | after |
| --- | --- | --- |
| 8 s of أونو, four people (style recalc, total) | 1,865 ms | 89 ms |
| 6 s of الدومينو | 102 ms | 23 ms |
| a lobby: create, three join | 255 ms | 18 ms |
| opening a setup screen | 211 ms | 171 ms |
| typing 12 letters in a setup field | 189 ms | 155 ms |
| a filter chip on the home | 249 ms | 223 ms |

Rebuilding a screen's markup once (the recalc alone): the home 17.7 → 7.3 ms,
a setup 24 → 10, sudoku 19 → 8, the lobby 31 → 17, أونو 27 → 14, الدومينو
18 → 7; the same halving at 667x375 and 1280x720. Nearly all of it was **one
rule**: `[id^="view-setup-"] :is(.field, div):has(> .field__label:first-child +
.stepper) > :not(.field__label, .stepper)`. A `:has()` on an ancestor compound
with a universal subject makes Chrome re-check `:has()` state far up and
across the tree on every DOM change anywhere - a setup-screen rule was half of
every room screen's recalc. Rules learned (the tools, in the log below, are
worth rerunning after a big CSS change):

- **`:has()` goes on the subject, or on an ancestor of a class subject -
  never above `> *`, `> :not(...)` or `~ *`.** When a parent must be found by
  what it holds and the rule styles its children, mark the parent with a class
  in the markup instead (`.stepper-row`, `.has-art`), repeated or wrapped in
  `:where()` to keep the old selector's weight so the cascade can't change.
- **No universal subject after a sibling combinator** (`.tv-art ~ *` walked
  every element's previous siblings on every recalc): `:where(.parent) >
  :not(.x)` does the same for a known first child.
- **No attribute substring on the subject** (`[class*="tabular"]` is tried on
  every element): name the class.
- Everything else measured small: all 338 keyframes, the tokens, the universal
  `*` / `::before` / `::backdrop` rules and Tailwind together cost less than
  the one rule did; the remaining ~86 `:has()` rules are about 1-2 ms of a
  rebuild together, none over the noise alone.
- **Dead CSS**: a coverage run (every view at 375x812, 667x375, 1280x720,
  1920x1080 and 768x1024, both languages and themes, motion on and off, every
  popup, every one-phone game started, every room game dealt to five phones and
  a TV) used 4,006 of 7,070 style rules. Unused is not dead: a rule is deleted
  only when a class or id it needs appears in no source file at all, counting
  strings built as `'x-' + n` / `` `x-${n}` `` (the `btn-*` aliases stay). That
  removed 27 rules, 8 dead selectors from lists and one keyframes (~3 KB
  source, 0.4 KB gzipped); the rest of the unused rules belong to states the
  run didn't reach.

**Six older screens brought into the look** (the owner, 30 Sep 2026, "apply all
6" from a before/after sheet of every screen; `Style_Talk.html`'s section *SIX
OLDER SCREENS*):

- **The team results** (`paintTeams`, JS_Teams.html): a summary line (how
  many, «4 ضد 3», «قرعة» or «بالمهارة» from `appState.teams.resultHow`), a card
  per team in `--team-red`, `--team-blue`, `--success-btn`, `--warning-btn`
  with its count, the names in tiles of two with an initial, side by side from
  640px (56rem wide on a laptop). «وزّع تاني» deals again the way it was dealt
  (`teamsDrawAgain`), 📤 shares the teams as text (`shareTeams`, through
  `shareOrCopy`), and «غيّر اللاعبين» goes back to the setup instead of home.
  `dealTeams` flies each name by its `data-name` onto `.teamres-name`. On a
  phone on its side the three buttons sit on one line.
- **مولد الفرق's count** is the segmented control, and under it
  `paintTeamsSplit` says how the ticked players split («7 لاعبين: فرق من 4 و3»);
  `renderActiveChips('teams-player-list')` calls it.
- **العداد العام** (`renderUniversalBoard`): each row is the place (👑 for a lone
  leader; a tie shares a place), the name, a quiet −, the score and a big + in
  the screen's colour at the end. «صفّر الكل» resets at once and for 6 s the same
  button is «↶ رجّع النقط» (`univResetTap`), an undo instead of a confirm.
- **من أنا؟'s writing step** (`renderManualInputScreen`): the play screen's pass
  poster, a dot per writer (the one writing drawn long), a label, the name as
  dots until 👁️ (`.secret-field`, with its own `waWriteDots` / `waWriteEye`
  since المشنقة's helpers are in another chunk), a hint that follows the two
  ways of writing, and «تمام، اللي بعده» / «تمام، يلا نلعب» for the last one.
- **الجاسوس's talk** (one phone): the clock in the general timer's ring, which
  goes round once a minute (it counts up; `updateImposterTimerUI`); players as
  chips with an initial; «اتهموا حد» in the bar at the foot with «اكشف على طول»
  and «خروج» small under it (the reveal hides with the accusation once the round
  is decided). The same talk (`.talk`, `.talk-people`, `.talk-person`,
  `.talk__actions`, `.talk__pair`) is الحرباء's and الموقع السري's since the
  owner asked for it the same day: الموقع السري's clock in the ring, emptying
  over the round and red in its last minute (`updateSpyfallTimerUI`), its
  players (`renderSpyfallPlayers`), «اتهام لاعب» in the bar and «🕵️ أنا
  الجاسوس» (the spy's own guess) beside «إنهاء»; الحرباء's speaking order as the
  same chips with the place in the circle and the first speaker lit. On a phone
  on its side the ring is small and the bar is one line.
- **خمّن الرقم**: «رقمك» and a «خمّن» button instead of "?" and ✅; the guesses as
  chips, newest first (`drawGuessRow`: ⬆ higher, ⬇ lower, ✅); «لعبة جديدة» in
  the bar.

The counter, the writing step, the talk and Guess the Number take a form's
width (40rem) on a laptop, like the setups.

**The second batch (1 Oct 2026)**, from a scan of every game mid-play, every
room game on five phones and a TV, and the popups (the owner: "Apply all 10 and
the small fixes"); the details are in each game's file:

- One phone: إكس أو (the duel pills, one board of thin lines, a new «رجّع»
  that takes back moves within a round - `duels.md`), خمّن الدولة (the
  `.gn-entry` field and guesses as chips - `solo.md`), المشنقة's writing step
  (the Who Am I layout, `hmWriteFormHtml({ local: true })` - `hangman.md`),
  سلسلة الإجابات (hearts, a ring clock, bigger answers), فوازير إيموجي and كمّل
  المثل (the card takes the screen, the reveal in the bar - `party-rooms.md`),
  كلمات من حروف fitting upright, and the mid-screen «خروج» of a dozen games a
  small quiet button at the foot (`.play-foot`, `.play-exit` - `solo.md`).
- Rooms on the phones: ربع قرد (an 11-column keyboard that fits, the players as
  chips with their state, the main pair in the bar - `monkey.md`), الجرس's host
  (صح / غلط the main pair, the rest a quiet row, the buzz order as chips -
  `buzzer.md`), خمس ثواني (compact standings, start in the bar), زي الكل's
  standard send, and votes whose options are all players drawn as player tiles
  (`roomPersonChip`; `notes/rooms.md`).
- The TV: the race frame of the ten puzzle races as a card a player
  (`raceTvCardsHtml` - `race.md`), جمجمة round a table (`sklTvFrame` -
  `skull.md`), and one waiting stage while a player sets or writes
  (`tvWaitStage` in JS_RoomTv.html - `solve.md`, `hangman.md`).

## From GEMINI.md: Layout: the app shell

**Landscape phones.** A phone on its side is 360–430px tall, and laid out like
portrait the app stayed a 520px column in the middle of the screen with a third
of the height gone to the header and nav. The *LANDSCAPE PHONES* block at the end
of `Style.html` (`orientation: landscape` and `max-height: 500px`, so tablets
keep portrait's layout) makes the app full width, turns the nav into a rail at
the inline-start edge, centres views in a readable column (the menu gets more
tiles per row) and tightens spacing that only existed to fill a tall screen.

Screens with a board and its controls put them side by side there, each through
a wrapper that is plain flow in portrait:

| wrapper | screen |
| --- | --- |
| `.play-stage__playing` (`__head` / `__card` / `__actions`) | Charades, Describe It |
| `.wordle-layout` | Wordle: board beside the keyboard; on a phone on its side the keyboard takes the width 28px keys need (35px in English) and the board, a size container, fits its grid in what is left (`cqw`/`cqh`), letters scaled to the cell |
| `.draw-layout` (`__head` / `.draw-wrap` / `__side`) | Draw & Guess, Fake Artist; the canvas is sticky so the tools can scroll |
| `.cn-layout` | Codenames: board beside the clue and controls |
| `.tb-play` | دوري المعرفة: board beside the scores |
| `#view-play-chess`, `#view-play-reaction` | the two halves split left and right |

A new screen like these needs its rule in that block, and every change gets a
look at 667×375 as well as 375×667. `docs/manifest.webmanifest` says
`"orientation": "any"` so an installed app turns too; nothing generates that
file, so it is the one thing in `docs/` edited by hand.

**Tablets, laptops and TVs.** Every size in `Style*.html` is in rem: spacing,
radii, button and field heights, widths. So the font size on `<html>` scales the
whole app, while a phone keeps the default 16px.

- **Root size.** The ANY SCREEN block picks a larger one on big screens: 17px
  from 1024×700, up to 32px on a 4K TV.
- **Override.** Settings → Screen size (`html[data-ui-scale]`, `cycleUiScale` in
  `JS_Core.html`) sets it by hand, for a laptop driving a TV.
- **New sizes.** Write them in rem: a px size stays phone-sized next to text that
  grew. Borders and hairlines under 4px stay px.

The layout blocks:

- **Shared** (a phone on its side, and any screen at least 900 wide): the rail,
  the centred column, and the boards beside their controls.
- **Short** (a phone on its side, 500px tall at most): tightens spacing that only
  fills a tall phone screen.
- **Wide** (at least 900 wide): more padding, wider views and bigger keys.
- **Tablet held upright:** a 45rem column.
- **Big screen view** (`room-tv`): pins the root back to 16px, because it sizes
  itself in vmin.

Check a change at 375×812, 667×375, 1280×720 and 1920×1080.

## From GEMINI.md: Navigation

**On an iPhone the back swipe is the app's own.** The owner reported twice
that swiping back on the iPhone "doesn't get the same animation as the back
button": Safari's gesture slides a picture of the page and the app then
changes screens with none of its own motion (with one trap entry the picture
was even the same screen). So on iOS (`EDGE_IOS`, Safari and the home-screen
copy) a touch that starts within `EDGE_PX` (20px) of the left edge is taken
first - `preventDefault` on `touchstart`, which iOS honours at the edge - and
only when there is somewhere to go back to (a popup, or any screen but the
home). The current view follows the finger (`translateX`); letting go past a
third of the width, or a quick flick, slides it out and runs `edgeBack` -
exactly the header arrow: the top popup closes, a game asks first
(`openExitSheet`), otherwise `goBack` with its slide and the icon flying home.
A shorter drag springs back. Because the default is prevented, the handler
passes a tap at the edge on as a `click` and scrolls `#shell-main` itself for
a vertical drag. If Safari takes the gesture anyway, the page receives
`touchcancel` rather than `touchend`, so nothing is done twice. Elsewhere
(Android's back button and predictive back, desktop browsers) the history
entries above do the work, and a browser that animated the way back itself
(`hasUAVisualTransition`) isn't slid in twice. iOS limits `pushState` to about
100 calls in 30 seconds; nothing here comes close. To test the swipe off an
iPhone, force `EDGE_IOS` true in a copy of `.preview/index.html` and dispatch
`TouchEvent`s at `#shell-main`.

## From GEMINI.md: Feel

**Some icons are drawn.** Emoji has no Uno card and no domino (🀄 is a
Mahjong tile), so أونو and الدومينو (and the domino score keeper) have
`icon: 'art:uno'` / `'art:domino'`: a small SVG in `ICON_ART` (JS_Core.html)
in the game's own colours - UnoCards' red with a white 7 over a blue card, the
ivory 6|6 with black pips and the brass pin - flat, with no ids, so a page can
hold it any number of times, and 1.2em square (`.art-icon`) so it sits and
grows wherever an emoji would. **An icon is never written straight into
markup**: `iconHtml(icon)` gives the emoji or the SVG, `iconText(icon)` the
emoji or nothing (a line of plain text: the room banner, the chat's "started"
line, which draws the SVG beside its text instead), `artIconImage(icon)` an
image for a canvas (the share card), `flyEmoji` flies either, and markup
written in `Controller.html` asks for one with `data-art-icon="domino"`,
filled in at start-up. A new drawn icon is one more entry in `ICON_ART`.

Motion uses the `--ease-*` and `--dur-*` tokens. Everything is gated behind
`prefers-reduced-motion`, and the drifting background animates `opacity` on a
fixed layer so it costs no repaints.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **1213 Tap the title to go to the top.** `titleTapToTop` (JS_Core.html, beside `syncChrome`), wired on `#app-title` at start-up: a tap glides `.shell__main` to the top through `scrollToAction()` (instant with motion off), as an iPhone's status bar does for an ordinary page - which can't work here, since only `.shell__main` scrolls. A focused field in the scroll area is blurred first (`scrollToAction` won't move while one has the focus).
- **1220 «رجّع الأصلي» and a dot on what changed.** Every remembered setup option (`data-remember`: steppers, switches, lists, a time pick's hidden field, number boxes; never a name typed in a text box, nor the room side of a setup) keeps the game's default on itself the first time it is recalled, before the recall (`setupDefaultSnapshot`, `data-def`; a `<select>` filled in JS takes it again once it has options). `setupResetSync(view)` (end of `paintSetupOptions`, and after every input/change/click on a setup) puts `.is-changed` on the label of each option that differs - a small accent dot after it (`.field__label.is-changed::after`, Style.html beside `.field__hint`) - and, while any visible one does, a ghost «↺ رجّع الأصلي» (`.setup-reset`) under the block of the last of them. `setupResetAll` puts each back, fires its `input` / `change` (the game's own handlers run, `rememberField` remembers the default), then paints the setup again. Not covered: options a game keeps in its own state and paints from appState (the segmented rows of القنبلة, أتوبيس كومبليت, the solo setups…) - the shell can't know their defaults.
- **1231 The timer and the dice keep the screen on.** `wantsWakeLock` (JS_Utils.html) is also true for `tool-dice`, and for `timers` while the general timer runs; `toggleGenTimer`, its end and `resetGenTimer` call `syncWakeLock(appState.currentView)`, so the lock comes when it starts and goes when it stops - the phone no longer sleeps and lets iOS freeze the page before the alarm.

- **1238 Settings in three groups.** The sheet's rows sit under three small heads
  (`.settings-group__head`, an `.eyebrow`): «الشكل» (theme, size, motion, colour shapes),
  «اللعب» (the new sound row, the app's and the games' languages, your name, الشلة) and
  «التطبيق» (share, install, «انقل لموبايل تاني», version, update); «حذف جميع البيانات»
  alone at the foot after a line (`.settings-divider`). Chosen: the move-data row went
  under «التطبيق», the sound row heads «اللعب». Markup in `Controller.html`
  (`#settings-modal`), styles beside `.setting-row` in `Style.html`.
- **1254 Confirms that name the action.** `showConfirmModal(msg, cb, { yes, tone, icon })`
  (JS_Utils.html): `yes` a key of TRANSLATIONS (`cf_restart` «ابدأ من جديد», `cf_guess`
  «خمّن», `cf_resign` «استسلم», `cf_delete`, `cf_remove`, `cf_end`, `cf_skip`, `cf_clear`…,
  all in JS_Translations.html) or the words themselves; `tone: 'danger'` (red: something
  is lost - a game, a score, a member, the data) or `'accent'` (the screen's colour: a
  guess, a claim, a skip, a draw); `icon` the thing (🎯 a guess, 🏳️ resigning, 🧹 a
  cleared board). No third argument is the old popup (🤔, red, «نعم»); the button
  (`#custom-confirm-yes`) and the icon (`#custom-confirm-icon`) are set again on every
  open. Every caller passes its own (48 calls: الحرباء's and الموقع السري's guesses are
  «خمّن» on the accent now, not a red delete).
- **1249 A room link says where it is going.** With `?room=` (SERVER_DATA.room, read in
  `<head>`), the intro's first script adds «داخلين غرفة K7QM…» / "Joining room K7QM…"
  under the name (`.loader-room`, the code held left to right in an isolate) and sets
  `window.INTRO_ROOM_LINE`; the slow-load scene says that line first (its own first line
  goes back into its bag) and hides the line under the name while it is up.
- **1268 The night's card shows the night.** `shareRoomNight` (JS_ShareCard.html) adds
  the evening's games as their icons in one row under the champion's line, in the order
  first played (a drawn icon drawn as its picture, `drawShareNightStrip`), and the day in
  words under it («الجمعة ٩ أكتوبر», `shareNightDate`). The room keeps no list of games
  played, so each phone keeps today's for its room (`ashryNightGames_v1`,
  `shareNightRemember` on `Room.onChange`: a game counts once it is dealt); a phone that
  came in late knows the games since it came. The plate gives 160px of its room to the
  two lines when they are there.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **1226 A word under the number.** `renderPodium` (JS_Motion.html) prints a counted unit
  under every step's score: `opts.unit` is a kind (`'pt'`, `'stroke'`, `'miss'`, `'round'`,
  `'win'`, `'loss'`, `'pound'`), a word printed as it is, or `false`; left out it is the
  game's own (`podiumUnitOf(state)`: `PODIUM_UNITS` lists the games whose numbers are not
  points - wins for the race-to-the-end and duel games, الشايب's losses, the one-phone
  bomb's rounds (`code: 'bomb'`), المزاد's pounds, none for الليزر, the solve engine and the
  bracket; ميني جولف is strokes, or points in «ماتش بلاي»; the duels' tournament is points;
  everything else نقطة). `podiumUnitWord(unit, n)` counts it from `unit_<kind>` in
  JS_Translations.html («نقطة|نقط»): Arabic plural for 3-10 and the singular otherwise
  («١٢ نقطة», «٣ ضربات», «٢ غلطة»), English singular for 1. No caller had to change.
- **1230 A lone winner.** Two or more on a high-wins board and only one scored:
  `renderPodium` draws one raised step (`.podium--solo`, 6.5rem, Style_Finish.html) instead
  of nothing, so the callers' plain lines no longer show; the cast's figure wears the crown
  (podCastDress) and the step carries `data-confetti` - podCastDress fires confetti when it
  lands (only on the drawing that rises, never with motion off). A caller that also throws
  confetti at the end throws it twice; harmless.
- **1269 Units on the card.** The share card draws a row's unit (`row.unit` or `o.unit`, the
  same kinds) after its number in smaller type, on the number's inner side in reading order.
  `shareRoomResult` passes `podiumUnitOf(state)`; its text fallback says it too. The board is
  best first, so a low-wins champion is row one as it is (nothing re-sorts it).
- **1270 A chat-sized card.** Five rows or fewer (and no night strip) draw a 1080x1350 (4:5)
  card; longer boards and the night's card (games and date, another builder's rows) keep
  9:16. Every position is in `shareCardLayout(short)`.
- **1256 Toasts at the top while playing.** Under `body.in-play` / `body.in-room-game` (not
  the TV) the toast stack hangs under the header (`--safe-top + --header-h`), newest on top
  (`column-reverse`), entering and leaving upward; a full-screen view puts it at the top edge.
- **1257 An icon for each kind.** `showToast` marks success ✓, `warn` (or `'warning'`) ⚠
  (text presentation) and error ✕; info keeps ℹ️. `.toast.warn` got its colour
  (`--warning-btn` / `--warning-on`); it had none. `showToast(msg, type, { action: { label,
  run }, ms })` can carry one small button (`.toast__btn`).

- **1214 Tap the lit tab again** - see `notes/home.md` (the same batch): `navTo` hands a tap on the screen's own tab to `homeTabAgain`, which glides to the top and clears the home's search and chip through `flipGrid`.
- **1216 A crowded header folds its quiet buttons.** A `#hdr-more` «⋯» in `.shell__tools` (Controller.html), hidden by default; under 400px, when `body.has-fx.has-chat.has-mission` (🔊, 💬 and 📁 all showing, not on a TV), it shows and 🔊 and ⚙️ go (section 72 of `Style_Talk.html`). It opens `#hdr-more-modal` (`openHeaderMore`, JS_Core.html), a simple centred dialog: «🔊 لوحة الأصوات», «⚙️ الإعدادات» (each closes it and opens its sheet), «إغلاق». The build's CSS split puts that media rule in المهمة السرية's chunk (it names `.has-mission`, which only that game sets) - it is there whenever the class is.
- **1232 The running timer in the header.** `#timer-pill` is a second row of the header's grid (`grid-column: 1 / -1`, so it covers nothing; the header's first row keeps its height through `grid-template-rows`), rose (`data-accent="rose"`, accent tokens), «⏱ 3:42»; under 10 s it turns `--danger-btn`. `timerPillSync()` (JS_Core.html) shows it while `appState.timers.general` runs and the screen is not `timers`, from `updateGenDisplay` (every tick), the end of `toggleGenTimer` and an `onLeaveScreen` hook; it pops in once (transform / opacity, skipped when `motionOff()`). A tap is `timerPillGo()` → `navTo('timers')`, so mid-game on one phone it asks first. Chosen: a paused timer shows no pill.
- **1236 The timer screen in the design system.** `#view-timers`: «تصفير» is `btn--ghost` beside the primary Start (a `.btn-row`, equal halves); `space-y-4`, `py-10`, `mb-6`, `gap-4`, `mt-4` and the `flex` rows are gone for the card's own padding, `.gtm-card` (centred) and `.gtm-adjust` (a centred `.btn-row`, `--sp-4` under it). Found on the way: the Start button's `data-i18n="start_btn"` made every `applyTranslations` (each `setView`) rewrite a running timer's «إيقاف» back to «ابدأ» - `genTimerBtnKey()` (JS_Utils.html) keeps the key equal to the text.
- **1237 The chess clock on tokens.** `#view-play-chess` lost its Tailwind and inline styles: `position: fixed; inset: 0; z-index: var(--z-full)` (was 99999 inline), `background: var(--bg)`; `.chess-bar` is `--surface-solid` with `--border-strong` borders (all four solid, the landscape block's `border-width: 0 4px` still lands) and `--sh-4`, `z-index: 1` inside the view (was 100000); `.chess-bar__tools` a flex row with `--sp-4`; the times `.chess-half__time` (4.5rem, 6rem from 768px, tabular). `.chess-half.is-out` is `--danger-btn` / `--danger-on` (was #fff on `--danger`). The bar keeps physical `left` / `width` so the landscape override (the bar as the middle column) still applies in Arabic. Rules beside `.chess-half` in `Style_Screens.html`.

## The looks of 7 Oct 2026, second sheet (the owner's picks): built

- **1253 A, «فانوس جنب العلامة»: the season on the intro's mark.** In Ramadan (Islamic month 9) a
  small lantern hangs on a string beside the mark - on its reading-start side (the right in
  Arabic, the left in English, from the saved language as the title reads it) - comes down,
  swings and settles (one CSS animation, `intro-pend`, transform and opacity only, 2.4 s). In
  the Eid (Shawwal 1-3 and Dhu al-Hijjah 10-13) 26 amber dots like the mark's own dot burst
  from it and settle round the mark (`intro-dot`, each dot's place in `--x`/`--y`, its
  strength in `--o`, a fixed seed so it is the same every time). Everything else on the
  intro is unchanged. The date is `Intl.DateTimeFormat('en-u-ca-islamic-umalqura')` (then
  `islamic`; a browser without either shows nothing), so no date is ever updated. It is all
  in `app/Controller.html`: the styles beside the intro's (`.intro__season` is a zero-size
  anchor put before the mark, at its top centre, so nothing moves), the script in the intro's
  first `<script>` (ES5, in a try). It fades with the line when the mark flies home
  (`#app-loader.is-flying .intro__season`); under reduced motion it stands still at its end.
  About 1.3 KB gzipped on the first visit. **To see it**: `?season=ramadan` or `?season=eid`
  on a local preview (localhost, 127.0.0.1, `.localhost`, `.test`; ignored on the live
  hosts), or `introSeason('ramadan' | 'eid')` from a test while the loader is up.

## The design rules of 8 Oct 2026 (the owner accepted all nine)

A check of the written rules against the code (`/ui-system`), with a before/after
sheet of the real tokens (`ui-review/style-before-after.html`, not committed). What changed:

1. **The text floor.** `--fs-xs` 11 → 12px. Measured at 375px: 18 of the 26 texts on
   the first-visit home and 82 of 168 on مع بعض were under 12px. No text under 12px,
   except a game's board art. About 90 sizes typed under 12px in the games' own
   sections stay until each game is next touched (Stop's ✓ and شطرنج الأربعة's points
   moved now).
2. **Small coloured text takes the `-ink`.** About ten rules used `--success` /
   `--danger` as small text (green on white 3.77:1); they read `--success-ink` /
   `--danger-ink` now. Big clocks and scores keep the bright colour (large text).
3. **One focus ring:** `var(--focus-w) solid var(--accent-ink)`, 3px. It was 2px of
   `--accent`, 2.87:1 on the amber screens, and 25 rings in the games picked 2px or 3px
   by hand. Rings on a game's dark board keep their white or gold, at `--focus-w`.
   Trap: a `--focus-ring: var(--accent-ink)` on `:root` resolves there, so it stays
   violet under every `data-accent`; write `var(--accent-ink)` where the ring is drawn.
4. **A field's edge** is `--border-field` (22%, light 1.61:1, dark 2.05:1); `--border`
   (8%, 1.18:1) left a white field on a white card with no visible box. A full 3:1
   edge would need about 45%, which read heavy.
5. **One error line**, `.field__error` (13px, `--danger-ink`, hidden when empty, no
   margin inside a simple dialog); `.field-error` (11px, `--danger`) went - the
   password popup was its one use.
6. **"Never hardcode a colour" is the frame's rule**: the 1,491 colour literals were
   almost all games' own looks. A game's palette is declared once as custom
   properties at the top of its section.
7. **Sizes and weights from the scales** (`--fs-*`, `--tv-*`, `--fw-*`), in rem, never
   px: px doesn't grow with Settings → Screen size. For new code; 102 distinct typed
   sizes are left as they are.
8. **The legacy `.btn-blue` … `.btn-gray` aliases were deleted**: nothing used them.
9. **The weight scale `--fw-*` is written down** (rule 7) rather than dropped.

The 12px floor pushed «اعمل مسابقتك»'s question list 6px wider than the phone at 375:
`.ql` was a grid with no columns, so its one column took the rows' widest content (an
answer that doesn't wrap). It is `minmax(0, 1fr)` now - any grid of rows wants it.

## Calmer setups (the owner's picks of 8 Oct 2026: 1C 2A 3A 4C)

A setup shows the 2-3 options most tables change; the rest go under «⚙️ خيارات أكتر» (`details.setup-more`, its line from `setupMoreSummarise`) - a new setup with more than three options does the same. An explanation under a switch shows only while it is on, so write it as what turning it on does. On an upright phone the poster is the short one (icon beside the name); its mode pills don't repeat the one phone / own phones switch. Big pickers stay one tap a choice at 44px, packed tighter (chess's faces four to a row). Styles: section 76 of Style_Talk.html.
Every setup reads the same way, top to bottom: the poster, the mode switch (if any), the options as tiles, «خيارات أكتر», the players, then Start in a sticky bar inside the card (unified 8 Oct 2026).
