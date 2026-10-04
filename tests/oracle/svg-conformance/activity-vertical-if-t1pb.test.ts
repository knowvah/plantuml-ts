/**
 * T1p-b: `FtileIfLongVertical` (`!pragma useVerticalIf true`) -- authored
 * fixtures.
 *
 * No corpus fixture exercises `useVerticalIf` (connection-census.md §0:
 * the one corpus candidate found, `dulate-94-bupu593`, has its pragma
 * line commented out -- a parser row, not this task's). Authored here
 * (CLAUDE.md: the corpus is not a ceiling) and NOT added to the gated
 * corpus (memory: new-corpus-tree-trips-two-gates). All five exercise the
 * SAME requested shapes: 2-way (if + 1 elseif + else), 3-way (if + 2
 * elseif + else), elseif branches carrying explicit positive labels,
 * nesting (an ordinary if/else inside one branch), and a single swimlane.
 *
 * RESIDUAL, diagnosed (not fixed here -- see this file's own doc below
 * and `.agent-notes/T1p-b-vertical-if.md`): all five fixtures diverge from
 * the jar by EXACTLY `childCount +2` / `height +20`, independent of
 * branch count, nesting, or swimlanes -- a single, uniform mechanism, not
 * five independent defects. `connectionIn` (`walk-if-long-vertical.ts`)
 * and the generic `GtileTopDown` sibling edge
 * (`tile-coordinates.ts#pushTopDownSiblingEdge`) are two separate Snakes
 * whose shared endpoint (the if-tile's own `NORTH_HOOK`) is EXACTLY equal
 * (`same()` within 0.001): upstream's `PendingSnake.merge`/`Snake.merge`
 * (`svek/UGraphicForSnake.java:111-122`, `Snake.java:303-327`, decisions.md
 * D1) fuses any two Snakes meeting that condition into ONE, dropping the
 * earlier Snake's own end decoration -- producing one arrowhead/line run
 * and one combined (collapsible) point list where this port, having no
 * `layout/snake-merge.ts` anywhere (grepped: zero hits, repo-wide), draws
 * two. The extra arrowhead decoration/line segment is the `childCount +2`;
 * the extra UN-merged ink-free Y-band (the generic sibling gap AND
 * `FtileIfLongVertical`'s own `marginy1=30` entry gap each independently
 * compress, where the jar's single merged Snake produces one combined
 * band) is the exact, constant `height +20` -- `activity-layout-
 * constants.ts#SEQUENTIAL_ASSEMBLY_GAP`'s own doc comment names the
 * "35 -> 20" compression rule this double-counts. D1's snake-merge module
 * is an explicit, separate, cross-cutting mission task (not in T1p-b's
 * write-set, and would affect every if/while/fork builder's own entry
 * connector identically, not just this one) -- ruled out as this task's
 * own fix per CLAUDE.md ("re-mirror rather than patch with special
 * cases": a local, builder-specific merge would be exactly that patch).
 *
 * `GtileIfLongVertical`'s own geometry (width/height/branch placement) and
 * `walkIfLongVertical`'s own connector point math are INDEPENDENTLY
 * verified correct against the Java source (`gtile-if-long-vertical.test.ts`,
 * `walk-if-long-vertical.test.ts`) and are NOT implicated: the residual
 * lives entirely in the shared snake-merge/compression interaction, not in
 * this task's own connector formulas.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from './render-fixture-activity.js';
import { compareSvg } from './compare.js';

const FIXTURE_DIR = 'tests/fixtures/activity/T1p-b';

interface Measured {
  readonly diffCount: number;
  readonly weightedScore: number;
}

function renderAndMeasure(slug: string): Measured {
  const markup = readFileSync(`${FIXTURE_DIR}/${slug}.puml`, 'utf8');
  const golden = readFileSync(`${FIXTURE_DIR}/${slug}.svg`, 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer());
  const { diffs } = compareSvg(ours, golden, 'deterministic');
  const weightedScore = diffs.reduce((sum, d) => sum + (d.weight ?? 1), 0);
  return { diffCount: diffs.length, weightedScore };
}

/** Every fixture's own `childCount`/`viewBox` height delta, isolated from
 *  {@link renderAndMeasure}'s own full diff list purely so the ONE
 *  mechanism this file's doc names can be asserted directly, not just
 *  implied by a pinned total. */
function entryMergeDeltas(slug: string): { childCountDelta: number; heightDelta: number } {
  const markup = readFileSync(`${FIXTURE_DIR}/${slug}.puml`, 'utf8');
  const golden = readFileSync(`${FIXTURE_DIR}/${slug}.svg`, 'utf8');
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer());
  const { diffs } = compareSvg(ours, golden, 'deterministic');
  const cc = diffs.find((d) => d.path.includes('childCount'));
  const height = diffs.find((d) => d.path === 'svg/@viewBox[3]');
  return {
    childCountDelta: cc === undefined ? 0 : Number(cc.actual) - Number(cc.expected),
    heightDelta: height === undefined ? 0 : Number(height.actual) - Number(height.expected),
  };
}

/**
 * T1b (D1) closed the residual this file's own doc comment above
 * diagnosed: `layout/snake-merge.ts` now fuses `connectionIn` with the
 * generic `GtileTopDown` sibling edge at their shared `NORTH_HOOK`
 * (`Snake#merge`, `Snake.java:303-327`) -- every `childCountDelta`/
 * `heightDelta` below is `0`. `diffCount` FELL on every fixture (the
 * fused run's own corner-collapse now matches the jar's), but
 * `weightedScore` ROSE: with `childCount` now EQUAL, `compareSvg`
 * switches from LCS-style alignment to positional pairing (decisions.md
 * D7's own reveal class) and exposes a SEPARATE, pre-existing draw-order
 * divergence (our `if-split`'s own polygon/label pair sits at a
 * different index than the jar's `rect`/`text` chrome pair) that the
 * count mismatch previously hid. Confirmed by reading the raw diff list:
 * every entry pairs an `actual` tag against an `expected` tag of a
 * DIFFERENT kind (`polygon` vs `rect`, `text` vs `polygon`) at the same
 * index -- an index-shift artifact, not a coordinate error in the merge
 * itself. Out of scope here (a `GtileIfLongVertical`/node-order concern,
 * not `snake-merge.ts`'s); re-pinned, not chased.
 */
describe('activity T1p-b fixtures — FtileIfLongVertical (!pragma useVerticalIf true)', () => {
  it('vertical-if-2way: snake-merge closes the residual (childCount/height now exact)', () => {
    expect(entryMergeDeltas('vertical-if-2way')).toEqual({ childCountDelta: 0, heightDelta: 0 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-2way');
    expect(diffCount).toBe(108);
    expect(weightedScore).toBe(354);
  });

  it('vertical-if-3way: SAME closed residual, unaffected by the extra elseif branch', () => {
    expect(entryMergeDeltas('vertical-if-3way')).toEqual({ childCountDelta: 0, heightDelta: 0 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-3way');
    expect(diffCount).toBe(132);
    expect(weightedScore).toBe(514);
  });

  it('vertical-if-elseif-labels: SAME closed residual, unaffected by longer branch labels', () => {
    expect(entryMergeDeltas('vertical-if-elseif-labels')).toEqual({ childCountDelta: 0, heightDelta: 0 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-elseif-labels');
    expect(diffCount).toBe(108);
    expect(weightedScore).toBe(354);
  });

  it('vertical-if-nested: SAME closed residual, unaffected by the nested ordinary if/else', () => {
    expect(entryMergeDeltas('vertical-if-nested')).toEqual({ childCountDelta: 0, heightDelta: 0 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-nested');
    expect(diffCount).toBe(137);
    expect(weightedScore).toBe(396);
  });

  it('vertical-if-swimlanes: SAME closed residual, unaffected by the single swimlane', () => {
    expect(entryMergeDeltas('vertical-if-swimlanes')).toEqual({ childCountDelta: 0, heightDelta: 0 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-swimlanes');
    expect(diffCount).toBe(108);
    expect(weightedScore).toBe(354);
  });
});
