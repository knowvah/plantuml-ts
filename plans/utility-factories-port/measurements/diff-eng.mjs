// ufp close step 5: per-engine verdict + dotEqual movers between two survey dirs.
// Usage: node diff-eng.mjs <prevDir> <nextDir>   (dirs hold parity-<engine>.json)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const [prev, next] = process.argv.slice(2);
const RANK = { conformant: 3, 'structural-match': 2, diverged: 1, errored: 0, timeout: 0, 'oracle-error': -1 };
let movers = 0;
for (const f of readdirSync(next).filter((n) => /^parity-.*\.json$/.test(n)).sort()) {
  if (!existsSync(`${prev}/${f}`)) { console.log(`NEW ${f}`); continue; }
  const a = new Map(JSON.parse(readFileSync(`${prev}/${f}`, 'utf8')).fixtures.map((r) => [r.slug, r]));
  const b = JSON.parse(readFileSync(`${next}/${f}`, 'utf8')).fixtures;
  for (const r of b) {
    const o = a.get(r.slug);
    if (!o) { console.log(`${f} ${r.slug} ADDED ${r.verdict}`); movers++; continue; }
    const vd = o.verdict !== r.verdict, dq = o.dotEqual !== r.dotEqual;
    const md = !vd && r.verdict !== 'conformant' && o.maxDelta !== r.maxDelta;
    if (vd || dq) {
      movers++;
      const dir = RANK[r.verdict] > RANK[o.verdict] ? 'UP' : RANK[r.verdict] < RANK[o.verdict] ? 'DOWN' : 'SAME';
      console.log(`${f.slice(7, -5)} ${r.slug} ${o.verdict}->${r.verdict} ${dir} dotEqual ${o.dotEqual}->${r.dotEqual}`);
    } else if (md && process.env.DELTAS) console.log(`${f.slice(7, -5)} ${r.slug} maxDelta ${o.maxDelta}->${r.maxDelta}`);
  }
}
console.log(`movers ${movers}`);
