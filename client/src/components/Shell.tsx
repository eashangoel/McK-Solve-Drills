import { NavLink, Outlet } from 'react-router-dom';
import { GAME_META, GAMES } from '@solve/shared';
import { StreakPill } from './StreakPill.js';

export function Shell() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brandmark">
          <div className="glyph">S</div>
          <div className="wordmark">
            Solve<span>Trainer</span>
          </div>
        </div>

        <nav className="nav-group">
          <div className="nav-label">Practice</div>
          <NavLink to="/" end className={navClass}>
            <span className="dot" />
            Today
          </NavLink>
          {GAMES.map((g) => (
            <NavLink
              key={g}
              to={`/play/${g}`}
              className={navClass}
              data-accent={GAME_META[g].accent}
            >
              <span className="dot" style={{ color: 'var(--accent)' }} />
              {GAME_META[g].name}
            </NavLink>
          ))}
        </nav>

        <nav className="nav-group">
          <div className="nav-label">Review</div>
          <NavLink to="/progress" className={navClass}>
            <span className="dot" />
            Progress
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            <span className="dot" />
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-foot">
          <StreakPill />
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-item active' : 'nav-item';
}
