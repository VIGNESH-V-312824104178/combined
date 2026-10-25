/* algo/fundamentals.js */
algo({
  id: 'binary-search', cat: 'Fundamentals', title: 'Binary Search', level: 1,
  summary: 'Halve the search space each step, on arrays and on the answer itself.',
  time: 'O(log n)', space: 'O(1)',
  body: `
    <p>Binary search works whenever you can ask a yes/no question that is <b>monotone</b>: false for a while, then true forever (or the reverse). You keep the invariant "answer lies in <code>[lo, hi]</code>" and cut the range in half each step.</p>
    <h2>Two flavours</h2>
    <ul>
      <li><b>On a sorted array</b>: find a value, or the first position <code>&ge; x</code> (<code>lower_bound</code>).</li>
      <li><b>On the answer</b>: "what is the smallest <code>X</code> such that <code>check(X)</code> is true?" Write <code>check</code> as a greedy or simulation, then binary search <code>X</code>. This is by far the more common use in contests.</li>
    </ul>
    <h2>Pitfalls</h2>
    <ul>
      <li>Use <code>lo + (hi - lo) / 2</code> and a loop shape you trust. The "first true" template below never loops forever.</li>
      <li>For real-valued answers iterate a fixed number of times (about 100) instead of comparing floats.</li>
      <li>Check that <code>check</code> really is monotone before you commit.</li>
    </ul>`,
  code: String.raw`// Smallest x in [lo, hi] with check(x) == true (check is monotone F...FT...T)
long long first_true(long long lo, long long hi, auto check) {
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (check(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;           // if check(hi) can be false, verify afterwards
}

// Example: machines with times t[i], smallest T so that sum(T / t[i]) >= k
// long long ans = first_true(1, 1e18, [&](long long T){
//     long long c = 0; for (auto x : t) { c += T / x; if (c >= k) return true; } return false; });`,
  problems: [
    cses(1640, 'Sum of Two Values'), cses(1620, 'Factory Machines'), cses(1085, 'Array Division'),
    cf(706, 'B', 'Interesting drink'), cf(670, 'D2', 'Magic Powder - 2'), cf(1201, 'C', 'Maximum Median')
  ]
});

algo({
  id: 'two-pointers', cat: 'Fundamentals', title: 'Two Pointers & Sliding Window', level: 1,
  summary: 'Maintain a window [l, r] that only ever moves forward.',
  time: 'O(n)', space: 'O(1)',
  body: `
    <p>When a window's property is monotone (growing it can only make a "bad" condition worse, shrinking only better), you never need to move <code>l</code> or <code>r</code> backwards. Each pointer travels the array once, so the whole scan is linear.</p>
    <h2>Typical shapes</h2>
    <ul>
      <li><b>Longest/shortest window</b> with sum, distinct count, or max&minus;min constraint.</li>
      <li><b>Pair with target sum</b> in a sorted array: one pointer at each end, move inward.</li>
      <li><b>Counting subarrays</b>: for each right end, the number of valid left ends is <code>r - l + 1</code>.</li>
    </ul>
    <h2>Pitfalls</h2>
    <p>Negative numbers break monotonicity of sums. Use prefix sums plus a map instead. For max/min inside the window use a monotonic deque or a multiset.</p>`,
  code: String.raw`// Longest subarray with at most k distinct values
int longest_k_distinct(const vector<int>& a, int k) {
    map<int,int> cnt;
    int best = 0;
    for (int l = 0, r = 0; r < (int)a.size(); r++) {
        cnt[a[r]]++;
        while ((int)cnt.size() > k) {
            if (--cnt[a[l]] == 0) cnt.erase(a[l]);
            l++;
        }
        best = max(best, r - l + 1);
    }
    return best;
}`,
  problems: [
    cses(1141, 'Playlist'), cses(1660, 'Subarray Sums I'), cses(1661, 'Subarray Sums II'),
    cf(279, 'B', 'Books'), cf(602, 'B', 'Approximate Constant Range')
  ]
});

algo({
  id: 'prefix-sums', cat: 'Fundamentals', title: 'Prefix Sums & Difference Arrays', level: 1,
  summary: 'O(1) range sums, and O(1) range updates applied once at the end.',
  time: 'O(n) build, O(1) query', space: 'O(n)',
  body: `
    <p>A prefix array <code>P[i] = a[0] + ... + a[i-1]</code> turns any range sum into <code>P[r+1] - P[l]</code>. Its mirror image, the <b>difference array</b>, lets you add a value to a whole range in O(1) and recover the final array with one prefix-sum pass.</p>
    <h2>Extensions</h2>
    <ul>
      <li><b>2D prefix sums</b>: <code>P[i][j] = a + P[i-1][j] + P[i][j-1] - P[i-1][j-1]</code>, rectangle query by inclusion&ndash;exclusion.</li>
      <li><b>Prefix + hash map</b>: count subarrays with sum <code>k</code> by looking up <code>P[r] - k</code>.</li>
      <li><b>Prefix XOR</b> works the same way, since XOR is its own inverse.</li>
    </ul>`,
  code: String.raw`vector<long long> P(n + 1, 0);
for (int i = 0; i < n; i++) P[i + 1] = P[i] + a[i];
auto range_sum = [&](int l, int r) { return P[r + 1] - P[l]; };   // inclusive [l, r]

// Difference array: add v to a[l..r]
vector<long long> D(n + 1, 0);
auto range_add = [&](int l, int r, long long v) { D[l] += v; D[r + 1] -= v; };
// after all updates: a[i] = a[i-1] + D[i]  (running sum of D)`,
  problems: [
    cses(1646, 'Static Range Sum Queries'), cses(1652, 'Forest Queries'), cses(1661, 'Subarray Sums II'),
    cf(276, 'C', 'Little Girl and Maximum Sum'), cf(466, 'C', 'Number of Ways'), cf(816, 'B', 'Karen and Coffee')
  ]
});

algo({
  id: 'greedy', cat: 'Fundamentals', title: 'Greedy & Exchange Arguments', level: 2,
  summary: 'Sort by the right key, then prove no swap can improve the answer.',
  time: 'usually O(n log n)', space: 'O(n)',
  body: `
    <p>A greedy algorithm repeatedly takes the locally best choice. It is only correct if you can argue why. The standard proof is an <b>exchange argument</b>: take any optimal solution that disagrees with the greedy choice and show you can swap in the greedy choice without making it worse.</p>
    <h2>Classic patterns</h2>
    <ul>
      <li><b>Interval scheduling</b>: sort by end time, take whatever starts after the last end.</li>
      <li><b>Deadlines / scheduling</b>: sort by duration (shortest first) or by deadline (earliest first), depending on the objective.</li>
      <li><b>Matching with sorted arrays</b>: pair smallest with smallest (two pointers).</li>
      <li><b>Priority queue greedy</b>: always grab the best available item, and undo a worse earlier pick if needed.</li>
    </ul>
    <h2>Tip</h2>
    <p>If a greedy "obviously works" but fails on test 2, brute-force small cases and compare. Contest greedy bugs are almost always a wrong sort key.</p>`,
  code: String.raw`// Max number of non-overlapping intervals: sort by END time
sort(iv.begin(), iv.end(), [](auto& a, auto& b){ return a.second < b.second; });
int cnt = 0; long long last = -1e18;
for (auto& [s, e] : iv)
    if (s >= last) { cnt++; last = e; }`,
  problems: [
    cses(1629, 'Movie Festival'), cses(1630, 'Tasks and Deadlines'), cses(1090, 'Ferris Wheel'), cses(1084, 'Apartments'),
    cf(160, 'A', 'Twins'), cf(545, 'D', 'Queue'), cf(489, 'C', 'Given Length and Sum of Digits')
  ]
});

algo({
  id: 'bit-manipulation', cat: 'Fundamentals', title: 'Bit Manipulation', level: 1,
  summary: 'Masks, subset enumeration, XOR tricks and popcount.',
  time: 'O(1) per op', space: 'O(1)',
  body: `
    <p>Integers are small bitsets. Learn the five idioms below and a surprising number of problems collapse.</p>
    <ul>
      <li><code>x &amp; (x-1)</code> clears the lowest set bit. <code>x &amp; -x</code> isolates it.</li>
      <li><code>1 &lt;&lt; k</code> is bit <code>k</code>. Test with <code>(x &gt;&gt; k) &amp; 1</code>. Use <code>1LL &lt;&lt; k</code> past 31 bits.</li>
      <li><code>__builtin_popcountll(x)</code> counts set bits, <code>__builtin_ctzll</code> / <code>__builtin_clzll</code> count trailing/leading zeros.</li>
      <li><b>XOR</b>: <code>a ^ a = 0</code>, so pairs cancel. This finds the single unpaired element.</li>
      <li><b>Enumerate all subsets</b> of <code>n &le; 20</code> items with <code>mask</code> from 0 to <code>2^n - 1</code>.</li>
    </ul>
    <h2>Per-bit thinking</h2>
    <p>For problems about AND/OR/XOR over many numbers, treat each bit position independently. Bits don't interact, so you solve 30 or 60 tiny problems.</p>`,
  code: String.raw`// All submasks of mask (including 0)
for (int sub = mask; ; sub = (sub - 1) & mask) {
    // process sub
    if (sub == 0) break;
}

// Count numbers in [0, n] with bit k set, per-bit counting
long long count_bit(long long n, int k) {
    long long cycle = 1LL << (k + 1);
    long long full = (n + 1) / cycle * (cycle / 2);
    long long rem = (n + 1) % cycle - cycle / 2;
    return full + max(0LL, rem);
}`,
  problems: [
    cses(1617, 'Bit Strings'), cses(1623, 'Apple Division'), cses(1624, 'Chessboard and Queens'),
    cf(579, 'A', 'Raising Bacteria'), cf(276, 'D', 'Little Girl and Maximum XOR')
  ]
});

algo({
  id: 'meet-in-the-middle', cat: 'Fundamentals', title: 'Meet in the Middle', level: 3,
  summary: 'Split a 2^n search into two 2^(n/2) halves and combine them.',
  time: 'O(2^(n/2) · n)', space: 'O(2^(n/2))',
  body: `
    <p>If brute force is <code>2^n</code> with <code>n &le; 40</code>, that's too slow, but <code>2^20</code> is trivial. Split the items into two halves, enumerate all subset-values of each half, then combine: for each value on the left, look up what you need on the right (sorted + binary search, two pointers, or a hash map).</p>
    <h2>When it applies</h2>
    <ul>
      <li>Subset sum / knapsack with large values but about 40 items.</li>
      <li>Counting subsets with sum equal to <code>S</code>, or closest to <code>S</code>.</li>
      <li>Path problems where you can search from both ends and join in the middle.</li>
    </ul>`,
  code: String.raw`// Count subsets of a[0..n) with sum == S (n up to ~40)
vector<long long> gen(const vector<long long>& v) {
    int m = v.size();
    vector<long long> res(1 << m, 0);
    for (int mask = 1; mask < (1 << m); mask++) {
        int b = __builtin_ctz(mask);
        res[mask] = res[mask & (mask - 1)] + v[b];
    }
    return res;
}
long long solve(const vector<long long>& a, long long S) {
    int h = a.size() / 2;
    auto L = gen({a.begin(), a.begin() + h}), R = gen({a.begin() + h, a.end()});
    sort(R.begin(), R.end());
    long long cnt = 0;
    for (long long x : L)
        cnt += upper_bound(R.begin(), R.end(), S - x) - lower_bound(R.begin(), R.end(), S - x);
    return cnt;
}`,
  problems: [
    cses(1628, 'Meet in the Middle'), cses(1623, 'Apple Division'),
    cf(525, 'E', 'Anya and Cubes'), cf(1006, 'F', 'Xor-Paths'), cf(888, 'E', 'Maximum Subsequence')
  ]
});
