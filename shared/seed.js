// Hand-written scenario packs. Used when Gemini is not configured or fails,
// so the demo never breaks. Every company, person, number and link is made up.
//
// Tokens filled at build time:
//   {first} persona first name      {bank} persona bank        {broker} persona brokerage
//   {rel} relative name             {callsYou} what they call you
//   {parent} the relative's parent  {merchant} a recent purchase merchant
//   {amount} the purchase amount    {card} last four of card

const BANK = 'Harborline Bank';
const BROKER = 'Tidewater Investments';

const POOL = {
  bank_sms: {
    channel: 'sms',
    sender: { name: '+1 (555) 014-2290', handle: 'Unknown number' },
    body:
      '{bank} ALERT: An unusual sign-in from Miami, FL was detected on your account. Your account will be frozen in 30 minutes unless you verify your identity. Verify now: harborline-secure-login.co/verify',
    isScam: true,
    scamType: 'impersonation',
    tactics: ['urgency', 'authority', 'lookalike'],
    redFlags: [
      { quote: 'Your account will be frozen in 30 minutes', tactic: 'urgency', why: 'A 30 minute countdown is designed to make you act before you think or call anyone.' },
      { quote: 'harborline-secure-login.co', tactic: 'lookalike', why: 'Not the bank\'s real website. Extra words like "secure-login" and an unusual ending are classic lookalike tricks.' },
      { quote: '+1 (555) 014-2290', tactic: 'lookalike', why: 'Banks text from short codes you have seen before, not random 10-digit numbers.' },
    ],
    ask: { fraction: 0.6, method: 'your login and one-time code', recipient: 'Unknown account' },
    verify: 'Close the text. Open your bank\'s app or call the number on the back of your card and ask if there is a problem.',
    replies: [
      'This is {bank} Security. To stop the freeze, please confirm your username and the 6-digit code we just sent you.',
      'Your account is still flagged. If you do not confirm in the next 10 minutes the freeze will last 30 days and pending payments will bounce.',
      'Final notice. Send the code now and we will move your balance to a protected account while we investigate.',
    ],
  },

  fake_etf: {
    channel: 'email',
    sender: { name: 'Meridian Capital Partners', handle: 'invest@meridian-capital-etf.com' },
    subject: 'Last call: SpotGold Income ETF (SGIX), 18% guaranteed yearly income',
    body:
      'Dear {first},\n\nYou have been pre-selected for an allocation in the SpotGold Income ETF (SGIX). SGIX pays a guaranteed 1.5% every month, backed by physical gold, with zero management fees.\n\nThe fund is SEC-approved and fully insured. Only 40 allocation slots remain for this round.\n\nTo reserve your slot, fund your allocation by wire transfer today. Wiring instructions are attached.\n\nWarm regards,\nRichard Hale, Senior Allocation Officer',
    isScam: true,
    scamType: 'fake_etf',
    tactics: ['too_good', 'authority', 'fomo', 'payment'],
    redFlags: [
      { quote: 'guaranteed 1.5% every month', tactic: 'too_good', why: 'No ETF can guarantee returns. 1.5% a month is about 20% a year, far above what gold or the stock market reliably earn.' },
      { quote: 'zero management fees', tactic: 'too_good', why: 'Every real ETF publishes an expense ratio. Zero fees plus guaranteed income is not how funds make money.' },
      { quote: 'The fund is SEC-approved', tactic: 'authority', why: 'The SEC never approves or endorses any investment. Claiming it does is itself a red flag.' },
      { quote: 'Only 40 allocation slots remain', tactic: 'fomo', why: 'ETFs trade on an exchange all day. They do not have limited slots.' },
      { quote: 'fund your allocation by wire transfer today', tactic: 'payment', why: 'You buy a real ETF inside your own brokerage account. You never wire money to the fund itself.' },
    ],
    ask: { fraction: 0.4, method: 'wire transfer', recipient: 'Meridian Capital Partners LLC' },
    verify: 'Search the ticker in your own brokerage app and look up the firm and the person on FINRA BrokerCheck. A real ETF shows up with a prospectus and an expense ratio.',
    replies: [
      'Thank you for your interest, {first}. SGIX has never had a down month. I can hold one slot for you until 5 PM if you confirm today.',
      'Many of our clients start with what they can and add later. The wire must arrive today to lock the guaranteed rate.',
      'I have three other investors waiting for this slot. Please send the wire now and forward me the confirmation number.',
    ],
  },

  tokenized_dm: {
    channel: 'dm',
    sender: { name: 'Coastal Yield', handle: '@coastal.yield.dao' },
    body:
      'hey {first}! saw you follow a few money accounts 👀 we tokenized 3 beachfront villas in Bali. each token = fractional ownership + rent paid out daily in stablecoins. 42% APY from an audited smart contract 🔒\n\npresale closes tonight at midnight. connect your wallet to claim: coastal-yield.app/claim\n\nmin buy is $200 💸',
    isScam: true,
    scamType: 'tokenized_fund',
    tactics: ['too_good', 'urgency', 'jargon', 'payment'],
    redFlags: [
      { quote: '42% APY', tactic: 'too_good', why: 'Rental property earns single digits a year. 42% is a lure, not a forecast.' },
      { quote: 'audited smart contract', tactic: 'jargon', why: 'Anyone can say "audited". It tells you nothing about who audited it or whether you legally own anything.' },
      { quote: 'presale closes tonight at midnight', tactic: 'urgency', why: 'A deadline on an unsolicited offer is there to stop you from researching.' },
      { quote: 'connect your wallet to claim', tactic: 'payment', why: 'Connecting a wallet to an unknown site can let it approve transfers that empty the wallet.' },
    ],
    ask: { fraction: 0.3, method: 'crypto wallet transfer', recipient: 'coastal-yield.app' },
    verify: 'Real tokenized funds are issued by registered firms, require identity checks, and are bought through regulated platforms. Ask for the issuer\'s legal name and look it up.',
    replies: [
      'for real tho the contract is public, you can see the payouts on chain. we\'ve paid 900+ holders this month 🙌',
      'only like 30 tokens left at presale price. after midnight it doubles. you in?',
      'just send the $ to the wallet on the claim page and dm me the screenshot, i\'ll whitelist you myself 🫡',
    ],
  },

  ai_bot: {
    channel: 'dm',
    sender: { name: 'Quant Alpha Club 💹', handle: 'Group chat, 2,314 members' },
    body:
      '📈 Our AI trading engine returned 312% last quarter.\n\nMembers are withdrawing $2,000 a week. Screenshots of payouts are pinned above.\n\nToday only: activate your personal AI bot license for $499 in USDT and get 3 free signals. Spots reset at 9 PM.',
    isScam: true,
    scamType: 'ai_bot',
    tactics: ['too_good', 'fomo', 'jargon', 'payment', 'urgency'],
    redFlags: [
      { quote: 'returned 312% last quarter', tactic: 'too_good', why: 'Even the best professional funds do not do this. Claimed returns like this are made up.' },
      { quote: 'Screenshots of payouts are pinned above', tactic: 'fomo', why: 'Screenshots take seconds to fake and prove nothing.' },
      { quote: 'AI trading engine', tactic: 'jargon', why: '"AI" is used to sound advanced. Nobody sells a bot that truly prints money for $499.' },
      { quote: '$499 in USDT', tactic: 'payment', why: 'Asking for a stablecoin payment means it cannot be reversed once sent.' },
      { quote: 'Today only', tactic: 'urgency', why: 'A daily reset is a pressure tactic.' },
    ],
    ask: { amount: 499, method: 'USDT crypto payment', recipient: 'Quant Alpha Club admin' },
    verify: 'Any firm managing money for the public with an algorithm must be registered. Search the name on investor.gov and ask for audited, not screenshotted, performance.',
    replies: [
      'Welcome! Our quant team is ex-hedge fund. The bot trades 24/7 so you do not have to.',
      'The license price goes up to $1,499 tomorrow. Most members make it back in the first week.',
      'Send the USDT to the admin wallet and post your transaction ID here. I will activate your bot right away.',
    ],
  },

  wrong_number: {
    channel: 'sms',
    sender: { name: '+1 (555) 019-7731', handle: 'Unknown number' },
    body:
      'Hi Mei, is this still your number? It\'s Kevin from the community dinner last weekend 😊 I wanted to send you the photos and the info about the investment app I mentioned.',
    isScam: true,
    scamType: 'pig_butchering',
    tactics: ['affinity', 'lookalike'],
    redFlags: [
      { quote: 'Hi Mei, is this still your number?', tactic: 'lookalike', why: 'The "wrong number" opener is how relationship investment scams start. The mistake is on purpose.' },
      { quote: 'from the community dinner', tactic: 'affinity', why: 'Mentioning a shared community makes a stranger feel familiar.' },
      { quote: 'the investment app I mentioned', tactic: 'affinity', why: 'The goal is to slowly move you to a fake trading app after weeks of friendly chat.' },
    ],
    ask: { fraction: 0.5, method: 'deposit into a trading app', recipient: 'GoldLotus Trading app' },
    verify: 'Do not continue a chat with a wrong number. Block and delete. If anyone you met online suggests an investment app, assume it is fake.',
    replies: [
      'Oh sorry, wrong number! But you seem really nice. Where are you from? I\'m originally from near the coast, I miss home food so much.',
      'I don\'t usually share this, but my aunt works at a trading firm and we use an app that has made me 30% this month. I can show you how, no pressure.',
      'You can start small, even $300. Download GoldLotus and deposit, I\'ll guide you on the first trade so you don\'t lose anything.',
    ],
  },

  family_call: {
    channel: 'call',
    sender: { name: 'Unknown caller', handle: '+1 (555) 017-4402' },
    body:
      '{callsYou}? It\'s me, {rel}. I\'m in trouble. I was in a car accident and they\'re saying I have to pay bail before I can leave. Please don\'t tell {parent}, I\'ll explain everything later. My lawyer is going to call you back. He said gift cards are the fastest way to pay. Please hurry, I\'m scared.',
    isScam: true,
    scamType: 'voice_clone',
    tactics: ['urgency', 'secrecy', 'payment', 'affinity'],
    redFlags: [
      { quote: 'Please don\'t tell {parent}', tactic: 'secrecy', why: 'Asking you to keep it secret stops you from calling someone who could confirm the story.' },
      { quote: 'gift cards are the fastest way to pay', tactic: 'payment', why: 'No court, jail or lawyer takes gift cards. This is only ever a scam.' },
      { quote: 'Please hurry', tactic: 'urgency', why: 'Panic is the point. Fear makes people skip checking.' },
      { quote: 'It\'s me, {rel}', tactic: 'affinity', why: 'A few seconds of audio from social media is enough for AI to clone a voice. A familiar voice is no longer proof.' },
    ],
    ask: { amount: 2500, method: 'gift cards', recipient: '"The lawyer"' },
    verify: 'Hang up and call {rel} or {parent} at the number you already have. Agree on a family code word that a scammer could not know.',
    replies: [
      'This is Mark Delaney, I\'m representing {rel}. The bail is $2,500. If it is not paid in the next hour they will move him to county.',
      'The court accepts gift cards for emergency bail. Buy them at any pharmacy and read me the numbers on the back.',
      'Please, ma\'am or sir, {rel} is very upset. Do not hang up. Every minute matters here.',
    ],
  },

  bank_call: {
    channel: 'call',
    sender: { name: '{bank}', handle: '+1 (555) 010-3388' },
    body:
      'Hello, this is Officer Daniel Reyes from {bank}\'s fraud protection unit. We detected someone trying to withdraw four thousand nine hundred dollars from your account a few minutes ago. To protect your money, we need you to move your balance into a secure holding account we have set up in your name. Please stay on the line with me and do not hang up, or the transfer may go through.',
    isScam: true,
    scamType: 'impersonation',
    tactics: ['authority', 'urgency', 'payment'],
    redFlags: [
      { quote: 'Officer Daniel Reyes from {bank}\'s fraud protection unit', tactic: 'authority', why: 'Caller ID and titles are easy to fake. Banks do not have "officers" who call you to move money.' },
      { quote: 'move your balance into a secure holding account', tactic: 'payment', why: 'There is no such thing as a "safe account". Your bank never asks you to move money to protect it.' },
      { quote: 'do not hang up', tactic: 'urgency', why: 'Keeping you on the line stops you from calling your bank yourself to check.' },
    ],
    ask: { fraction: 0.8, method: 'transfer to a "secure holding account"', recipient: 'Account ending 7781' },
    verify: 'Hang up. Call the number on the back of your card. If there really is fraud, your bank will freeze it on their side. You never move money yourself.',
    replies: [
      'I understand your concern. For your security I can confirm the last four digits of your card if you read me the full number first.',
      'The fraudster is attempting a second withdrawal right now. We need to move the funds within the next five minutes.',
      'I am sending you the holding account details by text. Start the transfer while I stay on the line with you.',
    ],
  },

  fake_regulator: {
    channel: 'email',
    sender: { name: 'Office of Investor Restitution', handle: 'claims@investor-restitution-office.org' },
    subject: 'Settlement notice: you are owed $3,840. Reference IR-55120',
    body:
      'Dear {first},\n\nOur records show you are eligible for a $3,840 payout from the Coastal Brokerage class action settlement.\n\nTo release your funds, a one-time processing fee of $129 must be paid within 48 hours. We accept gift cards or cryptocurrency for faster processing.\n\nIf the fee is not received, your claim will be forfeited.\n\nOffice of Investor Restitution\nClaims Division',
    isScam: true,
    scamType: 'fake_regulator',
    tactics: ['authority', 'payment', 'urgency', 'too_good'],
    redFlags: [
      { quote: 'Office of Investor Restitution', tactic: 'authority', why: 'An official-sounding name is not an agency. Real settlements are run by court-appointed administrators you can look up.' },
      { quote: 'a one-time processing fee of $129', tactic: 'payment', why: 'Real settlements never charge you a fee to receive your money.' },
      { quote: 'We accept gift cards or cryptocurrency', tactic: 'payment', why: 'No government office or settlement administrator accepts gift cards.' },
      { quote: 'within 48 hours', tactic: 'urgency', why: 'A short deadline to "release" money is a pressure trick.' },
    ],
    ask: { amount: 129, method: 'gift card', recipient: 'Office of Investor Restitution' },
    verify: 'Search the case name yourself and find the official settlement website from a court or news source. Never pay a fee to collect money.',
    replies: [
      'Thank you for responding. Your claim IR-55120 is in final review. The processing fee covers bank transfer costs.',
      'We have 214 claims pending today. To keep your place, please send the fee as a gift card and email us a photo of the card.',
      'Your claim will be forfeited at 5 PM. After that the funds go back to the settlement pool.',
    ],
  },

  pump_dump: {
    channel: 'dm',
    sender: { name: 'MoonDeck Signals 🚀', handle: 'Server #alpha-calls' },
    body:
      '@everyone $REEF is about to 50x 🚀🚀 whales are loading right now. we all post about it at 3 PM sharp so get in BEFORE that. this is the one, don\'t be the guy who missed it again',
    isScam: true,
    scamType: 'pump_dump',
    tactics: ['fomo', 'too_good', 'urgency'],
    redFlags: [
      { quote: 'about to 50x', tactic: 'too_good', why: 'Nobody can predict a 50x. This is a promise, not analysis.' },
      { quote: 'we all post about it at 3 PM sharp', tactic: 'urgency', why: 'A coordinated post time is how pump and dump groups push the price up so insiders can sell to you.' },
      { quote: 'don\'t be the guy who missed it again', tactic: 'fomo', why: 'Shame and fear of missing out replace any actual reason to buy.' },
    ],
    ask: { fraction: 0.35, method: 'buying a coin on an unknown exchange', recipient: '$REEF token' },
    verify: 'Coordinated "buy before we post" groups are market manipulation. The organizers sell as you buy. Leave the group.',
    replies: [
      'bro the chart is already moving, check it. early buyers are up 40% today',
      'link to the exchange is in pinned. use the whole bag, it\'s going to the moon',
      'last call, we post in 10 min 🚀',
    ],
  },

  // Legitimate messages. Mixed in so the game is about judgment, not paranoia.
  legit_statement: {
    channel: 'email',
    sender: { name: '{broker}', handle: 'statements@tidewaterinvest.com' },
    subject: 'Your quarterly statement is ready',
    body:
      'Hi {first},\n\nYour statement for July to September is ready. To view it, open the {broker} app or type our web address into your browser yourself and sign in as usual.\n\nWe will never ask for your password, PIN or one-time code by email, text or phone.\n\n{broker} Client Services',
    isScam: false,
    scamType: null,
    tactics: [],
    legitSigns: [
      { quote: 'type our web address into your browser yourself', why: 'It does not push a link. It asks you to go there the way you normally do.' },
      { quote: 'We will never ask for your password, PIN or one-time code', why: 'Real institutions say this often, and mean it.' },
      { quote: 'sign in as usual', why: 'No deadline, no threat, no request for money or information.' },
    ],
    verify: 'Even legit emails are best handled by opening the app directly instead of clicking anything.',
  },

  legit_purchase: {
    channel: 'sms',
    sender: { name: '{bank}', handle: 'Short code 72845' },
    body:
      '{bank}: A {amount} purchase at {merchant} was approved on your debit card ending {card}. If you don\'t recognize it, call the number on the back of your card.',
    isScam: false,
    scamType: null,
    tactics: [],
    legitSigns: [
      { quote: 'call the number on the back of your card', why: 'It sends you to a number you already trust instead of giving you a new one.' },
      { quote: 'Short code 72845', why: 'From the same short code your bank always uses.' },
      { quote: 'approved on your debit card ending {card}', why: 'Specific, ordinary details that match your own account. No link and no request.' },
    ],
    verify: 'If a purchase looks wrong, call the number on the back of your card. Do not reply to the text.',
  },

  legit_fee_cut: {
    channel: 'email',
    sender: { name: '{broker}', handle: 'notices@tidewaterinvest.com' },
    subject: 'Good news: lower costs on your index ETF',
    body:
      'Hi {first},\n\nThe expense ratio for the Tidewater Total Market Index ETF (TWTM) is decreasing from 0.10% to 0.07%, effective November 1.\n\nNo action is needed. The updated prospectus is available under Documents in your account.\n\n{broker}',
    isScam: false,
    scamType: null,
    tactics: [],
    legitSigns: [
      { quote: '0.10% to 0.07%', why: 'Realistic numbers. Broad index ETFs often cost well under 0.20% a year.' },
      { quote: 'No action is needed', why: 'No pressure and nothing to click or send.' },
      { quote: 'under Documents in your account', why: 'Points you to your own account, not to an outside link.' },
    ],
    verify: 'Fee changes are always published in the fund\'s prospectus, which you can find through your own brokerage.',
  },

  legit_family: {
    channel: 'sms',
    sender: { name: '{rel} ❤️', handle: 'Saved contact' },
    body:
      'Hi {callsYou}! Can\'t do our call this Sunday, I have a big exam Monday 😩 Can we talk Tuesday night instead? Love you!',
    isScam: false,
    scamType: null,
    tactics: [],
    legitSigns: [
      { quote: 'Saved contact', why: 'From the number you already have saved for them.' },
      { quote: 'Can we talk Tuesday night instead?', why: 'No money, no secrecy, no urgency. Just plans.' },
    ],
    verify: 'Messages from saved contacts can still be faked if a phone is hacked. Any surprise money request is worth a quick call.',
  },

  legit_community: {
    channel: 'dm',
    sender: { name: 'Riverside Neighbors', handle: 'Community group' },
    body:
      'Reminder: potluck at the community center this Saturday at 5 PM! Bring a dish if you can, and kids are welcome 🍲',
    isScam: false,
    scamType: null,
    tactics: [],
    legitSigns: [
      { quote: 'Bring a dish if you can', why: 'Nothing is being asked of your money or your accounts.' },
      { quote: 'community center this Saturday at 5 PM', why: 'A real, specific, in-person plan.' },
    ],
    verify: 'Community groups are safe until someone in them starts pitching an investment. That is when to slow down.',
  },
};

const PACKS = {
  rosa: ['bank_sms', 'legit_family', 'family_call', 'fake_regulator', 'legit_purchase', 'wrong_number'],
  priya: ['tokenized_dm', 'legit_purchase', 'ai_bot', 'bank_call', 'fake_etf', 'legit_fee_cut'],
  linh: ['wrong_number', 'legit_community', 'fake_etf', 'family_call', 'tokenized_dm', 'legit_fee_cut'],
  devon: ['fake_etf', 'legit_statement', 'bank_call', 'ai_bot', 'legit_fee_cut', 'fake_regulator'],
  me: ['bank_sms', 'legit_purchase', 'fake_etf', 'bank_call', 'tokenized_dm', 'legit_fee_cut'],
};

const TIMES = ['9:12 AM', '10:47 AM', '12:03 PM', '1:36 PM', '3:20 PM', '5:58 PM', '7:14 PM'];

function fill(str, vars) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}

function fillDeep(value, vars) {
  if (typeof value === 'string') return fill(value, vars);
  if (Array.isArray(value)) return value.map((v) => fillDeep(v, vars));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = fillDeep(v, vars);
    return out;
  }
  return value;
}

export function askAmount(ask, balance) {
  if (!ask) return 0;
  const raw = ask.amount != null ? ask.amount : Math.round((balance * (ask.fraction || 0.3)) / 50) * 50;
  return Math.max(25, Math.min(Math.round(raw), Math.round(balance)));
}

export function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

// purchase: optional { merchant, amount } from Nessie, used for the legit bank text.
export function buildSeedScenario(persona, { purchase } = {}) {
  const rel = persona.relative || { name: 'Sam', role: 'cousin', callsYou: 'hey', parent: 'the family' };
  const vars = {
    first: persona.name.split(' ')[0],
    bank: BANK,
    broker: BROKER,
    rel: rel.name,
    callsYou: rel.callsYou,
    parent: rel.parent,
    merchant: purchase?.merchant || 'Corner Market',
    // keep cents so the purchase alert reads like a real one
    amount: '$' + Number(purchase?.amount ?? 42.18).toFixed(2),
    card: '4417',
  };

  const ids = PACKS[persona.id] || PACKS.me;
  const messages = ids.map((key, i) => {
    const m = fillDeep(POOL[key], vars);
    return {
      id: `m${i + 1}`,
      seedKey: key,
      time: TIMES[i],
      ...m,
      askAmount: m.isScam ? askAmount(m.ask, persona.balance) : 0,
    };
  });

  return {
    source: 'offline',
    language: 'English',
    bank: BANK,
    broker: BROKER,
    messages,
  };
}

export function seedReplies(seedKey) {
  return POOL[seedKey]?.replies || null;
}

export const SEED_POOL_KEYS = Object.keys(POOL);
