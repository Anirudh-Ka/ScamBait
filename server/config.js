import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 8787),
  gemini: {
    key: process.env.GEMINI_API_KEY || '',
    // Tried in order until one works. gemini-3.8-flash is Google's current stable Flash model.
    models: (process.env.GEMINI_MODEL || 'gemini-3.8-flash,gemini-3.5-flash-lite,gemini-flash-latest')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
  eleven: {
    key: process.env.ELEVENLABS_API_KEY || '',
    // Tried in order. eleven_v4 and eleven_v3 are the expressive models that follow
    // emotion tags like [panicked] or [whispers]; the older ones are fallbacks
    // for plans or regions where those aren't available (tags are stripped for them).
    models: (process.env.ELEVENLABS_MODEL || 'eleven_v4,eleven_v3,eleven_multilingual_v2,eleven_flash_v2_5')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    // One voice per kind of caller, all from ElevenLabs' default (non-legacy) voices.
    // Override any of them with a voice ID from the ElevenLabs voice library.
    voices: {
      // Grandson / brother in the "I'm in trouble" call. Will: young American, casual.
      young_male: process.env.ELEVENLABS_VOICE_YOUNG_MALE || process.env.ELEVENLABS_VOICE_FAMILY || 'bIHbv24MWmeRgasZH58o',
      // Daughter in the "I'm in trouble" call. Jessica: young American, expressive, conversational.
      young_female: process.env.ELEVENLABS_VOICE_YOUNG_FEMALE || 'cgSgspJ2msm6clMCkdW9',
      // Fake bank officer, fake lawyer, fake broker. Eric: American, friendly, conversational.
      adult_male: process.env.ELEVENLABS_VOICE_ADULT_MALE || process.env.ELEVENLABS_VOICE_SCAMMER || 'cjVigY5qzO86Huf0OWal',
      // Female officials. Sarah: young American, soft, newsreader polish.
      adult_female: process.env.ELEVENLABS_VOICE_ADULT_FEMALE || 'EXAVITQu4vr4xnSDxMaL',
      // Older callers. Bill: older American, trustworthy.
      older_male: process.env.ELEVENLABS_VOICE_OLDER_MALE || 'pqHfZKP75CvOlQylNhV4',
      // Matilda: middle-aged American, friendly.
      older_female: process.env.ELEVENLABS_VOICE_OLDER_FEMALE || 'XrExE9yKIg1WjnnlVkGX',
      // Reads messages aloud. Matilda again: clear and warm, not a phone voice.
      narrator: process.env.ELEVENLABS_VOICE_NARRATOR || 'XrExE9yKIg1WjnnlVkGX',
    },
  },
  nessie: {
    key: process.env.NESSIE_API_KEY || '',
    // Probed in order. Nessie has served from both origins.
    bases: (process.env.NESSIE_BASE_URL || 'https://prod-api.nessieisreal.com,http://api.nessieisreal.com')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean),
  },
};

export function integrationStatus() {
  return {
    gemini: Boolean(config.gemini.key),
    elevenlabs: Boolean(config.eleven.key),
    nessie: Boolean(config.nessie.key),
  };
}
