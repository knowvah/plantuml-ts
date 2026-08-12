/**
 * A2s F-D — class record-node sizing mechanisms (batch 3, fix round 1).
 *
 * Covers, with jar-exact expected numbers (WidthTableMeasurer):
 * - A2: USymbol-bearing descriptive leaves route to the description engine's
 *   EntityImageDescription sizing (GeneralImageBuilder.java:158-166,
 *   :200-202) — givofi-11-xumu978 / cacoma-43-poxu615 / sijisi-94-ripu606.
 * - A7: `skinparam minClassWidth` floors the like-class box width
 *   (EntityImageClass.java:104-106) — novaro-13-socu897.
 * - A9: `<style> classDiagram class header FontSize` overrides the header
 *   font size (EntityImageClassHeader.java:80-100) — momaku-69-duxe918.
 * - B7: `skinparam sameClassWidth` cross-class width floor
 *   (GraphvizImageBuilder.java:366-395 + EntityImageClass.java:108-110) —
 *   dorafa-63-soba922. Theme field is a pending-plumbing structural seam.
 * - A10/B3: groupInheritance shared-tail parent gets EntityImageProtected's
 *   +2*20px on BOTH dims (DotData.java:122-151, GeneralImageBuilder
 *   .java:110-116, EntityImageProtected.java:73-79) — mefike-75-vova900,
 *   zuduxu-90-kosi876. Theme field is the same pending-plumbing seam.
 */
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme, deepMergeTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import type {
  Classifier,
  ClassifierKind,
  ClassDiagramAST,
  Relationship,
} from '../../../src/diagrams/class/ast.js';
import {
  measureClassifier,
  type MeasuredClassifier,
} from '../../../src/diagrams/class/class-layout-helpers.js';
import { tryMeasureDescriptionLeaf } from '../../../src/diagrams/class/class-layout-generic-classifier.js';
import {
  buildDotGraph,
  applySameClassWidthFloor,
  type ThemeGroupInheritance,
  type ThemeSameClassWidth,
} from '../../../src/diagrams/class/class-dot-graph.js';

const measurer = new WidthTableMeasurer();
const SUPPRESS = { fields: false, methods: false };

function classifier(id: string, kind: ClassifierKind, usymbol?: string): Classifier {
  return { id, display: id, kind, typeParams: [], members: [], ...(usymbol !== undefined ? { usymbol } : {}) };
}

function makeAST(overrides?: Partial<ClassDiagramAST>): ClassDiagramAST {
  return { classifiers: [], relationships: [], namespaces: [], directives: [], notes: [], ...overrides };
}

// ---------------------------------------------------------------------------
// A2 — descriptive-leaf routing
// ---------------------------------------------------------------------------

describe('A2 — USymbol descriptive leaves route to EntityImageDescription sizing', () => {
  it('database leaf matches the jar (givofi-11-xumu978: 1.022743x0.597222in = 73.6375x43px)', () => {
    const m = measureClassifier(classifier('dummy2', 'descriptive', 'database'), defaultTheme, measurer, SUPPRESS);
    expect(m.width).toBeCloseTo(73.6375, 3);
    expect(m.height).toBeCloseTo(43, 3);
  });

  it('component leaf matches the jar (cacoma-43-poxu615: 1.138889x0.611111in = 82x44px)', () => {
    const m = measureClassifier(classifier('comp3', 'descriptive', 'component'), defaultTheme, measurer, SUPPRESS);
    expect(m.width).toBeCloseTo(82, 3);
    expect(m.height).toBeCloseTo(44, 3);
  });

  it('rectangle leaf matches the jar (sijisi-94-ripu606 "foo3": 0.655729x0.472222in = 47.2125x34px)', () => {
    const m = measureClassifier(classifier('foo3', 'descriptive', 'rectangle'), defaultTheme, measurer, SUPPRESS);
    expect(m.width).toBeCloseTo(47.2125, 3);
    expect(m.height).toBeCloseTo(34, 3);
  });

  it('keeps a single label row (renderer tryRenderUSymbol reads rows[0].text)', () => {
    const m = measureClassifier(classifier('dummy2', 'descriptive', 'database'), defaultTheme, measurer, SUPPRESS);
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0]!.text).toBe('dummy2');
    expect(m.dividerYs).toEqual([]);
  });

  it('routes package/folder (SI1 T12 un-narrowing — gujigi-63-roki030 jar: 2.388021x0.513889in = 171.9375x37px)', () => {
    const p = tryMeasureDescriptionLeaf(
      classifier('Elektronisk dokument', 'descriptive', 'package'), defaultTheme, measurer, undefined,
    );
    // title = create2/BodyEnhanced1 (129.9375 text + getMarginX()=6 both
    // sides) + USymbolFolder margin [30, 23]; label slot empty (id==display,
    // upstream's empty-desc package branch).
    expect(p).toBeDefined();
    expect(p!.width).toBeCloseTo(171.9375, 3);
    expect(p!.height).toBeCloseTo(37, 3);
    // folder fb jar probe (SI1 T12): fixed 40x15 tab floors a short label —
    // 70x52px = max(40, 11.6375) + 30, 15 + 14 + 23.
    const f = tryMeasureDescriptionLeaf(classifier('fb', 'descriptive', 'folder'), defaultTheme, measurer, undefined);
    expect(f).toBeDefined();
    expect(f!.width).toBeCloseTo(70, 3);
    expect(f!.height).toBeCloseTo(52, 3);
  });

  it('does NOT route actor or member-bearing leaves', () => {
    expect(tryMeasureDescriptionLeaf(classifier('a', 'descriptive', 'actor'), defaultTheme, measurer, undefined)).toBeUndefined();
    const withMember: Classifier = {
      ...classifier('d', 'descriptive', 'database'),
      members: [{ visibility: '+', name: 'x', isStatic: false, isAbstract: false }],
    };
    expect(tryMeasureDescriptionLeaf(withMember, defaultTheme, measurer, undefined)).toBeUndefined();
  });

  it('does NOT route non-descriptive kinds or usymbol-less descriptives', () => {
    expect(tryMeasureDescriptionLeaf(classifier('c', 'class'), defaultTheme, measurer, undefined)).toBeUndefined();
    expect(tryMeasureDescriptionLeaf(classifier('g', 'descriptive'), defaultTheme, measurer, undefined)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// A7 — minClassWidth floor
// ---------------------------------------------------------------------------

describe('A7 — minClassWidth floors the like-class box width', () => {
  const themed: Theme = { ...defaultTheme, minimumWidth: 70 };

  it('floors a narrow class to exactly minClassWidth (novaro-13-socu897: 70px)', () => {
    const m = measureClassifier(classifier('a', 'class'), themed, measurer, SUPPRESS);
    expect(m.width).toBe(70);
  });

  it('leaves a wider-than-floor class untouched', () => {
    const m = measureClassifier(classifier('thisisverylong', 'class'), themed, measurer, SUPPRESS);
    expect(m.width).toBeGreaterThan(70);
  });

  it('does NOT floor non-like-class kinds sharing the generic formula (EntityImageClass only)', () => {
    const m = measureClassifier(classifier('a', 'state'), themed, measurer, SUPPRESS);
    expect(m.width).toBeLessThan(70);
  });

  // B25/M27: `addConvert("MinClassWidth", PName.MinimumWidth)` passes NO SName
  // varargs (`style/FromSkinparamToStyle.java:241`, `addConvert` at `:414-422`),
  // so the empty style signature is a subset of every element's and the value
  // reaches all four boxed class-family images, not just EntityImageClass:
  // EntityImageObject.java:150-153, EntityImageMap.java:127-130 and
  // EntityImageJson.java:127-132 each floor their own `width` with
  // character-identical arithmetic. The name is a historical misnomer.
  it('floors an OBJECT box too (EntityImageObject.java:150-153)', () => {
    const m = measureClassifier(classifier('o1', 'object'), themed, measurer, SUPPRESS);
    expect(m.width).toBe(70);
  });

  it('floors a MAP box too (EntityImageMap.java:127-130)', () => {
    const m = measureClassifier(classifier('m1', 'map'), themed, measurer, SUPPRESS);
    expect(m.width).toBe(70);
  });

  it('floors a JSON box too (EntityImageJson.java:127-132)', () => {
    const m = measureClassifier(classifier('j1', 'json'), themed, measurer, SUPPRESS);
    expect(m.width).toBe(70);
  });

  it('leaves an object wider than the floor untouched', () => {
    const m = measureClassifier(classifier('thisisaverylongobjectname', 'object'), themed, measurer, SUPPRESS);
    expect(m.width).toBeGreaterThan(70);
  });

  it('honours a per-element `<style> object { MinimumWidth }` over the bare global', () => {
    // resolveElementMinimumWidth cascades the element bucket over
    // theme.minimumWidth (theme-element-resolve.ts:143-145).
    const scoped = deepMergeTheme(themed, {
      colors: { elements: { object: { minimumWidth: 120 } } },
    });
    expect(measureClassifier(classifier('o1', 'object'), scoped, measurer, SUPPRESS).width).toBe(120);
    // A sibling kind with no scoped override still falls through to the global.
    expect(measureClassifier(classifier('m1', 'map'), scoped, measurer, SUPPRESS).width).toBe(70);
  });
});

// ---------------------------------------------------------------------------
// A9 — <style> class header FontSize
// ---------------------------------------------------------------------------

describe('A9 — elements.class.headerFontSize overrides the header font size', () => {
  it('widens the header by w(name@20) - w(name@14) exactly (momaku-69-duxe918: 6.675px)', () => {
    const base = measureClassifier(classifier('o1', 'class'), defaultTheme, measurer, SUPPRESS).width;
    const themed = deepMergeTheme(defaultTheme, {
      colors: { elements: { class: { headerFontSize: 20 } } },
    });
    const styled = measureClassifier(classifier('o1', 'class'), themed, measurer, SUPPRESS).width;
    const expected =
      measurer.measure('o1', { family: defaultTheme.fontFamily, size: 20 }).width -
      measurer.measure('o1', { family: defaultTheme.fontFamily, size: 14 }).width;
    expect(styled - base).toBeCloseTo(expected, 3);
    expect(expected).toBeCloseTo(6.675, 3);
  });
});

// ---------------------------------------------------------------------------
// B7 — sameClassWidth cross-class floor
// ---------------------------------------------------------------------------

describe('B7 — sameClassWidth floors every like-class width to the max', () => {
  function measuredMapFor(classifiers: readonly Classifier[]): Map<string, MeasuredClassifier> {
    const map = new Map<string, MeasuredClassifier>();
    for (const c of classifiers) map.set(c.id, measureClassifier(c, defaultTheme, measurer, SUPPRESS));
    return map;
  }

  it('floors the narrow class to the widest like-class width (dorafa-63-soba922: both 1.623264in)', () => {
    const cs = [classifier('a', 'class'), classifier('thisisverylong', 'class')];
    const map = measuredMapFor(cs);
    const wide = map.get('thisisverylong')!.width;
    const theme = { ...defaultTheme, sameClassWidth: true } as Theme & ThemeSameClassWidth;
    applySameClassWidthFloor(cs, map, theme);
    expect(map.get('a')!.width).toBe(wide);
    // dorafa-63 jar: both nodes 1.623264in = 116.875px.
    expect(wide).toBeCloseTo(116.875, 3);
  });

  it('is a no-op without the skinparam, and never touches non-like-class kinds', () => {
    const cs = [classifier('a', 'class'), classifier('thisisverylong', 'class'), classifier('s', 'state')];
    const map = measuredMapFor(cs);
    const before = map.get('a')!.width;
    applySameClassWidthFloor(cs, map, defaultTheme);
    expect(map.get('a')!.width).toBe(before);
    const theme = { ...defaultTheme, sameClassWidth: true } as Theme & ThemeSameClassWidth;
    const stateBefore = map.get('s')!.width;
    applySameClassWidthFloor(cs, map, theme);
    expect(map.get('s')!.width).toBe(stateBefore);
  });
});

// ---------------------------------------------------------------------------
// A10/B3 — groupInheritance protected parent (+2*20px both dims)
// ---------------------------------------------------------------------------

describe('A10/B3 — groupInheritance shared-tail parent gets +40px on both dims', () => {
  function extendsRel(parent: string, child: string): Relationship {
    return {
      from: child, to: parent, type: 'extension',
      idEntity1: parent, idEntity2: child, idEntity1FullId: parent, idEntity2FullId: child,
      idEntity1Decor: 'triangle', idEntity2Decor: 'none',
    };
  }

  function layoutNodes(ast: ClassDiagramAST, theme: Theme) {
    const map = new Map<string, MeasuredClassifier>();
    for (const c of ast.classifiers) map.set(c.id, measureClassifier(c, theme, measurer, SUPPRESS));
    const { dotGraph } = buildDotGraph(ast, map, theme, measurer);
    return { map, nodes: new Map(dotGraph.nodes.map((n) => [n.id, n])) };
  }

  const A3_AST = makeAST({
    classifiers: ['A3', 'B3', 'C3', 'D3'].map((id) => classifier(id, 'class')),
    relationships: [extendsRel('A3', 'B3'), extendsRel('A3', 'C3'), extendsRel('A3', 'D3')],
  });

  it('inflates the shared tail by exactly 2*20px on BOTH dims when count >= limit (mefike-75: +0.555555in)', () => {
    const theme = { ...defaultTheme, groupInheritance: 3 } as Theme & ThemeGroupInheritance;
    const { map, nodes } = layoutNodes(A3_AST, theme);
    expect(nodes.get('A3')!.width).toBeCloseTo(map.get('A3')!.width + 40, 6);
    expect(nodes.get('A3')!.height).toBeCloseTo(map.get('A3')!.height + 40, 6);
    // Children stay un-inflated.
    expect(nodes.get('B3')!.width).toBeCloseTo(map.get('B3')!.width, 6);
  });

  it('does nothing below the limit, and the limit is unset/<=1 -> never fires (SkinParam.java:1041-1044)', () => {
    const under = { ...defaultTheme, groupInheritance: 4 } as Theme & ThemeGroupInheritance;
    expect(layoutNodes(A3_AST, under).nodes.get('A3')!.width)
      .toBeCloseTo(layoutNodes(A3_AST, defaultTheme).map.get('A3')!.width, 6);
    const degenerate = { ...defaultTheme, groupInheritance: 1 } as Theme & ThemeGroupInheritance;
    expect(layoutNodes(A3_AST, degenerate).nodes.get('A3')!.width)
      .toBeCloseTo(layoutNodes(A3_AST, defaultTheme).map.get('A3')!.width, 6);
  });

  it('duplicate extends-links each count (zuduxu-90: two `class B extends A` at limit 2 protect A)', () => {
    const ast = makeAST({
      classifiers: [classifier('A', 'class'), classifier('B', 'class')],
      relationships: [extendsRel('A', 'B'), extendsRel('A', 'B')],
    });
    const theme = { ...defaultTheme, groupInheritance: 2 } as Theme & ThemeGroupInheritance;
    const { map, nodes } = layoutNodes(ast, theme);
    expect(nodes.get('A')!.width).toBeCloseTo(map.get('A')!.width + 40, 6);
  });

  it('ignores links whose entity1-side decor is not the triangle (upstream: `B --|> A` never counts)', () => {
    const reversed: Relationship = {
      from: 'B', to: 'A', type: 'extension',
      idEntity1: 'B', idEntity2: 'A', idEntity1FullId: 'B', idEntity2FullId: 'A',
      idEntity1Decor: 'none', idEntity2Decor: 'triangle',
    };
    const ast = makeAST({
      classifiers: [classifier('A', 'class'), classifier('B', 'class')],
      relationships: [reversed, reversed],
    });
    const theme = { ...defaultTheme, groupInheritance: 2 } as Theme & ThemeGroupInheritance;
    const { map, nodes } = layoutNodes(ast, theme);
    expect(nodes.get('A')!.width).toBeCloseTo(map.get('A')!.width, 6);
    expect(nodes.get('B')!.width).toBeCloseTo(map.get('B')!.width, 6);
  });
});
