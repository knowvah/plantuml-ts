/** ADDITIVE pin of the activity cache tree into the two corpus-completeness
 *  baselines (`activity-oracle-harness` / T0b, D11).
 *
 *  ORCHESTRATOR-ONLY, for the reason `scripts/repin-sequence-baselines.ts:3-8`
 *  gives: a task agent never writes a baseline JSON. Unlike that script this
 *  one only ADDS -- it asserts every pre-existing entry is byte-identical
 *  afterwards, because the risk D11 guards is adopting a regression by
 *  moving a pin, and a tree that has no pins cannot have one moved.
 *
 *  Measures through the SAME seams both gates use -- `fixtureIncludeStore()`
 *  and `DeterministicMeasurer` -- because without the store `renderSync`
 *  throws on any `!include` (`src/index.ts:213`) and the resulting error page
 *  carries no `data-diagram-type`, recording a RESOLUTION failure as a
 *  routing answer of `NONE`.
 *
 *  Run: npx jiti plans/activity-oracle-harness/scripts/pin-activity-baselines.ts
 */
import { readdirSync, readFileSync, writeFileSync, openSync, readSync, closeSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { fullDescription } from '../../../src/core/version.js';

const DIR = 'test-results/dot-cache/activity';
const ROUTING = 'oracle/goldens/svg-conformance/routing-baseline.json';
const REFUSAL = 'oracle/goldens/svg-conformance/refusal-baseline.json';
/** `TextBlockExporter.java:293`'s root attribute. */
const TYPE_RE = /data-diagram-type="([A-Z]+)"/;
/** `PSystemError.java:148-155` / `ReportLog.java:103-108`. */
const JAR_ERROR_PAGE_RE = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;
const HEAD_BYTES = 4096;

/** The single mechanism behind all 350 ACTIVITY->NONE misroutes (D11). T5
 *  removes it, at which point every one of these flips to `agree`. */
const ACTIVITY_MISROUTE_REASON =
  'the ACTIVITY engine DID draw this source, but stamps no root diagram type: ' +
  'renderActivity returns a RenderFragment with no `diagramType` field ' +
  '(src/diagrams/activity/renderer.ts:221-226), so renderSync emits no ' +
  '`data-diagram-type` root attribute and the gate reads our answer as NONE. ' +
  'Upstream stamps it on every document it exports -- ' +
  'TextBlockExporter.java:293 `option.withRootAttribute("data-diagram-type", ' +
  'diagramType.name())`. Activity is the last engine still emitting a bare ' +
  'root via the generic svgRoot instead of the klimt document shell ' +
  '(src/core/klimt/document-shell.ts); class, state, description, json and ' +
  'sequence are all on it. Fixed by activity-oracle-harness / T5, after which ' +
  'this entry re-pins to `agree`.';

const today = execFileSync('date', ['+%Y-%m-%d']).toString().trim();
const commit = execFileSync('git', ['rev-parse', '--short=8', 'HEAD']).toString().trim();
const banner = fullDescription();

function head(path: string): string {
  const fd = openSync(path, 'r');
  try {
    const b = Buffer.alloc(HEAD_BYTES);
    return b.subarray(0, readSync(fd, b, 0, HEAD_BYTES, 0)).toString('utf8');
  } finally {
    closeSync(fd);
  }
}

const slugs = readdirSync(DIR)
  .filter((s) => existsSync(join(DIR, s, 'in.svg')) && existsSync(join(DIR, s, 'in.puml')))
  .sort();

const routingAdds: Record<string, unknown>[] = [];
const refusalAdds: Record<string, unknown>[] = [];

for (const slug of slugs) {
  const h = head(join(DIR, slug, 'in.svg'));
  const jarType = TYPE_RE.exec(h)?.[1] ?? 'NONE';
  const jarErrored = JAR_ERROR_PAGE_RE.test(h);
  const src = readFileSync(join(DIR, slug, 'in.puml'), 'utf8');
  const ourSvg = renderSync(src, {
    measurer: new DeterministicMeasurer(),
    includeStore: fixtureIncludeStore(),
  });
  const ourType = TYPE_RE.exec(ourSvg.slice(0, HEAD_BYTES))?.[1] ?? 'NONE';
  const weErrored = ourSvg.includes(`>${banner}</text>`);
  const base = { tree: 'dot-cache', type: 'activity', slug };

  routingAdds.push(
    jarErrored
      ? { ...base, jarType, jarErrored: true, ourType, status: 'jar-error', measuredAt: today, measuredAgainstCommit: commit }
      : jarType === ourType
        ? { ...base, jarType, ourType, status: 'agree', measuredAt: today, measuredAgainstCommit: commit }
        : { ...base, jarType, ourType, status: 'known-misroute', measuredAt: today, measuredAgainstCommit: commit, reason: ACTIVITY_MISROUTE_REASON },
  );

  refusalAdds.push({
    ...base,
    jarRendered: !jarErrored,
    weErrored,
    // INFORMATIONAL, per the refusal gate's own field doc: our root
    // data-diagram-type lower-cased, or `none` when the engine stamps none.
    engine: weErrored ? 'activity' : ourType.toLowerCase(),
    status: 'ok',
    measuredAt: today,
    measuredAgainstCommit: commit,
  });
}

function addOnly(path: string, adds: Record<string, unknown>[]): void {
  const doc = JSON.parse(readFileSync(path, 'utf8')) as { $comment: string; fixtures: Record<string, unknown>[] };
  const before = JSON.stringify(doc.fixtures);
  const keys = new Set(doc.fixtures.map((f) => `${String(f.tree)}:${String(f.type)}/${String(f.slug)}`));
  const fresh = adds.filter((a) => !keys.has(`${String(a.tree)}:${String(a.type)}/${String(a.slug)}`));
  doc.fixtures = [...doc.fixtures, ...fresh];
  // The guard D11 turns on: every pre-existing entry must survive byte-identical.
  if (JSON.stringify(doc.fixtures.slice(0, JSON.parse(before).length)) !== before)
    throw new Error(`${path}: a pre-existing entry changed -- this script is additive-only`);
  writeFileSync(path, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`${path}: +${fresh.length} (${JSON.parse(before).length} -> ${doc.fixtures.length})`);
}

addOnly(ROUTING, routingAdds);
addOnly(REFUSAL, refusalAdds);

const tally = (rows: Record<string, unknown>[], k: string): string =>
  JSON.stringify([...rows.reduce((m, r) => m.set(String(r[k]), (m.get(String(r[k])) ?? 0) + 1), new Map<string, number>())]);
console.log('routing status', tally(routingAdds, 'status'));
console.log('refusal weErrored', tally(refusalAdds, 'weErrored'));
console.log('refusal defect-contributors (weErrored && jarRendered)',
  refusalAdds.filter((r) => r.weErrored === true && r.jarRendered === true).length);
