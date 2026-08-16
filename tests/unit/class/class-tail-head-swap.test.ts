/**
 * T11 (mission edge-label-box-backlog, batch 6): the DOT tail/head reversal
 * `dotEdgeRunsReversed` applies to `rel.from`/`rel.to` was not applied to the
 * SIDED quantifier fields (`fromMultiplicity`/`toMultiplicity`) at either of
 * its two consumers. Upstream keeps `quantifier1` bound to `entity1` by
 * construction and inverts BOTH together in the one place a link inverts
 * (`CommandLinkClass.java:364`'s `link.getInv()` -> `Link.java:145-146` ->
 * `LinkArg.java:115-117`, `new LinkArg(label, length, quantifier2,
 * quantifier1, ...)`). See `.agent-notes/m3-tail-head-swap.md` for the full
 * diagnosis (T3) this task (T11) fixes.
 *
 * Three groups:
 * - DOT reservation (`class-dot-edges.ts#buildDotEdgeAttrs`) — mechanism-level,
 *   parametrized over every reversed form T3 jar-verified, plus the real
 *   `givoli-70-rade072` corpus fixture.
 * - Rendered anchor (`class-edge-label-anchor.ts#attachPortLabels`) — the
 *   second consumer of the same broken pairing, unit-tested directly.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { parseRelationshipLine } from '../../../src/diagrams/class/class-relationship-parser.js';
import { dotEdgeRunsReversed } from '../../../src/diagrams/class/class-dot-edge-order.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import type { ClassDiagramAST, Relationship } from '../../../src/diagrams/class/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer, WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { attachPortLabels } from '../../../src/diagrams/class/class-edge-label-anchor.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache/class',
);

function makeAST(rel: Relationship): ClassDiagramAST {
  return {
    classifiers: [
      { id: rel.from, display: rel.from, kind: 'class', typeParams: [], members: [] },
      { id: rel.to, display: rel.to, kind: 'class', typeParams: [], members: [] },
    ],
    relationships: [rel],
    namespaces: [],
    directives: [],
    notes: [],
  };
}

function captureGraph(ast: ClassDiagramAST): DotInputGraph {
  let captured: DotInputGraph | undefined;
  setLayoutInputObserver((g) => { captured = g; });
  try {
    layoutClass(ast, defaultTheme, new FormulaMeasurer());
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured!;
}

// ---------------------------------------------------------------------------
// DOT reservation — buildDotEdgeAttrs -> edgeLabelAttrs -> computeMultiplicityAttrs
// ---------------------------------------------------------------------------

describe('T11 — quantifier pair follows the swapped DOT tail/head (DOT reservation)', () => {
  // Every reversed form T3 jar-verified (.agent-notes/m3-tail-head-swap.md's
  // "measured evidence" table), plus the inverted `<-left-` direction word,
  // which fails in the OPPOSITE direction from the other five. `<--o` is the
  // corpus's own form (givoli/nadepi/tekena/tiguma all carry the identical
  // `Potential "0..*" <--o "1" CompositePotential` line).
  const reversedForms = [
    'A "0..*" <|-- "1" B',
    'A "0..*" <.. "1" B',
    'A "0..*" <|.. "1" B',
    'A "0..*" <--* "1" B',
    'A "0..*" <--o "1" B',
    'A "0..*" <-left- "1" B',
  ];

  it.each(reversedForms)('binds tailLabel/headLabel to the DOT-swapped ends: %s', (line) => {
    const rel = parseRelationshipLine(line);
    expect(rel, `expected ${line} to parse`).not.toBeNull();
    // Ground truth for "which multiplicity belongs at the DOT tail/head" is
    // computed the SAME way `buildDotEdges` computes its own `swap` — this
    // is not re-deriving the fix, it is deriving the EXPECTATION from the
    // upstream invariant the fix restores (quantifier follows the swap).
    const swap = dotEdgeRunsReversed(rel!);
    const expectedTail = swap ? rel!.toMultiplicity : rel!.fromMultiplicity;
    const expectedHead = swap ? rel!.fromMultiplicity : rel!.toMultiplicity;

    const attrs = captureGraph(makeAST(rel!)).edges[0]!.attributes!;
    expect(attrs.tailLabel).toBe(expectedTail);
    expect(attrs.headLabel).toBe(expectedHead);
  });

  it('does not disturb an already-correct (non-reversed) pairing — regression guard', () => {
    const rel = parseRelationshipLine('A "1" *-- "0..*" B');
    expect(rel).not.toBeNull();
    expect(dotEdgeRunsReversed(rel!)).toBe(false);
    const attrs = captureGraph(makeAST(rel!)).edges[0]!.attributes!;
    expect(attrs.tailLabel).toBe('1');
    expect(attrs.headLabel).toBe('0..*');
  });

  it('givoli-70-rade072: taillabel 19x13, headlabel 7x13 on the affected edge', () => {
    const puml = readFileSync(join(CACHE, 'givoli-70-rade072', 'in.puml'), 'utf8');
    const captured: DotInputGraph[] = [];
    setLayoutInputObserver((g) => captured.push(g));
    try {
      renderSync(puml, { measurer: new WidthTableMeasurer() });
    } finally {
      setLayoutInputObserver(undefined);
    }
    // `"0..*"` occurs exactly once in this fixture's source (line 59:
    // `Potential "0..*" <--o "1" CompositePotential`), so whichever edge
    // carries it as tailLabel/headLabel is unambiguously this one.
    const edge = captured
      .flatMap((g) => g.edges)
      .find((e) => e.attributes?.tailLabel === '0..*' || e.attributes?.headLabel === '0..*');
    expect(edge, 'expected an edge carrying the "0..*" quantifier').toBeDefined();
    const attrs = edge!.attributes!;
    expect(attrs.tailLabel).toBe('0..*');
    expect(attrs.tailLabelWidth).toBe(19);
    expect(attrs.tailLabelHeight).toBe(13);
    expect(attrs.headLabel).toBe('1');
    expect(attrs.headLabelWidth).toBe(7);
    expect(attrs.headLabelHeight).toBe(13);
  });
});

// ---------------------------------------------------------------------------
// Rendered anchor — attachPortLabels, the second consumer T3 named
// ---------------------------------------------------------------------------

function baseEdgeGeo(rel: Relationship): EdgeGeo {
  return {
    id: 'edge-0',
    points: [],
    targetDecor: 'none',
    sourceDecor: 'none',
    dashed: false,
    from: rel.from,
    to: rel.to,
  };
}

describe('T11 — attachPortLabels binds the DOT-swapped multiplicity to its own position', () => {
  it('a reversed relationship places toMultiplicity text at tailLabelX/Y', () => {
    // Mirrors givoli-70-rade072's real parsed shape (T3's own causal-chain
    // measurement): from=CompositePotential (fromMultiplicity "1"),
    // to=Potential (toMultiplicity "0..*"), dotEdgeReversed=true.
    const rel = parseRelationshipLine('Potential "0..*" <--o "1" CompositePotential')!;
    expect(rel).toMatchObject({
      from: 'CompositePotential', to: 'Potential',
      fromMultiplicity: '1', toMultiplicity: '0..*', dotEdgeReversed: true,
    });

    const edgeGeo = baseEdgeGeo(rel);
    attachPortLabels(
      edgeGeo, rel,
      { id: 'edge-0', points: [], tailLabelX: 100, tailLabelY: 200, headLabelX: 300, headLabelY: 400 },
      { measurer: new FormulaMeasurer(), fontFamily: 'sans-serif', nodes: [] },
    );

    // The DOT tail sits at (100,200) — post-fix that is where the SWAPPED
    // quantifier (toMultiplicity, "0..*") was reserved, per buildDotEdgeAttrs.
    // `portLabelAnchor` centers the box on the given point, so x/y stay
    // within one CARDINALITY_FONT_SIZE (13) of it.
    expect(edgeGeo.tailLabel?.text).toBe('0..*');
    expect(edgeGeo.tailLabel?.x).toBeGreaterThan(100 - 13);
    expect(edgeGeo.tailLabel?.y).toBeGreaterThan(200 - 13);
    expect(edgeGeo.tailLabel?.y).toBeLessThan(200 + 13);
    expect(edgeGeo.headLabel?.text).toBe('1');
    expect(edgeGeo.headLabel?.y).toBeGreaterThan(400 - 13);
    expect(edgeGeo.headLabel?.y).toBeLessThan(400 + 13);
  });

  it('a non-reversed relationship keeps fromMultiplicity at the tail — regression guard', () => {
    const rel = parseRelationshipLine('A "1" *-- "0..*" B')!;
    expect(dotEdgeRunsReversed(rel)).toBe(false);

    const edgeGeo = baseEdgeGeo(rel);
    attachPortLabels(
      edgeGeo, rel,
      { id: 'edge-0', points: [], tailLabelX: 10, tailLabelY: 20, headLabelX: 30, headLabelY: 40 },
      { measurer: new FormulaMeasurer(), fontFamily: 'sans-serif', nodes: [] },
    );
    expect(edgeGeo.tailLabel?.text).toBe('1');
    expect(edgeGeo.headLabel?.text).toBe('0..*');
  });
});
