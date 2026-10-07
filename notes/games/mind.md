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

## The level that wins (the review of 1 Oct 2026)

"As many levels as the deck can carry" was 50 levels for two players and 33 for three,
so the win was out of reach. The game now ends in a win when the table clears
`shared.maxLevel`, fixed at the start by how many sit down (`mindMaxLevel`): **12 for two,
10 for three, 8 for four or more**, and never more than the deck can deal (`floor(100 / n)`,
7 for 13). Clearing it goes straight to `gameover` with `won: true` (`mindCheckLevel`); a
heart lost on that last card still loses first. Someone leaving doesn't change the cap. A
room started before this has no `maxLevel` and plays on the old way.

Phones and the TV say «المستوى 3 من 10» (`mindLevelText`), the level-done card says when
the next is the last (`mindNextText`, `mind_last_level`). The end, phone and TV
(`mindOverHtml`): 🧠 or 💔, the level reached counting up from 0 out of the cap
(`countUp` on `[data-mind-count]`, `mindOverAfter`, once per end through `motionFirst`), and
on a win the confetti once the number lands (`afterReveal`); the TV through its `after`.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **743 «خط الأرقام», look A** (the TV and the phones). A ruler from 1 to 100 (`mindRulerHtml` in
  `JS_RoomMind.html`), left to right in both languages (`dir="ltr"`, a physical axis): every card of the level
  stands on its number, the last one lit in the accent, the stretch above it tinted warm with a «؟» (left out when
  it is too narrow to hold one). A card closer than a card's width to the last one on its row stands a row up
  (`mindRulerRows`). The missed cards (`shared.discarded`) stand in red under the ruler with a ✕. Under it the line
  `mindRulerNote`: who played last, or «58 نزلت وكان لسه فيه 52» after a miss (`mind_miss_line`). New cards drop
  onto their numbers and a missed card falls in red (`mindRulerAfter`, Web Animations, `fill: backwards`), only
  what is new since that screen last looked (`mindRulerSeen`, per screen; a reload or a TV coming on draws it as it
  is; a new level starts from an empty ruler). Sizes are container units of the ruler's width; on the TV the whole
  ruler, rows included, fits the stage's height (`--u`, `.mind-tv__ruler` a size container). The phone shows the
  strip in place of the old pile card («خط الأرقام», `mind_ruler`; bigger cards, ticks at 1/25/50/75/100), and the
  card you tap flies onto its own number (`mindFlyToPile(n)`, flyEmoji). The missed chips stay on the level-done
  card. Styles: `MIND_CSS` (tokens only), put in by `mindStyleOn`.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
