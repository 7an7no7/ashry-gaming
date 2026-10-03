# Phase 9 — The Mafia narrator

Written by Claude (the owner asked for the phases to be carried on here while agy was out of quota). One commit, `4b07247`.

## T9.1 — A voice that reads the night

The speech helper is in `JS_Sounds.html` (`speakLine`, `speakStop`, `speakPrime`, `speakVoiceFor`); the lines and the choice of who speaks are in `JS_RoomMafia.html`; the setting travels with the room through `RoomGames.js`.

### How it was checked

`speechSynthesis.speak` and `.cancel` were intercepted in the preview and every call recorded, so each criterion is a real observation rather than a reading of the code. The pane's browser has one voice and it is English, which is exactly the "no voice for this language" case the task asks about — so that path was exercised for free, in Arabic.

| Criterion | Verdict |
|---|---|
| With the option off (the default) `speechSynthesis` is never called | VERIFIED — zero calls recorded; `mafiaNarrator` returns false on `shared.narrate` before anything else runs |
| With it on and no Arabic voice present, nothing is spoken and nothing throws | VERIFIED — with the page in Arabic on a browser with only an English voice: `mafiaNarrate` returned false, zero `speak` calls, no throw |
| Only one device speaks in a room | VERIFIED — all five cases: the host with no screen speaks, an ordinary phone never does, the host goes quiet once there is a screen, the screen speaks, and nobody speaks with the setting off |
| Leaving the game or the room cancels any speech in progress | VERIFIED — `speakStop()` calls `cancel` (observed); it is registered on `onLeaveScreen` (JS_Sounds.html) and on `onRoomClocksReset` (JS_RoomMafia.html), which is what fires when the room moves to another game |
| The lines say nothing that identifies a role | VERIFIED — every line the narrator can produce, in both languages, across six phases and seven kinds of news, was generated and searched: none contains `mafia_was`, and the line builder cannot reach a role at all (`n.role`, `mafiaRoleName` and `mafia_was` do not appear in its code) |
| The setting is in both languages and survives a reload | VERIFIED — `mafia_narrate` and `mafia_narrate_hint` in both blocks (`npm run check` prints `i18n OK`); the switch is in the Mafia lobby, and `ashryMafiaOpts` keeps it on the host's phone like the other options |

Decided while building:

- **It is a room setting, not a device one.** `shared.narrate` travels from the host's `startPayload` through the server, so every device in the room agrees on whether the evening has a voice; which device actually speaks is then the phone's own business. Two rules tests pin the server side.
- **The big screen is the voice where there is one**, and the host's phone where there is none. That is the only arrangement in which exactly one device speaks without any coordination.
- **A face-down reveal is not read out from under itself.** The morning news lies face down for about a second (`spyRevealParts`) before it turns over. The narration goes through `afterReveal`, so the line lands with the card rather than spoiling it. On a redraw there is no reveal to wait for, and the once-per-phase guard means nothing is said anyway.
- **Silence beats the wrong voice.** `speakVoiceFor` looks for a voice whose language starts with `ar` (or `en`) and returns nothing otherwise; `speakLine` then says nothing. An Arabic line read aloud by an English voice would be worse than no narrator at all.

### A note on the ⛔, and what it does and does not cover

The task says the narrator must never read anything role-specific. It does not read a role: it never says "أحمد was the Mafia". It does read the room's public news, and two of those strings name a role **as an actor** rather than as a person — "المافيا خرّجت {name} من اللعبة" and "المافيا حاولوا بس الدكتور لحق". Both are printed on every screen in the room already, word for word, and neither says who anyone is. The test pins the real rule (no `mafia_was`, no role name for a named player) rather than banning the word, which would mean the narrator could not read the news at all.

### Tests

- `C:/Users/TPC/agy-tests/phase-9/T9.test.js` — passes. The option, who speaks (the real `mafiaNarrator` run against five room shapes), what is never said, the once-per-phase guard, the reveal wait, the cancel hooks, and the three browser-speech traps.
- `rooms-worker/test/rules.mjs` — 3 new checks. **all room rules pass**.
- `rooms-worker/test/play-all.mjs` — **1071 passed, 0 failed**.
- `cd tools && npm run check` — **no problems found**, **i18n OK**.

## Not verified — needs a live test

- **The thing the option exists for: how it sounds.** Nobody has heard it. The owner's decision was to ship it off by default until it has been heard on a real phone, and that is still where it stands. The voice, the pace (`rate: 0.95`) and the wording of the five lines are all guesses until then.
- **iOS.** `speakPrime` runs on the first tap anywhere in the app, which is the documented way to unlock speech on Safari, but it was not tried on an iPhone. If it is refused, the narrator simply never speaks on that device — silently, by design.
- **Which Arabic voice a phone picks.** `speakVoiceFor` takes the first voice whose language starts with `ar`, which on a phone with several may not be the best one. If the owner finds it reads badly, choosing by `voice.name` is a small change.
- **A TV with no Arabic voice at all** — likely on a streaming stick — will simply stay silent, which is the intended behaviour but means the narrator may do nothing on exactly the device it was written for.
