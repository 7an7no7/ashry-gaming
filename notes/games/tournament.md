# The duels' tournament (بطولة)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **The duels' tournament (بطولة)** - the owner's decisions of 23 Sep 2026,
  asked one by one (*The duels' tournament*):
  - **Two ways to play a room duel: winner stays** (today's, still the default)
    **and a tournament.** The tournament is **a lobby switch shown only when the
    room has 4 people or more** (computer players don't count and sit it out);
    with 2 or 3 it isn't shown and the room plays winner stays.
  - **The matches of a round are played at the same time**, each pair on their
    own phones. The TV, and whoever is out or waiting, see **the bracket filling
    in** and can watch any match live (a picker of the matches on a phone; the
    TV shows the bracket with the matches being played beside it as small live
    boards, and a match big when the host picks it).
  - **Random byes in round 1** when the number isn't a power of two, placed as
    the Tournament Organizer tool places them (a seeded draw: two byes never
    meet); **the draw of the pairs is random.**
  - **A drawn game (كونكت ٤, نقط ومربعات, إكس أو) is replayed with the other
    player starting, until someone wins.** A match is otherwise one game.
  - The games: **كونكت ٤, نقط ومربعات, خمّن مين, حرب السفن, and إكس أو brought
    into rooms** as a room duel of its own (winner stays and the tournament,
    "3 marks only" as a lobby option, the look and motion of the one-phone
    game; the rules once in `TicTacToe.js`; `modes` gained 'room' and 'tv';
    the phone as a player stays on one phone).
  - **The end: the champion on a podium** with the runner-up and the two
    semi-finalists, confetti, and the night's leaderboard; then the host deals
    **a new tournament** (a new draw) or **switches back to winner stays**.
  - Decided here (open to change, each in one place):
    - **The night's leaderboard**: a tournament scores **3 to the champion, 2 to
      the runner-up, 1 to each semi-finalist** (`TOUR_POINTS`), the podium in
      points; a new tournament adds to them (like play again), and they are
      banked when the room goes back to the hub, as every game's board is. So
      one tournament gives the night's places 3 / 2 / 1 / 1 and nothing to
      whoever went out earlier. Switching between winner stays and a tournament
      banks the board so far first, as the hub would.
    - **A match starts once both its players are known** (`TOUR_NEXT_MS`, 6
      seconds, so the winner sees the win and their name fly to the next slot) -
      so two byes that meet in round 2 start at once, beside round 1's matches,
      and nobody waits for a round they aren't in. The first matches wait for
      the draw to fly onto the screens (`TOUR_DRAW_MS`, 4.5 s), a replay 4 s
      (`TOUR_REPLAY_MS`). The first game of a match: who starts is random.
    - **Leaving**: a match being played is lost by forfeit, as in winner stays;
      one about to start is a walkover; a match you would have gone on to is a
      walkover for whoever meets you. If both players of a match leave, the
      first hands it to the other, who then walks their next opponent through;
      a match with nobody left sends nobody on; a final with nobody left ends
      with no champion. **A latecomer watches and plays the next tournament.**
    - The turn clocks and the host's "play for" (خمّن مين, حرب السفن, شطرنج)
      work per match, on the match the host is looking at (on the TV, the
      match it shows big); كونكت ٤, نقط ومربعات and إكس أو have no clock, and
      a phone gone quiet is the host's ✕ (a forfeit). Chess's draw rule is its
      own (*The owner's specs*, شطرنج).
    - A phone shows its own match by itself - the one it plays, a replay, the
      one it just won or lost while its board is kept - and the bracket
      otherwise; a new match of its own takes it back there.
    - إكس أو in rooms: seat 0 is X and moves first; with 3 marks only the
      fading oldest mark shows on its owner's phone, on their turn, only.

### The duels' tournament

The owner's decisions are in *The owner's specs*. One engine for every duel,
on the server (`RoomTournament.js`) and on the page (`JS_RoomTournament.html`,
section 30 of `Style.html`).

**A match is a small room.** `room.shared` holds the bracket (`tour`: the
entrants, their names, `matches` with each one's two players `p`, its byes
`out`, where its winner goes `next` / `slot`, its `state` - wait, ready,
play, done - `startAt`, `seats`, `games`, `draws`, `winner`, `loser`,
`reason`) and every match's game (`games[id]`, the game's own shared state).
`tourRoomOf` builds a room of the match's two players around that game, with
its hidden state (`room._tourHidden[id]`, never projected) and its two
phones' secrets, and the game's own action function, clock and leave run on
it exactly as they run in winner stays; `tourCommit` puts it back, each seated
phone's secret as `room.secrets[pid] = { tm: id, … }` - a phone is in one
match at a time, and its secret names that match. The game's action function
(`duelAction`, `guessWhoAction`, `battleshipAction`) hands every action to
`tourAction` first: `start` with `tournament: true` deals one (people only,
four at least), `tourNew` the next one or winner stays, `tourFeature` the TV's
big match, and every move carries `match` and `mg` (the match's game number),
so a tap for a match that moved on is dropped. `gameDeadline` / `gameTimeout`
(the next match's start and every match's own clock) and `gamePlayerLeft`
ask `isTourRoom` first. A match's board is dropped once both its players have
moved on (`tourDeal`), so a room's state stays small with six matches going.

**Plugging a duel in** (chess is plugged in the same way, below): an adapter in `TOUR_KINDS` -
`options(payload, prev)` and `settingsOf(shared)` (the lobby's choices, from
a start or a winner-stays game), `deal(v, settings, match)` (a fresh game on
`v.shared`, whose seats, names and round are set; `match.games` and
`match.draws` say which game of the match it is), `act(v, pid, action,
payload)`, `deadline(v)` / `timeout(v, now)` if it has a clock, `left(v,
pid)` (the game ends by forfeit), `stay(room, pid, settings)` (winner stays
with those choices), and `drawRule(match, game)` - optional: after a drawn
game (`match.draws` already counted) `'replay'` or `{ winner: seat }`;
without it every draw is replayed, the seats swapped. A game is over when its
`phase` is `'over'`, with `result.winner` a seat or null (what `duelEnd`
writes). Chess's rule - a draw replayed once, then an Armageddon game whose
draw is Black's - is `drawRule: (m) => m.draws < 3 ? 'replay' : { winner: 1 }`
with `deal` reading `m.draws === 2`. The game calls `tourAction(room, pid,
action, payload, '<id>')` first thing, its client code reads the room through
`duelRoomState()` and sends through `duelAct()` (below), and one line in
`TOUR_CLIENT` (its small board for the TV's live cards) wraps its renderers.
A test of each is in `rules.mjs`, `leaks.mjs` (`TOUR_DRIVERS`: a tournament's
views held to the game's own probes, match by match) and `play-all.mjs`.

**On the page** the duels' renderers are wrapped (`tourWrap`) - at the
tournament's load for those already there (connect4), and at the end of each
duel's own file for the rest, whose chunks run after the duels' chunk
(`if (typeof tourWrap === 'function') tourWrap('dots')`; until 1 Oct 2026
only connect4 was wrapped, and `tools/lazy-split.mjs` now fails the build on
a duel wrapped before it registers): with
no tournament on they run as before; with one on, a phone shows a match -
through the game's own renderer, given `tourMatchState` (the match's game as
`shared`, with `tourMid` and `tourGames`, and `you` only when the secret names
that match) - or the bracket (`tourScreenHtml`). Which (`tourFocusId`): a
match the phone picked (`tourShow`, from the bracket or the chips of the
matches being played), the bracket if asked for, or by itself its own match
(`tourAutoId`: the one it plays, a replay, the one it just won or lost while
its board is kept), else the bracket with its next match and the countdown;
a new match of its own takes it back (`tourSyncAuto`). The duels' shared code
reads the room through `duelRoomState()` and sends through `duelAct()` (both
in `JS_RoomConnect4.html`), which add the match; `duelRoomLineHtml` and
`duelRoomOverHtml` leave a place in a match's screen that `tourAfterMatch`
fills: the round, the matches to watch, the bracket, and after a game who goes
through, the replay's countdown, your next match or that you're out. The
bracket is a column a round in the page's direction, each round's matches in
pairs with the lines drawn by the pair (`.tour-pair::after`) and the next
match (`::before`); LIVE, a countdown, a tick for the winner, a line through
the loser, a crown on the champion. The TV (`tourTvFrame`) is the bracket with
the matches being played beside it as live cards (`TOUR_CLIENT[game].mini`:
the board itself for the three board games, faces or ships left for the other
two), and a match big - the host's pick (`tourFeature`), or the only one being
played (the final, say) - through the game's own TV renderer.

**Motion**: the draw - every first-round name flies from the middle of the
bracket into its slot, one after another (`tourDealDraw`, only for a draw just
made); a winner's name flies from the match they won to their slot in the
next round (`tourFlyWinners`, whatever this screen last drew); the champion's
row is crowned, the podium of four rises (`tourPodiumHtml`, the app's
`.podium`) and the confetti waits for it (`afterReveal`); the points count up
on the board (`animateScoreboards`). `roomTurnOf` answers for the phone's own
match (`tourTurnOf`), and the lobby's switch is `tourLobbyHtml`, remembered on
the host's phone per game (`recallOptions('tourMode')`).

**Every tournament is new to the phones (the review of 1 Oct 2026).** `tour.no` keeps counting across the room's tournaments even with winner stays or the hub between them (`room._tourNo`), and `tour.id` is a fresh `newDealId()` at every start, carried into each match's `dealId` (`<id>.<match>.<game>`). The client's play-once keys (the draw, the flights, the podium, the cheer, the signature) read `tourKeyOf(tr)` (the id, or the number from an older server), and a new tournament resets the phone's own view (`tourLocal.tourKey` in its `onRoomClocksReset`).

- «إكس أو الكبير»'s small live boards on the TV have a bigger box of their own (`tour-mini__board--big`,
  2 Oct 2026; notes/games/duels.md).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
