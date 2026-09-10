/**
 * Tailwind build for Ashry Gaming.
 *
 * The app used to load the full tailwind 2.2.19 file from a CDN (2.9 MB). The
 * markup, though, is written against tailwind 3 — the slate/orange/teal
 * palettes, arbitrary values like h-[85vh], opacity shorthands like bg-black/20
 * and every dark: variant only exist in v3, so roughly a quarter of the classes
 * in the markup resolved to nothing at all. This builds just the classes the app
 * actually uses and `npm run build:css` inlines them into Tailwind.html.
 *
 * darkMode: 'class' matches how the app toggles the theme: body gets a `dark`
 * class, so every `dark:` variant compiles to `.dark <selector>`.
 */
module.exports = {
  darkMode: 'class',
  content: ['../Controller.html', '../JS_*.html'],

  /**
   * renderTeams() in JS_NewGames.html builds class names by interpolation
   * (`border-${color}-500`), which the content scanner cannot see. These are the
   * four colours it cycles through.
   */
  safelist: ['blue', 'red', 'green', 'orange'].flatMap((c) => [
    `border-${c}-500`,
    `bg-${c}-50`,
    `dark:bg-${c}-900/20`,
    `text-${c}-600`,
    `dark:text-${c}-400`,
  ]),

  theme: { extend: {} },
  plugins: [],
};
