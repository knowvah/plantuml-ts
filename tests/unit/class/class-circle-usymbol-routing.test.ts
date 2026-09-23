/**
 * cdd-T22 (E8, cacoma-43-poxu615) — pins `class-layout-leaf-shapes.ts
 * #measureCircleInterface`'s sizing and `renderer-usymbol-entity.ts
 * #usesClassUSymbolEntity`/`#renderClassUSymbolEntity`'s widened dispatch
 * (usecase/actor plus this task's `circle` and `descriptive`+`component`
 * additions), mirroring `class-usecase-actor-routing.test.ts`'s (SI10)
 * established "hand-built literal + real-run pinned numbers" pattern for
 * this same sizing/render pair.
 *
 * Mechanism under test: `() "Name"`/`circle X` (`LeafType.CIRCLE`) routes
 * to `EntityImageDescription` with `USymbols.INTERFACE`
 * (`svek/GeneralImageBuilder.java:157-158`, `abel/Entity.java:415`), a
 * fixed 18x18 box (`INTERFACE_CIRCLE_SIZE`) regardless of label, plus a
 * label drawn BELOW it — not the generic name+members classifier box.
 */
import { describe, it, expect } from 'vitest';
import { measureCircleInterface } from '../../../src/diagrams/class/class-layout-leaf-shapes.js';
import {
  usesClassUSymbolEntity,
  renderClassUSymbolEntity,
} from '../../../src/diagrams/class/renderer-usymbol-entity.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/class-geo-types.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';

const measurer = new WidthTableMeasurer();

describe('measureCircleInterface (cdd-T22, E8)', () => {
  it('sizes a circle leaf as the fixed 18x18 interface-eye box, independent of label length', () => {
    const short: Classifier = { id: 'c', display: 'A2', kind: 'circle', typeParams: [], members: [] };
    const long: Classifier = {
      id: 'c2',
      display: 'Does work now',
      kind: 'circle',
      typeParams: [],
      members: [],
    };
    const shortMeasured = measureCircleInterface(short, defaultTheme, measurer);
    const longMeasured = measureCircleInterface(long, defaultTheme, measurer);

    // Fixed regardless of content -- `EntityImageDescription.java:137`'s
    // `hideText` branch measures the bare `CircleInterface2` square only
    // (`leaf-sizing-consts.ts#INTERFACE_CIRCLE_SIZE`).
    expect(shortMeasured.width).toBe(18);
    expect(shortMeasured.height).toBe(18);
    expect(longMeasured.width).toBe(18);
    expect(longMeasured.height).toBe(18);

    // The class-specific `MeasuredClassifier` composition -- one row at
    // y = height/2, no dividers, mirroring `measureUsecaseOrActor`'s own
    // row shape (unconsumed on the real draw path, see that function's doc).
    expect(shortMeasured.rows).toEqual([{ text: 'A2', y: 9, indent: 0, italic: false }]);
    expect(shortMeasured.dividerYs).toEqual([]);
  });

  it('computes a real LimitFinder ink extent that reaches BELOW the 18x18 box (the hidden label)', () => {
    // Literal numbers captured from a real run (jiti probe, 2026-09-22) --
    // a real `EntityImageDescription.drawU` walk over `symbol: 'circle'`,
    // NOT hand-derived (`CircleInterface2`'s drawn top sits at `y + 0.5`,
    // per `measureCircleInterfaceInk`'s own doc comment).
    const classifier: Classifier = {
      id: 'c',
      display: 'Does work now',
      kind: 'circle',
      typeParams: [],
      members: [],
    };
    const measured = measureCircleInterface(classifier, defaultTheme, measurer);
    expect(measured.symbolInk).toBeDefined();
    const ink = measured.symbolInk!;
    // The icon itself is 18 tall; the label pushes the ink well past it --
    // proves the ink is NOT just the bare box (which `addEllipseInk` alone
    // would give as maxY <= 17).
    expect(ink.maxY).toBeGreaterThan(18);
    expect(ink.minY).toBeGreaterThanOrEqual(0);
    // The label overhangs the narrow 18px icon on both sides for a display
    // this long -- minX negative, maxX past the icon's own right edge.
    expect(ink.minX).toBeLessThan(0);
    expect(ink.maxX).toBeGreaterThan(18);
  });
});

describe('usesClassUSymbolEntity dispatch (cdd-T22 widened gate)', () => {
  const base = { x: 0, y: 0, width: 10, height: 10, dividerYs: [], rows: [] } satisfies Partial<ClassifierGeo>;

  it('routes usecase, circle, descriptive+actor, descriptive+component and descriptive+database', () => {
    expect(usesClassUSymbolEntity({ ...base, id: 'u', kind: 'usecase' })).toBe(true);
    expect(usesClassUSymbolEntity({ ...base, id: 'c', kind: 'circle' })).toBe(true);
    expect(usesClassUSymbolEntity({ ...base, id: 'a', kind: 'descriptive', usymbol: 'actor' })).toBe(true);
    expect(usesClassUSymbolEntity({ ...base, id: 'k', kind: 'descriptive', usymbol: 'component' })).toBe(true);
    // cdd-B7FU-R3 (`daxeno-00-kasu166`): `database` now routes here too --
    // `core/usymbol-shapes.ts#renderDatabaseIcon`'s hand-rolled single
    // middle-anchored `<text>` has no creole/multi-line support, where
    // `USymbolDatabase#asSmall` (already ported) draws a real
    // `TextBlockUtils.mergeTB` block.
    expect(usesClassUSymbolEntity({ ...base, id: 'd', kind: 'descriptive', usymbol: 'database' })).toBe(true);
  });

  it('does NOT route an ordinary classifier or an unrelated descriptive usymbol (e.g. rectangle)', () => {
    expect(usesClassUSymbolEntity({ ...base, id: 'x', kind: 'class' })).toBe(false);
    expect(usesClassUSymbolEntity({ ...base, id: 'r', kind: 'descriptive', usymbol: 'rectangle' })).toBe(false);
  });
});

describe('renderClassUSymbolEntity draws circle and component through the faithful EntityImageDescription path', () => {
  it('draws a circle as an 8px-radius ellipse plus a label below it (E8)', () => {
    const geo: ClassifierGeo = {
      id: 'c1',
      kind: 'circle',
      x: 10,
      y: 20,
      width: 18,
      height: 18,
      dividerYs: [],
      rows: [{ text: 'Foo', y: 9, indent: 0 }],
    };
    const fragment = renderClassUSymbolEntity(geo, defaultTheme, measurer, undefined, 'U1');
    // Literal output captured from a real run (jiti probe, 2026-09-22).
    expect(fragment.body).toBe(
      '<!--entity c1--><g class="entity" data-qualified-name="c1" id="U1">' +
        '<ellipse cx="19" cy="29" rx="8" ry="8" fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/>' +
        '<text x="6.925" y="56.889" fill="#000" font-size="14" textLength="24.15">Foo</text></g>',
    );
  });

  it('draws a component with the UML2 notch icon and the jar rx="2.5" rounded corner (cacoma-43-poxu615)', () => {
    const geo: ClassifierGeo = {
      id: 'c2',
      kind: 'descriptive',
      usymbol: 'component',
      x: 0,
      y: 0,
      width: 82,
      height: 44,
      dividerYs: [],
      rows: [{ text: 'comp3', y: 20, indent: 0 }],
    };
    const fragment = renderClassUSymbolEntity(geo, defaultTheme, measurer, undefined, 'U2');
    // ENTITY_ROUND_CORNER (5.0) halves at serialization -> jar's own
    // `rect/@rx="2.5"` (`driver-rectangle-svg.ts`'s `rx/2` convention).
    expect(fragment.body).toContain('rx="2.5" ry="2.5"');
    // The UML2 notch: outer box + two small plug rectangles (4 rects total).
    expect((fragment.body.match(/<rect/g) ?? []).length).toBe(4);
    expect(fragment.body).toContain('stroke-width:0.5');
  });
});
