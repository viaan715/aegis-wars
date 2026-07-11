import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/plan');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle(credential) {
    setError('');
    try {
      await loginWithGoogle(credential);
      navigate('/plan');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card-pop mx-auto max-w-sm">
      <div className="rainbow-strip h-1.5 w-full" />
      <div className="p-8">
      <p className="mb-1 text-center text-3xl">🥗</p>
      <p className="eyebrow mb-1 text-center">Welcome back</p>
      <h1 className="mb-6 text-center font-display text-2xl font-semibold text-ink">Log in</h1>
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
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-ink/15 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm font-medium text-flame">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <div className="mt-4">
        <GoogleSignInButton onCredential={handleGoogle} />
      </div>

      <p className="mt-6 text-center text-sm text-ink/60">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-brand-700 underline">
          Sign up
        </Link>
      </p>
      </div>
    </div>
  );
}
