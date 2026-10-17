import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config, integrationStatus } from './config.js';
import { generateScenario } from './scenario.js';
import { scammerReply } from './chat.js';
import { writeDebrief } from './debrief.js';
import { setupAccount, sendMoney, getAccount } from './nessie.js';
import { speak } from './tts.js';
import { getPersona } from '../shared/personas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));

// Tiny per-IP limiter so a public demo link can't burn through API credits.
const hits = new Map();
function limit(name, max, windowMs = 60 * 60 * 1000) {
  return (req, res, next) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const rec = hits.get(key) || { n: 0, reset: now + windowMs };
    if (now > rec.reset) {
      rec.n = 0;
      rec.reset = now + windowMs;
    }
    rec.n++;
    hits.set(key, rec);
    if (rec.n > max) return res.status(429).json({ error: 'Too many requests. Try again in a bit.' });
    next();
  };
}

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Something went wrong' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true, integrations: integrationStatus(), models: config.gemini.models });
});

app.post(
  '/api/start',
  limit('start', 40),
  wrap(async (req, res) => {
    const { sessionId, personaId, language, difficulty, useMe } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
    let persona = getPersona(personaId);
    const account = await setupAccount({ sessionId, persona, useMe: Boolean(useMe) });
    if (useMe && account.persona) persona = account.persona;
    const scenario = await generateScenario({
      persona,
      language: language || persona.defaultLanguage || 'English',
      difficulty: difficulty || 'medium',
      nessie: { purchases: account.purchases },
    });
    res.json({ persona, account, scenario, integrations: integrationStatus() });
  })
);

app.post(
  '/api/chat',
  limit('chat', 300),
  wrap(async (req, res) => {
    const { message, history, persona, language } = req.body || {};
    if (!message?.body) return res.status(400).json({ error: 'message is required' });
    res.json(await scammerReply({ message, history: history || [], persona, language }));
  })
);

app.post(
  '/api/send',
  limit('send', 300),
  wrap(async (req, res) => {
    res.json(await sendMoney(req.body || {}));
  })
);

app.get('/api/account/:sessionId', (req, res) => {
  const a = getAccount(req.params.sessionId);
  if (!a) return res.status(404).json({ error: 'Unknown session' });
  res.json(a);
});

app.post(
  '/api/tts',
  limit('tts', 200),
  wrap(async (req, res) => {
    const { text, voice } = req.body || {};
    const audio = await speak({ text, voice });
    if (!audio) return res.status(204).end();
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(audio);
  })
);

app.post(
  '/api/debrief',
  limit('debrief', 100),
  wrap(async (req, res) => {
    res.json(await writeDebrief(req.body || {}));
  })
);

// Serve the built frontend in production.
const dist = path.resolve(__dirname, '../dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(config.port, () => {
  const s = integrationStatus();
  console.log(`ScamBait API on http://localhost:${config.port}`);
  console.log(`  Gemini:     ${s.gemini ? 'on (' + config.gemini.models[0] + ')' : 'off, using built-in scenarios'}`);
  console.log(`  ElevenLabs: ${s.elevenlabs ? 'on (' + config.eleven.model + ')' : 'off, using browser speech'}`);
  console.log(`  Nessie:     ${s.nessie ? 'on' : 'off, using a mock account'}`);
});
