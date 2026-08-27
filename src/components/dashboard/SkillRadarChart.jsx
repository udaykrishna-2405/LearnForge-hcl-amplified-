import { memo, useMemo } from 'react';
import { MAX_SKILL_LEVEL, skillLevelToNum } from '../../utils/helpers';

const SIZE = 400;
const CENTER = SIZE / 2;
const RADIUS = 130;
const LABEL_RADIUS = RADIUS + 26;
const RINGS = [1, 2, 3];

// Integer coordinates keep the SVG off sub-pixel boundaries.
function pointAt(radius, index, total) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return [
    Math.round(CENTER + radius * Math.cos(angle)),
    Math.round(CENTER + radius * Math.sin(angle)),
  ];
}

function polygon(levels, total) {
  return levels
    .map((level, i) => pointAt((level / MAX_SKILL_LEVEL) * RADIUS, i, total).join(','))
    .join(' ');
}

function SkillRadarChart({ skillProgression, currentLevels }) {
  const chart = useMemo(() => {
    const skills = Object.entries(skillProgression ?? {}).slice(0, 8);
    if (skills.length < 3) return null;

    const total = skills.length;
    const names = skills.map(([name]) => name);
    const target = skills.map(([, data]) => skillLevelToNum(data?.target));
    const current = names.map((name) => currentLevels[name] ?? 0);

    return {
      names,
      total,
      targetPoints: polygon(target, total),
      currentPoints: polygon(current, total),
      axes: names.map((_, i) => pointAt(RADIUS, i, total)),
      labels: names.map((_, i) => pointAt(LABEL_RADIUS, i, total)),
      rings: RINGS.map((ring) =>
        names.map((_, i) => pointAt((ring / MAX_SKILL_LEVEL) * RADIUS, i, total).join(',')).join(' ')
      ),
    };
  }, [skillProgression, currentLevels]);

  if (!chart) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-slate-100">Skill progression</h2>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mt-2 w-full max-w-sm"
        role="img"
        aria-label="Radar chart comparing current skill levels against target levels"
      >
        {chart.rings.map((points, i) => (
          <polygon key={`ring-${i}`} points={points} className="fill-none stroke-slate-800" strokeWidth="1" />
        ))}

        {chart.axes.map(([x, y], i) => (
          <line key={`axis-${i}`} x1={CENTER} y1={CENTER} x2={x} y2={y} className="stroke-slate-800" strokeWidth="1" />
        ))}

        <polygon
          points={chart.targetPoints}
          className="animate-radar-grow fill-slate-500/10 stroke-slate-500"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <polygon
          points={chart.currentPoints}
          className="animate-radar-grow fill-indigo-500/20 stroke-indigo-400"
          strokeWidth="2"
          style={{ transition: 'all 0.4s ease-out' }}
        />

        {chart.labels.map(([x, y], i) => (
          <text
            key={`label-${i}`}
            x={x}
            y={y}
            textAnchor={x > CENTER + 4 ? 'start' : x < CENTER - 4 ? 'end' : 'middle'}
            dominantBaseline="middle"
            className="fill-slate-500 text-[11px]"
          >
            {chart.names[i]}
          </text>
        ))}
      </svg>

      <div className="mt-1 flex gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-400" /> Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-500" /> Target
        </span>
      </div>
    </section>
  );
}

export default memo(SkillRadarChart);
