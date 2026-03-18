# GEMINI.md - Ashry Gaming (عشرى جيمينج) 🎮

## Project Overview
**Ashry Gaming** is a versatile Google Apps Script (GAS) web application designed for group entertainment. It serves as a central hub for various social games and utility tools, featuring a modern, responsive UI with multilingual support (Arabic and English) and dark mode.

### Main Technologies
- **Backend:** Google Apps Script (V8 Runtime)
- **Database:** Google Sheets (for players, word categories, and statistics)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **UI Framework:** Tailwind CSS (via CDN)
- **Deployment & Management:** `clasp` (Command Line Apps Script Projects)
- **External Libraries:** `canvas-confetti`, `Chart.js`

### Architecture
- **Server-side (`Code.js`):** Handles `doGet` for serving the web app, manages Google Sheets interactions (CRUD for players, scores, and game data), and injects initial data into the template to reduce client-side loading times.
- **Frontend Entry Point (`Controller.html`):** The main HTML structure that includes styles, scripts, and various game views.
- **Modular JavaScript (`JS_*.html`):** Game logic is organized into separate HTML files acting as JS modules (e.g., `JS_Core.html`, `JS_Monkey.html`, `JS_Utils.html`), included into the main template.
- **Styling (`Style.html`):** Contains custom CSS and Tailwind overrides.

## Key Features & Games
- **Group Games:** 
  - 🕵️‍♂️ **Imposter (الجاسوس):** Social deduction game.
  - 🐵 **Monkey (ربع قرد):** Turn-based group game.
  - 🤫 **Just One (كلمة واحدة):** Cooperative word guessing.
  - 🃏 **Screw (سكرو):** Card game scoring.
  - 🎭 **Charades (بدون كلام), 🗣️ Describe It (أوصف لي), ❓ Who Am I? (من أنا؟)**
- **Puzzle/Logic Games:** Wordle, Guess the Number.
- **Utility Tools:** 
  - 🏆 Tournament Organizer, 👥 Team Generator, 🎡 Random Picker.
  - ♟️ Chess Clock, ⏱️ General Timers, 🎲 Dice & Coin.
  - 🀄 Domino Scorer, 🔢 Universal Counter.

## Building and Running

### Development Requirements
- Node.js and npm (for `clasp`)
- A Google account with access to Google Apps Script.

### Deployment Commands
- `clasp login`: Authenticate with your Google account.
- `clasp clone <scriptId>`: Clone the project.
- `clasp push`: Push local changes to the Apps Script project.
- `clasp open`: Open the project in the Apps Script online editor.
- `clasp deploy`: Create a new version/deployment for the web app.

### Testing
- Testing is primarily done manually by deploying as a web app or using the "Test deployments" feature in the GAS editor.
- Client-side logs are visible in the browser console; server-side logs are available in Stackdriver (Apps Script Dashboard).

## Development Conventions

### Code Structure
- **Server-Side (`Code.js`):** Keep logic related to Spreadsheet interactions here. Use `google.script.run` for client-server communication.
- **Frontend Modularization:** When adding a new game, create a new `JS_GameName.html` file and include it in `Controller.html` using `<?!= include('JS_GameName'); ?>`.
- **Translations:** All UI text should be managed via the `TRANSLATIONS` object (likely in `JS_Core.html`) to support both Arabic and English.

### UI/UX Standards
- **Responsive Design:** Use Tailwind CSS classes to ensure the app works well on mobile devices (the primary target).
- **Dark Mode:** Use `dark:` classes for all components to support the dark theme toggle.
- **RTL Support:** The app defaults to RTL (`dir="rtl"`) but handles LTR for English.

### Data Management
- **Sheets:** Ensure `setupSheets()` is updated if new sheets or columns are required for a game.
- **LocalStorage:** Use local storage for transient game state (like current round scores) that doesn't need to persist across devices.
