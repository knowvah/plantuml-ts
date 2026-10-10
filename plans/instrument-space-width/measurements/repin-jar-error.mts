// isw (journal row 29): re-pin routing/refusal rows whose golden STOPPED being
// a jar error page after seam #4 (the zero-width lone space crashed SlotFinder).
// Mirrors routing-conformance.test.ts#measure and refusal-coverage.test.ts's
// live measurement exactly (same regexes, same renderSync options); the test
// files cannot be imported (a top-level describe throws outside vitest).
// Touches ONLY rows pinned jar-error / jarRendered:false whose golden now
// renders. Usage (repo root): npx jiti <this> [--write]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd();
const { renderSync } = await import(`${root}/src/index.ts`);
const { DeterministicMeasurer } = await import(`${root}/src/core/measurer-deterministic.ts`);
const { fixtureIncludeStore } = await import(`${root}/tests/helpers/fixture-include-store.ts`);
const { fullDescription } = await import(`${root}/src/core/version.ts`);

const JAR_ERROR_PAGE_RE = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;
const TYPE_RE = /data-diagram-type="([A-Z]+)"/;
const ASSUMED_TYPE_RE = /\(Assumed diagram type: ([^)<]+)\)/;
const HEAD = 4096;
const BANNER = `>${fullDescription()}</text>`;
const ROUTING = 'oracle/goldens/svg-conformance/routing-baseline.json';
const REFUSAL = 'oracle/goldens/svg-conformance/refusal-baseline.json';
const commit = process.env.ISW_COMMIT ?? 'isw';
const today = '2026-10-09';

type Row = Record<string, unknown> & { tree: string; type: string; slug: string };
const dir = (f: Row) =>
  f.tree === 'dot-cache' ? join(root, 'test-results/dot-cache', f.type, f.slug) : join(root, 'oracle/goldens', f.type, f.slug);
const golden = (f: Row) => readFileSync(join(dir(f), f.tree === 'dot-cache' ? 'in.svg' : 'golden.svg'), 'utf8');
const store = fixtureIncludeStore();
const ours = (f: Row) =>
  renderSync(readFileSync(join(dir(f), 'in.puml'), 'utf8'), { includeStore: store, measurer: new DeterministicMeasurer() });

const routing = JSON.parse(readFileSync(ROUTING, 'utf8'));
const refusal = JSON.parse(readFileSync(REFUSAL, 'utf8'));
let nR = 0;
let nF = 0;
for (const f of routing.fixtures as Row[]) {
  if (f.status !== 'jar-error' || JAR_ERROR_PAGE_RE.test(golden(f).slice(0, HEAD))) continue;
  const jarType = TYPE_RE.exec(golden(f).slice(0, HEAD))?.[1] ?? 'NONE';
  const ourType = TYPE_RE.exec(ours(f).slice(0, HEAD))?.[1] ?? 'NONE';
  console.log(`routing ${f.type}/${f.slug}: jar-error -> ${jarType}/${ourType}`);
  delete f.jarErrored;
  Object.assign(f, { jarType, ourType, status: jarType === ourType ? 'agree' : 'known-misroute' });
  if (jarType !== ourType) f.reason = 'isw: golden no longer a jar error page (seam #4); routing differs';
  Object.assign(f, { measuredAt: today, measuredAgainstCommit: commit });
  nR++;
}
for (const f of refusal.fixtures as Row[]) {
  if (f.jarRendered !== false || JAR_ERROR_PAGE_RE.test(golden(f).slice(0, HEAD))) continue;
  const o = ours(f);
  const weErrored = o.includes(BANNER);
  const engine = weErrored
    ? (ASSUMED_TYPE_RE.exec(o)?.[1] ?? 'unknown')
    : (TYPE_RE.exec(o.slice(0, HEAD))?.[1]?.toLowerCase() ?? 'none');
  console.log(`refusal ${f.type}/${f.slug}: jarRendered true, weErrored ${weErrored}, engine ${engine}`);
  Object.assign(f, { jarRendered: true, weErrored, engine, measuredAt: today, measuredAgainstCommit: commit });
  nF++;
}
const note = ` isw (${today}, ${commit}): ${nR} jar-error rows re-pinned from a fresh measurement — seam #4 gives U+0020 width, so their goldens are no longer SlotFinder crash pages.`;
routing.$comment += note;
refusal.$comment = String(refusal.$comment ?? '') + note;
console.log(`routing ${nR}, refusal ${nF}`);
if (process.argv.includes('--write')) {
  writeFileSync(ROUTING, `${JSON.stringify(routing, null, 2)}\n`);
  writeFileSync(REFUSAL, `${JSON.stringify(refusal, null, 2)}\n`);
}
