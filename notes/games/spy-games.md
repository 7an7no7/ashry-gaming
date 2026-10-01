# الجاسوس, الحرباء and الموقع السري in rooms

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**الجاسوس in rooms** ends in a vote, like the Chameleon and Spyfall rooms:
after the discussion the host opens it (`startVote`), nobody can accuse
themselves, a tie lets the spy escape, and an accused spy picks the word from
six (`shared.options`, the secret among five others of the same category).

**الجاسوس in English** (the owner, 26 Sep 2026). `SpyWords.js` also holds
`SPY_WORDS_EN` (the same eleven categories under English names - Animals,
Food, Jobs, Places, Things, Brands, Famous people, Transport, Sports,
Countries & cities, Musical instruments - about as many words each as the
Arabic) and `SPY_PAIRS_EN` (المختلف's 74 pairs). The builds put them in the
page (`SERVER_DATA.spyDataEn` / `spyPairsEn`, `window.SPY_WORDS_EN` /
`SPY_PAIRS_EN`), and the page asks `spyCategories()` and `spyPairs()` in
`JS_Core.html`, which answer in `contentLang()`: the one-phone setup, the room
lobby's categories and كلمة واحدة's room words. The server finds a category in
either list by its name (`spyWords`; the validator refuses an English name
that is also an Arabic one), and المختلف's start carries `lang` for the pairs
(memory key `imppair_en`). Nothing reads `SPY_CATEGORIES` or `SPY_PAIRS`
directly for dealing any more; the Arabic lists and everything else built on
them (ربع قرد, the Stop dictionary, the letter wheel) are unchanged.
Caught and wrong, a point to every player; escaped or guessed, two to each spy.
`revealResult` is the host's way out without a vote and scores nothing. The
word is dealt through `nextPrompt`, and `restart` keeps the scores in
`room._impScores`. **من أنا؟ in rooms** has `gotIt`: the first to press
scores 3, the second 2, the rest 1 (`WHOAMI_ORDER_POINTS`), and the round
reveals itself once everyone present has pressed.

**الحرباء, الموقع السري and القنبلة in rooms** (`chameleonRoomAction`,
`spyfallRoomAction`, `bombRoomAction`). The chameleon's board is public; each
player's secret slice carries the index of the secret word, the chameleon's
carries only its role, and the word reaches `shared` only with the result.
The spy's slice is just `role: 'spy'`; everyone else's holds the place and a
job, and `shared.locations` is a card of 24 places with the real one among
them (`SPYFALL_CARD`), so the spy has something to guess from. Both vote
through the voting engine with `ownerId` set on every option, so nobody can
accuse themselves; a tie lets the impostor slip away, and an accused
impostor gets one guess (`guess` / `spyGuess`, `skipGuess` for the host). The
spy may also `spyGuess` at any time during `play`. The Spyfall clock is a
server deadline that opens the vote by itself. The bomb's fuse is
`room._bombEndsAt`, never projected: phones get `shared.heat` (0-3), bumped by
the alarm at 40%, 65% and 85% of the fuse, and tick faster with it
(`BOMB_TICK_MS`); the bomb itself is on one phone at a time (`shared.holderId`, moved along
`shared.order` by the holder's `pass`), so when the alarm sets it off the
server strikes the holder itself (`explodeBomb`); `markLoser` lets the host
move that strike, and the loser starts the next round. Only the holder's
phone and the TV tick out loud. The strikes are the board, fewest first. `swap` deals a
new category, so it is in `DEAL_ACTIONS` in `room.js`. The three phone
renderers carry their own `TV_GAMES` entries (`JS_RoomChameleon.html`,
`JS_RoomSpyfall.html`, `JS_RoomBomb.html`).

**On one phone, a caught spy's guess is kept** (the audit of 1 Oct 2026). الموقع
السري saves `spyfallState.caught` when the table accuses the real spy: the accuse
button (and «أنا الجاسوس») takes the back-closed guess sheet back up, and a reload
comes back to it with no clock. A saved `left` of 0 is a round whose time ran out:
a reload reopens the vote instead of a full clock (a new deal saves `null`).
الحرباء keeps `chameleonState.guessing` the same way, so a reload during the caught
chameleon's last guess comes back to the clickable grid, not the accuse bar.
الجاسوس remembers the deal's language (`im.lang`) for the caught spy's six words,
and its category list escapes the «كلماتنا» / crew titles it shows (a 🔒 asks a
password only for the app's own lists).


## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
