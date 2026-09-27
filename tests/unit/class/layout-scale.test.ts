/**
 * Unit tests for `layoutClass`'s `scale ...` wiring (cdd-T29, D4) — the
 * AST-capture-to-resolved-factor path `class-command-directives.ts` (parse)
 * and `layout.ts#layoutClass` (resolve + apply) implement together. See
 * `class-scale-geo.test.ts` for the pure scaling-function unit tests and
 * `.agent-notes/cdd-T29.md` for the fixture-level before/after readings.
 */
import { describe, it, expect } from 'vitest';
import { layoutClass, classifierLeaves } from '../../../src/diagrams/class/layout.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';
import type { ClassGeometry } from '../../../src/diagrams/class/class-geo-types.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import {
  CUCA_DOCUMENT_MARGIN_TOP,
  CUCA_DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT,
} from '../../../src/core/atmp/CucaDiagram.js';

const measurer = new FormulaMeasurer();

function makeAST(overrides?: Partial<ClassDiagramAST>): ClassDiagramAST {
  return {
    classifiers: [{ id: 'Foo1', display: 'Foo1', kind: 'class', typeParams: [], members: [] }],
    relationships: [],
    namespaces: [],
    directives: [],
    notes: [],
    ...overrides,
  };
}

/**
 * cdd3-T34 (C-10): the FRACTIONAL, pre-`SvgGraphics#ensureVisible` document
 * dimension `resolveClassScaleFactor` resolves `scale ...` against --
 * see that function's own doc comment. `scale max N width`/`scale N
 * width` MUST be expressed against THIS basis, not `geo.totalWidth`
 * (already-truncated): the two differ by up to 1px, which the pre-T34
 * tests below conflated.
 */
function preDims(geo: ClassGeometry): { width: number; height: number } {
  return {
    width: geo.rawWidth! + CUCA_DOCUMENT_MARGIN_LEFT + CUCA_DOCUMENT_MARGIN_RIGHT,
    height: geo.rawHeight! + CUCA_DOCUMENT_MARGIN_TOP + CUCA_DOCUMENT_MARGIN_BOTTOM,
  };
}

describe('layoutClass — no scale directive (identity)', () => {
  it('resolves without error when ast.scale is absent', () => {
    const result = layoutClass(makeAST(), defaultTheme, measurer);
    expect(result.totalWidth).toBeGreaterThan(0);
  });
});

describe('layoutClass — scale simple factor', () => {
  it('multiplies totalWidth/totalHeight by the resolved factor', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const scaled = layoutClass(makeAST({ scale: { kind: 'simple', factor: 0.5 } }), defaultTheme, measurer);
    expect(scaled.totalWidth).toBeCloseTo(unscaled.totalWidth * 0.5);
    expect(scaled.totalHeight).toBeCloseTo(unscaled.totalHeight * 0.5);
  });

  it('multiplies classifier geometry by the resolved factor', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const scaled = layoutClass(makeAST({ scale: { kind: 'simple', factor: 2 } }), defaultTheme, measurer);
    const [unscaledLeaf] = classifierLeaves(unscaled.leaves);
    const [scaledLeaf] = classifierLeaves(scaled.leaves);
    expect(scaledLeaf!.width).toBeCloseTo(unscaledLeaf!.width * 2);
    expect(scaledLeaf!.height).toBeCloseTo(unscaledLeaf!.height * 2);
    expect(scaledLeaf!.rows[0]!.y).toBeCloseTo(unscaledLeaf!.rows[0]!.y * 2);
  });

  it('clamps a factor above 4 to 4 (ScaleProtected#getScale)', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const scaled = layoutClass(makeAST({ scale: { kind: 'simple', factor: 10 } }), defaultTheme, measurer);
    expect(scaled.totalWidth).toBeCloseTo(unscaled.totalWidth * 4);
  });
});

describe('layoutClass — scale max width/height forms', () => {
  it('resolves `scale max N width` against the FRACTIONAL pre-truncation document width (C-10)', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const { width: pre } = preDims(unscaled);
    const target = pre / 2;
    const scaled = layoutClass(makeAST({ scale: { kind: 'maxWidth', target } }), defaultTheme, measurer);
    expect(scaled.scaleK).toBeCloseTo(0.5);
    expect(scaled.totalWidth).toBeCloseTo(unscaled.totalWidth * 0.5);
  });

  it('resolves `scale max N height` against the FRACTIONAL pre-truncation document height (C-10)', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const { height: pre } = preDims(unscaled);
    const target = pre / 2;
    const scaled = layoutClass(makeAST({ scale: { kind: 'maxHeight', target } }), defaultTheme, measurer);
    expect(scaled.scaleK).toBeCloseTo(0.5);
    expect(scaled.totalHeight).toBeCloseTo(unscaled.totalHeight * 0.5);
  });

  it('leaves the diagram unscaled when the max target already exceeds the document', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const scaled = layoutClass(
      makeAST({ scale: { kind: 'maxWidth', target: unscaled.totalWidth * 10 } }),
      defaultTheme,
      measurer,
    );
    expect(scaled.totalWidth).toBeCloseTo(unscaled.totalWidth);
  });
});

describe('layoutClass — scale width/height single-dimension forms', () => {
  it('resolves `scale N width` against the FRACTIONAL pre-truncation document width (C-10)', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const { width: pre } = preDims(unscaled);
    const target = pre * 3;
    const scaled = layoutClass(makeAST({ scale: { kind: 'width', target } }), defaultTheme, measurer);
    expect(scaled.scaleK).toBeCloseTo(3);
    expect(scaled.totalWidth).toBeCloseTo(unscaled.totalWidth * 3);
  });
});
