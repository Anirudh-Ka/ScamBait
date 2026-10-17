import { geminiJSON } from './gemini.js';
import { config } from './config.js';
import { fallbackReply } from '../shared/offline.js';
import { TACTIC_KEYS } from '../shared/tactics.js';

const SYSTEM = `You play the sender of a scam message inside ScamBait, a fraud-awareness training simulator. The player knows this is a training game and is practicing how to respond to scammers. Your role is to behave the way real scammers do, so the player can practice refusing, verifying and reporting.

Rules:
- Stay in character as the sender. Match the channel: short texting style for sms and dm, a bit more formal for email, spoken words for a call.
- Each turn, escalate pressure using the persuasion tactics of this scam. Steer toward getting the money described.
- If the player tries to verify (call back on an official number, ask for a license, mention reporting or family), deflect the way scammers do: discourage them, add urgency, or offer fake proof.
- Keep replies under 60 words.
- Only use the fictional names, numbers and websites already in the original message. Never mention real companies, apps, coins or websites.
- Never give instructions useful for committing fraud. No sexual content, slurs or threats of violence. Pressure, not abuse.
- If the player clearly refuses three times or says they are reporting you, send one short final line (an angry or guilt-tripping sign-off) and set "ended" to true.

Return JSON: {"reply": string, "tactics": [tactic keys you used], "pressure": 1-5, "asksForMoney": boolean, "ended": boolean}
Tactic keys: ${TACTIC_KEYS.join(', ')}.`;

export async function scammerReply({ message, history = [], persona, language = 'English' }) {
  // Legit senders never roleplay a scam: they get a canned, harmless auto-reply.
  if (!config.gemini.key || !message.isScam) return fallbackReply({ message, history });
  const transcript = history.map((h) => `${h.from === 'you' ? 'PLAYER' : 'YOU (scammer)'}: ${h.text}`).join('\n');
  const prompt = `Original ${message.channel} message you sent, from "${message.sender?.name}" (${message.sender?.handle}):
"""${message.subject ? message.subject + '\n' : ''}${message.body}"""

Scam type: ${message.scamType}. Tactics: ${(message.tactics || []).join(', ')}.
Goal: get $${message.askAmount} via ${message.ask?.method || 'a transfer'} to ${message.ask?.recipient || 'you'}.
Player: ${persona?.name || 'the player'}${persona?.age ? `, age ${persona.age}` : ''}.

Conversation so far:
${transcript || '(the player has just opened your message and is about to reply)'}

Write your next reply in ${language}.`;
  try {
    const { data } = await geminiJSON({ system: SYSTEM, prompt, temperature: 0.9, timeoutMs: 25000 });
    if (!data?.reply) throw new Error('empty reply');
    return {
      reply: String(data.reply).slice(0, 600),
      tactics: (data.tactics || []).filter((t) => TACTIC_KEYS.includes(t)),
      pressure: Math.max(1, Math.min(5, Number(data.pressure) || 3)),
      asksForMoney: Boolean(data.asksForMoney),
      ended: Boolean(data.ended),
      source: 'gemini',
    };
  } catch (e) {
    console.warn('[chat] falling back:', e.message);
    return fallbackReply({ message, history });
  }
}
