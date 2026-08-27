import { memo, useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon } from '../shared/Icons';
import { MAX_SKILL_LEVEL } from '../../utils/helpers';
import { getLevelLabel } from '../../utils/skillCalculations';

const SIZE = 400;
const CENTER = SIZE / 2;
const MAX_RADIUS = 160;
const RING_RADII = [53, 107, 160];
const RING_LABELS = ['Beginner', 'Intermediate', 'Advanced'];
const GROW_MS = 800;

function vertex(index, count, radius) {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  return [
    Math.round(CENTER + radius * Math.cos(angle)),
    Math.round(CENTER + radius * Math.sin(angle)),
  ];
}

/** SVG points string for one series, scaled by `progress` for the grow-in. */
function calculatePolygonPoints(skills, levels, maxRadius, progress = 1) {
  return skills
    .map((skill, i) => {
      const level = levels[skill] ?? 0;
      const r = (level / MAX_SKILL_LEVEL) * maxRadius * progress;
      return vertex(i, skills.length, r).join(',');
    })
    .join(' ');
}

function SkillRadar({ currentLevels, targetLevels, skills }) {
  const [isOpen, setIsOpen] = useState(true);
  const [progress, setProgress] = useState(0);

  // Both polygons expand from the centre once, on first paint.
  useEffect(() => {
    if (!isOpen) return undefined;
    let frame;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / GROW_MS);
      setProgress(1 - (1 - t) ** 3); // ease-out cubic
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isOpen, skills]);

  const geometry = useMemo(() => {
    if (skills.length < 3) return null;
    return {
      rings: RING_RADII.map((r) =>
        skills.map((_, i) => vertex(i, skills.length, r).join(',')).join(' ')
      ),
      axes: skills.map((_, i) => vertex(i, skills.length, MAX_RADIUS)),
      labels: skills.map((_, i) => vertex(i, skills.length, MAX_RADIUS + 22)),
    };
  }, [skills]);

  if (!geometry) return null;

  const targetPoints = calculatePolygonPoints(skills, targetLevels, MAX_RADIUS, progress);
  const currentPoints = calculatePolygonPoints(skills, currentLevels, MAX_RADIUS, progress);

  return (
    <section className="border-l-2 border-slate-700 bg-slate-800/30">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors duration-200 hover:bg-slate-700/20"
      >
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">Skill progress</h2>
        <ChevronDownIcon className={`w-4 h-4 shrink-0 text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-4 pb-5">
          <div className="mx-auto max-w-sm">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-full"
              role="img"
              aria-label="Radar chart comparing current skill levels against target levels"
            >
              {geometry.rings.map((points, i) => (
                <polygon key={`ring-${i}`} points={points} className="fill-none stroke-slate-700" strokeWidth="1" />
              ))}

              {geometry.axes.map(([x, y], i) => (
                <line key={`axis-${i}`} x1={CENTER} y1={CENTER} x2={x} y2={y} className="stroke-slate-700" strokeWidth="1" />
              ))}

              {RING_RADII.map((r, i) => (
                <text
                  key={`ring-label-${i}`}
                  x={CENTER + r + 4}
                  y={CENTER - 4}
                  className="fill-slate-500 text-[9px]"
                >
                  {RING_LABELS[i]}
                </text>
              ))}

              <polygon
                points={targetPoints}
                className="fill-indigo-500/15 stroke-indigo-400/60"
                strokeWidth="1.5"
              />
              <polygon
                points={currentPoints}
                className="fill-emerald-500/20 stroke-emerald-400/80"
                strokeWidth="2"
              />

              {skills.map((skill, i) => {
                const r = ((currentLevels[skill] ?? 0) / MAX_SKILL_LEVEL) * MAX_RADIUS * progress;
                const [x, y] = vertex(i, skills.length, r);
                return <circle key={`dot-${skill}`} cx={x} cy={y} r="4" className="fill-emerald-400" />;
              })}

              {geometry.labels.map(([x, y], i) => (
                <text
                  key={`label-${skills[i]}`}
                  x={x}
                  y={y}
                  textAnchor={x > CENTER + 6 ? 'start' : x < CENTER - 6 ? 'end' : 'middle'}
                  dominantBaseline="middle"
                  className="fill-slate-400 text-[11px]"
                >
                  {skills[i]}
                </text>
              ))}
            </svg>

            <div className="mt-2 flex justify-center gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Current level
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-400" /> Target level
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {skills.map((skill) => (
              <SkillRow
                key={skill}
                skill={skill}
                current={currentLevels[skill] ?? 0}
                target={targetLevels[skill] ?? 0}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SkillRow({ skill, current, target }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-sm text-slate-300">{skill}</span>
        <span className="shrink-0 text-xs text-slate-400">
          {getLevelLabel(current)} → {getLevelLabel(target)}
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default memo(SkillRadar);
