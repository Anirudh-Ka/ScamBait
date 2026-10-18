// Offline smoke test for the live integrations. Mocks fetch so the Gemini,
// Nessie and ElevenLabs code paths run end to end without network or keys.
// Run: npm run check
process.env.GEMINI_API_KEY = 'test';
process.env.NESSIE_API_KEY = 'test';
process.env.ELEVENLABS_API_KEY = 'test';

const calls = [];
let geminiMode = 'good';
let elevenMode = 'good';
const elevenBodies = [];

const fakeScenario = {
  messages: [
    {
      channel: 'email', senderName: 'Bluewater Index Partners', senderHandle: 'desk@bluewater-index-etf.net',
      subject: 'Guaranteed 2% monthly ETF', body: 'Our new ETF pays a guaranteed 2% every month. Only 20 spots left. Wire funds today.',
      isScam: true, scamType: 'fake_etf', tactics: ['too_good', 'fomo'],
      redFlags: [
        { quote: 'guaranteed 2% every month', tactic: 'too_good', why: 'No ETF can guarantee returns.' },
        { quote: 'Only 20 spots left', tactic: 'fomo', why: 'ETFs do not have spots.' },
        { quote: 'this quote is not in the body', tactic: 'urgency', why: 'Should be dropped.' },
      ],
      legitSigns: [], askMethod: 'wire transfer', askRecipient: 'Bluewater Index Partners', askAmountUSD: 3000, verify: 'Look it up on BrokerCheck.',
    },
    {
      channel: 'dm', senderName: 'Reefcoin Club', senderHandle: '@reefcoin.club',
      subject: '', body: 'Tokenized reef bonds at 40% APY, connect your wallet before midnight!',
      isScam: true, scamType: 'tokenized_fund', tactics: ['too_good', 'urgency'],
      redFlags: [{ quote: '40% APY', tactic: 'too_good', why: 'Too high.' }, { quote: 'before midnight', tactic: 'urgency', why: 'Deadline.' }],
      legitSigns: [], askMethod: 'crypto wallet', askRecipient: 'reefcoin', askAmountUSD: 500, verify: 'Ask for the issuer.',
    },
    {
      channel: 'sms', senderName: 'Harborline Bank', senderHandle: 'Short code 72845',
      subject: '', body: 'Harborline Bank: A $12.00 purchase at Test Mart was approved. Call the number on the back of your card if this was not you.',
      isScam: false, scamType: 'none', tactics: [], redFlags: [],
      legitSigns: [{ quote: 'Call the number on the back of your card', why: 'Trusted channel.' }], askAmountUSD: 0, verify: 'Call your bank.',
    },
    {
      channel: 'dm', senderName: 'AlphaBot', senderHandle: 'Group chat',
      subject: '', body: 'Our AI bot made 300% last month. Pay $299 in USDT to join.',
      isScam: true, scamType: 'ai_bot', tactics: ['too_good', 'payment'],
      redFlags: [{ quote: 'made 300% last month', tactic: 'too_good', why: 'Impossible.' }],
      legitSigns: [], askMethod: 'USDT', askRecipient: 'AlphaBot admin', askAmountUSD: 299, verify: 'Check investor.gov.',
    },
  ],
};

global.fetch = async (url, opts = {}) => {
  url = String(url);
  calls.push(`${opts.method || 'GET'} ${url.replace(/key=[^&]+/, 'key=***')}`);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

  if (url.includes('generativelanguage.googleapis.com')) {
    const body = JSON.parse(opts.body);
    if (geminiMode === 'reject-thinking' && body.generationConfig?.thinkingConfig) return json({ error: { message: 'Unknown field thinkingConfig' } }, 400);
    if (url.includes('gemini-3.8-flash') && geminiMode === 'model-404') return json({ error: { message: 'not found' } }, 404);
    const prompt = body.contents.at(-1).parts[0].text;
    let out;
    if (prompt.includes('one-day inbox')) out = fakeScenario;
    else if (prompt.includes('coaching debrief')) out = { headline: 'Slow down on deadlines', summary: 'You did fine.', weakest: 'urgency', habits: ['a', 'b', 'c'] };
    else out = { reply: 'Act now, the offer ends soon.', tactics: ['urgency'], pressure: 4, asksForMoney: true, ended: false };
    return json({ candidates: [{ content: { parts: [{ text: '```json\n' + JSON.stringify(out) + '\n```' }] }, finishReason: 'STOP' }] });
  }

  if (url.includes('nessieisreal.com')) {
    if (url.includes('prod-api')) return json({ message: 'down' }, 503); // force fallback to second base
    const m = opts.method || 'GET';
    if (m === 'GET' && /\/customers\?/.test(url)) return json([]);
    if (m === 'POST' && /\/customers\?/.test(url)) return json({ code: 201, objectCreated: { _id: 'cust' + calls.length } });
    if (m === 'POST' && /\/accounts\?/.test(url)) return json({ code: 201, objectCreated: { _id: 'acct' + calls.length } });
    if (m === 'GET' && /\/merchants\?/.test(url)) return json([{ _id: 'mer1', name: 'Test Mart' }, { _id: 'mer2', name: 'Corner Shop' }]);
    if (m === 'POST' && /\/purchases\?/.test(url)) return json({ code: 201, objectCreated: { _id: 'pur' } });
    if (m === 'POST' && /\/transfers\?/.test(url)) return json({ code: 201, objectCreated: { _id: 'xfer123' } });
    return json({ message: 'unexpected ' + url }, 404);
  }

  if (url.includes('api.elevenlabs.io')) {
    if (!opts.headers?.['xi-api-key']) return json({ detail: 'missing key' }, 401);
    const body = JSON.parse(opts.body);
    elevenBodies.push({ url, ...body });
    if (elevenMode === 'no-v4' && body.model_id === 'eleven_v4') return json({ detail: 'model not available on your plan' }, 403);
    if (elevenMode === 'old-only' && body.model_id !== 'eleven_multilingual_v2') return json({ detail: 'model not available' }, 403);
    if (elevenMode === 'reject-settings' && body.voice_settings) return json({ detail: 'invalid stability' }, 422);
    return new Response(new Uint8Array([0x49, 0x44, 0x33, 1, 2, 3]), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
  }
  throw new Error('Unmocked fetch ' + url);
};

const assert = (cond, msg) => {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  } else console.log('ok  ', msg);
};

const { generateScenario } = await import('../server/scenario.js');
const { scammerReply } = await import('../server/chat.js');
const { writeDebrief } = await import('../server/debrief.js');
const { setupAccount, sendMoney } = await import('../server/nessie.js');
const { speak } = await import('../server/tts.js');
const { getPersona } = await import('../shared/personas.js');

const persona = getPersona('priya');

// Nessie
const acct = await setupAccount({ sessionId: 'smoke1', persona, useMe: false });
assert(acct.live === true, 'Nessie account is live (fell back to second base URL)');
assert(acct.purchases.length === 2 && acct.purchases[0].merchant === 'Test Mart', 'Nessie purchases recorded with merchant names');
const afterSend = await sendMoney({ sessionId: 'smoke1', amount: 300, recipient: 'Scammer', method: 'wire', messageId: 'm1' });
assert(afterSend.balance === persona.balance - 300, 'Balance drops after send');
assert(afterSend.sent[0].via === 'nessie-transfer' && afterSend.sent[0].id === 'xfer123', 'Send recorded as a Nessie P2P transfer');

// Gemini scenario
const sc = await generateScenario({ persona, language: 'English', difficulty: 'medium', nessie: { purchases: acct.purchases } });
assert(sc.source === 'gemini', 'Scenario generated by Gemini');
assert(sc.messages.some((m) => m.channel === 'call'), 'A phone call is injected when Gemini forgets one');
const etf = sc.messages.find((m) => m.scamType === 'fake_etf');
assert(etf.redFlags.length === 2, 'Red flags not found in the body are dropped');
assert(etf.askAmount === 1250, 'Ask amount is capped at the balance');
assert(sc.messages.every((m) => (m.redFlags || []).every((f) => m.body.includes(f.quote) || m.sender.handle.includes(f.quote) || m.sender.name.includes(f.quote))), 'Every red flag quote exists in its message');

geminiMode = 'reject-thinking';
const sc2 = await generateScenario({ persona, language: 'Spanish', difficulty: 'hard' });
assert(sc2.source === 'gemini', 'Retries without thinkingConfig when the API rejects it');

geminiMode = 'model-404';
const sc3 = await generateScenario({ persona, language: 'English', difficulty: 'easy' });
assert(sc3.source === 'gemini' && sc3.model === 'gemini-3.5-flash-lite', 'Falls back to the next model on 404');
geminiMode = 'good';

// Chat
const r = await scammerReply({ message: etf, history: [{ from: 'you', text: 'who is this?' }], persona, language: 'English' });
assert(r.source === 'gemini' && r.reply && r.pressure === 4, 'Scammer reply from Gemini');
const legit = sc.messages.find((m) => !m.isScam);
const r2 = await scammerReply({ message: legit, history: [{ from: 'you', text: 'hi' }], persona });
assert(r2.source === 'offline' && r2.ended, 'Legit senders never roleplay a scam');

// Debrief
const d = await writeDebrief({ persona, results: [{ isScam: true, outcome: 'paid', tactics: ['urgency'], scamType: 'fake_etf' }], lost: 300, saved: 950 });
assert(d.source === 'gemini' && d.habits.length === 3 && d.weakest === 'urgency', 'Debrief from Gemini');

// ElevenLabs
const audio = await speak({ text: 'Hello there', voice: 'family' });
assert(audio && audio.length === 6, 'ElevenLabs returns audio');
let last = elevenBodies.at(-1);
assert(last.model_id === 'eleven_v4', 'Uses the expressive eleven_v4 model first');
assert(last.url.includes('bIHbv24MWmeRgasZH58o'), 'Old "family" role maps to the young male voice');

await speak({ text: 'Please stay on the line.', voice: 'adult_male', emotion: 'official' });
last = elevenBodies.at(-1);
assert(last.text.startsWith('[calm, professional, slightly rushed] Please stay'), 'Adds a delivery tag for call lines');
assert(last.url.includes('cjVigY5qzO86Huf0OWal'), 'Adult male callers use their own voice');

await speak({ text: '[whispers] Do not tell anyone.', voice: 'young_female', emotion: 'panicked' });
last = elevenBodies.at(-1);
assert(last.text === '[whispers] Do not tell anyone.' && last.url.includes('cgSgspJ2msm6clMCkdW9'), 'Keeps script tags and uses the young female voice');

elevenMode = 'no-v4';
const a2 = await speak({ text: 'Fallback test one.', voice: 'adult_male', emotion: 'pushy' });
assert(a2 && elevenBodies.at(-1).model_id === 'eleven_v3', 'Falls back to eleven_v3 when v4 is not on the plan');

elevenMode = 'old-only';
const a3 = await speak({ text: '[sobbing] Fallback test two.', voice: 'young_male', emotion: 'panicked' });
last = elevenBodies.at(-1);
assert(a3 && last.model_id === 'eleven_multilingual_v2' && last.text === 'Fallback test two.', 'Strips tags for models that would read them aloud');

elevenMode = 'reject-settings';
const a4 = await speak({ text: 'Settings test.', voice: 'narrator' });
assert(a4 && !elevenBodies.at(-1).voice_settings, 'Retries without voice settings when the model rejects them');
elevenMode = 'good';

console.log('\nRequests made:\n  ' + [...new Set(calls)].slice(0, 20).join('\n  '));
