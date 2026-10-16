// dur: rows whose census diffCount ROSE prev -> cur. Usage: node census-risers.mjs <prev.json> <cur.json>
import { readFileSync } from 'node:fs';
const ld = (p) => new Map(JSON.parse(readFileSync(p, 'utf-8')).fixtures.map((r) => [r.slug, r]));
const a = ld(process.argv[2]), b = ld(process.argv[3]);
let up = 0, down = 0;
for (const [s, r] of b) { const o = a.get(s); if (!o) { console.log(`new ${s} ${r.diffCount}`); continue; }
  if (r.diffCount > o.diffCount) { up++; console.log(`RISE ${s} ${o.diffCount} -> ${r.diffCount}`); }
  else if (r.diffCount < o.diffCount) { down++; console.log(`fall ${s} ${o.diffCount} -> ${r.diffCount}`); } }
console.log(`rises=${up} falls=${down}`);
