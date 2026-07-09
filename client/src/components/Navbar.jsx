import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/plan', label: 'Meal Plan' },
  { to: '/grocery', label: 'Grocery List' },
  { to: '/pantry', label: 'Pantry' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="bg-brand-700 text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-semibold">🥗 Meal Planner</span>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'font-semibold underline' : 'text-brand-100 hover:text-white'
              }
            >
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
