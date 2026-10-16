// dur (copied from dsw): diff two survey dirs (verdict, dotEqual, layoutEqual) per engine.
// Usage: node diff-eng.mjs <prevDir> <curDir>
// Prints a per-engine tally line and one line per mover; exits 0.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [prev, cur] = process.argv.slice(2);
const load = (d, f) => JSON.parse(readFileSync(join(d, f), 'utf-8')).fixtures;
const tally = (rows) => {
  const t = { conformant: 0, 'structural-match': 0, diverged: 0, other: 0, dotEq: 0, layoutEq: 0 };
  for (const r of rows) {
    if (r.verdict in t) t[r.verdict]++;
    else t.other++;
    if (r.dotEqual === true) t.dotEq++;
    if (r.layoutEqual === true) t.layoutEq++;
  }
  return `${t.conformant}/${t['structural-match']}/${t.diverged}+${t.other} dot=${t.dotEq} layout=${t.layoutEq}`;
};
let losses = 0;
for (const f of readdirSync(cur).filter((n) => n.startsWith('parity-')).sort()) {
  if (!existsSync(join(prev, f))) continue;
  const a = load(prev, f);
  const b = load(cur, f);
  const m = new Map(a.map((r) => [r.slug, r]));
  const movers = [];
  for (const r of b) {
    const o = m.get(r.slug);
    if (o === undefined) {
      movers.push(`  + ${r.slug} new ${r.verdict}`);
      continue;
    }
    const d = [];
    if (o.verdict !== r.verdict) d.push(`verdict ${o.verdict}->${r.verdict}`);
    if (o.dotEqual !== r.dotEqual) d.push(`dotEqual ${o.dotEqual}->${r.dotEqual}`);
    if ('layoutEqual' in o && o.layoutEqual !== r.layoutEqual) d.push(`layoutEqual ${o.layoutEqual}->${r.layoutEqual}`);
    if (o.verdict === 'conformant' && r.verdict !== 'conformant') losses++;
    if (d.length > 0) movers.push(`  ${r.slug}: ${d.join(', ')}`);
  }
  console.log(`${f.slice(7, -5)}: ${tally(a)} -> ${tally(b)} movers=${movers.length}`);
  for (const l of movers) console.log(l);
}
console.log(`CONFORMANT LOSSES: ${losses}`);
