// Shared by the browser and the voice-rendering script, so a line of dialogue
// maps to the same pre-recorded clip on both sides.

export function stripTags(text) {
  return String(text || '')
    .replace(/\[[^\]\n]{1,80}\]\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function voiceKey(text) {
  return stripTags(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
