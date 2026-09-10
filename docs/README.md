# The home-screen icon

## Why this folder exists

Adding the app to an iPhone home screen gave a blank or random icon, and only
sometimes an icon at all. That is not a missing tag — the tags were there, in
`Controller.html`. It is how Apps Script serves a web app.

Open `https://script.google.com/macros/s/…/exec` and you get **two** documents:

```
script.google.com/macros/s/…/exec        ← top-level, belongs to Google
└── iframe → …googleusercontent.com/…    ← your app
```

Safari's **Add to Home Screen** reads only the top-level document. Every
`<link rel="apple-touch-icon">`, the manifest and the splash tags live one
document further down, where Safari never looks. Finding nothing, iOS falls
back to **a screenshot of the page** — so you get the loading screen, or a
half-drawn view, or white. That is the "sometimes an icon, sometimes not".

(The same iframe is why the app has to have `?room=` injected server-side: it
cannot read its own query string either.)

Apps Script offers no way to put a `<link>` on its wrapper page. `addMetaTag()`
accepts a handful of `<meta>` names and nothing else, and `setFaviconUrl()` only
sets the browser-tab favicon, which iOS does not use for the home screen.

So the icon has to come from a page you own. **This is that page.** It carries
the icons and the manifest, and shows the app in a full-window iframe, so the
top-level origin stays yours — which keeps the icon, the app name, and
standalone (no Safari toolbars) all working.

## Setting it up — about five minutes, once

**1. Put your deployment URL in `index.html`.**

Near the bottom:

```js
var APP_URL = 'https://script.google.com/macros/s/PUT_YOUR_DEPLOYMENT_ID_HERE/exec';
```

Use the `/exec` URL of the deployment you actually share. `clasp deployments`
lists them; it is the same one you pass to `clasp deploy -i …`.

**2. Publish this folder.** Any static host works. With GitHub Pages, if this
repo is on GitHub:

- Settings → Pages
- Source: *Deploy from a branch*, Branch: `master`, Folder: **`/docs`**
- Save. A minute later it is live at
  `https://<your-username>.github.io/<repo>/`

**3. Push the Apps Script side too**, because the app has to permit being
framed — `Code.js` now uses `XFrameOptionsMode.ALLOWALL` for exactly this:

```bash
clasp push
clasp deploy -i <your deployment id> -d "wrapper"
```

**4. Share the Pages link, not the `/exec` link.** On iPhone: open it in
**Safari** (Chrome on iOS cannot add to the home screen), Share → Add to Home
Screen. The gamepad icon and the name are already filled in.

## Where to host it — checked, not guessed

`*.netlify.app` is **blocked on this connection** (an ISP-level block; common in
Egypt). The Netlify dashboard loads fine, which makes it look like the deploy
failed when it hasn't — the site is up, the domain just cannot be reached, and
friends on the same ISP would hit the same wall. Netlify Drop is not an option
here.

Measured from this machine:

| host | result |
| --- | --- |
| `octocat.github.io` | 200 — GitHub Pages works |
| `firebase.web.app` | 404 — connects fine, Firebase Hosting works |
| `vercel.app` | 308 — works |
| `surge.sh` | 200 — works |
| `example.netlify.app` | timed out — **blocked** |
| `cloudflare pages.dev` | failed |

Firebase Hosting is the pick: reachable, free on the Spark plan, nothing has to
be made public (GitHub Pages on the free plan needs a public repo, which would
publish the spy words and the script id), and it shares a login with the
Firebase work being considered for the room layer.

**Creating the project from the CLI returns `403 PERMISSION_DENIED` on an
account that has never used Firebase** — the Google Cloud project gets created
and then `addFirebase` is refused, leaving an empty project behind. Make the
project once in console.firebase.google.com instead; that accepts the terms.
Then `firebase.json` + `.firebaserc` at the repo root (add both to
`.claspignore`, or clasp will push them to Apps Script) and
`firebase deploy --only hosting`.

## Things that will bite

- **It must be Safari on iOS.** Chrome, Firefox and in-app browsers on iPhone
  cannot install to the home screen at all.
- **Re-adding does not refresh the icon.** iOS caches it per URL. If you change
  the icon, delete the home-screen item, close Safari's tab, then add it again.
- **HTTPS is required.** GitHub Pages is HTTPS, so this is only a problem if you
  self-host.
- **The room QR still points at `/exec`** — the QR is generated server-side from
  Apps Script's own URL. Scanning it opens the app in a browser tab and joining
  works normally; it just is not the wrapper. The wrapper forwards `?room=` if
  you ever hand out a link like `https://…github.io/repo/?room=ABCD`.
- **Android** takes the icon from `manifest.webmanifest`, which is here too, so
  "Install app" from Chrome works from the same page.

## The icons

Generated, not downloaded — `npm run build:icons` in `tools/` redraws them. They
are drawn rather than fetched from a CDN because iOS fetches an apple-touch-icon
exactly once, when you tap Add to Home Screen; if that request is slow or
blocked you get a screenshot instead, with no way to retry short of removing and
re-adding the item.

| file | used by |
| --- | --- |
| `icon-180.png` | iOS home screen |
| `icon-192.png` | Chrome install prompt |
| `icon-512.png` | splash screens, app listing |
| `icon-maskable-512.png` | Android launchers that crop to a circle |
| `favicon-64.png` | browser tab |

`icon-180.png` is deliberately full-bleed with square corners: iOS rounds it
itself, and a pre-rounded source gets rounded twice.
