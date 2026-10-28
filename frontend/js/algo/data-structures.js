/* algo/data-structures.js */
algo({
  id: 'dsu', cat: 'Data Structures', title: 'Disjoint Set Union (Union-Find)', level: 1,
  summary: 'Merge sets and ask "are these connected?" in near-constant time.',
  time: 'O(α(n)) per op', space: 'O(n)',
  body: `
    <p>DSU keeps a forest where each tree is one set. <code>find(x)</code> walks to the root, <code>unite(a, b)</code> links two roots. Two optimisations make it practically O(1): <b>path compression</b> (flatten while walking) and <b>union by size</b> (hang the smaller tree under the larger).</p>
    <h2>Uses</h2>
    <ul>
      <li>Connected components in an undirected graph that grows by edges.</li>
      <li>Kruskal's MST and cycle detection.</li>
      <li>Offline "reverse deletion": process queries backwards and turn deletions into unions.</li>
      <li>Maintaining extra info per set (size, sum, min) at the root.</li>
    </ul>`,
  code: String.raw`struct DSU {
    vector<int> p, sz;
    DSU(int n) : p(n), sz(n, 1) { iota(p.begin(), p.end(), 0); }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) swap(a, b);
        p[b] = a; sz[a] += sz[b];
        return true;
    }
    int size(int x) { return sz[find(x)]; }
};`,
  problems: [
    cses(1666, 'Building Roads'), cses(1676, 'Road Construction'), cses(1675, 'Road Reparation'),
    cf(277, 'A', 'Learning Languages'), cf(25, 'D', 'Roads not only in Berland'), cf(292, 'D', 'Connected Components')
  ]
});

algo({
  id: 'fenwick', cat: 'Data Structures', title: 'Fenwick Tree (BIT)', level: 2,
  summary: 'Prefix sums with point updates in a dozen lines.',
  time: 'O(log n)', space: 'O(n)',
  body: `
    <p>A Fenwick tree stores partial sums so that both <b>point update</b> and <b>prefix query</b> touch only <code>O(log n)</code> cells. Index <code>i</code> is responsible for the range of length <code>i &amp; -i</code> ending at <code>i</code>.</p>
    <h2>Handy tricks</h2>
    <ul>
      <li>Range sum is <code>query(r) - query(l-1)</code>.</li>
      <li><b>Range add + point query</b>: BIT over the difference array.</li>
      <li><b>Counting inversions</b>: compress values, then for each element count how many bigger ones were already inserted.</li>
      <li><b>k-th element</b>: binary-lift down the tree in O(log n).</li>
    </ul>
    <p>It cannot do range min/max with updates. Use a segment tree for that.</p>`,
  code: String.raw`struct BIT {
    int n; vector<long long> t;
    BIT(int n) : n(n), t(n + 1, 0) {}
    void add(int i, long long v) { for (; i <= n; i += i & -i) t[i] += v; }   // 1-indexed
    long long sum(int i) { long long s = 0; for (; i > 0; i -= i & -i) s += t[i]; return s; }
    long long sum(int l, int r) { return sum(r) - sum(l - 1); }
};

// inversions: for each a[i] (compressed to 1..m) count earlier elements > a[i]
// inv += i - bit.sum(a[i]); bit.add(a[i], 1);`,
  problems: [
    cses(1648, 'Dynamic Range Sum Queries'), cses(1651, 'Range Update Queries'), cses(1652, 'Forest Queries'),
    cf(459, 'D', "Pashmak and Parmida's problem"), cf(61, 'E', 'Enemy is weak'), cf(597, 'C', 'Subsequences')
  ]
});

algo({
  id: 'segment-tree', cat: 'Data Structures', title: 'Segment Tree & Lazy Propagation', level: 2,
  summary: 'Range query + range update for any associative operation.',
  time: 'O(log n)', space: 'O(n)',
  body: `
    <p>A segment tree stores the combined value of every dyadic block of the array. A query decomposes <code>[l, r)</code> into <code>O(log n)</code> blocks. It works for any <b>associative</b> merge: sum, min, max, gcd, matrix product, "best subarray" tuples...</p>
    <h2>Lazy propagation</h2>
    <p>For range updates ("add v to every element in [l, r)"), keep a pending tag at a node and push it to the children only when you must descend. The tag must compose, and applying it to a node must update that node's value in O(1).</p>
    <h2>Tips</h2>
    <ul>
      <li>The iterative bottom-up version below is shortest to type, and fast. Use the recursive version when you need lazy tags.</li>
      <li>Store a struct (sum, best prefix, best suffix, best) to solve "maximum subarray in range".</li>
      <li>Segment tree descent finds the first index with <code>prefix &ge; x</code> in O(log n).</li>
    </ul>`,
  code: String.raw`// Iterative segment tree: point update, range query [l, r)
struct SegTree {
    int n; vector<long long> t;
    SegTree(int n) : n(n), t(2 * n, 0) {}
    void set(int i, long long v) {
        for (t[i += n] = v; i > 1; i >>= 1) t[i >> 1] = t[i] + t[i ^ 1];
    }
    long long query(int l, int r) {
        long long res = 0;
        for (l += n, r += n; l < r; l >>= 1, r >>= 1) {
            if (l & 1) res += t[l++];
            if (r & 1) res += t[--r];
        }
        return res;
    }
};  // change + to min/max (and identity 0 to INF) for other queries

// Recursive lazy: range add, range sum
struct Lazy {
    int n; vector<long long> s, z;
    Lazy(int n) : n(n), s(4 * n, 0), z(4 * n, 0) {}
    void apply(int x, int l, int r, long long v) { s[x] += v * (r - l); z[x] += v; }
    void push(int x, int l, int r) {
        if (!z[x]) return;
        int m = (l + r) / 2;
        apply(2 * x, l, m, z[x]); apply(2 * x + 1, m, r, z[x]); z[x] = 0;
    }
    void add(int x, int l, int r, int a, int b, long long v) {
        if (b <= l || r <= a) return;
        if (a <= l && r <= b) { apply(x, l, r, v); return; }
        push(x, l, r); int m = (l + r) / 2;
        add(2 * x, l, m, a, b, v); add(2 * x + 1, m, r, a, b, v);
        s[x] = s[2 * x] + s[2 * x + 1];
    }
    long long sum(int x, int l, int r, int a, int b) {
        if (b <= l || r <= a) return 0;
        if (a <= l && r <= b) return s[x];
        push(x, l, r); int m = (l + r) / 2;
        return sum(2 * x, l, m, a, b) + sum(2 * x + 1, m, r, a, b);
    }
};  // call add(1, 0, n, l, r, v) / sum(1, 0, n, l, r) with half-open [l, r)`,
  problems: [
    cses(1649, 'Dynamic Range Minimum Queries'), cses(1190, 'Subarray Sum Queries'), cses(1735, 'Range Updates and Sums'),
    cses(1143, 'Hotel Queries'), cf(339, 'D', 'Xenia and Bit Operations'), cf(380, 'C', 'Sereja and Brackets'), cf(52, 'C', 'Circular RMQ')
  ]
});

algo({
  id: 'sparse-table', cat: 'Data Structures', title: 'Sparse Table', level: 2,
  summary: 'O(1) range min/max on a static array after O(n log n) build.',
  time: 'O(n log n) build, O(1) query', space: 'O(n log n)',
  body: `
    <p><code>st[k][i]</code> stores the answer for the block of length <code>2^k</code> starting at <code>i</code>. Any range is covered by two (possibly overlapping) blocks, which is fine for <b>idempotent</b> operations like min, max, gcd, AND, OR. For these you get constant-time queries.</p>
    <p>For non-idempotent ops like sum you'd need the O(log n) disjoint decomposition, so just use prefix sums.</p>
    <h2>Also useful for</h2>
    <ul><li>LCA via Euler tour + RMQ.</li><li>Binary search on a range property (e.g. longest range where max &minus; min &le; k).</li></ul>`,
  code: String.raw`struct Sparse {
    vector<vector<int>> st;
    Sparse(const vector<int>& a) {
        int n = a.size(), K = 32 - __builtin_clz(n);
        st.assign(K, vector<int>(n));
        st[0] = a;
        for (int k = 1; k < K; k++)
            for (int i = 0; i + (1 << k) <= n; i++)
                st[k][i] = min(st[k - 1][i], st[k - 1][i + (1 << (k - 1))]);
    }
    int query(int l, int r) {          // inclusive
        int k = 31 - __builtin_clz(r - l + 1);
        return min(st[k][l], st[k][r - (1 << k) + 1]);
    }
};`,
  problems: [
    cses(1647, 'Static Range Minimum Queries'), cf(689, 'D', 'Friends and Subsequences'), cses(1143, 'Hotel Queries')
  ]
});

algo({
  id: 'trie', cat: 'Data Structures', title: 'Trie (Prefix Tree)', level: 2,
  summary: 'Store strings or binary numbers by prefix. Great for XOR queries.',
  time: 'O(length) per op', space: 'O(total length · alphabet)',
  body: `
    <p>A trie has one edge per character. All strings sharing a prefix share a path. Count how many words pass through each node and you can answer "how many strings start with <code>p</code>?" instantly.</p>
    <h2>Binary trie for XOR</h2>
    <p>Insert numbers as 30-bit strings, MSB first. To maximise <code>x ^ y</code> over stored <code>y</code>, walk down preferring the child whose bit is the <b>opposite</b> of the bit in <code>x</code>. This solves "max XOR pair" and "max XOR subarray" (with prefix XORs) in O(n log C).</p>`,
  code: String.raw`struct BinaryTrie {
    vector<array<int, 2>> ch{{-1, -1}};
    vector<int> cnt{0};
    void insert(unsigned x, int delta = 1) {
        int u = 0;
        for (int b = 29; b >= 0; b--) {
            int c = (x >> b) & 1;
            if (ch[u][c] == -1) { ch[u][c] = ch.size(); ch.push_back({-1, -1}); cnt.push_back(0); }
            u = ch[u][c]; cnt[u] += delta;
        }
    }
    unsigned max_xor(unsigned x) {          // trie must be non-empty
        int u = 0; unsigned res = 0;
        for (int b = 29; b >= 0; b--) {
            int want = ((x >> b) & 1) ^ 1;
            if (ch[u][want] != -1 && cnt[ch[u][want]] > 0) { res |= 1u << b; u = ch[u][want]; }
            else u = ch[u][want ^ 1];
        }
        return res;
    }
};`,
  problems: [
    cses(1731, 'Word Combinations'), cf(706, 'D', "Vasiliy's Multiset"), cf(282, 'E', 'Sausage Maximization'), cf(665, 'E', 'Beautiful Subarrays')
  ]
});

algo({
  id: 'mos-algorithm', cat: 'Data Structures', title: "Mo's Algorithm", level: 3,
  summary: 'Answer offline range queries by sorting them and sliding a window.',
  time: 'O((n + q) √n)', space: 'O(n + q)',
  body: `
    <p>Suppose you can <b>add</b> or <b>remove</b> one element from the current window and update the answer in O(1). Sort all queries <code>[l, r]</code> by <code>(l / B, r)</code> with block size <code>B &asymp; n / &radic;q</code>, then move two pointers from one query to the next. Total pointer movement is about <code>O(n &radic;q)</code>.</p>
    <h2>Details</h2>
    <ul>
      <li>Alternate the sort direction of <code>r</code> on odd blocks (Hilbert-order trick) to roughly halve the constant.</li>
      <li>Expand before you shrink, or the counts can go negative.</li>
      <li>Works on trees via Euler tour (queries on a path become ranges, with care for the LCA).</li>
    </ul>`,
  code: String.raw`struct Q { int l, r, id; };
int B = max(1, (int)(n / sqrt((double)q)));
sort(qs.begin(), qs.end(), [&](const Q& a, const Q& b) {
    if (a.l / B != b.l / B) return a.l < b.l;
    return (a.l / B & 1) ? a.r > b.r : a.r < b.r;
});
vector<long long> ans(q);
long long cur = 0; vector<int> cnt(MAXV, 0);
auto add = [&](int i){ /* update cur with a[i] */ };
auto rem = [&](int i){ /* undo a[i]            */ };
int L = 0, R = -1;
for (auto& qu : qs) {
    while (L > qu.l) add(--L);
    while (R < qu.r) add(++R);
    while (L < qu.l) rem(L++);
    while (R > qu.r) rem(R--);
    ans[qu.id] = cur;
}`,
  problems: [
    cf(86, 'D', 'Powerful array'), cf(617, 'E', 'XOR and Favorite Number'), cf(220, 'B', 'Little Elephant and Array'),
    cses(1734, 'Distinct Values Queries'), cf(375, 'D', 'Tree and Queries')
  ]
});
