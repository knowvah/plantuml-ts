// sdd1 close step 5: diff every engine's survey verdicts between two
// checkpoints. Usage: node verdict-diff.mjs <prev-eng-dir> <next-eng-dir>
// Prints per-engine counts and every slug whose verdict changed; exits 1 on
// any conformant loss (stop 4) or more than 30 non-sequence movers (stop 14).
import { readdirSync, readFileSync } from 'node:fs';

const [prevDir, nextDir] = process.argv.slice(2);
const load = (dir, f) => {
  try {
    return new Map(JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')).fixtures.map((r) => [r.slug, r.verdict]));
  } catch {
    return undefined;
  }
};
let losses = 0;
let nonSequenceMovers = 0;
for (const f of readdirSync(nextDir).filter((n) => n.startsWith('parity-')).sort()) {
  const engine = f.slice('parity-'.length, -'.json'.length);
  const a = load(prevDir, f);
  const b = load(nextDir, f);
  if (b === undefined) continue;
  const count = (m) => [...m.values()].filter((v) => v === 'conformant').length;
  const moved = [];
  for (const slug of new Set([...(a?.keys() ?? []), ...b.keys()])) {
    const va = a?.get(slug);
    const vb = b.get(slug);
    if (va === vb) continue;
    moved.push(`${slug} ${va} -> ${vb}`);
    if (va === 'conformant') losses++;
    if (engine !== 'sequence') nonSequenceMovers++;
  }
  console.log(`${engine}: conformant ${a ? count(a) : '?'} -> ${count(b)}, movers ${moved.length}`);
  for (const m of moved) console.log(`  ${m}`);
}
console.log(`losses ${losses}, non-sequence movers ${nonSequenceMovers}`);
if (losses > 0 || nonSequenceMovers > 30) process.exitCode = 1;
