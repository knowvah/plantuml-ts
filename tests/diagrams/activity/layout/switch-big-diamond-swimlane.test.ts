/**
 * End-to-end tests (through the real parse -> layout pipeline, not stubs)
 * for T1p-f's port of `FtileSwitchWithDiamonds#drawU`'s `Mode.BIG_DIAMOND`
 * branch (`vcompact/cond/FtileSwitchWithDiamonds.java:136-138`): see
 * `switch-swimlane-duplicate.ts`'s own doc for the full mechanism. These
 * drive `walk-switch.ts` (the tag) and `swimlane-placement.ts` (the
 * per-lane duplication) together, exactly as `tile-coordinates.test.ts`'s
 * own `layoutActivity` tests already do for other swimlane behaviour.
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

// T1p-e's fixture (`tests/fixtures/activity/T1p-e/switch-cross-swimlane
// .puml`, reproduced here so this test owns its own input): a 2-case
// switch, each case a single leaf action -- `tiles.size() == 2` forces
// `w9 == 0` (`FtileSwitchWithDiamonds.java:84-90`'s loop body is
// unreachable), so `mode == BIG_DIAMOND` whenever the diamond is wider
// than the cases' own half-widths, which it is here.
const BIG_DIAMOND_SWIMLANE_PUML = `@startuml
|Lane1|
start
switch (test)
case (a)
|Lane2|
:A;
case (b)
:B;
endswitch
|Lane1|
stop
@enduml`;

describe('switch BIG_DIAMOND + swimlanes -- case boxes redraw once per lane', () => {
  const geo = layout(BIG_DIAMOND_SWIMLANE_PUML);

  it('draws case "A" once per lane (2 lanes -> 2 nodes)', () => {
    const aNodes = geo.nodes.filter((n) => n.label === 'A');
    expect(aNodes).toHaveLength(2);
  });

  it('draws case "B" once per lane (2 lanes -> 2 nodes)', () => {
    const bNodes = geo.nodes.filter((n) => n.label === 'B');
    expect(bNodes).toHaveLength(2);
  });

  it('each lane gets its own copy of "A", positioned inside that lane', () => {
    const [lane1, lane2] = geo.swimlanes;
    const aNodes = geo.nodes.filter((n) => n.label === 'A');
    const swimlanesOfA = aNodes.map((n) => n.swimlane).sort();
    expect(swimlanesOfA).toEqual(['Lane1', 'Lane2']);
    for (const n of aNodes) {
      const lane = n.swimlane === 'Lane1' ? lane1! : lane2!;
      expect(n.x).toBeGreaterThanOrEqual(lane.x);
      expect(n.x + n.width).toBeLessThanOrEqual(lane.x + lane.width);
    }
  });

  it('the two copies of "A" sit at DIFFERENT absolute x (one per lane origin)', () => {
    const aNodes = geo.nodes.filter((n) => n.label === 'A');
    expect(aNodes[0]!.x).not.toBe(aNodes[1]!.x);
  });
});

describe('switch BIG_DIAMOND, no swimlanes -- byte-identical (no duplication)', () => {
  it('draws each case exactly once when the diagram has no swimlanes', () => {
    const geo = layout('@startuml\nstart\nswitch (test)\ncase (a)\n:A;\ncase (b)\n:B;\nendswitch\nstop\n@enduml');
    expect(geo.nodes.filter((n) => n.label === 'A')).toHaveLength(1);
    expect(geo.nodes.filter((n) => n.label === 'B')).toHaveLength(1);
  });
});

describe('switch SMALL_DIAMOND + swimlanes -- byte-identical (no duplication)', () => {
  it('a wide case relative to a narrow diamond stays SMALL_DIAMOND: no duplication', () => {
    // A long condition-free diamond (short label) with WIDE case labels
    // keeps `w13 <= w9` (`isBigDiamond` false, see `gtile-switch.test.ts`),
    // mirroring `mojezi-43-gamu360`'s oracle (confirmed via the Java
    // formula computed against the jar's own real widths: no duplicate
    // boxes in that fixture's pinned SVG).
    const geo = layout(
      '@startuml\n|Lane1|\nstart\nswitch (t)\ncase (a)\n|Lane2|\n:a much longer first case label;\ncase (b)\n:also a rather long second case label;\nendswitch\n|Lane1|\nstop\n@enduml',
    );
    const aNodes = geo.nodes.filter((n) => n.label === 'a much longer first case label');
    expect(aNodes).toHaveLength(1);
  });
});
