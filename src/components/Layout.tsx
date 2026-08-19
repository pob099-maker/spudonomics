import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const NAV_ITEMS = [
  { to: "/", label: "Calculator" },
  { to: "/sources", label: "Data sources" },
];

/** Stylised overlapping potatoes, echoing the PotatoLink logo mark. */
function PotatoMark() {
  return (
    <svg
      viewBox="0 0 48 32"
      aria-hidden="true"
      className="h-8 w-12 shrink-0 text-primary dark:text-primary-soft"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.6">
        <ellipse cx="17" cy="16" rx="12" ry="9.5" transform="rotate(-18 17 16)" />
        <ellipse cx="31" cy="16" rx="12" ry="9.5" transform="rotate(14 31 16)" />
      </g>
      <g fill="currentColor">
        <circle cx="13" cy="13" r="1.1" />
        <circle cx="18" cy="19" r="1.1" />
        <circle cx="29" cy="12" r="1.1" />
        <circle cx="34" cy="18" r="1.1" />
        <circle cx="24" cy="15" r="1.1" />
      </g>
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-paper-dark dark:text-ink-dark">
      <header className="border-b-2 border-accent/60 bg-surface dark:border-accent/40 dark:bg-surface-dark">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-primary dark:text-primary-soft"
          >
            <PotatoMark />
            <span className="leading-tight">
              <span className="block font-display text-lg font-extrabold">Spudonomics</span>
              <span className="hidden text-[0.6rem] font-medium uppercase tracking-[0.18em] text-ink/50 dark:text-ink-dark/50 sm:block">
                Australian Potato Industry Extension Project
              </span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="min-h-11 min-w-11 rounded-lg border border-ink/15 px-3 dark:border-ink-dark/15"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-4 pb-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `min-h-11 rounded-lg px-3 py-2 font-medium ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-ink/70 hover:bg-ink/5 dark:text-ink-dark/70 dark:hover:bg-ink-dark/10"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-4">{children}</main>
      <footer className="mx-auto max-w-4xl px-4 pb-8 pt-2 text-sm text-ink/50 dark:text-ink-dark/50">
        Built for PotatoLink and the Lifecycles project. Every figure traces to a published
        source, and every gap is shown as a gap.
      </footer>
    </div>
  );
}
