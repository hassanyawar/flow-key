import { NavLink, Outlet } from 'react-router-dom';

const navLinkClassName = ({ isActive }: { isActive: boolean }): string =>
  [
    'rounded-sm px-1 py-0.5 transition-opacity',
    isActive ? 'text-text' : 'text-text-muted opacity-80 hover:opacity-100',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  ].join(' ');

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <NavLink
          to="/"
          className="rounded-sm text-sm font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Flowtype
        </NavLink>
        <nav aria-label="Main" className="flex gap-4 text-sm">
          <NavLink to="/stats" className={navLinkClassName}>
            Stats
          </NavLink>
          <NavLink to="/settings" className={navLinkClassName}>
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
