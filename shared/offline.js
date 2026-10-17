// Offline logic shared by the server and the browser, so the game keeps working
// with no API keys and even with no server at all.
import { TACTICS, TACTIC_KEYS } from './tactics.js';
import { seedReplies } from './seed.js';

const GENERIC = {
  urgency: ['I need an answer in the next few minutes or this offer is gone.', 'Time is running out. Please decide now.'],
  authority: ['I am authorized to handle this on your account. This is standard procedure.', 'This is an official matter. Please cooperate so we can protect you.'],
  too_good: ['Honestly, this is the best return you will see anywhere. There is no downside.', 'Our clients have never lost money with us.'],
  secrecy: ['Please keep this between us for now. Others will not understand.', 'Do not mention this to your bank, they will only slow it down.'],
  payment: ['The fastest way is a transfer right now. I will send the details.', 'Gift cards or crypto clear instantly. Bank transfers take too long.'],
  affinity: ['I trust you because we come from the same place. I only share this with people like us.', 'I feel like I can really talk to you.'],
  fomo: ['Everyone in our group already joined. You are one of the last.', 'I only have a few spots left and people are waiting.'],
  jargon: ['Our system uses advanced AI and blockchain settlement, so it is fully secure.', 'The smart contract handles everything automatically.'],
  lookalike: ['Yes, this is the official contact. Our main line is busy today.', 'Please use this number only, the other one is for general questions.'],
};

const VERIFY_WORDS = /(call (you|the bank|them|my bank) back|official|number on (the )?(back|card)|verify|report|police|scam|fraud|fake|ftc|block|my bank|family|husband|wife|son|daughter)/i;

const LEGIT_AUTO = {
  sms: 'This number does not accept replies. For help, use the app or call the number on the back of your card.',
  email: 'This mailbox is not monitored. Please sign in to your account to contact us.',
  dm: 'Sounds good! See you there 🙂',
};

export function fallbackReply({ message, history = [] }) {
  const youCount = history.filter((h) => h.from === 'you').length;
  const turn = Math.max(0, youCount - 1);
  if (!message.isScam) {
    const fam = /saved contact/i.test(message.sender?.handle || '');
    return { reply: fam ? 'Love you! Talk Tuesday ❤️' : LEGIT_AUTO[message.channel] || LEGIT_AUTO.sms, tactics: [], pressure: 1, asksForMoney: false, ended: true, source: 'offline' };
  }
  const lastYou = [...history].reverse().find((h) => h.from === 'you')?.text || '';
  if (VERIFY_WORDS.test(lastYou)) {
    const deflect = [
      'There is no need to call anyone else. I am handling your case personally and the other lines are backed up.',
      'If you stop now I cannot guarantee your money will be safe. Please stay with me.',
      'I understand you are careful, that is good. But this cannot wait for the normal process.',
    ];
    return { reply: deflect[turn % deflect.length], tactics: ['urgency', 'authority'], pressure: Math.min(5, 3 + turn), asksForMoney: false, ended: false, source: 'offline' };
  }
  const scripted = message.seedKey ? seedReplies(message.seedKey) : null;
  if (scripted && scripted[turn]) {
    return { reply: scripted[turn], tactics: message.tactics || [], pressure: Math.min(5, 2 + turn), asksForMoney: turn >= scripted.length - 1, ended: false, source: 'offline' };
  }
  const tactics = message.tactics?.length ? message.tactics : ['urgency'];
  const tactic = tactics[turn % tactics.length];
  const lines = GENERIC[tactic] || GENERIC.urgency;
  const ask = message.askAmount ? ` Send $${message.askAmount.toLocaleString('en-US')} by ${message.ask?.method || 'transfer'} and I will take care of the rest.` : '';
  return { reply: lines[turn % lines.length] + (turn >= 1 ? ask : ''), tactics: [tactic], pressure: Math.min(5, 2 + turn), asksForMoney: turn >= 1, ended: false, source: 'offline' };
}

// results: [{ isScam, outcome, tactics, scamType }]
// outcome: caught | fooled | paid | false_alarm | trusted_legit
export function tacticProfile(results) {
  const profile = {};
  for (const k of TACTIC_KEYS) profile[k] = { seen: 0, fooled: 0 };
  for (const r of results) {
    if (!r.isScam) continue;
    for (const t of r.tactics || []) {
      if (!profile[t]) continue;
      profile[t].seen++;
      if (r.outcome === 'fooled' || r.outcome === 'paid') profile[t].fooled++;
    }
  }
  return profile;
}

export function fallbackDebrief({ results, lost }) {
  const profile = tacticProfile(results);
  const ranked = Object.entries(profile)
    .filter(([, v]) => v.seen > 0)
    .sort((a, b) => b[1].fooled / b[1].seen - a[1].fooled / a[1].seen || b[1].fooled - a[1].fooled);
  const weakest = ranked[0] && ranked[0][1].fooled > 0 ? ranked[0][0] : null;
  const caught = results.filter((r) => r.isScam && r.outcome === 'caught').length;
  const scams = results.filter((r) => r.isScam).length;
  const summary = weakest
    ? `You caught ${caught} of ${scams} scams. The ones that got through leaned on "${TACTICS[weakest].label}": ${TACTICS[weakest].short.toLowerCase()}. ${TACTICS[weakest].lesson}`
    : `You caught all ${scams} scams without losing a dollar. The habit that did it: slowing down and checking the sender before acting.`;
  return {
    headline: lost > 0 ? (scams - caught === 1 ? 'One scam got through' : `${scams - caught} scams got through`) : 'Nothing got past you',
    summary,
    weakest,
    habits: [
      'Never act on a message that gives you a deadline. Close it and open the app or call the number you already trust.',
      'Agree on a family code word for emergencies, since voices can now be cloned from a few seconds of audio.',
      'Before any investment, look up the firm and the person on FINRA BrokerCheck. No registration means no deal.',
    ],
    source: 'offline',
  };
}
