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
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';

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
  it('resolves `scale max N width` against the FINAL unscaled document width', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const target = unscaled.totalWidth / 2;
    const scaled = layoutClass(makeAST({ scale: { kind: 'maxWidth', target } }), defaultTheme, measurer);
    expect(scaled.totalWidth).toBeCloseTo(target);
  });

  it('resolves `scale max N height` against the FINAL unscaled document height', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const target = unscaled.totalHeight / 2;
    const scaled = layoutClass(makeAST({ scale: { kind: 'maxHeight', target } }), defaultTheme, measurer);
    expect(scaled.totalHeight).toBeCloseTo(target);
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
  it('resolves `scale N width` against the FINAL unscaled document width', () => {
    const unscaled = layoutClass(makeAST(), defaultTheme, measurer);
    const target = unscaled.totalWidth * 3;
    const scaled = layoutClass(makeAST({ scale: { kind: 'width', target } }), defaultTheme, measurer);
    expect(scaled.totalWidth).toBeCloseTo(target);
  });
});
