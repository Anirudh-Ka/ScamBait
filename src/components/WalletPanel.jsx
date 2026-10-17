import { Landmark, Sparkles, AudioLines } from 'lucide-react';
import { money } from '../lib/game.js';

export function MobileBar({ account, points, done, total }) {
  return (
    <div className="lg:hidden flex items-center justify-between gap-3 rounded-2xl bg-shell border border-line px-4 py-2.5 hc-border" role="group" aria-label="Round status">
      <div>
        <p className="text-[0.75rem] text-abyss-soft leading-none">Checking</p>
        <p className="text-xl font-extrabold tabular leading-tight">{money(account.balance)}</p>
      </div>
      <div className="text-right">
        <p className="text-[0.75rem] text-abyss-soft leading-none">
          {done} of {total} checked
        </p>
        <p className="text-xl font-extrabold tabular leading-tight">{points} pts</p>
      </div>
    </div>
  );
}

export default function WalletPanel({ persona, account, points, done, total, allDone, onFinish, scenario, integrations, className = '' }) {
  const first = persona.name.split(' ')[0];
  const lost = account.startBalance - account.balance;
  return (
    <aside className={`rounded-3xl bg-shell border border-line p-5 hc-border ${className}`} aria-label="Account and score">
      <h2 className="font-bold">{first}'s checking</h2>
      <p className={`mt-1 text-[2.6rem] leading-none font-extrabold tracking-[-0.03em] tabular ${lost > 0 ? 'text-bobber' : ''}`} aria-live="polite">
        {money(account.balance)}
      </p>
      <p className="mt-1.5 text-sm text-abyss-soft">Started the day with {money(account.startBalance)}</p>
      <p className="mt-3 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold rounded-full bg-foam px-2.5 py-1">
        <Landmark size={14} aria-hidden="true" />
        {account.live ? 'Live Capital One Nessie sandbox' : 'Practice account'}
      </p>

      <h3 className="mt-6 text-sm font-bold">Sent to scammers</h3>
      {account.sent?.length ? (
        <ul className="mt-2 space-y-2">
          {account.sent.map((t) => (
            <li key={t.id} className="text-sm border-l-4 border-bobber pl-3">
              <span className="font-bold tabular text-bobber">-{money(t.amount)}</span> to {t.recipient}
              <span className="block text-abyss-soft">
                by {t.method}
                {t.via?.startsWith('nessie') ? ', recorded in Nessie' : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-abyss-soft">Nothing yet. Keep it that way.</p>
      )}

      <div className="mt-6 pt-5 border-t border-line">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-bold">Score</h3>
          <p className="text-2xl font-extrabold tabular">{points}</p>
        </div>
        <p className="mt-3 text-sm text-abyss-soft">
          {done} of {total} messages checked
        </p>
        <div className="mt-1.5 flex gap-1" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < done ? 'bg-abyss' : 'bg-line'}`} />
          ))}
        </div>
        {allDone && (
          <button onClick={onFinish} className="mt-5 w-full h-12 rounded-full bg-abyss text-foam font-bold hover:bg-kelp">
            See how you did
          </button>
        )}
      </div>

      <ul className="mt-6 pt-4 border-t border-line space-y-1.5 text-[0.8rem] text-abyss-soft">
        <li className="flex gap-2">
          <Sparkles size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {scenario.source === 'gemini' ? `Scams written live by Google Gemini (${scenario.model})` : 'Built-in scenario pack (add a Gemini key for live scams)'}
        </li>
        <li className="flex gap-2">
          <AudioLines size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {integrations?.elevenlabs ? 'Voices by ElevenLabs' : 'Browser voice (add an ElevenLabs key for real voices)'}
        </li>
      </ul>
    </aside>
  );
}
