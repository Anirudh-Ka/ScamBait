import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { PERSONAS, LANGUAGES, DIFFICULTIES } from '../../shared/personas.js';
import { TACTICS } from '../../shared/tactics.js';
import { money } from '../lib/game.js';

function HookedNotification() {
  return (
    <div className="sway relative w-[250px] sm:w-[280px] mx-auto lg:mx-0" aria-hidden="true">
      <svg viewBox="0 0 280 170" className="w-full block overflow-visible">
        <line x1="150" y1="-400" x2="150" y2="160" stroke="var(--color-abyss)" strokeWidth="1.6" />
        <path d="M150 96 v54" stroke="var(--color-abyss)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="150" cy="60" r="11" fill="var(--color-bobber-bright)" />
        <rect x="139" y="60" width="22" height="11" fill="var(--color-shell)" />
        <circle cx="150" cy="60" r="11" fill="none" stroke="var(--color-abyss)" strokeWidth="1.6" />
      </svg>
      <div className="relative z-10 -mt-[30px] rounded-[18px] bg-shell border border-line shadow-[0_20px_40px_-24px_rgba(14,42,51,0.6)] p-3.5 pt-4 text-left">
        {/* where the hook goes through the card */}
        <span className="absolute top-[5px] left-[calc(53.57%-6px)] w-[12px] h-[12px] rounded-full bg-abyss ring-4 ring-foam-deep" />
        <div className="flex items-center gap-2 text-[0.78rem] text-abyss-soft">
          <span className="w-5 h-5 rounded-md bg-abyss text-foam grid place-items-center text-[0.65rem] font-bold">H</span>
          <span className="font-semibold text-abyss">Harborline Bank</span>
          <span className="ml-auto">now</span>
        </div>
        <p className="mt-1.5 text-[0.92rem] leading-snug">
          Your account will be frozen in 30 minutes unless you verify your identity.
        </p>
      </div>
    </div>
  );
}

export default function Setup({ health, initial, error, onStart }) {
  const [personaId, setPersonaId] = useState(initial?.personaId || 'rosa');
  const [language, setLanguage] = useState(initial?.language || 'Spanish');
  const [difficulty, setDifficulty] = useState(initial?.difficulty || 'medium');
  const [useMe, setUseMe] = useState(Boolean(initial?.useMe));
  const [touchedLang, setTouchedLang] = useState(Boolean(initial));

  const live = health?.integrations || {};
  const persona = PERSONAS.find((p) => p.id === personaId);

  useEffect(() => {
    if (!touchedLang && persona) setLanguage(persona.defaultLanguage || 'English');
  }, [personaId]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e) {
    e.preventDefault();
    onStart({ personaId, language: live.gemini ? language : 'English', difficulty, useMe });
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 pb-20">
      <section className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-12 items-end pt-2 lg:pt-0 overflow-hidden">
        <div className="order-2 lg:order-1 pt-4 lg:pt-16 pb-2">
          <h1 className="text-[clamp(3rem,9vw,6.4rem)] leading-[0.92] font-extrabold tracking-[-0.045em] text-abyss">
            Take the bait.
          </h1>
          <p className="mt-6 text-[1.2rem] leading-relaxed max-w-[38ch]">
            ScamBait gives you one day of texts, emails and calls. Some are scams that AI wrote for the exact person you are playing. Spot them before they empty your account.
          </p>
          <p className="mt-3 text-abyss-soft max-w-[52ch]">
            Getting fooled here costs nothing. Out there, Americans reported losing a record $15.9 billion to fraud in 2025, and nearly half of it went to fake investments.
          </p>
        </div>
        <div className="order-1 lg:order-2 pt-0 -mb-2 lg:mb-6">
          <HookedNotification />
        </div>
      </section>

      <form onSubmit={submit} className="mt-10 lg:mt-14" aria-describedby={error ? 'start-error' : undefined}>
        <fieldset disabled={useMe}>
          <legend className="text-2xl font-bold tracking-[-0.01em]">Who are you today?</legend>
          <p className="text-abyss-soft mt-1">Scammers pick targets on purpose. Each person gets different scams.</p>
          <div className={`mt-5 grid sm:grid-cols-2 xl:grid-cols-4 gap-3 ${useMe ? 'opacity-50' : ''}`}>
            {PERSONAS.map((p) => (
              <label key={p.id} className="cursor-pointer group">
                <input type="radio" name="persona" value={p.id} checked={personaId === p.id} onChange={() => setPersonaId(p.id)} className="peer sr-only" />
                <span className="flex h-full flex-col rounded-2xl border-2 border-line bg-shell p-4 transition-colors group-hover:border-abyss-soft peer-checked:border-abyss peer-checked:shadow-[inset_0_-5px_0_var(--color-marker)] peer-focus-visible:ring-4 peer-focus-visible:ring-marker">
                  <span className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full bg-abyss text-foam grid place-items-center text-lg font-bold" aria-hidden="true">
                      {p.avatar}
                    </span>
                    <span>
                      <span className="block font-bold text-[1.05rem] leading-tight">{p.name}</span>
                      <span className="block text-sm text-abyss-soft">
                        {p.age}, {money(p.balance)} in checking
                      </span>
                    </span>
                  </span>
                  <span className="block mt-3 leading-snug">{p.tagline}</span>
                  <span className="block mt-auto pt-3 text-sm text-abyss-soft">
                    Usually targeted with {p.targetedBy.map((t) => TACTICS[t].label.toLowerCase()).join(', ')}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {live.nessie && (
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-foam-deep/60 p-4 cursor-pointer max-w-[720px]">
            <input type="checkbox" checked={useMe} onChange={(e) => setUseMe(e.target.checked)} className="mt-1 w-5 h-5 accent-[var(--color-abyss)]" />
            <span>
              <span className="font-semibold flex items-center gap-2">
                <Landmark size={18} aria-hidden="true" /> Play as my own bank customer
              </span>
              <span className="block text-sm text-abyss-soft">
                Uses a customer, balance and real purchases from your Capital One Nessie sandbox, so the scams can reference your actual spending.
              </span>
            </span>
          </label>
        )}

        <div className="mt-8 grid md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-6 max-w-[920px]">
          <div>
            <label htmlFor="language" className="block font-semibold">
              Language for the messages
            </label>
            <select
              id="language"
              value={live.gemini ? language : 'English'}
              disabled={!live.gemini}
              onChange={(e) => {
                setLanguage(e.target.value);
                setTouchedLang(true);
              }}
              className="mt-2 w-full h-12 rounded-xl border-2 border-line bg-shell px-3 text-[1rem] disabled:opacity-60"
            >
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <p className="mt-2 text-sm text-abyss-soft">
              {live.gemini
                ? 'Scammers target communities in their own language, so ScamBait does too.'
                : 'Live AI writing is off, so messages are in English.'}
            </p>
          </div>

          <fieldset>
            <legend className="font-semibold">How sneaky should the scams be?</legend>
            <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-foam-deep p-1">
              {DIFFICULTIES.map((d) => (
                <label key={d.id} className="cursor-pointer">
                  <input type="radio" name="difficulty" checked={difficulty === d.id} onChange={() => setDifficulty(d.id)} className="peer sr-only" />
                  <span className="block text-center py-2.5 rounded-lg font-semibold peer-checked:bg-abyss peer-checked:text-foam peer-focus-visible:ring-4 peer-focus-visible:ring-marker">
                    {d.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-abyss-soft">{DIFFICULTIES.find((d) => d.id === difficulty)?.note}</p>
          </fieldset>
        </div>

        {error && (
          <p id="start-error" role="alert" className="mt-6 rounded-xl bg-bobber-light text-abyss px-4 py-3 max-w-[720px]">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button type="submit" className="h-14 px-8 rounded-full bg-abyss text-foam text-lg font-bold hover:bg-kelp transition-colors">
            Start the day
          </button>
          <p className="text-sm text-abyss-soft max-w-[56ch]">
            Training simulation. Every company, person, phone number and link is made up. What you type is only used to write the scammer's replies.
          </p>
        </div>
      </form>
    </div>
  );
}
