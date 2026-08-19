/**
 * Full-pipeline regression tests for T9's `layout-ink-extent.ts` work
 * (mission state-declared-size-fix, F8). Mirrors `state-composite-cluster-
 * ink.test.ts`'s precedent: render the fixture's real `in.puml`, capture the
 * `DotInputGraph` this port DECLARES to graphviz via
 * `setLayoutInputObserver`, and compare against the jar's own cached
 * `svek-N.dot` — an exact, SVG-free oracle (see that file's own doc comment
 * for the full rationale).
 *
 * G6 (self-loop arrowhead ink folded into a composite's own childImg
 * extent, `pebepi-32-cati486`) LANDED — see `layout-ink-extent.ts`'s module
 * doc comment, mechanism-7 paragraph.
 *
 * G5 (`RoundedSouth` south-cap ink, `pacami-67-dafe414`) was diagnosed but
 * NOT landed: the south cap only draws when the composite's resolved body
 * background is non-transparent, a signal this module's pure `StateNodeGeo`
 * geometry cannot see (see the module doc comment's mechanism-8 paragraph
 * for the full, jar-cited account and the full-corpus regression evidence
 * that ruled out applying it unconditionally). The `pacami` test below is a
 * CHARACTERIZATION test pinning the current, still-mismatched value so a
 * future fix (or accidental regression) is visible against a known number.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver, type DotInputGraph } from '../../../src/core/graph-layout.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { dotInputToStructural } from '../../oracle/svek-dot.js';

/** `test-results/dot-cache/state/pacami-67-dafe414/in.puml`, verbatim. */
const PACAMI = `@startuml
<style>
root {
  FontColor Red
}
state {
  FontColor Blue
  BackGroundColor yellow
  LineColor violet
  header {
  	FontColor Green
  }
}
</style>
title How to change fontcolor by style?
state A {
  state B {
  }
  state C {
    state c : state c
  }
}

state S1 : state S1
state S2

@enduml`;

/** `test-results/dot-cache/state/pebepi-32-cati486/in.puml`, verbatim. */
const PEBEPI = `@startuml
<style>
state {
  BackgroundColor green
}
</style>

state parent {
    child --> child
}
@enduml`;

/** jar `svek-3.dot:6` — `A`'s declared box, in inches (G5, CLOSED by
 *  SI31 T4 on the height axis; the width residual is a separate ~0.0025px
 *  rounding gap, never part of G5). */
const JAR_A = { width: 2.744931, height: 2.069444 };
/** jar `svek-2.dot:6` — `parent`'s declared box, in inches (G6, resolved). */
const JAR_PARENT = { width: 1.463061, height: 1.375 };

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

describe('RoundedSouth south-cap ink (G5, mechanism 8, LANDED by SI31 T4)', () => {
  it("declares A's outer box at jar's own height, south cap included", () => {
    const scopes = declaredScopes(PACAMI);
    expect(scopes).toHaveLength(3);
    const outer = dotInputToStructural(scopes[2]!);
    // `A` (state B{}/C{c}) is the widest node in the outermost scope --
    // `S1`/`S2` are plain leaves, far narrower.
    const a = [...outer.nodes].sort((x, y) => y.width - x.width)[0]!;
    // PACAMI's `<style> state { BackGroundColor yellow }` resolves
    // `southBackcolor` non-transparent (`Cluster.java:459-471`), so
    // `RoundedSouth.drawU` draws its `UPath` cap and `LimitFinder
    // #drawUPath`'s ZERO inset reaches `y + height` -- 1px past the outline
    // `URectangle`'s own `y + height - 1`. That closes the height axis to
    // jar's 2.069444in exactly (it used to pin at 2.055556in).
    expect(a.height).toBeCloseTo(JAR_A.height, 6);
    // Width carries a pre-existing ~0.0025px residual, unrelated to G5.
    expect(a.width).toBeCloseTo(JAR_A.width, 4);
  });
});

describe('self-loop arrowhead ink folded into composite childImg extent (G6)', () => {
  it("declares parent's outer box at the size jar declared, arrowhead ink included", () => {
    const scopes = declaredScopes(PEBEPI);
    expect(scopes).toHaveLength(2);
    const outer = dotInputToStructural(scopes[1]!);
    const nodes = [...outer.nodes];
    expect(nodes).toHaveLength(1);
    const parent = nodes[0]!;
    // Height was already exact pre-fix (self-loop dominates Y regardless).
    expect(parent.height).toBeCloseTo(JAR_PARENT.height, 6);
    // Width is G6's own target: arrowhead ink shrinks it from -1.340px to
    // a ~0.0025px float-noise residual (`findings/composite-b.md`).
    expect(parent.width).toBeCloseTo(JAR_PARENT.width, 4);
  });
});
