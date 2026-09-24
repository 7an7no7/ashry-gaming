# Batch 4, part B - bughouse (باغ هاوس): T4.1, T4.4 and T4.5 for bughouse

Branch `batch4-b4b`. Runbook: `notes/BATCH4_RUNBOOK.md`, Decision 3.

| Task | Commit | Files |
|---|---|---|
| T4.1 bughouse rules in Chess.js | 93941bb | `Chess.js`, `rooms-worker/test/rules.mjs` |
| T4.4 the room, the phones, the TV (with T4.5's parts for this game) | 71eba75 | `RoomBughouse.js` (new), `JS_RoomBughouse.html` (new), `RoomGames.js`, `rooms-worker/build.mjs`, `Controller.html`, `JS_Core.html`, `JS_Utils.html`, `JS_Catalog.html`, `JS_Room.html`, `JS_RoomTurn.html`, `Style.html` (section 34), `rooms-worker/test/rules.mjs`, `leaks.mjs`, `play-all.mjs` |
| GEMINI.md | separate commit | the owner's specs, the features list, a section, the files table, the log |

## T4.1 - accept lines

- Pure functions prefixed `chessBug…`, a hand per side, a drop `{ drop: 'n', to }`, SAN `N@f3`, promoted-piece tracking (square indices, moving with the piece), capture to the partner's hand (`info.gives`, `chessBugGive`) - VERIFIED (rules.mjs).
- Standard chess and perft unchanged - VERIFIED: only functions appended at the end of `Chess.js`; every standard and Chess960 perft line in `rules.mjs` passes; `test:rules` exit 0 (1555 checks).
- Drops refused on rank 1/8 for pawns, onto occupied squares, when in check unless it blocks - VERIFIED (rules.mjs "bughouse: …" lines).
- A drop mate - VERIFIED (R@e8#, and a smothered N@f7#); a check a piece in the other hand can block is only check - VERIFIED.
- A promoted queen goes over as a pawn - VERIFIED; the mark moves with the piece - VERIFIED.
- Hands after a sequence on two boards - VERIFIED.
- The computer: a drop mate first (hard) - VERIFIED; six bot games on two boards, every move and drop legal - VERIFIED.

## T4.4 - accept lines

- Four seats, two boards, their own clocks, both always running for the side to move - VERIFIED (rules.mjs; `roomDeadline` is the sooner board's flag).
- Hands and drops, a capture to the partner's hand - VERIFIED (rules.mjs, play-all on :8792, headless Chrome).
- Win on either board by mate or flag - VERIFIED (rules.mjs; the Chrome runs ended once by mate on board 1, once by a flag on board 1, once by mate on board 2).
- Computer players easy/hard filling seats, a sensible drop policy - VERIFIED (one person + three bots to the end; bots move on the server's clock).
- A leaver's board played on by a computer player for the rest of that game, said on screen - VERIFIED (rules.mjs, play-all: `s.subs`, a hard bot in the seat; the phones and TV show «🤖 الكمبيوتر بيكمّل مكان …»).
- Play again rotates partners - VERIFIED (three games, three pairings; with five people the watcher comes in).
- Phone: your board big, hands as rows of pieces, tap or drag onto a lit square, partner's board small with hands and clocks, tap to swap - VERIFIED in headless Chrome (drops by tap: 55, by drag: 2, board moves by tap: 80 in one run).
- Captured pieces fly to the partner's hand (motion) - implemented (`bhPlayMotion`, `bhFly`); UNVERIFIED by eye in motion (screenshots are stills; headless ran without errors).
- TV: both boards, four clocks, four names - VERIFIED (screenshots).
- Catalog, hub (min 1), distinct icon, GAME_RULES (ordered list) + HELP_ENTRIES + HELP_FOR_VIEW, roomPlayerLeft, roomTurnOf, stale taps, host recovery - VERIFIED (`npm run check` passes; Help opened on the rules in Chrome; stale taps in rules.mjs).
- Leak driver - VERIFIED (`leaks.mjs`: bughouse 4 rules, no slice sent, both boards and hands everywhere).
- Robot round - VERIFIED: `node test/play-all.mjs http://127.0.0.1:8792`: 2205 passed, 1 failed - the failure is `uno: a +4 answered a +2 (within fourteen games)`, a chance-based check in a game this batch did not touch; the bughouse round passed.

## Checks run

- `cd tools && npm run check` - pass.
- `cd rooms-worker && npm run test:rules` - pass (rules and leaks).
- play-all on :8792 - see above.
- Headless Chrome over CDP (`C:/Users/TPC/agy-tests/ashry-batch4b/T4.4-ui.mjs`, log beside it): 2 people + 2 bots + a TV, whole games, a reload mid-game back to both boards, Help, no console errors on any device. Screenshots in `C:/Users/TPC/agy-tests/ashry-batch4b/shots/`.

## Decisions made here (also in GEMINI.md)

- The game ends on a mate only; a side with no move and nothing in hand waits (no stalemate); a mate is judged with the hand as it is.
- Clocks start together 3 s after the deal, no free first move; a flag always loses.
- Empty seats get easy bots at the start (named from the host's phone); a leaver's replacement is hard.
- No draw offers; resigning loses for the team. No forced moves.
- The TV draws both boards in 2D (chess's 3D view is one per page).
- Home group: ورق وطاولة (`table`) - a board game for four; the reviewer may prefer another.
- Style section numbered 34; part A of batch 4 may add its own section 34 - renumber on merge.

## Uncertain

- `GAME_CATALOG` group and `ROOM_GAME_IDS` / `FILES` lines will conflict textually with part A's vote chess and Hand and Brain entries (both add after chess) - a merge, not a logic conflict.
- The capture flight and the 3D board with drops were not watched in motion by a person.
