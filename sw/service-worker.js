/* Spudonomics service worker.
 *
 * This app has no login and no account — someone bookmarks it, or opens a
 * region-specific link a rep shared with them, and comes back weeks later.
 * Without this file, that return visit is at the mercy of whatever the
 * browser's HTTP cache happens to still be holding, which is not a guarantee
 * and is exactly how someone ends up looking at figures from an older
 * revision without knowing it.
 *
 * Two rules shape everything below.
 *
 * 1. Never serve a stale app forever. A cached single-page app that cannot
 *    update itself is worse than no cache: a correction to a published
 *    figure never reaches the person still looking at the old build.
 *    Navigations go to the network first, and a new worker waits rather than
 *    activating under a running app.
 * 2. Never touch anything that is not ours. The Google Form the survey links
 *    redirect to, and anything else cross-origin, passes straight through
 *    untouched.
 *
 * PRECACHE and BUILD_ID are filled in at build time by the plugin in
 * vite.config.ts, so the list is always the real hashed output.
 */

const BUILD_ID = "__BUILD_ID__";
const PRECACHE = __PRECACHE__;

const CACHE = `spudonomics-${BUILD_ID}`;

/** The one key every navigation is stored under, whatever the URL asked for.
 *
 * The app is a hash router, so every screen — the calculator, the sources
 * page, every /survey/:region/:segment redirect — is the same document.
 * Keying on the request URL would store a copy per region link handed out,
 * filling the cache with duplicates of one file. */
const shellUrl = () => new URL("index.html", self.registration.scope).toString();

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll is atomic — one 404 and the whole install fails, which is the
      // behaviour we want. A half-precached shell is the thing that breaks
      // for the person who opened this from a link they were sent.
      await cache.addAll(PRECACHE.map((path) => new URL(path, self.registration.scope).toString()));
    })(),
  );
  // Take over as soon as the shell is cached, rather than waiting to be asked.
  //
  // Waiting would protect a page mid-way through an edit from having its
  // assets swapped underneath it — but it produces a worse failure than the
  // one it prevents. A release that stops the app rendering also stops the
  // only control that can activate its replacement, because the reload
  // button lives inside the app. The fix downloads, sits in `waiting`, and
  // stays there. The app is a single bundle with no code splitting, so a
  // page already running keeps the JavaScript it loaded and fetches nothing
  // more — nobody's in-progress calculator inputs are lost by this, since
  // those live in component state, not in anything the worker touches.
  void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith("spudonomics-") && name !== CACHE).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

/** The app asks for this when the person has agreed to reload. */
// Kept for a page running an older build that still asks, and harmless now
// that install does it anyway.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") void self.skipWaiting();
});

async function networkFirstShell(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    // Only a real 200 replaces the shell. A captive-portal login page or a
    // proxy error page returns 200 with the wrong body often enough to
    // matter, so check that what came back is actually our document.
    if (fresh.ok && fresh.headers.get("content-type")?.includes("text/html")) {
      await cache.put(shellUrl(), fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await cache.match(shellUrl());
    if (cached) return cached;
    throw new Error("offline and no cached shell");
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh.ok) await cache.put(request, fresh.clone());
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // The Google Form, fonts, everything else.
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstShell(request));
    return;
  }

  // Build output carries a content hash in the filename, so a given URL can
  // never mean two different things. Anything else same-origin gets the same
  // treatment on purpose: the only files here are ours.
  event.respondWith(
    cacheFirst(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw new Error("offline and not cached");
    }),
  );
});
