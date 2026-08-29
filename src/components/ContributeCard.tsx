// A shareable, anonymous route back into the dataset.
//
// The gaps this app shows are only ever fixed by someone sending real numbers
// back. Regional reps are the people best placed to ask for that face to
// face, so this card exists to give them one link they can hand a grower on
// the spot — copyable, no sign-in, and never asking for a name or email.

import { useState } from "react";
import { Card } from "./ui";

/**
 * PotatoLink Regional Cost & Yield Survey — anonymous by design. Google
 * Forms is set to DO_NOT_COLLECT for email addresses, the form itself is
 * open with no sign-in, and every cost question asks for a band rather than
 * an exact figure. Responses feed cost-profiles.json only after review and
 * a 3-response-per-region minimum — see docs/adding-a-region.md.
 */
export const SURVEY_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScvNn5H1mbvqCQHQ1a_kpQ7pu0VqZmbKArRItejOdWZ0phFTg/viewform";

export function ContributeCard() {
  const [copied, setCopied] = useState(false);

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(SURVEY_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be blocked by browser policy on some tablets —
      // the plain URL below still works when the button does not.
      setCopied(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5 dark:border-primary-soft/30 dark:bg-primary/10">
      <h2 className="font-display text-lg font-bold">Help fill these gaps</h2>
      <p className="mt-1 text-sm text-ink/70 dark:text-ink-dark/70">
        Every figure on this site is only as good as what has been published — and for most
        regions and segments, not much has. If you grow, advise on, or handle potatoes
        commercially, two minutes on the survey below helps close that gap. It asks for
        banded ranges rather than exact figures, never asks for a name or email address, and
        nothing you enter can be traced back to you.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={SURVEY_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 font-medium text-white dark:bg-primary-soft dark:text-ink-dark"
        >
          Open the anonymous survey
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="min-h-11 rounded-lg border border-ink/20 px-3 text-sm font-medium dark:border-ink-dark/20"
        >
          {copied ? "Link copied" : "Copy link to share"}
        </button>
      </div>
      <p className="mt-2 break-all text-xs text-ink/50 dark:text-ink-dark/50">{SURVEY_URL}</p>
    </Card>
  );
}
