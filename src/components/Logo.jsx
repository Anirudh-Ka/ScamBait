export function HookMark({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d="M19 3v15.5a6.5 6.5 0 1 1-13 0" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M6 18.5l-3.4-3.4" stroke="var(--color-bobber)" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="19" cy="3.5" r="2.2" fill="var(--color-bobber)" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2 text-abyss">
      <HookMark />
      <span className="text-xl font-extrabold tracking-[-0.02em]">ScamBait</span>
    </span>
  );
}
