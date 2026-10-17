import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useSettings } from '../lib/settings.jsx';
import Logo from './Logo.jsx';

const SCALES = [
  { v: 1, label: 'Default' },
  { v: 1.15, label: 'Large' },
  { v: 1.3, label: 'Larger' },
  { v: 1.5, label: 'Largest' },
];

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 cursor-pointer">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-abyss-soft">{hint}</span>
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="mt-1 shrink-0 w-11 h-6 rounded-full bg-line relative transition-colors peer-checked:bg-kelp peer-focus-visible:ring-4 peer-focus-visible:ring-marker after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-shell after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}

export default function Header({ onHome, inRound }) {
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);
  const panel = useRef(null);
  const button = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && (setOpen(false), button.current?.focus());
    const onClick = (e) => panel.current && !panel.current.contains(e.target) && !button.current.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    panel.current?.querySelector('button, input')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <header className="relative z-30 border-b border-line bg-foam/90 backdrop-blur">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {onHome ? (
          <button onClick={onHome} className="flex items-center gap-2 rounded-lg" aria-label={inRound ? 'Quit round and go to start' : 'Go to start'}>
            <Logo />
          </button>
        ) : (
          <Logo />
        )}
        <div className="flex items-center gap-2">
          {inRound && (
            <button onClick={onHome} className="hidden sm:inline-flex h-10 px-4 items-center rounded-full text-abyss-soft hover:text-abyss hover:bg-foam-deep">
              Quit round
            </button>
          )}
          <button
            ref={button}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="display-settings"
            className="h-10 px-4 inline-flex items-center gap-2 rounded-full border border-line bg-shell hover:border-abyss hc-border"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            <span>Display</span>
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={panel}
          id="display-settings"
          role="dialog"
          aria-label="Display and accessibility settings"
          className="absolute right-4 sm:right-6 top-[4.5rem] w-[min(360px,calc(100vw-2rem))] rounded-2xl bg-shell border border-line shadow-[0_18px_50px_-20px_rgba(14,42,51,0.45)] p-5 hc-border"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Display</h2>
            <button onClick={() => setOpen(false)} className="w-9 h-9 grid place-items-center rounded-full hover:bg-foam" aria-label="Close display settings">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <fieldset className="py-3 border-b border-line">
            <legend className="font-semibold mb-2">Text size</legend>
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-foam p-1">
              {SCALES.map((s) => (
                <label key={s.v} className="cursor-pointer">
                  <input type="radio" name="scale" className="peer sr-only" checked={settings.textScale === s.v} onChange={() => update({ textScale: s.v })} />
                  <span className="block text-center text-sm py-2 rounded-lg peer-checked:bg-abyss peer-checked:text-foam peer-focus-visible:ring-4 peer-focus-visible:ring-marker">
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="divide-y divide-line">
            <Toggle label="High contrast" hint="Pure white background and darker colors" checked={settings.contrast === 'high'} onChange={(v) => update({ contrast: v ? 'high' : 'normal' })} />
            <Toggle label="Reduce motion" hint="Turns off ringing, swiping and sliding" checked={settings.motion === 'reduce'} onChange={(v) => update({ motion: v ? 'reduce' : 'full' })} />
            <Toggle label="Read messages aloud" hint="Every message is spoken when you open it" checked={settings.readAloud} onChange={(v) => update({ readAloud: v })} />
          </div>
          <p className="text-sm text-abyss-soft pt-3">Phone calls always show live captions.</p>
        </div>
      )}
    </header>
  );
}
