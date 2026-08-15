/**
 * `layout-ink-extent.ts#computeClassDocumentDims` — G2 N5.
 *
 * Jar-verified formula (see the module's own doc comment + `plans/
 * g2-class-svg/ledger.md` N5 for the full derivation, including the
 * debug-instrumented local oracle build trace): ink-extent walk +
 * `.delta(15,15)` + `CucaDiagram` margin (0,5,5,0) + `SvgGraphics
 * #ensureVisible`'s truncating `(int)(v+1)`. The classifier-box ink rule is
 * NOT the classic symmetric `-1`-inset `URectangle` rule — `EntityImageClass`
 * ALSO draws an invisible full-box `UEmpty` reservation that dominates the
 * rect's own max corner by 1px (see `addRectInk`'s own doc comment).
 */
import { describe, it, expect } from 'vitest';
import {
  computeClassDocumentDims,
  computeClassInkShift,
  computeClassBorderRectDims,
  computeClassRawInkDims,
} from '../../../src/diagrams/class/layout-ink-extent.js';
import type { ClassifierGeo, EdgeGeo, NamespaceGeo } from '../../../src/diagrams/class/layout.js';
import type { NoteGeo } from '../../../src/diagrams/class/note-layout.js';

function makeClassifierGeo(overrides?: Partial<ClassifierGeo>): ClassifierGeo {
  return {
    id: 'C',
    kind: 'class',
    x: 0,
    y: 0,
    width: 59.2125,
    height: 48,
    dividerYs: [],
    rows: [],
    ...overrides,
  };
}

describe('computeClassDocumentDims', () => {
  it('returns {width:0, height:0} for an empty diagram (no ink at all)', () => {
    const dims = computeClassDocumentDims([], [], [], []);
    expect(dims).toEqual({ width: 0, height: 0 });
  });

  it('reproduces jar-verified dims for two side-by-side classifiers, no edges (jalexi-21-xoje231)', () => {
    // Jar: `<rect x="7" y="7" width="59.2125" height="48"/>` twice, second at
    // x="101" -- raw (pre-render-anchor) positions are x=0 and x=94 (this
    // port's own +7,+7 render-time anchor is translation-invariant to the
    // dimension math). Jar's real output: width="175px" height="70px".
    const classifiers = [
      makeClassifierGeo({ id: 'foo1', x: 0, y: 0 }),
      makeClassifierGeo({ id: 'foo2', x: 94, y: 0 }),
    ];
    const dims = computeClassDocumentDims(classifiers, [], [], []);
    expect(dims).toEqual({ width: 175, height: 70 });
  });

  it('reproduces jar-verified dims for a vertically stacked pair with a straight edge (bipudo-23-xavu432, single edge slice)', () => {
    // Jar's real output for the full 4-classifier fixture is 155x178; this
    // is the isolated 2-classifier vertical slice (A0 above B0) with no
    // horizontal siblings, jar-verified independently via the same
    // debug-instrumented-oracle method (ledger.md N5).
    const classifiers = [
      makeClassifierGeo({ id: 'A0', x: 0, y: 0, width: 49.15 }),
      makeClassifierGeo({ id: 'B0', x: 0, y: 108, width: 49.15 }),
    ];
    const dims = computeClassDocumentDims(classifiers, [], [], []);
    // Nominal span: x in [0, 49.15], y in [0, 156]. Ink: min corner -1 on
    // each axis, max corner un-inset (the `UEmpty`-reservation dominance) --
    // width = (49.15+1)+15+5+1 floored = 71.15 -> 71; height =
    // (156+1)+15+5+1 floored = 178.
    expect(dims.height).toBe(178);
    expect(dims.width).toBe(71);
  });

  it('a namespace cluster contributes its own bbox with NO `-1` inset (UPath ink rule)', () => {
    const namespaces: NamespaceGeo[] = [
      { id: 'ns', x: 6, y: 6, width: 117.15, height: 113, label: 'p1', wtitle: 25, htitle: 20, baselineOffset: 12.8889 },
    ];
    const dims = computeClassDocumentDims([], namespaces, [], []);
    // Ink span: x in [6, 123.15], y in [6, 119] (no -1 quirk for UPath).
    // width = (117.15)+15+5+1 floored = 138.15 -> 138;
    // height = (113)+15+5+1 floored = 134.
    expect(dims.width).toBe(138);
    expect(dims.height).toBe(134);
  });

  it('item 42 (G2 N60): inkShape "polygon" (strictuml FOLDER) pads x by ' +
    'HACK_X_FOR_POLYGON=10 on both sides, y unpadded -- jar-verified against ' +
    'jinibe-02-tebi269\'s real LimitFinder walk (raw cluster bbox [16,64] -> ' +
    'ink [6,74])', () => {
    const namespaces: NamespaceGeo[] = [
      {
        id: 'a', x: 16, y: 16, width: 48, height: 89, label: 'a',
        wtitle: 25, htitle: 10, baselineOffset: 12.8889, inkShape: 'polygon',
      },
    ];
    const { inkShape: _polyInkShape, ...plainNsPoly } = namespaces[0]!;
    const polygon = computeClassDocumentDims([], namespaces, [], []);
    const plain = computeClassDocumentDims([], [plainNsPoly], [], []);
    // Ink span with the hack: x in [6, 74] vs the plain-UPath rule's [16, 64]
    // -- exactly 20px (2*HACK_X_FOR_POLYGON) wider, y unaffected.
    expect(polygon.width).toBe(plain.width + 20);
    expect(polygon.height).toBe(plain.height);
  });

  it('item 42 (G2 N60): inkShape "rect" (skinparam packageStyle rect) uses ' +
    'the classic URectangle ink rule (-1 on BOTH corners: [x-1,x+w-1]) -- ' +
    'the SAME width/height as the plain UPath rule ([x,x+w], since both are ' +
    'w-wide), but SHIFTED 1px left/up -- jar-verified against mucuxi-36-' +
    'beku683\'s real LimitFinder walk (raw cluster bbox [16,64] -> ink ' +
    '[15,63])', () => {
    const namespaces: NamespaceGeo[] = [
      {
        id: 'a', x: 16, y: 16, width: 48, height: 89, label: 'a',
        wtitle: 25, htitle: 10, baselineOffset: 12.8889, inkShape: 'rect',
      },
    ];
    const { inkShape: _rectInkShape, ...plainNs } = namespaces[0]!;
    const rectDims = computeClassDocumentDims([], namespaces, [], []);
    const plainDims = computeClassDocumentDims([], [plainNs], [], []);
    // A namespace-only diagram: the ink SPAN width/height (max-min) is
    // identical between the two rules (both exactly `width`/`height` wide),
    // so the FINAL canvas dimension is unaffected in isolation -- the rule
    // only matters once ANOTHER element's own ink could dominate a corner,
    // or via the absolute ink-shift position (`computeClassInkShift` below).
    expect(rectDims).toEqual(plainDims);

    const rectShift = computeClassInkShift([], namespaces, [], []);
    const plainShift = computeClassInkShift([], [plainNs], [], []);
    // rect's ink-min corner is 1px further out (x-1,y-1 vs x,y), so the
    // uniform shift needed to land it at JAR_INK_MARGIN is 1px smaller in
    // magnitude on both axes -- jar-verified: mucuxi's real shift is -9
    // (raw minX 15 -> 6), jinibe/plain's is -10 (raw minX 16 -> 6).
    expect(rectShift.dx).toBe(plainShift.dx + 1);
    expect(rectShift.dy).toBe(plainShift.dy + 1);
  });

  it('edge points widen the box beyond the classifiers alone', () => {
    const classifiers = [makeClassifierGeo({ x: 0, y: 0, width: 40, height: 40 })];
    const edges: EdgeGeo[] = [
      {
        id: 'e0',
        points: [
          { x: 20, y: 40 },
          { x: 20, y: 100 },
          { x: 20, y: 150 },
          { x: 20, y: 200 },
        ],
        targetDecor: 'none',
        sourceDecor: 'none',
        dashed: false,
        from: 'A',
        to: 'B',
      },
    ];
    const withoutEdge = computeClassDocumentDims(classifiers, [], [], []);
    const withEdge = computeClassDocumentDims(classifiers, [], edges, []);
    expect(withEdge.height).toBeGreaterThan(withoutEdge.height);
  });

  it('an edge label point also widens the ink box', () => {
    const edges: EdgeGeo[] = [
      {
        id: 'e0',
        points: [
          { x: 0, y: 0 },
          { x: 500, y: 0 },
        ],
        label: { text: 'far', x: 900, y: 5, width: 20 },
        targetDecor: 'none',
        sourceDecor: 'none',
        dashed: false,
        from: 'A',
        to: 'B',
      },
    ];
    const dims = computeClassDocumentDims([], [], edges, []);
    // maxX dominated by the label (900), not the edge's own points (500).
    expect(dims.width).toBeGreaterThan(900);
  });

  it('notes contribute PLAIN ink (no x-hack) -- Opale.java draws a UPath, not a UPolygon (G2/N14)', () => {
    // G2/N14 CORRECTION: `Opale.java#drawU` draws its outline via `UPath`
    // (every `getPolygonNormal`/`Left`/`Right`/`Up`/`Down` branch), never a
    // `UPolygon` -- so `LimitFinder` dispatches to the PLAIN bbox rule, no
    // `HACK_X_FOR_POLYGON` x-padding. Jar-verified wrong by exactly 10px
    // against `fezugi-39-fujo327` before this fix (see
    // layout-ink-extent.ts's own doc comment for the full derivation).
    const notes: NoteGeo[] = [
      { id: 'n0', leafType: 'NOTE', x: 0, y: 0, width: 50, height: 30, lines: ['hi'], lineWidths: [], connector: [] },
    ];
    const dims = computeClassDocumentDims([], [], [], notes);
    // Ink span (unpadded): [0,50] x [0,30].
    // width = 50+15+5+1 floored = 71; height = 30+15+5+1 floored = 51.
    expect(dims.width).toBe(71);
    expect(dims.height).toBe(51);
  });

  it('G2/N13: a dropped member-tip note contributes NO ink at all (jar draws nothing for it)', () => {
    const notes: NoteGeo[] = [
      { id: 'n0', leafType: 'TIPS', x: 0, y: 0, width: 500, height: 500, lines: ['error'], lineWidths: [], connector: [], dropped: true },
    ];
    const dims = computeClassDocumentDims([], [], [], notes);
    expect(dims.width).toBe(0);
    expect(dims.height).toBe(0);
  });
});

// mission skin-file-loading (deferred D3 item): `ClassifierGeo.shadowing`
// widens `addRectInk`'s own max corner by `2*shadow` -- see that function's
// own doc comment for the jar-verified `LimitFinder#drawRectangle` formula.
describe('computeClassDocumentDims — shadow ink (deferred D3 item)', () => {
  it('shadow=0 is byte-identical to the unshadowed dims (no regression)', () => {
    const classifiers = [makeClassifierGeo({ x: 0, y: 0, shadowing: 0 })];
    const withShadowField = computeClassDocumentDims(classifiers, [], [], []);
    const withoutShadowField = computeClassDocumentDims(
      [makeClassifierGeo({ x: 0, y: 0 })],
      [],
      [],
      [],
    );
    expect(withShadowField).toEqual(withoutShadowField);
  });

  it('shadow>0 widens both dims by 2*shadow-1 (filoxo-23-fafi328, skin rose ' +
    'Shadowing 4.0) — measured on the raw (pre-floor) ink dims, since the ' +
    'final margined dims\' SvgGraphics#ensureVisible truncation can absorb a ' +
    'fractional part differently depending on which corner dominates. The ' +
    '"-1" (not a flat 2*shadow=8) is because the UNSHADOWED baseline this ' +
    'delta is measured against already picked the un-inset `x+w` UEmpty ' +
    'corner as dominant (addRectInk\'s own doc comment) -- the shadowed ' +
    'rect corner is `x+w-1+2*shadow`, exactly `2*shadow-1` past that ' +
    'baseline, not past the rect\'s own un-shadowed `-1`-inset corner. ' +
    'Matches the full-pipeline measurement exactly: filoxo/rakopi\'s canvas ' +
    'grew 249->256 and 234->241 (both +7) once this ink rule landed.', () => {
    const unshadowed = computeClassRawInkDims(
      [makeClassifierGeo({ x: 0, y: 0 })],
      [],
      [],
      [],
    );
    const shadowed = computeClassRawInkDims(
      [makeClassifierGeo({ x: 0, y: 0, shadowing: 4 })],
      [],
      [],
      [],
    );
    expect(shadowed.width).toBe(unshadowed.width + 7);
    expect(shadowed.height).toBe(unshadowed.height + 7);
  });

  it('an undefined shadowing field behaves identically to shadowing=0', () => {
    const withUndefined = computeClassDocumentDims(
      [makeClassifierGeo({ x: 0, y: 0 })],
      [],
      [],
      [],
    );
    const withZero = computeClassDocumentDims(
      [makeClassifierGeo({ x: 0, y: 0, shadowing: 0 })],
      [],
      [],
      [],
    );
    expect(withUndefined).toEqual(withZero);
  });
});

// G3/O2: object classifiers whose field/body compartment is entirely
// suppressed (`dividerYs: []` -- "hide members"/"hide empty members" on an
// object with no visible members left) lose the invisible-`UEmpty`-
// reservation ink contribution `addRectInk` models for a POPULATED object,
// so their own visible-rect ink is 1px narrower on the WIDTH axis only
// (`addRectInkEmptyBody`'s own doc comment has the full jar-verified
// mechanism, traced to `EntityImageObject#drawU`/`BodierLikeClassOrObject
// #getBody`'s `LeafType.OBJECT` arm + `LimitFinder#drawRectangle`'s native
// `-1`/`-1` inset).
describe('computeClassRawInkDims — object empty-body ink (G3/O2)', () => {
  it('two hidden-members object classifiers -- jar-verified kexica-21-gega428 ' +
    '(global "hide members"): rawWidth 96.3625 (NOT addRectInk\'s 97.3625), ' +
    'rawHeight unaffected', () => {
    // B35/M40: `bodyInkWidth: 0` is what `class-object-map-sizing.ts` emits
    // for this state -- upstream's `TextBlockUtils.empty(0, 0)` body draws no
    // `TextBlockMarged`/`UEmpty`, so it reserves no ink. The jar numbers below
    // are UNCHANGED; only the geo is now fully specified (the dedicated
    // `addRectInkEmptyBody` rule these once exercised collapsed into the
    // general one).
    const classifiers: ClassifierGeo[] = [
      makeClassifierGeo({
        id: 'A', kind: 'object', x: 7, y: 7, width: 23.3625, height: 18, dividerYs: [], bodyInkWidth: 0,
      }),
      makeClassifierGeo({
        id: 'B', kind: 'object', x: 65, y: 7, width: 23.3625, height: 18, dividerYs: [], bodyInkWidth: 0,
      }),
    ];
    const dims = computeClassRawInkDims(classifiers, [], [], []);
    expect(dims.width).toBeCloseTo(96.3625, 4);
    expect(dims.height).toBe(34);
  });

  it('"hide empty members" only narrows the genuinely-empty sibling -- ' +
    'jar-verified janoma-30-dovo501 (A keeps its populated-field ink at ' +
    'dividerYs:[18], B is the empty one)', () => {
    const populated = makeClassifierGeo({
      id: 'A', kind: 'object', x: 7, y: 7, width: 31.425, height: 40,
      dividerYs: [18],
    });
    const emptyBody = makeClassifierGeo({
      id: 'B', kind: 'object', x: 73.03125, y: 18, width: 23.3625, height: 18,
      dividerYs: [], bodyInkWidth: 0,
    });
    const withEmptyRule = computeClassRawInkDims([populated, emptyBody], [], [], []);
    // B35/M40: the contrast is now carried by `bodyInkWidth`, not by `kind`.
    // Dropping it models an UNMEASURED body, which keeps the pre-B35 fixed
    // `x + w`; the two jar numbers below are unchanged.
    const { bodyInkWidth: _dropped, ...unmeasured } = emptyBody;
    const withGeneralRuleOnly = computeClassRawInkDims([populated, unmeasured], [], [], []);
    // The empty-body sibling's own rule shaves exactly 1px off the raw
    // width relative to treating it with the general (addRectInk) rule --
    // jar-verified rawWidth 104.39375 (this rule) vs 105.39375 (general).
    expect(withEmptyRule.width).toBeCloseTo(104.39375, 4);
    expect(withGeneralRuleOnly.width - withEmptyRule.width).toBe(1);
    expect(withEmptyRule.height).toBe(withGeneralRuleOnly.height);
  });

  it('B35/M40: the 1px is gated on the body reservation, NOT on kind -- an ' +
    'unmeasured body (class/interface/enum) keeps x+w, a zero-width one gives x+w-1', () => {
    // Pre-B35 this asserted a KIND gate, because the suppressed-body rule was
    // reachable only for `kind: 'object'`. The real discriminator is whether
    // the body draws a `TextBlockMarged` `UEmpty` at all -- so an object with
    // a zero-width reservation and a class with none differ by exactly the
    // same 1px, and an object whose body DROVE the width does not.
    const base: Partial<ClassifierGeo> = { id: 'C', x: 65, y: 7, width: 23.3625, height: 18, dividerYs: [] };
    const unmeasured = makeClassifierGeo({ ...base, kind: 'class' });
    const noReservation = makeClassifierGeo({ ...base, kind: 'object', bodyInkWidth: 0 });
    const bodyDriven = makeClassifierGeo({ ...base, kind: 'object', bodyInkWidth: 23.3625 });
    const widthOf = (c: ClassifierGeo): number => computeClassRawInkDims([c], [], [], []).width;
    expect(widthOf(unmeasured) - widthOf(noReservation)).toBe(1);
    expect(widthOf(bodyDriven)).toBe(widthOf(unmeasured));
  });
});

// B5/M6: the THIRD object body state -- an empty field list that is still
// SHOWN. `EntityImageObject`'s ctor (`svek/image/EntityImageObject.java
// :110-113`) substitutes `TextBlockLineBefore(TextBlockEmpty(10, 16))`,
// whose payload draws NOTHING (`klimt/shape/TextBlockEmpty.java:63-64`) and
// whose divider `ULine` spans only `[x+1, x+w-1]`
// (`klimt/shape/UHorizontalLine.java:99-108,148-151`), so the classifier's
// ink comes SOLELY from its own rect and takes `LimitFinder#drawRectangle`'s
// native symmetric inset on BOTH corners (`klimt/drawing/LimitFinder.java
// :184-188`) -- unlike EITHER sibling state. See `addRectInkEmptyShownBody`'s
// own doc comment for the three-way jar-rendered control set.
describe('computeClassRawInkDims — object empty-but-SHOWN placeholder ink (B5/M6)', () => {
  it('jar-verified jabote-02-rajo672 (three bare `object oN`, no title): ' +
    'canvas 115x149, i.e. the rect inset on BOTH axes', () => {
    const geo = (id: string, x: number, y: number): ClassifierGeo =>
      makeClassifierGeo({
        id, kind: 'object', x, y, width: 29.575, height: 34,
        dividerYs: [18], emptyFieldPlaceholder: true,
      });
    const classifiers = [geo('o1', 0, 0), geo('o2', 65, 0), geo('o3', 0, 94)];
    expect(computeClassDocumentDims(classifiers, [], [], [])).toEqual({ width: 115, height: 149 });
  });

  it('drops exactly 1px on EACH axis versus the general addRectInk rule', () => {
    const withFlag = makeClassifierGeo({
      id: 'o1', kind: 'object', x: 0, y: 0, width: 29.575, height: 34,
      dividerYs: [18], emptyFieldPlaceholder: true,
    });
    const { emptyFieldPlaceholder: _drop, ...withoutFlag } = withFlag;
    const a = computeClassRawInkDims([withFlag], [], [], []);
    const b = computeClassRawInkDims([withoutFlag], [], [], []);
    expect(b.width - a.width).toBe(1);
    expect(b.height - a.height).toBe(1);
  });

  it('authored jar control (2 bare objects, no title, no edges): the ' +
    'zero-height-body sibling rule must NOT be reused -- it keeps y+h and ' +
    'would give 56, jar says 55', () => {
    // Rendered through the pinned jar as `@startuml object foo / object bar
    // @enduml`: rects (7,7,33.425,34) and (75.61,7,34.213,34), canvas
    // 123x55. Raw positions are the SVG ones less this port's +7 anchor.
    const classifiers: ClassifierGeo[] = [
      makeClassifierGeo({
        id: 'foo', kind: 'object', x: 0, y: 0, width: 33.425, height: 34,
        dividerYs: [18], emptyFieldPlaceholder: true,
      }),
      makeClassifierGeo({
        id: 'bar', kind: 'object', x: 68.61, y: 0, width: 34.213, height: 34,
        dividerYs: [18], emptyFieldPlaceholder: true,
      }),
    ];
    expect(computeClassDocumentDims(classifiers, [], [], [])).toEqual({ width: 123, height: 55 });
  });

  it('authored jar control (`hide object fields`, 2 objects, no title): the ' +
    'zero-height-body state keeps y+h -- canvas 123x40, NOT 39', () => {
    // Rendered through the pinned jar as `@startuml hide object fields /
    // object foo { field1 } / object bar { field2 } @enduml`: rects
    // (7,7,33.425,18) and (75.61,7,34.213,18), canvas 123x40. This is the
    // negative control that killed the wider "field list is empty" gate the
    // B5 ledger row proposed.
    const classifiers: ClassifierGeo[] = [
      makeClassifierGeo({
        id: 'foo', kind: 'object', x: 0, y: 0, width: 33.425, height: 18, dividerYs: [], bodyInkWidth: 0,
      }),
      makeClassifierGeo({
        id: 'bar', kind: 'object', x: 68.61, y: 0, width: 34.213, height: 18, dividerYs: [], bodyInkWidth: 0,
      }),
    ];
    expect(computeClassDocumentDims(classifiers, [], [], [])).toEqual({ width: 123, height: 40 });
  });

  it('authored jar control (2 POPULATED objects, no title): the general ' +
    'addRectInk rule is unchanged -- canvas 148x62', () => {
    // Pinned jar, `@startuml object foo { field1 } / object bar { field2 }
    // @enduml`: rects (7,7,45.512,40) and (88,7,45.512,40), canvas 148x62.
    const classifiers: ClassifierGeo[] = [
      makeClassifierGeo({ id: 'foo', kind: 'object', x: 0, y: 0, width: 45.512, height: 40, dividerYs: [18] }),
      makeClassifierGeo({ id: 'bar', kind: 'object', x: 81, y: 0, width: 45.512, height: 40, dividerYs: [18] }),
    ];
    expect(computeClassDocumentDims(classifiers, [], [], [])).toEqual({ width: 148, height: 62 });
  });

  it('is object-kind-gated: the flag is inert on a class leaf', () => {
    const common = {
      id: 'C', x: 0, y: 0, width: 29.575, height: 34,
      dividerYs: [18], emptyFieldPlaceholder: true as const,
    };
    const asObject = makeClassifierGeo({ ...common, kind: 'object' });
    const asClass = makeClassifierGeo({ ...common, kind: 'class' });
    const objectDims = computeClassRawInkDims([asObject], [], [], []);
    const classDims = computeClassRawInkDims([asClass], [], [], []);
    expect(classDims.width - objectDims.width).toBe(1);
    expect(classDims.height - objectDims.height).toBe(1);
  });
});

// G2 N32: `class Foo<T>`'s generic type-parameter tag box -- drawn OUTSIDE
// the classifier's own rect (above-right, `class-stereotype.ts
// #buildGenericTagGeo`'s doc comment), contributing its OWN ink point via
// the "classic" symmetric -1/+1 URectangle rule (`addClassicRectInk`,
// DIFFERENT from the classifier box's own asymmetric `addRectInk` rule --
// see that function's own doc comment). Jar-verified `caboco-62-jula911`:
// canvas width 234 (both "Foo<Param>" and "Bar<P, Q>" side by side).
describe('computeClassDocumentDims — generic tag box (G2 N32)', () => {
  it('the tag\'s 3px top/right overhang widens/heightens the canvas -- ' +
    'jar-verified caboco-62-jula911', () => {
    const classifiers = [
      makeClassifierGeo({
        id: 'Foo', x: 7, y: 10, width: 95.475, height: 48,
        genericTag: {
          text: 'Param', rectX: 61.15, rectY: -3, rectWidth: 37.325, rectHeight: 14,
          textX: 62.15, textY: 7.3333, textWidth: 35.325, fontFamily: 'sans-serif',
          fontSize: 12, italic: true,
        },
      }),
      makeClassifierGeo({
        id: 'Bar', x: 137.53125, y: 10, width: 78.4125, height: 48,
        genericTag: {
          text: 'P, Q', rectX: 58.7875, rectY: -3, rectWidth: 22.625, rectHeight: 14,
          textX: 59.7875, textY: 7.3333, textWidth: 20.625, fontFamily: 'sans-serif',
          fontSize: 12, italic: true,
        },
      }),
    ];
    const dims = computeClassDocumentDims(classifiers, [], [], []);
    expect(dims).toEqual({ width: 234, height: 73 });
  });

  it('without any genericTag, the SAME classifiers produce a narrower canvas ' +
    '(regression guard -- confirms the tag genuinely widens it)', () => {
    const classifiers = [
      makeClassifierGeo({ id: 'Foo', x: 7, y: 7, width: 95.475, height: 48 }),
      makeClassifierGeo({ id: 'Bar', x: 137.53125, y: 7, width: 78.4125, height: 48 }),
    ];
    const dims = computeClassDocumentDims(classifiers, [], [], []);
    expect(dims.width).toBeLessThan(234);
  });
});

// G2 N35: the lollipop interface's own display-label row (`renderer.ts
// #renderLollipop`'s `label`, G2 N20) is centered under the tiny fixed-size
// circle and overhangs it on both sides once the label is wider than
// `LOLLIPOP_SIZE` (10px) -- `layout-ink-extent.ts`'s own file doc comment
// previously named "edge-label/row UText ink" a documented simplification
// that is "usually dominated by the classifier boxes' own ink reach"; the
// lollipop is the counter-example. Jar-verified against `makoko-44-mapu988`
// (`svg/@width` undershoots by exactly the missing overhang) and
// `paluca-39-desa696` (same shape) -- see `plans/g2-class-svg/ledger.md` N35.
describe('computeClassDocumentDims - lollipop label overhang (G2 N35)', () => {
  function makeLollipopGeo(indent: number, width: number): ClassifierGeo {
    return {
      id: 'L', kind: 'lollipop', x: 0, y: 0, width: 10, height: 10,
      dividerYs: [], rows: [{ text: 'label', y: 20, indent, width }],
    };
  }

  it('a label wider than the circle overhangs on both sides and widens the canvas', () => {
    // G9/T14: the circle takes `LimitFinder#drawEllipse`'s rule, not a box's
    // -- `addEllipseInk(0,0,10,10)` -> (0,0)/(9,9), where the old box rule
    // gave (-1,-1)/(10,10) and made the whole diagram 1px taller. Corpus-
    // verified: it takes all five lollipop fixtures to zero diffs
    // (`bososa-44-fipu544`, `rilaki-69-cuni337`, `makoko-44-mapu988`,
    // `gidabo-27-juza410`, `rofijo-47-masa695`).
    //
    // textWidth=30 -> indent = 10/2 - 30/2 = -10, row spans x in [-10, 20],
    // its y pinned to the circle's own [0, 9]. Combined: minX=-10, maxX=20,
    // minY=0, maxY=9. width=(20-(-10))+15+0+5=50 -> floor(51)=51.
    // height=(9-0)+15+0+5=29 -> floor(30)=30.
    const classifiers = [makeLollipopGeo(-10, 30)];
    const dims = computeClassDocumentDims(classifiers, [], [], []);
    expect(dims).toEqual({ width: 51, height: 30 });
  });

  it('a label narrower than the circle does NOT widen the canvas beyond the circle box', () => {
    // textWidth=4 -> indent = 5-2 = 3, row spans x in [3, 7] -- entirely
    // inside the circle's own [-1, 10] ink span, so it never dominates.
    const withLabel = computeClassDocumentDims([makeLollipopGeo(3, 4)], [], [], []);
    const withoutLabel = computeClassDocumentDims(
      [{ id: 'L', kind: 'lollipop', x: 0, y: 0, width: 10, height: 10, dividerYs: [], rows: [] }],
      [], [], [],
    );
    expect(withLabel).toEqual(withoutLabel);
  });

  it('a non-lollipop classifier with an out-of-box row is UNAFFECTED (regression guard -- ' +
    'the mechanism is lollipop-scoped, not a general row-ink walk)', () => {
    const classifiers: ClassifierGeo[] = [
      {
        id: 'C', kind: 'class', x: 0, y: 0, width: 10, height: 10,
        dividerYs: [], rows: [{ text: 'label', y: 20, indent: -10, width: 30 }],
      },
    ];
    const dims = computeClassDocumentDims(classifiers, [], [], []);
    // Same nominal 10x10 box + wide row as the lollipop test above, but ink
    // stays at the classifier's OWN addRectInk bounds (width 32, the SAME
    // value a row-less 10x10 classifier box produces), NOT widened by the
    // out-of-box row -- confirms the mechanism is lollipop-scoped.
    expect(dims.width).toBe(32);
  });
});

describe('computeClassInkShift', () => {
  // G2 N11: `SvekResult#calculateDimension`'s own `moveDelta(6 - minMax
  // .getMinX(), 6 - minMax.getMinY())` side effect (svek/SvekResult.java:
  // 133) -- the uniform translate this port's class layout never applied
  // to already-laid-out positions (see `layout-ink-extent.ts`'s own doc
  // comment for the full derivation and jar citation).

  it('returns {dx:0, dy:0} for an empty diagram (no ink at all)', () => {
    const shift = computeClassInkShift([], [], [], []);
    expect(shift).toEqual({ dx: 0, dy: 0 });
  });

  it('reproduces the jar-verified (+7,+7) shift for two side-by-side classifiers, no edges (jalexi-21-xoje231)', () => {
    // Raw (pre-shift) positions: foo1 at (0,0), foo2 at (94,0) -- a bare
    // rect's own ink-min corner is `(x-1, y-1)` (addRectInk), so the
    // diagram's raw ink minX/minY = (-1,-1); jar-verified real output:
    // `<rect x="7" y="7".../><rect x="101" y="7".../>` -- EXACTLY `(+7,+7)`
    // on BOTH boxes (uniform, not per-element), matching `6 - (-1) = 7`.
    const classifiers = [
      makeClassifierGeo({ id: 'foo1', x: 0, y: 0 }),
      makeClassifierGeo({ id: 'foo2', x: 94, y: 0 }),
    ];
    const shift = computeClassInkShift(classifiers, [], [], []);
    expect(shift).toEqual({ dx: 7, dy: 7 });
  });

  it('a namespace-only diagram shifts by 6 minus its own raw (un-inset) corner (UPath ink rule)', () => {
    // UPath ink has NO -1 inset (addPlainInk), so the raw ink-min corner
    // IS the namespace's own (x,y) -- shift = (6 - x, 6 - y) directly.
    const namespaces: NamespaceGeo[] = [
      { id: 'ns', x: 3, y: 2, width: 100, height: 80, label: 'p1', wtitle: 25, htitle: 20, baselineOffset: 12.8889 },
    ];
    const shift = computeClassInkShift([], namespaces, [], []);
    expect(shift).toEqual({ dx: 3, dy: 4 });
  });

  it('an edge point below every classifier dominates the min-corner walk on that axis', () => {
    const classifiers = [makeClassifierGeo({ x: 0, y: 10, width: 40, height: 40 })];
    const edges: EdgeGeo[] = [
      {
        id: 'e0',
        points: [
          { x: 20, y: -4 },
          { x: 20, y: 10 },
        ],
        targetDecor: 'none',
        sourceDecor: 'none',
        dashed: false,
        from: 'A',
        to: 'B',
      },
    ];
    // Without the edge: raw ink-min-y = classifier's own -1 inset = 9,
    // shift.dy = 6 - 9 = -3. With the edge's own y=-4 point (plain point,
    // no inset) dominating the min side: shift.dy = 6 - (-4) = 10.
    const withoutEdge = computeClassInkShift(classifiers, [], [], []);
    const withEdge = computeClassInkShift(classifiers, [], edges, []);
    expect(withoutEdge.dy).toBe(-3);
    expect(withEdge.dy).toBe(10);
  });

  it('composes with computeClassDocumentDims to reproduce jar-verified absolute rect positions (jalexi-21-xoje231)', () => {
    // Applying BOTH the (translation-invariant) dims AND the shift together
    // is exactly what `layout.ts#assembleShiftedGeometry` does -- this test
    // locks that composition against the real jar output: canvas 175x70,
    // rect x/y = (7,7) and (101,7).
    const classifiers = [
      makeClassifierGeo({ id: 'foo1', x: 0, y: 0 }),
      makeClassifierGeo({ id: 'foo2', x: 94, y: 0 }),
    ];
    const dims = computeClassDocumentDims(classifiers, [], [], []);
    const shift = computeClassInkShift(classifiers, [], [], []);
    expect(dims).toEqual({ width: 175, height: 70 });
    expect(classifiers.map((c) => ({ x: c.x + shift.dx, y: c.y + shift.dy }))).toEqual([
      { x: 7, y: 7 },
      { x: 101, y: 7 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// G2 N66 (near-zero harvest, `vinujo-78-kapo329`): `skinparam
// diagramBorderColor` border-rect dims -- jar's `TextBlockExporter
// #maybeDrawBorder` uses the PRE-floor margined dims, not the final
// truncated canvas size.
// ---------------------------------------------------------------------------
describe('computeClassBorderRectDims (G2 N66)', () => {
  it('vinujo-78-kapo329: jar-verified byte-exact (rawWidth=109.7875, ' +
     'rawHeight=62, thickness=1 -> rect 113.7875 x 66)', () => {
    const dims = computeClassBorderRectDims({ width: 109.7875, height: 62 }, 1);
    expect(dims.width).toBeCloseTo(113.7875, 4);
    expect(dims.height).toBe(66);
  });

  it('a thickness of 0 leaves the full margined dims untouched', () => {
    const dims = computeClassBorderRectDims({ width: 100, height: 50 }, 0);
    expect(dims).toEqual({ width: 105, height: 55 });
  });
});

/**
 * G9/T12: a `#`/`~` visibility icon is a `UPolygon`, so its ink is padded.
 *
 * `VisibilityModifier#drawDiamond`/`drawTriangle`
 * (`skin/VisibilityModifier.java:192-210`) build a `UPolygon`, which
 * `LimitFinder#drawUPolygon` records with `HACK_X_FOR_POLYGON = 10` added on
 * BOTH x sides — the same rule this module already applies to a `strictuml`
 * namespace outline. `+` draws a `UEllipse` and `-` a `URectangle`; neither
 * is padded.
 *
 * The icon sits inside its classifier at `x + ROW_TEXT_LEFT_MARGIN`, so only
 * the left pad escapes the box's own `x - 1` corner — by exactly 2px, which
 * is the uniform offset `dejuse-14-pule208` carried against jar on every one
 * of its 44 shapes (ours at x=7/15/205/213 against jar's 9/17/207/215).
 */
describe('computeClassDocumentDims — visibility-icon polygon ink', () => {
  const withIcon = (icon: string): ClassifierGeo =>
    makeClassifierGeo({
      x: 0,
      y: 0,
      rows: [{ y: 20, text: 'field', width: 30, visibilityIcon: icon } as ClassifierGeo['rows'][number]],
    });

  it('pads a protected (#) icon`s ink 10px each side', () => {
    const plain = computeClassDocumentDims([makeClassifierGeo({ x: 0, y: 0 })], [], [], []);
    const diamond = computeClassDocumentDims([withIcon('#')], [], [], []);
    // left pad reaches `x + 6 + 1 - 10 = x - 3`, against the box's own
    // `x - 1`: 2px further left, and the box still bounds the right side.
    expect(diamond.width - plain.width).toBe(2);
    expect(diamond.height).toBe(plain.height);
  });

  it('pads a package (~) icon the same way — it is the same UPolygon rule', () => {
    const plain = computeClassDocumentDims([makeClassifierGeo({ x: 0, y: 0 })], [], [], []);
    expect(computeClassDocumentDims([withIcon('~')], [], [], []).width - plain.width).toBe(2);
  });

  it('leaves public (+) and private (-) alone — UEllipse and URectangle', () => {
    const plain = computeClassDocumentDims([makeClassifierGeo({ x: 0, y: 0 })], [], [], []);
    expect(computeClassDocumentDims([withIcon('+')], [], [], []).width).toBe(plain.width);
    expect(computeClassDocumentDims([withIcon('-')], [], [], []).width).toBe(plain.width);
  });

  it('finds the icon in `enhancedBody` too, where a `{method}` member lives', () => {
    // A `BodyEnhanced` classifier draws `enhancedBody.parts` INSTEAD OF
    // `rows` (`class-body-enhanced-layout.ts`), so an icon-bearing member is
    // absent from `rows` entirely -- `filoxo-23-fafi328`'s `Doer` has only
    // its header there, and both `{method} # …` members in `enhancedBody`.
    const plain = computeClassDocumentDims([makeClassifierGeo({ x: 0, y: 0 })], [], [], []);
    const viaEnhanced = computeClassDocumentDims(
      [
        makeClassifierGeo({
          x: 0,
          y: 0,
          enhancedBody: {
            parts: [{ kind: 'rows', rows: [{ y: 20, text: 'm', indent: 0, width: 30, visibilityIcon: '#' }] }],
            width: 30,
            height: 20,
          },
        }),
      ],
      [],
      [],
      [],
    );
    expect(viaEnhanced.width - plain.width).toBe(2);
  });

  it('shifts the whole drawing right by the same 2px, per computeClassInkShift', () => {
    const plain = computeClassInkShift([makeClassifierGeo({ x: 0, y: 0 })], [], [], []);
    const diamond = computeClassInkShift([withIcon('#')], [], [], []);
    expect(diamond.dx - plain.dx).toBe(2);
  });
});

/**
 * G9/T16: an edge label reserves `LimitFinder#drawText`'s ink, not one point.
 *
 * `LimitFinder#drawText` (`klimt/drawing/LimitFinder.java:217-225`) records a
 * `UText` from its BASELINE: `[y - (height - 1.5), y + 1.5]` across
 * `[x, x + width]`. Edge labels used to contribute their `<text>` anchor
 * `(x, y)` alone — a simplification `class-ink-box.ts`'s own header called
 * "usually dominated by the classifier boxes' own ink reach".
 *
 * `style-stereotype-on-arrow-3` and `zebufu-01-pevo013` are where it is not.
 * Their label baseline sits at 17.111, so jar's ink reaches 5.611 — 0.389
 * ABOVE the topmost object box's own `y - 1` of 6 — and jar's ENTIRE drawing
 * therefore sat 0.389px lower than ours on an otherwise byte-identical 143x55
 * canvas. Neither the census nor the document dimensions can see that: it is a
 * pure `computeClassInkShift` difference, so this is the gate.
 */
describe('edge-label text ink (G9/T16)', () => {
  const labelled = (label: EdgeGeo['label']): EdgeGeo[] => [
    {
      id: 'e0',
      points: [{ x: 30, y: 60 }, { x: 30, y: 90 }],
      targetDecor: 'none',
      sourceDecor: 'none',
      dashed: false,
      from: 'A',
      to: 'B',
      ...(label === undefined ? {} : { label }),
    },
  ];
  /** a 40x40 box at the origin: `addRectInk` puts its ink top at y = -1 */
  const boxes = [makeClassifierGeo({ x: 0, y: 0, width: 40, height: 40 })];

  it('reaches CARDINALITY_FONT_SIZE - 1.5 above the baseline', () => {
    // baseline 8 -> ink top 8 - 13 + 1.5 = -3.5, i.e. 2.5 above the box's -1.
    // The shift is `JAR_INK_MARGIN - minY`, so a lower ink top RAISES dy by
    // that much — which is the direction jar's whole drawing moved.
    const shift = computeClassInkShift(boxes, [], labelled({ text: 'x', x: 5, y: 8, width: 12 }), []);
    const plain = computeClassInkShift(boxes, [], labelled(undefined), []);
    expect(shift.dy - plain.dy).toBe(2.5);
  });

  it('reaches 1.5 below it, and the label width to the right', () => {
    // baseline 200 -> ink bottom 201.5 against the box's own 39; x spans
    // [100, 160] against the box's 39. Both dominate, so both show in dims.
    const dims = computeClassDocumentDims(
      boxes, [], labelled({ text: 'x', x: 100, y: 200, width: 60 }), [],
    );
    // width  = (160 - (-1)) + INK_DELTA 15 + margins 0/5, +1 truncating
    // height = (201.5 - (-1)) + 15 + 0/5 -> floor(223.5) = 223
    expect(dims).toEqual({ width: 182, height: 223 });
  });

  it('leaves a label sitting inside the boxes` own ink with no effect', () => {
    const inside = computeClassDocumentDims(
      boxes, [], labelled({ text: 'x', x: 5, y: 30, width: 12 }), [],
    );
    expect(inside).toEqual(computeClassDocumentDims(boxes, [], labelled(undefined), []));
  });
});
