// gtc: per-row census diffCount comparison (D6 "away from the jar" screen).
// Usage: node census-diff.mjs <prev-census.json> <cur-census.json>
// Prints Σ before/after, then one line per row whose diffCount ROSE (away from
// the jar) and the count of rows that fell. Exits 0.
import { readFileSync } from 'node:fs';

const [a, b] = process.argv.slice(2).map((p) => JSON.parse(readFileSync(p, 'utf-8')).fixtures);
const prev = new Map(a.map((r) => [r.slug, r.diffCount ?? 0]));
let sa = 0;
let sb = 0;
let fell = 0;
const rose = [];
for (const v of prev.values()) sa += v;
for (const r of b) {
  const d = r.diffCount ?? 0;
  sb += d;
  const o = prev.get(r.slug);
  if (o === undefined) rose.push(`  + ${r.slug} new ${d}`);
  else if (d > o) rose.push(`  ^ ${r.slug} ${o} -> ${d}`);
  else if (d < o) fell++;
}
console.log(`Σ ${sa} -> ${sb}; fell ${fell}; rose ${rose.length}`);
for (const l of rose) console.log(l);
