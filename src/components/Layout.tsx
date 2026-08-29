import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import agAimsMark from "../assets/agaims-mark.png";
import { UpdateBanner } from "./UpdateBanner";

const NAV_ITEMS = [
  { to: "/", label: "Calculator" },
  { to: "/sources", label: "Data sources" },
];

/**
 * The AgAims mark, shared with the Fieldwork app so the two look like one
 * family of tools. The white is part of the artwork — the furrow between
 * the mounds and the outline around the leaves — so it sits on its own
 * light chip rather than on the header, which would eat it in dark mode.
 */
function AgAimsMark() {
  return (
    <img
      src={agAimsMark}
      alt="AgAims"
      width={36}
      height={36}
      className="size-9 shrink-0 rounded-md bg-white"
    />
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-paper-dark dark:text-ink-dark">
      <UpdateBanner />
      <header className="border-b-2 border-accent/60 bg-surface dark:border-accent/40 dark:bg-surface-dark">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 text-primary dark:text-primary-soft"
          >
            <AgAimsMark />
            <span className="font-display text-lg font-extrabold">Spudonomics</span>
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
