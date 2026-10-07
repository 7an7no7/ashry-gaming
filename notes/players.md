# Player names live on the phone

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

### Player names live on the phone

`allPlayers` is a localStorage list (`PLAYER_LIBRARY_KEY` in `JS_Core.html`),
not a sheet column. It used to be the `اللاعبين` tab — one list for the whole
app, which meant every device that opened the web app saw every name anyone had
ever typed. Play once with family and the next friend to open it is looking at
your relatives. It also cost a spreadsheet write per new name before the `+`
button came back.

The app no longer reads or writes that sheet; nothing depends on it.

**Names are matched, not compared.** `samePlayer(a, b)` folds case, spaces,
diacritics and the interchangeable Arabic letters (أ إ آ → ا, ة → ه, ى → ي), so
typing `احمد` when `أحمد` is saved reuses the person you have rather than making
a twin. `addToPlayerLibrary` returns the *stored* spelling for that reason —
use its return value, not what was typed.

**Every setup screen renders the same picker.** `renderActiveChips(containerId)`
draws the library as chips you tap to put someone in the round; the seven
screens with a `*-player-list` container get it for free, and it tints itself
with whatever `data-accent` that screen carries. It renders the library *plus*
any active name that is not in it, so a saved group whose members were deleted
from the library still shows the people it selected.

A saved group is still just a named list of names in `ashry_saved_groups`,
per device. Deleting a name from the library does not touch the groups.

**The picker is sized against a long library, not a short one.** Forty saved
names wrap cleanly, but they are 850px of chips, which pushes the Start button
— the control pressed every single time — off the bottom of the screen. So the
chips scroll inside a four-row box (`.picker__chips`, 216px, measured: at that
height Start still lands on the first screen for six of the seven setup
screens), and whoever is in the round is floated to the top so you can see who
is playing without scrolling. That re-sort happens on arrival and when you add
someone, **never on a toggle** — chips that move under your finger are worse
than chips in a stale order. `pickerOrder` is what holds them still. A name
put in the round pops in (`pickerJustAdded`, `.pick-chip--pop`).

**«مين بيلعب؟» instead of a toast** (the owner, 26 Sep 2026, P1 and P12). A
one-phone game that needs names and hasn't enough used to say so in a toast
that went away (in four different wordings) while the name field sat 450px
down the screen. Its Start now calls `askPlayers(min, then, { max })` in
`JS_Utils.html`: a centred sheet (`#players-modal`) with a field for each
player it needs, filled in with who is in the round and then the names this
phone knows (newest first), the other saved names as chips (one tap fills the
first empty field), «+ لاعب», ✕ on a row, and one big «يلا» that adds them to
the library and the round (`playersSheetGo`) and calls the game's own start.
Too few names shake the empty field and turn the line red (`blockStartAt`,
which any Start that can't go uses: it scrolls to what is missing, shakes it
and focuses it). One wording for the line everywhere: `playersNeedText`
(«محتاجين 3 لاعبين على الأقل», or «من 2 لـ 4 لاعبين» with a range). Used by
الجاسوس, الحرباء, الموقع السري, كلمة واحدة, ثلاث جولات, ربع قرد, أتوبيس
كومبليت, خمس ثواني, سكرو and الدومينو on the table, and the card score
keepers. On a phone on its side the fields go two a row.

**The order of play is changed only when asked** (P6): «↕ رتّب» in the
picker's head (`openActiveOrder`, the reorder sheet with context
`active-order`) reorders the players in the round. الجاسوس no longer opens the
order before every round, and الدومينو's four in teams say who is with whom
in the question itself (`paintDominoTeamsLine`: the first two against the
last two), with «↕ رتّب الفرق» there.

## The looks of 7 Oct 2026, second sheet (the owner's picks): built

- **1282 ب «اعمل وشك»**: the name sheet is also where a player makes a face (the hair, the skin,
  the clothes, glasses, a hijab, a cap…, or 🎲), kept beside the name in `localStorage.ashryFace`
  and shown in rooms wherever the initial was. The whole of it is in `notes/rooms.md` (the same
  heading).
