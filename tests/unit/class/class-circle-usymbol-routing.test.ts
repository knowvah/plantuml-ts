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
import { defaultTheme, deepMergeTheme } from '../../../src/core/theme.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import { scaleClassTheme } from '../../../src/diagrams/class/class-scale-geo.js';

const theme = scaleClassTheme(defaultTheme, 1);

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

  it('routes usecase, circle, descriptive+actor, descriptive+component, descriptive+database and descriptive+rectangle', () => {
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
    // cdd3-T12 (sijisi-94-ripu606): `rectangle` now routes here too -- a
    // plain `rectangle "foo3"` leaf resolves to `USymbols.RECTANGLE`
    // (`USymbolRectangle.java`) exactly like `component` resolves to
    // `USymbols.COMPONENT2`; pre-T12 it fell through to the generic
    // classifier box (`renderClassifierBox`), drawing a members-badge no
    // rectangle leaf carries.
    expect(usesClassUSymbolEntity({ ...base, id: 'r', kind: 'descriptive', usymbol: 'rectangle' })).toBe(true);
  });

  it('does NOT route an ordinary classifier', () => {
    expect(usesClassUSymbolEntity({ ...base, id: 'x', kind: 'class' })).toBe(false);
  });

  // cdd5-T3b (`desc-leaf-classbox-fallback` = S2 `descriptive-usymbol-
  // render-allowlist`): upstream's `GeneralImageBuilder.java:160-167` sends
  // EVERY `LeafType.DESCRIPTION` leaf to `EntityImageDescription`
  // unconditionally -- no per-USymbol allowlist. Widened from the 6-symbol
  // hand-picked list to every remaining descriptive usymbol.
  it('routes every remaining descriptive usymbol (widened dispatch)', () => {
    for (const usymbol of [
      'file',
      'card',
      'entity',
      'circle',
      'folder',
      'frame',
      'cloud',
      'queue',
      'stack',
      'storage',
      'agent',
      'boundary',
      'control',
      'person',
      'artifact',
      'label',
      'collections',
      'action',
      'process',
    ]) {
      expect(usesClassUSymbolEntity({ ...base, id: `w-${usymbol}`, kind: 'descriptive', usymbol })).toBe(true);
    }
  });

  // cdd5-T3b: a business-variant leaf (`actor/ Foo [ ... ]`,
  // `fepulu-27-soci473`) keeps its raw `actor/` keyword in `usymbol`
  // (`class-declaration-parser.ts#resolveDeclKind`'s `usymbol: rawKind`)
  // -- also routed by the widened gate.
  it('routes a raw business-variant keyword (actor/, usecase/)', () => {
    expect(usesClassUSymbolEntity({ ...base, id: 'ab', kind: 'descriptive', usymbol: 'actor/' })).toBe(true);
  });

  // `port`/`portin`/`portout` (`class-portin-unported`, S3, out of this
  // task's write-set) stay excluded -- widening the gate must not silently
  // reroute this unrelated bug into a NEW wrong draw path.
  it('does NOT route port/portin/portout', () => {
    expect(usesClassUSymbolEntity({ ...base, id: 'p1', kind: 'descriptive', usymbol: 'port' })).toBe(false);
    expect(usesClassUSymbolEntity({ ...base, id: 'p2', kind: 'descriptive', usymbol: 'portin' })).toBe(false);
    expect(usesClassUSymbolEntity({ ...base, id: 'p3', kind: 'descriptive', usymbol: 'portout' })).toBe(false);
  });

  // cdd5-T3b (`xagomi-49-caki729`): `hexagon` IS routed -- see
  // `buildUSymbolEntityParams`'s `hexagonPolygon: null` doc comment for why
  // drawing the label with no polygon outline is the faithful state, not a
  // regression from the pre-fix wrong class box.
  it('routes hexagon', () => {
    expect(usesClassUSymbolEntity({ ...base, id: 'h1', kind: 'descriptive', usymbol: 'hexagon' })).toBe(true);
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
    const fragment = renderClassUSymbolEntity(geo, theme, measurer, undefined, 'U1');
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
    const fragment = renderClassUSymbolEntity(geo, theme, measurer, undefined, 'U2');
    // ENTITY_ROUND_CORNER (5.0) halves at serialization -> jar's own
    // `rect/@rx="2.5"` (`driver-rectangle-svg.ts`'s `rx/2` convention).
    expect(fragment.body).toContain('rx="2.5" ry="2.5"');
    // The UML2 notch: outer box + two small plug rectangles (4 rects total).
    expect((fragment.body.match(/<rect/g) ?? []).length).toBe(4);
    expect(fragment.body).toContain('stroke-width:0.5');
  });

  it('draws a rectangle leaf as a plain rounded box, no badge/members (cdd3-T12, sijisi-94-ripu606)', () => {
    const geo: ClassifierGeo = {
      id: 'r1',
      kind: 'descriptive',
      usymbol: 'rectangle',
      x: 0,
      y: 0,
      width: 47.213,
      height: 34,
      dividerYs: [],
      rows: [{ text: 'foo3', y: 20, indent: 0 }],
    };
    const fragment = renderClassUSymbolEntity(geo, theme, measurer, undefined, 'U3');
    // Literal output captured from a real run (jiti probe, 2026-09-25) --
    // matches sijisi-94-ripu606's golden `foo3` leaf: a single plain rect
    // (no visibility-icon ellipse, no members divider) at the jar's own
    // `rx="2.5"` (ELEMENT_ROUND_CORNER, `USymbolRectangle.java:65-71`
    // reads `SymbolContext#getRoundCorner()`) with a LEFT-anchored label
    // (`titleAlignmentFor`: only `usecase` gets CENTER).
    expect(fragment.body).toBe(
      '<!--entity r1--><g class="entity" data-qualified-name="r1" id="U3">' +
        '<rect x="0" y="0" width="47.213" height="34" fill="#F1F1F1" ' +
        'style="stroke:#181818;stroke-width:0.5;" rx="2.5" ry="2.5"/>' +
        '<text x="10" y="20.889" fill="#000" font-size="14" textLength="27.213">foo3</text></g>',
    );
    expect((fragment.body.match(/<rect/g) ?? []).length).toBe(1);
    expect(fragment.body).not.toContain('<ellipse');
  });

  // cdd5-T3b (`desc-leaf-classbox-fallback`, `felixe-38-dilu011`/`gogisu-39-
  // bepa573`/etc.): a `file`/`card`/`entity`/... leaf, previously outside
  // the allowlist, now draws its OWN USymbol shape (a `<path>` file-fold
  // outline here) instead of the generic class box's `<rect>` + `C` badge.
  it('draws a file leaf via its own USymbol path, not a class-box rect', () => {
    const geo: ClassifierGeo = {
      id: 'f1',
      kind: 'descriptive',
      usymbol: 'file',
      x: 0,
      y: 0,
      width: 60,
      height: 40,
      dividerYs: [],
      rows: [{ text: 'f1', y: 20, indent: 0 }],
    };
    const fragment = renderClassUSymbolEntity(geo, theme, measurer, undefined, 'U4');
    expect(fragment.body).toContain('<path');
    // No class-box badge ellipse and no plain full-box rect (a file leaf's
    // own small notch rects are fine; asserting the DISPATCH landed here,
    // not on `renderClassifierBox`, matches this task's own diagnosis
    // evidence for these rows: `ours=rect jar=path`).
    expect(fragment.body).not.toContain('fill="#ADD1B2"'); // the class kind badge fill
  });

  // cdd5-T3b (`xagomi-49-caki729`): a hexagon leaf draws ONLY its label
  // text -- no hexagon outline (`hexagonPolygon: null`, no throw) and no
  // class-box rect/badge -- matching the jar's own draw for this fixture
  // (`!pragma layout smetana`, Smetana's node has no stored polygon).
  it('draws a hexagon leaf as bare label text, no throw, no class box', () => {
    const geo: ClassifierGeo = {
      id: 'h1',
      kind: 'descriptive',
      usymbol: 'hexagon',
      x: 0,
      y: 0,
      width: 60,
      height: 40,
      dividerYs: [],
      rows: [{ text: 'combinatorial', y: 20, indent: 0 }],
    };
    expect(() => renderClassUSymbolEntity(geo, theme, measurer, undefined, 'U8')).not.toThrow();
    const fragment = renderClassUSymbolEntity(geo, theme, measurer, undefined, 'U8');
    expect(fragment.body).toContain('<text');
    expect(fragment.body).not.toContain('<rect');
    expect(fragment.body).not.toContain('<ellipse');
    expect(fragment.body).not.toContain('<polygon');
  });

  // cdd5-T3b (`usymbol-leaf-entity-color-dropped`, `jimizu-14-zole306`):
  // the leaf's own inline `#White` BACK colour now reaches `backcolor`
  // instead of the theme default (`#F1F1F1`).
  it('threads the classifier own inline BACK color into backcolor', () => {
    const withoutGeo: ClassifierGeo = {
      id: 'e1',
      kind: 'descriptive',
      usymbol: 'entity',
      x: 0,
      y: 0,
      width: 60,
      height: 40,
      dividerYs: [],
      rows: [{ text: 'e1', y: 20, indent: 0 }],
    };
    const withOverride = renderClassUSymbolEntity(
      { ...withoutGeo, color: '#White' },
      theme,
      measurer,
      undefined,
      'U5',
    );
    const without = renderClassUSymbolEntity(withoutGeo, theme, measurer, undefined, 'U6');
    // The override must actually change the emitted fill -- not merely be
    // present syntactically (assertion-quality: compares the two runs).
    expect(withOverride.body).not.toBe(without.body.replace(/U6/g, 'U5'));
    expect(without.body).toContain('#F1F1F1');
    expect(withOverride.body).not.toContain('#F1F1F1');
  });

  // cdd5-T3b (`fepulu-27-soci473`): a business-variant leaf's raw `actor/`
  // keyword must normalize to the canonical `USymbol` bucket
  // (`actor-business`) BEFORE it feeds `resolveElementPaint`'s per-element
  // theme lookup (`theme.colors.elements[sname]`) -- the pre-fix raw cast
  // fed the literal `'actor/'` string as the lookup key, which never
  // matches a `<style> actor.business { ... }`/`skinparam actorBackground
  // Business:...`-shaped override keyed `actor-business`.
  it('normalizes a raw actor/ keyword through KEYWORD_TO_SYMBOL for theme lookup (business variant)', () => {
    const businessThemed = deepMergeTheme(defaultTheme, {
      colors: { elements: { 'actor-business': { background: '#123456' } } },
    });
    const scaled = scaleClassTheme(businessThemed, 1);
    const geo: ClassifierGeo = {
      id: 'ab1',
      kind: 'descriptive',
      usymbol: 'actor/',
      x: 0,
      y: 0,
      width: 30,
      height: 50,
      dividerYs: [],
      rows: [{ text: 'ab1', y: 9, indent: 0 }],
    };
    const fragment = renderClassUSymbolEntity(geo, scaled, measurer, undefined, 'U7');
    // Only reachable if `resolveSymbolKeyword` resolved the canonical
    // `actor-business` bucket -- the raw `'actor/'` string matches no key
    // in `theme.colors.elements`, so a pre-fix run falls through to the
    // root default and never emits this color at all.
    expect(fragment.body).toContain('#123456');
  });
});
