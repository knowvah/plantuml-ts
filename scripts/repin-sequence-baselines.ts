/** Batch re-pin for the `sequence-command-coverage` mission.
 *
 *  ORCHESTRATOR-ONLY. Task agents never write a baseline JSON: five parallel
 *  agents would collide on one file, and re-pinning before adjudicating would
 *  bake regressions into the baseline -- the exact failure D5 exists to
 *  prevent. Run this only AFTER
 *  `scripts/sequence-ratchet-adjudicate.ts` reports zero `regression` and zero
 *  unadjudicated rise.
 *
 *  Measures every sequence fixture through the SAME seams the gates use --
 *  `fixtureIncludeStore()` and `DeterministicMeasurer`, both mandatory: without
 *  the store `renderSync` refuses `!include` and returns an `errorSvg` with no
 *  `data-diagram-type`, recording a RESOLUTION failure as a routing answer of
 *  `NONE` (`src/index.ts:213`).
 *
 *  Writes only fixtures whose measured state actually changed, so the diff
 *  shows the mission's effect and nothing else.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { renderSync } from '../src/index.js';
import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';

const DIR = 'test-results/dot-cache/sequence';
const TYPE_RE = /data-diagram-type="([A-Z]+)"/;
const today = execFileSync('date', ['+%Y-%m-%d']).toString().trim();
const commit = execFileSync('git', ['rev-parse', '--short=8', 'HEAD']).toString().trim();

const snapshotPath = process.argv[2];
if (snapshotPath === undefined) {
  throw new Error(
    'usage: repin-sequence-baselines.ts <snapshot.json>\n' +
      'Produce the snapshot with:\n' +
      '  npx jiti scripts/sequence-ratchet-adjudicate.ts --snapshot <path>',
  );
}
const snap = JSON.parse(readFileSync(snapshotPath, 'utf8')) as {
  slug: string;
  score: number | null;
  diffCount?: number | null;
}[];
const measured = new Map(snap.map((r) => [r.slug, r]));

const store = fixtureIncludeStore();
const routed = new Map<string, string>();
for (const slug of readdirSync(DIR)) {
  const p = join(DIR, slug, 'in.puml');
  if (!existsSync(p)) continue;
  let svg: string;
  try {
    svg = renderSync(readFileSync(p, 'utf8'), {
      measurer: new DeterministicMeasurer(),
      includeStore: store,
    });
  } catch {
    routed.set(slug, 'NONE');
    continue;
  }
  routed.set(slug, TYPE_RE.exec(svg)?.[1] ?? 'NONE');
}

let n = 0;

// --- diff-baseline: status "error" -> "baseline" once a fixture renders -----
const dbPath = 'oracle/goldens/svg-sequence/diff-baseline.json';
const db = JSON.parse(readFileSync(dbPath, 'utf8'));
for (const f of db.fixtures) {
  const m = measured.get(f.slug);
  if (m === undefined) continue;
  if (f.status === 'error' && m.score !== null) {
    delete f.reason;
    f.status = 'baseline';
    f.weightedScore = m.score;
    f.diffCount = m.diffCount ?? null;
    f.measuredAt = today;
    f.measuredAgainstCommit = commit;
    n++;
  } else if (f.status === 'baseline' && m.score !== null && m.score !== f.weightedScore) {
    f.weightedScore = m.score;
    f.diffCount = m.diffCount ?? f.diffCount;
    f.measuredAt = today;
    f.measuredAgainstCommit = commit;
    n++;
  }
}
writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n');

// --- routing-baseline: a misroute that now agrees with the jar --------------
const rtPath = 'oracle/goldens/svg-conformance/routing-baseline.json';
const rt = JSON.parse(readFileSync(rtPath, 'utf8'));
for (const f of rt.fixtures) {
  const live = routed.get(f.slug);
  if (live === undefined || f.type !== 'sequence') continue;
  if (f.ourType !== live) {
    f.ourType = live;
    f.status = live === f.jarType ? 'agree' : f.status;
    f.measuredAt = today;
    f.measuredAgainstCommit = commit;
    n++;
  }
}
writeFileSync(rtPath, JSON.stringify(rt, null, 2) + '\n');

// --- refusal-baseline: a known-gap that no longer errors --------------------
const rfPath = 'oracle/goldens/svg-conformance/refusal-baseline.json';
const rf = JSON.parse(readFileSync(rfPath, 'utf8'));
for (const f of rf.fixtures) {
  const m = measured.get(f.slug);
  if (m === undefined || f.type !== 'sequence') continue;
  const errors = m.score === null;
  if (f.weErrored !== errors) {
    delete f.reason;
    f.weErrored = errors;
    f.status = errors ? f.status : 'ok';
    f.measuredAt = today;
    f.measuredAgainstCommit = commit;
    n++;
  }
}
writeFileSync(rfPath, JSON.stringify(rf, null, 2) + '\n');

console.log(`REPINNED ${n} entries at ${commit}`);
