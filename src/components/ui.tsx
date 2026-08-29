import type { ReactNode } from "react";
import type { DataQuality } from "../types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl border border-ink/10 bg-surface p-4 shadow-sm dark:border-ink-dark/10 dark:bg-surface-dark ${className}`}
    >
      {children}
    </section>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">{children}</h1>;
}

const QUALITY_LABELS: Record<DataQuality, string> = {
  regional: "Regional figures",
  state_proxy: "State-wide stand-in",
  none: "No published economics",
};

const QUALITY_STYLES: Record<DataQuality, string> = {
  regional: "bg-success/15 text-success",
  state_proxy: "bg-warning/15 text-warning",
  none: "bg-danger/15 text-danger",
};

/**
 * How closely a figure describes the district it sits under. This is the most
 * important thing on the screen after the number itself: a state-wide average
 * standing in for one district looks identical to a measured regional budget
 * unless something says otherwise.
 */
export function QualityPill({ quality }: { quality: DataQuality }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${QUALITY_STYLES[quality]}`}
    >
      {QUALITY_LABELS[quality]}
    </span>
  );
}

/**
 * A touch-friendly radio button group, styled as a row of pill buttons
 * rather than tiny native radio dots. Built for the Contribute survey,
 * where every question is single-choice and needs to be usable on a phone
 * in a paddock — the exact problem with the old free-text Google Form this
 * replaced.
 */
export function RadioGroup({
  legend,
  help,
  name,
  options,
  value,
  onChange,
  error,
}: {
  legend: string;
  help?: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      {help ? <p className="mt-0.5 text-xs text-ink/60 dark:text-ink-dark/60">{help}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `${name}-${option}`;
          const checked = value === option;
          return (
            <label
              key={option}
              htmlFor={id}
              className={`min-h-11 cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                checked
                  ? "border-primary bg-primary/10 font-medium text-primary dark:border-primary-soft dark:bg-primary/20 dark:text-primary-soft"
                  : "border-ink/20 dark:border-ink-dark/20"
              }`}
            >
              <input
                type="radio"
                id={id}
                name={name}
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </fieldset>
  );
}

export function Figure({
  label,
  value,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "bad" | "unknown";
  hint?: string;
}) {
  const toneClass =
    tone === "good"
      ? "text-success"
      : tone === "bad"
        ? "text-danger"
        : tone === "unknown"
          ? "text-ink/40 dark:text-ink-dark/40"
          : "text-ink dark:text-ink-dark";
  return (
    <div className="rounded-lg bg-paper p-3 dark:bg-paper-dark">
      <dt className="text-xs text-ink/60 dark:text-ink-dark/60">{label}</dt>
      <dd className={`font-display text-xl font-bold tabular-nums ${toneClass}`}>{value}</dd>
      {hint ? (
        <p className="mt-0.5 text-xs text-ink/50 dark:text-ink-dark/50">{hint}</p>
      ) : null}
    </div>
  );
}
