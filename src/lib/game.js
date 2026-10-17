// Scoring rules. Kept simple and visible so the debrief can explain every point.
export const POINTS = { verdict: 100, tactic: 20, wrongTactic: 10, falseAlarm: 25 };

export function scoreReport(message, picked = []) {
  if (!message.isScam) {
    return { outcome: 'false_alarm', points: POINTS.falseAlarm, lost: 0, picked };
  }
  const correct = picked.filter((t) => message.tactics.includes(t));
  const wrong = picked.filter((t) => !message.tactics.includes(t));
  const missed = message.tactics.filter((t) => !picked.includes(t));
  const bonus = Math.max(0, correct.length * POINTS.tactic - wrong.length * POINTS.wrongTactic);
  return { outcome: 'caught', points: POINTS.verdict + bonus, lost: 0, picked, correct, wrong, missed };
}

export function scoreTrust(message, balance) {
  if (!message.isScam) return { outcome: 'trusted_legit', points: POINTS.verdict, lost: 0 };
  return { outcome: 'fooled', points: 0, lost: Math.min(balance, message.askAmount) };
}

export function scorePaid(message, balance) {
  return { outcome: 'paid', points: 0, lost: Math.min(balance, message.askAmount) };
}

export const VERDICTS = {
  caught: { title: 'Scam caught', tone: 'good' },
  fooled: { title: 'You got scammed', tone: 'bad' },
  paid: { title: 'You paid a scammer', tone: 'bad' },
  trusted_legit: { title: 'Real message, good call', tone: 'good' },
  false_alarm: { title: 'False alarm, but no harm done', tone: 'neutral' },
};

export function money(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US');
}

const METHOD_NOTES = [
  [/gift/i, 'Gift card codes are spent within minutes and cannot be traced or refunded.'],
  [/wire/i, 'Wire transfers usually cannot be reversed once the money lands.'],
  [/crypto|usdt|wallet|coin|token/i, 'Crypto transfers are final. There is no bank to call and no chargeback.'],
  [/login|code|password/i, 'With your login and one-time code, they move your money themselves.'],
  [/holding|safe|secure/i, 'There is no such thing as a "safe account". It belongs to the scammer.'],
  [/app|deposit/i, 'Fake trading apps show fake profits. Withdrawals never work.'],
];

export function methodNote(method = '') {
  return METHOD_NOTES.find(([re]) => re.test(method))?.[1] || 'Money sent to a scammer is rarely recovered.';
}

export function voiceFor(message) {
  return message.scamType === 'voice_clone' ? 'family' : 'scammer';
}
