import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Icon from '../components/icons/Icon';

export default function Login() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmNotice, setConfirmNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate('/');
      } else {
        const { hasSession } = await signUp(email, password);
        if (hasSession) {
          // "Confirm email" is off for this project — signUp already
          // logged them in, nothing further to wait on.
          navigate('/');
        } else {
          setConfirmNotice(true);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-2xl text-stone-800 mb-6 text-center">Notes</h1>

        {confirmNotice ? (
          <p className="text-sm text-stone-600 bg-white border border-stone-200 rounded-xl p-4 text-center">
            Check <span className="font-medium">{email}</span> for a confirmation link, then sign in.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-3">
            <label className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2">
              <Icon name="email" size={16} className="text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full outline-none text-sm bg-transparent"
              />
            </label>
            <label className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2">
              <Icon name="lock" size={16} className="text-stone-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full outline-none text-sm bg-transparent"
              />
            </label>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm rounded-xl py-2"
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            <button
              type="button"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
              className="text-xs text-stone-500 hover:text-stone-700"
            >
              {mode === 'signin' ? "New here? Create an account" : 'Already have an account? Sign in'}
            </button>
          </form>
        )}

        <button type="button" onClick={() => navigate('/')} className="mt-4 text-xs text-stone-400 hover:text-stone-600 w-full text-center">
          Continue without an account
        </button>
      </div>
    </div>
  );
}
