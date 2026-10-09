/**
 * `add3` T3b-2: `FtileSwitchWithManyLinks#addOutgoingArrows`'s SECOND loop
 * (`:466-471`) adds a `ConnectionVerticalThenHorizontalCrossSwimlane` for
 * every case whose real (leaf-resolved) exit lane differs from `diamond2`'s
 * lane -- in ADDITION to, not instead of, the same-lane window logic. That
 * window logic (`getFirstOutgoingArrow`/`getLastOutgoingArrow`, `:489-507`)
 * filters on `differentSwimlane(this, tile)`, where `this` is the switch
 * itself: `FtileSwitchNude#getSwimlaneOut()` returns `getSwimlaneIn()`
 * (`:85-86`), which returns the switch's own single `in` field (`:81-83`,
 * set once at construction and shared by every branch) -- so for a DIRECT
 * case of a switch, `tile.getSwimlaneIn()` (the branch's own entry, before
 * any internal `|lane|` directive) always equals the switch's home lane,
 * making `differentSwimlane(this, tile)` structurally always false at this
 * call site, regardless of which lane the branch's content ends up in.
 *
 * `walk-switch.ts#sameLane` mis-ported this as `laneIn(c, myLane) ===
 * myLane`, where `laneIn` (correctly, for a multi-statement branch) walks
 * into the FIRST child -- but for a single-statement branch whose sole
 * statement itself carries the `|lane|` directive, there is no separate
 * "entry" tile to stop the recursion before it, so `laneIn` returns that
 * leaf's OWN (post-directive) lane instead of the branch's pre-directive
 * entry lane. The case this excludes from `getLastOutgoingArrow`'s window
 * never gets `pushOneMergeEdge` called for it at all -- dropping its
 * outgoing connector (2 lines + 1 arrowhead) entirely, even though that
 * function already carries the correct, previously-ported (T1p-e)
 * cross-lane geometry (`switch-v-then-h-cross`) once reached.
 *
 * mojezi-43-gamu360's own shape, reproduced minimally. Coordinates are
 * the jar's own (`<line>`s of mojezi's oracle SVG), byte-equal since
 * `add4` T1a ported `FtileDecorateInLabel` (case row sits each case
 * label's own height lower).
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../../src/core/BlockUmlBuilder.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { parseActivity } from '../../../../src/diagrams/activity/parser.js';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { astOrThrow } from '../../../helpers/parse-ast.js';

function layout(markup: string) {
  const first = buildBlockUmls(markup)[0];
  if (first === undefined) throw new Error('no diagram block');
  if (!first.ok) throw first.failure.cause;
  const ast = astOrThrow(parseActivity(first.source), 'activity');
  return layoutActivity(ast, resolveTheme('default'), new DeterministicMeasurer());
}

// mojezi-43-gamu360 (`test-results/dot-cache/activity/mojezi-43-gamu360/
// in.puml`): a 2-case switch whose LAST case switches lane via `|S1|`
// immediately before its sole statement.
const MOJEZI_PUML = `@startuml
|S1|
|S2|

|S2|
:preAct;
switch (Test)
case (!S2)
:ActprS3;
case (Aba1)
|S1|
:ActPrS1;
endswitch
|S2|
:postAct;
@enduml`;

// isw-T2-act: seam #4 float-rounds every width (`Math.fround`), so layout
// coordinates carry float noise; they are compared at the jar's printed
// precision, values from the re-captured
// `test-results/dot-cache/activity/mojezi-43-gamu360/in.svg` lines.
const r3 = (n: number): number => Math.round(n * 1000) / 1000;
const pts3 = (ps: readonly { x: number; y: number }[]) => ps.map((p) => ({ x: r3(p.x), y: r3(p.y) }));

describe('switch outgoing connector, last case crosses lane mid-branch', () => {
  const geo = layout(MOJEZI_PUML);

  it('still emits the last case’s own outgoing (case -> merge) connector', () => {
    // Case 0 (!S2, same lane throughout) gets this shape unconditionally;
    // case 1 (Aba1 -> |S1|) must get the analogous one, not be dropped.
    const sameLaneCaseOut = geo.edges.find(
      (e) => e.points.length === 3 && r3(e.points[0]!.x) === 131.363 && e.points[0]!.y === 180.5,
    );
    expect(sameLaneCaseOut).toBeDefined();

    const crossLaneCaseOut = geo.edges.find(
      (e) => e.points.length === 3 && r3(e.points[0]!.x) === 58.013 && e.points[0]!.y === 180.5,
    );
    expect(crossLaneCaseOut).toBeDefined();
    expect(pts3(crossLaneCaseOut!.points)).toEqual([
      { x: 58.013, y: 180.5 },
      { x: 58.013, y: 202.5 },
      { x: 161.375, y: 202.5 },
    ]);
  });

  it('carries no label on the cross-lane case-out connector (no `.withLabel()` call on `ConnectionVerticalThenHorizontalCrossSwimlane`)', () => {
    const crossLaneCaseOut = geo.edges.find(
      (e) => e.points.length === 3 && r3(e.points[0]!.x) === 58.013 && e.points[0]!.y === 180.5,
    );
    expect(crossLaneCaseOut!.label).toBeUndefined();
  });
});
