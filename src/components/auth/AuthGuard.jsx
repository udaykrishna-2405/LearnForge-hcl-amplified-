import { useAuth } from '../../hooks/useAuth';
import LoginPage from './LoginPage';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Shown for the second or two Supabase takes to restore a stored session.
  if (isLoading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-slate-900"
        role="status"
        aria-live="polite"
      >
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="gradient-text">LearnForge</span>
        </h1>
        <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-full bg-indigo-500 animate-soft-pulse" />
        </div>
        <p className="mt-4 text-sm text-slate-400">Loading your workspace…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return children;
}
