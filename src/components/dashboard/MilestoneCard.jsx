import { StarIcon } from '../shared/Icons';

export default function MilestoneCard({ milestone, isUnlocked }) {
  return (
    <div
      className={`rounded-lg border-l-2 bg-slate-800/80 px-4 py-3 transition-colors duration-200 ${
        isUnlocked ? 'border-l-amber-500' : 'border-l-slate-700 opacity-60'
      }`}
    >
      <div className="flex items-center gap-2">
        <StarIcon className={`w-4 h-4 ${isUnlocked ? 'text-amber-400' : 'text-slate-400'}`} />
        <h4 className={`text-base font-medium ${isUnlocked ? 'text-amber-300' : 'text-slate-300'}`}>
          {milestone.title}
        </h4>
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{milestone.description}</p>

      {milestone.skills_validated?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {milestone.skills_validated.map((skill) => (
            <span key={skill} className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-400">
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
