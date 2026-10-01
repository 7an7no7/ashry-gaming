# 🕵️ المهمة السرية (the secret mission) - a switch beside every game (1 Oct 2026)

Not a game from the room's list and not a card on the home: a **switch on the room**,
like the chat and the night's board, that runs beside whatever the room plays all
evening. Built on the worktree branch of 1 Oct 2026 (four builders in parallel).

## The owner's rules (decided; not to be changed)

- Off by default. The host turns «المهمة السرية» on in the room's lobby; it runs beside
  every game until the host turns it off. Players who join later are dealt in.
- The host picks the **place** - في البيت / في كافيه أو مطعم / بره (رحلة، عربية، بحر) /
  في أي حتة (talking missions only, they fit everywhere) - and the **company** - العيلة
  (gentle, grandma-safe) / الصحاب (cheekier, still clean: nothing adult, nothing that
  embarrasses or hurts anyone, nothing that bothers strangers at a café). Only
  missions that fit both are dealt; the server deals them through `nextPrompts`
  (fresh across rooms).
- Each person secretly has a **target** (another person in the room) and a
  **mission**. Done, they tap «خلصت»; the target's phone asks, discreetly (a centred
  dialog at a calm moment, never stealing a text field's focus), whether it really
  happened, نعم / لأ. **Yes**: the doer scores 1 and gets a fresh target and mission.
  **No**: nothing happens, they keep their mission. Nobody is ever out.
- Proposed on the sheet and built (the lead asks the owner): **«غيّرها»** swaps your
  mission, once every 10 minutes; **«كشفتك!»** - name who you think is working on you:
  right, you score 1 and they get a new file; wrong, see below.
- Discreet: the file is hold-to-reveal; a 📁 in the header opens it from any screen
  of the app, during any game; the TV never shows a secret: a ticker when a mission
  is **done**, the evening's board of files closed, and at the end the reveal «مين
  عمل في مين إيه» and the champion «أشطر عميل سري».
- Leaving: a player who leaves drops out; whoever had them as a target gets a new one.
- Look أ «ملف سري» (`scratchpad/sheets/mohemma.html`, section A): a cardboard folder
  stamped سري للغاية that opens like a book while held, the mission typed out on a
  typewriter, the target's photo clipped in the corner; rubber-stamp buttons; the
  setup a folder with four tabs (place) and two stamps (company); the TV a cork board
  (files piling up as the leaderboard, the reveal as photos joined by red strings).

## Decided while building (open to change, each one place)

- **Fewer than 3 people: paused** (`MISSION_MIN_PEOPLE`): files stay, nothing can be
  done, swapped or caught; at 3 again everyone without a file is dealt one. Computer
  players and screens never take part (never dealt, never a target).
- **A wrong «كشفتك!»**: nothing happens to anyone, only the guesser learns it was
  wrong, and they can't guess again for **5 minutes** (`MISSION_CATCH_WAIT_MS`). A
  right one gives the catcher 1 and the caught a new file (a new target too, not the
  catcher when there is a choice). **Someone who asked you «حصل؟» can't be caught for
  that mission** - they showed you their hand (else a target could say «لأ» and then
  catch the asker for a point). Such a «كشفتك!» is refused exactly as a wrong one is
  (the wait, «مش هو»), so it never tells the guesser who is after them (the review of
  1 Oct 2026). Taking a memo back («اسحبه») before the target's phone showed it
  (`missionSeen`, sent by that phone when the memo is drawn) leaves the doer catchable
  again (`asked` reset); after it was shown, the target knows, and it stays.
- **«غيّرها»**: a new mission for the **same target**, refused while a memo waits.
- **The night's points**: turning it off banks the ranking of files closed (catches
  count as files) **once** on the night's board through `bankNightPoints`: 5 / 3 / 2
  and 1 for everyone else who had a file; nothing if nobody closed a file. The
  champion is whoever closed most (ties share the title).
- **A new place or company while it runs** redeals only the missions that no longer
  fit, keeping every target.
- **Targets** go to whoever is aimed at by the fewest, so nobody is everyone's target;
  a fresh file after a yes is never aimed at the person just done.
- **A memo**: one at a time per doer (a double tap asks once); the doer can take it
  back («اسحبه»). A memo put away unanswered (the phone's back) comes back 15 s later.
  It waits for two calm looks 0.7 s apart (no text field focused, no finger on the
  screen, no other popup but the file, the page visible), knocks with a toast, then
  shows 1.3 s later.
- **The text is always the doer's**: the missions are written to the doer («خلّي منى
  يجيبلك…»), so the memo, the ticker and the story quote the file as it was
  («منى: «خلّي حسن يجيبلك…»» - `missionQuote`), never retell it (a retelling made the
  reader the one brought the water).
- **The reveal** lists every closed file and catch with its time, and the files still
  open at the end («… كان لسه بيحاول»). The TV shows it in the lobby (not over a game
  being played) with up to 12 strings, then the champion's card; the phones open the
  story once, at a calm moment; the host closes it («قفل الملف»), which keeps the place
  and company for next time.
- **The chat** says it is on (`missionOn`) and names the champion (`missionEnd`).
- **Not hooked to برنامج السهرة's finale**: «the night ends» is the host's switch;
  a program finishing doesn't end the mission (a one-line hook if the owner wants it).
- The help icon is 📁 (🕵️ is الجاسوس's); the lobby's door keeps 🕵️ as on the sheet.

## The missions (`Missions.js`, root, shared)

140 missions, each `[id, places, company, ar, en]`: places `*` (talking, anywhere) or
the letters `h` `c` `o`; company `a` (everyone) or `f` (friends only). Arabic always
«خلّي {target} …», English "Get {target} …". Pools: home × family 75, home × friends 99,
café × family 69, café × friends 91, out × family 70, out × friends 92, anywhere ×
family 55, anywhere × friends 71 (`MISSION_MIN_POOL` 40). `tools/validate-content.js`
checks the tags, the openings, `{target}` once, no id or wording twice (folded), every
pool at least 40, every place at least 10 of its own. Shared by the page (the chunk
`mission`) and the server (`FILES`), where the room deals a mission's id; each phone
says it in its own language.

## How it works

### The server (`RoomMission.js`, bundled after `RoomProgram.js`)

- `room.mission` (public): `{ on, phase: 'on'|'reveal'|'off', place, co, swap, catch,
  paused, score: {pid: n}, names, feed: [last 5 {seq, k: 'done'|'catch', by, to, m?}],
  fileSeq, askSeq, catchSeq, startedAt, banked, reveal }`.
- `room._mission` (private): `of[pid] = { to, m, n, at, swapAt, asked, no, won, busted }`,
  `asks: [{ id, by, to, m, n, seen }]`, `wrongAt`, `lastCatch`, `caught`, `log` (the story).
- `missionView(room, pid)` (`view.js` sends it as `mission`): the public part, and for a
  person in it `me` (their own file and its waits) and `asks` (the memos waiting on
  them). A screen gets the public part only.
- Actions, room-level, before any game's (`missionAction` in `applyRoomAction`):
  `missionSet { on, place, co, swap, catch }` (host), `missionClose` (host, the
  reveal → off), `missionDone { n }`, `missionCancel`, `missionSeen { id }` (the target's
  phone, as the memo is drawn; room.js answers it to that phone alone, `SILENT_ACTIONS`),
  `missionAnswer { id, yes }`
  (the target only), `missionSwap { n }`, `missionCatch { who }`. `n` is the file
  number the phone saw (`staleTap`).
- `missionFill(room)` keeps every file valid after anything that changes who is here:
  `becomeScreen` / `becomePlayer`, `rename`, and from `room.js` a join
  (`missionJoined`, with the shared prompt memory read first) and a leave or kick
  (`missionPlayerLeft`, beside `roomPlayerLeft`, also with no game on).
- `DEAL_ACTIONS` (room.js) has `missionSet`, `missionAnswer`, `missionSwap`,
  `missionCatch`, `becomePlayer`. No clocks: the waits are compared when a tap comes.

### The page (`JS_RoomMission.html`, the chunk `mission` with `Missions.js`)

- The shell (`JS_Room.html`): `roomMissionSlotHtml` fills `#room-mission` in the lobby
  (the host's door `roomMissionDoorHtml` before the chunk), `roomOpenMission`, and a
  `Room.onChange` that loads the chunk whenever a state carries a running or revealed
  mission, then calls `missionSync` on every state (on any screen of the app).
- `missionSync`: the header's 📁 (`#mission-fab`, `body.has-mission`, a dot for a memo
  or a file not opened yet), the toasts (my yes / no, busted, a catch's result,
  someone else's closed file), the file's redraw, the memo pump, the story once.
- The file (`#mission-modal`, `missionFileHtml`): held open (`missionHoldDown` /
  `missionHoldUp`, pointer capture, Space / Enter), the typewriter (38 ms a letter,
  all at once with motion off), cleared once shut; «خلصت», «غيّرها» with its count,
  «كشفتك!» with the names; «تمّت ✔» stamped when a yes comes, the new file sliding in.
- The memo (`#mission-ask`, `missionAskPump`, `missionPaintAsk`, `missionAnswer`).
- The setup (`missionSetupHtml`): four tabs, two stamps, three examples, the two
  options (remembered on the host's phone, `ashryMissionSetup_v1`).
- The story (`missionRevealHtml`, `missionOpenReveal`): the champion's polaroid and
  stamp, every line with both faces, the table; confetti once (`motionFirst`).
- The TV (`JS_RoomTv.html` hooks): `missionTvBoardHtml` in place of the player tiles in
  a TV lobby that isn't the host (each photo with its pile of files), the host strip
  in a TV host's hub, the ticker `#msn-tv-ticker` (7 s) and the reveal
  `#msn-tv-reveal` (the strings, then the champion); `missionTvSig` is in
  `tvLobbySig`.
- Faces: `missionFaceSvg(name)`, a drawn face from the name (the same on every screen).
- CSS: section 62 of `Style.html` (the paper, kraft, stamps and cork keep their
  colours in both themes; the UI around them uses the tokens).
- Help: `GAME_RULES.mission` (both languages), `HELP_ENTRIES` (📁, in «ابدأ من هنا»).

## Tests (1 Oct 2026, a local rooms server on :8794)

- `npm run check`: passes (5,076 keys in each language on this branch).
- `npm run test:rules`: all pass; 36 of them the mission's (paused below 3, targets and
  pools, bots never dealt, each phone its own file, yes / no, a stale «خلصت», swap and
  its wait, a wrong and a right catch, no catch of an asker, take back, beside a game
  and across the hub, a new place keeping targets, a latecomer, a leaver, the reveal
  and the night's 5, close, on again fresh, no repeat on swaps). The leak check's
  `mission` driver (240 moves: done, yes / no, swaps, catches, a game of المختلف, a
  join and a leave, off and close) holds 4 probes plus every game's own; proved by
  sending another phone's file and by sending every memo to every phone (each failed).
- Robots `--only=mission`: 41 pass; the whole `npm test` (3 at a time): 3,460 pass.
- The screen test's new part `mission` (`ONLY=mission`, its own shard): 18 pass
  (the switch, the setup, the lobby on five phones and the TV, every file held and
  shut, the memo over a game on the target alone, the ticker, a reload, the story on
  every phone, the strings, closed, no console errors); `ONLY=screens` 44 pass.

## Files

`Missions.js`, `RoomMission.js`, `JS_RoomMission.html`; hooks in `RoomGames.js`
(`applyRoomAction`), `rooms-worker/src/room.js`, `view.js`, `build.mjs`,
`JS_Room.html`, `JS_RoomTv.html`, `JS_RoomChat.html`, `Controller.html` (the 📁, the
slot, the two modals), `JS_Core.html` (translations, `GAME_RULES`), `JS_Utils.html`
(`HELP_ENTRIES`), `tools/lazy-split.mjs` (`CHUNKS.mission`, `SHARED_LISTS`),
`tools/validate-content.js`, `tools/test-changed.mjs`, `tools/test-ui.mjs`,
`tools/test-ui-parallel.mjs`, `rooms-worker/test/{rules,leaks,play-all}.mjs`.
