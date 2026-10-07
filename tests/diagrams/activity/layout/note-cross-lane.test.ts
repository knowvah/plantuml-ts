/**
 * add4-T2c (NOTE-SWIMLANE): a note captured in another `|lane|` than the
 * preceding instruction still wraps it (`InstructionList.java:190-195`
 * -> `FtileWithNoteOpale` with `swimlaneNote`). The Opale draws only in
 * `swimlaneNote`'s one-lane pass (`FtileWithNoteOpale.java:217`), but the
 * measurement pass dispatches it to every lane of `getSwimlanes()` =
 * tile lanes + `swimlaneNote` (`:92-99`, `UGraphicInterceptorAllSwimlanes
 * .java:88-101`). Fixture goldens were rendered through
 * `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { ActivityNodeGeo } from '../../../../src/diagrams/activity/activity-geometry.types.js';
import { placeSwimlanes } from '../../../../src/diagrams/activity/layout/swimlane-placement.js';
import { markMeasureSpec, measureSpecOf, specLaneItems } from '../../../../src/diagrams/activity/layout/swimlane-context.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { renderActivityFixture } from '../../../helpers/activity-text-position.js';
import { compareSvg } from '../../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add4-T2c');
const LANES = ['A', 'B'];
const BASE_X = 20;
const ACTION_WIDTH = 40;
const NOTE_X = 80;
const NOTE_WIDTH = 60;

function geo(id: string, kind: string, x: number, width: number, swimlane: string): ActivityNodeGeo {
  return { id, kind, x, y: 0, width, height: 30, swimlane };
}

function laneAWidth(nodes: readonly ActivityNodeGeo[]): number {
  const result = placeSwimlanes({
    nodes,
    edges: [],
    edgeMeta: [],
    laneNames: LANES,
    baseX: BASE_X,
    baseY: 0,
    bounder: { getDimension: () => ({ width: 0, height: 0 }) },
    theme: resolveTheme('default'),
  });
  return result.swimlanes[0]!.width;
}

describe('measurement lanes registry', () => {
  it('an unmarked node has none; a marked node returns its lanes', () => {
    const plain = geo('n', 'note', 0, 1, 'B');
    const marked = geo('m', 'note', 0, 1, 'B');
    markMeasureSpec(marked, { lanes: ['A', 'B'] });
    expect(measureSpecOf(plain)).toBeUndefined();
    expect(measureSpecOf(marked)).toEqual({ lanes: ['A', 'B'] });
  });

  it('a note measured into lane A widens lane A to cover it; unmarked it does not', () => {
    // Same `kind` on both nodes, so `fudgeX`'s per-kind ink pad cancels in
    // the width difference.
    const action = (): ActivityNodeGeo => geo('a', 'note', 0, ACTION_WIDTH, 'A');
    const unmarked = geo('n', 'note', NOTE_X, NOTE_WIDTH, 'B');
    const marked = geo('n', 'note', NOTE_X, NOTE_WIDTH, 'B');
    markMeasureSpec(marked, { lanes: ['A', 'B'] });
    const narrow = laneAWidth([action(), unmarked]);
    expect(laneAWidth([action(), marked]) - narrow).toBe(NOTE_X + NOTE_WIDTH - ACTION_WIDTH);
  });
});

describe('stacked-note margin box (TextBlockMarged UEmpty, FtileWithNotes.java:134)', () => {
  it('adds an unfudged box 10 px wider on each side, in the node lane', () => {
    const items = specLaneItems(geo('n', 'note', NOTE_X, NOTE_WIDTH, 'A'), { marginX: 10 });
    expect(items).toEqual([
      { swimlane: 'A', kind: 'note', x: NOTE_X, width: NOTE_WIDTH },
      { swimlane: 'A', x: NOTE_X - 10, width: NOTE_WIDTH + 20 },
    ]);
  });

  it('widens the lane by both margins', () => {
    const plain = geo('n', 'note', NOTE_X, NOTE_WIDTH, 'A');
    const marged = geo('n', 'note', NOTE_X, NOTE_WIDTH, 'A');
    markMeasureSpec(marged, { marginX: 10 });
    expect(laneAWidth([marged]) - laneAWidth([plain])).toBe(20);
  });
});

describe('cross-lane note fixtures -- equal to the jar', () => {
  for (const name of ['note-xlane-floating', 'note-xlane-spike', 'note-xlane-left']) {
    it(`${name}: no diff, and no flow connector into the note`, () => {
      const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
      const count = (svg: string): number => [...svg.matchAll(/<polygon\b/g)].length;
      expect(count(ours)).toBe(count(golden));
      expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
    });
  }
});
