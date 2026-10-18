// Checks your real API keys with tiny requests and explains any failure.
//   npm run doctor            test Gemini, ElevenLabs and Nessie
//   npm run voices            also save one sample per caller voice to voice-samples/
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../server/config.js';
import { gemini } from '../server/gemini.js';
import { speak, ttsStatus } from '../server/tts.js';

const wantSamples = process.argv.includes('--voices');
const outDir = path.resolve('voice-samples');
const ok = (s) => console.log(`  \x1b[32mok\x1b[0m   ${s}`);
const bad = (s) => console.log(`  \x1b[31mfail\x1b[0m ${s}`);
const off = (s) => console.log(`  \x1b[33moff\x1b[0m  ${s}`);

async function checkGemini() {
  console.log('\nGemini');
  if (!config.gemini.key) return off('GEMINI_API_KEY is not set. Built-in scenarios will be used.');
  try {
    const { text, model } = await gemini({ prompt: 'Reply with the single word OK.', temperature: 0, timeoutMs: 30000 });
    ok(`${model} answered "${text.trim().slice(0, 20)}"`);
  } catch (e) {
    bad(e.message.slice(0, 300));
    if (e.status === 400 && /API key/i.test(e.message)) console.log('       The key looks wrong. Copy it again from aistudio.google.com/apikey.');
    if (e.status === 404) console.log('       None of the models in GEMINI_MODEL are available to this key. Try GEMINI_MODEL=gemini-flash-latest.');
    if (e.status === 429) console.log('       Rate limit or quota hit. Wait a minute or use another key.');
  }
}

const SAMPLES = {
  young_male: ['[panicked, out of breath] Abuela? It\'s me... I\'m in trouble. Please don\'t tell my mom, okay?', 'panicked'],
  young_female: ['[panicked, voice shaking] Dad? It\'s me. I messed up, I really need your help right now.', 'panicked'],
  adult_male: ['[calm, professional] Hello, this is Officer Daniel Reyes from the fraud protection unit. Please stay on the line.', 'official'],
  adult_female: ['[calm, professional] Hi, this is Karen from account security. We noticed an unusual sign-in on your account.', 'official'],
  older_male: ['[warm, casual] Hey there, friend. I\'ve got an opportunity I only share with people I trust.', 'friendly'],
  older_female: ['[warm, casual] Hi sweetie, I found the most wonderful investment club through church.', 'friendly'],
  narrator: ['Harborline Bank. Your quarterly statement is ready. Open the app to view it.', undefined],
};

async function checkEleven() {
  console.log('\nElevenLabs');
  if (!config.eleven.key) return off('ELEVENLABS_API_KEY is not set. Recorded clips and device voices will be used.');
  const [text, emotion] = SAMPLES.adult_male;
  const audio = await speak({ text, voice: 'adult_male', emotion });
  if (!audio) {
    bad(ttsStatus.lastError || 'no audio returned');
    const e = ttsStatus.lastError || '';
    if (/ 401/.test(e)) console.log('       The key is wrong or was revoked. Create a new one under Profile > API keys.');
    if (/ 403/.test(e)) console.log('       The key is missing the Text to Speech permission, or the model is not on your plan. Try ELEVENLABS_MODEL=eleven_multilingual_v2.');
    if (/ 429/.test(e) || /quota/i.test(e)) console.log('       Out of characters for this month, or too many requests at once.');
    return;
  }
  ok(`${ttsStatus.lastModel} spoke ${audio.length.toLocaleString()} bytes of audio${/eleven_v[34]/.test(ttsStatus.lastModel) ? ' (emotion tags on)' : ' (emotion tags off on this model)'}`);
  if (!wantSamples) return console.log('       Run "npm run voices" to hear every caller voice.');
  fs.mkdirSync(outDir, { recursive: true });
  for (const [role, [line, emo]] of Object.entries(SAMPLES)) {
    const buf = await speak({ text: line, voice: role, emotion: emo });
    if (buf) {
      fs.writeFileSync(path.join(outDir, `${role}.mp3`), buf);
      ok(`voice-samples/${role}.mp3  (${config.eleven.voices[role]})`);
    } else bad(`${role}: ${ttsStatus.lastError}`);
  }
  console.log('       Don\'t like one? Set ELEVENLABS_VOICE_<ROLE> in .env to any voice ID from the ElevenLabs voice library.');
}

async function checkNessie() {
  console.log('\nCapital One Nessie');
  if (!config.nessie.key) return off('NESSIE_API_KEY is not set. A practice account will be used.');
  for (const base of config.nessie.bases) {
    try {
      const res = await fetch(`${base}/customers?key=${encodeURIComponent(config.nessie.key)}`, { signal: AbortSignal.timeout(12000) });
      const body = await res.text();
      if (res.ok) {
        const n = JSON.parse(body).length;
        return ok(`${base} works, ${n} customer${n === 1 ? '' : 's'} on this key`);
      }
      bad(`${base} ${res.status}: ${body.slice(0, 160)}`);
    } catch (e) {
      bad(`${base}: ${e.message}`);
    }
  }
  console.log('       If every URL fails with 401, the key is wrong. Copy it from your Nessie profile page.');
}

await checkGemini();
await checkEleven();
await checkNessie();
console.log('');
