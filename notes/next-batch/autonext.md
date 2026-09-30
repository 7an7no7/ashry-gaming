# Next batch: «التالي لوحده» (autonext)

The owner approved a lobby switch «التالي لوحده» / "Next by itself" for the older
room games that wait for the host's «التالي» after each result: تحدي المعلومات
(room trivia), لو خيروك, مين أكثر واحد, فيبج, موجة (Wavelength), زي الكل, صدق ولا
كذب. Off by default, per game, the host's lobby choice, remembered on the host's
phone. Off is exactly today's flow (no new field in `shared`).

## How it works

**Server (`RoomGames.js`, a block just before "CLOCKS THE SERVER KEEPS").**
- `room._autoNext` is the switch, set from `start` / `playAgain`'s `payload.autoNext`
  (a boolean) for the games in `AUTONEXT_GAMES`; a `start` without it is off; a
  `playAgain` without it keeps what the room had (trivia's and صدق ولا كذب's play
  again send no options).
- `AUTONEXT_GAMES[game] = { action, deals, ms, ready(s), key(s), args(s) }`: the
  host's own «التالي» action and its payload (`nextQuestion {qIndex}`,
  `nextRound {lang, round}`, `next {turn}`), whether it deals prompts, the pause,
  when the result is up, and a key for "this result".
- `autoNextSync(room)` runs after every move (end of `applyRoomAction`), after a
  leaver (`roomPlayerLeft`) and after a game's own timeout (`roomTimeout`): once
  per result it sets `shared.nextAt` (server time), `nextMs` (the whole pause),
  `nextFor` (the result's key) and `nextPaused: false`; when the result is gone or
  the switch is off it deletes the four fields.
- `gameDeadline` returns `autoNextDeadline(room)` first; `gameTimeout` fires
  `autoNextFire(room)`: the host's action through `applyRoomAction` on a copy (so
  every stale-tap guard, the generic `nextRound` round check, the deal id, the
  roster and the last-round → `gameover` path are the ones the host's tap takes).
  If the rules refuse it (too few left to deal a round) the count stops
  (`nextAt: null, nextPaused: true`) instead of retrying every 30 s.
- `autoPause { key }` (room-level branch in `applyRoomAction`, before the game's):
  a move-on action (`requireMoveOn`: the host, or a stand-in once the host is away),
  dropped when `key` is not the current `nextFor` (stale), clears `nextAt` and sets
  `nextPaused`. «التالي» by hand still works any time.
- Stale guards added: trivia's `nextQuestion` takes `{ qIndex }`, صدق ولا كذب's
  `next` takes `{ turn }` (both optional, as every stale field is). The phones and
  the TV now send them; زي الكل's `nextRound` sends `{ round }`.

**Prompt memory on a timeout (`rooms-worker/src/room.js`).** A host's «التالي» is a
`DEAL_ACTION`, so `act()` loads the shared prompt memory; a timeout never did. The
alarm now asks `roomTimeoutDeals(room, now)` (exported from the bundle; true when
the due timeout is an autonext deal of a game whose `deals` is true), reads the
memory, runs the timeout inside `withPromptMemory`, and writes what changed. The
room is re-read after the await (other messages may have come in). Trivia and صدق
ولا كذب deal nothing on «التالي» (the deck / the order is dealt at start), so they
don't load it.

**The pauses** (each is the reveal's own time plus time to enjoy it):
| game | pause | why |
| --- | --- | --- |
| trivia | 10 s | the staged answer takes ~3.7 s (`triviaRevealPlan`: wrong ones 0.8 s apart, the right one, the board) |
| لو خيروك, مين أكثر واحد | 12 s | the vote's bars ~3 s (`voteRevealTimes`) |
| فيبج | 9 s + 3.7 s + 0.9 s a lie past the first | the lies turn over 0.9 s apart, then the truth (+1.5 s) and the board (+1 s) (`fibRevealPlan`) |
| موجة | 11 s | the shutter and the verdict ~2.3 s (`wlReveal`) |
| زي الكل | 12 s | after the host's «احسب» (see below) |
| صدق ولا كذب | 13 s | the lie and who was fooled, the board |

**The page (`JS_RoomAutoNext.html`, new, included right after `JS_Room.html`).**
- `autoNextLobbyHtml(state, game)`: the host's switch row (host only, on a phone or a
  TV hosting the room; the TV lobby uses the same `lobbyOptions`), with a hint that
  changes in place. `autoNextChoice(game)` / `autoNextSet(game, on)` use
  `recallOptions('autoNext')` / `rememberOptions`. Each game's `startPayload` sends
  `autoNext`; its `lobbyOptions` appends the switch.
- `autoNextSlotHtml(state)`: an empty `[data-an-slot]` put just before each result's
  «التالي» row (the phones' frames and the TV's: trivia, `renderRoundFooter` for the
  three voting games and موجة, `tvNextFooter`, زي الكل, صدق ولا كذب). Drawn only when
  `'nextFor' in shared`, so with the switch off the markup is exactly as before.
- `autoNextPaint()` fills every slot from `Room.state` (a 250 ms interval while a slot
  exists, and on every `Room.onChange`), rebuilding only when the key (`nextFor`,
  `nextAt` / paused, can-move-on, last, language) changes, so a pause or the host
  going away never rebuilds the frame: «⏭️ الجولة الجاية خلال 5…» (or «النتيجة
  النهائية خلال 5…» on the last trivia question / the last storyteller), a draining
  bar (a linear Web Animation of `scaleX` from what is left to 0; with motion off
  the tick sets it), and «⏸ استنى» for `roomCanMoveOn(state)`. Paused: «⏸ العد
  واقف · «التالي» لما تجهزوا». The seconds are read from the server's time
  (`roomServerNow()`). The last 3 seconds bump (`motionBump`).
- While the count runs the non-host's «مستنيين المضيف…» line is hidden
  (`.an-slot[data-an-on="1"] ~ .room-moveon-not`).
- CSS: the `/* ===== NEXT BATCH: AUTONEXT ===== */` section at the end of `Style.html`
  (tokens only; bigger on the TV, `.an-slot--tv`).
- Keys: `an_switch`, `an_hint_on`, `an_hint_off`, `an_next_in`, `an_final_in`,
  `an_pause`, `an_paused` (one `// next batch: autonext` block per language). Help:
  a «⏭️ التالي لوحده» sub-head in the seven games' `GAME_RULES`, both languages
  (in trivia's under the rooms part, before دوري المعرفة).

## Decided here (open to change, one place each)

- **زي الكل counts only after the result, not the reveal.** Its reveal is where the
  host merges answers that mean the same thing - a judgement - so «احسب» stays the
  host's; the count starts on the scored result.
- **The games with no end** (لو خيروك, مين أكثر واحد, فيبج, موجة) keep going round by
  round with the switch on until the host takes the room back to the hub; the count
  never starts a new game after a `gameover` (trivia, صدق ولا كذب, زي الكل).
- **A round the rules refuse** (e.g. مين أكثر واحد with fewer than 3 left) stops the
  count rather than trying again; the host decides.
- **Pause is for this result only**: the next result counts again.
- The lobby switch shows only for the host (a player's lobby shows nothing new).

## Tests

- `rooms-worker/test/rules.mjs`: 46 `autonext/…` checks - off (no `nextAt`, nothing
  on the clock), on (the count, the timeout deals, a question the clock closed counts
  too), the host's tap then the old deadline (no double deal), stale «التالي» and
  stale pause dropped, a player refused / a stand-in allowed, pause, the last round to
  the end and never a new game, play again keeps it, a vote a leaver closed, a refused
  round stopping the count, فيبج's pause with its lies, موجة, زي الكل's reveal left to
  the host, صدق ولا كذب to the end, other games refuse `autoPause`.
- `npm run test:rules`: all pass, the leak check clean.
- `rooms-worker/test/play-all.mjs`: `autonextRobots()` (`--only=autonext`, and in the
  full run before سباق ألغاز): trivia and لو خيروك on a live server with three phones
  and a TV (the count everywhere, the server dealing - which exercises the alarm's
  prompt memory for لو خيروك -, pause, stale taps, the end, off). 55 passed.
- Looked at in headless Chrome: a trivia room and a فيبج room with three phones
  (375×812 ar light, 375×812 en dark, 667×375 ar dark) and a TV at 1920×1080; the
  lobby switch on a phone, a phone on its side and a TV host's lobby; the count, the
  auto-advance, «⏸ استنى» from the host's own button, a reload mid-count (the count
  comes back); no console errors.

## Traps met

- A robot or a CDP phone that joins a room stays on the home until
  `roomReturnToActive()` (known; the look script calls it).
- Headless Chrome started with a fixed `--remote-debugging-port` writes no
  `DevToolsActivePort`; ask `http://127.0.0.1:<port>/json/version` instead.
