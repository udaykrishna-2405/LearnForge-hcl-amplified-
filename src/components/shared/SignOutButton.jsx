import { useAuth } from '../../hooks/useAuth';

/**
 * Sign-out for the views that sit before the dashboard. Without it a signed-in
 * learner who has not finished onboarding has no way to leave their session.
 */
export default function SignOutButton({ className = '' }) {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className={`text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200 ${className}`}
    >
      Sign out
    </button>
  );
}
