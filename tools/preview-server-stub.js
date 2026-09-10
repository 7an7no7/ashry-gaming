/**
 * Browser-side stand-in for the Apps Script runtime, used only by .preview.
 *
 * Rather than faking the room API, this runs the REAL server files (Rooms.js,
 * RoomGames.js, CodenamesWords.js) against fake Apps Script services. So the
 * preview exercises the same rules the deployment will, and because the cache
 * is backed by localStorage — which is shared across tabs on one origin — two
 * browser tabs behave like two phones in the same room.
 *
 * This file is inlined into .preview/index.html by build-preview.mjs and never
 * reaches Apps Script.
 */
(function () {
  'use strict';

  const CACHE_PREFIX = 'previewCache_';

  /* --- Fake CacheService, persisted so tabs can see each other ------------ */
  const fakeCache = {
    get(key) {
      try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const rec = JSON.parse(raw);
        if (rec.expires && Date.now() > rec.expires) {
          localStorage.removeItem(CACHE_PREFIX + key);
          return null;
        }
        return rec.value;
      } catch (e) { return null; }
    },
    put(key, value, seconds) {
      try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
          value: value,
          expires: Date.now() + (seconds || 600) * 1000
        }));
      } catch (e) {}
    },
    remove(key) { try { localStorage.removeItem(CACHE_PREFIX + key); } catch (e) {} }
  };

  window.CacheService = { getScriptCache: () => fakeCache, getUserCache: () => fakeCache };

  // The browser is single-threaded per tab, so a lock is a no-op here. The real
  // contention this guards against only exists on the server.
  window.LockService = {
    getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {}, waitLock: () => {} })
  };

  window.ScriptApp = {
    getService: () => ({ getUrl: () => location.origin + location.pathname })
  };

  // Rooms.js reaches for the sheet-backed word list; use the injected sample.
  window.getSpyData = function () {
    return (window.SERVER_DATA && window.SERVER_DATA.spyData) || {};
  };

  /* --- Route google.script.run at the real server functions --------------- */
  const SERVER_FNS = [
    'createRoom', 'joinRoom', 'pollRoom', 'leaveRoom', 'roomAction',
    'getInitialData', 'getPlayerList', 'addGlobalPlayer'
  ];

  /**
   * The server files declare their functions with top-level `const`, which
   * creates a binding in the global *lexical* environment rather than a
   * property on window — so `window.createRoom` is undefined even though
   * `createRoom` resolves fine. Function() evaluates at global scope and can
   * see both.
   */
  function resolveServerFn(name) {
    if (typeof window[name] === 'function') return window[name];
    try {
      return new Function('return typeof ' + name + " === 'function' ? " + name + ' : null;')();
    } catch (e) {
      return null;
    }
  }

  function makeRunner() {
    let onSuccess = null;
    let onFailure = null;
    const runner = {
      withSuccessHandler(fn) { onSuccess = fn; return runner; },
      withFailureHandler(fn) { onFailure = fn; return runner; }
    };
    SERVER_FNS.forEach(name => {
      runner[name] = function (...args) {
        // A real round trip isn't instant; a small delay keeps the preview
        // honest about how the UI behaves while a call is in flight.
        setTimeout(() => {
          try {
            const impl = resolveServerFn(name);
            if (typeof impl !== 'function') throw new Error('no server function: ' + name);
            const out = impl.apply(null, args);
            if (onSuccess) onSuccess(out);
          } catch (err) {
            console.warn('[preview server]', name, err.message);
            if (onFailure) onFailure(err);
          }
        }, 120);
        return runner;
      };
    });
    return runner;
  }

  window.google = window.google || {};
  google.script = {
    get run() { return makeRunner(); },
    host: { close() {}, setHeight() {} }
  };

  // Client-side fallback for the one sheet-backed call that is left. Player
  // names are no longer server-side at all — they live in each phone's
  // localStorage, so there is nothing to fake for them.
  window.getInitialData = () => ({ spyData: window.getSpyData() });

  /** Wipes every preview room — handy between test runs. */
  window.resetPreviewRooms = function () {
    Object.keys(localStorage)
      .filter(k => k.indexOf(CACHE_PREFIX) === 0)
      .forEach(k => localStorage.removeItem(k));
    return 'preview rooms cleared';
  };
})();
