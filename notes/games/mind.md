# العقل (id `mind`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**العقل in rooms** (`mindAction`, `JS_RoomMind.html`). A cooperative game with
no content at all: every phone holds numbers from 1 to 100 that only it can
see, and the table lays them all down in rising order without a word. Level
*n* deals *n* cards each; the hearts start at the number of players. The
numbers are the whole game, so a hand is `room.secrets[pid].cards`, kept
sorted - `play` always means the lowest card that phone holds, so there is no
card id to send and nothing to cheat with. `shared` carries the level, the
hearts, the pile, what was thrown away face up and `held` (how many each
player still has), never a number anybody is holding. Playing out of order
costs one heart and turns every lower card face up, which is the real game's
rule and what keeps a level moving. A level with nothing left in hand is
`levelDone` and the host deals the next; the deck running out of room for
another level is a **win**. `roomTurnOf` answers for any phone still holding a
card - in العقل it is always your turn. There is no score board, so the
night's leaderboard and the share card both pass it by, which is right.
On the phone: your numbers big, only the lowest a button, the pile, the
hearts and a strip of how many each player holds. A card flies from where it
was tapped onto the pile, and a heart lost shakes the screen once - checked
**before** the phase branches, because losing the last card of a level costs a
heart and clears the level in the same move.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
