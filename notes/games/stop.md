# أتوبيس كومبليت (Stop the Bus)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**أتوبيس كومبليت on separate phones** (`stopAction`). The same letter goes to
every phone, each player types an answer per category, and the first to press
وقف (`submit` with `stop: true`) moves the round to `collecting`: the other
phones send whatever they have typed the moment they see that phase - before
their frame is redrawn, because the inputs go with it (`ROOM_GAMES.stop.render`
does this first) - and the server scores once all are in or after
`STOP_COLLECT_MS`. Answers wait in `room._answers`, never projected, so a
phone that finished early cannot show its sheet. Scoring is by comparison
(`foldStopAnswer`: case, diacritics, the tatweel, hamza forms, ة/ه, ى/ي and
the definite article are folded before comparing, and an answer must start
with the letter; in a round on ا itself a bare "ال…" is kept, because ألمانيا
typed without its hamza is indistinguishable from an article, and only
"ال" + a hamza letter is stripped there): 10 for an
answer nobody else had, 5 for a shared one, 0 for a blank or a wrong initial.
The table is `shared.results` (its last column «المجموع» / "Total", pinned to
the far edge like the names to the near one, `.stop-td--total`, the same on one
phone); the host taps a cell to cycle its points
(`adjust`, marked `manual`), and `nextRound` banks `roundTotals` into the
totals as corrected. A timer, when the host set one, is a server clock like
the trivia one (`roomDeadline` / `roomTimeout` move `writing` to `collecting`
and then score). The host's categories, timer and rounds are remembered on
their phone (`ashryStopRoomOpts`) and sent with `start`.

**وقف needs a full sheet, and every word meets a dictionary** (`StopWords.js`,
shared by the page and the server). `stopAnswerFits` is the rule for a box:
folded as above, at least two letters, starting with the letter. The phone
paints each box as it fills (green, or red for a word on another letter),
keeps وقف faded with "باقي N خانات" under it until all are green, and the
server refuses `submit` with `stop: true` for a sheet that isn't - the clock
running out and someone else's وقف still send whatever is there. Scoring
then asks `stopWordKnown(lang, cat, text)`: the category's dictionary is
`STOP_WORDS` (names, plants and produce, colours, and additions for the rest)
together with the lists other games keep (`MONKEY_LISTS` countries, cities
and English animals and foods; `SPY_WORDS` Arabic animals, foods, things,
instruments, transport, jobs and brands), compared on letters only, with or
without the article, forgiving one wrong letter in a word of five letters or
more and an English plural. Each result carries `word`: `known` scores as
before; `shared` (not in the dictionary, but another player wrote it too - a
made-up word almost never is) scores 5; `unknown` scores 0 and shows ❓ on an
amber cell with a line telling the host to tap it if the word is right (the
tap is the ordinary `adjust`). `npm run check` fails on a word listed twice
in one `STOP_WORDS` list and prints each category's size and the letters it
has no words for. A category with holes is not a bug - no country starts
with ث - but a real word missing from a list costs a player points until the
host taps it, so add to the lists when a table keeps tapping the same word.

**«متسامح»** (`settings.lenient` / `shared.lenient`, the host's lobby switch,
off by default, kept in `ashryStopRoomOpts`): an `unknown` word scores 10
instead of 0, still marked ❓, and the host can tap it down.

**The bus** (the living character, 27 Sep 2026; `JS_StopBus.html`, section
44 of `Style_Living.html`, prefix `stopBus` / `.sbus-`), on one phone, every phone
in a room and the TV - a drawing and motion layer only, the rules, the
scoring and the server untouched. A flat cartoon in المشنقة's cast (ink
outlines `--sbus-ink` that stay dark, the screen's `--accent` for the body):
when a round starts it drives in from the side, wheels turning, brakes with a
squeak (`FX.stopBusBrake`), a puff and a rock, and the letter lands on its
destination board - the board holds the same `.stop-letter` /
`.tv-stop-letter` element `spinLetter` spins, started as the bus starts in
(`stopBusWhenDriving`, so it lands at the brake; a game dealt from the lobby
waits `STOP_BUS_SPLASH_MS` for the room's start splash). The players ride at
the windows, a round head with its initial each (a name on one phone, every
person in the room in a room, happy eyes once their sheet is in, a new one
popping in: `stopBusSyncPax` updates them without a rebuild). While the table
writes it idles (a bounce, exhaust, the driver's wave, a bubble
`sbus_bub_1..4` every nine seconds). The clock is the stop's timetable board:
the existing `#stop-clock`, `#stop-room-timer` and `#tv-stop-timer`, moved
into `.sbus-tt` and painted as before. وقف (or the clock): the doors slam,
it lurches and drives off the other side with a honk (`FX.stopBusHonk`) and
dust (`stopBusTrailHtml`), the slam banner as before; on one phone
`stopBusDriveOff` holds the scoring table for the drive off (the state is
saved at once, so a reload goes straight to the table). In the room's review
whoever sent nothing (in the roster, not in `submitted`) is left at the stop
waving, «استنوني!» (`stopBusLeftHtml`), played once. The moments are
`stopBusMoment(key, writing)`: remembered per round with when they began, so
a frame rebuilt mid-way carries on (`--sbus-late`, a negative delay); a round
first seen within 2.5 s of the page loading (a reload) shows the bus parked.
The drawing faces right; in Arabic the body is mirrored in the SVG (it travels
right to left, `--sbus-dir: -1`) and its text - the letter, the initials, the
bubble - is placed unmirrored at the mirrored x (`stopBusX`), which is why the
pieces inside the mirror turn on `transform-box: fill-box` (a mirror then
turns the wheels the other way by itself). In a room with a TV only the TV
honks and squeaks. On a phone the scene is edge to edge in the letter card and
no wider than 36rem or 0.8 of the screen's height; on the TV it crosses the
whole stage.

**The Stop word log** is how the dictionary grows from what tables accept.
When a host's `adjust` raises an `unknown` or `shared` cell from 0, the
rules push `{ lang, cat, word }` onto `room._stopTaps` (never projected);
`room.js` takes it off the room and hands it to the `WordLog` Durable Object
(`src/words.js`, one instance "stop", a count per `lang|cat|word`, at most
5,000). Nobody's name is kept. `GET /stop-words` answers only with
`Authorization: Bearer <ADMIN_KEY>` (a Worker secret, set with
`wrangler secret put ADMIN_KEY`; the key is kept outside the repo, in
`%USERPROFILE%.ashry-admin-key`), and `cd tools && ASHRY_ADMIN_KEY=… npm run
stop-words` prints them by category, most-tapped first, saying which are
already in `StopWords.js`. Words that come up often go into the lists by hand.

**Letters every category can answer** (the review of 1 Oct 2026). وقف needs a full
sheet, so a letter a chosen category has no words on (a country on ث, a colour on ظ)
was a round nobody could stop. `stopLettersFor(lang, cats, letters)` in StopWords.js
keeps the letters on which every chosen category's dictionary has at least
`STOP_LETTER_MIN_WORDS` (3) words - all of them if none qualifies - and both the room
(`dealStopLetter`, its own memory key per set of categories when the list is
narrowed) and the one-phone game (`nextStopLetter`) deal from it.

In rooms, what a phone has typed this round is also kept in the tab's `sessionStorage`
(`ashryStopDraft`, keyed on the deal and round), so a reload mid-round brings the boxes
back filled and a round closing sends them (the audit of 6 Oct 2026).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
