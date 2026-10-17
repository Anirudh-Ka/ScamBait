import { geminiJSON } from './gemini.js';
import { config } from './config.js';
import { TACTIC_KEYS } from '../shared/tactics.js';
import { fallbackDebrief as fallback } from '../shared/offline.js';

export async function writeDebrief({ persona, results, lost, saved, language = 'English' }) {
  const base = fallback({ persona, results, lost });
  if (!config.gemini.key) return base;
  const lines = results
    .map((r, i) => `${i + 1}. ${r.isScam ? `SCAM (${r.scamType}; tactics: ${(r.tactics || []).join(', ')})` : 'LEGIT'} -> player ${r.outcome}`)
    .join('\n');
  const prompt = `A player just finished a ScamBait round as ${persona?.name} (${persona?.tagline || ''}).
Results:
${lines}
Money lost to scams: $${Math.round(lost)}. Money kept: $${Math.round(saved)}.

Write a short, kind, honest coaching debrief in ${language}, speaking to the player as "you":
- headline: under 8 words.
- summary: 2 or 3 sentences. Name the pattern in what fooled them (or what they did well). No blame, no exaggeration.
- weakest: the single tactic key that fooled them most, or null if they were never fooled.
- habits: exactly 3 specific, practical habits for real life, each one sentence. Accurate: banks never ask you to move money to a safe account, the SEC never approves investments, no legitimate payment uses gift cards.

Return JSON {"headline": string, "summary": string, "weakest": string|null, "habits": [string, string, string]}.
Tactic keys: ${TACTIC_KEYS.join(', ')}.`;
  try {
    const { data } = await geminiJSON({ prompt, temperature: 0.7, timeoutMs: 25000 });
    return {
      headline: data.headline || base.headline,
      summary: data.summary || base.summary,
      weakest: TACTIC_KEYS.includes(data.weakest) ? data.weakest : base.weakest,
      habits: Array.isArray(data.habits) && data.habits.length ? data.habits.slice(0, 3) : base.habits,
      source: 'gemini',
    };
  } catch (e) {
    console.warn('[debrief] falling back:', e.message);
    return base;
  }
}
