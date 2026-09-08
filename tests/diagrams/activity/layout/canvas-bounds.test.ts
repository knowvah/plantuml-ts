/**
 * The canvas returned by `assignCoordinates` must CONTAIN everything the
 * renderer draws into it (`fix/activity-canvas-bounds`, 2026-09-08).
 *
 * The bug this pins: `assignCoordinates` returns three geometry arrays --
 * `nodes`, `edges` and `swimlanes` -- and `renderActivity` draws all three,
 * but the `maxX`/`maxY` bounds consulted only the first two. A lane band
 * wider than the widest node fell OUTSIDE its own canvas. Measured over the
 * committed corpus before the fix: **32 of the 268 baselined activity
 * fixtures drew outside their own viewport**, by up to 216px.
 *
 * That defect is invisible to the oracle ratchet -- `svg/@width` is a
 * single diff whether the number is slightly wrong or catastrophically
 * wrong -- so it is asserted here directly rather than left to the corpus
 * gates. Fixing it moved the aggregate weightedScore by 2 units total while
 * moving 34 canvases, 28 of them CLOSER to the jar.
 */
import { describe, it, expect } from 'vitest';

import { buildBlockUmls } from '../../../../src/core/BlockUmlBuilder.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { parseActivity } from '../../../../src/diagrams/activity/parser.js';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import type { ActivityGeometry } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { astOrThrow } from '../../../helpers/parse-ast.js';

function layout(markup: string): ActivityGeometry {
  const first = buildBlockUmls(markup)[0];
  if (first === undefined) throw new Error('no diagram block');
  if (!first.ok) throw first.failure.cause;
  const ast = astOrThrow(parseActivity(first.source), 'activity');
  return layoutActivity(ast, resolveTheme('default'), new DeterministicMeasurer());
}

/** Every extent the renderer draws, per `renderer.ts#renderSwimlanes`: the
 *  header band and separator span the SUM of the lane widths from x=0,
 *  while each lane's own right edge is `lane.x + lane.width`. The two are
 *  not equal, because lanes start at the layout margin and the band starts
 *  at 0 -- whether they SHOULD be is the swimlane visual model, owned by
 *  `activity-swimlane-rendering`. */
function drawnRight(geo: ActivityGeometry): number {
  const nodes = geo.nodes.map((n) => n.x + n.width);
  const edges = geo.edges.flatMap((e) => e.points.map((p) => p.x));
  const lanes = geo.swimlanes.map((s) => s.x + s.width);
  const band = geo.swimlanes.reduce((acc, s) => acc + s.width, 0);
  return Math.max(0, band, ...nodes, ...edges, ...lanes);
}

describe('assignCoordinates — the canvas contains what is drawn', () => {
  it('a two-lane diagram is wide enough for its lanes, not just its nodes', () => {
    // The exact shape of `pakema-21-xema183`, the worst non-nested case:
    // before the fix, lanes reached x=252 inside a totalWidth of 144.
    const geo = layout('@startuml\n|A|\nstart\n:a;\n|BBBBBBBBBBBBBBBBBBBBBBBBB|\n:b;\n@enduml');
    expect(geo.swimlanes.length).toBe(2);
    const lanesRight = Math.max(...geo.swimlanes.map((s) => s.x + s.width));
    const nodesRight = Math.max(...geo.nodes.map((n) => n.x + n.width));
    expect(lanesRight, 'this fixture only tests the bug if the lanes DO outrun the nodes').toBeGreaterThan(nodesRight);
    expect(geo.totalWidth).toBeGreaterThanOrEqual(lanesRight);
  });

  it('holds across lane counts — including the many-lane case that overflowed by 216px', () => {
    for (const n of [1, 2, 3, 5]) {
      const lanes = Array.from({ length: n }, (_, i) => `|lane${String(i)}|\n:step${String(i)};`).join('\n');
      const geo = layout(`@startuml\n${lanes}\n@enduml`);
      expect(geo.totalWidth, `${String(n)} lanes: canvas must contain every drawn extent`).toBeGreaterThanOrEqual(
        drawnRight(geo),
      );
    }
  });

  it('a diagram with NO swimlanes is unaffected — the bound is untouched when the array is empty', () => {
    const geo = layout('@startuml\nstart\n:a;\nstop\n@enduml');
    expect(geo.swimlanes).toEqual([]);
    expect(geo.totalWidth).toBeGreaterThanOrEqual(drawnRight(geo));
    // The regression guard: a nodes-only diagram must not have GAINED width.
    const nodesRight = Math.max(...geo.nodes.map((n) => n.x + n.width));
    expect(geo.totalWidth - nodesRight).toBeLessThanOrEqual(12);
  });

  it('Y is deliberately NOT widened by lanes', () => {
    // A lane draws its divider from y=0 to totalHeight and its title inside
    // SWIMLANE_HEADER_H, so it can never extend past a bound Y already
    // covers. Pinned so a later change does not "symmetrise" the fix and
    // silently grow every swimlane diagram's height.
    const withLanes = layout('@startuml\n|A|\n:a;\n|B|\n:b;\n@enduml');
    const bottom = Math.max(...withLanes.nodes.map((n) => n.y + n.height));
    expect(withLanes.totalHeight - bottom).toBeLessThanOrEqual(12);
  });
});
