import { useEffect, useState } from 'react';
import Button from '../shared/Button';
import { getAllItems } from '../../utils/helpers';
import {
  formatLongDate,
  getExpectedCompletionDate,
  getPaceStatus,
} from '../../utils/studySession';

const DAY_MS = 86_400_000;

const TONE = {
  ahead: {
    strip: 'border-l-emerald-500 bg-emerald-500/5',
    text: 'text-emerald-400',
    fill: 'bg-emerald-500',
  },
  'on-track': {
    strip: 'border-l-indigo-500 bg-indigo-500/5',
    text: 'text-indigo-400',
    fill: 'bg-indigo-500',
  },
  behind: {
    strip: 'border-l-amber-500 bg-amber-500/5',
    text: 'text-amber-400',
    fill: 'bg-amber-500',
  },
};

export default function PaceTracker({ path, profile, completedItems, sessions, startedAt, onAdjustPlan }) {
  const [mounted, setMounted] = useState(false);
  // Pinned once so re-renders cannot shift the elapsed-time calculation.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const timelineMonths = profile?.timeline_months;
  if (!path || !timelineMonths) return null;

  const total = getAllItems(path).length;
  if (total === 0) return null;

  const daysElapsed = Math.max(0, (now - new Date(startedAt).getTime()) / DAY_MS);
  const timeProgress = Math.min(1, daysElapsed / (timelineMonths * 30));
  const courseProgress = completedItems.length / total;

  const status = getPaceStatus(path, completedItems, startedAt, timelineMonths);
  const tone = TONE[status];
  const completion = getExpectedCompletionDate(path, completedItems, sessions, profile?.weekly_hours);

  const message = {
    ahead: `Ahead of schedule. Projected completion: ${formatLongDate(completion)}`,
    'on-track': `On track for your ${formatLongDate(completion)} goal. Keep it up.`,
    behind: 'Slightly behind. Add 2-3 hours this week to stay on track.',
  }[status];

  return (
    <section className={`border-l-4 ${tone.strip} px-4 py-3`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm ${tone.text}`}>
          {sessions.length === 0
            ? 'Log your first study session to see pacing.'
            : message}
        </p>
        {status === 'behind' && (
          <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={onAdjustPlan}>
            Adjust plan
          </Button>
        )}
      </div>

      {/* Time elapsed sits behind course completion so the gap is the story. */}
      <div className="relative mt-2 h-0.5 w-full bg-slate-700">
        <div
          className="absolute inset-y-0 left-0 bg-slate-600 transition-all duration-500 ease-out"
          style={{ width: mounted ? `${timeProgress * 100}%` : '0%' }}
        />
        <div
          className={`absolute inset-y-0 left-0 ${tone.fill} transition-all duration-500 ease-out`}
          style={{ width: mounted ? `${courseProgress * 100}%` : '0%' }}
        />
      </div>
    </section>
  );
}
