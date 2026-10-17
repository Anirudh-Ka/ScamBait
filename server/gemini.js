import { config } from './config.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

let workingModel = null;

async function callModel(model, body, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.gemini.key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`Gemini ${model} ${res.status}: ${text.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
    const data = JSON.parse(text);
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const out = parts.filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('');
    if (!out) throw new Error(`Gemini ${model}: empty response (${data?.candidates?.[0]?.finishReason || 'no candidates'})`);
    return out;
  } finally {
    clearTimeout(t);
  }
}

// Builds request bodies from most to least feature-rich, so a model that rejects
// thinkingConfig or a schema still answers with the simpler request.
function bodies({ system, prompt, history, json, schema, temperature }) {
  const contents = [...(history || []), { role: 'user', parts: [{ text: prompt }] }];
  const base = {
    contents,
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
  };
  const gen = { temperature: temperature ?? 0.9 };
  if (json) gen.responseMimeType = 'application/json';
  const variants = [];
  variants.push({ ...base, generationConfig: { ...gen, ...(schema ? { responseJsonSchema: schema } : {}), thinkingConfig: { thinkingLevel: 'low' } } });
  if (schema) variants.push({ ...base, generationConfig: { ...gen, responseJsonSchema: schema } });
  variants.push({ ...base, generationConfig: gen });
  return variants;
}

export async function gemini(opts) {
  if (!config.gemini.key) throw new Error('GEMINI_API_KEY not set');
  const models = workingModel ? [workingModel, ...config.gemini.models.filter((m) => m !== workingModel)] : config.gemini.models;
  const variants = bodies(opts);
  let lastErr;
  for (const model of models) {
    for (const body of variants) {
      try {
        const text = await callModel(model, body, opts.timeoutMs || 45000);
        workingModel = model;
        return { text, model };
      } catch (e) {
        lastErr = e;
        // 400 usually means an unsupported field: try the simpler body.
        // 404 means the model is unavailable: move to the next model.
        if (e.status === 404 || e.status === 403) break;
        if (e.status === 401) throw e;
      }
    }
  }
  throw lastErr || new Error('Gemini failed');
}

export function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (m) return JSON.parse(m[1]);
    throw new Error('Could not parse JSON from Gemini');
  }
}

export async function geminiJSON(opts) {
  const { text, model } = await gemini({ ...opts, json: true });
  return { data: parseJSON(text), model };
}
