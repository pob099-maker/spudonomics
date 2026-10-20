import { useEffect, useState } from "react";
import { applyUpdate, onUpdateReady } from "../services/appUpdate";

/**
 * Tells whoever has the app open that a newer version has already loaded in
 * the background, and lets them switch to it on their own terms.
 *
 * This app has no account and no unsaved state that survives a reload except
 * whatever's typed into the calculator's own inputs, so there's no risk in
 * reloading — the banner exists purely so a correction to a published figure
 * (or a newly added region on the survey link) doesn't sit unseen behind a
 * cached bundle for whoever already has a tab open.
 */
export function UpdateBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onUpdateReady(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <div
      role="status"
      className="border-b border-accent/40 bg-accent/20 px-4 py-2.5 text-sm text-ink dark:border-accent/30 dark:bg-accent/10 dark:text-ink-dark"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
        <span>Spudonomics has updated. Reload when it suits — nothing on this screen will be lost.</span>
        <button
          type="button"
          onClick={applyUpdate}
          className="min-h-11 rounded-lg bg-primary px-4 font-medium text-white dark:bg-primary-soft dark:text-ink"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
