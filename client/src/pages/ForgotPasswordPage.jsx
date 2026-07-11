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
    <div className="mx-auto max-w-sm overflow-hidden rounded-lg bg-white shadow">
      <div className="rainbow-strip h-1.5 w-full" />
      <div className="p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-800">Reset your password</h1>
        {status ? (
          <p className="text-center text-sm text-gray-600">{status}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send reset link'}
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
