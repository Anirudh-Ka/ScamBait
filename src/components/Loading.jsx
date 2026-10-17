import { useEffect, useState } from 'react';
import { getPersona } from '../../shared/personas.js';
import { HookMark } from './Logo.jsx';

const LINES = [
  'Reading up on {first}',
  'Choosing which fears to push',
  'Copying a bank\'s tone of voice',
  'Inventing a fund that does not exist',
  'Hiding the red flags',
  'Mixing in a few real messages',
  'Warming up a voice for the phone call',
];

export default function Loading({ choice }) {
  const persona = getPersona(choice?.personaId);
  const first = choice?.useMe ? 'you' : persona.name.split(' ')[0];
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LINES.length), 2100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-20 sm:py-28 text-center">
      <div className="sway inline-block text-abyss">
        <HookMark size={64} />
      </div>
      <h1 className="mt-8 text-[clamp(2rem,6vw,3rem)] font-extrabold tracking-[-0.03em] leading-tight">
        Writing scams for {first}
      </h1>
      <p className="mt-4 text-lg text-abyss-soft min-h-[1.8em]" aria-live="polite">
        {LINES[i].replace('{first}', first)}
      </p>
      <p className="mt-10 text-sm text-abyss-soft max-w-[44ch] mx-auto">
        This takes a few seconds. Every message is written fresh, so no two days are the same.
      </p>
    </div>
  );
}
