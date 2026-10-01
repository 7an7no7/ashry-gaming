# الجرس (the Buzzer)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**The Buzzer (الجرس)** has no content at all: the host asks their own questions
out loud and every phone is a buzzer. `buzzerAction` in `RoomGames.js` keeps
`shared.buzzes` in the order the presses reached the server, which is the one
thing a phone cannot be trusted with. The host's verdict (`correct` scores the
first in line and clears the queue; `wrong` drops them so the next in line
answers the same question, and **they are out for that question** - `s.out`,
cleared by the next question; the owner, 30 Sep 2026 - and every press carries
its question's `round`, so a late one can't lead the next question) and `lock` / `arm` (buzzers off while the question
is read) are host-only. A screen never buzzes: `buzz` from a device that is not
in `room.players` is ignored. Everything is in `shared` (`board` is the sorted
scoreboard the TV strip reads), and `TV_GAMES.buzzer` draws the first buzzer
big, the queue, the scores and the host's buttons when the screen is the host.

## The host's phone (1 Oct 2026, the before/after sheet)

«ترتيب الضغط» is a row of player chips (`roomPersonChip`, `.bz-order`): the first to
buzz lit (`.is-first`) with «بيجاوب», the rest with how far behind (`bzGapHtml`);
nobody yet is the line «محدش ضغط لسه». The host's six buttons left their card for
the bottom bar (`.bz-bar`): «✓ صح» and «✗ غلط» the main pair (success / danger, still
`correct` / `wrong { id }` of the first buzz), «🔄 سؤال جديد», «🔒 اقفل» / «🔔 افتح»
(`bz_lock_short`, `bz_arm_short`; the TV keeps the long words) and «لعبة أخرى» small
under them; «تصفير النقاط» is a small button under the standings it clears
(`.bz-reset`). The quiz's reveal / next sit under the quiz card. The players' bell
is unchanged.

## A TV host (1 Oct 2026)

A TV hosting the room has the phone host's «↺ السؤال من الأول» once a family
quiz is done and «صفّر النقاط» always (both `playAgain`), beside 🔄 and
another game.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
