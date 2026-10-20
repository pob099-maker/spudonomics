// Registering the service worker, and getting out of its way when it updates.
//
// This app is a static, no-login site people bookmark or add a Contribute
// card link to and come back to weeks later — the exact circumstance where a
// stale cached bundle quietly keeps someone looking at last month's figures.
// This is the half that lives in the page: it registers the worker, and it
// handles the one genuinely awkward moment in the lifecycle, which is a new
// version arriving while somebody already has the app open.
//
// A new worker activates as soon as it has cached the shell, and the page is
// told rather than asked. The page itself keeps running the code it already
// loaded — a single bundle, nothing further fetched — so nobody mid-way
// through adjusting a calculator figure loses their place; the new version
// takes effect when they choose to reload.
//
// Ported from the Fieldwork app's identical mechanism (src/services/appUpdate.ts
// there), which learned the hard way that waiting for permission to activate
// is the wrong default: the control that activates the replacement lives
// inside the app, so a release that stopped the app rendering could never be
// superseded. The fix would download, sit in `waiting`, and stay there.

/** How the page hears that a newer version is installed and waiting. */
type UpdateListener = () => void;

let waitingWorker: ServiceWorker | null = null;
let listener: UpdateListener | null = null;

/** Called when a new version finishes installing behind the current one. */
export function onUpdateReady(callback: UpdateListener): void {
  listener = callback;
  if (waitingWorker) callback();
}

function announce(worker: ServiceWorker): void {
  waitingWorker = worker;
  listener?.();
}

/**
 * Test seam. The announcement normally comes from the registration, which
 * needs a real service worker container to exist at all — and the rule worth
 * pinning down is what a click does afterwards, which does not.
 */
export function __setWaitingForTest(worker: ServiceWorker | null): void {
  waitingWorker = worker;
}

/**
 * How long to let a worker that really is still waiting take over before
 * reloading anyway. Only reached when controllerchange never arrives.
 */
const HANDOVER_GRACE_MS = 1000;

/**
 * Reload into the version that is already active.
 *
 * The worker calls skipWaiting during install, so by the time anybody has
 * read the banner it has usually activated and controllerchange has already
 * fired. The handover is treated as something that may already have
 * happened: a worker still sitting in "installed" gets nudged and a moment
 * to take over; anything else reloads straight away. Either way a reload
 * happens, because reloading is never the wrong outcome here — only waiting
 * forever is.
 */
export function applyUpdate(): void {
  let reloading = false;
  const reload = (): void => {
    // Chrome can fire controllerchange more than once; reloading twice is a
    // visible flash.
    if (reloading) return;
    reloading = true;
    window.location.reload();
  };

  // "installed" is the only state that means a worker is genuinely still
  // waiting for permission. Activated, activating, or gone all mean the
  // handover is done or under way, and the page just needs to pick it up.
  if (waitingWorker?.state !== "installed") {
    reload();
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
  }
  waitingWorker.postMessage("SKIP_WAITING");
  window.setTimeout(reload, HANDOVER_GRACE_MS);
}

/**
 * Register the worker, unless we are in dev.
 *
 * Dev is excluded on purpose: Vite serves modules that a cache-first worker
 * would happily freeze, and the resulting "why is my edit not showing" is a
 * worse bug than the one this fixes.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL;
    void navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .then((registration) => {
        // Already waiting when the page opened — a previous visit installed it.
        if (registration.waiting && navigator.serviceWorker.controller) {
          announce(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            // A controller means this is a replacement rather than the very
            // first install. Announcing a first install would be asking
            // somebody to reload into the page they are already looking at.
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              announce(installing);
            }
          });
        });
      })
      .catch(() => {
        // A failed registration costs nothing but the update notice itself —
        // the page already loaded and works fine. Nothing worth interrupting
        // anybody about.
      });
  });
}
