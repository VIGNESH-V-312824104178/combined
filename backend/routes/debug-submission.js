/* =============================================================
   routes/debug-submission.js  —  "Why did I fail?" submission debugger
   POST /api/debug-submission
   Body: {
     submissionUrl?, contestId?, submissionId?,   // used to scrape code if `code` absent
     code?, language?, verdict?, passedTestCount?, // manual / client-supplied metadata
     problemUrl?
   }
   Returns: { code, language, verdict, problemTitle, analysis{...} }
   If the Codeforces submission page can't be scraped (Cloudflare etc.)
   responds 422 { needManual: true } so the UI can ask for pasted code.
   ============================================================= */

'use strict';

const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');
const cheerio = require('cheerio');
const { generateJSON } = require('../lib/gemini');

const UA = 'Mozilla/5.0 (compatible; CFWeaknessTracker/1.0)';

const SUB_URL_RE = [
  /codeforces\.com\/(?:contest|gym)\/(\d+)\/submission\/(\d+)/i,
  /codeforces\.com\/problemset\/submission\/(\d+)\/(\d+)/i
];

function parseSubmissionRef(body) {
  if (body.contestId && body.submissionId) {
    return { contestId: String(body.contestId), submissionId: String(body.submissionId) };
  }
  const url = (body.submissionUrl || '').trim();
  for (const re of SUB_URL_RE) {
    const m = url.match(re);
    if (m) return { contestId: m[1], submissionId: m[2] };
  }
  return null;
}

async function getHtml(url) {
  const resp = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, timeout: 9000 });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  return resp.text();
}

async function scrapeSubmission(ref) {
  const html = await getHtml('https://codeforces.com/contest/' + ref.contestId + '/submission/' + ref.submissionId);
  const $    = cheerio.load(html);
  const code = $('#program-source-text').text();
  if (!code || !code.trim()) throw new Error('Source not visible (private submission or blocked)');

  const row     = $('.datatable table tr').eq(1);
  const cells   = row.find('td');
  const href    = $('.datatable a[href*="/problem/"]').first().attr('href') || '';
  const verdict = ($('.verdict-accepted, .verdict-rejected').first().text() || '').trim();
  return {
    code:       code,
    language:   cells.eq(3).text().trim(),
    verdict:    verdict || cells.eq(4).text().trim(),
    problemUrl: href ? 'https://codeforces.com' + href : ''
  };
}

async function scrapeProblem(url) {
  const html = await getHtml(url);
  const $    = cheerio.load(html);
  const title = $('.problem-statement .title').first().text().trim();
  let text = '';
  [
    '.problem-statement > div:not(.sample-tests)',
    '.input-specification',
    '.output-specification'
  ].forEach(function (sel) {
    const el = $(sel);
    if (el.length) text += el.text().trim() + '\n\n';
  });
  if (!text.trim()) text = $('.problem-statement').text().trim();
  return { title: title, text: text.slice(0, 6000).trim() };
}

function numberLines(code) {
  return code.split('\n').map(function (l, i) { return (i + 1) + ': ' + l; }).join('\n');
}

router.post('/', async function (req, res) {
  const body = req.body || {};
  let { code, language, verdict, passedTestCount, problemUrl } = body;

  try {
    // 1 — obtain source
    if (!code || !String(code).trim()) {
      const ref = parseSubmissionRef(body);
      if (!ref) {
        return res.status(400).json({ error: 'Provide a Codeforces submission link/ID or paste your code.' });
      }
      try {
        const s = await scrapeSubmission(ref);
        code       = s.code;
        language   = language   || s.language;
        verdict    = verdict    || s.verdict;
        problemUrl = problemUrl || s.problemUrl;
      } catch (e) {
        return res.status(422).json({
          needManual: true,
          error: 'Could not read that submission automatically (' + e.message + '). Paste the code manually below.'
        });
      }
    }

    code = String(code).slice(0, 30000);

    // 2 — problem statement (best effort)
    let problem = { title: '', text: '' };
    if (problemUrl && /^https?:\/\/(www\.)?codeforces\.com\//i.test(problemUrl)) {
      try { problem = await scrapeProblem(problemUrl); } catch (_) { /* continue without */ }
    }
    if (!problem.text && body.problemText) problem.text = String(body.problemText).slice(0, 6000);

    // 3 — AI diagnosis
    const failingTest = (passedTestCount != null && passedTestCount !== '') ? (Number(passedTestCount) + 1) : null;

    const prompt = `You are an elite Codeforces coach debugging a failed submission.
Never write the complete corrected program. Diagnose precisely, point at lines, and craft breaking tests.

PROBLEM${problem.title ? ' — ' + problem.title : ''}:
${problem.text || '(statement unavailable — infer intent from the code and be explicit about uncertainty)'}

VERDICT: ${verdict || 'unknown (assume Wrong Answer)'}
${failingTest ? 'It failed on test #' + failingTest + ' (' + passedTestCount + ' tests passed).' : ''}
LANGUAGE: ${language || 'unknown'}

CODE (with line numbers):
${numberLines(code)}

Respond with ONLY a JSON object with these keys:
"verdict_explained": one sentence on what this verdict implies here.
"root_cause": concise markdown (max 120 words) explaining the most likely bug.
"category": one of "Wrong logic","Edge case","Overflow","Off-by-one","Complexity","Uninitialized / memory","Precision","IO / format","Misread problem","Other".
"confidence": integer 0-100.
"suspect_lines": array of up to 5 objects {"line": number, "reason": string} using the numbering above.
"counter_tests": array of 2-4 SMALL objects {"input": string, "expected": string, "why": string}. Inputs must follow the problem's exact input format. If the problem has multiple test cases (leading t), set t=1. Only include "expected" when you are certain of the right answer; otherwise use an empty string.
"fix_hint": markdown explaining how to fix it WITHOUT providing the full program (snippets of at most 3 lines).
"complexity": {"yours": string, "needed": string, "ok": boolean}`;

    const analysis = await generateJSON(prompt, { temperature: 0.2, maxOutputTokens: 8000 });

    return res.json({
      code:         code,
      language:     language   || '',
      verdict:      verdict    || '',
      problemTitle: problem.title,
      problemUrl:   problemUrl || '',
      analysis:     analysis
    });

  } catch (err) {
    console.error('[debug-submission]', err);
    return res.status(500).json({ error: err.message || 'Debugger failed' });
  }
});

module.exports = router;
