import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await api.forgotPassword(email);
      setStatus(data.message);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card-pop mx-auto max-w-sm">
      <div className="rainbow-strip h-1.5 w-full" />
      <div className="p-8">
        <p className="eyebrow mb-1 text-center">Account recovery</p>
        <h1 className="mb-6 text-center font-display text-2xl font-semibold text-ink">Reset your password</h1>
        {status ? (
          <p className="text-center text-sm text-ink/60">{status}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border-2 border-ink/15 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Sending...' : 'Send reset link'}
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
