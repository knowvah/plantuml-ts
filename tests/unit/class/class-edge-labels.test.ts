/**
 * Edge-label parsing/emission gap fixes (class-dot-sync, iteration 20).
 *
 * Four small groups, each verified against a real oracle fixture in
 * test-results/dot-cache/class/<slug>/ (see the slug noted per `it`):
 *
 * - G13: `skinparam linetype ortho` routes the main edge label through
 *   `xlabel` instead of `label` (SvekEdge.java:434-441).
 * - G14: `"role"/mult` (or reversed) association-end syntax — CommandLinkClass
 *   FIRST_ROLE/SECOND_ROLE (CommandLinkClass.java:127,144) — previously
 *   dropped the whole relationship line.
 * - G15: `[[url]]` on a relationship arrow previously dropped the whole line.
 * - G16: `<<stereotype>>` on a relationship arrow previously dropped the
 *   whole line.
 */
import { describe, it, expect } from 'vitest';
import { parseRelationshipLine } from '../../../src/diagrams/class/class-relationship-parser.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { edgeLabelAttrs } from '../../../src/diagrams/class/class-layout-edge-labels.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { Relationship } from '../../../src/diagrams/class/class-relationship-ast.js';
import { deepMergeTheme } from '../../../src/core/theme.js';

const measurer = new FormulaMeasurer();

function makeAST(overrides?: Partial<ClassDiagramAST>): ClassDiagramAST {
  return {
    classifiers: [
      { id: 'A', display: 'A', kind: 'class', typeParams: [], members: [] },
      { id: 'B', display: 'B', kind: 'class', typeParams: [], members: [] },
    ],
    relationships: [],
    namespaces: [],
    directives: [],
    notes: [],
    ...overrides,
  };
}

function captureGraph(ast: ClassDiagramAST, theme = defaultTheme): DotInputGraph {
  let captured: DotInputGraph | undefined;
  setLayoutInputObserver((g) => {
    captured = g;
  });
  try {
    layoutClass(ast, theme, measurer);
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured!;
}

// ---------------------------------------------------------------------------
// G13 — skinparam linetype ortho routes the label through xlabel
// ---------------------------------------------------------------------------

describe('G13 — linetype ortho edge label (bujedi-30-cize673, jakapi-64-tine258)', () => {
  const ast = makeAST({
    relationships: [{ from: 'A', to: 'B', type: 'composition', label: 'toC' }],
  });

  it('emits xlabel (not label) when theme.linetype is ortho', () => {
    const attrs = captureGraph(ast, { ...defaultTheme, linetype: 'ortho' }).edges[0]!.attributes!;
    expect(attrs.label).toBeUndefined();
    expect(attrs.xlabel).toBe('toC');
    expect(attrs.xlabelWidth).toBeGreaterThan(0);
    expect(attrs.xlabelHeight).toBeGreaterThan(0);
  });

  it('still emits label (not xlabel) without linetype ortho — regression guard', () => {
    const attrs = captureGraph(ast).edges[0]!.attributes!;
    expect(attrs.label).toBe('toC');
    expect(attrs.xlabel).toBeUndefined();
  });

  it('leaves taillabel/headlabel as label (never xlabel) under ortho', () => {
    const withMult = makeAST({
      relationships: [{ from: 'A', to: 'B', type: 'composition', fromMultiplicity: '1', toMultiplicity: '*' }],
    });
    const attrs = captureGraph(withMult, { ...defaultTheme, linetype: 'ortho' }).edges[0]!.attributes!;
    expect(attrs.tailLabelWidth).toBeGreaterThan(0);
    expect(attrs.headLabelWidth).toBeGreaterThan(0);
    expect(attrs.xlabel).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// G14 — "role"/mult (or reversed) association-end syntax
// ---------------------------------------------------------------------------

describe('G14 — role-name "/" multiplicity toggle (mugobo-34-fede498, nenexe-35-zere033)', () => {
  it('parses a quoted cardinality followed by a bare role on both ends', () => {
    const r = parseRelationshipLine('User "owner which is very long"/1 -- "0..n"/items Item');
    expect(r).toMatchObject({
      from: 'User',
      to: 'Item',
      type: 'association',
      fromMultiplicity: 'owner which is very long',
      toMultiplicity: '0..n',
      fromRole: '1',
      toRole: 'items',
    });
  });

  it('parses a quoted cardinality followed by a quoted role on both ends', () => {
    const r = parseRelationshipLine('User "owner"/"1" -- "0..n"/"items" Item');
    expect(r).toMatchObject({
      from: 'User',
      to: 'Item',
      fromMultiplicity: 'owner',
      toMultiplicity: '0..n',
      fromRole: '1',
      toRole: 'items',
    });
  });

  it('does not drop the relationship when only a role (no cardinality) is given', () => {
    const r = parseRelationshipLine('User "1" -- Item');
    expect(r).not.toBeNull();
    expect(r).toMatchObject({ from: 'User', to: 'Item', fromMultiplicity: '1' });
  });
});

// ---------------------------------------------------------------------------
// G15 — [[url]] on a relationship no longer drops the edge/label
// ---------------------------------------------------------------------------

describe('G15 — [[url]] on a relationship (fitini-85-kupo803, kutazo-40-texe886)', () => {
  it('parses a relationship carrying a URL before the label', () => {
    const r = parseRelationshipLine('a1 --> a2 [[http://www.google.com]] : foo');
    expect(r).toMatchObject({ from: 'a1', to: 'a2', type: 'association', label: 'foo' });
  });

  it('parses a composition relationship carrying a URL before the label', () => {
    const r = parseRelationshipLine('Car *-- Wheel [[http://plantuml.com]] : has some');
    expect(r).toMatchObject({ from: 'Car', to: 'Wheel', type: 'composition', label: 'has some' });
  });
});

// ---------------------------------------------------------------------------
// G16 — <<stereotype>> on a relationship arrow no longer drops the edge
// ---------------------------------------------------------------------------

describe('G16 — <<stereotype>> on a relationship arrow (zapibo-38-kope984, style-stereotype-on-arrow-4)', () => {
  it('parses a relationship carrying a stereotype before the label', () => {
    const r = parseRelationshipLine('n0 -> n1 <<mystyle>> : label');
    expect(r).toMatchObject({ from: 'n0', to: 'n1', type: 'association', length: 1, label: 'label' });
  });
});

// ---------------------------------------------------------------------------
// T12b/M4 cause C — `<<x>>` -> `«x»` before measuring a class link LABEL
// (`.agent-notes/m4-single-line-width.md`, `Guillemet.java:78-88`). Distinct
// from G16 above: G16 is the pre-colon ARROW stereotype, consumed by the
// parser and never measured as label text; this is the post-colon LABEL
// text itself, e.g. `Foo ..> IBar: <<delegate>>`.
// ---------------------------------------------------------------------------

describe('M4 cause C — guillemet rewrite (xopuku-46-nefa571, tebore-53-tese080, tedeba-19-lisi250)', () => {
  const oracleMeasurer = new DeterministicMeasurer();
  const font = { family: 'SansSerif', size: 13 };

  function stereotypeRel(label: string): Relationship {
    return { from: 'A', to: 'B', type: 'association', label };
  }

  it.each([
    ['<<delegate>>', 66],
    ['<<create>>', 52],
    ['<<alias>>', 43],
    ['<<implement>>', 76],
  ])('%s reserves width %i at font 13', (label, expectedWidth) => {
    const attrs = edgeLabelAttrs(stereotypeRel(label), font, font, oracleMeasurer);
    // `edgeLabelAttrs` itself leaves `labelWidth` fractional; the DOT
    // emitter truncates at write time (`svek-dot-emit-labels.ts#trunc`,
    // `SvekEdge.java:505-506`), so this mirrors that final step rather than
    // asserting a floor `edgeLabelAttrs` never performs.
    expect(Math.trunc(attrs.labelWidth!)).toBe(expectedWidth);
  });

  it('rewrites a MID-STRING <<x>> run, not only one at position 0', () => {
    const label = 'see <<delegate>> now';
    const attrs = edgeLabelAttrs(stereotypeRel(label), font, font, oracleMeasurer);
    // `applyGuillemet`'s own unit tests (edge-label-box.test.ts) prove the
    // rewrite in isolation; this proves the class engine actually calls it
    // on a label whose `<<x>>` is NOT at position 0 -- computed via the
    // SAME measurer + margin arithmetic `edgeLabelAttrs` itself uses, not a
    // hardcoded pixel count (no corpus oracle covers this synthetic label).
    const expectedWidth = Math.trunc(oracleMeasurer.measure('see «delegate» now', font).width + 2 * 1);
    expect(Math.trunc(attrs.labelWidth!)).toBe(expectedWidth);
  });
});

// ---------------------------------------------------------------------------
// fix(label-size-tag-height) -- magic-arrow branch resolves a leading
// <size:N> tag (xamule-03-jeda376: `Book - Foo : <size:30>to Foo >`).
// Jar oracle (test-results/dot-cache/class/xamule-03-jeda376/svek-1.dot):
// WIDTH="91" HEIGHT="32". Arithmetic: "to Foo" at size 30 = 76.6875x30
// (WidthTableMeasurer); arrow block stays at the BASE font, 13x13
// (`TextBlockArrow2.calculateDimension`, `klimt/shape/TextBlockArrow2.java
// :57,87`); mergeLR sums width/maxes height = 89.6875x30; + 2*marginLabel(1)
// = 91.6875x32; width floors to 91 (`SvekEdge.java:504-507`).
// ---------------------------------------------------------------------------

describe('fix(label-size-tag-height) — magic-arrow <size:N> (xamule-03-jeda376)', () => {
  const oracleMeasurer = new DeterministicMeasurer();
  const font = { family: 'sans-serif', size: 13 };

  function magicRel(label: string): Relationship {
    return { from: 'Book', to: 'Foo', type: 'association', label };
  }

  it('<size:30>to Foo > reserves the oracle box 91x32', () => {
    const attrs = edgeLabelAttrs(magicRel('<size:30>to Foo >'), font, font, oracleMeasurer);
    expect(Math.floor(attrs.labelWidth!)).toBe(91);
    expect(Math.floor(attrs.labelHeight!)).toBe(32);
  });

  it('FAILS against pre-fix (tag counted as glyphs, arrow block always base size)', () => {
    // Pre-fix: `measure('<size:30>to Foo', 13).width + 13` (no strip, no
    // size resolution) landed ~104.7 wide, not 91.
    const preFixWidth = oracleMeasurer.measure('<size:30>to Foo', font).width + font.size;
    const attrs = edgeLabelAttrs(magicRel('<size:30>to Foo >'), font, font, oracleMeasurer);
    expect(attrs.labelWidth).not.toBeCloseTo(preFixWidth, 1);
  });

  it('a bare magic-arrow token with no size tag is unaffected — regression guard', () => {
    // `Book -- Foo1 : >` (svek-1.dot WIDTH="13" HEIGHT="13") — bare token
    // skips marginLabel entirely (`withLabelMargin`'s bare-arrow check).
    const attrs = edgeLabelAttrs(magicRel('>'), font, font, oracleMeasurer);
    expect(attrs.labelWidth).toBe(13);
    expect(attrs.labelHeight).toBe(13);
  });

  it('a text-bearing magic-arrow label with no size tag still strips creole markup — regression guard', () => {
    const attrs = edgeLabelAttrs(magicRel('toFoo >'), font, font, oracleMeasurer);
    const textWidth = oracleMeasurer.measure('toFoo', font).width;
    expect(attrs.labelWidth).toBeCloseTo(font.size + textWidth + 2 * 1, 6);
  });
});

// ---------------------------------------------------------------------------
// SI25 D2/D3 -- the DOT reservation and the ink share one font and one walk
// ---------------------------------------------------------------------------

describe('SI25 — guide-line label: DOT box and geo ink agree at the resolved arrow font (D2/D3)', () => {
  const oracleMeasurer = new DeterministicMeasurer();
  const guideRel: Relationship = { from: 'A', to: 'B', type: 'association', label: 'ab >\\ncd <\\n< ef\\n> gh' };

  it.each([13, 20])(
    'at arrow FontSize %i the reserved box width is the geo merged block width + 2*marginLabel',
    (size) => {
      const theme = deepMergeTheme(defaultTheme, { colors: { graph: { arrowFontSize: size } } });
      const font = { family: theme.fontFamily, size };
      // The DOT side: `edgeLabelAttrs` measures via `computeGuideLinesBox`
      // (`class-layout-edge-labels.ts`) then adds `2 * marginLabel` (1 each side).
      const attrs = edgeLabelAttrs(guideRel, font, { family: theme.fontFamily, size: 13 }, oracleMeasurer);
      // The ink side: `buildEdgeGeos` -> `guideLinesAnchor` over `splitGuideLines`.
      const geo = layoutClass(makeAST({ relationships: [guideRel] }), theme, oracleMeasurer);
      const lines = geo.edges[0]!.labelLines!;
      expect(lines).toHaveLength(4);
      const merged = Math.max(...lines.map((l) => l.x + l.width)) - Math.min(...lines.map((l) => l.x - size));
      expect(attrs.labelWidth!).toBeCloseTo(merged + 2, 6);
      expect(attrs.labelHeight!).toBeCloseTo(4 * size + 2, 6);
      // Every line carries a glyph whose slot is `size` wide (text = left + size).
      for (const l of lines) expect(l.glyph).toBeDefined();
    },
  );
});

// ---------------------------------------------------------------------------
// fix(label-size-tag-height) -- `<U+XXXX>` unicode escapes on a relationship
// label decode to their literal glyph, both in the DOT reservation
// (`edgeLabelAttrs`) and in the drawn ink (`buildEdgeGeos`/`attachEdgeLabel`).
// Jar oracle (class/nagega-30-poso418, `!define L_GUILLEMET U+00AB` /
// `R_GUILLEMET U+00BB`, `assocStereotype(x)` -> `<L_GUILLEMET>x<R_GUILLEMET>`):
// `«typedef»` reserves 59x15, `«alias»` reserves 43x15 -- read off this
// repo's own `WidthTableMeasurer` at size 13: "«typedef»" = 57.0375,
// floor(57.0375 + 2*1) = 59; "«alias»" = 41.275, floor(41.275 + 2*1) = 43.
// ---------------------------------------------------------------------------

describe('fix(label-size-tag-height) — <U+XXXX> escape decode (nagega-30-poso418)', () => {
  const oracleMeasurer = new DeterministicMeasurer();
  const font = { family: 'sans-serif', size: 13 };

  function escapeRel(label: string): Relationship {
    return { from: 'A', to: 'B', type: 'association', label };
  }

  it('<U+00AB>typedef<U+00BB> reserves the oracle box 59x15', () => {
    const attrs = edgeLabelAttrs(escapeRel('<U+00AB>typedef<U+00BB>'), font, font, oracleMeasurer);
    expect(Math.floor(attrs.labelWidth!)).toBe(59);
    expect(Math.floor(attrs.labelHeight!)).toBe(15);
  });

  it('<U+00AB>alias<U+00BB> reserves the oracle box 43x15', () => {
    const attrs = edgeLabelAttrs(escapeRel('<U+00AB>alias<U+00BB>'), font, font, oracleMeasurer);
    expect(Math.floor(attrs.labelWidth!)).toBe(43);
    expect(Math.floor(attrs.labelHeight!)).toBe(15);
  });

  it('draws the decoded glyph, not the literal escape text', () => {
    const theme = deepMergeTheme(defaultTheme, {});
    const geo = layoutClass(makeAST({ relationships: [escapeRel('<U+00AB>typedef<U+00BB>')] }), theme, oracleMeasurer);
    expect(geo.edges[0]!.label!.text).toBe('«typedef»');
  });

  it('a magic-arrow label with a trailing escape decodes its remaining text too', () => {
    const attrs = edgeLabelAttrs(escapeRel('<U+00AB>typedef<U+00BB> >'), font, font, oracleMeasurer);
    const textWidth = oracleMeasurer.measure('«typedef»', font).width;
    // Text-bearing magic-arrow labels still take the normal `2 * marginLabel`
    // (only a BARE `<`/`>` token skips it — `withLabelMargin`'s own doc comment).
    expect(attrs.labelWidth).toBeCloseTo(font.size + textWidth + 2, 6);
  });
});
