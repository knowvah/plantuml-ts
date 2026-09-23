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
 * shape here), `hexagonPolygon` (neither symbol is a hexagon), and entity
 * hyperlinks (`entity.url: null` — `EntityImageDescription.drawU` throws
 * on a non-null url; class-diagram usecase/actor url-wrapping was never
 * implemented pre-T4 either, so this is not a new gap).
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

/** cdd-T22 (cacoma-43-poxu615): `ENTITY_ROUND_CORNER`, duplicated (not
 *  imported, same reason as `ENTITY_STROKE_WIDTH` above) from
 *  `description/renderer-entity.ts`. `driver-rectangle-svg.ts` halves
 *  `roundCorner` at serialization (`rx = rx/2`), so 5.0 emits the jar's
 *  `rect/@rx="2.5"` (`USymbolComponent2#drawComponent2` reads
 *  `SymbolContext#getRoundCorner()` for its outer box — unlike usecase/
 *  actor/circle's shapes, which ignore it entirely, see
 *  `buildUSymbolEntityParams`'s own doc comment). cdd-B8FU: multiplied by
 *  `theme.scaleK` at its one call site below. */
const COMPONENT_ROUND_CORNER = 5.0;

/**
 * `EntityImageDescriptionParams.symbol.keyword` for one class-diagram leaf
 * routed through this file: `usecase`/`descriptive`+`actor` (SI14 T4),
 * plus cdd-T22's `circle` (E8) and `descriptive`+`component` (cacoma)
 * additions. The cast on the `descriptive` fallback documents a
 * caller-enforced invariant (`renderer.ts`'s own dispatch gate forwards
 * ONLY `usymbol === 'actor' | 'component'` here, never a raw business-
 * suffix keyword) — not an external-data guess.
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
  const fontTitle = textFont(theme, symbolKeyword);
  const fontStereo = textFont(theme, symbolKeyword, 0, undefined, 'stereotype');
  const roundCorner = symbolKeyword === 'component' ? COMPONENT_ROUND_CORNER * theme.scaleK : 0;
  const titleAlignment = titleAlignmentFor(symbolKeyword);
  return {
    entity: { name: classifier.id, uid: '', qualifiedName: classifier.id, location: null, url: null },
    symbol: {
      keyword: upstreamKeyword(symbolKeyword),
      actorStyle: resolveActorStyle(theme.actorStyle),
      componentStyle: mapComponentStyle(theme.componentStyle),
    },
    labels: { codeName: display, displayText: display, stereotypeLabels: [] },
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
 *  usecase/actor/component. Only `database` was missing from this dispatch;
 *  the other three `usymbol-shapes.ts` icons (`renderComponentIcon` is dead
 *  for this engine since `component` routes here too, `renderActorIcon`/
 *  `renderUseCaseIcon` are the SAME pre-existing SI14 T4 story) already had
 *  no live class-engine caller. Exported so `renderer.ts`'s own dispatch
 *  (over its 500-line cap) stays a single call. */
export function usesClassUSymbolEntity(classifier: ClassifierGeo): boolean {
  if (classifier.kind === 'usecase' || classifier.kind === 'circle') return true;
  return (
    classifier.kind === 'descriptive' &&
    (classifier.usymbol === 'actor' || classifier.usymbol === 'component' || classifier.usymbol === 'database')
  );
}

/**
 * Draws one usecase/actor/circle/component `ClassifierGeo` via
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
