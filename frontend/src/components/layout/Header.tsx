import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface HeaderProps {
  actions?: ReactNode;
  authSlot?: ReactNode;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
  title?: string;
}

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/collections", label: "Collections" },
  { to: "/status", label: "API Status" },
];

export default function Header({
  actions,
  authSlot = null,
  onToggleSidebar,
  showSidebarToggle = false,
  title = "PromptLab",
}: HeaderProps) {
  return (
    <header className="panel mb-6 px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {showSidebarToggle ? (
            <button
              aria-label="Toggle collections sidebar"
              className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/12 bg-white text-ink transition hover:bg-ink/5 lg:hidden"
              type="button"
              onClick={onToggleSidebar}
            >
              Menu
            </button>
          ) : null}
          <span className="pill bg-ember/10 text-ember">Prompt workspace</span>
          <div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{title}</p>
          </div>
        </div>

        <nav className="hidden flex-wrap gap-2 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex min-w-28 items-center justify-end gap-3 text-right">
          {actions}
          {authSlot}
        </div>
      </div>

      <nav className="mt-4 flex flex-wrap gap-2 md:hidden" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-ink/5",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
