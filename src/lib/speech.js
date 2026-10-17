import { fetchSpeech } from './api.js';

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

export function stopSpeech() {
  if (current) current.stop();
  current = null;
}

// Speaks text with ElevenLabs when the server has a key, otherwise with the
// browser's built-in voice. onProgress receives 0..1 for live captions.
export async function speak(text, { voice = 'narrator', language = 'English', onProgress, onEnd, onSource } = {}) {
  stopSpeech();
  let cancelled = false;
  const ctl = {
    source: 'pending',
    stop() {
      cancelled = true;
    },
  };
  current = ctl;

  const blob = await fetchSpeech({ text, voice });
  if (cancelled) return ctl;

  if (blob) {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    ctl.source = 'elevenlabs';
    ctl.stop = () => {
      cancelled = true;
      audio.pause();
      URL.revokeObjectURL(url);
    };
    audio.ontimeupdate = () => audio.duration && onProgress?.(audio.currentTime / audio.duration);
    audio.onended = () => {
      onProgress?.(1);
      URL.revokeObjectURL(url);
      if (!cancelled) onEnd?.();
    };
    onSource?.('elevenlabs');
    try {
      await audio.play();
      return ctl;
    } catch {
      /* autoplay blocked: fall through to browser speech */
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_CODES[language] || 'en-US';
    u.rate = 0.97;
    const match = window.speechSynthesis.getVoices().find((v) => v.lang === u.lang);
    if (match) u.voice = match;
    // Some browsers never fire boundary events, so also tick a timer for captions.
    const est = Math.max(2500, text.length * 62);
    const started = Date.now();
    const timer = setInterval(() => onProgress?.(Math.min(0.98, (Date.now() - started) / est)), 200);
    u.onboundary = (e) => onProgress?.(e.charIndex / text.length);
    u.onend = () => {
      clearInterval(timer);
      onProgress?.(1);
      if (!cancelled) onEnd?.();
    };
    ctl.source = 'browser';
    ctl.stop = () => {
      cancelled = true;
      clearInterval(timer);
      window.speechSynthesis.cancel();
    };
    onSource?.('browser');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } else {
    ctl.source = 'none';
    onSource?.('none');
    onProgress?.(1);
    onEnd?.();
  }
  return ctl;
}
