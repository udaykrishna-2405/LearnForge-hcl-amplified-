// ─── UI Sub-Components ──────────────────────────────────────

// Three tiers only. Never place two primaries side by side.
const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:opacity-90 disabled:opacity-40',
  secondary: 'border border-slate-600 text-slate-300 hover:border-slate-500 disabled:opacity-40',
  ghost: 'text-indigo-400 hover:text-indigo-300 disabled:opacity-40',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-opacity duration-200 ease-out disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
