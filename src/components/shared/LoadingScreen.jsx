import { useEffect, useState } from 'react';

const ROTATING_MESSAGES = [
  'Analysing your skill gaps',
  'Matching courses to your goals',
  'Ordering the sequence by prerequisite',
  'Writing the rationale for each course',
  'Setting milestone checkpoints',
];

export default function LoadingScreen({ message }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm space-y-3">
        <div className="h-2 w-24 rounded bg-indigo-500/60 animate-soft-pulse" />
        <div className="h-16 rounded-lg border border-slate-800 bg-slate-800/60 animate-soft-pulse" />
        <div className="h-16 rounded-lg border border-slate-800 bg-slate-800/60 animate-soft-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="h-16 rounded-lg border border-slate-800 bg-slate-800/60 animate-soft-pulse" style={{ animationDelay: '0.4s' }} />
      </div>

      <p className="mt-8 text-sm text-slate-300">
        {message || ROTATING_MESSAGES[index]}
      </p>
    </div>
  );
}
