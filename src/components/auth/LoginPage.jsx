import { useState } from 'react';
import Button from '../shared/Button';
import { AlertIcon, CheckIcon } from '../shared/Icons';
import { signInWithEmail, signUpWithEmail } from '../../services/authService';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_CLASS =
  'h-10 w-full rounded-md border border-slate-600 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-500 transition-colors duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setError(null);
    setNotice(null);
  };

  const validate = () => {
    if (isSignup && !fullName.trim()) return 'Please enter your name.';
    if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    if (isSignup) {
      const { needsConfirmation, error: signUpError } = await signUpWithEmail(
        email, password, fullName.trim()
      );
      if (signUpError) setError(signUpError);
      else if (needsConfirmation) {
        setNotice('Check your email to confirm your account, then sign in.');
      }
      // With confirmation disabled the session arrives and AuthProvider routes on.
    } else {
      const { error: signInError } = await signInWithEmail(email, password);
      if (signInError) setError(signInError);
      // On success the auth listener swaps this page for the app.
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 bg-dot-pattern px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          <span className="gradient-text">LearnForge</span>
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          {isSignup ? 'Create your account' : 'Sign in to your account'}
        </p>

        <div className="mt-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {isSignup && (
              <Field label="Full name" htmlFor="fullName">
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSubmitting}
                  className={FIELD_CLASS}
                  placeholder="Ada Lovelace"
                />
              </Field>
            )}

            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className={FIELD_CLASS}
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <input
                id="password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className={FIELD_CLASS}
                placeholder={isSignup ? 'At least 6 characters' : ''}
              />
            </Field>

            {error && (
              <p className="flex items-start gap-1.5 text-sm text-rose-400" role="alert">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            {notice && (
              <p className="flex items-start gap-1.5 text-sm text-emerald-400" role="status">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? (isSignup ? 'Creating account…' : 'Signing in…')
                : (isSignup ? 'Create account' : 'Sign in')}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate-400">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="font-medium text-indigo-400 transition-colors duration-200 hover:text-indigo-300"
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
    </div>
  );
}
