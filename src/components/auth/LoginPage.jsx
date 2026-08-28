import { useState } from 'react';
import Button from '../shared/Button';
import { AlertIcon, CheckIcon } from '../shared/Icons';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../../services/authService';

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

  const handleGoogle = async () => {
    setError(null);
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) setError(oauthError);
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
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md bg-white text-sm font-medium text-slate-800 transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-400">or continue with</span>
            <span className="h-px flex-1 bg-slate-700" />
          </div>

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
