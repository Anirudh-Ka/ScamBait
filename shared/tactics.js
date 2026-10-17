// The persuasion tactics every scam in ScamBait is built from.
// Keys are stable: the server, Gemini prompts and the UI all use them.

export const TACTICS = {
  urgency: {
    label: 'Rush',
    short: 'Deadlines, countdowns, "act now"',
    lesson: 'Real institutions give you time. A countdown is there to stop you from thinking or asking someone.',
  },
  authority: {
    label: 'Fake authority',
    short: 'Pretends to be your bank, a regulator or the government',
    lesson: 'Hang up or close the message, then contact the institution yourself using the number on your card or their official app.',
  },
  too_good: {
    label: 'Too good to be true',
    short: 'Guaranteed returns, no risk, zero fees',
    lesson: 'Every real investment carries risk. "Guaranteed" high returns are the single most common sign of investment fraud.',
  },
  secrecy: {
    label: 'Keep it quiet',
    short: 'Tells you not to tell family, friends or your bank',
    lesson: 'Anyone asking you to hide a money decision from people you trust is protecting themselves, not you.',
  },
  payment: {
    label: 'Odd payment',
    short: 'Crypto, gift cards, wire, or a "safe account"',
    lesson: 'Gift cards, crypto ATMs and wires to strangers are almost impossible to reverse. That is exactly why scammers want them.',
  },
  affinity: {
    label: 'Friendly face',
    short: 'Shared language, hometown, faith or a new "friend"',
    lesson: 'Scammers target communities by speaking their language. Being from the same place does not make an offer safe.',
  },
  fomo: {
    label: 'Everyone is in',
    short: 'Screenshots of gains, limited spots, social proof',
    lesson: 'Screenshots are easy to fake and "only 12 spots left" is a sales trick. Real funds do not run out of room overnight.',
  },
  jargon: {
    label: 'Tech fog',
    short: 'AI, blockchain, "tokenized", "quantum" to sound advanced',
    lesson: 'Buzzwords are not a strategy. If you cannot explain how it makes money in one sentence, walk away.',
  },
  lookalike: {
    label: 'Lookalike sender',
    short: 'Misspelled domains, odd numbers, wrong account name',
    lesson: 'Check the exact sender. One swapped letter or an unfamiliar domain means it did not come from who it claims.',
  },
};

export const TACTIC_KEYS = Object.keys(TACTICS);

// The kind of scam, mapped to the three areas in the T. Rowe Price brief.
export const SCAM_TYPES = {
  fake_etf: { label: 'Fake ETF', area: 'ETFs' },
  tokenized_fund: { label: 'Fake tokenized fund', area: 'Digital assets' },
  ai_bot: { label: 'AI trading bot', area: 'Artificial intelligence' },
  impersonation: { label: 'Bank or broker impersonation', area: 'Fraud awareness' },
  pig_butchering: { label: 'Wrong-number "friend"', area: 'Digital assets' },
  voice_clone: { label: 'Voice impersonation call', area: 'Artificial intelligence' },
  recovery: { label: 'Recovery scam', area: 'Fraud awareness' },
  fake_regulator: { label: 'Fake regulator', area: 'Fraud awareness' },
  pump_dump: { label: 'Pump and dump group', area: 'Digital assets' },
};

export const CHANNELS = {
  sms: 'Text',
  email: 'Email',
  dm: 'Direct message',
  call: 'Phone call',
};

export const RESOURCES = [
  { name: 'Report fraud to the FTC', url: 'https://reportfraud.ftc.gov', note: 'Report any scam, even if you did not lose money.' },
  { name: 'Check a broker on FINRA BrokerCheck', url: 'https://brokercheck.finra.org', note: 'Look up whether a person or firm is registered to sell investments.' },
  { name: 'SEC investor education', url: 'https://www.investor.gov', note: 'Plain-language guides on investment fraud and red flags.' },
  { name: 'FBI Internet Crime Complaint Center', url: 'https://www.ic3.gov', note: 'Report online and crypto fraud.' },
  { name: 'AARP Fraud Watch helpline', url: 'https://www.aarp.org/money/scams-fraud/helpline/', note: 'Free help line, open to people of any age.' },
];
