/**
 * cdd-T6 — the five A2a/A5 render-only link geometry mechanisms.
 *
 * Every expected value below is read off the fixture's own oracle SVG in
 * `test-results/dot-cache/class/<slug>/in.svg`, never fitted to output:
 *
 * - A5/M5  edge direction  (`SvekEdge.java:643-655`)   — `delano-03-xino845`
 * - A2a/M2 visibility icon (`SvekEdge.java:363-374`,
 *                           `Display.java:415-416`)     — `canuti-20-jotu614`
 * - A2a/M4 dashed body     (`CommandLinkClass.java:495-497`)
 * - A2a/M5 note on link    (`SvekEdge.java:307-327`)   — `lipazi-06-care921`
 * - A2a/M10 quantifier split (`SvekEdge.java:330-340`) — `camuna-58-veca254`
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { layoutFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';
import { constraintSquare, sampleEdgePath } from '../../../src/diagrams/class/class-edge-constraint.js';
import type { ClassGeometry } from '../../../src/diagrams/class/layout.js';

const measurer = new WidthTableMeasurer();

function fixture(slug: string): ClassGeometry {
  const markup = readFileSync(`test-results/dot-cache/class/${slug}/in.puml`, 'utf8');
  return layoutFixtureClass(markup, measurer).geo;
}

function inline(body: string): ClassGeometry {
  return layoutFixtureClass(`@startuml\n${body}\n@enduml`, measurer).geo;
}

// ---------------------------------------------------------------------------
// A5/M5 — the spline runs entity1 -> entity2, never the mirror
// ---------------------------------------------------------------------------

describe('A5/M5 — normalizeEdgePoints applies the distance verdict inside a namespace', () => {
  // `delano-03-xino845`: `f1.function.Fox <|-- Rabbit` written INSIDE
  // `namespace issues`, so `idEntity2FullId` stays the bare `Rabbit` the
  // parser stamped while the laid-out node is `issues.Rabbit`. The old
  // lookup missed, skipped the verdict, and kept `reversed = dotSwap`.
  const geo = fixture('delano-03-xino845');

  it('emits both inheritance splines parent-end first, matching the golden`s increasing y', () => {
    // Golden `svg/g[1]/g[8]/path/@d`: 76.019,146.269 ... 79.86,224.72 --
    // y INCREASES from the Fox end to the Rabbit end.
    for (const edge of geo.edges) {
      expect(edge.points.length).toBeGreaterThan(1);
      expect(edge.points[0]!.y).toBeLessThan(edge.points[edge.points.length - 1]!.y);
    }
  });

  it('pairs the triangle decor with the end the flipped array actually starts at', () => {
    // `Fox <|-- Rabbit`: the triangle sits at Fox, which is now points[0].
    expect(geo.edges.map((e) => e.sourceDecor)).toEqual(['triangle', 'triangle']);
    expect(geo.edges.map((e) => e.targetDecor)).toEqual(['none', 'none']);
  });
});

// ---------------------------------------------------------------------------
// A2a/M2 — visibility modifier on a link label
// ---------------------------------------------------------------------------

describe('A2a/M2 — the link label`s visibility character is stripped and iconised', () => {
  const geo = fixture('canuti-20-jotu614');
  const byPair = new Map(geo.edges.map((e) => [`${e.from}->${e.to}`, e]));

  it('strips the leading char and shifts the text right by the icon block width', () => {
    // Golden `<text x="168.32" textLength="39">entries</text>`.
    const edge = byPair.get('Aaa->Entry')!;
    expect(edge.label?.text).toBe('entries');
    expect(edge.label?.x).toBeCloseTo(168.32, 2);
  });

  it('anchors the icon block 12px (classAttributeIconSize + 2) left of the text', () => {
    // Golden `<g data-visibility-modifier="PRIVATE_METHOD"><rect x="158.32"
    // y="160" width="6" height="6"/></g>`; `drawSquare` offsets the ink by
    // (+2,+2) from the block origin, so the block sits at 156.32,158.
    const edge = byPair.get('Aaa->Entry')!;
    expect(edge.visibilityIcon?.modifier).toBe('PRIVATE_METHOD');
    expect(edge.visibilityIcon?.x).toBeCloseTo(156.32, 2);
    expect(edge.visibilityIcon?.y).toBeCloseTo(158, 2);
  });

  it('names the METHOD modifier for `#` and `+` too (LinkArg.build passes isField=false)', () => {
    // Golden: `PROTECTED_METHOD` diamond at 96.32,158 (polygon 101.32,158…)
    // and `PUBLIC_METHOD` circle at 225.99,158 (ellipse cx 230.99 cy 163).
    const protectedEdge = byPair.get('Aaa->Factory')!;
    expect(protectedEdge.label?.text).toBe('factory');
    expect(protectedEdge.visibilityIcon?.modifier).toBe('PROTECTED_METHOD');
    expect(protectedEdge.visibilityIcon?.x).toBeCloseTo(96.32, 2);
    expect(protectedEdge.visibilityIcon?.y).toBeCloseTo(158, 2);
    const publicEdge = byPair.get('Aaa->Parent')!;
    expect(publicEdge.label?.text).toBe('parent');
    expect(publicEdge.visibilityIcon?.modifier).toBe('PUBLIC_METHOD');
    expect(publicEdge.visibilityIcon?.y).toBeCloseTo(158, 2);
  });

  it('leaves a label with no visibility character untouched, icon absent', () => {
    const geo2 = inline('class A\nclass B\nA --> B : plain');
    expect(geo2.edges[0]?.label?.text).toBe('plain');
    expect(geo2.edges[0]?.visibilityIcon).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// A2a/M4 — the arrow body's own dottedness
// ---------------------------------------------------------------------------

describe('A2a/M4 — a dotted body survives a decor-derived relationship type', () => {
  it('keeps `*..>` dashed even though composition`s decoration default is solid', () => {
    expect(inline('class A\nclass B\nA *..> B').edges[0]?.dashed).toBe(true);
    expect(inline('class A\nclass B\nA o.d.> B').edges[0]?.dashed).toBe(true);
  });

  it('leaves a solid body solid, and a type-dashed arrow dashed', () => {
    expect(inline('class A\nclass B\nA *--> B').edges[0]?.dashed).toBe(false);
    expect(inline('class A\nclass B\nA ..> B').edges[0]?.dashed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// A2a/M10 — a multi-line quantifier is one anchor per physical line
// ---------------------------------------------------------------------------

describe('A2a/M10 — `"customer\\n1"` becomes two head-end anchors', () => {
  const geo = fixture('camuna-58-veca254');
  const edge = geo.edges.find((e) => e.from === 'Shop')!;
  const head = edge.quantifierLines![1];

  it('splits into the golden`s two lines, one cardinality-font size apart', () => {
    // Golden: `customer` y=228.853, `1` y=238.853 -- a 10px step, the
    // fixture`s own `arrow { cardinality { FontSize 10 } }`.
    expect(head.map((l) => l.text)).toEqual(['customer', '1']);
    expect(head[1]!.y - head[0]!.y).toBeCloseTo(10, 6);
  });

  it('centres the short line inside the block, exactly as the golden does', () => {
    // Golden x: 270.023 and 287.773 -- a 17.75 offset, which is
    // `(textLength("customer") - width("1")) / 2 === (41.063 - 5.563) / 2`.
    expect(head[1]!.x - head[0]!.x).toBeCloseTo((head[0]!.width - head[1]!.width) / 2, 6);
    expect(head[1]!.x - head[0]!.x).toBeCloseTo(17.75, 2);
  });

  it('reports an empty array for the end that carries no quantifier', () => {
    expect(edge.quantifierLines![0]).toEqual([]);
  });

  it('reduces to the single-line tail/head anchor when there is no line break', () => {
    const geo2 = inline('class A\nclass B\nA "1..*" --> B');
    const [tail] = geo2.edges[0]!.quantifierLines!;
    expect(tail.map((l) => l.text)).toEqual(['1..*']);
    expect(tail[0]!.x).toBeCloseTo(geo2.edges[0]!.tailLabel!.x, 6);
    expect(tail[0]!.y).toBeCloseTo(geo2.edges[0]!.tailLabel!.y, 6);
  });
});

// ---------------------------------------------------------------------------
// A2a/M5 — `note on link`
// ---------------------------------------------------------------------------

describe('A2a/M5 — the note operand of the merged label block', () => {
  const geo = fixture('lipazi-06-care921');

  it('carries the note`s own preferred box and its inset ink box', () => {
    const edge = geo.edges.find((e) => e.noteBox !== undefined)!;
    const box = edge.noteBox!;
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    // `Rose.java:65-66` paddingX/paddingY, both 5 -- the ink polygon is
    // inset on all four sides.
    expect(box.inkBox.x).toBeCloseTo(box.x + 5, 6);
    expect(box.inkBox.y).toBeCloseTo(box.y + 5, 6);
    expect(box.inkBox.width).toBeCloseTo(box.width - 10, 6);
    expect(box.inkBox.height).toBeCloseTo(box.height - 10, 6);
  });

  it('measures the note`s own lines, not the link label`s', () => {
    const edge = geo.edges.find((e) => e.to === 'titi1')!;
    expect(edge.noteBox?.noteLines.map((l) => l.text)).toEqual(['this is my note on left link', 'blue']);
  });

  it('is absent on a link with no note', () => {
    expect(inline('class A\nclass B\nA --> B').edges[0]?.noteBox).toBeUndefined();
  });

  // cdd2-T19c: `position` (draw order), `back`/`line` (the note's own
  // #color), and `lineAtoms` (creole/sprite passthrough) — carried through
  // from `Relationship`/`measureNote` so the renderer can recover them.
  it('carries the relationship`s own linkNotePosition, defaulting to bottom', () => {
    const bottomEdge = geo.edges.find((e) => e.to === 'titi')!;
    expect(bottomEdge.noteBox?.position).toBe('bottom');
    const leftEdge = geo.edges.find((e) => e.to === 'titi1')!;
    expect(leftEdge.noteBox?.position).toBe('left');
  });

  it('carries the note-on-link`s own #color (lipazi: #red and #blue)', () => {
    const redEdge = geo.edges.find((e) => e.to === 'titi')!;
    expect(redEdge.noteBox?.back).toBe('red');
    expect(redEdge.noteBox?.line).toBeUndefined();
    const blueEdge = geo.edges.find((e) => e.to === 'titi1')!;
    expect(blueEdge.noteBox?.back).toBe('blue');
  });

  it('carries measureNote`s own creole/sprite atom breakdown (lineAtoms)', () => {
    const edge = geo.edges.find((e) => e.to === 'titi')!;
    expect(edge.noteBox?.lineAtoms).toHaveLength(1);
    expect(edge.noteBox?.lineAtoms?.[0]?.map((a) => (a.kind === 'text' ? a.text : a.kind))).toEqual(['note red']);
  });

  it('nuvake-96-gofe203: carries the compound #color;line:...;text:... spec (line wired, text dropped)', () => {
    const nuvake = fixture('nuvake-96-gofe203');
    const edge = nuvake.edges.find((e) => e.to === 'Foo')!;
    expect(edge.noteBox?.back).toBe('red');
    expect(edge.noteBox?.line).toBe('blue');
  });
});

// ---------------------------------------------------------------------------
// A2a/M9 — `constraint on links` geometry primitives
// ---------------------------------------------------------------------------

describe('A2a/M9 — the constraint square and bezier sampling', () => {
  it('builds SvekEdge#getSquare`s eight points in upstream order', () => {
    expect(constraintSquare(100, 200)).toEqual([
      { x: 100, y: 200 },
      { x: 105, y: 200 },
      { x: 110, y: 200 },
      { x: 100, y: 205 },
      { x: 110, y: 205 },
      { x: 100, y: 210 },
      { x: 105, y: 210 },
      { x: 110, y: 210 },
    ]);
  });

  it('samples a curved segment into many points and a flat one into its controls', () => {
    const flat = sampleEdgePath([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    expect(flat).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    const curved = sampleEdgePath([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
    ]);
    expect(curved.length).toBeGreaterThan(16);
    for (const p of curved) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
    }
  });

  it('falls back to the raw point list for a degenerate 2-point path', () => {
    const pts = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ];
    expect(sampleEdgePath(pts)).toEqual(pts);
  });
});
