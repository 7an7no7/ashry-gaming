# Batch 4 report, part A: شطرنج بالتصويت and المخ والإيد (T4.2, T4.3, their part of T4.5)

Branch `batch4-b4a`. Nothing was pushed or deployed.

| Task | Commit | Files |
|---|---|---|
| **T4.2** Team vote chess | `43598f3` | `RoomVoteChess.js` (new), `JS_RoomVoteChess.html` (new), `RoomGames.js`, `rooms-worker/build.mjs`, `Controller.html`, `JS_Core.html`, `JS_Catalog.html`, `JS_Room.html`, `JS_RoomChat.html`, `JS_RoomTurn.html`, `JS_Utils.html`, `JS_Chess.html`, `JS_RoomChess.html`, `Style.html`, `rooms-worker/test/rules.mjs`, `leaks.mjs`, `play-all.mjs` |
| **T4.3** Hand and Brain | `30b04bb` | `RoomHandBrain.js` (new), `JS_RoomHandBrain.html` (new), and the same shared files |
| **T4.5** (these two games) | in the two commits above | catalog, hub, help, rules, `roomTurnOf`, icons, tests: no separate commit (each game's registry lines went in with the game, so every commit builds and passes on its own) |

The T4.2 commit was checked on its own before T4.3 was committed: `npm run check`, `npm run test:rules` (with the leak check) and `build:preview` all pass at `43598f3`.

## Checks run

- `cd tools && npm run check`: no problems, i18n OK (3228 keys each language).
- `cd rooms-worker && npm run test:rules`: all room rules pass, including 28 new vote-chess checks and 24 new Hand-and-Brain checks; the leak check: no secret reached a phone (votechess 3 rules, 263 moves; handbrain 2 rules, 366 moves).
- The new leak probe was proved in a scratch build: putting a vote count into `shared.vote` and every vote into every voter's slice each failed it (`shared.vote.peek`, `you.vote (not your own)`); the build was then rebuilt clean.
- `node test/play-all.mjs http://127.0.0.1:8791` (the whole robot run, own server): **2232 passed, 0 failed**, including 68 new checks (`--only=teamchess` runs just them).
- Headless Chrome over CDP, a browser context per phone (`C:/Users/TPC/agy-tests/ashry-batch4a/ui_vc.mjs`, `ui_hb.mjs`): all checks passed, no console errors on any phone or the TV (Chrome's "blocked navigator.vibrate before a tap" notice filtered, a headless artefact). Screenshots in `C:/Users/TPC/agy-tests/ashry-batch4a/shots/`.

## T4.2: شطرنج بالتصويت

- Teams split by the host in the lobby, at random with moves across: **VERIFIED** (rules: the split is half and half, a tap moves one, only the host, a side never left empty; UI: the host phone draws the split by itself, the lobby shows both teams, 2 vs 1 set by taps).
- Any number from 2; 1 vs 1 is chess by a vote of one: **VERIFIED** (rules: the fool's mate by votes of one; one person can't start).
- Every member votes on their own board; the most-voted move is played when the clock ends or every member present has voted: **VERIFIED** (rules and robots; UI: two taps on the 2D board are a vote, the piece doesn't move, a blue arrow shows it).
- A tie drawn at random among the tied moves: **VERIFIED** (rules: both tied moves came up in 40 deals; robots; UI: e4 vs d4 tie, "القرعة اختارت").
- Vote clock 30 s by default, 20 / 60 the host's: **VERIFIED** (rules, UI on 20 s).
- Nobody voted: a random legal move, said as such: **VERIFIED** (rules, robots on the server's own clock, UI after a real 20-second wait).
- Votes secret until the move is played, who voted public; then the tally: **VERIFIED** (rules; leak probe on every phone after every move; robots: nothing of Jana's vote on the other phones or the TV; UI).
- No computer players: **VERIFIED** (no `ROOM_BOT_GAMES` entry, no bot buttons).
- Team chat = the room chat's team channel: **VERIFIED** (rules: a team line reaches the team, not the other team or the TV, and goes with the game). The chat sheet's team switch in the browser: UNVERIFIED (not opened in the CDP run).
- Leaving: a member drops out of the count, a team with nobody left loses: **VERIFIED** (rules, robots).
- Stale taps, host recovery (close the vote), `roomTurnOf`, `roomPlayerLeft`: **VERIFIED** (rules/robots; `turn_vote` by reading the code, the banner itself UNVERIFIED).
- The tally flying in (motion), the clock ring, vote dots; the TV with the board and both teams: **VERIFIED** by screenshots (375×812 Arabic, 667×375, 1280×720 Arabic and English, TV 1280×720 English). A reload mid-vote brings back the board, this phone's vote arrow and the running clock: **VERIFIED**.

## T4.3: المخ والإيد

- 2 vs 2, computer players fill empty seats (easy and hard): **VERIFIED** (rules: two people + two easy bots named by the host's phone; three whole games of one person + three bots; UI: two bots from the lobby buttons).
- The Brain names one of six kinds, only kinds with a legal move allowed / lit: **VERIFIED** (rules: the queen refused at the start; UI: at the start only the knight and the pawn are lit).
- The Hand plays any legal move of that kind; the named pieces lit on the Hand's board: **VERIFIED** (rules: another kind refused; UI: the named pieces glow, a game played to mate by taps).
- What the Brain named is public: **VERIFIED** (robots: "the knight!" reaches every phone and the TV; UI: the big «🧠 المخ (منى) قال: الحصان!» with its chime).
- Roles fixed for a game, swapped on play again: **VERIFIED** (rules, robots, UI).
- Clock off by default, 5+0 / 10+0 per team, a flag loses: **VERIFIED** (rules).
- Bot Brain names the kind of the engine's move, bot Hand plays the best move of that kind: **VERIFIED** (rules: a hard Hand told "queen" finds Qd8#).
- Stale taps, host "play for", forced moves, leaving, `roomTurnOf`: **VERIFIED** (rules/robots; the turn banner itself UNVERIFIED).
- Phone and TV screens: **VERIFIED** by screenshots (375×812 Arabic, 667×375, 1280×720 English, TV 1280×720 English); reload of the Hand mid-move brings back the board, the Brain's word and the lit pieces: **VERIFIED**.

## Decided here (open to change, each in one place, written in GEMINI.md)

- Vote chess: resigning is a vote and wins only outright (a tie with a move plays the move); play again keeps the teams and swaps the colours, dropping the old team chat; a latecomer watches and plays the next game; the host's close uses the votes so far; teams' games won shown in the pills.
- Hand and Brain: seats set by the host like الدومينو's (people first at random, two taps swap, empty seats → easy computer players at start); play again swaps roles and colours; a leaver's seat goes to an easy computer player; either member may resign; the host's "play for" plays as an easy bot; the Brain's naming is forced when only one kind can move, and a Hand's single move of the named kind is forced unless it ends the game; in Arabic the call is «المخ (منى) قال» (the role, not the person, is the subject, so it fits any name).
- Group: both in «ورق وطاولة» (Cards & table), where Ludo and بنك الحظ are - team chess is a board game at the table, and «لاتنين على موبايل» isn't true of it.

## Not verified

- `npm run test:ui` (the 15-minute screen test) was not run; the new games were exercised by the targeted CDP scripts above instead.
- iPhone / real devices, dark mode screenshots, and the 1920×1080 size.
