# حسبة — Numbers

Made by `npm run new:game` on 2026-10-09: games/hesba/ holds its code, its words and its rules.
What is there now is the starting game every new game gets (a secret number each, tap «+1»
until you reach it, the nearest wins). Replace it with the real game once the owner has
answered its rules and picked its look from a sheet of three (GEMINI.md, *How we work*).

## The owner's spec

(The rules as the owner answered them, one question at a time.)

## How it is built

- Rooms: `RoomHesba.js` (the rules, ROOM_RULES.hesba), `JS_RoomHesba.html` (ROOM_GAMES.hesba and TV_GAMES.hesba)
- One phone: `JS_Hesba.html` (setupHesba, startHesba, VIEW_RESTORE for a reload)
- Its words and rules: `hesba.text.js`.
