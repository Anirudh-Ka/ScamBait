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
    // eleven_flash_v2_5: ~75 ms latency, 32 languages, cheapest per character.
    model: process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5',
    // Default premade voices. Override with your own voice IDs from the ElevenLabs voice library.
    voices: {
      scammer: process.env.ELEVENLABS_VOICE_SCAMMER || 'JBFqnCBsd6RMkjVDRZzb',
      narrator: process.env.ELEVENLABS_VOICE_NARRATOR || process.env.ELEVENLABS_VOICE_SCAMMER || 'JBFqnCBsd6RMkjVDRZzb',
      family: process.env.ELEVENLABS_VOICE_FAMILY || process.env.ELEVENLABS_VOICE_SCAMMER || 'JBFqnCBsd6RMkjVDRZzb',
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
