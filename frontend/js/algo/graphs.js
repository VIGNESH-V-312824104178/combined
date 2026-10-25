/* algo/graphs.js — graphs and trees */
algo({
  id: 'bfs-dfs', cat: 'Graphs', title: 'BFS & DFS', level: 1,
  summary: 'The two ways to walk a graph, and what each is good for.',
  time: 'O(V + E)', space: 'O(V)',
  body: `
    <p><b>BFS</b> explores by distance layers, so on an unweighted graph the first time you reach a node is a shortest path. <b>DFS</b> dives as deep as possible, giving you entry/exit times, components, cycle detection, and topological order.</p>
    <h2>Pick the right one</h2>
    <ul>
      <li>Shortest path with equal edge cost &rarr; <b>BFS</b>. With 0/1 costs &rarr; 0-1 BFS (deque).</li>
      <li>Grid flood fill / counting components &rarr; either; BFS avoids deep recursion.</li>
      <li>Bipartite check &rarr; 2-colour with BFS or DFS.</li>
      <li>Multi-source BFS: push every source at distance 0 (e.g. "distance to the nearest monster").</li>
    </ul>
    <h2>Pitfall</h2>
    <p>Recursive DFS on 2&middot;10<sup>5</sup> nodes can overflow the stack on some judges. Use an explicit stack for long chains.</p>`,
  code: String.raw`vector<vector<int>> g(n);
// BFS from s
vector<int> dist(n, -1), par(n, -1);
queue<int> q; q.push(s); dist[s] = 0;
while (!q.empty()) {
    int u = q.front(); q.pop();
    for (int v : g[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; q.push(v); }
}

// DFS with entry/exit times
vector<int> tin(n), tout(n); int timer = 0;
function<void(int,int)> dfs = [&](int u, int p) {
    tin[u] = timer++;
    for (int v : g[u]) if (v != p) dfs(v, u);
    tout[u] = timer;
};`,
  problems: [
    cses(1192, 'Counting Rooms'), cses(1193, 'Labyrinth'), cses(1667, 'Message Route'), cses(1668, 'Building Teams'),
    cses(1194, 'Monsters'), cf(580, 'C', 'Kefa and Park'), cf(520, 'B', 'Two Buttons')
  ]
});

algo({
  id: 'dijkstra', cat: 'Graphs', title: "Dijkstra's Shortest Paths", level: 2,
  summary: 'Single-source shortest paths with non-negative weights.',
  time: 'O((V + E) log V)', space: 'O(V + E)',
  body: `
    <p>Always finalise the unvisited node with the smallest tentative distance, then relax its edges. A min-heap makes "smallest" cheap. Skip stale heap entries by comparing the popped distance with <code>dist[u]</code>.</p>
    <h2>Variants you'll meet</h2>
    <ul>
      <li><b>Count / reconstruct shortest paths</b>: keep a counter or parent that updates on equal distance.</li>
      <li><b>State-expanded graphs</b>: node = (vertex, extra state), e.g. "used the discount coupon" (CSES Flight Discount).</li>
      <li><b>Negative edges</b> break the algorithm. Use Bellman-Ford or SPFA instead.</li>
    </ul>
    <p>Use <code>long long</code> distances and an INF like <code>4e18 / 4</code> so additions don't overflow.</p>`,
  code: String.raw`const long long INF = (long long)4e18;
vector<vector<pair<int,long long>>> g(n);   // (to, weight)
vector<long long> dist(n, INF);
priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
dist[s] = 0; pq.push({0, s});
while (!pq.empty()) {
    auto [d, u] = pq.top(); pq.pop();
    if (d > dist[u]) continue;                 // stale entry
    for (auto [v, w] : g[u])
        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; pq.push({dist[v], v}); }
}`,
  problems: [
    cses(1671, 'Shortest Routes I'), cses(1195, 'Flight Discount'), cses(1202, 'Investigation'),
    cf(20, 'C', 'Dijkstra?'), cf(715, 'B', 'Complete The Graph')
  ]
});

algo({
  id: 'bellman-ford-floyd', cat: 'Graphs', title: 'Bellman-Ford & Floyd-Warshall', level: 2,
  summary: 'Negative edges, negative cycles, and all-pairs distances.',
  time: 'O(VE) / O(V³)', space: 'O(V) / O(V²)',
  body: `
    <p><b>Bellman-Ford</b> relaxes every edge <code>V-1</code> times. If an edge can still be relaxed on the <code>V</code>-th round, a negative cycle is reachable. Track which nodes got relaxed to recover the cycle.</p>
    <p><b>Floyd-Warshall</b> computes all-pairs shortest paths: for each intermediate vertex <code>k</code>, try <code>d[i][k] + d[k][j]</code>. The loop order (k outermost) is essential. It's perfect for <code>V &le; 500</code>, and also gives transitive closure with booleans.</p>`,
  code: String.raw`// Bellman-Ford: returns true if a negative cycle is reachable from s
struct E { int u, v; long long w; };
bool bellman(int n, int s, vector<E>& es, vector<long long>& d) {
    const long long INF = 4e18;
    d.assign(n, INF); d[s] = 0;
    for (int it = 0; it < n; it++) {
        bool any = false;
        for (auto& e : es)
            if (d[e.u] < INF && d[e.u] + e.w < d[e.v]) { d[e.v] = d[e.u] + e.w; any = true; }
        if (!any) return false;
        if (it == n - 1) return true;
    }
    return false;
}

// Floyd-Warshall on matrix d (INF for no edge, d[i][i] = 0)
for (int k = 0; k < n; k++)
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            if (d[i][k] < INF && d[k][j] < INF) d[i][j] = min(d[i][j], d[i][k] + d[k][j]);`,
  problems: [
    cses(1672, 'Shortest Routes II'), cses(1673, 'High Score'), cses(1197, 'Cycle Finding'),
    cf(25, 'C', 'Roads in Berland'), cf(295, 'B', 'Greg and Graph')
  ]
});

algo({
  id: 'topological-sort', cat: 'Graphs', title: 'Topological Sort & DAG DP', level: 2,
  summary: 'Order a DAG so every edge goes forward, then run DP in that order.',
  time: 'O(V + E)', space: 'O(V)',
  body: `
    <p>Kahn's algorithm repeatedly removes a node with in-degree 0. If you can't remove all nodes, the graph has a cycle. Once you have a topological order, <b>DP over a DAG</b> is trivial: process nodes in order and push values along edges (longest path, number of paths, reachability...).</p>
    <h2>When you see it</h2>
    <ul>
      <li>"Task A must finish before task B" (course schedule).</li>
      <li>Counting paths or longest path in a directed acyclic graph.</li>
      <li>Condensing SCCs yields a DAG, then DP on the condensation.</li>
    </ul>`,
  code: String.raw`vector<int> indeg(n, 0), order;
for (int u = 0; u < n; u++) for (int v : g[u]) indeg[v]++;
queue<int> q;
for (int i = 0; i < n; i++) if (!indeg[i]) q.push(i);
while (!q.empty()) {
    int u = q.front(); q.pop(); order.push_back(u);
    for (int v : g[u]) if (--indeg[v] == 0) q.push(v);
}
bool has_cycle = (int)order.size() != n;
// DAG DP: number of paths 0 -> n-1
vector<long long> ways(n, 0); ways[0] = 1;
for (int u : order) for (int v : g[u]) ways[v] = (ways[v] + ways[u]) % MOD;`,
  problems: [
    cses(1679, 'Course Schedule'), cses(1680, 'Longest Flight Route'), cses(1681, 'Game Routes'), cf(510, 'C', 'Fox and Names')
  ]
});

algo({
  id: 'mst', cat: 'Graphs', title: 'Minimum Spanning Tree (Kruskal)', level: 2,
  summary: 'Connect everything at minimum total weight using sort + DSU.',
  time: 'O(E log E)', space: 'O(V + E)',
  body: `
    <p>Sort edges by weight and add each one that connects two different components (checked with DSU). By the <b>cut property</b>, the cheapest edge crossing any cut belongs to some MST, so this greedy is optimal.</p>
    <h2>Good to know</h2>
    <ul>
      <li>If you end with fewer than <code>V-1</code> edges, the graph is disconnected (you built a spanning forest).</li>
      <li>For "maximum spanning tree" sort descending.</li>
      <li>Prim's algorithm is better on dense graphs, but Kruskal is shorter to write.</li>
      <li>The MST path between two nodes minimises the <b>maximum</b> edge (bottleneck path).</li>
    </ul>`,
  code: String.raw`// edges: (w, u, v); uses DSU from the DSU article
sort(edges.begin(), edges.end());
long long total = 0; int used = 0;
DSU d(n);
for (auto& [w, u, v] : edges)
    if (d.unite(u, v)) { total += w; used++; }
bool connected = (used == n - 1);`,
  problems: [
    cses(1675, 'Road Reparation'), cses(1676, 'Road Construction'), cf(1095, 'F', 'Make It Connected'), cf(609, 'E', 'Minimum spanning tree for each edge')
  ]
});

algo({
  id: 'scc', cat: 'Graphs', title: 'Strongly Connected Components', level: 3,
  summary: 'Collapse directed cycles into single nodes (Kosaraju).',
  time: 'O(V + E)', space: 'O(V + E)',
  body: `
    <p>An SCC is a maximal set of nodes that can all reach each other. <b>Kosaraju</b>: (1) run DFS on the graph and record finishing order, (2) run DFS on the <i>reversed</i> graph in reverse finishing order. Each DFS tree in step 2 is one SCC.</p>
    <p>Contracting every SCC to a node gives a <b>DAG</b>, and that's the whole point: most hard directed-graph problems become easy DP on the condensation (reachability, longest path, "how many sources/sinks to add").</p>
    <h2>Related</h2>
    <p><b>2-SAT</b> reduces to SCC: variable <code>x</code> and <code>&not;x</code> in the same component means unsatisfiable.</p>`,
  code: String.raw`vector<vector<int>> g(n), rg(n);
vector<int> order, comp(n, -1); vector<bool> seen(n, false);
function<void(int)> dfs1 = [&](int u) {
    seen[u] = true;
    for (int v : g[u]) if (!seen[v]) dfs1(v);
    order.push_back(u);
};
function<void(int,int)> dfs2 = [&](int u, int c) {
    comp[u] = c;
    for (int v : rg[u]) if (comp[v] < 0) dfs2(v, c);
};
for (int i = 0; i < n; i++) if (!seen[i]) dfs1(i);
int C = 0;
for (int i = n - 1; i >= 0; i--) if (comp[order[i]] < 0) dfs2(order[i], C++);
// comp[u] in [0, C) — components are numbered in topological order of the condensation`,
  problems: [
    cses(1682, 'Flight Routes Check'), cses(1683, 'Planets and Kingdoms'), cses(1686, 'Coin Collector'),
    cses(1684, 'Giant Pizza'), cf(427, 'C', 'Checkposts')
  ]
});

algo({
  id: 'max-flow', cat: 'Graphs', title: 'Maximum Flow (Dinic)', level: 3,
  summary: 'Push as much as possible from source to sink; model matching and cuts.',
  time: 'O(V²E) worst, fast in practice', space: 'O(V + E)',
  body: `
    <p>Each edge has a capacity. Dinic repeats two phases: a BFS builds a <b>level graph</b>, then DFS pushes <b>blocking flow</b> along level-increasing edges using a "current arc" pointer so no edge is rescanned. Reverse edges let the algorithm undo earlier choices.</p>
    <h2>Modelling is the real skill</h2>
    <ul>
      <li><b>Bipartite matching</b>: source &rarr; left (cap 1), left &rarr; right (cap 1), right &rarr; sink (cap 1). On unit networks Dinic runs in <code>O(E &radic;V)</code>.</li>
      <li><b>Max-flow = min-cut</b>: the minimum edges whose removal disconnects s from t (CSES Police Chase).</li>
      <li><b>Edge-disjoint paths</b>: unit capacities.</li>
      <li>Node capacities: split each node into in/out with an edge of that capacity.</li>
    </ul>`,
  code: String.raw`struct Dinic {
    struct E { int to; long long cap; };
    vector<E> es; vector<vector<int>> g; vector<int> lvl, it;
    Dinic(int n) : g(n), lvl(n), it(n) {}
    void add(int u, int v, long long c) {
        g[u].push_back(es.size()); es.push_back({v, c});
        g[v].push_back(es.size()); es.push_back({u, 0});
    }
    bool bfs(int s, int t) {
        fill(lvl.begin(), lvl.end(), -1); lvl[s] = 0;
        queue<int> q; q.push(s);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int id : g[u]) if (es[id].cap > 0 && lvl[es[id].to] < 0) {
                lvl[es[id].to] = lvl[u] + 1; q.push(es[id].to);
            }
        }
        return lvl[t] >= 0;
    }
    long long dfs(int u, int t, long long f) {
        if (u == t) return f;
        for (int& i = it[u]; i < (int)g[u].size(); i++) {
            int id = g[u][i], v = es[id].to;
            if (es[id].cap > 0 && lvl[v] == lvl[u] + 1) {
                long long d = dfs(v, t, min(f, es[id].cap));
                if (d > 0) { es[id].cap -= d; es[id ^ 1].cap += d; return d; }
            }
        }
        return 0;
    }
    long long maxflow(int s, int t) {
        long long flow = 0;
        while (bfs(s, t)) {
            fill(it.begin(), it.end(), 0);
            while (long long f = dfs(s, t, LLONG_MAX)) flow += f;
        }
        return flow;
    }
};`,
  problems: [
    cses(1694, 'Download Speed'), cses(1695, 'Police Chase'), cses(1696, 'School Dance'), cses(1711, 'Distinct Routes')
  ]
});

algo({
  id: 'lca-binary-lifting', cat: 'Trees', title: 'LCA & Binary Lifting', level: 2,
  summary: 'Jump up a tree in powers of two to find ancestors and LCAs.',
  time: 'O(n log n) build, O(log n) query', space: 'O(n log n)',
  body: `
    <p><code>up[k][v]</code> is the <code>2^k</code>-th ancestor of <code>v</code>. To get the <b>k-th ancestor</b>, decompose <code>k</code> in binary and jump. To get the <b>LCA(a, b)</b>: lift the deeper node to the same depth, then lift both together from high bits to low bits while their ancestors differ.</p>
    <h2>Applications</h2>
    <ul>
      <li>Distance in a tree: <code>depth[a] + depth[b] - 2 * depth[lca]</code>.</li>
      <li>Path queries with binary-lifted aggregates (max edge on path, etc.).</li>
      <li>Alternative: Euler tour + sparse table gives O(1) LCA queries.</li>
    </ul>`,
  code: String.raw`const int LOG = 20;
vector<array<int, LOG>> up(n);
vector<int> depth(n, 0);
// BFS/DFS from root fills depth and up[v][0] = parent (root's parent = root)
for (int k = 1; k < LOG; k++)
    for (int v = 0; v < n; v++) up[v][k] = up[up[v][k - 1]][k - 1];

auto kth = [&](int v, int k) {
    for (int b = 0; b < LOG; b++) if (k >> b & 1) v = up[v][b];
    return v;
};
auto lca = [&](int a, int b) {
    if (depth[a] < depth[b]) swap(a, b);
    a = kth(a, depth[a] - depth[b]);
    if (a == b) return a;
    for (int k = LOG - 1; k >= 0; k--)
        if (up[a][k] != up[b][k]) { a = up[a][k]; b = up[b][k]; }
    return up[a][0];
};`,
  problems: [
    cses(1687, 'Company Queries I'), cses(1688, 'Company Queries II'), cses(1135, 'Distance Queries'), cf(519, 'E', 'A and B and Lecture Rooms')
  ]
});

algo({
  id: 'tree-diameter', cat: 'Trees', title: 'Tree Diameter & Rerooting', level: 2,
  summary: 'Longest path in a tree, and answers for every root in O(n).',
  time: 'O(n)', space: 'O(n)',
  body: `
    <p><b>Diameter</b>: BFS from any node to find the farthest node <code>A</code>; BFS from <code>A</code> to find the farthest node <code>B</code>. The distance <code>A&rarr;B</code> is the diameter. Every node's farthest vertex is one of the two diameter endpoints, which solves "max distance from each node" instantly.</p>
    <h2>Rerooting DP</h2>
    <p>When you need an answer for <i>every</i> node as root: compute <code>down[v]</code> (answer within the subtree) in one DFS, then in a second DFS compute <code>up[v]</code> (contribution from outside the subtree) by combining the parent's full answer with its other children. Use prefix/suffix aggregates when "remove one child" isn't invertible.</p>`,
  code: String.raw`auto bfs = [&](int s) {
    vector<int> d(n, -1); queue<int> q; q.push(s); d[s] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : g[u]) if (d[v] < 0) { d[v] = d[u] + 1; q.push(v); }
    }
    return d;
};
auto d0 = bfs(0);
int A = max_element(d0.begin(), d0.end()) - d0.begin();
auto dA = bfs(A);
int B = max_element(dA.begin(), dA.end()) - dA.begin();
auto dB = bfs(B);
int diameter = dA[B];
// farthest distance from v = max(dA[v], dB[v])`,
  problems: [
    cses(1131, 'Tree Diameter'), cses(1132, 'Tree Distances I'), cses(1133, 'Tree Distances II'),
    cf(337, 'D', 'Book of Evil'), cf(14, 'D', 'Two Paths'), cf(219, 'D', 'Choosing Capital for Treeland')
  ]
});

algo({
  id: 'centroid-decomposition', cat: 'Trees', title: 'Centroid Decomposition', level: 3,
  summary: 'Divide and conquer on trees: every path crosses some centroid.',
  time: 'O(n log n)', space: 'O(n)',
  body: `
    <p>A <b>centroid</b> is a node whose removal leaves components of size &le; n/2. Remove it, recurse on each component, and the recursion depth is only <code>O(log n)</code>. Every path in the tree passes through exactly one "top" centroid, the first one removed on that path.</p>
    <h2>Recipe for path-counting problems</h2>
    <ol>
      <li>Find the centroid <code>c</code> of the current component.</li>
      <li>Collect (depth, info) of all nodes in the component relative to <code>c</code>, merging child by child so paths inside one child's subtree aren't counted.</li>
      <li>Count/aggregate pairs across different children, then mark <code>c</code> removed and recurse.</li>
    </ol>
    <p>It also gives a "centroid tree" of depth log n, where each node stores distances to its O(log n) ancestors. This answers nearest-marked-node queries.</p>`,
  code: String.raw`vector<vector<int>> g(n); vector<bool> removed(n, false); vector<int> sz(n);

int calc_size(int u, int p) {
    sz[u] = 1;
    for (int v : g[u]) if (v != p && !removed[v]) sz[u] += calc_size(v, u);
    return sz[u];
}
int find_centroid(int u, int p, int total) {
    for (int v : g[u]) if (v != p && !removed[v] && sz[v] * 2 > total) return find_centroid(v, u, total);
    return u;
}
void decompose(int entry) {
    int total = calc_size(entry, -1);
    int c = find_centroid(entry, -1, total);
    // --- process all paths through c here ---
    removed[c] = true;
    for (int v : g[c]) if (!removed[v]) decompose(v);
}`,
  problems: [
    cses(2079, 'Finding a Centroid'), cf(161, 'D', 'Distance in Tree'), cf(321, 'C', 'Ciel the Commander'), cf(342, 'E', 'Xenia and Tree')
  ]
});
