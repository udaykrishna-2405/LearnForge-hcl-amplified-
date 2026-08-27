// ─── SVG Icon Components ────────────────────────────────────
// Replaces the emoji set: consistent stroke weight, inherits currentColor.

const base = {
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function CheckIcon({ className = 'w-4 h-4', animate = false }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" className={animate ? 'animate-draw-check' : undefined} />
    </svg>
  );
}

export function LockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function ArrowRightIcon({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function StarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 4l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8z" />
    </svg>
  );
}

export function ChatIcon({ className = 'w-5 h-5' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.6A8 8 0 0 1 13 4a8 8 0 0 1 8 8z" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function CloseIcon({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SendIcon({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 12l16-8-6 16-2.5-6.5z" />
    </svg>
  );
}

export function SkipIcon({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 6l8 6-8 6zM18 6v12" />
    </svg>
  );
}

export function AlertIcon({ className = 'w-4 h-4' }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.01" />
    </svg>
  );
}
