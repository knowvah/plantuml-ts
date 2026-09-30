/**
 * mmp b6 close (D7): re-pin the mindmap rows of the routing and refusal
 * baselines from a fresh measurement through the gates' own seam
 * (`scripts/pin-corpus-tree-measure.ts`), IN PLACE (the rows exist since
 * 2026-09-20). Also flips the two c4 `[FIXED]` rows the gate reports
 * (favasu-27-fesa452, xizifu-87-siti076) -- verified to route DESCRIPTION
 * on the pre-T5a branch too, i.e. a pre-existing stale pin.
 *
 *   npx jiti plans/mindmap-engine-port/measurements/b5/repin-routing-refusal.mts <sha>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fixtureIncludeStore } from '../../../../tests/helpers/fixture-include-store.js';
import { listFixtureSlugs, measureFixture } from '../../../../scripts/pin-corpus-tree-measure.js';

const sha = process.argv[2];
if (!sha) throw new Error('usage: repin-routing-refusal.mts <sha>');
const today = new Date().toISOString().slice(0, 10);
const tree = 'test-results/dot-cache/mindmap';
const store = fixtureIncludeStore();
const measured = new Map(listFixtureSlugs(tree).map((s) => [s, measureFixture(tree, s, store)]));

const GRADIENT_REASON =
  'the MINDMAP engine errors on this source: a gradient colour (`#a-#b`) reaches ' +
  'HColorSet.ts#parseColor, which throws `unported: HColorGradient` -- the T2a colour port ' +
  'left HColorGradient/HColorScheme/HColorAutomagic unported (HColorSet.java:81-104). ' +
  'Upstream renders it (HColorGradient.java). Owner: mindmap-engine-port batch 6.';

type Row = Record<string, unknown> & { type: string; slug: string; status: string };
const routingPath = 'oracle/goldens/svg-conformance/routing-baseline.json';
const refusalPath = 'oracle/goldens/svg-conformance/refusal-baseline.json';
const routing = JSON.parse(readFileSync(routingPath, 'utf8')) as { $comment: string; fixtures: Row[] };
const refusal = JSON.parse(readFileSync(refusalPath, 'utf8')) as { $comment: string; fixtures: Row[] };

let rFixed = 0, rKept = 0, fFixed = 0, fGap = 0;
for (const row of routing.fixtures) {
  if (row.type !== 'mindmap') continue;
  const m = measured.get(row.slug);
  if (!m) throw new Error(`unmeasured ${row.slug}`);
  if (row.status === 'jar-error') { if (!m.jarErrored) throw new Error(`${row.slug} no longer jar-error`); continue; }
  if (m.ourType === m.jarType) {
    Object.assign(row, { ourType: m.ourType, status: 'agree', measuredAt: today, measuredAgainstCommit: sha });
    delete row.reason; rFixed++;
  } else {
    Object.assign(row, { ourType: m.ourType, status: 'known-misroute', measuredAt: today, measuredAgainstCommit: sha,
      reason: 'routes NONE because the render is a crash page carrying no data-diagram-type: ' + GRADIENT_REASON });
    rKept++;
  }
}
for (const row of refusal.fixtures) {
  if (row.type !== 'mindmap') continue;
  const m = measured.get(row.slug);
  if (!m) throw new Error(`unmeasured ${row.slug}`);
  if (row.status === 'jar-error') continue;
  if (m.weErrored) {
    Object.assign(row, { weErrored: true, engine: m.engine, status: 'known-gap', measuredAt: today, measuredAgainstCommit: sha, reason: GRADIENT_REASON });
    fGap++;
  } else {
    Object.assign(row, { weErrored: false, engine: m.engine, status: 'ok', measuredAt: today, measuredAgainstCommit: sha });
    delete row.reason; fFixed++;
  }
}
const note = (what: string) => ` Re-pinned ${today} at ${sha} by mindmap-engine-port / close-b6 (D7), IN PLACE: ${what}`;
routing.$comment += note(`${rFixed} mindmap rows agree (nukose-24-funi267 and vacofo-66-puno159 known-misroute -> agree: HColorGradient ported in T6a); ${rKept} known-misroute remain.`);
refusal.$comment += note(`${fFixed} mindmap rows ok (nukose-24-funi267 and vacofo-66-puno159 known-gap -> ok: HColorGradient ported in T6a); ${fGap} known-gap remain.`);
writeFileSync(routingPath, JSON.stringify(routing, null, 2) + '\n');
writeFileSync(refusalPath, JSON.stringify(refusal, null, 2) + '\n');
console.log({ rFixed, rKept, fFixed, fGap });
