/**
 * codd (copied from dsw T6): re-measure oracle/goldens/svg-description/diff-baseline.json the way
 * description.diff-baseline.ratchet.test.ts#measure does (renderFixture +
 * DeterministicMeasurer vs the dot-cache in.svg). Prints recorded -> now.
 *   npx jiti plans/description-url-wrappers/measurements/measure-diff-baseline.mts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixture } from '../../../tests/oracle/svg-conformance/render-fixture.js';

const REPO = execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim();
const base = JSON.parse(readFileSync(join(REPO, 'oracle/goldens/svg-description/diff-baseline.json'), 'utf8')) as {
  fixtures: { type: string; slug: string; status: string; diffCount: number | null }[];
};
for (const f of base.fixtures) {
  const dir = join(REPO, 'test-results/dot-cache', f.type, f.slug);
  let now: string;
  try {
    const ours = renderFixture(readFileSync(join(dir, 'in.puml'), 'utf8'), new DeterministicMeasurer());
    now = String(compareSvg(ours, readFileSync(join(dir, 'in.svg'), 'utf8'), 'deterministic').diffs.length);
  } catch (err) {
    now = `error: ${err instanceof Error ? err.message.slice(0, 60) : String(err)}`;
  }
  console.log(`${f.type}/${f.slug}\t${f.status}\t${f.diffCount}\t${now}`);
}
