import { readFileSync } from 'node:fs';
import { compareSvg, weightedScore } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/oracle/svg-conformance/compare.js';
const S = '/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/8cb1cca7-b7ae-4640-8a2d-0a20b98721d9/scratchpad';
const [slug, a, b] = process.argv.slice(2) as [string, string, string];
const golden = readFileSync(`/Users/scottseely/git/knowvah/plantuml-ts/test-results/dot-cache/activity/${slug}/in.svg`, 'utf8');
function bag(dir: string): Map<string, number> {
  const { diffs } = compareSvg(readFileSync(`${S}/${dir}/${slug}.svg`, 'utf8'), golden, 'deterministic');
  const m = new Map<string, number>();
  for (const d of diffs) { const k = `${d.path} ours=${d.actual} golden=${d.expected}`; m.set(k, (m.get(k) ?? 0) + ((d as any).weight ?? 1)); }
  console.log(dir, 'score', weightedScore(diffs), 'diffs', diffs.length);
  return m;
}
const A = bag(a), B = bag(b);
const pathsA = new Map([...A.keys()].map((k) => [k.split(' ')[0]!, k]));
const pathsB = new Map([...B.keys()].map((k) => [k.split(' ')[0]!, k]));
for (const [pth, k] of pathsA) if (!pathsB.has(pth)) console.log('RESOLVED', k, A.get(k));
for (const [pth, k] of pathsB) if (!pathsA.has(pth)) console.log('NEW     ', k, B.get(k));
