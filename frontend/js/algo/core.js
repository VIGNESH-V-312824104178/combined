/* =============================================================
   algo/core.js — registry + helpers for the Algorithm Guide.
   Article shape:
     { id, cat, title, summary, level: 1-3, time, space,
       body: '<html>', code: 'C++ source', problems: [...] }
   ============================================================= */
(function (g) {
  'use strict';
  g.ALGO_CATS = [
    'Fundamentals',
    'Data Structures',
    'Graphs',
    'Trees',
    'Dynamic Programming',
    'Math & Number Theory',
    'Strings',
    'Geometry'
  ];
  g.ALGO = [];
  g.algo = function (a) { g.ALGO.push(a); };
  g.cses = function (id, name) {
    return { name: name, site: 'CSES', url: 'https://cses.fi/problemset/task/' + id };
  };
  g.cf = function (contest, index, name) {
    return { name: contest + index + ' · ' + name, site: 'CF', key: String(contest) + index,
             url: 'https://codeforces.com/problemset/problem/' + contest + '/' + index };
  };
})(window);
