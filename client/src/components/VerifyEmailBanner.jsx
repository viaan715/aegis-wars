import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';

export default function VerifyEmailBanner() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (!user || user.emailVerified || user.authProvider === 'google' || dismissed) return null;

  async function handleResend() {
    setStatus('Sending...');
    try {
      await api.resendVerification();
      setStatus('Verification email sent — check your inbox.');
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      Please verify your email address.{' '}
      <button onClick={handleResend} className="font-medium underline">
        Resend verification email
      </button>
      {status && <span className="ml-2">{status}</span>}
      <button onClick={() => setDismissed(true)} className="ml-3 text-amber-700 hover:text-amber-900" aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}
