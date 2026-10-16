// dur: census Σ / zero-diff / errors for a census JSON. Usage: node census-sum.mjs <json>
import { readFileSync } from 'node:fs';
const fx = JSON.parse(readFileSync(process.argv[2], 'utf-8')).fixtures;
let s = 0, z = 0, e = [];
for (const r of fx) { if (r.status !== 'ok') { e.push(`${r.slug}:${r.status}`); continue; } s += r.diffCount; if (r.diffCount === 0) z++; }
console.log(`n=${fx.length} sum=${s} zero=${z} errors=${e.length} ${e.join(' ')}`);
