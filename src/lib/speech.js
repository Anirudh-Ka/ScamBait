// Everything ScamBait says out loud.
//
// Order of preference for each line:
//   1. ElevenLabs through the server (real AI voices, emotion tags)
//   2. A pre-recorded neural clip shipped with the app (built-in calls only)
//   3. The best voice installed on the device
//
// Phone calls and voicemails go through a telephone filter so they sound like a
// call, not a studio recording.
import { fetchSpeech } from './api.js';
import { recordedClip } from '../voices/index.js';
import { stripTags } from '../../shared/voicekey.js';

const LANG_CODES = {
  English: 'en-US',
  Spanish: 'es-US',
  Vietnamese: 'vi-VN',
  Hindi: 'hi-IN',
  'Chinese (Simplified)': 'zh-CN',
  Tagalog: 'fil-PH',
  Korean: 'ko-KR',
  Arabic: 'ar-SA',
  French: 'fr-FR',
  Telugu: 'te-IN',
};

let current = null;
let ctx = null;
let noiseBuffer = null;
const prefetched = new Map();

/* ---------- Web Audio ---------- */

function audioCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Browsers only allow sound after a tap. Call this from any click handler once.
export function unlockAudio() {
  const c = audioCtx();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start(0);
  if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
}

function softClip(amount) {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  return curve;
}

function pinkNoise(c) {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer;
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  noiseBuffer = buf;
  return buf;
}

// Narrow-band telephone sound: 300 to 3,400 Hz, a midrange bump, light
// saturation and heavy compression, like a cell call.
function phoneChain(c) {
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 320;
  hp.Q.value = 0.8;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3300;
  lp.Q.value = 0.8;
  const mid = c.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1700;
  mid.Q.value = 0.9;
  mid.gain.value = 5;
  const shaper = c.createWaveShaper();
  shaper.curve = softClip(2.4);
  shaper.oversample = '2x';
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -28;
  comp.knee.value = 6;
  comp.ratio.value = 6;
  comp.attack.value = 0.003;
  comp.release.value = 0.2;
  const out = c.createGain();
  out.gain.value = 1.35;
  hp.connect(lp).connect(mid).connect(shaper).connect(comp).connect(out).connect(c.destination);
  return hp;
}

function lineNoise(c) {
  const src = c.createBufferSource();
  src.buffer = pinkNoise(c);
  src.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1200;
  bp.Q.value = 0.6;
  const g = c.createGain();
  g.gain.value = 0.018;
  src.connect(bp).connect(g).connect(c.destination);
  return src;
}

async function playArrayBuffer(ab, { phone, onProgress, onEnd }, ctl) {
  const c = audioCtx();
  if (!c) throw new Error('No Web Audio');
  const buf = await new Promise((resolve, reject) => {
    const p = c.decodeAudioData(ab.slice(0), resolve, reject);
    if (p && p.then) p.then(resolve, reject);
  });
  if (ctl.cancelled) return;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(phone ? phoneChain(c) : c.destination);
  const noise = phone ? lineNoise(c) : null;
  const t0 = c.currentTime + 0.06;
  noise?.start(c.currentTime);
  src.start(t0);
  const timer = setInterval(() => onProgress?.(Math.min(1, Math.max(0, (c.currentTime - t0) / buf.duration))), 120);
  const cleanup = () => {
    clearInterval(timer);
    try {
      noise?.stop();
    } catch {
      /* already stopped */
    }
  };
  src.onended = () => {
    cleanup();
    if (ctl.cancelled) return;
    onProgress?.(1);
    onEnd?.();
  };
  ctl.stop = () => {
    ctl.cancelled = true;
    cleanup();
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
  };
}

// Plain <audio> playback, used only if Web Audio can't decode the file.
function playElement(blob, { onProgress, onEnd }, ctl) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  ctl.stop = () => {
    ctl.cancelled = true;
    audio.pause();
    URL.revokeObjectURL(url);
  };
  audio.ontimeupdate = () => audio.duration && onProgress?.(audio.currentTime / audio.duration);
  audio.onended = () => {
    URL.revokeObjectURL(url);
    if (ctl.cancelled) return;
    onProgress?.(1);
    onEnd?.();
  };
  return audio.play();
}

/* ---------- Device voices ---------- */

const FEMALE = /(female|woman|samantha|victoria|karen|moira|tessa|fiona|zira|aria|jenny|michelle|ava\b|allison|susan|serena|emma|olivia|sonia|natasha|libby|clara|salli|joanna|kendra|kimberly|ivy|nicole|catherine|zoe|paulina|monica|lekha|kanya|mei-jia|ting-ting|yuna|amelie|anna|alice|ellen|sara\b|nora|laura|luciana|joana|elena|lucia|helena|ximena|dalia|swara|neerja|hoaimy|xiaoxiao)/i;
const MALE = /(\bmale\b|daniel|alex\b|fred|tom\b|aaron|guy\b|christopher|eric\b|roger|ryan|davis|david|mark\b|george|james|brian|andrew|thomas|arthur|oliver|rishi|reed|evan|nathan|jorge|diego|juan|luca|prabhat|madhur|namminh|yunxi|alvaro|tony|steffan|brandon|jason)/i;
const NOVELTY = /(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|ralph|junior|kathy|princess|espeak|compact|eloquence|grandma|grandpa|rocko|shelley|flo\b|reed\b|sandy)/i;

let voicesPromise = null;
function loadVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length) return Promise.resolve(now);
  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      const done = () => resolve(window.speechSynthesis.getVoices());
      window.speechSynthesis.addEventListener?.('voiceschanged', done, { once: true });
      setTimeout(done, 1200);
    });
  }
  return voicesPromise;
}

function genderOf(voice) {
  if (/female|woman/.test(voice)) return 'female';
  if (/male|man/.test(voice)) return 'male';
  return null;
}

export function pickDeviceVoice(voices, langCode, gender) {
  const base = langCode.split('-')[0];
  let best = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const lang = (v.lang || '').replace('_', '-');
    let s;
    if (lang.toLowerCase() === langCode.toLowerCase()) s = 20;
    else if (lang.split('-')[0].toLowerCase() === base) s = 12;
    else continue;
    const n = v.name || '';
    if (/natural|neural/i.test(n)) s += 12;
    if (/online/i.test(n)) s += 6;
    if (/premium|enhanced|siri/i.test(n)) s += 7;
    if (/google/i.test(n)) s += 4;
    if (NOVELTY.test(n)) s -= 40;
    const isF = FEMALE.test(n);
    const isM = !isF && MALE.test(n);
    if (gender === 'female') s += isF ? 5 : isM ? -6 : 0;
    if (gender === 'male') s += isM ? 5 : isF ? -6 : 0;
    if (v.default) s += 1;
    if (s > bestScore) {
      bestScore = s;
      best = v;
    }
  }
  return best;
}

const PROSODY = {
  panicked: { rate: 1.12, pitch: 1.1 },
  official: { rate: 0.97, pitch: 0.95 },
  pushy: { rate: 1.06, pitch: 1 },
  friendly: { rate: 1, pitch: 1.02 },
  annoyed: { rate: 1, pitch: 0.94 },
};

function chunks(text) {
  const parts = text.match(/[^.!?…]+[.!?…]*["')\]]*\s*/g) || [text];
  const out = [];
  for (const p of parts) {
    if (out.length && (out[out.length - 1] + p).length < 180) out[out.length - 1] += p;
    else out.push(p);
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

async function speakDevice(text, { voice, emotion, language, onProgress, onEnd }, ctl) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const voices = await loadVoices();
  if (ctl.cancelled) return true;
  const langCode = LANG_CODES[language] || 'en-US';
  const picked = pickDeviceVoice(voices, langCode, genderOf(voice));
  const prosody = PROSODY[emotion] || { rate: 0.98, pitch: 1 };
  const young = /^young/.test(voice || '');
  // Chrome cuts off long utterances, so speak sentence by sentence.
  const parts = chunks(text);
  const total = text.length || 1;
  let done = 0;
  let i = 0;
  const synth = window.speechSynthesis;
  const next = () => {
    if (ctl.cancelled) return;
    if (i >= parts.length) {
      onProgress?.(1);
      onEnd?.();
      return;
    }
    const part = parts[i++];
    const u = new SpeechSynthesisUtterance(part);
    u.lang = picked?.lang || langCode;
    if (picked) u.voice = picked;
    u.rate = prosody.rate;
    u.pitch = Math.min(2, prosody.pitch + (young ? 0.06 : 0));
    u.onboundary = (e) => onProgress?.(Math.min(0.99, (done + e.charIndex) / total));
    u.onend = () => {
      done += part.length + 1;
      onProgress?.(Math.min(0.99, done / total));
      next();
    };
    u.onerror = u.onend;
    synth.speak(u);
  };
  ctl.stop = () => {
    ctl.cancelled = true;
    synth.cancel();
  };
  synth.cancel();
  next();
  return true;
}

/* ---------- Public API ---------- */

export function stopSpeech() {
  if (current) current.stop();
  current = null;
}

const speechKey = (text, voice, emotion) => `${voice}|${emotion || ''}|${text}`;

// Start fetching a line before it is needed, so the call has no awkward silence.
export function prefetchSpeech(text, { voice = 'narrator', emotion } = {}) {
  const key = speechKey(text, voice, emotion);
  if (!prefetched.has(key)) prefetched.set(key, fetchSpeech({ text, voice, emotion }));
  return prefetched.get(key);
}

// voice: narrator | young_male | young_female | adult_male | adult_female | older_male | older_female
// emotion: panicked | official | pushy | friendly | annoyed (calls only)
// phone: true for calls and voicemail
// onSource receives 'elevenlabs' | 'recorded' | 'device' | 'none'
export async function speak(text, { voice = 'narrator', emotion, language = 'English', phone = false, onProgress, onEnd, onSource } = {}) {
  stopSpeech();
  const ctl = { cancelled: false, source: 'pending', stop() { this.cancelled = true; } };
  current = ctl;
  const opts = { phone, onProgress, onEnd };

  // 1. ElevenLabs
  const key = speechKey(text, voice, emotion);
  const pending = prefetched.get(key) || fetchSpeech({ text, voice, emotion });
  prefetched.delete(key);
  const blob = await pending;
  if (ctl.cancelled) return ctl;
  if (blob) {
    try {
      await playArrayBuffer(await blob.arrayBuffer(), opts, ctl);
      ctl.source = 'elevenlabs';
      onSource?.('elevenlabs');
      return ctl;
    } catch {
      try {
        await playElement(blob, opts, ctl);
        ctl.source = 'elevenlabs';
        onSource?.('elevenlabs');
        return ctl;
      } catch {
        /* fall through */
      }
    }
  }

  // 2. Pre-recorded clip for built-in lines
  const clip = language === 'English' ? recordedClip(text) : null;
  if (clip) {
    try {
      const ab = await (await fetch(clip)).arrayBuffer();
      if (ctl.cancelled) return ctl;
      await playArrayBuffer(ab, opts, ctl);
      ctl.source = 'recorded';
      onSource?.('recorded');
      return ctl;
    } catch {
      /* fall through */
    }
  }

  // 3. Device voice
  const plain = stripTags(text);
  if (await speakDevice(plain, { voice, emotion, language, onProgress, onEnd }, ctl)) {
    if (!ctl.cancelled) {
      ctl.source = 'device';
      onSource?.('device');
    }
    return ctl;
  }

  ctl.source = 'none';
  onSource?.('none');
  onProgress?.(1);
  onEnd?.();
  return ctl;
}

// An original two-bar ringtone, synthesized so there is no audio file to load.
export function startRingtone() {
  const c = audioCtx();
  let stopped = false;
  let timer;
  if (!c) return () => {};
  const master = c.createGain();
  master.gain.value = 0.12;
  master.connect(c.destination);
  const notes = [659.25, 830.61, 987.77, 830.61]; // E5 G#5 B5 G#5
  const ring = () => {
    if (stopped) return;
    const t = c.currentTime + 0.03;
    for (let bar = 0; bar < 2; bar++) {
      notes.forEach((f, i) => {
        const st = t + bar * 0.8 + i * 0.17;
        for (const [mult, level] of [[1, 1], [2, 0.25]]) {
          const o = c.createOscillator();
          o.type = mult === 1 ? 'triangle' : 'sine';
          o.frequency.value = f * mult;
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, st);
          g.gain.exponentialRampToValueAtTime(level, st + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, st + 0.22);
          o.connect(g).connect(master);
          o.start(st);
          o.stop(st + 0.24);
        }
      });
    }
    try {
      navigator.vibrate?.([450, 200, 450]);
    } catch {
      /* not supported */
    }
    timer = setTimeout(ring, 2800);
  };
  ring();
  return () => {
    stopped = true;
    clearTimeout(timer);
    master.gain.setTargetAtTime(0, c.currentTime, 0.03);
    setTimeout(() => master.disconnect(), 400);
    try {
      navigator.vibrate?.(0);
    } catch {
      /* not supported */
    }
  };
}
