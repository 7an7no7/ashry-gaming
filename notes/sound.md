# The soundboard and sound on phones

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

### The soundboard

`JS_Sounds.html` makes twelve sounds with the Web Audio API (`FX`,
`playFx(name)`): applause, ta-da, right, wrong, ba-dum-tss, the sad
trombone, a sad violin, crickets, boo, an air horn, a siren, a whistle.
Nothing is downloaded (the old board pulled mp3s from a meme site), so
they play at once and offline. `openSoundboard()` is the sheet, opened from
الأدوات (a `GAME_CATALOG` tool whose `open` is the sheet, with its own
`GAME_RULES` and help entry) or from a 🔊
button in the header beside the gear (`#fx-fab`, shown through
`body.has-fx` which `setView` sets on `play-*` and `room-*` screens) keeps
it one tap away mid-game - it floated over the page once, where it covered
the drawing tools; and
`confetti` is wrapped so every celebration in the app brings the fanfare -
and, since the confetti is drawn by a script the stylesheet can't still, the
wrapper plays only the fanfare when `reducedMotion()` is true, and draws the
confetti above everything (z-index 100050), the full-screen tools included.
The applause is built the way a room claps rather than as random static: a
dozen people, each at their own pace, pitch and strength, every clap three or
four cracks inside 25ms with a short tail, over a soft wash, swelling in and
fading out through a compressor. `fxRenderTo` points the sounds at an
`OfflineAudioContext` to render one to a buffer and measure it, which is how
a sound can be checked on a machine that can't play it.

**Sound can be asleep.** iOS and Chrome keep the audio context suspended until
a touch, and iOS suspends it again ('interrupted') when the phone locks or a
call comes in. `wakeAudio` in `JS_Core.html` resumes it on any touch, key or
return to the page, and `playSound` tries too - but a sound that arrives from
the room with no touch (the bomb landing on this phone) can't wake it, so the
holder's screen says "tap to hear the ticking" while it is asleep.

**A tap doesn't always wake it on an iPhone** (the owner, 23 Sep 2026: "most of
the times when I join a room I don't hear the game, I must refresh"). Joining
usually comes from another app that had the sound (the camera that read the QR,
WhatsApp), and opening a room goes out to the share sheet; iOS then leaves the
context 'interrupted', or 'running' with its clock standing still, and resume()
inside a tap no longer brings it back - a refresh helped only because it made a
new context. So `wakeAudio` listens to pointerdown, touchend, click and keydown;
in a tap it also starts a one-sample silent buffer (what really opens iOS's
output), and 350ms later checks that the context is running *and its
`currentTime` moved*; if not (`audioStuck`), or if it is 'interrupted', the
next tap closes it and makes a new one inside the tap, where a new one always
starts. That is why `audioCtx` is a `let`: nothing may keep a context of its
own - every sound reads `audioCtx` or `fxCtx()` each time it plays (an
`AudioBuffer`, like the applause's noise, works in any context). The narrator's
speech warm-up (`speakPrime`) runs on a click or touchend for the same reason:
iOS doesn't count a pointerdown as a tap. An iPhone on its silent switch still
plays no web sound (Safari's `navigator.audioSession.type = 'playback'` could
change that, but it would also stop the phone's music - not done). The
bomb ticks with its own `playSound('bomb')`, a wooden tick-tock loud enough to
hear across a table, on the holder's phone and the TV only.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **1239 Settings → الصوت.** شغّال / الهزة بس / مقفول (`soundPref()`, `cycleSoundPref()`,
  `localStorage.ashrySound`, beside `haptic` in JS_Core.html). `playSound` and `playFx`
  play only on «شغّال»; `haptic` buzzes on «شغّال» and «الهزة بس». The owner's answer:
  effects only - a game whose sound is the game plays whatever the setting says:
  دندنها's clips and the chairs' music and zaffa have their own players, and the
  soundboard calls `playFx(id, true)`. The row's hint says so. Per device, so a TV
  keeps its own. Not covered: a game that builds its own sound on `fxCtx()` directly
  (bowling's rumble, bumper's engine, golf…) still plays; moving those behind the
  setting is a change in each game.
