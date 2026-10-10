/**
 * isw-T2b-ca: a bare `<style> activityDiagram { MaximumWidth N }` block is
 * signed `{activityDiagram}` (`style/parser/Context.java:68-100,127-139`)
 * and merged into every activity element's style
 * (`StyleStorage.java:102-116`, `StyleSignatureBasic.java:194-220`), so
 * every `style.wrapWidth()` site wraps (`Style.java:330-333`). Fixtures
 * under `tests/fixtures/isw-T2b-ca/` carry their one-JVM jar render
 * (`scripts/oracle-render.sh`, seam #4) as `<name>.svg`.
 *
 * - `diagram-maximum-width`: action, note, if test and branch label wrap.
 * - `diagram-maximum-width-nested`: the nested `activity { MaximumWidth }`
 *   (declared later, so its counter priority wins, `DarkString.java:50-65`)
 *   beats the bare block for the action; the note keeps the bare width.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2b-ca');

function diffPaths(name: string): string[] {
  const markup = readFileSync(join(FIXTURES, `${name}.puml`), 'utf8');
  const golden = readFileSync(join(FIXTURES, `${name}.svg`), 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer());
  return compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
}

describe('bare activityDiagram { MaximumWidth } (jar oracles)', () => {
  it.each(['diagram-maximum-width', 'diagram-maximum-width-nested'])('%s renders equal to the jar', (name) => {
    expect(diffPaths(name)).toEqual([]);
  });
});
