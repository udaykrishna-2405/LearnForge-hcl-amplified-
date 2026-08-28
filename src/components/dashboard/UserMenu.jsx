import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDisplayName } from '../../services/authService';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const name = getDisplayName(user);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90"
      >
        {name.charAt(0).toUpperCase()}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-11 w-56 rounded-lg border border-slate-700 bg-slate-800 p-3"
        >
          <p className="truncate text-sm font-medium text-slate-100">{name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>

          <div className="my-2 h-px bg-slate-700" />

          <button
            role="menuitem"
            onClick={signOut}
            className="w-full rounded px-2 py-1.5 text-left text-sm text-slate-300 transition-colors duration-200 hover:bg-slate-700/50 hover:text-slate-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
