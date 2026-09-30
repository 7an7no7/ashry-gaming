# The five games of 15 Sep 2026 in rooms (صدق ولا كذب, فوازير إيموجي, كمّل المثل, خمس ثواني, ارسم واكتب)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**The five games of 15 Sep 2026** share what was already there:

- **صدق ولا كذب** (`twoTruthsAction`): each phone `submit`s three statements
  and the index of the lie; the server shuffles the three (so the lie is
  never "always the third") and keeps the index in `room._tt`. One
  storyteller at a time: their statements become vote options that all
  carry `ownerId: subject`, so the voting engine keeps them out of their
  own vote. `resolveTwoTruths` gives `TT_CATCH_POINTS` to each voter who
  picked the lie and `TT_FOOL_POINTS` per fooled voter to the storyteller.
  `closeWriting` lets the host start with whoever has written.
- **فوازير إيموجي and كمّل المثل** run on one engine (`quizAction`,
  `QUIZ_GAMES`): the deck is dealt at `start` through `nextPrompts`, each
  card reaches `shared.card` with its answer and alternatives stripped,
  `guess` compares through `normaliseClue` against `a` and `alt`, and the
  right answers score like the trivia (`QUIZ_POINTS` plus a speed bonus by
  order). `retry: true` (emoji) lets a wrong guess be shown to the table
  in `shared.feed` and tried again; `retry: false` (proverbs) takes one
  answer each. The card closes when everyone has answered, when the host
  presses `closeQuestion`, or by the server clock (`QUIZ_GRACE_MS`).
- **خمس ثواني** (`fiveSecondsAction`) deals its whole game from
  `BOMB_PROMPTS` at `start` (`room._fiveDeck`, `order × rounds`), so no
  per-turn action has to be a `DEAL_ACTION`. `go` (the player up, or the
  host) starts a five-second server clock; `roomTimeout` moves it to
  `judging`, and the host's `judge` (allowed early too) scores and advances.
- **ارسم واكتب** (`telephoneAction`) starts one chain per player with a
  phrase from `DRAW_WORDS`. Step k gives chain c to player `(c + k) % n`,
  drawing on odd steps and writing on even ones; the previous step
  travels in `room.secrets[pid].task.prev`. Drawings arrive whole
  (`submit` with `strokes`, cleaned by `cleanStrokes` under the same
  budget as Draw & Guess) because the phone keeps them locally
  (`draw.local` in `JS_RoomDraw.html` turns the per-stroke flush off).
  A step ends when everyone has sent, or by the clock through a
  `collecting` grace like Stop's. The reveal publishes one chain at a
  time (`publishTelephoneChain`): a whole evening's drawings in every
  state push would be most of a phone's data. No scores.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
