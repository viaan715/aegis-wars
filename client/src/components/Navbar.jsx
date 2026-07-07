import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/plan', label: 'Meal Plan', dot: '#F5A524' },
  { to: '/grocery', label: 'Grocery List', dot: '#84CC16' },
  { to: '/pantry', label: 'Pantry', dot: '#38BDF8' },
  { to: '/favorites', label: 'Favorites', dot: '#F472B6' },
  { to: '/profile', label: 'Profile', dot: '#A78BFA' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="bg-brand-700 text-white">
      <div className="rainbow-strip h-1.5 w-full" />
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-display text-lg font-semibold">🥗 Meal Planner</span>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 ${isActive ? 'font-semibold underline' : 'text-brand-100 hover:text-white'}`
              }
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: link.dot }} />
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="rounded bg-brand-800 px-3 py-1 hover:bg-brand-900"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
