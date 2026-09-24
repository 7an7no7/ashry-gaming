# Batch 5 runbook - chess for four («شطرنج الأربعة»)

The owner approved on 24 Sep 2026, every rule asked first. Rooms only: each
player on their own phone, the TV optional (a room without a TV plays fully).

## Decisions (the owner)

1. **Two ways, a lobby choice: Teams (the default) and everyone for themselves.**
   - Teams: 2 vs 2, partners sitting opposite (red + yellow against blue +
     green). A team wins when **either** opponent is checkmated (or resigns, or
     runs out of time).
   - Everyone for themselves (FFA): **chess.com's points**: taking a pawn 1,
     knight 3, bishop 5, rook 5, queen 9 (a promoted queen is worth 1),
     checkmating a player +20 (to whoever delivered the mate; a player mated by
     a discovered check from a second player - the points go to the player whose
     move gave the mate), a player who is stalemated is out and scores +20 for
     themselves. **A player who is mated, stalemated, resigns or runs out of time
     is out; their pieces turn grey and stay on the board as walls** (they can't
     move and can't be taken). The game ends when one player is left; the highest
     score wins (ties share it).
2. **Computer players, easy and hard**, fill empty seats (so 2 or 3 people can
   play).
3. **Rooms only**; the TV shows the big board (3D on the TV like chess, or a
   large 2D if 3D is too heavy - see T5.3), the phones show 2D by default with the
   ▦/🧊 switch if a 3D version exists, otherwise 2D only.
4. **The look is أ «بطولة»** from the owner's design sheet: green `#769656` /
   cream `#eeeed2` squares like the 2D chess board, the corners (3×3) cut away,
   pieces in four bright colours - red `#d6453d`, blue `#3f73d6`, yellow
   `#e9b52a`, green `#35a35a` (each with a darker outline), grey `#9a9a9a` for
   out players - red at the bottom, blue on the left, yellow at the top, green on
   the right, as on the sheet; **the board turns so your own colour is at the
   bottom** on your phone (the TV: red at the bottom).

Decided by Claude (standard 4-player chess, as on chess.com; each in one place):
- The board is 14×14 without the four 3×3 corners (160 squares). Each side's
  back row is the 8 squares in the middle of its edge, pawns in front.
- **Order of play: red, blue, yellow, green** (clockwise as seen with red at the
  bottom). Red moves first.
- Pawns move toward the opposite side (red up, yellow down, blue right, green
  left), one square or two from their starting row; capture diagonally forward;
  **no en passant**. **Promotion: FFA on the 8th row from their own side (the
  middle), Teams on the 11th row; to a queen only.**
- **Castling** both ways, standard conditions (king and rook unmoved, empty
  squares between, the king not in check and not passing through an attacked
  square).
- Check can come from any opponent (in Teams from either opponent, never from a
  partner - partners' pieces don't attack each other's king). A king must not be
  left in check by its own move. In FFA a player in check from someone whose turn
  comes before theirs still moves normally; checkmate is judged on that
  player's turn (they are mated if, on their turn, they are in check with no
  legal move).
- In Teams, a player with no legal move but not in check (stalemate) passes
  their turn (the game goes on); in FFA stalemate is decision 1 above.
- An optional turn clock (off by default; 1, 3 or 5 minutes per player + 5 s a
  move), the host's lobby choice, remembered; running out = out (FFA) / the team
  loses (Teams).
- The host can "play for" a phone that went quiet (after 40 s, or at once for a
  phone that's away) - a computer move at easy level, marked as such.
- A player who leaves: FFA - out, pieces grey; Teams - a computer player takes
  their seat for the rest of the game (said on screen).
- Seats: the host picks colours in the lobby (who sits where; in Teams partners
  are the opposite colours); bots fill empty colours; play again keeps seats and
  rotates who is red (who moves first).

## Tasks

The executor's contract is the earlier batches' (read CLAUDE.md, GEMINI.md
"### Multiplayer rooms" in full, "### شطرنج", "### Ludo" and "### بنك الحظ" (4-seat
room games with bots), the design system, the motion toolkit).

- **T5.1 `Chess4.js`** (shared by the page and the Worker, pure, every name
  `c4p` / `C4P_`… NOTE `c4` is taken by Connect 4 - use `chess4` / `CHESS4_`):
  the board (160 squares), pieces with owner, move generation (every piece; pawns
  per direction; castling; promotion by mode), check by any opponent (teams:
  opponents only), make/unmake or apply, checkmate/stalemate per player, the out
  players (grey walls), points (FFA), the end, SAN-like notation for the log
  (e.g. `🟥 Nf3` with the 14×14 coordinates a-n / 1-14), and the computer
  players (easy: 1-ply with captures preferred and some randomness; hard: a
  paranoid alpha-beta 2-3 plies within a node budget (~20k nodes, fast enough
  for the Worker's free-plan CPU), material + mobility + king safety, in Teams
  never harming the partner). Rules tests in `rooms-worker/test/rules.mjs`:
  move counts from the start position for each colour, castling, promotion rows
  per mode, check from two directions, mate detection, grey walls, points,
  teams win on either mate, bots always legal over whole bot-only games (20
  games each mode, easy and hard), no game longer than 600 moves (add a 50-move
  style rule if needed: after 50 moves each with no capture or pawn move, the
  game ends; FFA: highest score wins; Teams: a draw).
- **T5.2 `RoomChess4.js`** (bundled after RoomChess.js): the lobby (mode,
  clock, seats/colours), start, moves with stale taps (`move` count), the clock
  (`roomDeadline`/`roomTimeout`), "play for", leaving, bots (`ROOM_BOT_GAMES`,
  the bot's decide within the node budget), results, play again; a
  `roomTurnOf` case; `roomPlayerLeft`; nothing hidden (all in `shared`), but add a
  leak-check driver anyway.
- **T5.3 `JS_RoomChess4.html`** + a section of `Style.html`: the 2D board as the
  design sheet (a CSS grid of 14×14 with the corners empty; the same drawn piece
  symbols as the 2D chess board, tinted per player - reuse the chess piece
  `<symbol>`s with a fill per colour), turned so your colour is at the bottom;
  tap / drag to move with legal dots and capture rings, last move highlighted,
  check glow, grey out players; the players strip (four chips with colour, name,
  points in FFA, a ring on the one to move, clock); moves slide (0.15 s), a
  capture fades, a mate: the king topples/greys with a sound, a player out: their
  pieces fade to grey one by one; points fly to the scorer's chip (motion
  toolkit); the end: a podium (FFA, by points) or the team banner (Teams) with
  confetti. The TV: the big board with red at the bottom, the four chips around
  it, the log. 3D is optional - only if it can be done well on the existing chess
  3D engine; otherwise the TV shows the large 2D board (say which in the report).
  Phones 375×812, 667×375, laptop 1280×720, TV 1920×1080, Arabic and English,
  light and dark.
- **T5.4 registration**: catalog entry (group: the one whose name is true of it,
  e.g. with the other room card/board games), icon distinct from every existing
  one (not ♞ - chess uses it), hub entry (minimum 1 person with bots), rules as an
  ordered list in `GAME_RULES` + `HELP_ENTRIES` + `HELP_FOR_VIEW`, a round in
  `play-all.mjs` (Teams and FFA, people + bots), GEMINI.md (the owner's specs, a
  section, the log).

## Report
`notes/phase-reports/batch5.md`.
