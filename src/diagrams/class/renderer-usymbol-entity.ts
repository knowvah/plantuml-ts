/**
 * renderer-usymbol-entity.ts — SI14 T4: draws a class-diagram `usecase`/
 * `actor` leaf through the SAME faithful `EntityImageDescription.drawU`
 * path the description engine's `renderer-entity.ts#drawEntity` already
 * uses, replacing the hand-rolled `renderUseCaseIcon`/`renderActorIcon`
 * string renderers (`core/usymbol-shapes.ts`) for the ONE case that
 * actually matters: their label placement is content-dependent (a fitted
 * ellipse's own stored centre, `TextBlockInEllipse.java`), not the fixed
 * `cy + 2.6667` constant those two hand-rolled shapes used.
 *
 * Mirrors `description/renderer-entity.ts#buildEntityParams` field-for-
 * field, sourced from `ClassifierGeo` instead of `DescriptionNodeGeo` —
 * a parallel assembly of the SAME upstream params, not a call to it (this
 * engine's own `class-layout-leaf-shapes.ts#measureUsecaseOrActor`
 * already established this "route through the description engine's
 * faithful primitives, keep the composition class-local" split for
 * SIZING; this is the matching DRAW half, ADR-1/ADR-2).
 *
 * Deliberately NOT threaded (same scope as the pre-T4 icon renderers,
 * zero behavior change): `classifier.color` (inline `usecase Foo #red`
 * override — the old `renderUseCaseIcon`/`renderActorIcon` never read it
 * either), stereotype labels (class-diagram usecase/actor carries none),
 * `deltaShadow` (class-geo-types.ts's own `ClassifierGeo.shadowing` doc
 * comment: jar draws no shadow for an `EntityImageDescription`-family
 * shape here) and `hexagonPolygon` (neither symbol is a hexagon). Entity
 * hyperlinks ARE threaded (cdd3-T10, S-11: `classifier.url`).
 *
 * @see ~/git/plantuml/.../svek/image/EntityImageDescription.java
 * @see plans/si14-usymbol-measurement-sharing/decisions.md (ADR-1, ADR-2)
 */
import type { ClassifierGeo } from './class-geo-types.js';
import { resolveElementPaint, resolveElementLineThickness } from '../../core/theme.js';
import type { ScaledTheme } from './class-scale-geo.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { renderDrawableToFragment, type DrawableFragment } from '../../core/klimt/document-shell.js';
import {
  EntityImageDescription,
  type EntityImageDescriptionParams,
} from '../../core/svek/image/EntityImageDescription.js';
import {
  upstreamKeyword,
  mapComponentStyle,
  textFont,
  entityTitleStyles,
  resolveActorStyle,
} from '../../core/decoration/symbol/usymbol-resolve.js';
import { makeAtomImageResolverFor } from '../../core/creole-atoms-image-resolver.js';
import type { USymbol } from '../../core/descriptive-keywords.js';

/** Jar default line thickness for an `EntityImageDescription`-family shape
 *  with no `LineThickness` skinparam override — see `renderer-entity.ts
 *  #ENTITY_STROKE_WIDTH`'s identical citation (`sacuso-94-gugi476/in.svg`:
 *  `style="...stroke-width:0.5;"`). Duplicated (not imported) — that
 *  constant is module-private in a file outside this task's write-set.
 *  cdd-B8FU: multiplied by `theme.scaleK` at its one call site below (both
 *  the override tier from `resolveElementLineThickness` and this default
 *  tier — "materialize the fallback", same rule as `attributeFontSize`). */
const ENTITY_STROKE_WIDTH = 0.5;

/** cdd-T22 (cacoma-43-poxu615) / cdd3-T12 (sijisi-94-ripu606): `ENTITY_
 *  ROUND_CORNER`, duplicated (not imported, same reason as
 *  `ENTITY_STROKE_WIDTH` above) from `description/renderer-entity.ts`.
 *  Upstream computes this UNCONDITIONALLY for every `EntityImageDescription`
 *  leaf (`EntityImageDescription.java:168`: `final double roundCorner =
 *  styleTitle.value(PName.RoundCorner).asDouble();`) — the classDiagram-
 *  scoped `element { RoundCorner 5 }` cascade (`plantuml.skin:193-197`)
 *  applies to every descriptive leaf's `element` `SName`, not just
 *  `component`. Only the shapes that actually READ `SymbolContext
 *  #getRoundCorner()` in their `drawRect`/`drawComponent2` show it:
 *  `USymbolComponent2#drawComponent2` and `USymbolRectangle#drawRect`
 *  (`USymbolRectangle.ts` ported from `USymbolRectangle.java:65-71` — the
 *  `diagonalCorner > 0 ? rect.diagonalCorner(...) : rect.rounded(roundCorner)`
 *  branch) — usecase/actor/circle/database's shapes ignore the field
 *  entirely, so passing this same value to them is a no-op, not a
 *  divergence (verified: `class-circle-usymbol-routing.test.ts`'s circle/
 *  component draw assertions are unchanged by this widening).
 *  `driver-rectangle-svg.ts` halves `roundCorner` at serialization (`rx =
 *  rx/2`), so 5.0 emits the jar's `rect/@rx="2.5"` (`sijisi-94-ripu606`'s
 *  golden `foo3` leaf: `<rect ... rx="2.5" ry="2.5"/>`). cdd-B8FU:
 *  multiplied by `theme.scaleK` at its one call site below. */
const ELEMENT_ROUND_CORNER = 5.0;

/**
 * `EntityImageDescriptionParams.symbol.keyword` for one class-diagram leaf
 * routed through this file: `usecase`/`descriptive`+`actor` (SI14 T4),
 * plus cdd-T22's `circle` (E8) and `descriptive`+`component` (cacoma)
 * additions, plus cdd3-T12's `descriptive`+`rectangle` (sijisi) addition.
 * The cast on the `descriptive` fallback documents a caller-enforced
 * invariant (`renderer.ts`'s own dispatch gate forwards ONLY `usymbol ===
 * 'actor' | 'component' | 'database' | 'node' | 'rectangle' | 'package'` here, never a raw
 * business-suffix keyword) — not an external-data guess.
 */
function resolveSymbolKeyword(classifier: ClassifierGeo): USymbol {
  if (classifier.kind === 'usecase') return 'usecase';
  if (classifier.kind === 'circle') return 'circle';
  return (classifier.usymbol as USymbol | undefined) ?? 'actor';
}

/**
 * Assembles `EntityImageDescriptionParams` for one usecase/actor/circle/
 * component leaf, from exactly what `ClassifierGeo` + `Theme` already
 * carry — the draw-time counterpart to `class-layout-leaf-shapes.ts
 * #measureUsecaseOrActor`/`#measureCircleInterface`'s sizing-time params
 * (`leaf-sizing-entity.ts#buildSizingEntityParams` for usecase/actor), now
 * with REAL paint instead of a sizing placeholder.
 *
 * `roundCorner`: 0 for usecase/actor/circle (`TextBlockInEllipse`,
 * `ActorStickMan`, `CircleInterface2` all ignore `SymbolContext
 * #getRoundCorner` entirely), {@link COMPONENT_ROUND_CORNER} for
 * `component` (`USymbolComponent2#drawComponent2` DOES read it — the
 * jar's `rect/@rx="2.5"` on `cacoma-43-poxu615`, structural diff before
 * this task). `diagonalCorner: 0` for all four (unused by every shape this
 * file reaches).
 */
/**
 * cdd-B7FU-R3 (`daxeno-00-kasu166`): `desc`/`name` alignment is symbol-
 * scoped, not a blanket CENTER -- `EntityImageDescription.java:175,183-191`'s
 * `defaultAlign = styleTitle.getHorizontalAlignment()` reads the TITLE-
 * scoped signature (`{root, element, <diagram>, symbol.getSNames(), title}`),
 * which `plantuml.skin:452-454`'s bare `usecase { HorizontalAlignment
 * center }` selector matches (a one-component style selector matches any
 * signature CONTAINING it, upstream's subsequence cascade) for `usecase`
 * ONLY -- no equivalent rule exists for `actor`/`component`/`circle`/
 * `database`, so those four fall through to `root { HorizontalAlignment
 * left }` (`plantuml.skin:12`). Jar-verified `daxeno-00-kasu166`'s two-line
 * `<<Database>>` leaf: `"styled"` (18px) and `"should be styled"` (14px)
 * draw flush at the SAME `@x` (16) despite their different widths -- CENTER
 * would offset the narrower line right by half the width delta, which is
 * NOT what the golden SVG shows. `usecase` keeps CENTER (unchanged from
 * before this task, and jar-verified correct by its own selector).
 */
function titleAlignmentFor(symbolKeyword: USymbol): HorizontalAlignment {
  return symbolKeyword === 'usecase' ? HorizontalAlignment.CENTER : HorizontalAlignment.LEFT;
}

function buildUSymbolEntityParams(
  classifier: ClassifierGeo,
  theme: ScaledTheme,
  sprites: SpriteRegistry | undefined,
): EntityImageDescriptionParams {
  const symbolKeyword = resolveSymbolKeyword(classifier);
  const display = classifier.rows[0]?.text ?? classifier.id;
  const fontTitle = textFont(theme, symbolKeyword, 0, entityTitleStyles(symbolKeyword));
  const fontStereo = textFont(theme, symbolKeyword, 0, undefined, 'stereotype');
  // cdd3-T28 (E3-14): unconditional, as upstream computes it (see
  // ELEMENT_ROUND_CORNER's doc) -- `package`'s `USymbolFolder` tab reads it
  // too (the jar's `A2.5,2.5` arcs on gujigi-63-roki030).
  const roundCorner = ELEMENT_ROUND_CORNER * theme.scaleK;
  const titleAlignment = titleAlignmentFor(symbolKeyword);
  return {
    // cdd3-T10 (S-11): the entity's own url (`getUrl99()`), drawn by
    // `EntityImageDescription#drawU`'s `startUrl`/`closeUrl` pair.
    entity: { name: classifier.id, uid: '', qualifiedName: classifier.id, location: null, url: classifier.url ?? null },
    symbol: {
      keyword: upstreamKeyword(symbolKeyword),
      actorStyle: resolveActorStyle(theme.actorStyle),
      componentStyle: mapComponentStyle(theme.componentStyle),
    },
    // cdd3-T28 (E3-14): `codeDisplay` is `entity.getName()` (java:180) -- the
    // leaf id, as the sizer's `measureShownFolderTitle(node.id, ...)` reads.
    labels: { codeName: classifier.id, displayText: display, stereotypeLabels: [] },
    paint: {
      forecolor: resolveElementPaint(theme, symbolKeyword, 'border'),
      backcolor: resolveElementPaint(theme, symbolKeyword, 'background'),
      roundCorner,
      diagonalCorner: 0,
      deltaShadow: 0,
      stroke: UStroke.withThickness(
        (resolveElementLineThickness(theme, symbolKeyword) ?? ENTITY_STROKE_WIDTH) * theme.scaleK,
      ),
      fontTitle,
      // `fc` (`style`, not `styleTitle`, java:173) -- the `desc` font when the
      // display differs from the code name, so a package's bold title style
      // does not leak into its label (`buildDesc`).
      fontBody: textFont(theme, symbolKeyword),
      fontStereo,
      titleAlignment,
      stereotypeAlignment: HorizontalAlignment.CENTER,
    },
    links: [],
    fixCircleLabelOverlapping: theme.fixCircleLabelOverlapping === true,
    atomImageResolverFor: makeAtomImageResolverFor(sprites),
  };
}
// #lizard forgives -- straight-line params-object assembly plus one ternary,
// mirrors renderer-entity.ts#buildEntityParams's identical shape/length for
// the same reason.

/** Whether a class-diagram leaf routes through {@link renderClassUSymbolEntity}
 *  rather than the generic classifier box -- usecase/`descriptive`+actor
 *  (SI14 T4), plus cdd-T22's `circle` (E8) and `descriptive`+`component`
 *  (cacoma-43-poxu615) additions, plus cdd-B7FU-R3's `descriptive`+`database`
 *  addition (`daxeno-00-kasu166`'s collapsed-empty `package "..." <<Database>>
 *  {}` leaf): `core/usymbol-shapes.ts#renderDatabaseIcon` hand-rolls a SINGLE
 *  middle-anchored `<text>` for `display`, with no creole/multi-line support,
 *  where upstream's `USymbolDatabase#asSmall` (`asSmall`, already ported at
 *  `core/decoration/symbol/USymbolDatabase.ts:178-203`) draws a REAL
 *  `TextBlockUtils.mergeTB(stereotype, label, CENTER)` -- exactly what
 *  `EntityImageDescription`'s `desc`/`buildDesc` already builds for
 *  usecase/actor/component.
 *
 *  cdd3-T12 (sijisi-94-ripu606): `descriptive`+`rectangle` addition. Upstream
 *  draws EVERY leaf with a resolved `USymbol` (`Entity#getUSymbol` never
 *  returns null -- `EntityImageDescription.java:217-224`'s own fallback to
 *  `componentStyle().toUSymbol()`) through this SAME `EntityImageDescription`
 *  class; a plain `rectangle "foo3"` leaf under `allow_mixing` resolves to
 *  `USymbols.RECTANGLE` (`USymbolRectangle.java`, already ported at
 *  `core/decoration/symbol/USymbolRectangle.ts`) exactly like `component`
 *  resolves to `USymbols.COMPONENT2`. Pre-T12 this fell through to
 *  `renderClassifierBox` (`renderer.ts#renderClassifier`), which draws the
 *  generic name+members class box complete with its visibility-icon badge --
 *  `sijisi-94-ripu606`'s golden `foo3` has neither members nor a badge, only
 *  a plain `rx="2.5"`-rounded rect and a left-anchored `<text>`.
 *
 *  The other three `usymbol-shapes.ts` icons (`renderComponentIcon` is dead
 *  for this engine since `component` routes here too, `renderActorIcon`/
 *  `renderUseCaseIcon` are the SAME pre-existing SI14 T4 story) already had
 *  no live class-engine caller; `renderUSymbolIcon` never had a `rectangle`
 *  entry either (`core/usymbol-shapes.ts:219-224`'s `USYMBOL_ICONS` map),
 *  so this dispatch widening -- not a new icon renderer -- is upstream's own
 *  fix: `rectangle` was never meant to draw as a class box.
 *
 *  cdd3-T28 (E3-14, gujigi-63-roki030): `descriptive`+`package` addition --
 *  an `allowmixing` `package "Elektronisk dokument"` leaf with no body is a
 *  `LeafType.DESCRIPTION` entity with `USymbols.PACKAGE`, which
 *  `GeneralImageBuilder.java:160-167` hands to `EntityImageDescription`
 *  (`USymbolFolder` tab path + bold title), not the class box. Exported so
 *  `renderer.ts`'s own dispatch (over its 500-line cap) stays a single call. */
export function usesClassUSymbolEntity(classifier: ClassifierGeo): boolean {
  if (classifier.kind === 'usecase' || classifier.kind === 'circle') return true;
  return (
    classifier.kind === 'descriptive' &&
    (classifier.usymbol === 'actor' ||
      classifier.usymbol === 'component' ||
      classifier.usymbol === 'database' ||
      // cdd3-T31 (C-8): a `node` leaf is the same `EntityImageDescription`
      // with `USymbols.NODE` (`USymbolNode#asSmall` -> `drawNode`,
      // `USymbolNode.java:71-92`): jar draws the `<polygon>` + fold lines,
      // never the class box this fell through to.
      classifier.usymbol === 'node' ||
      classifier.usymbol === 'rectangle' ||
      classifier.usymbol === 'package')
  );
}

/**
 * Draws one usecase/actor/circle/component/database/rectangle `ClassifierGeo` via
 * `EntityImageDescription.drawU`, translated to its absolute layout
 * position (mirrors `description/renderer-entity.ts#drawEntity`'s
 * `ug.apply(new UTranslate(node.x, node.y))` positioning), and unwraps the
 * result via T1's `renderDrawableToFragment` seam (ADR-2). The returned
 * fragment's `body` already carries EntityImageDescription's OWN
 * `<!--entity NAME--><g class="entity" ...>` wrap (`DecorateEntityImage.ts
 * #decorateEntityDrawing`) — jar-verified against `class-usecase-inline-
 * sprite/golden.svg`'s `<!--entity UC1-->`, NOT the class engine's own
 * `renderer-group.ts#wrapEntity` `<!--class NAME-->` comment every OTHER
 * classifier kind gets — so the caller must splice `body` in directly,
 * never re-wrap it with `wrapEntity`.
 *
 * `uid` doubles as both the entity's own `data-uid`/`id` attribute value
 * AND the fragment's id-namespace seed (`RenderDrawableToFragmentOptions
 * .uid`'s own doc comment) — the SAME uid `renderClass`'s classifier loop
 * already assigns via `uidPlan.classifierUid`, so reusing it here needs no
 * new uniqueness scheme.
 */
export function renderClassUSymbolEntity(
  classifier: ClassifierGeo,
  theme: ScaledTheme,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
  uid: string,
): DrawableFragment {
  const params = buildUSymbolEntityParams(classifier, theme, sprites);
  const image = new EntityImageDescription({ ...params, entity: { ...params.entity, uid } });
  const drawable: UDrawable = {
    drawU(ug: UGraphic): void {
      image.drawU(ug.apply(new UTranslate(classifier.x, classifier.y)));
    },
  };
  return renderDrawableToFragment(drawable, {
    width: classifier.x + classifier.width,
    height: classifier.y + classifier.height,
    measurer,
    uid,
  });
}
