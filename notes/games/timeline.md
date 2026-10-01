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
The bank is `TimelineEvents.js`: 163 events, 622-2022 (grown from 42 in the
review of 1 Oct 2026, when a four-player game dealt 21 and two games went
through the bank), Egyptian and Arab first with famous world dates mixed in
(the owner, 20 Sep 2026) - inventions, famous buildings, sport firsts, Egyptian
history and culture, space, everyday things - each with one year nobody argues
about, nothing political or divisive, and no event whose name carries its year.
**Two cards may share a year** (since 1 Oct 2026): `timelineFits` takes a card
beside one of its own year on either side, so the placement is never right and
wrong at once; the validator's old one-card-a-year rule is gone (it now fails
on an event listed twice), and the leak check and the rules test count a
hand's year as public once the table has seen another card of that year. **It is bundled into the Worker only** - deliberately
not inlined into the page like the other shared lists - because the years of
unplayed cards are the whole secret and the app would otherwise ship the
answer key, the same reason `PartyContent.js` stays server-side. For the same
reason a hand with its years is `room._timeline.hands` (never projected), and
a phone's `room.secrets[pid]` holds only the hidden cards: `project()` sends a
player their *whole* slice, so the years kept there beside the hidden copy
were in every phone's own traffic until 22 Sep 2026 (*Traps*). `npm run
check` fails on an event listed twice or a missing language. The hand size is worked
out from the cards that actually came back, keeping at least one spare per
player for the replacements (with 163 cards every table up to twelve gets the
full hand of three and two spares each; with the old 42, twelve got two each). The line carries `dir="ltr"` in both languages: it is a physical
axis like Wavelength's spectrum, and mirrored in Arabic it would read 2015
before 1869. A gap is a button only on your turn and only once you have picked
a card.

**A board ending names everyone level at the top** (the review of 1 Oct 2026):
`timelineEndOnBoard` sets `shared.winnerIds` / `winnerNames` to all of them
(`winnerId` the first, `winnerName` all the names, for an older phone), and the
phone and the TV say them with `tlWinnersText`. The hidden year on a card is `؟` in
Arabic and `?` in English.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
