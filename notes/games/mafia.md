# مافيا (id `mafia`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **مافيا (Mafia / Werewolf)** - the owner's spec of 16 Sep 2026, built the
  same day (*مافيا in rooms*): the app is the narrator (night choices made silently on each phone,
  the server resolves them), the voting engine for the day, the TV for night
  and day, family wording ("خرج من اللعبة", no killing words).
  - **Two modes.** *Classic*: Mafia and Citizens only. *Roles*: adds the
    Doctor, the Detective and the **Lawyer** (محامي).
  - **The Lawyer** defends the Mafia by misleading the citizens as if they
    were one of them. The Lawyer knows who the Mafia are; the Mafia don't know
    who the Lawyer is.
  - **The app picks how many Mafia** from the number of players, so it is
    fair. At least 5 players.
  - **Revealing roles is an option, off by default**: anyone who leaves the
    game is shown as a Citizen, except a Mafia member, who is always shown as
    Mafia. With the option on, the real role is shown.
  - **There is time to talk**: a discussion clock before every vote, for
    arguing and accusing.

## From GEMINI.md: Multiplayer rooms

**Mafia's night looks the same on every phone.** One heading, one list of
everyone still in, one kind of button; the role, its task, the Mafia's picks,
the Lawyer's list, the Detective's results and the Doctor's last save are on
the back of a `.hold-card`, updated in place so a card being held doesn't
flip back. A tap the server would refuse does nothing, silently - an error
toast would say which role tapped.

**مافيا in rooms** (`mafiaAction`, `JS_RoomMafia.html`), the owner's spec (see
*The owner's specs*). `mafiaCount` picks the Mafia from the table (one up to
six players, two up to nine, three beyond; five at least) and `mafiaRoles`
adds the Doctor and the Detective in the Roles mode, and the Lawyer from six
players. `room._mafia.roles` never leaves the server; `mafiaWriteSecrets`
rewrites every phone's slice after each move: its role, the Mafia list for
the Mafia and the Lawyer (the Mafia's list never names the Lawyer), the
Mafia's picks for each other, the Doctor's last save, the Detective's checks
(a Lawyer checks as not Mafia). Phases: `roles` (the role on a `.hold-card`),
`night` (every living phone taps a name through `nightPick` - a suspect for
those with nothing to do, so nobody can tell who acted - with a server clock;
it ends when all have tapped, by the clock or by the host's `endNight`),
`day` (the news, then a discussion clock the host can lengthen with
`moreTime` or cut with `startVote`; the clock opening the vote is
`roomTimeout`), `voting` (the voting engine, living players only, every
option owned by its player so nobody votes themselves, plus "nobody"; a tie
or "nobody" on top sends nobody out), `dayResult`, and `gameover` with every
role in `shared.roles`. Someone who leaves is shown through `mafiaShownRole`:
a Citizen unless Mafia, or their real role when the host turned
`revealRoles` on. The Mafia win at parity (the Lawyer counts with the town
there but wins with the Mafia); the town when no Mafia is left; each winner
scores a point. The news is worded so it fits any name ("المافيا خرّجت
{name} من اللعبة"): Arabic verbs agree with the subject, and a name doesn't
say whether to write خرج or خرجت. `roomTurnOf` asks a living phone that
hasn't tapped at night (`turn_night`).

**The narrator** is an option in the lobby, **off by default** (the owner,
20 Sep 2026: not on until it has been heard on a real phone). It is a room
setting - `shared.narrate`, so every device agrees the evening has a voice -
and exactly one device speaks: the big screen where there is one (the table's
own voice, and nobody is holding it), the host's phone where there is none
(`mafiaNarrator`). At each change of phase it reads one short line
(`mafiaNarrationLine`): the town falling asleep, the morning news, the vote,
the end. **It never reads a role**: the lines are the very strings already
printed on every screen, and `mafia_was` and the role name are deliberately
not among them. A news card lies face down for a beat, so the line goes
through `afterReveal` rather than saying the name out from under the reveal.
The speech itself is `speakLine` / `speakStop` / `speakPrime` in
`JS_Sounds.html`, which handles the three things browser speech gets wrong:
`getVoices()` is empty until `voiceschanged`, so the list is asked for each
time rather than cached; iOS only starts speech inside a tap, so it is primed
on the first one anywhere in the app and a refusal is swallowed; and where
there is no voice for the language it says **nothing at all** - an Arabic line
read by an English voice is worse than silence. Leaving the screen, or the
room moving on (`onRoomClocksReset`), cancels whatever is being said.

**The TV at night shows a count, not names** (the review of 1 Oct 2026): «✓ 3/5»
instead of a chip per player - the names still waiting were the roles still deciding.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **538 The out players see everything** - the owner: a lobby switch, **on by default**. «اللي يخرج يتفرج على كل
  حاجة» (`mafia_outsee`, remembered on the host's phone in `ashryMafiaOpts.outSee`, sent as `outSee` in the start
  payload; the server's `shared.outSee`, an older phone that sends nothing keeps the last game's, else on).
  While it is on, a player of the roster who is out (not in `alive`, game not over) gets `you.spectate` in their
  own slice (`mafiaSpectating`, `mafiaSpectateView` in `RoomMafia.js`, written by `mafiaWriteSecrets`, so it is
  fresh after every night tap): every real role `{ id, name, role, alive }`, and at night the picks so far
  (the Mafia's `by ← name`, the Doctor's save, the Detective's check and its answer, every suspect). Silent: the
  ballot was already the living only; `chat` throws and `cheer` is dropped for them (`mafiaSilenced`, one line in
  each in `rooms/RoomGames.js`). The phone (`JS_RoomMafia.html`): the out note says «… شايف كل حاجة. خليك ساكت»
  and a «أدوار الكل» card with the night's picks (`mafiaSpectateHtml`), refreshed in place
  (`refreshMafiaSpectate`), so a pick at night is no rebuild; on the night, the day, the vote and the result.
  The TV is unchanged. Help rule added. Tests: `rules.mjs` (both switch states: who watches, roles, picks, chat,
  vote), a leak probe (`leaks.mjs`: only an out player of the roster, with the switch on, holds `you.spectate`).
- **539 «الحارة بتنام», look A** (the TV only; the phones are unchanged). The night is one street seen from across
  the road (`mafiaStreetNightHtml`, `mafiaStreetSvg`, `mafiaHouseSvg` in `JS_RoomMafia.html`): a house for everyone
  still in, all the same size and named for nobody, a minaret, a dome and two roofs behind, a lamp post at the end
  (it dims once everyone has tapped), a cat on a low wall at the start (its tail sways). On top: «🌙 الحارة بتنام…»,
  the clock (`#tv-mafia-clock`, painted by `mafiaTickClock` as before) and «✓ 3/6 · النور بيطفي واحدة واحدة». Every
  tap tonight puts out one house's windows and its door lamp; which house is a shuffle seeded by the room, the deal
  and the night (`mafiaStreetOrder`, `mafiaStreetRng`), so it is never the house of whoever tapped. Only a new tap
  fades with motion (`mafiaStreetSeen`: a reload or a TV that comes on mid-night draws the dark windows as they
  are); the fade is a CSS animation of opacity (`mafiaLightOff`), its end state the element's own opacity. The
  morning (`mafiaStreetDayHtml`, phase `day`): the same street by day, the houses of last night (everyone still in
  plus whoever the night took, in the roster's order), the door of whoever left swung open with a red mat (once,
  `motionFirst` on the deal, night and day), and the news as a white line on top - «صباح الخير يا حارة» (only when
  someone left), the news text (`mafiaNewsText`) and the role a beat later. Under it the discussion pill with the
  clock; the people strip and the host's buttons over the road. The voting, the day's result and the end are as
  they were. Words: `mafia_street_sleeps`, `mafia_street_lights`, `mafia_street_morning`. The scene's colours are
  fixed (a painted night and a painted morning, the same in both themes), its words on plates of their own; its
  CSS is `MAFIA_CSS`, put in once by `mafiaStyleOn` (the way الليزر ships its own), with its reduced-motion line.
  Chosen where the sheet didn't say: the houses shrink to fit (up to 200 wide, centred when there are few), the
  role line appears 1.3 s after the news.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
- 6 Oct 2026 (the audit): someone who leaves during the day vote is taken off the ballot, and whoever voted for them votes again (the result used to say the table sent nobody out).
