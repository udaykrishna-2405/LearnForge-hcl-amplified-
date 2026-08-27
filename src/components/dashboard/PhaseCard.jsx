import { memo } from 'react';
import CourseCard from './CourseCard';
import MilestoneCard from './MilestoneCard';
import { ChevronDownIcon } from '../shared/Icons';
import { getItemStatus } from '../../utils/helpers';

// Status is carried by the left border rather than a large badge.
const ACCENT = {
  complete: 'border-l-emerald-500 bg-slate-800/60',
  active: 'border-l-indigo-500 bg-slate-800',
  locked: 'border-l-slate-600 bg-slate-800/30',
};

function PhaseCard({
  phase, phaseIndex, isExpanded, onToggle,
  priorItems, completedItems, skippedItems,
  onCompleteCourse, onSkipCourse, isBusy, learnerId, notes, dispatch,
}) {
  const items = phase.items ?? [];
  const statuses = items.map((item, i) =>
    getItemStatus(item.item_id, i, items, priorItems, completedItems, skippedItems)
  );

  const resolved = statuses.filter((s) => s === 'completed' || s === 'skipped').length;
  const allDone = items.length > 0 && resolved === items.length;
  const allLocked = statuses.every((s) => s === 'locked');
  const tone = allDone ? 'complete' : allLocked ? 'locked' : 'active';

  return (
    <section className={`border-l-2 ${ACCENT[tone]} ${allLocked ? 'opacity-60' : ''}`}>
      <button
        onClick={() => onToggle(phase.phase_id)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors duration-200 hover:bg-slate-700/20"
      >
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-slate-400">Phase {phaseIndex + 1}</p>
          <h3 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-100">{phase.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{phase.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-sm tabular-nums text-slate-400">
            {resolved}/{items.length}
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 text-slate-500 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-3 px-4 pb-6">
          {items.map((item, i) => (
            <CourseCard
              key={item.item_id}
              item={item}
              status={statuses[i]}
              onComplete={onCompleteCourse}
              onSkip={onSkipCourse}
              isBusy={isBusy}
              learnerId={learnerId}
              note={notes[item.item_id]}
              dispatch={dispatch}
            />
          ))}

          {phase.milestone && <MilestoneCard milestone={phase.milestone} isUnlocked={allDone} />}
        </div>
      )}
    </section>
  );
}

export default memo(PhaseCard);
