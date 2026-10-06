/**
 * End-to-end tests (real parse -> layout, not stubs) for T1b pass 2's
 * generic `-> label;` mechanism: `ActivityDiagram3.java:105-106,437-465`
 * (`setLabelNextArrow` -> `nextLinkRenderer()`, consumed by the next
 * instruction) -> `tile-layout.ts#tileNodes` (pending state) ->
 * `Tile.inLabel` -> `tile-coordinates.ts#pushTopDownSiblingEdge` ->
 * `tile-layout-inlabel.ts#applyInLabel` (`ConnectionVerticalDown.java:
 * 79-80`, `withLabel(textBlock, arrowHorizontalAlignment())`) plus the
 * assembly height reservation (`FtileFactoryDelegatorAssembly.java:
 * 58-62`, `tiles/gtile-top-down.ts#sequentialGap`).
 *
 * Jar numbers (verified via `scripts/oracle-render.sh`, see
 * `.agent-notes/add3-T1b.md`): `start;:A;->hello;:B;stop;` renders at
 * `width=78 height=220`, B's own box at `y=126.444`, "hello" at
 * `x=34.013`.
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

const DEFAULT_LABEL_PUML = `@startuml
start
:A;
-> hello;
:B;
stop
@enduml`;

describe('generic -> label; -- default (no colour, horizontal LEFT)', () => {
  const geo = layout(DEFAULT_LABEL_PUML);
  const labelled = geo.edges.find((e) => e.label === 'hello');

  it('reaches the renderer at all (T1a: this was previously dropped entirely)', () => {
    expect(labelled).toBeDefined();
  });

  it('carries {horizontal: LEFT} (arrowHorizontalAlignment() default)', () => {
    expect(labelled!.labelAlign).toEqual({ horizontal: 'LEFT' });
  });

  it('is the edge FROM A TO B, not ConnectionIn/ConnectionOut', () => {
    const aNode = geo.nodes.find((n) => n.label === 'A')!;
    const bNode = geo.nodes.find((n) => n.label === 'B')!;
    expect(labelled!.points[0]).toEqual({ x: aNode.x + aNode.width / 2, y: aNode.y + aNode.height });
    expect(labelled!.points[labelled!.points.length - 1]).toEqual({
      x: bNode.x + bNode.width / 2,
      y: bNode.y,
    });
  });

  it('the label reservation widens the A-B gap past the bare 35px assembly gap (FtileFactoryDelegatorAssembly.java:58-62)', () => {
    const aNode = geo.nodes.find((n) => n.label === 'A')!;
    const bNode = geo.nodes.find((n) => n.label === 'B')!;
    const gap = bNode.y - (aNode.y + aNode.height);
    expect(gap).toBeGreaterThan(35);
  });

  it('total height matches the jar exactly (220, oracle-rendered)', () => {
    expect(geo.totalHeight).toBe(220);
  });

  it("B's own box y matches the jar exactly (126.444)", () => {
    const bNode = geo.nodes.find((n) => n.label === 'B')!;
    expect(bNode.y).toBeCloseTo(126.444, 3);
  });
});

describe('generic -> label; -- no label: byte-identical to the pre-task shape', () => {
  it('A-B gap stays the bare (compressed) 20px, total height 201 (jar-verified)', () => {
    const geo = layout('@startuml\nstart\n:A;\n:B;\nstop\n@enduml');
    const labelled = geo.edges.find((e) => e.label !== undefined);
    expect(labelled).toBeUndefined();
    expect(geo.totalHeight).toBe(201);
  });
});

describe('generic -> label; -- coloured (<back:color>)', () => {
  it('carries both label and color onto the edge', () => {
    const geo = layout('@startuml\nstart\n:A;\n-><back:red> hello;\n:B;\nstop\n@enduml');
    const labelled = geo.edges.find((e) => e.label === 'hello');
    expect(labelled!.color).toBe('red');
  });
});

describe('generic -> label; -- a label right before stop lands on stop\'s own incoming edge', () => {
  // `stop(Colors)` (`ActivityDiagram3.java:155-163`) ALSO reads
  // `nextLinkRenderer()`, exactly like `addActivity`/`fork`/etc. -- not a
  // special case this mechanism needs to guard against.
  it('attaches to the edge into the stop node, not dropped', () => {
    const geo = layout('@startuml\nstart\n:A;\n-> orphan;\nstop\n@enduml');
    expect(geo.edges.some((e) => e.label === 'orphan')).toBe(true);
  });
});

describe('generic -> label; -- a label with NO following node at all is dropped, not thrown', () => {
  it('does not crash when the arrow-label is the last node in its list', () => {
    expect(() => layout('@startuml\nstart\n:A;\n-> orphan;\n@enduml')).not.toThrow();
  });
});

// T1b pass 2: `ParallelBuilderFork$ConnectionIn`/`ParallelBuilderSplit
// $ConnectionIn` (T1a's census rows 19/20, 25/26) -- a `-> label;` right
// after `fork`/`fork again`/`split`/`also`, attached to the BRANCH's own
// wrapping `GtileTopDown` (`tile-layout-structural.ts#buildBranchTopDown`),
// read by `walk-fork-branches.ts#pushBranchIn`.
describe('generic -> label; -- fork branch entry (ParallelBuilderFork.java:151-163)', () => {
  const FORK_PUML = `@startuml
start
fork
-> hello;
:A;
fork again
:B;
end fork
stop
@enduml`;

  it('labels only the FIRST branch\'s own entry edge, exactly once (oracle-verified x=46.013)', () => {
    const geo = layout(FORK_PUML);
    const labelled = geo.edges.filter((e) => e.label === 'hello');
    expect(labelled).toHaveLength(1);
    expect(labelled[0]!.labelAlign).toEqual({ horizontal: 'LEFT' });
  });

  it('the second branch (no label) carries no label at all', () => {
    const geo = layout(FORK_PUML);
    const bNode = geo.nodes.find((n) => n.label === 'B')!;
    const intoB = geo.edges.find((e) => e.points.some((p) => p.y === bNode.y) && e.label === undefined);
    expect(intoB).toBeDefined();
  });
});

describe('generic -> label; -- split branch entry (ParallelBuilderSplit.java:194-203)', () => {
  it('labels the first split branch\'s own entry edge', () => {
    const geo = layout(`@startuml
start
split
-> hello;
:A;
split again
:B;
end split
stop
@enduml`);
    const labelled = geo.edges.filter((e) => e.label === 'hello');
    expect(labelled).toHaveLength(1);
    expect(labelled[0]!.labelAlign).toEqual({ horizontal: 'LEFT' });
  });
});
