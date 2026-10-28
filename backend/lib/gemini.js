/* =============================================================
   lib/gemini.js  —  Small shared helper for JSON-producing Gemini calls
   Handles: retry on 503/429, JSON extraction from fenced/raw output.
   ============================================================= */

'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-3.6-flash';

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw    = fenced ? fenced[1].trim() : text.trim();
  try {
    return JSON.parse(raw);
  } catch (_) {
    const a = raw.indexOf('{');
    const b = raw.lastIndexOf('}');
    if (a !== -1 && b > a) return JSON.parse(raw.slice(a, b + 1));
    throw new Error('Could not find JSON in AI response');
  }
}

async function generateJSON(prompt, opts) {
  opts = opts || {};
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature:     opts.temperature     != null ? opts.temperature : 0.2,
      maxOutputTokens: opts.maxOutputTokens || 8000
    }
  });

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return extractJson(result.response.text());
    } catch (err) {
      lastErr = err;
      const msg = err.message || '';
      const retryable = msg.includes('503') || msg.includes('429') ||
                        err instanceof SyntaxError || msg.includes('JSON');
      if (retryable && attempt < 2) {
        await new Promise(function (r) { setTimeout(r, 800 * Math.pow(2, attempt)); });
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

module.exports = { generateJSON, extractJson, MODEL_NAME };
