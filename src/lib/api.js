// Talks to the ScamBait server. If the server is unreachable (static hosting,
// a crashed backend mid-demo), every call falls back to the same offline logic
// the server uses, so the game keeps working.
import { getPersona } from '../../shared/personas.js';
import { buildSeedScenario } from '../../shared/seed.js';
import { fallbackReply, fallbackDebrief } from '../../shared/offline.js';

let offline = false;
const localAccounts = {};

const LOCAL_PURCHASES = {
  rosa: { merchant: 'Sunrise Pharmacy', amount: 23.4 },
  priya: { merchant: 'Campus Bookstore', amount: 38.99 },
  linh: { merchant: 'Pho Saigon Kitchen', amount: 27.5 },
  devon: { merchant: 'Hardware Depot', amount: 56.78 },
};

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Network errors and 5xx (including the dev proxy when the API is down) switch to offline mode.
function shouldFallBack(e) {
  return !e.status || e.status >= 500;
}

export function newSessionId() {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {
    /* randomUUID needs a secure context; fall through */
  }
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export async function getHealth() {
  // Opened straight from a file: there is no server to ask.
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    offline = true;
    return { ok: false, offline: true, integrations: { gemini: false, elevenlabs: false, nessie: false } };
  }
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!data?.ok) throw new Error();
    return data;
  } catch {
    offline = true;
    return { ok: false, offline: true, integrations: { gemini: false, elevenlabs: false, nessie: false } };
  }
}

function localAccount(sessionId) {
  const a = localAccounts[sessionId];
  const sentTotal = a.sent.reduce((s, t) => s + t.amount, 0);
  return { live: false, source: 'mock', accountId: 'practice', startBalance: a.start, balance: Math.max(0, a.start - sentTotal), purchases: a.purchases, sent: a.sent };
}

export async function startRound({ sessionId, personaId, language, difficulty, useMe }) {
  if (!offline) {
    try {
      return await post('/api/start', { sessionId, personaId, language, difficulty, useMe });
    } catch (e) {
      if (!shouldFallBack(e)) throw e;
      offline = true;
    }
  }
  const persona = getPersona(personaId);
  const purchase = LOCAL_PURCHASES[persona.id];
  localAccounts[sessionId] = { start: persona.balance, sent: [], purchases: purchase ? [purchase] : [] };
  return {
    persona,
    account: localAccount(sessionId),
    scenario: { ...buildSeedScenario(persona, { purchase }), note: 'Playing offline with the built-in scenario pack.' },
    integrations: { gemini: false, elevenlabs: false, nessie: false },
  };
}

export async function sendMoney({ sessionId, amount, recipient, method, messageId }) {
  if (!offline) {
    try {
      return await post('/api/send', { sessionId, amount, recipient, method, messageId });
    } catch (e) {
      if (!shouldFallBack(e) && e.status !== 400) throw e;
      if (!localAccounts[sessionId]) throw e;
    }
  }
  const a = localAccounts[sessionId];
  a.sent.push({ id: `tx-${Date.now()}`, amount: Math.round(amount), recipient, method, messageId, at: new Date().toISOString(), via: 'mock' });
  return localAccount(sessionId);
}

export async function scammerReply({ message, history, persona, language }) {
  if (!offline) {
    try {
      return await post('/api/chat', { message, history, persona, language });
    } catch (e) {
      if (!shouldFallBack(e)) throw e;
    }
  }
  await new Promise((r) => setTimeout(r, 700));
  return fallbackReply({ message, history });
}

export async function getDebrief({ persona, results, lost, saved, language }) {
  if (!offline) {
    try {
      return await post('/api/debrief', { persona, results, lost, saved, language });
    } catch (e) {
      if (!shouldFallBack(e)) throw e;
    }
  }
  return fallbackDebrief({ results, lost });
}

// Returns an audio Blob from ElevenLabs, or null when it isn't available.
export async function fetchSpeech({ text, voice, emotion }) {
  if (offline) return null;
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, emotion }),
    });
    if (res.status !== 200) return null;
    return await res.blob();
  } catch {
    return null;
  }
}
