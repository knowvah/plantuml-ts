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
import type { Theme } from '../../core/theme.js';
import { resolveElementPaint, resolveElementLineThickness } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import {
  renderDrawableToFragment,
  type DrawableFragment,
} from '../../core/klimt/document-shell.js';
import {
  EntityImageDescription,
  type EntityImageDescriptionParams,
} from '../../core/svek/image/EntityImageDescription.js';
import { upstreamKeyword, mapComponentStyle, textFont, resolveActorStyle } from '../description/renderer-symbol.js';
import { makeAtomImageResolverFor } from '../description/render-atoms.js';

/** Jar default line thickness for an `EntityImageDescription`-family shape
 *  with no `LineThickness` skinparam override — see `renderer-entity.ts
 *  #ENTITY_STROKE_WIDTH`'s identical citation (`sacuso-94-gugi476/in.svg`:
 *  `style="...stroke-width:0.5;"`). Duplicated (not imported) — that
 *  constant is module-private in a file outside this task's write-set. */
const ENTITY_STROKE_WIDTH = 0.5;

/**
 * Assembles `EntityImageDescriptionParams` for one usecase/actor leaf, from
 * exactly what `ClassifierGeo` + `Theme` already carry — the draw-time
 * counterpart to `class-layout-leaf-shapes.ts#measureUsecaseOrActor`'s
 * sizing-time `buildSizingEntityParams` (`leaf-sizing-entity.ts`), now with
 * REAL paint instead of that function's `SIZING_PLACEHOLDER_COLOR`.
 *
 * `roundCorner`/`diagonalCorner: 0` (not `renderer-entity.ts`'s shared
 * `ENTITY_ROUND_CORNER=5.0`): both drawn shapes here (`TextBlockInEllipse`,
 * `ActorStickMan`) ignore `SymbolContext#getRoundCorner` entirely — only
 * the rectangle-family `USymbol`s consume it — so 0 matches the SAME
 * "unused, matches the sizer's own placeholder" value `sizingPaint`
 * (`leaf-sizing-entity.ts`) already uses for this pair.
 */
function buildUsecaseActorEntityParams(
  classifier: ClassifierGeo,
  theme: Theme,
  sprites: SpriteRegistry | undefined,
): EntityImageDescriptionParams {
  const symbolKeyword = classifier.kind === 'usecase' ? 'usecase' : 'actor';
  const display = classifier.rows[0]?.text ?? classifier.id;
  const fontTitle = textFont(theme, symbolKeyword);
  const fontStereo = textFont(theme, symbolKeyword, 0, undefined, 'stereotype');
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
      roundCorner: 0,
      diagonalCorner: 0,
      deltaShadow: 0,
      stroke: UStroke.withThickness(resolveElementLineThickness(theme, symbolKeyword) ?? ENTITY_STROKE_WIDTH),
      fontTitle,
      fontStereo,
      titleAlignment: HorizontalAlignment.CENTER,
      stereotypeAlignment: HorizontalAlignment.CENTER,
    },
    links: [],
    fixCircleLabelOverlapping: theme.fixCircleLabelOverlapping === true,
    atomImageResolverFor: makeAtomImageResolverFor(sprites),
  };
}
// #lizard forgives -- one straight-line params-object assembly (no
// branching beyond the ternary already counted), mirrors renderer-entity
// .ts#buildEntityParams's identical shape/length for the same reason.

/**
 * Draws one usecase/actor `ClassifierGeo` via `EntityImageDescription
 * .drawU`, translated to its absolute layout position (mirrors
 * `description/renderer-entity.ts#drawEntity`'s `ug.apply(new
 * UTranslate(node.x, node.y))` positioning), and unwraps the result via
 * T1's `renderDrawableToFragment` seam (ADR-2). The returned fragment's
 * `body` already carries EntityImageDescription's OWN `<!--entity
 * NAME--><g class="entity" ...>` wrap (`DecorateEntityImage.ts
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
export function renderUsecaseOrActorEntity(
  classifier: ClassifierGeo,
  theme: Theme,
  measurer: StringMeasurer,
  sprites: SpriteRegistry | undefined,
  uid: string,
): DrawableFragment {
  const params = buildUsecaseActorEntityParams(classifier, theme, sprites);
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
