import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import './AppNav.css';

export default function AppNav({ actions }) {
  const { user, logout } = useAuth();

  return (
    <header className="app-nav">
      <div className="container app-nav-inner">
        <Link to="/dashboard" className="app-nav-brand">
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#1b1e24" />
            <path d="M9 22L16 7l7 15h-4.2l-2.8-6.4L13.2 22H9z" fill="url(#navGrad)" />
            <defs>
              <linearGradient id="navGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#d9b36c" />
                <stop offset="0.5" stopColor="#c99a46" />
                <stop offset="1" stopColor="#4a6c8c" />
              </linearGradient>
            </defs>
          </svg>
          <span>FormForge</span>
        </Link>
        <div className="app-nav-actions">
          {actions}
          {user && (
            <>
              <span className="plan-pill" data-plan={user.plan}>
                {user.plan === 'pro' ? 'Pro' : 'Free'}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
