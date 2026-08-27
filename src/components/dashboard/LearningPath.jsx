import { useMemo } from 'react';
import PhaseCard from './PhaseCard';

export default function LearningPath({
  path, expandedPhases, completedItems, skippedItems,
  onTogglePhase, onCompleteCourse, onSkipCourse, isBusy,
}) {
  // Each phase is gated by every item ahead of it, so prefixes are built once.
  const priorItemsByPhase = useMemo(
    () => path.phases.map((_, i) => path.phases.slice(0, i).flatMap((p) => p.items ?? [])),
    [path.phases]
  );

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-slate-100">Your path</h2>

      <div className="mt-4 space-y-2">
        {path.phases.map((phase, index) => (
          <PhaseCard
            key={phase.phase_id}
            phase={phase}
            phaseIndex={index}
            isExpanded={expandedPhases.includes(phase.phase_id)}
            onToggle={onTogglePhase}
            priorItems={priorItemsByPhase[index]}
            completedItems={completedItems}
            skippedItems={skippedItems}
            onCompleteCourse={onCompleteCourse}
            onSkipCourse={onSkipCourse}
            isBusy={isBusy}
          />
        ))}
      </div>
    </section>
  );
}
