/**
 * Main Web App Entry Point
 */
const doGet = (e) => {
  // Removed setupSheets() from here. It will run only if data is missing during a call.
  
  // The static site (docs/) has no google.script.run of its own. It loads this
  // tiny page in a hidden iframe and relays its room calls through it; the page
  // makes them with google.script.run and posts the answers back (Bridge.html).
  if (e && e.parameter && e.parameter.bridge) {
    return HtmlService.createHtmlOutputFromFile('Bridge')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const iconUrl = "https://cdn-icons-png.flaticon.com/128/13/13973.png"; 

  const template = HtmlService.createTemplateFromFile('Controller');
  
  // PRE-FETCH DATA: This injects data directly into the page to avoid "Loading..." screens
  try {
    const initialData = getInitialData();
    template.initialSpyData = JSON.stringify(initialData.spyData);
  } catch (err) {
    template.initialSpyData = "{}";
    console.error("Data Injection failed", err);
  }

  // A join link looks like .../exec?room=ARNB. The page runs in a sandboxed
  // iframe and cannot read its own query string, so the code is injected here.
  const roomParam = (e && e.parameter && e.parameter.room)
    ? String(e.parameter.room).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    : '';
  template.initialRoom = JSON.stringify(roomParam);
  template.webAppUrl = JSON.stringify(getWebAppUrl());

  return template.evaluate()
      .setTitle('عشرى جيمينج 🎮')
      .setFaviconUrl(iconUrl)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
      // ALLOWALL so docs/index.html can show the app in a full-window iframe.
      // That wrapper is the only way to control the iOS home-screen icon: Apps
      // Script serves this page inside its own iframe, so "Add to Home Screen"
      // reads script.google.com's document and never sees the icon links here.
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);};

const include = (filename) => {
  // Always fetch the freshest code directly from the file!
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
};

/**
 * Everything the page needs before it starts, in one call. Only the spy words
 * now: player names live on each phone (PLAYER_LIBRARY_KEY in JS_Core.html).
 */
const getInitialData = () => ({ spyData: getSpyData() });

/**
 * The spy words. They used to be read from the "كلمات الجاسوس" sheet on every
 * page load; they are code now (SpyWords.js), shared by this page, the room
 * server and the static site, and checked by tools/validate-content.js. No
 * spreadsheet is read anywhere any more - the sheets can be deleted.
 */
const getSpyData = () => SPY_WORDS;
