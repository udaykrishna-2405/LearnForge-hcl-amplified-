import Button from '../shared/Button';
import { ArrowRightIcon } from '../shared/Icons';

const CAPABILITIES = [
  { title: 'Built from your goals', body: 'A short conversation captures your target role, current skills, timeline, and budget.' },
  { title: 'Explained, not asserted', body: 'Every course carries a written rationale for the gap it closes and why it sits where it does.' },
  { title: 'Adapts as you go', body: 'Skip something and the remaining sequence is re-planned around what you already know.' },
];

export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-dot-pattern">
      <main className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          AI-Powered Learning Paths
        </p>

        <h1
          className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
          style={{ textShadow: '0 0 40px rgba(99,102,241,0.3)' }}
        >
          <span className="gradient-text">LearnForge</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg font-normal leading-relaxed text-slate-400 md:text-xl">
          Tell it where you want to get to. It builds the roadmap, explains every
          step, and reshapes the plan as your skills change.
        </p>

        <div className="mt-10">
          <Button onClick={onStart} className="h-12 px-6 text-base">
            Start your learning path
            <ArrowRightIcon />
          </Button>
        </div>

        <div className="mt-20 grid gap-8 text-left sm:grid-cols-3">
          {CAPABILITIES.map(({ title, body }) => (
            <div key={title} className="border-l-2 border-indigo-500/60 pl-4">
              <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="pb-10 text-center text-xs text-slate-400">
        Built for the HCL Amplified Hackathon
      </footer>
    </div>
  );
}
