/* =============================================================
   routes/run-code.js  —  Code execution via Wandbox/local
   POST /api/run-code
   Body: { compiler: string, code: string, input?: string }

   Ported from compil's /app/api/run-code/route.ts
   Supports: cpp-g++-15, python-3.14, deno/javascript
   ============================================================= */

'use strict';

const express  = require('express');
const router   = express.Router();
const fetch    = require('node-fetch');
const { spawnSync } = require('child_process');

router.post('/', async function (req, res) {
  const { compiler, code, input } = req.body || {};

  if (!compiler || !code) {
    return res.status(400).json({ error: 'Missing compiler or code' });
  }

  try {
    let output   = '';
    let error    = '';
    let exitCode = 0;

    if (compiler.startsWith('cpp')) {
      // Use Godbolt for C++ (Wandbox is currently returning HTTP 500)
      const godboltRes = await fetch('https://godbolt.org/api/compiler/g142/compile', {
        method:  'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          source: code,
          options: {
            userArguments: '-O2 -std=c++23',
            executeParameters: { args: [], stdin: input || '' },
            compilerOptions: { executorRequest: true },
            filters: { execute: true },
            tools: []
          },
          lang: 'c++',
          allowStoreCodeDebug: true
        }),
        timeout: 15000
      });

      if (!godboltRes.ok) {
        return res.status(godboltRes.status).json({
          error: 'Compiler API error: HTTP ' + godboltRes.status
        });
      }

      const data = await godboltRes.json();
      
      const buildErr = data.buildResult && data.buildResult.stderr ? data.buildResult.stderr.map(e => e.text).join('\n') : '';
      const execOut = data.stdout ? data.stdout.map(o => o.text).join('\n') : '';
      const execErr = data.stderr ? data.stderr.map(e => e.text).join('\n') : '';
      
      output = execOut;
      error = buildErr || execErr;
      exitCode = data.code === 0 ? 0 : 1;

    } else if (compiler.startsWith('python')) {
      const result = spawnSync('python', ['-c', code], {
        input:    input || '',
        encoding: 'utf-8',
        timeout:  5000
      });
      output   = result.stdout || '';
      error    = result.stderr || (result.error ? result.error.message : '');
      exitCode = result.status != null ? result.status : 1;

    } else if (compiler.startsWith('deno') || compiler.startsWith('javascript')) {
      const result = spawnSync('node', ['-e', code], {
        input:    input || '',
        encoding: 'utf-8',
        timeout:  5000
      });
      output   = result.stdout || '';
      error    = result.stderr || (result.error ? result.error.message : '');
      exitCode = result.status != null ? result.status : 1;
    }

    // Combine stdout + stderr for the unified output field (mirrors compil)
    const combined = output + (output && error ? '\n' : '') + error;

    return res.json({
      output:    combined,
      error:     error || undefined,
      exit_code: exitCode,
      time:      0
    });

  } catch (err) {
    console.error('[run-code]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
