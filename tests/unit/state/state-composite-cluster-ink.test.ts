/**
 * Feature (SI29 F7 / SI28 G4): a graphviz CLUSTER nested inside an autonom
 * pass or a concurrent region must be sized from its REAL graphviz-returned
 * cluster box — title bar and frontier margin included — and that box must
 * ride the same `moveDelta` translation its member nodes do.
 *
 * Upstream has no context-dependent variant of either rule.
 *
 *   1. Every `Cluster` gets its `rectangleArea` from graphviz's own polygon
 *      (`DotStringFactory#solveDotProblem` → `Cluster#setPosition`,
 *      `DotStringFactory.java:434`), widened by `FrontierCalculator` +
 *      `ensureMinWidth(getTitleAndAttributeWidth() + 10)` when the cluster
 *      carries border points (`Cluster#manageEntryExitPoint`,
 *      `Cluster.java:410-436`, reached from `drawU` at `:344`;
 *      `ClusterHeader.java:81-95` computes the title/attribute terms). That
 *      box is what `SvekResult#drawU` paints for EVERY cluster
 *      (`SvekResult.java:71-74`) and therefore what `SvekResult
 *      #calculateDimension`'s `TextBlockUtils.getMinMax` walk folds
 *      (`SvekResult.java:129-135`) — the dimension `InnerStateAutonom
 *      #calculateDimensionSlow` wraps as `im.calculateDimension`
 *      (`InnerStateAutonom.java:186-197`) and `ConcurrentStates
 *      #calculateDimensionSlow` sums per region
 *      (`ConcurrentStates.java:133-141`). Our two ink-extent seams used to
 *      pass `clusterPosMap: undefined`, so `materializeCluster` missed every
 *      lookup and fell back to `boundingBox(children)`.
 *
 *   2. The `clusterManager.moveDelta(6 - minX, 6 - minY)` that same
 *      `calculateDimension` fires (`SvekResult.java:133`) is
 *      `DotStringFactory#moveDelta` (`DotStringFactory.java:653-663`), which
 *      loops `allNodes()`, `allLines()` AND `allCluster()`. Our
 *      `shiftDotLayoutResult` carried only the first two.
 *
 * Fixture: `test-results/dot-cache/state/bajelo-54-dixe684/in.puml`,
 * verbatim — `Track_FSM` (autonom) wraps a pass containing `Run`, a cluster
 * (the `Run --> Stop` edge crosses its boundary), which in turn contains
 * `Do_Sector`, a second cluster. Oracles are that fixture's own cached jar
 * output: `svek-3.dot:6` for the declared size and `in.svg` for the two
 * nested cluster rectangles.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver, type DotInputGraph } from '../../../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { dotInputToStructural } from '../../oracle/svek-dot.js';

/** `test-results/dot-cache/state/bajelo-54-dixe684/in.puml`, verbatim. */
const BAJELO = `@startuml
[*]-->Track_FSM
state Track_FSM {
 state Stop
 Stop : entry/entry_stop();
 Stop : exit/exit_stop();
 Stop --> Chg_Sector : EV_START
 Run --> Stop : EV_STOP
 state Run{
  Run : entry / enter_run();
  Run : exit / exit_run();
  state Chg_Sector {
 }
  state Do_Sector {
    Do_Sector : entry / enter_do_sector();
    Do_Sector : exit / exit_do_sector();
    state WriteSector
    WriteSector : aaa
    state ReadSector
  }
 }
}
Track_FSM -->[*]
@enduml`;

/** jar `svek-3.dot:6` — `Track_FSM`'s declared box, in inches. */
const JAR_TRACK_FSM = { width: 6.561719, height: 5.527778 };

/** jar `in.svg` — the two nested cluster rectangles inside `Track_FSM`'s own
 *  pass, in absolute page px. `Run` is the cluster whose title bar and
 *  frontier margin the `boundingBox(children)` fallback dropped; `Do_Sector`
 *  is the level below it, which the same fallback dropped again. */
const JAR_NESTED_CLUSTERS = [
  { x: 19, y: 241, width: 414, height: 230 },
  { x: 154.75, y: 315, width: 246.498, height: 132 },
];

/** Both residuals are OUTSIDE this fix and are asserted, not hidden:
 *
 *  - height, exactly 1.0 px over: `layout-ink-extent.ts#addNodeInk`'s
 *    composite branch reuses `addStateBoxInk`'s leaf `-1` min-corner inset
 *    for a composite's own outer box — a reuse that module's own doc comment
 *    already flags as NOT jar-verified. Once the nested cluster box sits in
 *    the right frame it becomes the ink extremum, so the unverified inset
 *    surfaces. That file belongs to SI29 T9.
 *  - width, 0.0012 px: float noise in the frontier arithmetic.
 *
 *  Before this fix both axes were 12 px SHORT (6.394635 / 5.361111 in). */
const RESIDUAL_TOLERANCE_PX = 1.5;
const PX_PER_INCH = 72;

function declaredScopes(markup: string): DotInputGraph[] {
  const inputs: DotInputGraph[] = [];
  setLayoutInputObserver((g) => inputs.push(g));
  try {
    renderSync(markup, { measurer: new WidthTableMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return inputs;
}

function borderRects(svg: string): { x: number; y: number; width: number; height: number }[] {
  const out: { x: number; y: number; width: number; height: number }[] = [];
  for (const m of svg.matchAll(/<rect ([^>]*)>/g)) {
    const attrs = m[1]!;
    if (!attrs.includes('fill="none"')) continue;
    const num = (name: string): number => Number(new RegExp(`${name}="([-0-9.]+)"`).exec(attrs)![1]);
    out.push({ x: num('x'), y: num('y'), width: num('width'), height: num('height') });
  }
  return out;
}

describe('nested cluster ink inside an autonom pass (SI29 F7)', () => {
  it('declares Track_FSM at the size jar declared, title bar and frontier included', () => {
    const scopes = declaredScopes(BAJELO);
    expect(scopes).toHaveLength(3);
    const outer = dotInputToStructural(scopes[2]!);
    // The outermost scope holds `Track_FSM` plus the two `[*]` pseudo-
    // circles (0.277778 / 0.305556 in) — the widest node is the composite.
    const composite = [...outer.nodes].sort((a, b) => b.width - a.width)[0]!;
    expect(Math.abs(composite.width - JAR_TRACK_FSM.width) * PX_PER_INCH).toBeLessThan(
      RESIDUAL_TOLERANCE_PX,
    );
    expect(Math.abs(composite.height - JAR_TRACK_FSM.height) * PX_PER_INCH).toBeLessThan(
      RESIDUAL_TOLERANCE_PX,
    );
  });

  it('draws both nested cluster rectangles exactly where jar drew them', () => {
    const svg = renderSync(BAJELO, { measurer: new WidthTableMeasurer() });
    const rects = borderRects(svg);
    for (const jar of JAR_NESTED_CLUSTERS) {
      const ours = rects.find((r) => Math.abs(r.x - jar.x) < 0.01 && Math.abs(r.y - jar.y) < 0.01);
      expect(ours, `no rect at jar's (${jar.x}, ${jar.y})`).toBeDefined();
      expect(ours!.width).toBeCloseTo(jar.width, 2);
      expect(ours!.height).toBeCloseTo(jar.height, 2);
    }
  });
});
