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

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
- 6 Oct 2026 (the audit): someone who leaves during the day vote is taken off the ballot, and whoever voted for them votes again (the result used to say the table sent nobody out).
