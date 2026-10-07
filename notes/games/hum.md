# 🎵 دندنها / Hum It (id `hum`)

## The owner's spec, as decided (1 Oct 2026)

- **Egyptian songs only**: the classics (أم كلثوم، عبد الحليم، عبد الوهاب، فريد
  الأطرش، شادية، وردة، نجاة…), the pop of the 90s to the 2010s (عمرو دياب، محمد
  منير، حكيم، أنغام، شيرين، تامر حسني، محمد حماقي، هشام عباس، مصطفى قمر، إيهاب
  توفيق…), the mahraganat and the newest. **Family-clean songs only.**
- **Two ways, a lobby switch.** «دندنة»: one player at a time (the hummer, in
  turn) gets a big ▶ on their phone to hear the song privately - with a line
  telling them to use earphones or hold the phone to their ear, not the
  speaker (a web page can't force the earpiece) - then hums it out loud;
  everyone else types the song's name. «سمّع»: no hummer; every phone plays the
  same clip privately at the same moment (started by the server's clock, each
  phone taps ▶ once to unlock sound on an iPhone) and everyone races to name it.
- **The audio is Apple's official 30-second iTunes preview.** The song list is
  its own file, every song pinned to an iTunes trackId checked to be the
  original artist's recording with a preview; `npm run check:songs` looks every
  one up; the content check covers the list offline. **A song whose preview
  fails to load in a round is skipped by itself** (the round is dealt again,
  nobody loses anything).
- **Hidden information**: a guesser can't learn the song before the reveal. In
  «دندنة» only the hummer's slice has it; in «سمّع» the sound goes out through
  the rooms server as an opaque per-song address. The leak check probes the
  title, the names it goes by, the singer, the trackId and the preview URL on
  the guessers' phones and the TV.
- **The answer**: typed first, judged against the title and its alternatives
  (the singer's name alone isn't enough); if nobody has it after 15 s, four
  choices come down (the right one and three others, of the same era when
  possible) worth 1; a player who already typed wrong can still pick.
- **Points**: the fastest three correct typed answers 3 / 2 / 1; a correct
  choice 1; in «دندنة» the hummer 2 when at least one person names it in time;
  the hummer can't answer their own song.
- **Length**: the host picks 5 / 10 / 15 songs. In «سمّع» the host picks how the
  clip is heard: «أول ١٠ ثواني مرة واحدة» / «الـ٣٠ ثانية كلها وتعيد براحتك» /
  «بتطول: ٢ث ثم ٥ث ثم ١٠ث» (the clip grows; answering on a shorter clip is
  worth more).
- **A second source, Deezer, beside Apple** (the owner, 1 Oct 2026, after the
  first build): each song pinned to ONE source, `{ src: 'itunes', id }` or
  `{ src: 'deezer', id }`, whichever has the singer's original with a preview
  (Apple stays where it already worked); the songs Apple was missing brought
  back from Deezer, and the newest grown to 30+ from it, family-clean only.
  Deezer's preview addresses are signed and expire, so they are never stored:
  the rooms server looks a song up when it plays it. Apple's lookup answers 403
  to Cloudflare's servers (found on the live server the day it shipped), so an
  Apple pin keeps its preview's address (`u`) and the server plays that
  directly; `npm run check:songs` reports an address Apple has changed and
  `-- --fix` writes the current ones in. The round counter reads
  «الأغنية 3 من 10».
- The server ends a round on its clock; the host can skip a song (a broken
  preview, a song nobody knows). The podium at the end, and the night's points
  (5/3/2/1).
- **The look: ج «الفرح: المسرح والجمهور»** (the design sheet
  https://claude.ai/artifact/8VnrqM9iP2rPjgY9cuLgSP): the others in the crowd
  raising ✓ signs, fifteen stage bulbs going out as the clock, the fastest
  three taking front-row seats, you type on a sign in your hand, the choices as
  four signs, the hummer gets the big mic as ▶ and the DJ's sealed envelope with
  the song; the TV is one stage with curtains and the crowd, the answer a
  banner unrolling, a 1-2-3 podium.

## Decided while building (open to change, each in one place)

- **The clocks** (`RoomHum.js`): the hummer has up to **30 s** with the song
  (`HUM_LISTEN_MS`, the whole preview; «⏹ خلاص، هدندن» ends it sooner), then
  **15 s** of typing (`HUM_TYPE_MS`; the hum and the bulbs), then **10 s** of
  choices (`HUM_CHOICE_MS`): at most 55 s a song in «دندنة». In «سمّع» a
  **4-second** countdown while every phone loads the clip (`HUM_COUNT_MS`), then
  15 s of typing (22 s in «بتطول», `HUM_GROW_TYPE_MS`, so the three clips fit),
  then the 10 s of choices. The ▶ round before the first song waits **30 s**
  at most (`HUM_ARM_MS`), or the host's «يلا نبدأ». A typing window ends early
  once every guesser has it, the choices once everyone has answered. A server
  grace of 0.6 s for an answer sent as the clock hit zero.
- **«بتطول»**: the 2-second clip at the start, the 5-second at 4 s, the
  10-second at 11 s (`HUM_GROW`), each from the clip's start; **a right typed
  answer during the 2-second clip is +2 more, during the 5-second +1**, on top of
  3/2/1.
- **«أول ١٠ ثواني مرة واحدة»** plays the first 10 s once, on the clock, no
  replay; **«الـ٣٠ ثانية كلها»** plays the whole clip on the clock and a
  «🔁 اسمعها تاني» button replays it on that phone.
- **A right typed answer after the first three scores 1** (`HUM_LATE_PTS`): it
  would otherwise score less than a choice. Typing closes when the choices come
  down; a phone that typed it right doesn't pick.
- **The hummer's 2 counts typed answers only** (a choice is not a hum heard).
- **Tries**: unlimited retyping, 40 a song a phone at most (`HUM_TRIES`); a
  near miss (guessVerdict's 'close') says «🔥 قريب! كمّل» on that phone only.
- **The English title is an answer too** (a Latin keyboard): `en` is judged like
  the title, shown under it in English, and checked unique like the names.
- **A song that won't load**: the hummer's phone («دندنة») or any player's
  («سمّع») says so (`broken`), up to **3 times a round** (`HUM_REDEALS`), before
  anyone has it; the round deals another song, same hummer. Eight spare songs
  are dealt with the game (`HUM_SPARE`). In «سمّع» one phone is enough only
  during the count-in; once the clip plays, it takes **two phones**
  (`HUM_BROKEN_PHONES`, kept in `room._hum.broken`) - one phone's bad network
  used to re-deal the song for everyone (the review of 1 Oct 2026); that phone
  is told «الأغنية مش راضية تشتغل على موبايلك» (`dnd_broken_mine`) and guesses
  from the sound around it.
- **The host's skip** (`skipSong`) shows the song now and scores what was right
  so far; the round is over.
- **The song is heard by everyone at the reveal** (its token goes public): a
  «▶ اسمعها» on every phone.
- **The TV plays no song** (the phones are the speakers); it is the room's one
  voice for the small sounds (a sign going up, the last three bulbs, the bulbs
  going out, the banner, the win), else the host's phone.
- **2-12 players**, no computer players, the party section, pink, a drawn icon
  (`art:hum`: the stage's mic under its light, a note, a sign with a tick).
- «التالي لوحده» works here (`AUTONEXT_GAMES.hum`, 10 s after the reveal).
- Leaving: fewer than two ends the game; a hummer gone while listening hands
  the round to the next hummer with a new song; a hummer gone after «خلاص»
  (typing) sends whoever hasn't got it straight to the four choices, and a
  hummer who has left scores nothing at the reveal (the review of 1 Oct 2026);
  every "has everyone answered?" runs again. A latecomer watches and plays the next game.

## How it is built

Game id `hum` everywhere (`room-hum`, `ROOM_GAMES.hum`, `TV_GAMES.hum`, the
catalog, the help); the rules are named `hum` / `HUM_`, the page's code
`dnd` / `DND_`, the stylesheet section 64 (`.dnd-*`).

- **`Songs.js`** (server-only, `rooms-worker/build.mjs` FILES; the page never
  needs it): `HUM_SONGS`, 237 songs - 116 classic, 87 pop, 34 new; 209 pinned
  to Apple, 28 to Deezer, and 100 of the Apple ones with a second pin (`also`)
  to the same recording on Deezer - each `{ src, id, also?, t, alt, s, era, en,
  se }`. Every pin was looked up and is the singer's own recording with a
  preview; belly-dance, instrumental, karaoke, remix and cover albums were left
  out (several Farid and Umm Kulthum ids were swapped for vocal ones). From
  Deezer: الأطلال، ألف ليلة وليلة، أمل حياتي، دارت الأيام، حب إيه، فات الميعاد،
  بعيد عنك، انساك، فكروني (أم كلثوم), الجندول (عبد الوهاب), حدوتة مصرية، علي
  صوتك، شجر الليمون (منير), and the newest: البخت، باظت (ويجز), اختياراتي، اليوم
  الحلو ده، سيد الناس، مكسرات (أحمد سعد), خطفوني، قدام مرايتها، معدي الناس
  (عمرو دياب), يمكن خير (رامي صبري), آه لو لعبت يا زهر (أحمد شيبة), داري يا قلبي
  (حمزة نمرة), أيام، قولوا له سماح (تامر عاشور), الوتر الحساس (شيرين); from Apple
  also بقالك قلب (أنغام), عمري ابتدا (تامر حسني), بتمنى أنساك (شيرين), عودوني،
  واحدة واحدة، حاجة مش طبيعية. The era is the release year: 2016 and later is
  'new' (five Apple songs moved there: تيجي نسيب، ليلة العمر، عيش بشوقك،
  ناسيني ليه، باين حبيت). The Deezer second pins were found by the singer's own
  Deezer page having the same title (folded), never a remix. Left out on
  purpose: «بنت الجيران» (its drug line), «مفيش صاحب يتصاحب» (more than one
  singer claims it), live-only or unclear recordings. `tools/validate-content.js`
  checks the fields, a pin's source and id, a second pin on the other source,
  the eras (4 at least each), no pin twice, no name (title, alternative, English
  title) naming two songs; `npm run check:songs` (`tools/check-songs.mjs`) asks
  both sources about every pin, `--play` fetches each preview's first bytes,
  `--artists` prints each source's artist beside ours - all 237 songs and all
  337 pins playable on 1 Oct 2026.
- **`RoomHum.js`** (bundled after `RoomBox.js`): `shared` holds `roster`,
  `mode`, `replay`, `rounds`, `round`, `deal` (every song dealt, redeals
  included: the stale-tap key), `order` / `turn` / `hummerId`, `phase` ('arm' →
  'listen' | 'count' → 'type' → 'choices' → 'reveal' → … → 'gameover'),
  `armed`, `listenEndsAt`, `playAt`, `typeStartAt`, `typeEndsAt`,
  `choiceEndsAt`, `token` («سمّع» from the countdown; everyone at the reveal),
  `right` (`{ id, rank, pts, bonus, stage, ms }`), `picked` (who, not what),
  `choices` (`{ t, s, en, se }` ×4), and at the reveal `song`, `correct`,
  `picks`, `gained`, `skipped`; `scores`, `board`, `history`. `room._hum = {
  deck, at, cur, token, correct, picks, tries }`, never projected; the hummer's
  slice `{ deal, song: { t, s, en, se }, token }`, a guesser's `{ deal, miss: { n,
  close } | hit | pick }`. Moves: `start` / `playAgain` (the host: `{ mode,
  replay, count, autoNext }`), `arm`, `go`, `heard`, `guess { deal, text }`,
  `pick { deal, i }`, `broken { deal }`, `skipSong { deal }`, `nextRound { round
  }`. `humDeadline` / `humTimeout`, `humPlayerLeft`.
- **The sound** (`rooms-worker/src/index.js` `songResponse`, `Room.songOf`,
  `rooms-worker/src/songs.js`): `GET /song/CODE/TOKEN` - the room says which song
  the token stands for (only the song on now, only its token: its pin and second
  pin), and `songStream` looks the pin up at play time (Apple's lookup, or
  Deezer's `/track/<id>` → `.preview`, a signed address that expires within
  hours, which is why only ids are stored) and streams the preview back -
  `audio/mp4` from Apple, `audio/mpeg` from Deezer, CORS open - trying the
  second pin when the first fails. Apple's lookup and clip are cached at
  Cloudflare's edge (a day, a week), Deezer's for minutes. Deezer's API sends no
  CORS headers, which doesn't matter: the Worker asks it, never a phone. Nothing
  in the address or the answer names the song or its source.
- **`JS_RoomHum.html`** (look ج): the hall (`dndPhoneFrame`): the top line, the
  crowd (`dndCrowdHtml`: a face and a name each, a sign that rises - ✓ and the
  place, ✋ for a pick, the points at the reveal; 🎧 in the ▶ round), the bulbs
  (`dndBulbsHtml`), the stage between its curtains (`dndStageHtml`: the singer
  and his notes; the hummer's envelope - press and hold - and mic; «سمّع»'s
  speaker, its wave, «بتطول»'s three clips, «🔁 اسمعها تاني»; the banner), the
  front row (`dndFrontHtml`), the bottom (`dndBottomHtml`: the sign to write on,
  the four signs, a line). The crowd's signs, the slots, the bulbs, the clocks
  are painted in place every 120 ms (`dndPaint`), so another phone's answer
  never rebuilds the sign being written (and `renderRoomFrame`'s keep holds the
  text across a rebuild). The audio: one `<audio>` for the page (`dndAudio`), the
  clip fetched once into a blob (`dndLoad`), unlocked by a tap (`dndUnlock`: the
  mic, «سمّع»'s ▶, «▶ دوس عشان تسمع» after a reload); «سمّع» plays on the
  server's clock (`dndClockSound`, `dndWindows`: a late phone starts mid-clip).
  The TV (`TV_GAMES.hum`): the stage drawn in CSS (curtains, a scalloped
  valance, the floor, a light), the bulbs, the clock, the singer or the speaker,
  the marquee, the four signs, the banner and the round's podium, the crowd
  along the bottom; the final podium and board.
- **Motion**: the signs rise and the heads hop, the slots drop in, the bulbs
  fade out, the stamp («إنت الأول! +3») across the hall, the banner unrolls,
  the round's podium rises, the final podium and confetti; transform and opacity
  only, nothing replayed after a reload (`dndFirstSight`, `dndOnce`,
  `motionFirst`).
- Tests: `rules.mjs` ("Hum it": the list, both ways, the points, the bonus, the
  stale taps, a redeal, the skip, leaving), `leaks.mjs` (`PROBES.hum`: the title,
  a name it goes by, the singer, the English title, the song's ids (both pins),
  the words apple.com, itunes, deezer and dzcdn, the token in «دندنة», the right choice and the picks, each phone's own
  slice - each leak put back in a scratch build was caught; `DRIVERS.hum`: both
  ways to the board), `play-all.mjs` (`--only=hum`: four phones and a TV, the
  `/song` stream itself, each source through `songStream` (and a song whose first
  pin is gone playing from its second), the choices on the server's clock, a redeal, a skip,
  «سمّع» with every ▶).

## The ideas of 7 Oct 2026 (the owner's picks): built

- **759 «الظرف التلاتة»** (no extra rule asked). In «دندنة» the hummer is first handed three sealed
  envelopes (three songs, the titles only in their slice) and picks the one they know; the other two
  go back to the deck. `humDeal` draws three (`humDraw`, never one already in hand) into
  `room._hum.offer`, with no song and no token yet; `shared.envelope` is true and `shared.envEndsAt`
  is the clock (`HUM_ENVELOPE_MS`, 20 s - chosen; then the first envelope is taken by `humTimeout`).
  The hummer's slice is `{ deal, envelopes: [{ t, s, en, se }×3] }`. The move `envelope { deal, i }`
  (the hummer only, stale deals dropped) → `humTakeEnvelope`: `h.cur` and a fresh token, the slice
  `{ song, token }` as before, `listenEndsAt` from now, the other two pushed back on the end of the
  deck. `heard` and `broken` wait for the pick; `skipSong` before it shows the first envelope; a
  hummer leaving (or a redeal) puts unopened envelopes back. The deck deals `rounds × 3 + 8`.
  The page: the stage «٣ ظروف: اختار الأغنية اللي تعرفها» with ✉️✉️✉️, the three as signs in the
  hummer's hand (`.dnd-envs`, one column; `dndEnvelope(i)`), «{h} بيختار ظرف من التلاتة ✉️» for
  everyone else and the TV (its signature carries `envelope`), the bulbs' clock counts the 20 s.
  Tests: `rules.mjs` (three different, sealed, nothing before a pick, only the hummer, the two back
  in the deck, the clock takes the first, a skip before a pick), `leaks.mjs` (each envelope's title
  on the hummer's phone alone; the driver picks), `play-all.mjs` (`hum`).

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **761 «قايمة أغاني السهرة»** (no extra rule asked). At the end every song the game played, in order, with
  its singer, each with a ▶ that plays its clip again on that phone, and «📸 ابعت القايمة»: a share card (the
  titles left, the singers right, the winner at the foot; up to 10) and the titles as text for the family group.
  - Server (`RoomHum.js`): `humReveal` keeps `room._hum.played` (`{ i, token }`, the token the reveal already
    sent everyone; at most `HUM_PLAYLIST_MAX` 20); `humGameOver` publishes `shared.playlist` [`{ t, s, en, se,
    token }`] (`humPlaylistOf`) - only revealed songs, no pin. `humSongIndexOf(room, token)` is what `/song`
    asks now (`Room.songOf` in `rooms-worker/src/room.js`, exported through `rooms-worker/build.mjs`): the song on
    now, or at the game's end one of its played songs; a token from an earlier round answers nothing while the
    game is on, and play again drops them.
  - Page (`JS_RoomHum.html`): `dndPlaylistHtml` on the phone's end screen (none on the TV: it plays no songs),
    `dndPlaylistTap(i)` → `dndPlayToken(token)` (the old `dndPlayTap`'s body, now shared), the playing row shows ■
    (`dndPlayingClass`, `dnd.plAt`), `dndSharePlaylist` (`shareResultCard`, rows `{ name: title, value: singer }`).
    Words `dnd_pl_title`, `dnd_pl_share`, `dnd_pl_play`; styles `.dnd-pl*` (Style_Talk, beside `.dnd-over`); a
    line in the rules.
  - Chosen: the playlist is this game's songs (a game is the night's set; a second game makes a new list), the
    skipped ones included (they were shown); the share card is a separate button from the results card.
  - Tests: `rules.mjs` («hum playlist»: five songs in order with singers and tokens, each token answers its song
    at the end, an older token nothing during play, no pin on the table, play again drops them), `play-all.mjs`
    (`hum`: «سمّع» skipped through to the end, the playlist on every phone and the TV's state, a song streamed
    again by its token, a wrong one 404).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
