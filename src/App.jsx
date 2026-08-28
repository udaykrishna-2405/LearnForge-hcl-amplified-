import AuthProvider from './components/auth/AuthProvider';
import AuthGuard from './components/auth/AuthGuard';
import Workspace from './components/Workspace';
import { configError } from './services/supabaseClient';

export default function App() {
  // Supabase backs sign-in, so missing credentials are a setup error rather
  // than a degraded mode. Rendering it beats a blank page from a thrown module.
  if (configError) return <ConfigError message={configError} />;

  return (
    <AuthProvider>
      <AuthGuard>
        <Workspace />
      </AuthGuard>
    </AuthProvider>
  );
}

function ConfigError({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6">
      <div className="max-w-md rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">
          Configuration needed
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>
        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Copy <code className="text-slate-300">.env.example</code> to{' '}
          <code className="text-slate-300">.env</code> and fill in the values from
          your Supabase project settings.
        </p>
      </div>
    </div>
  );
}
