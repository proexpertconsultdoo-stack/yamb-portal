import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',            label: 'Igra',    icon: '⚄' },
  { to: '/lobby',       label: 'Lobby',   icon: '🏠' },
  { to: '/tournaments', label: 'Turniri', icon: '🏆' },
  { to: '/leaderboard', label: 'Rang',    icon: '📊' },
  { to: '/profile',     label: 'Profil',  icon: '👤' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-gborder z-40 sm:hidden">
      <div className="flex">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-blue' : 'text-text3'
              }`
            }
          >
            <span className="text-xl mb-0.5">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
