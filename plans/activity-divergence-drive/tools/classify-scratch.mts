import { readFileSync, writeFileSync } from 'node:fs';
const R = '/Users/scottseely/git/knowvah/plantuml-ts';
import { DeterministicMeasurer } from '/Users/scottseely/git/knowvah/plantuml-ts/src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/oracle/svg-conformance/compare.js';
import { renderFixtureActivity } from '/Users/scottseely/git/knowvah/plantuml-ts/tests/oracle/svg-conformance/render-fixture-activity.js';
const manifest = JSON.parse(readFileSync(`${R}/oracle/goldens/svg-activity/diff-baseline.json`, 'utf8'));
const slugs = manifest.fixtures.filter((f: any) => f.status === 'baseline').map((f: any) => f.slug);
const POS = /@(x|y|cx|cy|x1|x2|y1|y2)$/;
const out: any[] = [];
for (const slug of slugs) {
  const puml = readFileSync(`${R}/test-results/dot-cache/activity/${slug}/in.puml`, 'utf8');
  const golden = readFileSync(`${R}/test-results/dot-cache/activity/${slug}/in.svg`, 'utf8');
  let ours: string;
  try { ours = renderFixtureActivity(puml, new DeterministicMeasurer(), fixtureIncludeStore()); } catch (e) { out.push({ slug, error: String(e).slice(0,80) }); continue; }
  const r = compareSvg(ours, golden, 'deterministic');
  const fams = new Map<string, number>();
  const shifts = { x: new Set<number>(), y: new Set<number>() };
  let nonPos = 0;
  for (const d of r.diffs) {
    const p = d.path.replace(/\[\d+\]/g, '[]');
    fams.set(p, (fams.get(p) ?? 0) + 1);
    if (/^svg\/@(width|height|viewBox)/.test(d.path)) continue;
    const m = POS.exec(d.path);
    if (m && d.delta !== undefined) {
      const axis = /^(x|cx|x1|x2)$/.test(m[1]) ? 'x' : 'y';
      const sign = Number(d.expected) - Number(d.actual);
      shifts[axis].add(Math.round(sign * 1000) / 1000);
    } else if (/@textLength$/.test(d.path) && d.actual === '') {
      // textLength missing: systemic
    } else if (/@points$/.test(d.path)) {
      // polygon: treat as positional (unknown)
      fams.set('POLY', (fams.get('POLY') ?? 0) + 1);
    } else nonPos++;
  }
  const uniformX = shifts.x.size <= 1, uniformY = shifts.y.size <= 1;
  out.push({ slug, ws: weightedScore(r.diffs), n: r.diffs.length, nonPos, uniformX, uniformY, sx: [...shifts.x], sy: [...shifts.y], fams: Object.fromEntries(fams) });
}
writeFileSync(`${process.argv[2]}`, JSON.stringify(out, null, 1));
console.log('done', out.length);
