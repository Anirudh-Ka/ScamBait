import { geminiJSON } from './gemini.js';
import { config } from './config.js';
import { TACTIC_KEYS, SCAM_TYPES } from '../shared/tactics.js';
import { buildSeedScenario, askAmount } from '../shared/seed.js';

const BANK = 'Harborline Bank';
const BROKER = 'Tidewater Investments';
const TIMES = ['9:12 AM', '10:47 AM', '12:03 PM', '1:36 PM', '3:20 PM', '5:58 PM', '7:14 PM'];

const SCHEMA = {
  type: 'object',
  properties: {
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          channel: { type: 'string', enum: ['sms', 'email', 'dm', 'call'] },
          senderName: { type: 'string' },
          senderHandle: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' },
          isScam: { type: 'boolean' },
          scamType: { type: 'string', enum: [...Object.keys(SCAM_TYPES), 'none'] },
          tactics: { type: 'array', items: { type: 'string', enum: TACTIC_KEYS } },
          redFlags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                quote: { type: 'string' },
                tactic: { type: 'string', enum: TACTIC_KEYS },
                why: { type: 'string' },
              },
              required: ['quote', 'tactic', 'why'],
            },
          },
          legitSigns: {
            type: 'array',
            items: {
              type: 'object',
              properties: { quote: { type: 'string' }, why: { type: 'string' } },
              required: ['quote', 'why'],
            },
          },
          askMethod: { type: 'string' },
          askRecipient: { type: 'string' },
          askAmountUSD: { type: 'number' },
          verify: { type: 'string' },
        },
        required: ['channel', 'senderName', 'senderHandle', 'body', 'isScam', 'scamType', 'tactics', 'redFlags', 'legitSigns', 'verify'],
      },
    },
  },
  required: ['messages'],
};

const SYSTEM = `You write content for ScamBait, a fraud-awareness training game. Players read a simulated phone inbox and decide which messages are scams. Your job is to write realistic, educational examples so people learn to recognize investment and banking fraud before it happens to them.

Hard rules:
- Everything is fictional. Never use the name of a real company, bank, app, exchange, coin, person or website. The player's own bank is "${BANK}" and their brokerage is "${BROKER}". Invent every other name.
- Phone numbers must look like +1 (555) 01X-XXXX. Web addresses must be invented and are shown as plain text, never as working links.
- A scam may falsely claim approval by a generic regulator (for example "SEC-approved") only when a red flag then explains why that claim is false.
- Write only what the target would see or hear. Never include instructions for how to run a scam, launder money or evade detection.
- No sexual content, slurs or threats of violence.
- Every red flag "quote" and legit sign "quote" must be copied character for character from that message's body or senderHandle. 3 to 12 words. Do not paraphrase.
- Explanations ("why") are one or two plain sentences at a 6th grade reading level, accurate, and never overstate. Teach the general rule, not just this case.`;

function buildPrompt({ persona, language, difficulty, nessie }) {
  const purchases = nessie?.purchases?.length
    ? `Their real recent card purchases (from their bank data): ${nessie.purchases
        .slice(0, 5)
        .map((p) => `${p.merchant} ($${Number(p.amount).toFixed(2)})`)
        .join(', ')}. Use one of these in the legitimate bank purchase alert. For one scam, show how scammers exploit leaked purchase data by referencing one of these merchants.`
    : '';

  const level = {
    easy: 'EASY: scams are clumsy, with 3 to 5 obvious red flags each, odd grammar and wild promises.',
    medium: 'MEDIUM: scams look polished, like the ones that fool real people, with 2 to 4 red flags each.',
    hard: 'HARD: scams are personalized and calm, with only 2 or 3 subtle red flags. The legitimate messages should look close enough to scams that the player has to think.',
  }[difficulty] || '';

  return `Write a one-day inbox for this player:
Name: ${persona.name}, age ${persona.age ?? 'unknown'}
Situation: ${persona.situation}
Goals: ${persona.goals}
Scammers usually target them with: ${(persona.targetedBy || []).join(', ')}
Account balance: about $${Math.round(persona.balance)}
${persona.relative ? `Family: their ${persona.relative.role} ${persona.relative.name} calls them "${persona.relative.callsYou}".` : ''}
${purchases}

Difficulty: ${level}

Write exactly 6 messages in this order of variety (shuffle the order in the output):
- 4 scams and 2 legitimate messages.
- Exactly 1 message has channel "call". It is a scam. Its body is the spoken words of the caller, 60 to 90 words, natural speech with pauses and filler, as if transcribed.
- Across the 4 scams, cover all three of: an ETF or fund scam, a digital asset or tokenization scam, and an AI-related scam (AI trading bot or AI voice impersonation).
- Use a mix of channels: sms, email, dm.
- Legitimate messages: scamType "none", tactics [], redFlags [], 2 or 3 legitSigns, askAmountUSD 0. They should model what real institutions do (no links to click, no pressure, point you to channels you already trust).
- Scams: 2 to 5 redFlags, legitSigns [], askAmountUSD is what the scam ultimately takes from this person (realistic for their balance), askMethod (for example "wire transfer", "gift cards", "crypto wallet") and askRecipient.
- verify: one sentence on how to check safely.
- Email messages need a subject. Other channels use an empty subject.

Language: write senderName, subject, body, why and verify in ${language}. Keep JSON keys, enums, channel, scamType and tactics in English. Red flag quotes must match the ${language} body exactly.

Return JSON: {"messages": [...]}`;
}

function norm(s) {
  return String(s || '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Returns the exact substring of haystack that matches needle, ignoring case,
// curly quotes and whitespace differences. Null if not found.
export function findExact(haystack, needle) {
  if (!haystack || !needle) return null;
  const idx = haystack.indexOf(needle);
  if (idx >= 0) return needle;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  const i2 = h.indexOf(n);
  if (i2 >= 0) return haystack.slice(i2, i2 + needle.length);
  // whitespace/quote-insensitive search: build a normalized map
  const map = [];
  let normH = '';
  let prevSpace = false;
  for (let i = 0; i < haystack.length; i++) {
    let c = haystack[i];
    if (/[‘’]/.test(c)) c = "'";
    if (/[“”]/.test(c)) c = '"';
    if (/\s/.test(c)) {
      if (prevSpace) continue;
      c = ' ';
      prevSpace = true;
    } else prevSpace = false;
    normH += c.toLowerCase();
    map.push(i);
  }
  const nn = norm(needle);
  const j = normH.indexOf(nn);
  if (j < 0) return null;
  const start = map[j];
  const end = map[j + nn.length - 1] + 1;
  return haystack.slice(start, end);
}

function sanitizeMessage(raw, i, persona) {
  const body = String(raw.body || '').trim();
  const handle = String(raw.senderHandle || '').trim();
  const isScam = Boolean(raw.isScam);
  const fix = (list, withTactic) =>
    (Array.isArray(list) ? list : [])
      .map((f) => {
        const q = findExact(body, f.quote) || findExact(handle, f.quote);
        if (!q) return null;
        const out = { quote: q, why: String(f.why || '').trim() };
        if (withTactic) out.tactic = TACTIC_KEYS.includes(f.tactic) ? f.tactic : 'urgency';
        return out;
      })
      .filter(Boolean);

  const redFlags = isScam ? fix(raw.redFlags, true) : [];
  const legitSigns = isScam ? [] : fix(raw.legitSigns, false);
  let tactics = (raw.tactics || []).filter((t) => TACTIC_KEYS.includes(t));
  for (const f of redFlags) if (!tactics.includes(f.tactic)) tactics.push(f.tactic);
  if (!isScam) tactics = [];

  const ask = isScam
    ? { method: raw.askMethod || 'payment', recipient: raw.askRecipient || raw.senderName || 'Unknown', amount: Number(raw.askAmountUSD) || undefined, fraction: 0.4 }
    : null;

  return {
    id: `m${i + 1}`,
    time: TIMES[i] || '8:00 PM',
    channel: ['sms', 'email', 'dm', 'call'].includes(raw.channel) ? raw.channel : 'sms',
    sender: { name: String(raw.senderName || 'Unknown').trim(), handle },
    subject: raw.channel === 'email' ? String(raw.subject || '').trim() : '',
    body,
    isScam,
    scamType: isScam && SCAM_TYPES[raw.scamType] ? raw.scamType : isScam ? 'impersonation' : null,
    tactics,
    redFlags,
    legitSigns,
    ask,
    askAmount: isScam ? askAmount(ask, persona.balance) : 0,
    verify: String(raw.verify || '').trim(),
  };
}

export async function generateScenario({ persona, language = 'English', difficulty = 'medium', nessie }) {
  const purchase = nessie?.purchases?.[0];
  if (!config.gemini.key) {
    return { ...buildSeedScenario(persona, { purchase }), note: 'Gemini key not set, using the built-in scenario pack.' };
  }
  try {
    const { data, model } = await geminiJSON({
      system: SYSTEM,
      prompt: buildPrompt({ persona, language, difficulty, nessie }),
      schema: SCHEMA,
      temperature: 1.0,
      timeoutMs: 60000,
    });
    const raw = Array.isArray(data?.messages) ? data.messages : [];
    let messages = raw.slice(0, 7).map((m, i) => sanitizeMessage(m, i, persona)).filter((m) => m.body);
    // A scam with no verifiable red flags is useless for teaching: drop it.
    messages = messages.filter((m) => !m.isScam || m.redFlags.length > 0);
    if (messages.filter((m) => m.isScam).length < 2 || messages.length < 4) throw new Error('Gemini returned too few usable messages');
    // Make sure there is a phone call so the voice moment always happens.
    if (!messages.some((m) => m.channel === 'call')) {
      const seed = buildSeedScenario(persona, { purchase }).messages.find((m) => m.channel === 'call');
      if (seed) messages.splice(2, 0, { ...seed });
    }
    messages = messages.map((m, i) => ({ ...m, id: `m${i + 1}`, time: TIMES[i] || m.time }));
    return { source: 'gemini', model, language, bank: BANK, broker: BROKER, messages };
  } catch (e) {
    console.warn('[scenario] falling back to seed:', e.message);
    return { ...buildSeedScenario(persona, { purchase }), note: 'Live generation failed, using the built-in scenario pack.', error: e.message };
  }
}
