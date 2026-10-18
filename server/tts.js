import { config } from './config.js';

// Models that understand inline audio tags such as [panicked] or [whispers].
const TAG_MODELS = new Set(['eleven_v4', 'eleven_v4_turbo', 'eleven_v3']);

// Old role names from the first version still work.
const ALIASES = { scammer: 'adult_male', family: 'young_male' };

// How each kind of call line should be delivered when the script has no tags of its own.
const LEADS = {
  panicked: '[panicked, out of breath, voice shaking]',
  official: '[calm, professional, slightly rushed]',
  pushy: '[impatient, pressuring]',
  friendly: '[warm, casual, persuasive]',
  annoyed: '[annoyed, cold]',
};

const cache = new Map();
let workingModel = null;
export const ttsStatus = { lastModel: null, lastError: null };

export function stripTags(text) {
  return String(text || '')
    .replace(/\[[^\]\n]{1,80}\]\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function perform(text, emotion, supportsTags) {
  if (!supportsTags) return stripTags(text);
  if (/\[[^\]\n]{1,80}\]/.test(text)) return text; // already directed (seed scripts, Gemini)
  const lead = LEADS[emotion];
  return lead ? `${lead} ${text}` : text;
}

function settingsFor(model, emotion) {
  if (TAG_MODELS.has(model)) {
    // v3 only accepts 0, 0.5 or 1 for stability; 0.5 ("Natural") also works on v4.
    return { stability: 0.5, similarity_boost: 0.75 };
  }
  const emotional = emotion === 'panicked' || emotion === 'pushy';
  return { stability: emotional ? 0.3 : 0.45, similarity_boost: 0.8, style: emotional ? 0.55 : 0.25, use_speaker_boost: true };
}

export function resolveVoice(voice) {
  const role = ALIASES[voice] || voice;
  return config.eleven.voices[role] || config.eleven.voices.adult_male;
}

async function post(voiceId, body) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    return await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': config.eleven.key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

// Returns an mp3 Buffer, or null when ElevenLabs is not configured or fails
// (the browser then uses a pre-recorded clip or its own voice).
// emotion: panicked | official | pushy | friendly | annoyed | undefined (narration)
export async function speak({ text, voice = 'narrator', emotion } = {}) {
  if (!config.eleven.key || !text) return null;
  let voiceId = resolveVoice(voice);
  const models = workingModel ? [workingModel, ...config.eleven.models.filter((m) => m !== workingModel)] : config.eleven.models;

  for (const model of models) {
    const script = perform(text, emotion, TAG_MODELS.has(model)).slice(0, 2900);
    const key = `${model}|${voiceId}|${emotion || ''}|${script}`;
    if (cache.has(key)) return cache.get(key);

    // Try with tuned settings, then with the voice's defaults if the model rejects them.
    for (const withSettings of [true, false]) {
      try {
        const body = { text: script, model_id: model };
        if (withSettings) body.voice_settings = settingsFor(model, emotion);
        let res = await post(voiceId, body);
        if (res.status === 404 && voiceId !== resolveVoice('adult_male')) {
          console.warn(`[tts] voice ${voiceId} not found, using the default voice`);
          voiceId = resolveVoice('adult_male');
          res = await post(voiceId, body);
        }
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          workingModel = model;
          ttsStatus.lastModel = model;
          ttsStatus.lastError = null;
          if (cache.size > 300) cache.clear();
          cache.set(key, buf);
          return buf;
        }
        const detail = (await res.text()).slice(0, 300);
        ttsStatus.lastError = `${model} ${res.status}: ${detail}`;
        console.warn('[tts]', ttsStatus.lastError);
        if (res.status === 401 || res.status === 429) return null; // bad key or out of credits
        if (res.status === 400 || res.status === 422) continue; // maybe the settings: retry without
        break; // 403 (model not on plan), 5xx: next model
      } catch (e) {
        ttsStatus.lastError = `${model}: ${e.message}`;
        console.warn('[tts] failed:', e.message);
        break;
      }
    }
  }
  return null;
}
