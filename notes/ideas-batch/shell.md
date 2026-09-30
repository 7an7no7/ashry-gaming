# Ideas batch: shell

Six items, all in the page (nothing the rooms server runs changed: no deploy of
the rooms server needed for this slice).

## 1. One wording for "one phone / own phones"

- `mode_device` / `mode_online` (the setup switch on ~30 screens) now say
  «موبايل واحد» / «كل واحد بموبايله» ("One phone" / "Own phones"), the words
  the hero, the home filters and «الليلة دي؟» use. The fallback text in
  `Controller.html` changed with them. `flt_room` and `mode_badge_room` said
  «من موبايله»; now «بموبايله» too, so there is one spelling.
- **The setup hero's mode pills are the switch** where a screen has one
  (`catalogHeroHtml(g, t, switchId)` in JS_Catalog.html): each pill is a
  button (`.meta-bit--pick`, `data-pmode` 'device' | 'online') calling
  `setPlayMode(id, side)`; the 📲 and 📺 pills are both the 'online' side. The
  lit side follows the switch: `heroSyncModes(view, mode)`, called from
  `applyPlayMode` (JS_RoomGames.html) and when the hero is built
  (`syncGameHero` reads the switch's active item). With no switch on the
  screen the pills are plain words (no background, no border, `--text-3`).
- CSS: the IDEAS BATCH: SHELL section at the end of Style.html.

## 2. «الليلة دي؟» goes the way the table said

`tonightGo(id)`:
- more than one person and "own phones" or "TV", and the game has a room:
  - a setup with the switch: `playModeOnce` = online, open the setup, press
    its online panel's primary button (so the catalog id → room id mapping is
    the setup's own, e.g. شطرنج → chess);
  - a room-only game: its catalog `open` (= `roomCreateFor`).
- "TV" **on a laptop or TV** (`tonightIsBigScreen()`: ≥900×540 with a fine
  pointer): this device opens the room as its big screen with the game chosen
  (`roomCreateScreenOnce` in JS_Room.html, consumed by the next
  `roomCreateFor`, which then does `Room.create('', gameId, true)` and shows
  `room-tv`). On a phone "TV" opens the room from the phone (the lobby's QR
  brings the TV in). Decided here: a phone can't be the TV.
- one phone (or "لوحدي"): `playModeOnce` = device, then `catalogQuickStart`
  for the games in `QUICK_START` (asks «مين بيلعب؟» when names are missing),
  else the setup. A phone that remembers "own phones" for that game still gets
  the one-phone side for this start (it isn't remembered).

## 3. The recent row first

A returning phone's home is now: «كمّل» card (item 4), the recent row
(`home-recent--slim`: a small head, tight margins), the featured poster, the
ways in, search, تحدي اليوم, the sections. The first visit's simple start is
untouched.

## 4. «كمّل: …» on the home

`HOME_CONT` (JS_Catalog.html, just before `renderHome`) is the registry:
`{ key, game (catalog id: title/icon/accent), view() (the play view), live(),
line(t)?, go() }`. Covered: بدون كلام / أوصف لي team relays
(`relayInProgress`, go = setup + `charadesResumeMatch` / `describeResumeMatch`),
دوري المعرفة (`triviaStarted`, `resumeTriviaBoard`), بنك الحظ, لودو, السلم
والتعبان, شطرنج, كونكت ٤, نقط ومربعات, حرب السفن, بولينج, ميني جولف (their own
`xContinue`), ربع قرد, سكرو's and الدومينو's score keepers, the solo boards with
`state().phase === 'play'` (`homeContSolo(id)`, go = `SOLO_GAMES[id].resume()`),
and a daily set aside (→ the تحدي اليوم hub). Lines where cheap: the relay's
turn, the board's round, سكرو's round, 2048's score, the daily.
- `homeContMark(from)` stamps `ashryContinue_v1[key] = Date.now()` on every
  `onLeaveScreen` from that game's view; `homeContPick` shows the live one with
  the newest stamp (unstamped = oldest). One card at most, never on a first
  visit, ✕ hides it for the visit (`homeContHidden`, fades out).
- A new one-phone game with a "continue" adds a line to `HOME_CONT`.
- Not included: games that can't honestly resume (a timed round mid-clock -
  بدون كلام without teams, كلمة واحدة, من أنا؟), card score keepers `cs-*`,
  المشنقة's endless tally, الذاكرة / إكس أو.

## 5. The host's room list

`renderRoomHub` → `roomHubListHtml(state, t)` (JS_Room.html): «✅ تنفع دلوقتي
(N)» with the tiles this room can start now, then `<details class="room-hub-more">`
«محتاجين ناس أكتر (N) ▾» with the rest (and switched-off games) under the
home's section heads (`tvHubGroupOf`). Opened state kept for the visit
(`roomHubMoreOpen`, the `data-r` trick against the toggle a drawn-open details
fires); open by itself when nothing is playable. A family opened (chess's ways,
the race) is one flat list as before. Poster markup moved to
`roomHubPosterHtml`, unchanged. The TV's host list is unchanged.

## 6. The TV lobby with nobody in yet

`tvLobby` (JS_RoomTv.html): a host TV whose room has no person yet draws
`tvLobbyEmptyHtml`: the QR big (min(60vmin, 42vw)) beside the code (1.35×),
«📷 امسحوا الكود» breathing (`tv-cta-pulse`, no-preference only), the join
address, the hint, and the chosen game if any («اللعبة: …»). When the first
person joins, the normal lobby comes back with `tv-lobby--arrive` once (the
side slides up, the QR column settles from 1.18×) and the strip chips of new
players pop (`tvStrip`, `motionFirst('tvchip|code|id')`, lobby only). One
column on a TV held upright. Checked at 1920×1080 and 1280×720.

## Keys added (one block, `// ideas batch: shell`)

home_cont_label, home_cont_hide, home_cont_daily, home_cont_score,
room_hub_now, room_hub_more, tv_scan_cta, tv_empty_game.

## Seen, not touched

On the host TV's list at 1280×720 `.tv-stage` overflows sideways by 6px (1263 in 1257), which draws a thin scrollbar under the
games (the `tv-hub-scroll` box) - it was there before this slice as far as I
can tell; worth a look.
