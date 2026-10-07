# Card game score keepers (حاسبة الورق)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

### Card game score keepers (حاسبة الورق)

`JS_CardScore.html` is one engine and `JS_CardRules.html` five rule sets
(`CS_GAMES`: estimation, tarneeb, trix, konkan, basra), each a catalog entry
with its own `setup-cs-<id>` / `play-cs-<id>` screens. They are tools, not
games (the owner, 17 Sep 2026): `group: 'tools', kind: 'score'`, listed
under حاسبات النقط on the الأدوات tab (`renderTools` splits `kind: 'score'`
into its own section), and their setup screens' `up` is `tools`. The domino
score keeper was one of them until domino became a game in its own right
(21 Sep 2026): it is the "على الطاولة" side of the domino setup screen now
(`setup-domino`, `up: 'menu'`, beside "نلعب في التطبيق", which opens a room),
exactly as it was (`JS_Domino.html`), the way سكرو keeps its calculator; the
tools tab keeps a shortcut to it (`domino-calc`, `openTableCalc('domino')`,
which turns the setup to that side), next to one for سكرو's. The home's ورق
وطاولة section holds سكرو, أونو and الدومينو.
The deck is real; the phone keeps the score. A rule set says who sits
(`seats`, from the player picker in seating order; teams are 1 & 3 against
2 & 4, `csTeams`), what a round asks for (`entryHtml`, built from the
engine's pieces: `csStepperHtml` - kept left-to-right in Arabic -,
`csPickHtml` one-of chips, `csToggleHtml` pills), reads it back (`read`),
refuses what the deck can't produce (`check`: 13 tricks, 8 aces and jacks,
four queens taken, bids that can't add up to 13), turns it into points per
seat (`score`) and says when the game is over (`ended`, and `winners` when a
team wins rather than a total). Options are the house rules, shown on the
setup screen with the most common first. The engine draws the totals (the
leader crowned; Konkan's `low` crowns the lowest), the round card, and the
history with **take back the last round**: every round is saved with what was
on the card (`csDraftOf`), so taking it back puts exactly that back to fix.
A fixed earlier round scores the later ones again (`csReplay`); if one of them
no longer passes its check against the game before it (كونكان: someone brought
back under 101 has no points typed there, or the winner is now out), it opens
for fixing next with «صلّح الجولة N كمان» (`csStaleRound`) instead of scoring
the gap as 0. سكرو's table card refuses a thief holder who is the finisher.
تريكس's contract picker and check read the kingdom's rounds in the whole game
(`playedIn`), so a fixed round can't repeat a contract a later round played;
طرنيب ٤١ ends on a made 13 in any round, a fixed earlier one too (audit of 6 Oct 2026).
Totals count up from what each row showed before the round (a team row sums
two seats). Upright it is one column; sideways and on wide screens the totals
and history sit beside the round card (`.cs-layout`). All of it is restored
by a reload through `soloRegister`.

What a real table needed, added after the audit of 17 Sep 2026:

- **Seating is what you see.** A numbered strip under the chips
  (`csPaintSeating`, `csSeatTap`) is `activePlayers` in seat order, with team
  colours and "Team 1: A & C"; tapping two names swaps them. The chips alone
  showed library order while the game dealt tap order, so teams came out
  other than the screen suggested. The round card says who deals (🃏) where
  the rules have a dealer.
- **Rules lock once a round is saved** (`csLive`): shown as badges with a
  "change the rules (new game)" button that asks first. Switching Trix from
  Classic to Complex mid-game had silently lost contracts. Start asks before
  replacing a game in progress, and a finished game stays reachable ("see
  the last game") with its take-back.
- **Saving is the sticky action**, with a live preview (`csProject`, a copy
  of the state): each row's new total, 🏆 on a winner, red for anyone going
  out, "this round ends the game" - so a typo that ends a game is seen first.
  Quick fills (`quick` on a rule set) offer "N left, to whom?" and "made the
  call exactly".
- The five games share element ids, so painting one empties the others'
  stages. Konkan's "out over 101" is for players on their own only (in teams
  only partners could be left), and one colour and one suit are exclusive.
  Tarneeb 41 refuses made bids adding up to more than 13. A failed bid of
  13 scores 0, and when both teams qualify in the same round team 1 wins
  (it is checked first): the owner closed both questions on 23 Sep 2026,
  as built.
- **The bracket** takes 3-16 players from the player picker, with byes placed
  as in a seeded draw, a take-back of the last result, and the champion on a
  podium. **Domino** keeps a rounds table whose take-back removes exactly the
  points moved. `showScoreWinner` (JS_Screw.html) rebuilds the shared win
  popup's contents each time and never rewrites its buttons.

**سكرو on the table** (`JS_Screw.html`, the `setup-screw` / `play-screw`
screens, `.mode-device-panel` beside the room game's `.mode-online-panel`) is
the same scoring for a game with real cards. It keeps the hand totals as typed
(`players[i].scores[r]`, 0 for a player who ran out of cards) and the round's
picks (`meta[r] = { v: 3, caller, finisher, accused, holder }`), and works
every round out again through `skScoreRound`, so fixing a round rescores it:

1. The finisher's hand is 0.
2. Hands are added per team with صاحب صاحبه (two sides alternating in the
   order of names, 4, 6 or 8 players, like the rooms).
3. Round scores, decided on the plain totals: the finisher's unit scores 0 and
   a caller outside it is doubled; otherwise a caller lower than or equal to
   every other unit scores 0 and the others keep their totals; a beaten caller
   is doubled whatever the sign and the lowest of the others score 0; with no
   caller the lowest score 0. In teams only the caller's own hand is doubled
   and added to the partners'.
4. With الحرامي, the table's accusation: caught, the holder's unit takes +25;
   not caught, it takes the lowest round score and every unit that had it
   takes +25, nothing if it already had it.

Older rounds keep scoring by the rules they were saved under: `v: 2` doubled a
caller's whole team, and a round with no `v` used the first rules (the
caller's guess, the hands swapped on a wrong one, a tie doubled). A fixed or
taken-back round is saved under the current rules, the old guess standing for
the accusation. A half-typed round (`drafts[r]`) survives a reload, "رجّع آخر
جولة" puts a round back on the card, and the win popup is a lowest-first
podium drawn with `renderPodium`'s classes (`skPodiumHtml`). A game saved
before any of this (no `scoring: 'skrew'`) keeps its rounds as typed
(`meta[r].legacy`). The options (`prefs`) apply at Start; "لعبة جديدة" keeps
the finished game's. `JS_Screw.html` loads before `JS_Solo.html`, so it
paints through `onLeaveScreen`, `onLanguageChange` and `DOMContentLoaded`
rather than `soloRegister`. The preview above Save (`#cs-preview`,
`#sk-preview`) sits on its own plate: with four players its chips wrap and
used to read over the card underneath.

The numbers, researched on 16 Sep 2026:

- **إستميشن**: made exactly = base (10, or 13) + call, ±10 for the caller and
  anyone with the same call (مع), ±10 per risk level for the last to call
  (2-3 off 13 is one level, 4-5 two), ±10 for the only one who made it or
  missed; a miss is minus the tricks off; a dash call ±33 in an under round
  and ±25 in an over round, or Egyptian +33 / −23; a plain zero made in an
  under round +10; nobody made it (صعايدة): no points and the next round
  ×2 (×4 after two). 13 rounds and 5 speed rounds with no caller, or 13.
- **طرنيب**: شامي (made: the tricks taken; failed: −bid and the others
  their tricks; كبوت 16; bid 13 made 26, failed −16 and the others double),
  مصري (the same, ×2 or ×4 on the bidders), and ٤١ (each player bids alone,
  bid values 2-4 face, 5→10 … 12→36, the bids at least 11; a team wins when a
  player reaches 41 with the partner above 0, or on a made 13). Targets
  31/41/51/61.
- **تريكس**: king −75, queens −25, diamonds −10, tricks −15, Trix
  200/150/100/50; a doubled card costs double to whoever else takes it and
  pays its doubler the single value; its doubler taking it pays double and
  the one who led that trick gets the single value, unless the doubler led
  it (single value only). Classic 20 deals, Complex 8 (the four negatives in
  one deal, then the Trix); solo or teams.
- **كونكان**: the one who went out −30, the others their cards (100 if they
  never melded), ×2 for a hand or Konkan and for a joker or one-colour finish,
  ×4 for one suit; in teams the winner's partner 0. Lowest after 5 or 7
  rounds; knocking out over 101 is offered as a house rule only, since no
  reliable source has it.
- **باصرة**: 10 a basra, 1 an ace or jack, 2♣ 2, 10♦ 3, most cards 30 - a
  26-26 split carries the 30 to the next deck. Target 101/121/150, 121 by
  default (Egyptian tables); 2-4 players or two teams.

**Typed numbers** (the audit of 1 Oct 2026): `csVal` reads a typed value as a whole
number held to its stepper's min..max (as − and + are), so a bid of 7.5 can't score NaN and a
leftover of 999 counts as 400. The field itself isn't rewritten (it runs on every key); the
preview shows what counts.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
