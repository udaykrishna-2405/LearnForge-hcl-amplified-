import ProgressRing from '../shared/ProgressRing';
import UserMenu from './UserMenu';

export default function TopBar({ profile, progress, onHome }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          onClick={onHome}
          className="text-base font-semibold tracking-tight text-slate-100 transition-colors duration-200 hover:text-white"
        >
          LearnForge
        </button>

        {profile?.target_role && (
          <span className="hidden truncate rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400 md:block">
            {profile.target_role}
          </span>
        )}

        <div className="flex items-center gap-3">
          <ProgressRing percentage={progress.percentage} />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
