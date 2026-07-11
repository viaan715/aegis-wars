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
    <div className="mx-auto max-w-sm overflow-hidden rounded-lg bg-white shadow">
      <div className="rainbow-strip h-1.5 w-full" />
      <div className="p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-800">Choose a new password</h1>

        {!token ? (
          <p className="text-center text-sm text-red-600">This link is missing its reset token.</p>
        ) : done ? (
          <p className="text-center text-sm text-brand-700">Password updated — redirecting to log in...</p>
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
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update password'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-brand-700 underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
