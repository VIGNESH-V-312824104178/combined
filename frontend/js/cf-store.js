/* =============================================================
   cf-store.js  —  Cached Codeforces data shared by Gym / Algorithms / Debugger
   Depends on: cf-api.js (window.CFApi)
   Exposes: window.CFStore

   Everything is cached in localStorage with a TTL so switching tabs
   never triggers a refetch unless the user explicitly hits "Refresh".
   ============================================================= */

(function (global) {
  'use strict';

  const TTL_SUBS       = 15 * 60 * 1000;        // 15 min
  const TTL_PROBLEMSET = 24 * 60 * 60 * 1000;   // 24 h
  const TTL_USER       = 60 * 60 * 1000;        // 1 h

  function _read(key, ttl) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (ttl && Date.now() - obj.ts > ttl) return null;
      return obj;
    } catch (_) { return null; }
  }

  function _write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {
      // Quota exceeded — drop our own caches and give up quietly.
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf('cfstore_') === 0) localStorage.removeItem(k);
      });
    }
  }

  /* Problemset: [{ key, contestId, index, name, rating, tags, solved }] */
  async function getProblemset(force) {
    const key = 'cfstore_problemset';
    if (!force) {
      const c = _read(key, TTL_PROBLEMSET);
      if (c) return c.data;
    }
    const res   = await CFApi.fetchProblemset();
    const stats = {};
    res.problemStatistics.forEach(function (s) { stats[s.contestId + s.index] = s.solvedCount; });
    const list = res.problems.map(function (p) {
      const k = p.contestId + p.index;
      return { key: k, contestId: p.contestId, index: p.index, name: p.name,
               rating: p.rating || 0, tags: p.tags || [], solved: stats[k] || 0 };
    });
    _write(key, list);
    return list;
  }

  /* Submissions → { solved: {key:firstAcTime}, attempted: {key:true}, list: [...], fetchedAt } */
  async function getUserData(handle, force) {
    const key = 'cfstore_user_' + handle.toLowerCase();
    if (!force) {
      const c = _read(key, TTL_SUBS);
      if (c) return Object.assign({ fetchedAt: c.ts }, c.data);
    }
    const [info, subs] = await Promise.all([
      CFApi.fetchUserInfo(handle),
      CFApi.fetchSubmissions(handle)
    ]);
    const solved = {}, attempted = {};
    const tagsOf = {}, ratingOf = {};
    subs.forEach(function (s) {
      const k = s.problemKey;
      attempted[k] = true;
      tagsOf[k]    = s.problem.tags || [];
      ratingOf[k]  = s.problem.rating || 0;
      if (s.verdict === 'OK') {
        const t = s.creationTimeSeconds;
        if (!solved[k] || t < solved[k]) solved[k] = t;
      }
    });
    const data = {
      rating:    info.rating    || 0,
      maxRating: info.maxRating || 0,
      rank:      info.rank      || 'unrated',
      solved:    solved,
      attempted: attempted,
      tagsOf:    tagsOf,
      ratingOf:  ratingOf
    };
    _write(key, data);
    return Object.assign({ fetchedAt: Date.now() }, data);
  }

  /* Cheap lookup used by the algorithms page. */
  async function getSolvedKeys(handle, force) {
    const d = await getUserData(handle, force);
    return d.solved;
  }

  /* Seeded PRNG so a daily plan is deterministic. */
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function problemUrl(p) {
    return 'https://codeforces.com/problemset/problem/' + p.contestId + '/' + p.index;
  }

  /* Send code (and optional test cases) to the compiler page. */
  function openInCompiler(payload) {
    try { sessionStorage.setItem('cf_compiler_handoff', JSON.stringify(payload)); } catch (_) {}
    window.location.href = '/compiler.html';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Resolve the logged-in user's CF handle from their profile. */
  async function getHandle(session) {
    const p = await FirebaseClient.getProfile(session.user.id);
    return (p && p.cf_handle) || '';
  }

  global.CFStore = {
    getProblemset, getUserData, getSolvedKeys, getHandle,
    seeded, problemUrl, openInCompiler, esc,
    backend: (window.location.port === '3000') ? 'http://localhost:3001' : ''
  };

})(window);
