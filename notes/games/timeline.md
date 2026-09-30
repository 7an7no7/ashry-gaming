# قبل ولا بعد (id `timeline`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**قبل ولا بعد in rooms** (`timelineAction`, `JS_RoomTimeline.html`). One card
starts a line on the table; everyone else holds event cards with the years
taken off (`timelineHidden`). On your turn you pick one and tap a gap - before
the first, between two, or after the last. Right and it stays and your hand is
one smaller and you score a point; wrong and the year is shown, the card is
out and you **draw a replacement**, so a hand only ever shrinks on a card put
in the right place. First to empty wins, and because everyone starts with the
same hand the board (cards placed correctly) and the winner always agree.
**When the replacements run out the board decides** (the owner, 22 Sep 2026):
a wrong card with nothing left to draw ends the game (`shared.ended = 'deck'`,
`timelineEndOnBoard`), and whoever placed most wins, nobody if nobody placed
one; a hand emptied by a wrong card that couldn't be replaced never wins.
The bank is `TimelineEvents.js`: 22 events, 1869-2015, Egyptian and Arab
first with famous world dates mixed in (the owner, 20 Sep 2026), each with one
year nobody argues about. **It is bundled into the Worker only** - deliberately
not inlined into the page like the other shared lists - because the years of
unplayed cards are the whole secret and the app would otherwise ship the
answer key, the same reason `PartyContent.js` stays server-side. For the same
reason a hand with its years is `room._timeline.hands` (never projected), and
a phone's `room.secrets[pid]` holds only the hidden cards: `project()` sends a
player their *whole* slice, so the years kept there beside the hidden copy
were in every phone's own traffic until 22 Sep 2026 (*Traps*). `npm run
check` fails on a repeated year or a missing language. The hand size is worked
out from the cards that actually came back, keeping at least one spare per
player for the replacements (seven players get two cards each and seven
spares; twelve get one each and nine spares). The line carries `dir="ltr"` in both languages: it is a physical
axis like Wavelength's spectrum, and mirrored in Arabic it would read 2015
before 1869. A gap is a button only on your turn and only once you have picked
a card.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
