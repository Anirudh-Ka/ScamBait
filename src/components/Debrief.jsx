import { useEffect, useState } from 'react';
import { CircleCheck, ExternalLink } from 'lucide-react';
import { TACTICS, SCAM_TYPES, RESOURCES } from '../../shared/tactics.js';
import { tacticProfile } from '../../shared/offline.js';
import { getDebrief } from '../lib/api.js';
import { VERDICTS, money } from '../lib/game.js';
import ChannelIcon from './phone/ChannelIcon.jsx';

export default function Debrief({ round, outcome, onReplay, onNew }) {
  const { persona, language } = round;
  const { results, account, points } = outcome;
  const start = account.startBalance;
  const kept = account.balance;
  const lost = start - kept;
  const [debrief, setDebrief] = useState(null);

  useEffect(() => {
    getDebrief({ persona, results, lost, saved: kept, language }).then(setDebrief);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scams = results.filter((r) => r.isScam);
  const legit = results.filter((r) => !r.isScam);
  const caught = scams.filter((r) => r.outcome === 'caught').length;
  const trustedReal = legit.filter((r) => r.outcome === 'trusted_legit').length;
  const profile = Object.entries(tacticProfile(results))
    .filter(([, v]) => v.seen > 0)
    .sort((a, b) => b[1].fooled - a[1].fooled || b[1].seen - a[1].seen);
  const weakest = debrief?.weakest;

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 py-10 sm:py-14">
      <h1 className="font-extrabold tracking-[-0.045em] leading-[0.95]">
        {lost > 0 ? (
          <>
            <span className="block text-[clamp(2.8rem,8vw,5.6rem)]">You kept {money(kept)}</span>
            <span className="block text-[clamp(1.6rem,4vw,2.6rem)] text-abyss-soft tracking-[-0.03em] mt-1">
              of {money(start)}. Scammers walked off with <span className="text-bobber">{money(lost)}</span>.
            </span>
          </>
        ) : (
          <span className="block text-[clamp(2.8rem,8vw,5.6rem)]">You kept every dollar.</span>
        )}
      </h1>

      <div className="mt-8 max-w-[64ch]" aria-live="polite">
        {debrief ? (
          <>
            <p className="text-xl font-bold">{debrief.headline}</p>
            <p className="mt-2 text-[1.12rem] leading-relaxed">{debrief.summary}</p>
          </>
        ) : (
          <p className="text-abyss-soft">Writing your debrief...</p>
        )}
      </div>

      <dl className="mt-10 grid grid-cols-3 border-y border-line divide-x divide-line">
        {[
          ['Scams caught', `${caught} of ${scams.length}`],
          ['Real messages trusted', `${trustedReal} of ${legit.length}`],
          ['Score', points],
        ].map(([k, v]) => (
          <div key={k} className="py-4 px-3 sm:px-5 first:pl-0">
            <dt className="text-sm text-abyss-soft">{k}</dt>
            <dd className="text-2xl sm:text-3xl font-extrabold tabular">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid lg:grid-cols-2 gap-10 lg:gap-14">
        <section aria-labelledby="gets-you">
          <h2 id="gets-you" className="text-2xl font-extrabold tracking-[-0.02em]">
            What gets you
          </h2>
          <p className="mt-1 text-abyss-soft">How often each tactic worked on you today.</p>
          <ul className="mt-5 space-y-4">
            {profile.map(([k, v]) => (
              <li key={k}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`font-bold px-1 -mx-1 rounded ${k === weakest ? 'bg-marker' : ''}`}>{TACTICS[k].label}</span>
                  <span className="text-sm text-abyss-soft tabular">
                    {v.fooled ? `Fooled you ${v.fooled} of ${v.seen}` : `Caught all ${v.seen}`}
                  </span>
                </div>
                <div className="mt-1.5 h-3 rounded-full bg-kelp-light overflow-hidden flex" role="img" aria-label={`${TACTICS[k].label}: fooled you ${v.fooled} of ${v.seen} times`}>
                  <span className="h-full bg-bobber" style={{ width: `${(v.fooled / v.seen) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {weakest && TACTICS[weakest] && (
            <p className="mt-6 rounded-2xl bg-marker-soft px-4 py-3 leading-snug">
              <strong>{TACTICS[weakest].label}:</strong> {TACTICS[weakest].lesson}
            </p>
          )}
        </section>

        <section aria-labelledby="your-day">
          <h2 id="your-day" className="text-2xl font-extrabold tracking-[-0.02em]">
            Your day, message by message
          </h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {results.map((r) => {
              const v = VERDICTS[r.outcome] || { title: 'Skipped', tone: 'neutral' };
              return (
                <li key={r.id} className="py-3 flex items-start gap-3">
                  <span className="shrink-0 w-9 h-9 rounded-full bg-foam-deep grid place-items-center">
                    <ChannelIcon channel={r.channel} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold truncate">{r.sender}</span>
                    <span className="block text-sm text-abyss-soft">{r.isScam ? SCAM_TYPES[r.scamType]?.label || 'Scam' : 'Real message'}</span>
                  </span>
                  <span className={`shrink-0 text-sm font-bold text-right ${v.tone === 'bad' ? 'text-bobber' : v.tone === 'good' ? 'text-kelp' : 'text-abyss-soft'}`}>
                    {r.lost > 0 ? `-${money(r.lost)}` : v.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="mt-14" aria-labelledby="habits">
        <h2 id="habits" className="text-2xl font-extrabold tracking-[-0.02em]">
          Three habits to keep
        </h2>
        <ul className="mt-4 grid md:grid-cols-3 gap-4">
          {(debrief?.habits || []).map((h) => (
            <li key={h} className="flex gap-3 rounded-2xl bg-shell border border-line p-4 hc-border">
              <CircleCheck size={22} className="shrink-0 text-kelp mt-0.5" aria-hidden="true" />
              <span className="leading-snug">{h}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 rounded-3xl bg-abyss text-foam p-6 sm:p-8" aria-labelledby="for-real">
        <h2 id="for-real" className="text-2xl font-extrabold tracking-[-0.02em]">
          If this happens for real
        </h2>
        <p className="mt-1 text-foam/80 max-w-[60ch]">Stop sending money, call your bank using the number on your card, then report it. Reporting helps even if you lost nothing.</p>
        <ul className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {RESOURCES.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-4 decoration-marker inline-flex items-center gap-1.5">
                {r.name}
                <ExternalLink size={15} aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <span className="block text-sm text-foam/75">{r.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <button onClick={onReplay} className="h-14 px-7 rounded-full bg-abyss text-foam font-bold text-lg hover:bg-kelp">
          Play again, sneakier
        </button>
        <button onClick={onNew} className="h-14 px-7 rounded-full border-2 border-abyss font-bold text-lg hover:bg-foam-deep">
          Play as someone else
        </button>
      </div>
    </div>
  );
}
