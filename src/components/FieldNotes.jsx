import { forwardRef } from 'react';
import { TACTICS, SCAM_TYPES } from '../../shared/tactics.js';
import { VERDICTS, money } from '../lib/game.js';

function Chip({ k, tone }) {
  const cls = tone === 'good' ? 'bg-kelp-light text-kelp' : tone === 'bad' ? 'bg-bobber-light text-bobber' : 'bg-foam-deep text-abyss';
  return <span className={`inline-block text-[0.8rem] font-bold px-2.5 py-1 rounded-full ${cls}`}>{TACTICS[k]?.label || k}</span>;
}

function Intro({ hasCall }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-[-0.02em]">How to play</h2>
      <ol className="mt-4 space-y-4">
        {[
          ['Open a message.', 'Texts, emails and DMs land in the inbox through the day.'],
          ['Decide what to do.', 'Report it, trust it, or reply to see what they want. Replies go to an AI playing the scammer.'],
          ['Find out.', 'Trust a scam and money really leaves the account. Either way, the red flags light up.'],
        ].map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="shrink-0 w-8 h-8 rounded-full bg-abyss text-foam grid place-items-center font-bold" aria-hidden="true">
              {i + 1}
            </span>
            <span>
              <span className="block font-bold">{t}</span>
              <span className="block text-abyss-soft">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 rounded-2xl bg-marker-soft px-4 py-3">
        Some messages are real. Reporting everything is not the answer, and real life works the same way.
        {hasCall ? ' Keep your phone close, someone will call.' : ''}
      </p>
    </div>
  );
}

const FieldNotes = forwardRef(function FieldNotes({ message, result, activeFlag, onActivateFlag, hasCall, className = '' }, ref) {
  return (
    <section ref={ref} className={`rounded-3xl bg-shell border border-line p-5 sm:p-6 hc-border scroll-mt-20 ${className}`} aria-label="Field notes" aria-live="polite">
      {!message || !result ? (
        <Intro hasCall={hasCall} />
      ) : (
        <Notes message={message} result={result} activeFlag={activeFlag} onActivateFlag={onActivateFlag} />
      )}
    </section>
  );
});

function Notes({ message, result, activeFlag, onActivateFlag }) {
  const v = VERDICTS[result.outcome];
  const type = message.scamType && SCAM_TYPES[message.scamType];
  const items = message.isScam ? message.redFlags || [] : message.legitSigns || [];
  const lesson = message.isScam && message.tactics?.[0] ? TACTICS[message.tactics[0]] : null;

  return (
    <div>
      <p className={`text-sm font-bold ${v.tone === 'bad' ? 'text-bobber' : v.tone === 'good' ? 'text-kelp' : 'text-abyss-soft'}`}>
        {result.lost > 0 ? `-${money(result.lost)}` : `+${result.points} points`}
      </p>
      <h2 className="mt-1 text-[1.7rem] font-extrabold tracking-[-0.02em] leading-tight">{v.title}</h2>
      <p className="mt-2 text-[1.05rem]">
        {message.isScam ? (
          <>
            Scam type: <strong>{type?.label || 'Scam'}</strong>
            {type?.area ? <span className="text-abyss-soft"> ({type.area})</span> : null}.
            {result.lost > 0 && ` ${money(result.lost)} gone by ${message.ask?.method || 'transfer'}.`}
          </>
        ) : (
          <>This was a real message from {message.sender.name}. Real ones look like this.</>
        )}
      </p>

      {items.length > 0 && (
        <>
          <h3 className="mt-6 font-bold">{message.isScam ? 'The red flags' : 'How you could tell it was real'}</h3>
          <ul className="mt-2 space-y-2">
            {items.map((f, i) => (
              <li key={i}>
                <button
                  onClick={() => onActivateFlag(i)}
                  aria-pressed={activeFlag === i}
                  className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-colors ${activeFlag === i ? 'border-abyss bg-foam' : 'border-transparent bg-foam hover:border-line'}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className={`font-semibold leading-snug px-1 -mx-1 rounded ${message.isScam ? 'bg-marker' : 'bg-kelp-light'}`}>"{f.quote}"</span>
                    {f.tactic && <span className="shrink-0 text-[0.75rem] font-bold text-abyss-soft mt-0.5">{TACTICS[f.tactic]?.label}</span>}
                  </span>
                  <span className="block mt-1.5 text-abyss-soft leading-snug">{f.why}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {result.outcome === 'caught' && (
        <div className="mt-6 space-y-3">
          {result.correct?.length > 0 && (
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold mr-1">You spotted</span>
              {result.correct.map((k) => (
                <Chip key={k} k={k} tone="good" />
              ))}
            </p>
          )}
          {result.missed?.length > 0 && (
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold mr-1">Also in there</span>
              {result.missed.map((k) => (
                <Chip key={k} k={k} />
              ))}
            </p>
          )}
          {result.wrong?.length > 0 && (
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold mr-1">Not this time</span>
              {result.wrong.map((k) => (
                <Chip key={k} k={k} tone="bad" />
              ))}
            </p>
          )}
        </div>
      )}

      {message.verify && (
        <div className="mt-6 rounded-2xl bg-abyss text-foam px-4 py-3.5">
          <h3 className="font-bold">How to check safely</h3>
          <p className="mt-1 text-foam/90 leading-snug">{message.verify}</p>
        </div>
      )}

      {lesson && (
        <p className="mt-4 text-abyss-soft leading-snug">
          <strong className="text-abyss">{lesson.label}:</strong> {lesson.lesson}
        </p>
      )}
    </div>
  );
}

export default FieldNotes;
