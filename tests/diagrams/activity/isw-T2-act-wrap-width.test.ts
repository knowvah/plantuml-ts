/**
 * isw-T2-act F5: `style.wrapWidth()` (`Style.java:330-333`, `skinparam
 * wrapWidth` registered on `SName.element`, `FromSkinparamToStyle.java:250`)
 * reaches exactly the activity text blocks upstream builds with it.
 * Fixtures under `tests/fixtures/isw-T2-act/` carry their one-JVM jar
 * render (`scripts/oracle-render.sh`, seam #4) as `<name>.svg`.
 *
 * - `wrap-if`: `ConditionalBuilder`'s test (`diamondLineBreak`) and
 *   SIMPLE_LINE branch labels (`labelLineBreak`) wrap
 *   (`ConditionalBuilder.java:120-121,244,280-283`).
 * - `wrap-elseif`: the horizontal elseif's tests wrap
 *   (`FtileIfLongHorizontal.java:174-177`); its `create` side labels do not.
 * - `wrap-while`: a while's / repeat's `Display#create` blocks never wrap
 *   (`FtileWhile.java:123-128`, `FtileRepeat.java:127-131`).
 * - `wrap-swimlane`: titles never wrap on `wrapWidth` --
 *   `Swimlanes#getWrap` compares a fresh `new LineBreakStrategy(null)`
 *   (`SkinParam.java:981-984`) to `LineBreakStrategy.NONE` by reference
 *   (`Swimlanes.java:296-301`), so the style fallback is unreachable.
 * - `wrap-switch`: the diamond test and the case labels wrap
 *   (`FtileFactoryDelegatorSwitch.java:110-111,131-134`, `Branch.java:248-258`).
 *   isw-T2b-ca: `getYdelta1a` was never the gap (an instrumented jar
 *   reports the same 22 px label height and SMALL_DIAMOND as ours); the
 *   Y compression boxed a wrapped label by its `\n` lines only, so it
 *   removed the space under the label's second line
 *   (`compress/shapes-of.ts#edgeLabelShape`).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2-act');

function diffPaths(name: string): string[] {
  const markup = readFileSync(join(FIXTURES, `${name}.puml`), 'utf8');
  const golden = readFileSync(join(FIXTURES, `${name}.svg`), 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer());
  return compareSvg(ours, golden, 'deterministic').diffs.map((d) => d.path);
}

describe('activity wrapWidth (jar oracles)', () => {
  it.each(['wrap-if', 'wrap-elseif', 'wrap-while', 'wrap-swimlane', 'wrap-switch'])(
    '%s renders equal to the jar',
    (name) => {
      expect(diffPaths(name)).toEqual([]);
    },
  );
});
