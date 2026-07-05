import { Link } from 'react-router-dom';
import { useRandomTextColors } from '../lib/randomTextColors.js';
import './AuthPages.css';

export default function NotFound() {
  const rootRef = useRandomTextColors();

  return (
    <div className="auth-page" ref={rootRef}>
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        <h1 className="display-heading" style={{ fontSize: 40 }}>
          404
        </h1>
        <p className="muted">This page doesn't exist. It may have been unpublished or the link is wrong.</p>
        <Link to="/" className="btn btn-primary">
          Back to FormForge
        </Link>
      </div>
    </div>
  );
}
