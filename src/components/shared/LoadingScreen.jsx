import { useEffect, useState } from 'react';

/**
 * Path generation runs for minutes and returns JSON, so it cannot stream.
 * Narrating the stages instead makes the wait read as work in progress rather
 * than a hang. The final stage has no duration and holds until the call lands.
 */
const GENERATION_STAGES = [
  { message: 'Reading your profile', duration: 4000 },
  { message: 'Mapping your skill gaps', duration: 6000 },
  { message: 'Selecting courses from the catalog', duration: 8000 },
  { message: 'Ordering prerequisites', duration: 6000 },
  { message: 'Building your roadmap', duration: 5000 },
  { message: 'Almost ready', duration: null },
];

export default function LoadingScreen({ message }) {
  const [stage, setStage] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (message) return undefined;

    const { duration } = GENERATION_STAGES[stage];
    if (duration === null) return undefined;

    // Fade out just before swapping so the change reads as a transition.
    const fadeOut = setTimeout(() => setVisible(false), duration - 300);
    const advance = setTimeout(() => {
      setStage((s) => Math.min(s + 1, GENERATION_STAGES.length - 1));
      setVisible(true);
    }, duration);

    return () => {
      clearTimeout(fadeOut);
      clearTimeout(advance);
    };
  }, [stage, message]);

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

      <p
        className="mt-8 text-sm text-slate-300 transition-opacity duration-300 ease-out"
        style={{ opacity: message || visible ? 1 : 0 }}
      >
        {message || GENERATION_STAGES[stage].message}
      </p>
    </div>
  );
}
