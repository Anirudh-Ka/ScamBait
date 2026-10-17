import { config } from './config.js';

const cache = new Map();

// Returns an mp3 Buffer, or null when ElevenLabs is not configured or fails
// (the browser then falls back to its built-in speech synthesis).
export async function speak({ text, voice = 'scammer' }) {
  if (!config.eleven.key || !text) return null;
  const voiceId = config.eleven.voices[voice] || config.eleven.voices.scammer;
  const key = `${voiceId}:${text}`;
  if (cache.has(key)) return cache.get(key);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': config.eleven.key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: text.slice(0, 2500),
        model_id: config.eleven.model,
        voice_settings: voice === 'family' ? { stability: 0.3, similarity_boost: 0.8, style: 0.6 } : { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.warn('[tts] ElevenLabs', res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (cache.size > 200) cache.clear();
    cache.set(key, buf);
    return buf;
  } catch (e) {
    console.warn('[tts] failed:', e.message);
    return null;
  } finally {
    clearTimeout(t);
  }
}
