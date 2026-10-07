# أسماء الرموز (Codenames)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**Codenames.** Only the key is secret. Everything else is in `shared`:

- `settings`: the host's options from the lobby. A turn clock (`CODENAMES_TIMERS`),
  spymasters rotating each game, and the room's own words, which go on the board
  first.
- `wins`: the evening's score.
- `marks`: who suspects which card. They are public, and cleared when that card
  turns or the turn ends.
- `log`: each clue, with the cards turned under it.

A clue can't be a word still on the board (compared through `normaliseClue`). A
clue of 0 or ∞ sets `guessesLeft` to -1: no limit. With a clock, `endsAt` covers
the clue and then the guessing, and `roomTimeout` passes the turn when it runs
out.

On a phone a tap marks the card and picks it. Revealing is a second, deliberate
press (`cnLocal.pending`), so a mis-tap never costs the turn. The sides, the
options and the score survive "play again" and a trip to the hub (`_teamsMemo`,
`_cnMemo`).

**The night counts it by team** (the audit of 1 Oct 2026): `shared.board` is the cards,
so `nightBoardOf` (RoomGames.js) ranks the sides through `PROGRAM_TEAMS.codenames` - the
winning team first - for the room's night, a crew's night and «مين هيكسب؟», as the
program always did.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **547 Clue inside a word** (as described). `codenamesClueClash(clue, word)` in `app/Common.js` (shared, so the
  phone and the server run the same test): the two folded with `normaliseClue`; equal, or the shorter one (3
  letters or more) inside the longer - «شجر» can't point at «شجرة», and «شجرة» can't be given when «شجر» is on
  the board. `giveClue` refuses it against every unturned card («… أو جزء منها»), and `submitCodenamesClue`
  says so before sending (`cn_clue_on_board`, both languages; `cnFold` went, unused). Help rule updated. Rules
  tests: a clue inside a board word, a clue with one inside it. The robots' TV clue was `screenclue`, which
  holds the English word Screen: it is `qxtvclue` now.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **552 «كلمة جديدة لما تبدّل»**: `swapWord` takes its word from what the prompt memory hasn't dealt lately - the same memory (`codenames_<lang>`) the board was dealt from (`nextPrompts(room, list, key, 1, accept)` with `accept` = not on the board), so a word of the last board doesn't come straight back; a random word not on the board only if that fails. `swapWord` joined `DEAL_ACTIONS` in `rooms-worker/src/room.js`, so the memory shared across rooms is loaded for it.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
