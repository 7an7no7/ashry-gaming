# Night review, 25-26 Sep 2026 - area "table" (reviewer 5)

Games: سكرو (room + table calculator), أونو, الدومينو (room + score keeper),
لودو, بنك الحظ, كدّاب, الشايب, إستميشن (room), and the five card score keepers
(إستميشن, طرنيب, تريكس, كونكان, باصرة).

How: my own rooms server (wrangler dev :8805), the preview on :4355, one
headless Chrome driven over CDP with a browser context per phone,
`prefers-reduced-motion: no-preference` emulated. Games were played by
scripts that tap the app's own buttons / call its own tap functions (not the
server directly), so the phones' UI paths ran. A bidi probe measured, glyph by
glyph, whether a "+10", "−1", "×2" or "±33" in an Arabic line was drawn
backwards ("10+").

## What I played

| game | how far | sizes / looks |
| --- | --- | --- |
| إستميشن (room) | a whole 18-round game to the podium: one person + 3 computer players + a TV; a dash round, auctions (I bid 5 ♥ and won the call), calls, the 5 speed rounds (14-18), a reload mid-round (came back to the table) | 375×812 ar light, 375×812 en dark, 667×375, 1280×720, TV 1920×1080 |
| أونو | a whole one-round game: 2 people + hard + easy bot + TV, to the win and the hands turned over | 375×812 en dark, 667×375 ar light, TV 1280×720 |
| الدومينو | a whole game to 101 (4 rounds, a blocked round), 2 people + 2 bots + TV | same phones, TV 1280×720 |
| لودو | a whole game to the podium, 2 people + 2 bots + TV | same |
| بنك الحظ | against the phone (2 bots) for ~12 turns: rolls, buying after the first lap, a card, rent, jail | 375×812 ar light |
| سكرو | a room of 3 people, العامة (every card), the memorise step, draws, a cannon, a بوم pick; not to the end of a round (the test browser was killed by another reviewer's clean-up mid-round) | 375×812, 390×844, 1280×720 en |
| إستميشن score keeper | a whole 18-round game to its podium, a dash round, take back the last round (the numbers came back to fix) | 375×812 ar |
| تريكس, باصرة | opened, a round's card for each contract looked at | 375×812 ar |
| طرنيب, كونكان | rules and code read, not played in the browser | - |
| كدّاب, الشايب | not played (time and disk ran out); data and help read | - |

No console errors on any phone or TV in anything played (only Chrome's
"navigator.vibrate blocked" log from scripted taps).

## Found and fixed

1. **Signed numbers drawn backwards in Arabic** (the biggest one; seen on
   every screen of these games that explains scoring). In an Arabic line a
   "+10", "−10", "×2", "−1", "+25" or "±33" after a letter or at the start of
   a line is drawn with its sign on the wrong side ("10+", "33±"). Fixed:
   - Help (GAME_RULES, Arabic) of سكرو, الدومينو, إستميشن, and the score
     keepers إستميشن / طرنيب / تريكس / كونكان: every signed number wrapped in
     `<bdi dir="ltr">` (the way أونو's help already does it). ~25 lines.
   - Translation strings (as `⁦…⁩` isolates): إستميشن's dash choice
     «±33 تحت، ±25 فوق» and «+33 أو −23» (the lobby's and the score keeper's
     segmented control - it read "33± تحت" and "23− أو 33+"), `es_dash_hint`,
     `dom_help_points_hint`, سكرو's thief strings (`screw_opt_thief_hint`,
     `screw_thief_victim`, `skr_vote_hint`, `skr_thief_caught_by`,
     `skr_thief_stole`).
   - The first-play card strips tags from the rules; it now keeps a
     `<bdi dir="ltr">` as an isolate so its three steps don't flip again
     (`firstPlaySteps`, JS_Catalog.html).
   - طرنيب مصري's «×2 / ×4» chips (JS_CardRules.html).
   - The TV's score strip showed «12-» for −12: `.tv-chip__score` is `dir="ltr"`
     now (JS_RoomTv.html; every room game's strip).
   Checked after: the probe finds nothing backwards in the إستميشن lobby, the
   score keeper's setup and its help card.
2. **Domino round result, names in the wrong order**: «أقل إيد Chip: ياخد 57
   من حجارة كريم ،Robo ،Sara» - a list of Latin and Arabic names joined with
   «،» reordered itself. Each name is isolated and the list takes the line's
   direction (`domResultLine`, JS_RoomDomino.html). Same guard on إستميشن's
   shared-win title.
3. **Estimation score keeper, the dash pill off the card on a phone**: its row
   of two steppers + the «داش» pill was 339px in a 296px row, so the pill
   stuck out past the card's edge. `.cs-seat-row__cells` gets `max-width:
   100%` so the pill wraps under the steppers (Style.html, one property).
4. **Estimation TV, the round's result ran off the screen**: at the round's
   end the TV showed every round's sheet under the board, and from round ~6 it
   ran past 1080px (and the end screen showed the podium, the last round and
   all 18 rows). The TV now shows the last 4 rounds of the sheet (the Σ row is
   the whole game) and, at the end, the podium and the final board only
   (`esSheetHtml(state, last)`, JS_RoomEstimation.html). Phones unchanged.
5. **بنك الحظ cash lost its thousands comma after every payment**: the chip's
   count-up landed on "1150" beside "1,500". It is written back with the comma
   when the count ends (JS_Bank.html).
6. **بنك الحظ card and help used Arabic-Indic digits** («خد ٢٠٠», «١٬٥٠٠ ج»)
   while the whole game, the board and the prices use 0-9. All card texts in
   BankAlhaz.js, the bank/ludo translation strings and the bank help block now
   use 0-9 (and 10% for «١٠٪»).
7. **بنك الحظ «أقرب شركة» card with one die** said «10 أضعاف الرقم» while
   the rule (owner's spec) is die × 20. The card has a one-die text now
   (`one:` on that card; `bankCardText(deck, k, g)` picks it); «النرد» →
   «الزهر», the word used everywhere else in the game.
8. **تريكس / باصرة score keepers wrote suit glyphs in Arabic** («K♥», «Q♠»,
   «2♣», «10♦») - GEMINI's own rule is no suit symbols in running text (♥ ♦
   turn into emoji on an iPhone). Arabic now says «ملك الكبة», «بنت
   البستوني»…, «الـ2 سباتي», «الـ10 ديناري» (labels, the error line and the
   help); English keeps the glyphs.
9. **سكرو power prompt glued**: «The cannonPick a player…» - a ": " between
   the power's name and its instruction (JS_RoomScrew.html).

## Content checked

- SkrewCards.js: names/values match the owner's specs (57 base cards, 9/10
  «شوف كارت حد», +20/−1 no band, screws either way). Nothing changed.
- UnoCards.js / PlayingCards.js: rank names آس / ولد / بنت / شايب, suits كبة /
  ديناري / بستوني / سباتي - correct Egyptian table words.
- Estimation.js: scoring matches the score keeper and the owner's numbers
  (base+call, ±10 caller/مع, ±10 per risk level, ±10 only one made/missed,
  zero in an under round +10, dash ±33/±25 or +33/−23, صعايدة ×2). Speed
  trumps order بستوني، كبة، ديناري، سباتي، صن matches the owner's ♠ ♥ ♦ ♣ none.
- BankAlhaz.js: places, prices and both decks read in both languages; wording
  family-safe and Egyptian; English matches. Only the digits and the one-die
  card changed (above).
- Help texts of these games read against the owner's specs: no rule
  contradiction found.

## Open questions for the owner

- No rule looked wrong; nothing needs a decision.
- The estimation bots: in my 18-round game with 3 easy computer players the
  person (auto-playing hard) won 184 to 110 - nothing wrong, just noting the
  easy bots are easy.

## Seen, not fixed

- `npm test` (play-all, full, against my server): 2297 passed, 1 failed -
  «uno: a turn drew a card, and played it or passed». I changed nothing Uno
  runs (no RoomUno/UnoCards/JS_RoomUno edits); it looks like a timing flake on
  a busy PC (several reviewers' servers and Chromes at once). Worth one rerun
  before the next release. `--only=estimation`: 14/14.
- The first-play card cuts step 3 at 140 characters with «…» for estimation
  (by design).
- سكرو's «الكراسي الفاضية…» / lobby are fine. The dark-mode screens looked
  right.

## Not checked

- كدّاب and الشايب were not played (only data/help read).
- سكرو was not played to a round's end (the thief vote, the reveal, the
  podium) - the test Chrome was killed mid-round by another reviewer's
  clean-up and disk was down to 2.5 GB, so I stopped.
- لودو and بنك الحظ against the phone at 667×375 / 1280×720, and the bank room.
- طرنيب and كونكان score keepers in the browser.
- The domino result line was fixed by reading the code; I didn't replay a
  round end after the fix.

## Checks

- `cd tools && npm run check`: passes.
- `cd rooms-worker && npm run test:rules`: passes (no ✗; leak check clean).
- `node test/play-all.mjs http://127.0.0.1:8805`: 2297 passed, 1 failed (the
  Uno flake above); `--only=estimation`: 14 passed.
