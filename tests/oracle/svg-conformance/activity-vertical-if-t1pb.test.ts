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
    childCountDelta: Number(cc?.actual) - Number(cc?.expected),
    heightDelta: Number(height?.actual) - Number(height?.expected),
  };
}

describe('activity T1p-b fixtures — FtileIfLongVertical (!pragma useVerticalIf true)', () => {
  it('vertical-if-2way: pinned at the current, diagnosed residual (childCount +2, height +20)', () => {
    expect(entryMergeDeltas('vertical-if-2way')).toEqual({ childCountDelta: 2, heightDelta: 20 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-2way');
    expect(diffCount).toBe(164);
    expect(weightedScore).toBe(267);
  });

  it('vertical-if-3way: SAME residual, unaffected by the extra elseif branch (childCount +2, height +20)', () => {
    expect(entryMergeDeltas('vertical-if-3way')).toEqual({ childCountDelta: 2, heightDelta: 20 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-3way');
    expect(diffCount).toBe(210);
    expect(weightedScore).toBe(347);
  });

  it('vertical-if-elseif-labels: SAME residual, unaffected by longer branch labels (childCount +2, height +20)', () => {
    expect(entryMergeDeltas('vertical-if-elseif-labels')).toEqual({ childCountDelta: 2, heightDelta: 20 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-elseif-labels');
    expect(diffCount).toBe(168);
    expect(weightedScore).toBe(271);
  });

  it('vertical-if-nested: SAME residual, unaffected by the nested ordinary if/else (childCount +2, height +20)', () => {
    expect(entryMergeDeltas('vertical-if-nested')).toEqual({ childCountDelta: 2, heightDelta: 20 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-nested');
    expect(diffCount).toBe(222);
    expect(weightedScore).toBe(339);
  });

  it('vertical-if-swimlanes: SAME residual, unaffected by the single swimlane (childCount +2, height +20)', () => {
    expect(entryMergeDeltas('vertical-if-swimlanes')).toEqual({ childCountDelta: 2, heightDelta: 20 });
    const { diffCount, weightedScore } = renderAndMeasure('vertical-if-swimlanes');
    expect(diffCount).toBe(164);
    expect(weightedScore).toBe(267);
  });
});
