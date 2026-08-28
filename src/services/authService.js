import { supabase } from './supabaseClient';

// ─── Error mapping ──────────────────────────────────────────

// Supabase surfaces terse messages; these read better to someone signing in.
const FRIENDLY_ERRORS = {
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'Email not confirmed': 'Please check your email and confirm your account first.',
  'User already registered': 'That email already has an account. Try signing in instead.',
  'Unsupported provider: provider is not enabled':
    'Google sign-in is not enabled for this project yet. Use email and password instead.',
};

// Supabase phrases the disabled-provider error a few different ways.
function isProviderDisabled(message) {
  return /provider is not enabled|Unsupported provider/i.test(message ?? '');
}

function friendly(error) {
  if (!error) return null;
  if (isProviderDisabled(error.message)) {
    return 'Google sign-in is not enabled for this project yet. Use email and password instead.';
  }
  return FRIENDLY_ERRORS[error.message] ?? error.message;
}

// ─── Session ────────────────────────────────────────────────

export async function signUpWithEmail(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { user: null, needsConfirmation: false, error: friendly(error) };

  // With email confirmation on, signUp returns a user but no session.
  return {
    user: data.user,
    needsConfirmation: !data.session,
    error: null,
  };
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: friendly(error) };
  return { user: data.user, error: null };
}

export async function signInWithGoogle() {
  // Redirects away from the page; the session is picked up on return.
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  return { error: friendly(error) };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error: friendly(error) };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
}

/** Returns the subscription so callers can unsubscribe on unmount. */
export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user ?? null);
  });
  return data.subscription;
}

/** Display name, falling back through metadata to the email local part. */
export function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'there'
  );
}
