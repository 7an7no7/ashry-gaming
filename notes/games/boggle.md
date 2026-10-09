# شبكة الحروف — Letter Grid (Boggle), 9 Oct 2026

Started with `npm run new:game` and built the same day. Files: `games/boggle/` -
`Boggle.js` (the dictionary, the grid maker, the judge; both sides), `RoomBoggle.js`
(the room's rules, ROOM_RULES.boggle), `JS_Boggle.html` (the board every screen draws,
the game alone, the daily, the styles), `JS_RoomBoggle.html` (ROOM_GAMES.boggle,
TV_GAMES.boggle), `boggle.text.js` (its words and rules).

## The owner's spec (notes/ideas.md, 1430)

- A 4×4 grid, 2 minutes (the host: 5×5 / 3 minutes); 3 rounds in a room (the host: 1/3/5).
- Diagonals link; 3 letters at least; ال is free (الأسد = أسد, scored as أسد); ة/ه and ى/ي
  one letter, folded as everywhere.
- Rooms: any word in the app's lists counts at once; any other goes to a quick vote of the
  room, as in أتوبيس كومبليت. Only words nobody else found score: 3 letters 1, 4 = 2,
  5 = 3, 6+ = 5.
- Grids are made by weaving listed words in, kept only with 15+ listed words including one of
  5+ letters.
- A daily in تحدي اليوم (share: found N of the total) and solo unlimited with a best score; both
  listed words only. English letters and lists when the games' language is English.
- Look أ «صندوق الزهر» from the sheet of 9 Oct (mock: `notes/archive/sheets/boggle-looks.js.txt`):
  a dice tray, the word being traced big above it with its points, the found words as chips
  under it; sideways and on a laptop the tray beside the rest; the TV the tray big in the middle,
  everyone's count either side, the clock in the corner; the result a card a player, the chips of
  words nobody else found in gold, the shared ones crossed out ×n, a «؟» chip for a word in the
  vote, ⭐ «محدش لقاها غيرك» on each one's best word.

## Decided while building (the rules didn't say)

- **The dictionary** (`boggleDictionary`, Boggle.js) is read from the lists where they are: the word
  wheel's banks (`wheelBankWords`), its everyday words (`WHEEL_BONUS_WORDS`, the verbs and adjectives),
  Stop's and the monkey's countries and cities, and the Codenames and drawing banks where they exist
  (the server). People's names and brands are left out. Single words of 3-10 letters. About 3,700
  words a language on the server, 4,000 on the page (it has Describe It, Charades and Who Am I instead
  of Codenames and the drawing words); `npm run check` prints them.
- **The article**: a list word written with a bare ال (الأسد) is kept and shown without it; أل with
  its hamza is the word's own (ألوان stays ألوان, 5 letters) - `boggleKey`. A traced ال in front of a
  word: if the whole trace is a listed word it is that word, else the ال is dropped (`boggleResolve`).
- **The vote**: only a word not in the lists that *nobody else* found goes to it (a shared one scores 0
  anyway). Everyone in the round but its writer says أيوه / لأ; more yes than no counts it (a tie is no);
  with nobody else to ask, the host says. It closes when all have said, after 20 s + 5 s a word (at most
  60 s), or on the host's «اقفل التصويت». An accepted word goes to the Stop word log
  (`room._stopTaps`, category `boggle`), so `npm run stop-words` shows the words tables accept.
- A phone may keep 12 unlisted words a round (a flood of junk traces would be a long vote); a «؟» chip
  is taken back with a tap (`drop`).
- **Room minimum 2** (no computer players: a room game a computer fills starts at 1).
- **Alone**: every word found scores by length (there is nobody to share with); the best per size
  (`soloBest('boggle', '4' | '5')`); «خلصت» ends early. The daily is 4×4, 2 minutes, timed like the
  game alone (the clock stops while the board is away), and counts toward the best too.
- After the last round the result goes straight to the podium (the round's cards under it).
- The icon is drawn (`ICON_ART.boggle`: four letter dice in their tray, a word traced across two);
  the share and the stats line use 🔠 (🔡 is كلمات من حروف's).
- Accent amber (look أ's), as on the sheet.

## How it is built

- **Boggle.js** (page: the game's chunk, `SHARED_LISTS`; server: `FILES` after WordWheel.js):
  `boggleDictionary(lang)` → `{ show, words, trie, pool }` built once; `boggleSolve(grid, n, lang)`
  (trie walk, every listed word in the grid, longest first); `boggleWeave` puts a word along a random
  path over blanks or its own letters; `boggleMake(n, lang, rnd)` weaves a 5+ letter word and short
  ones, fills the rest from `pool` (letters as often as the words use them), solves, keeps the best of
  up to 30 tries that passes. About half a millisecond a grid. `boggleTraceWord` checks a path (in
  range, touching, no square twice) and returns its folded letters. Everything random goes through
  `rnd` (`soloRng`), so a daily is the same on every phone.
- **The page's lists only when the game alone starts**: Boggle.js reads them behind `typeof`, and
  `LAZY_EDGES` (`Boggle.js>WordWheel.js`, `>StopWords.js`, `>MonkeyWords.js`) keeps them out of the
  chunk's needs; `startBoggleSolo` asks `lzWait(['wordwheel'])` first. The room screens never need
  the dictionary (the server judges). The chunk is 16 KB gzipped; the shell grew 2 KB (the drawn icon,
  the daily and stats lines). The grid's listed words are kept in `appState.boggle` (`words`, `show`),
  so a reload judges without the lists.
- **Rooms** (RoomBoggle.js): `start { rounds, size, lang }`; phases play → judge (if any) → result /
  gameover. `word { round, path }` - the server reads the word off its own grid and keeps it in
  `room.secrets[pid].words` (`{ f, w, ok }`) with `last` (`ok`, `vote`, `again`, `bad`, `full`) for the
  phone's feedback; `shared.counts` is all the table sees. `done`, `finish` (move-on), `judge
  { f, by, yes }`, `closeJudge`, `nextRound`, `drop`. On close every list goes to `shared.reveal`
  (`{ f, w, n, st, pts }`), the secrets are emptied; `shared.gained`, `scores`, `stars`, `board`.
  A leaver's list goes with them; the clocks are `deadline` / `timeout` (the round + 1.2 s grace, the vote).
- **The phone** (JS_RoomBoggle.html): the play frame is built once a round; the chips, the count and the
  feedback are patched in place from `you.words` / `you.last` (`bglRoomSync`) so a trace is never cut
  by a redraw. The clocks read the server's time (`roomServerNow`) with `createClock`, stopped by
  `onRoomClocksReset`. The last five seconds tick on the TV (or every phone when there is no TV).
- **The trace** (`bglTrace`): a square is caught only within 42% of its middle (a diagonal drag doesn't
  catch its neighbours), back onto the one before takes the last letter off, lifting sends; taps build a
  word sent with ✓ in the word box. The line is an SVG polyline through the squares' middles.
- **Motion**: a word that counts flies from the word box into its chip (`bglFly`); a refused one shakes
  red; the result's chips turn over one by one and the ⭐ pops (`bgl-reveal`, keyed by `motionFirst`
  once a round), the points count up; the podium and confetti at the end.
- **Styles**: `BOGGLE_CSS` in JS_Boggle.html, put in once when the chunk runs (as الليزر's).

## Tests

- `npm run check`: `validate-content.js` builds both sides' dictionaries, checks every key is folded and
  folds back from its spelling, and makes 40 grids a size and language on each side plus the next 120
  dailies, each with 15+ words and a 5+ letter one.
- `test:rules` → `leaks.mjs boggle`: three rounds of four (listed words, shared words, a non-path, a
  repeat, a word put to the vote and one taken back, a round ended by «خلصت», one by the clock, one with
  a leaver) and a 5×5 English game; probes: each phone's list exactly its own, nobody's words but your
  own anywhere in your view, no list on the table before the round closes.
- `play-all.mjs` segment `boggle`: a real round on the server with three phones and a TV.
