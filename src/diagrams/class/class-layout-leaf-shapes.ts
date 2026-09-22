/**
 * The usecase/actor USymbol box and the lollipop-interface circle+label —
 * the two classifier kinds whose svek box is NOT the generic name+members
 * rect (`class-layout-generic-classifier.ts#measureGenericClassifier`).
 *
 * Split out of class-layout-helpers.ts purely to keep every function under
 * the project's per-function complexity/size caps and the file under the
 * 500-line cap. No behavior differs from the original inline code — this
 * is a pure move.
 */

import type { Classifier } from './ast.js';
import type { StringMeasurer } from '../../core/measurer.js';
import {
  measureUsecaseOrActorLeaf,
  measureUsecaseOrActorLeafInk,
  measureLeafNode,
  type LeafSymbolInk,
} from '../../core/svek/image/leaf-sizing.js';
import type { MeasuredClassifier } from './class-layout-helpers.js';
import { LOLLIPOP_SIZE } from './class-lollipop.js';
import { spriteDimsLookupFor, type SpriteRegistry } from '../../core/sprite-commands.js';
import type { Theme } from '../../core/theme.js';
import { resolveElementFontSize } from '../../core/theme-element-resolve.js';
import { resolveActorStyle, mapComponentStyle } from '../../core/decoration/symbol/usymbol-resolve.js';
import { sizingAtomImageResolverFor } from '../../core/svek/image/leaf-sizing-entity.js';
import { DEFAULT_SIZING_STROKE_THICKNESS } from '../../core/svek/image/leaf-sizing-consts.js';
import {
  EntityImageDescription,
  type EntityImageDescriptionParams,
} from '../../core/svek/image/EntityImageDescription.js';
import { LimitFinder } from '../../core/klimt/drawing/LimitFinder.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import type { FontStyle } from '../../core/klimt/shape/UText.js';
import type { SpriteDimsLookup } from '../../core/creole-atoms.js';

/**
 * Measure the usecase/actor USymbol box — the two allowmixing kinds whose
 * svek box is NOT the generic name+members rect (see measureClassifier).
 *
 * SI10/ADR-2: routes through the description engine's
 * `measureUsecaseOrActorLeaf` (the SAME faithful `EntityImageDescription`
 * path the description diagram engine uses for these two USymbols) rather
 * than the class engine's own analytic substitute. This function still
 * builds its own `MeasuredClassifier` shape (`rows`/`dividerYs`) — that
 * composition is class-specific and unaffected by where `dim` comes from.
 *
 * `sprites` (SI10 scope item 3): threaded from
 * `class-layout-helpers.ts#tryMeasureNonGenericClassifier`, already in
 * scope there for the `measureObjectClassifier` call one line above this
 * branch's dispatch — previously NOT forwarded here, so a class-diagram
 * usecase/actor with a `<$sprite>` display measured with no sprite
 * awareness at all.
 */
export function measureUsecaseOrActor(
  classifier: Classifier,
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): MeasuredClassifier {
  const symbol = classifier.kind === 'usecase' ? 'usecase' : 'actor';
  const spriteDims = sprites !== undefined ? spriteDimsLookupFor(sprites) : undefined;
  const dim = measureUsecaseOrActorLeaf(classifier.display, symbol, fontSpec, measurer, spriteDims);
  // The DRAWN ink extent, carried through to `class-ink-box.ts
  // #addClassifierInk` so an actor's ink is its own head/body/label union
  // rather than `addRectInk`'s `(x - 1, y - 1)` box corner — which sits 1.5
  // above the drawn head ellipse's real top of `y + 0.5` and shifts the
  // whole document by that much (`cacoma-43-poxu615`,
  // `.agent-notes/class-ink-shared-offset-groups.md` item (b)).
  //
  // ACTOR ONLY, deliberately: a `usecase` leaf already dispatches to
  // `addEllipseInk`, a jar-verified rule this mission must leave
  // byte-identical (decision D2), so measuring ink no consumer reads would
  // be dead work. Routing usecase through the same walk is a separate,
  // measurable question — see this mission's journal.
  const symbolInk =
    symbol === 'actor'
      ? measureUsecaseOrActorLeafInk(classifier.display, symbol, fontSpec, measurer, spriteDims)
      : undefined;

  // SI14 T5: no longer pre-resolves the label's creole atoms here. That
  // existed only because `renderClass(geo, theme)` received no sprite
  // registry -- since SI14 T3/T4 it does (`ClassGeometry.measurer`/
  // `.sprites`), and `renderer-usymbol-entity.ts` draws this row through the
  // SAME `EntityImageDescription.drawU` faithful path the description engine
  // uses, which measures and draws atoms itself at draw time. This row now
  // only carries plain `text` -- the established `rows[].atoms` carrier
  // (`class-geo-types.ts` G2 N22) remains populated for member rows and
  // notes (`class-member-rows.ts`, `class-body-enhanced-layout.ts`,
  // `note-layout-measure.ts`), which this change does not touch.
  const row = {
    text: classifier.display,
    y: dim.height / 2,
    indent: 0,
    italic: false,
  };
  return {
    width: dim.width,
    height: dim.height,
    rows: [row],
    dividerYs: [],
    ...(symbolInk !== undefined ? { symbolInk } : {}),
  };
}

/**
 * G2 N20: the lollipop interface's own display-label text --
 * `EntityImageLollipopInterface.java:94-133`'s `desc.drawU(...)` call, drawn
 * OUTSIDE the circle's own `<g class="entity">` wrap (`renderer.ts`'s
 * `renderLollipop` pushes this row's rendered `<text>` as an unwrapped
 * sibling, mirroring jar's own `closeGroup()`-then-`desc.drawU(...)`
 * sequence). Jar never reserves DOT/layout space for it --
 * `calculateDimensionSlow` returns a flat `(SIZE, SIZE)` ignoring `desc`
 * entirely (`class-dot-graph.ts#buildOneDotNode`'s own "generic width/
 * height discarded" doc comment is the matching DOT-side half of this
 * fact) -- so `width`/`height` returned here are informational only, never
 * consulted for node sizing.
 *
 * Byte-verified against `bososa-44-fipu544`'s `dummylol2` ("toto1"): jar's
 * `<text x="6" y="26.8889" ... textLength="31.0625">toto1</text>` = node-left
 * `16.5313` + `(SIZE/2 - textWidth/2)` = `16.5313 + (5 - 15.53125)`, node-top
 * `6 + SIZE(10) + baselineOffset(10.8889)` -- `baselineOffset` is the SAME
 * ascent-from-line-top formula every other class text row uses (`measure
 * GenericClassifier`'s own doc comment in class-layout-generic-classifier.ts).
 */
export function measureLollipop(
  classifier: Classifier,
  fontSpec: { family: string; size: number },
  measurer: StringMeasurer,
): MeasuredClassifier {
  const textWidth = measurer.measure(classifier.display, fontSpec).width;
  const baselineOffset = fontSpec.size - measurer.getDescent(fontSpec, '');
  const row = {
    text: classifier.display,
    y: LOLLIPOP_SIZE + baselineOffset,
    indent: LOLLIPOP_SIZE / 2 - textWidth / 2,
    width: textWidth,
  };
  return { width: LOLLIPOP_SIZE, height: LOLLIPOP_SIZE, rows: [row], dividerYs: [] };
}

/** `EntityImageAssociation.SIZE` (java:54) -- the `<> name` association
 *  diamond's half-extent on BOTH axes. */
const ASSOCIATION_DIAMOND_SIZE = 12;

/**
 * A2s R2h (cukaze-78-zija070): the `<> name` association diamond
 * (`CommandDiamondAssociation` -> `LeafType.ASSOCIATION`) is a fixed
 * `(SIZE*2, SIZE*2)` image -- `EntityImageAssociation#calculateDimensionSlow`
 * ignores the declared name entirely (never measured, and `drawU` paints
 * only the `UPolygon` diamond, never a label), so no text row is emitted.
 * Jar golden: cukaze-78's diamond node is 0.333333x0.333333in (24x24px).
 * @see ~/git/plantuml/.../svek/image/EntityImageAssociation.java:54,60-62
 */
export function measureAssociationDiamond(): MeasuredClassifier {
  return {
    width: ASSOCIATION_DIAMOND_SIZE * 2,
    height: ASSOCIATION_DIAMOND_SIZE * 2,
    rows: [],
    dividerYs: [],
  };
}

// ---------------------------------------------------------------------------
// cdd-T22 (E8): `circle`/`() "Name"` interface eye
// ---------------------------------------------------------------------------

/** `EntityImageDescription`'s sizing-time paint placeholder -- a LimitFinder
 *  ink walk over `CircleInterface2` never reads forecolor/backcolor/stroke
 *  (`leaf-sizing-consts.ts#INTERFACE_CIRCLE_SIZE`'s own doc comment: the
 *  shape "never reads ctx.getStroke()/getDeltaShadow()"), so any value
 *  satisfies `Paint`. Duplicated (not imported) --
 *  `leaf-sizing-entity.ts#SIZING_PLACEHOLDER_COLOR` is module-private in a
 *  file outside this task's write-set, matching `renderer-usymbol-entity.ts
 *  #ENTITY_STROKE_WIDTH`'s own established duplication precedent for the
 *  identical reason. */
const CIRCLE_SIZING_PLACEHOLDER_COLOR = '#000000';
/** No style flags -- matches `leaf-sizing-entity.ts#SIZING_FONT_STYLES`'s
 *  identical empty-set convention for a sizing-only `FontConfiguration`. */
const CIRCLE_SIZING_FONT_STYLES: ReadonlySet<FontStyle> = new Set();

/**
 * Sizing-time `EntityImageDescriptionParams` for a `circle`/`() "name"`
 * interface leaf -- keyword `'circle'` resolves to `USymbols.INTERFACE`
 * inside `EntityImageDescription`'s own constructor
 * (`EntityImageDescriptionSupport.ts:138`, mirroring `Entity.getUSymbol`'s
 * `LeafType.CIRCLE` -> `USymbols.INTERFACE` mapping,
 * `abel/Entity.java:415`), which in turn sets `hideText = true`
 * (`EntityImageDescription.java:137`) and draws the label BELOW the icon
 * rather than inside it -- see {@link measureCircleInterfaceInk}'s own doc
 * comment for why this needs a REAL `drawU` walk rather than analytic ink
 * math.
 *
 * A parallel assembly of the SAME upstream params
 * `renderer-usymbol-entity.ts#buildUsecaseActorEntityParams` builds for the
 * real draw -- not a call to it, matching that file's own "parallel
 * assembly" precedent (ADR-1/ADR-2) -- because this one runs at LAYOUT
 * time and uses placeholder paint, mirroring `leaf-sizing-entity.ts
 * #buildSizingEntityParams`'s established sizing-time convention.
 */
function buildCircleInterfaceSizingParams(
  display: string,
  theme: Theme,
  sprites: SpriteDimsLookup | undefined,
): EntityImageDescriptionParams {
  const font = {
    family: theme.fontFamily,
    size: resolveElementFontSize(theme, 'circle', 'title') ?? theme.fontSize,
    color: null,
    styles: CIRCLE_SIZING_FONT_STYLES,
  };
  return {
    entity: { name: '', uid: '', qualifiedName: '', location: null, url: null },
    symbol: {
      keyword: 'circle',
      actorStyle: resolveActorStyle(undefined),
      componentStyle: mapComponentStyle(undefined),
    },
    labels: { codeName: display, displayText: display, stereotypeLabels: [] },
    paint: {
      forecolor: CIRCLE_SIZING_PLACEHOLDER_COLOR,
      backcolor: CIRCLE_SIZING_PLACEHOLDER_COLOR,
      roundCorner: 0,
      diagonalCorner: 0,
      deltaShadow: 0,
      stroke: UStroke.withThickness(DEFAULT_SIZING_STROKE_THICKNESS),
      fontTitle: font,
      fontStereo: font,
      titleAlignment: HorizontalAlignment.CENTER,
      stereotypeAlignment: HorizontalAlignment.CENTER,
    },
    links: [],
    fixCircleLabelOverlapping: theme.fixCircleLabelOverlapping === true,
    atomImageResolverFor: sizingAtomImageResolverFor(sprites),
  };
}
// #lizard forgives -- one straight-line params-object assembly, mirrors
// `renderer-usymbol-entity.ts#buildUsecaseActorEntityParams`'s identical
// shape/length for the same reason.

/**
 * The ink extent of a `circle`/`() "name"` interface leaf's DRAWN shapes --
 * the union of the `CircleInterface2` icon and the label `desc` drawn BELOW
 * it (`EntityImageDescription.java:294-330`'s `hideText` branch), from a
 * REAL `LimitFinder` walk over the SAME `EntityImageDescription` instance
 * that would draw it -- mirrors `leaf-sizing-entity.ts
 * #measureUsecaseOrActorLeafInk`'s established "share the measurement
 * object" shape (SI14) exactly, duplicated here (not imported) because that
 * function's own symbol union is `'usecase' | 'actor'` and its host file is
 * outside this task's write-set.
 *
 * Not analytic (no hand-derived `space=8 + dimSmall.height` formula): a
 * `UEllipse`'s drawn top sits at `y + 0.5`, not `y`
 * (`.agent-notes/class-ink-shared-offset-groups.md` item (b) -- the SAME
 * surprise that forced the actor case onto this exact mechanism rather
 * than box math), so `CircleInterface2`'s `margin=1`-inset ellipse is
 * measured, not fitted.
 *
 * `undefined` when the walk records nothing, matching
 * `measureUsecaseOrActorLeafInk`'s own contract.
 */
function measureCircleInterfaceInk(
  display: string,
  theme: Theme,
  measurer: StringMeasurer,
  sprites: SpriteDimsLookup | undefined,
): LeafSymbolInk | undefined {
  const bounder = new MeasurerStringBounder(measurer);
  const params = buildCircleInterfaceSizingParams(display, theme, sprites);
  const finder = LimitFinder.create(bounder, false);
  new EntityImageDescription(params).drawU(finder);
  const minX = finder.getMinX();
  if (!Number.isFinite(minX)) return undefined;
  return { minX, minY: finder.getMinY(), maxX: finder.getMaxX(), maxY: finder.getMaxY() };
}

/**
 * Measure a `kind: 'circle'` classifier -- `() "Name"`/`circle X`
 * (`LeafType.CIRCLE`). E8 (`diagnosis/A2b-entity-groups.md`): upstream
 * routes it to `EntityImageDescription` with `USymbols.INTERFACE`
 * (`svek/GeneralImageBuilder.java:157-158`, `abel/Entity.java:415`), an
 * 18x18 fixed box (`leaf-sizing-consts.ts#INTERFACE_CIRCLE_SIZE`, jar-
 * verified against `conija-14-nuta580/svek-1.dot`'s `WIDTH="18.0"
 * HEIGHT="18.0"` node cell) regardless of label content, plus a label
 * drawn BELOW it -- not the generic name+members classifier box this
 * engine drew before this task (6 children: rect + badge ellipse + badge
 * path + text + 2 lines, vs jar's 2: ellipse + text).
 *
 * `measureLeafNode`'s `'circle'` case already returns the fixed 18x18 box
 * (`leaf-sizing.ts:124-135`) -- called here rather than hardcoding the
 * constant locally, since it is the SAME faithful entry point
 * `tryMeasureDescriptionLeaf` (`class-layout-generic-classifier.ts`)
 * already routes every OTHER descriptive USymbol leaf through.
 *
 * `rows[0].text` carries the label purely for the established "row[0]
 * carries the display text" convention `renderer-usymbol-entity.ts
 * #buildUsecaseActorEntityParams` reads (`classifier.rows[0]?.text ??
 * classifier.id`) -- `y`/`indent` are structurally required by
 * `MeasuredClassifier['rows']` but unconsumed on the real draw path,
 * exactly like {@link measureUsecaseOrActor}'s own row (see that
 * function's doc comment).
 */
export function measureCircleInterface(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): MeasuredClassifier {
  const fontSpec = { family: theme.fontFamily, size: theme.fontSize };
  const spriteDims = sprites !== undefined ? spriteDimsLookupFor(sprites) : undefined;
  const dim = measureLeafNode(
    { id: classifier.id, display: classifier.display, symbol: 'circle' },
    fontSpec,
    measurer,
    undefined,
    spriteDims,
  );
  const symbolInk = measureCircleInterfaceInk(classifier.display, theme, measurer, spriteDims);
  const row = { text: classifier.display, y: dim.height / 2, indent: 0, italic: false };
  return {
    width: dim.width,
    height: dim.height,
    rows: [row],
    dividerYs: [],
    ...(symbolInk !== undefined ? { symbolInk } : {}),
  };
}
