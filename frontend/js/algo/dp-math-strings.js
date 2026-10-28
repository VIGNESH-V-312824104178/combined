/* algo/dp-math.js — DP, number theory */
algo({
  id: 'dp-basics', cat: 'Dynamic Programming', title: 'DP Fundamentals & Knapsack', level: 2,
  summary: 'State, transition, order. Then the 0/1 and unbounded knapsack.',
  time: 'O(states × transitions)', space: 'O(states)',
  body: `
    <p>Dynamic programming = <b>define a state</b> that captures everything about the past you need, <b>write a transition</b> from smaller states, and <b>evaluate in a valid order</b> (or memoise recursion). Ask: "what is the minimum information I must remember to decide the future?"</p>
    <h2>Knapsack family</h2>
    <ul>
      <li><b>0/1 knapsack</b>: each item once. Iterate capacity <b>downwards</b> in the 1D array.</li>
      <li><b>Unbounded</b>: items reusable. Iterate capacity <b>upwards</b>.</li>
      <li><b>Counting ways</b>: same shape with <code>+=</code>. Loop coins outermost for <i>combinations</i>, capacity outermost for <i>ordered sequences</i>.</li>
      <li><b>Bitset speed-up</b>: for pure feasibility ("can I make sum S?") use <code>bitset&lt;N&gt;</code> and <code>dp |= dp &lt;&lt; w</code>.</li>
    </ul>
    <h2>Debug checklist</h2>
    <p>Wrong base case, wrong iteration order, or an off-by-one in the state size cause nearly every WA. Verify with a brute force on tiny input.</p>`,
  code: String.raw`// 0/1 knapsack: max value with weight limit W
vector<long long> dp(W + 1, 0);
for (int i = 0; i < n; i++)
    for (int w = W; w >= wt[i]; w--)
        dp[w] = max(dp[w], dp[w - wt[i]] + val[i]);

// Coin combinations (order does not matter): number of ways to make x
vector<long long> ways(X + 1, 0); ways[0] = 1;
for (int c : coins)
    for (int x = c; x <= X; x++) ways[x] = (ways[x] + ways[x - c]) % MOD;

// Feasibility with bitset
bitset<100001> can; can[0] = 1;
for (int w : items) can |= can << w;`,
  problems: [
    cses(1633, 'Dice Combinations'), cses(1634, 'Minimizing Coins'), cses(1635, 'Coin Combinations I'), cses(1636, 'Coin Combinations II'),
    cses(1158, 'Book Shop'), cses(1745, 'Money Sums'), cses(1638, 'Grid Paths'), cf(189, 'A', 'Cut Ribbon'), cf(455, 'A', 'Boredom'), cf(106, 'C', 'Buns')
  ]
});

algo({
  id: 'lis', cat: 'Dynamic Programming', title: 'Longest Increasing Subsequence', level: 2,
  summary: 'The O(n log n) patience-sorting trick.',
  time: 'O(n log n)', space: 'O(n)',
  body: `
    <p>Keep an array <code>tail</code> where <code>tail[k]</code> is the smallest possible last element of an increasing subsequence of length <code>k+1</code>. It is always sorted, so for each new element binary-search where it belongs: replace the first <code>&ge; x</code> (strict LIS) or first <code>&gt; x</code> (non-decreasing).</p>
    <p>The length of <code>tail</code> is the answer. To recover the sequence itself, also store for each element its predecessor and the index sitting at each tail slot.</p>
    <h2>Related</h2>
    <ul>
      <li>Longest <i>decreasing</i> = LIS on negated values.</li>
      <li>Minimum number of increasing sequences covering the array = length of the longest non-increasing subsequence (Dilworth).</li>
      <li>LCS with distinct elements reduces to LIS.</li>
    </ul>`,
  code: String.raw`int lis_length(const vector<int>& a) {
    vector<int> tail;
    for (int x : a) {
        auto it = lower_bound(tail.begin(), tail.end(), x);   // upper_bound for non-decreasing
        if (it == tail.end()) tail.push_back(x);
        else *it = x;
    }
    return tail.size();
}`,
  problems: [
    cses(1145, 'Increasing Subsequence'), cses(1073, 'Towers'), cf(340, 'D', 'Bubble Sort Graph')
  ]
});

algo({
  id: 'bitmask-dp', cat: 'Dynamic Programming', title: 'Bitmask DP & SOS DP', level: 3,
  summary: 'Use a subset as the DP state when n ≤ 20.',
  time: 'O(2^n · n)', space: 'O(2^n)',
  body: `
    <p>When the state is "which items have I already used?" and <code>n &le; 20</code>, encode the set as a bitmask. Classic: <b>Travelling Salesman / Hamiltonian paths</b> with <code>dp[mask][last]</code>.</p>
    <h2>Patterns</h2>
    <ul>
      <li><b>Assignment / matching</b>: <code>dp[mask]</code> = best cost after assigning the first <code>popcount(mask)</code> people.</li>
      <li><b>Elevator / bin packing</b>: <code>dp[mask] = (rides, weight in last ride)</code>, minimised lexicographically.</li>
      <li><b>Broken profile</b>: tile a grid with the last row/col as the mask.</li>
      <li><b>SOS DP</b> (sum over subsets): for each bit, <code>f[mask] += f[mask ^ bit]</code> when <code>mask</code> has that bit. Computes the sum over all submasks of every mask in O(2^n &middot; n).</li>
    </ul>`,
  code: String.raw`// Count Hamiltonian paths 0 -> n-1 in a directed graph, n <= 20
vector<vector<long long>> dp(1 << n, vector<long long>(n, 0));
dp[1][0] = 1;
for (int mask = 1; mask < (1 << n); mask++)
    for (int last = 0; last < n; last++) {
        if (!dp[mask][last]) continue;
        for (int nxt : g[last])
            if (!(mask >> nxt & 1))
                dp[mask | 1 << nxt][nxt] = (dp[mask | 1 << nxt][nxt] + dp[mask][last]) % MOD;
    }
long long ans = dp[(1 << n) - 1][n - 1];

// SOS DP: f[mask] = sum of a[sub] over all submasks
for (int b = 0; b < n; b++)
    for (int mask = 0; mask < (1 << n); mask++)
        if (mask >> b & 1) f[mask] += f[mask ^ (1 << b)];`,
  problems: [
    cses(1690, 'Hamiltonian Flights'), cses(1653, 'Elevator Rides'), cses(2181, 'Counting Tilings'), cf(8, 'C', 'Looking for Order'), cf(165, 'E', 'Compatible Numbers')
  ]
});

algo({
  id: 'digit-dp', cat: 'Dynamic Programming', title: 'Digit DP', level: 3,
  summary: 'Count numbers in [0, N] with a digit-based property.',
  time: 'O(digits × states × 10)', space: 'O(digits × states)',
  body: `
    <p>To count integers in <code>[L, R]</code> with some digit property, compute <code>f(R) - f(L-1)</code>. For <code>f(N)</code>, build numbers digit by digit from the most significant, tracking: the <b>position</b>, a <b>tight</b> flag (are we still equal to N's prefix?), whether the number has <b>started</b> (to ignore leading zeros), plus any property state (digit sum, previous digit, remainder mod m...).</p>
    <p>Memoise only when <code>tight</code> is false, since only those states repeat across different prefixes.</p>`,
  code: String.raw`// Count numbers in [0, N] whose digit sum % 3 == 0 (example property)
string s; long long memo[20][3][2];
long long go(int pos, int rem, bool tight) {
    if (pos == (int)s.size()) return rem == 0;
    long long& m = memo[pos][rem][tight];
    if (m != -1) return m;
    int lim = tight ? s[pos] - '0' : 9;
    long long res = 0;
    for (int d = 0; d <= lim; d++)
        res += go(pos + 1, (rem + d) % 3, tight && d == lim);
    return m = res;
}
long long f(long long N) { s = to_string(N); memset(memo, -1, sizeof memo); return go(0, 0, true); }`,
  problems: [
    cses(2220, 'Counting Numbers'), cf(55, 'D', 'Beautiful numbers'), cf(628, 'D', 'Magic Numbers')
  ]
});

algo({
  id: 'sieve', cat: 'Math & Number Theory', title: 'Sieve & Prime Factorization', level: 1,
  summary: 'All primes up to N, smallest prime factors, divisor counts.',
  time: 'O(n log log n)', space: 'O(n)',
  body: `
    <p>The <b>Sieve of Eratosthenes</b> crosses out multiples of each prime, starting from <code>p&sup2;</code>. Store the <b>smallest prime factor</b> (<code>spf</code>) instead of a boolean and you can factorise any <code>x &le; N</code> in O(log x) by repeatedly dividing.</p>
    <h2>Other tools</h2>
    <ul>
      <li><b>Trial division</b> up to <code>&radic;x</code> factorises a single number up to about 10<sup>12</sup>.</li>
      <li><b>Divisor count / sum</b> from the exponents: <code>&prod;(e<sub>i</sub> + 1)</code>.</li>
      <li><b>Euler's totient</b> <code>&phi;(n) = n &prod; (1 - 1/p)</code>, sieve-able in the same pass.</li>
      <li>Counting divisors of all numbers 1..N: harmonic-sum loop <code>for d: for multiple of d</code> in O(N log N).</li>
    </ul>`,
  code: String.raw`const int N = 1e6 + 1;
vector<int> spf(N, 0), primes;
for (int i = 2; i < N; i++) {
    if (!spf[i]) { spf[i] = i; primes.push_back(i); }
    for (int p : primes) {
        if (p > spf[i] || 1LL * i * p >= N) break;
        spf[i * p] = p;                     // linear sieve: each composite visited once
    }
}
// factorise x <= N
vector<pair<int,int>> factor(int x) {
    vector<pair<int,int>> f;
    while (x > 1) {
        int p = spf[x], e = 0;
        while (x % p == 0) x /= p, e++;
        f.push_back({p, e});
    }
    return f;
}`,
  problems: [
    cses(1713, 'Counting Divisors'), cses(1082, 'Sum of Divisors'), cses(1081, 'Common Divisors'),
    cf(230, 'B', 'T-primes'), cf(26, 'A', 'Almost Prime'), cf(271, 'B', 'Prime Matrix')
  ]
});

algo({
  id: 'modular-arithmetic', cat: 'Math & Number Theory', title: 'Modular Arithmetic & Combinatorics', level: 2,
  summary: 'Fast exponentiation, inverses, factorials and nCr mod p.',
  time: 'O(log m) per pow', space: 'O(n)',
  body: `
    <p>When the statement says "print the answer modulo 10<sup>9</sup>+7", every <code>+</code>, <code>-</code>, <code>&times;</code> must be reduced. <b>Division</b> becomes multiplication by the modular inverse. For prime <code>p</code>, <code>a<sup>-1</sup> = a<sup>p-2</sup> mod p</code> (Fermat).</p>
    <h2>nCr in O(1) after O(n) precompute</h2>
    <p>Precompute <code>fact[i]</code> and <code>inv_fact[i]</code>; then <code>C(n,k) = fact[n] &middot; inv_fact[k] &middot; inv_fact[n-k]</code>.</p>
    <h2>Pitfalls</h2>
    <ul>
      <li>Multiply in <code>long long</code>, reduce after every multiplication. Subtraction needs <code>+ MOD</code>.</li>
      <li>Fermat inverse requires a <b>prime</b> modulus. Otherwise use extended Euclid.</li>
      <li>Exponents are reduced mod <code>p-1</code>, <b>not</b> mod <code>p</code>.</li>
    </ul>`,
  code: String.raw`const long long MOD = 1e9 + 7;
long long power(long long b, long long e, long long m = MOD) {
    long long r = 1; b %= m;
    for (; e > 0; e >>= 1, b = b * b % m) if (e & 1) r = r * b % m;
    return r;
}
long long inv(long long a) { return power(a, MOD - 2); }

const int N = 1e6 + 5;
long long fact[N], ifact[N];
void init() {
    fact[0] = 1;
    for (int i = 1; i < N; i++) fact[i] = fact[i - 1] * i % MOD;
    ifact[N - 1] = inv(fact[N - 1]);
    for (int i = N - 1; i > 0; i--) ifact[i - 1] = ifact[i] * i % MOD;
}
long long C(int n, int k) { return (k < 0 || k > n) ? 0 : fact[n] * ifact[k] % MOD * ifact[n - k] % MOD; }`,
  problems: [
    cses(1095, 'Exponentiation'), cses(1712, 'Exponentiation II'), cses(1079, 'Binomial Coefficients'), cses(1715, 'Creating Strings II'), cf(300, 'C', 'Beautiful Numbers')
  ]
});

algo({
  id: 'gcd-euclid', cat: 'Math & Number Theory', title: 'GCD, LCM & Extended Euclid', level: 2,
  summary: 'Euclid, Bézout coefficients, and linear Diophantine equations.',
  time: 'O(log min(a,b))', space: 'O(1)',
  body: `
    <p><code>gcd(a, b) = gcd(b, a mod b)</code>. And <code>lcm(a, b) = a / gcd(a, b) * b</code>. Divide first to avoid overflow. In C++17 use <code>std::gcd</code>.</p>
    <h2>Extended Euclid</h2>
    <p>Finds integers <code>x, y</code> with <code>ax + by = gcd(a, b)</code>. This gives <b>modular inverses for any coprime modulus</b>, and solves <code>ax + by = c</code>: a solution exists iff <code>gcd | c</code>, and all solutions are <code>(x<sub>0</sub> + k&middot;b/g, y<sub>0</sub> - k&middot;a/g)</code>.</p>
    <h2>Handy facts</h2>
    <ul>
      <li><code>gcd</code> of a range is monotone as you extend it. It changes at most log times, so sparse tables or "distinct gcds ending here" lists work.</li>
      <li><code>gcd(a, b) = gcd(a, b - a)</code> means differences matter: <code>gcd</code> of an array's pairwise differences = gcd of adjacent differences.</li>
    </ul>`,
  code: String.raw`long long ext_gcd(long long a, long long b, long long& x, long long& y) {
    if (!b) { x = 1; y = 0; return a; }
    long long x1, y1, g = ext_gcd(b, a % b, x1, y1);
    x = y1; y = x1 - (a / b) * y1;
    return g;
}
// modular inverse of a mod m (gcd(a,m) == 1)
long long inv_mod(long long a, long long m) {
    long long x, y; ext_gcd(a, m, x, y);
    return (x % m + m) % m;
}`,
  problems: [
    cses(1081, 'Common Divisors'), cses(1082, 'Sum of Divisors'), cf(300, 'C', 'Beautiful Numbers')
  ]
});

algo({
  id: 'matrix-exponentiation', cat: 'Math & Number Theory', title: 'Matrix Exponentiation', level: 3,
  summary: 'Jump a linear recurrence forward N steps in O(k³ log N).',
  time: 'O(k³ log N)', space: 'O(k²)',
  body: `
    <p>Any linear recurrence like <code>F(n) = F(n-1) + F(n-2)</code> can be written as <code>v(n) = M &middot; v(n-1)</code> for a state vector and a constant matrix <code>M</code>. Then <code>v(n) = M<sup>n</sup> &middot; v(0)</code>, and <code>M<sup>n</sup></code> is computed by repeated squaring.</p>
    <h2>Beyond Fibonacci</h2>
    <ul>
      <li>Add a constant-1 component to handle <code>+ c</code> terms.</li>
      <li>Counting walks of length <code>L</code> in a graph: <code>(A<sup>L</sup>)[u][v]</code>.</li>
      <li>DP over a small state space (&le; ~50 states) with a huge number of steps: build the transition matrix.</li>
      <li>Use <code>min-plus</code> multiplication for shortest walk of exactly L edges.</li>
    </ul>`,
  code: String.raw`using Mat = vector<vector<long long>>;
Mat mul(const Mat& A, const Mat& B) {
    int n = A.size();
    Mat C(n, vector<long long>(n, 0));
    for (int i = 0; i < n; i++)
        for (int k = 0; k < n; k++) if (A[i][k])
            for (int j = 0; j < n; j++)
                C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD;
    return C;
}
Mat mpow(Mat A, long long e) {
    int n = A.size();
    Mat R(n, vector<long long>(n, 0));
    for (int i = 0; i < n; i++) R[i][i] = 1;
    for (; e > 0; e >>= 1, A = mul(A, A)) if (e & 1) R = mul(R, A);
    return R;
}
// Fibonacci: [[1,1],[1,0]]^n  ->  F(n) = result[0][1]`,
  problems: [
    cses(1722, 'Fibonacci Numbers'), cses(1723, 'Graph Paths I'), cf(185, 'A', 'Plant')
  ]
});

algo({
  id: 'prefix-function-kmp', cat: 'Strings', title: 'Prefix Function & KMP', level: 2,
  summary: 'Longest border of every prefix; linear-time pattern matching.',
  time: 'O(n)', space: 'O(n)',
  body: `
    <p><code>pi[i]</code> is the length of the longest proper prefix of <code>s[0..i]</code> that is also a suffix of it (its longest <b>border</b>). Compute it left to right: start from <code>pi[i-1]</code> and fall back through <code>pi</code> until the next character matches.</p>
    <h2>What it gives you</h2>
    <ul>
      <li><b>Pattern matching</b>: run it on <code>pattern + '#' + text</code>. Every position with <code>pi == |pattern|</code> is a match.</li>
      <li><b>Smallest period</b> of <code>s</code>: <code>n - pi[n-1]</code>, and it's a full period only if it divides n.</li>
      <li><b>All borders</b>: follow the chain <code>pi[n-1], pi[pi[n-1]-1], ...</code>.</li>
      <li><b>KMP automaton</b> for DP over "how much of the pattern is matched".</li>
    </ul>`,
  code: String.raw`vector<int> prefix_function(const string& s) {
    int n = s.size();
    vector<int> pi(n, 0);
    for (int i = 1; i < n; i++) {
        int k = pi[i - 1];
        while (k > 0 && s[i] != s[k]) k = pi[k - 1];
        if (s[i] == s[k]) k++;
        pi[i] = k;
    }
    return pi;
}
// occurrences of p in t
vector<int> find_all(const string& p, const string& t) {
    auto pi = prefix_function(p + '#' + t);
    vector<int> pos;
    for (int i = p.size() + 1; i < (int)pi.size(); i++)
        if (pi[i] == (int)p.size()) pos.push_back(i - 2 * p.size());
    return pos;
}`,
  problems: [
    cses(1753, 'String Matching'), cses(1732, 'Finding Borders'), cses(1733, 'Finding Periods'),
    cf(126, 'B', 'Password'), cf(432, 'D', 'Prefixes and Suffixes'), cf(471, 'D', 'MUH and Cube Walls')
  ]
});

algo({
  id: 'z-function', cat: 'Strings', title: 'Z-function', level: 2,
  summary: 'For each i, the length of the longest common prefix of s and s[i..].',
  time: 'O(n)', space: 'O(n)',
  body: `
    <p><code>z[i]</code> = length of the longest substring starting at <code>i</code> that matches a prefix of <code>s</code>. Maintain the rightmost match window <code>[l, r)</code>; inside it, <code>z[i]</code> can be seeded from <code>z[i - l]</code> and only extended past <code>r</code> by direct comparison, so total work is linear.</p>
    <p>Same power as the prefix function and they convert into each other. Z is often easier to reason about for "does the suffix at <code>i</code> equal a prefix?" questions, and for pattern search on <code>p + '#' + t</code> (matches where <code>z == |p|</code>).</p>`,
  code: String.raw`vector<int> z_function(const string& s) {
    int n = s.size();
    vector<int> z(n, 0);
    for (int i = 1, l = 0, r = 0; i < n; i++) {
        if (i < r) z[i] = min(r - i, z[i - l]);
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
        if (i + z[i] > r) l = i, r = i + z[i];
    }
    return z;
}`,
  problems: [
    cses(1753, 'String Matching'), cses(1732, 'Finding Borders'), cf(535, 'D', 'Tavas and Malekas'), cf(126, 'B', 'Password')
  ]
});

algo({
  id: 'string-hashing', cat: 'Strings', title: 'String Hashing', level: 2,
  summary: 'Compare substrings in O(1) after O(n) preprocessing.',
  time: 'O(n) build, O(1) compare', space: 'O(n)',
  body: `
    <p>Treat the string as a number in base <code>B</code> modulo a large prime: <code>h[i+1] = h[i]&middot;B + s[i]</code>. The hash of <code>s[l..r)</code> is <code>h[r] - h[l]&middot;B<sup>r-l</sup></code>. Equal strings always collide, unequal strings collide with probability about <code>1/M</code>.</p>
    <h2>Make it hack-proof</h2>
    <ul>
      <li>Use a <b>random base</b>, and mod <code>2<sup>61</sup>-1</code> (or two moduli). Anti-hash tests target fixed bases and 2<sup>64</sup> overflow.</li>
      <li>Never hash with natural overflow (<code>unsigned long long</code> mod 2<sup>64</sup>). The Thue-Morse string breaks it.</li>
    </ul>
    <h2>Uses</h2>
    <p>Longest common substring (binary search on length), palindromic checks (forward vs reverse hash), counting distinct substrings of a given length (hash set).</p>`,
  code: String.raw`struct Hasher {
    static const unsigned long long M = (1ULL << 61) - 1;
    static unsigned long long mulmod(unsigned long long a, unsigned long long b) {
        __uint128_t t = (__uint128_t)a * b;
        unsigned long long r = (t & M) + (t >> 61);
        return r >= M ? r - M : r;
    }
    vector<unsigned long long> h, pw;
    Hasher(const string& s, unsigned long long B) : h(s.size() + 1, 0), pw(s.size() + 1, 1) {
        for (size_t i = 0; i < s.size(); i++) {
            pw[i + 1] = mulmod(pw[i], B);
            h[i + 1] = (mulmod(h[i], B) + (unsigned char)s[i]) % M;
        }
    }
    unsigned long long get(int l, int r) {        // hash of s[l..r)
        return (h[r] + M - mulmod(h[l], pw[r - l])) % M;
    }
};
// mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
// unsigned long long B = rng() % (Hasher::M - 1000) + 500;`,
  problems: [
    cses(1753, 'String Matching'), cses(1733, 'Finding Periods'), cf(154, 'C', 'Double Profiles'), cf(1200, 'E', 'Compress Words')
  ]
});

algo({
  id: 'manacher', cat: 'Strings', title: "Manacher's Algorithm", level: 3,
  summary: 'All palindromic substrings in linear time.',
  time: 'O(n)', space: 'O(n)',
  body: `
    <p>For every center, Manacher computes the palindrome radius, reusing the mirror image inside the current rightmost palindrome. Handle odd and even palindromes separately (<code>d1</code>, <code>d2</code>), or interleave a separator character to unify them.</p>
    <p>With the radii you can list the longest palindromic substring, count all palindromic substrings (sum of radii), or test if any substring is a palindrome in O(1).</p>`,
  code: String.raw`// d1[i] = number of odd palindromes centred at i, d2[i] = even ones centred between i-1 and i
void manacher(const string& s, vector<int>& d1, vector<int>& d2) {
    int n = s.size(); d1.assign(n, 0); d2.assign(n, 0);
    for (int i = 0, l = 0, r = -1; i < n; i++) {
        int k = (i > r) ? 1 : min(d1[l + r - i], r - i + 1);
        while (i - k >= 0 && i + k < n && s[i - k] == s[i + k]) k++;
        d1[i] = k--;
        if (i + k > r) l = i - k, r = i + k;
    }
    for (int i = 0, l = 0, r = -1; i < n; i++) {
        int k = (i > r) ? 0 : min(d2[l + r - i + 1], r - i + 1);
        while (i - k - 1 >= 0 && i + k < n && s[i - k - 1] == s[i + k]) k++;
        d2[i] = k--;
        if (i + k > r) l = i - k - 1, r = i + k;
    }
}`,
  problems: [
    cses(1111, 'Longest Palindrome'), cf(137, 'D', 'Palindromes')
  ]
});

algo({
  id: 'convex-hull', cat: 'Geometry', title: 'Cross Product & Convex Hull', level: 2,
  summary: 'Orientation tests, polygon area, and the monotone-chain hull.',
  time: 'O(n log n)', space: 'O(n)',
  body: `
    <p>Almost all competitive geometry runs on one primitive, the <b>cross product</b>: <code>cross(a, b) = a.x&middot;b.y - a.y&middot;b.x</code>. Its sign tells you whether <code>b</code> is counter-clockwise (+), clockwise (&minus;) or collinear (0) relative to <code>a</code>. Use <code>long long</code> and avoid floating point whenever the inputs are integers.</p>
    <h2>Toolbox</h2>
    <ul>
      <li><b>Polygon area</b> (shoelace): half the sum of <code>cross(p[i], p[i+1])</code>. Keep it doubled to stay in integers.</li>
      <li><b>Segment intersection</b>: orientation tests + bounding-box check for collinear cases.</li>
      <li><b>Point in polygon</b>: ray casting, or binary search on a convex polygon.</li>
      <li><b>Convex hull</b> (Andrew's monotone chain): sort by x then y, build lower and upper hulls with a stack, popping while the turn isn't strictly left.</li>
    </ul>`,
  code: String.raw`typedef long long ll;
struct P { ll x, y; bool operator<(const P& o) const { return x != o.x ? x < o.x : y < o.y; } };
ll cross(P o, P a, P b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }

vector<P> convex_hull(vector<P> p) {
    sort(p.begin(), p.end());
    p.erase(unique(p.begin(), p.end(), [](P a, P b){ return a.x == b.x && a.y == b.y; }), p.end());
    int n = p.size(); if (n < 3) return p;
    vector<P> h(2 * n); int k = 0;
    for (int i = 0; i < n; i++) {                       // lower hull
        while (k >= 2 && cross(h[k - 2], h[k - 1], p[i]) <= 0) k--;
        h[k++] = p[i];
    }
    for (int i = n - 2, t = k + 1; i >= 0; i--) {       // upper hull
        while (k >= t && cross(h[k - 2], h[k - 1], p[i]) <= 0) k--;
        h[k++] = p[i];
    }
    h.resize(k - 1);                                    // counter-clockwise, no collinear points
    return h;
}`,
  problems: [
    cses(2189, 'Point Location Test'), cses(2190, 'Line Segment Intersection'), cses(2191, 'Polygon Area'),
    cses(2192, 'Point in Polygon'), cses(2193, 'Polygon Lattice Points'), cses(2195, 'Convex Hull')
  ]
});
