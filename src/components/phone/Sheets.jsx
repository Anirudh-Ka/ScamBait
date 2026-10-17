import { useEffect, useRef, useState } from 'react';
import { Check, Landmark } from 'lucide-react';
import { TACTICS, TACTIC_KEYS } from '../../../shared/tactics.js';
import { money, methodNote } from '../../lib/game.js';

function useDialogFocus(onClose) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    // preventScroll: the sheet is still sliding in, and scrolling to it would shift the whole phone
    ref.current?.querySelector('[data-autofocus], button, input')?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('button, input, [tabindex="0"]');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
}

export function TacticPicker({ onSubmit, onCancel }) {
  const [picked, setPicked] = useState([]);
  const ref = useDialogFocus(onCancel);
  const toggle = (k) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  return (
    <div className="absolute inset-0 z-20 bg-abyss/45 flex items-end" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="picker-title" className="sheet-up w-full h-[88%] flex flex-col rounded-t-[28px] bg-shell">
        <div className="px-5 pt-3 pb-2">
          <span className="block mx-auto w-10 h-1.5 rounded-full bg-line mb-3" aria-hidden="true" />
          <h2 id="picker-title" className="text-xl font-extrabold tracking-[-0.01em]">
            What gave it away?
          </h2>
          <p className="text-sm text-abyss-soft">Pick any you noticed. Each correct one earns 20 points. Skip if you just had a feeling.</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-4 pb-2">
        <fieldset className="min-w-0">
          <legend className="sr-only">Scam tactics you noticed</legend>
          <div className="grid gap-2">
            {TACTIC_KEYS.map((k) => {
              const on = picked.includes(k);
              return (
                <label key={k} className="cursor-pointer">
                  <input type="checkbox" className="peer sr-only" checked={on} onChange={() => toggle(k)} />
                  <span className="flex items-start gap-3 rounded-2xl border-2 border-line px-3.5 py-2.5 peer-checked:border-abyss peer-checked:bg-marker-soft peer-focus-visible:ring-4 peer-focus-visible:ring-marker">
                    <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 grid place-items-center ${on ? 'bg-abyss border-abyss text-marker' : 'border-abyss-soft'}`} aria-hidden="true">
                      {on && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span>
                      <span className="block font-bold leading-tight">{TACTICS[k].label}</span>
                      <span className="block text-sm text-abyss-soft leading-snug">{TACTICS[k].short}</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        </div>
        <div className="shrink-0 p-4 grid grid-cols-[auto_1fr] gap-2 border-t border-line">
          <button onClick={() => onSubmit([])} className="h-12 px-5 rounded-full border-2 border-line font-bold hover:border-abyss">
            Skip
          </button>
          <button data-autofocus onClick={() => onSubmit(picked)} className="h-12 rounded-full bg-bobber text-shell font-bold hover:brightness-110">
            Report it{picked.length ? ` (${picked.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PaySheet({ message, balance, onConfirm, onCancel }) {
  const ref = useDialogFocus(onCancel);
  const amount = Math.min(balance, message.askAmount);
  const rows = [
    ['To', message.ask?.recipient || message.sender.name],
    ['How', message.ask?.method || 'Transfer'],
    ['Balance after', money(balance - amount)],
  ];
  return (
    <div className="absolute inset-0 z-20 bg-abyss/45 flex items-end" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="pay-title" className="sheet-up w-full rounded-t-[28px] bg-shell p-5">
        <span className="block mx-auto w-10 h-1.5 rounded-full bg-line mb-4" aria-hidden="true" />
        <p className="text-sm text-abyss-soft">They are asking for</p>
        <h2 id="pay-title" className="text-[2.6rem] font-extrabold tracking-[-0.03em] tabular leading-none mt-1">
          {money(amount)}
        </h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-abyss-soft">{k}</dt>
              <dd className="font-semibold text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button data-autofocus onClick={onCancel} className="h-12 rounded-full border-2 border-abyss font-bold">
            Not now
          </button>
          <button onClick={onConfirm} className="h-12 rounded-full bg-bobber text-shell font-bold hover:brightness-110">
            Send money
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sting({ sting, onContinue }) {
  const ref = useDialogFocus(null);
  const nessie = sting.via?.startsWith('nessie');
  return (
    <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby="sting-title" aria-describedby="sting-desc" className="absolute inset-0 z-30 bg-abyss text-foam flex flex-col px-6 py-8">
      <p className="text-foam/70 font-semibold">Money sent</p>
      <div className="mt-6 relative">
        <p id="sting-title" className="text-[3.6rem] leading-none font-extrabold tracking-[-0.04em] text-bobber-bright tabular">
          -{money(sting.amount)}
        </p>
        <p className="drain absolute inset-0 text-[3.6rem] leading-none font-extrabold tracking-[-0.04em] text-bobber-bright/40 tabular" aria-hidden="true">
          -{money(sting.amount)}
        </p>
      </div>
      <p id="sting-desc" className="mt-4 text-lg leading-snug">
        Sent to <strong>{sting.recipient}</strong> by {sting.method}. {methodNote(sting.method)}
      </p>
      <div className="mt-auto">
        {nessie && (
          <p className="mb-4 flex gap-2 text-sm text-foam/75">
            <Landmark size={18} className="shrink-0" aria-hidden="true" />
            <span>Recorded as a real transfer in this player's Capital One Nessie sandbox account.</span>
          </p>
        )}
        <p className="text-sm text-foam/75">In a real scam, this is usually where it ends. Here, you get to see what you missed.</p>
        <button data-autofocus onClick={onContinue} className="mt-4 w-full h-13 py-3.5 rounded-full bg-marker text-abyss font-bold text-lg">
          Show me the red flags
        </button>
      </div>
    </div>
  );
}
