import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card-pop mx-auto max-w-sm">
      <div className="rainbow-strip h-1.5 w-full" />
      <div className="p-8">
        <p className="eyebrow mb-1 text-center">Account recovery</p>
        <h1 className="mb-6 text-center font-display text-2xl font-semibold text-ink">Choose a new password</h1>

        {!token ? (
          <p className="text-center text-sm font-medium text-flame">This link is missing its reset token.</p>
        ) : done ? (
          <p className="text-center text-sm font-medium text-brand-700">Password updated — redirecting to log in...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border-2 border-ink/15 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink/50">At least 8 characters.</p>
            </div>
            {error && <p className="text-sm font-medium text-flame">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Saving...' : 'Update password'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink/60">
          <Link to="/login" className="font-medium text-brand-700 underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
