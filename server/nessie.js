// Capital One Nessie sandbox integration.
// Each player gets a real (sandbox) checking account. When they fall for a scam,
// the money actually leaves that account as a peer-to-peer transfer to a
// "scammer" account, so the loss shows up in their transaction history.
import { config } from './config.js';

const sessions = new Map();
let base = null;
let scammerAccountId = null;

const MOCK_PURCHASES = {
  rosa: [
    { merchant: 'Sunrise Pharmacy', amount: 23.4, date: '2026-10-15' },
    { merchant: 'La Esquina Market', amount: 61.12, date: '2026-10-14' },
  ],
  priya: [
    { merchant: 'Campus Bookstore', amount: 38.99, date: '2026-10-16' },
    { merchant: 'Noodle Bar 88', amount: 14.25, date: '2026-10-15' },
  ],
  linh: [
    { merchant: 'Pho Saigon Kitchen', amount: 27.5, date: '2026-10-16' },
    { merchant: 'Riverside Grocery', amount: 84.31, date: '2026-10-13' },
  ],
  devon: [
    { merchant: 'Hardware Depot', amount: 56.78, date: '2026-10-15' },
    { merchant: 'Corner Gas & Go', amount: 41.02, date: '2026-10-14' },
  ],
};

const today = () => new Date().toISOString().slice(0, 10);

async function req(method, path, body) {
  const url = `${base}${path}${path.includes('?') ? '&' : '?'}key=${encodeURIComponent(config.nessie.key)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) throw new Error(`Nessie ${method} ${path} ${res.status}: ${String(text).slice(0, 200)}`);
    return data;
  } finally {
    clearTimeout(t);
  }
}

async function ensureBase() {
  if (base) return base;
  for (const candidate of config.nessie.bases) {
    try {
      base = candidate;
      const data = await req('GET', '/customers');
      if (Array.isArray(data)) return base;
    } catch (e) {
      console.warn('[nessie] base failed', candidate, e.message);
    }
  }
  base = null;
  throw new Error('No Nessie base URL responded');
}

const created = (r) => r?.objectCreated?._id || r?._id;

async function ensureScammerAccount() {
  if (scammerAccountId) return scammerAccountId;
  const cust = await req('POST', '/customers', {
    first_name: 'Unknown',
    last_name: 'Recipient',
    address: { street_number: '0', street_name: 'Offshore Way', city: 'Nowhere', state: 'DE', zip: '19901' },
  });
  const acct = await req('POST', `/customers/${created(cust)}/accounts`, {
    type: 'Checking',
    nickname: 'ScamBait scammer wallet',
    rewards: 0,
    balance: 0,
  });
  scammerAccountId = created(acct);
  return scammerAccountId;
}

async function merchantName(id) {
  try {
    const m = await req('GET', `/merchants/${id}`);
    return m?.name || null;
  } catch {
    return null;
  }
}

async function setupMe(session) {
  const customers = await req('GET', '/customers');
  for (const c of customers.slice(0, 15)) {
    const accounts = await req('GET', `/customers/${c._id}/accounts`).catch(() => []);
    const acct = (accounts || []).filter((a) => a.type !== 'Credit Card').sort((a, b) => (b.balance || 0) - (a.balance || 0))[0];
    if (!acct) continue;
    const raw = await req('GET', `/accounts/${acct._id}/purchases`).catch(() => []);
    const purchases = [];
    for (const p of (raw || []).slice(-5).reverse()) {
      const name = p.merchant_id ? await merchantName(p.merchant_id) : null;
      purchases.push({ merchant: name || p.description || 'Card purchase', amount: Number(p.amount) || 0, date: p.purchase_date });
    }
    Object.assign(session, {
      customerId: c._id,
      accountId: acct._id,
      startBalance: Number(acct.balance) || 0,
      purchases,
      persona: {
        id: 'me',
        name: `${c.first_name} ${c.last_name}`,
        age: null,
        tagline: 'Your Nessie sandbox customer',
        situation: `Has a ${acct.type} account "${acct.nickname || ''}" with a balance of $${acct.balance}.`,
        goals: 'Keep their money safe.',
        targetedBy: ['urgency', 'authority', 'too_good'],
        balance: Number(acct.balance) || 0,
        avatar: (c.first_name || 'M')[0],
      },
    });
    return;
  }
  throw new Error('No Nessie customer with an account was found. Create one in the Nessie dashboard first.');
}

async function setupPersona(session, persona) {
  const [first, ...rest] = persona.name.split(' ');
  const cust = await req('POST', '/customers', {
    first_name: first,
    last_name: rest.join(' ') || 'Player',
    address: { street_number: '7950', street_name: 'Baltimore Ave', city: 'College Park', state: 'MD', zip: '20740' },
  });
  const customerId = created(cust);
  const acct = await req('POST', `/customers/${customerId}/accounts`, {
    type: 'Checking',
    nickname: `ScamBait ${first}`,
    rewards: 0,
    balance: Math.round(persona.balance),
  });
  const accountId = created(acct);
  // Best effort: record a couple of everyday purchases so the bank alert uses real account data.
  const purchases = [];
  try {
    const merchants = await req('GET', '/merchants');
    const named = (merchants || []).filter((m) => m?.name && m.name.length < 32).slice(0, 2);
    for (const [i, m] of named.entries()) {
      const amount = [42.18, 17.6][i];
      await req('POST', `/accounts/${accountId}/purchases`, {
        merchant_id: m._id,
        medium: 'balance',
        purchase_date: today(),
        amount,
        description: 'Everyday purchase',
      });
      purchases.push({ merchant: m.name, amount, date: today() });
    }
  } catch (e) {
    console.warn('[nessie] purchases skipped:', e.message);
  }
  Object.assign(session, {
    customerId,
    accountId,
    startBalance: persona.balance,
    purchases: purchases.length ? purchases : MOCK_PURCHASES[persona.id] || [],
  });
}

export async function setupAccount({ sessionId, persona, useMe }) {
  const session = { sessionId, sent: [], live: false };
  sessions.set(sessionId, session);
  if (config.nessie.key) {
    try {
      await ensureBase();
      if (useMe) await setupMe(session);
      else await setupPersona(session, persona);
      session.live = true;
    } catch (e) {
      console.warn('[nessie] setup failed, using mock:', e.message);
      session.error = e.message;
    }
  }
  if (!session.live) {
    Object.assign(session, {
      customerId: 'mock-customer',
      accountId: `mock-${sessionId.slice(0, 6)}`,
      startBalance: persona.balance,
      purchases: MOCK_PURCHASES[persona.id] || MOCK_PURCHASES.priya,
    });
  }
  return publicView(session);
}

function publicView(s) {
  const sentTotal = s.sent.reduce((a, t) => a + t.amount, 0);
  return {
    live: s.live,
    source: s.live ? 'nessie' : 'mock',
    accountId: s.accountId,
    startBalance: s.startBalance,
    balance: Math.max(0, s.startBalance - sentTotal),
    purchases: s.purchases,
    sent: s.sent,
    persona: s.persona,
    error: s.error,
  };
}

export async function sendMoney({ sessionId, amount, recipient, method, messageId }) {
  const s = sessions.get(sessionId);
  if (!s) throw new Error('Unknown session. Start a new round.');
  const amt = Math.max(0, Math.round(Number(amount) || 0));
  const tx = { id: `tx-${Date.now()}`, amount: amt, recipient, method, messageId, at: new Date().toISOString(), via: 'mock' };
  if (s.live) {
    try {
      const payee = await ensureScammerAccount();
      const r = await req('POST', `/accounts/${s.accountId}/transfers`, {
        medium: 'balance',
        payee_id: payee,
        amount: amt,
        transaction_date: today(),
        description: `ScamBait: ${method} to ${recipient}`.slice(0, 120),
      });
      tx.id = created(r) || tx.id;
      tx.via = 'nessie-transfer';
    } catch (e) {
      console.warn('[nessie] transfer failed, trying withdrawal:', e.message);
      try {
        const r = await req('POST', `/accounts/${s.accountId}/withdrawals`, {
          medium: 'balance',
          amount: amt,
          transaction_date: today(),
          description: `ScamBait: ${method} to ${recipient}`.slice(0, 120),
        });
        tx.id = created(r) || tx.id;
        tx.via = 'nessie-withdrawal';
      } catch (e2) {
        console.warn('[nessie] withdrawal failed:', e2.message);
      }
    }
  }
  s.sent.push(tx);
  return publicView(s);
}

export function getAccount(sessionId) {
  const s = sessions.get(sessionId);
  return s ? publicView(s) : null;
}
