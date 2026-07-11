import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState('Verifying...');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('No verification token found in this link.');
      return;
    }
    api
      .verifyEmail(token)
      .then(() => {
        setOk(true);
        setStatus('Your email is verified!');
        if (user) refreshUser();
      })
      .catch((err) => setStatus(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-sm rounded-lg bg-white p-8 text-center shadow">
      <p className={ok ? 'text-brand-700' : 'text-gray-600'}>{status}</p>
      <Link to={user ? '/plan' : '/login'} className="mt-4 inline-block text-brand-700 underline">
        {user ? 'Back to your meal plan' : 'Log in'}
      </Link>
    </div>
  );
}
