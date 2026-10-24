/**
 * renderer-participant-symbol.ts — the sequence engine's participant GLYPH
 * seam: a sequence-local mirror of upstream's `ComponentRose*` family
 * (`skin/rose/Rose.java#createComponentParticipant`, `:137-190`) that drives
 * the SHARED, already-ported primitives instead of hand-rolling SVG.
 *
 * Replaces `renderer-participant-shapes.ts#renderDatabaseShape`'s
 * `rect + line + line + ellipse` with the one `UPath` pair upstream actually
 * draws (`USymbolDatabase.java:62-79`) — a structural divergence, so it is
 * re-mirrored rather than patched (D1, D2 of this mission).
 *
 * ## What upstream ACTUALLY dispatches to (read from `Rose.java:137-190`)
 *
 * The six glyph-bearing participant kinds do NOT share one mechanism. Only
 * two are `USymbol`-backed; the mission brief's framing of all six as
 * "USymbol types" is corrected here and in the decision journal:
 *
 * | kind | upstream component | glyph source |
 * |---|---|---|
 * | `database` | `ComponentRoseDatabase` | `USymbols.DATABASE.asSmall(null, empty(16,17), empty(0,0), ctx, CENTER)` (`ComponentRoseDatabase.java:70`) |
 * | `queue` | `ComponentRoseQueue` | `USymbols.QUEUE.asSmall(empty(0,0), getTextBlock(), empty(0,0), ctx, CENTER)` — the label lives INSIDE the glyph |
 * | `boundary` | `ComponentRoseBoundary` | `new Boundary(biColor)` — a `svek/` drawing class, NOT a `USymbol` |
 * | `control` | `ComponentRoseControl` | `new Control(biColor)` — likewise |
 * | `entity` | `ComponentRoseEntity` | `new EntityDomain(biColor)` — likewise |
 * | `collections` | `ComponentRoseParticipant(collections=true)` | no symbol at all: a SECOND `URectangle` offset by `getDeltaCollection() = 4` (`ComponentRoseParticipant.java:93-96, :107-112`) |
 * | `actor` | `ComponentRoseActor` | `actorStyle.getTextBlock(biColor)` → `ActorStickMan` / `ActorAwesome` / `ActorHollow` (`ActorStyle.java:60-71`) — an `ActorStyle` case, NOT a `USymbol` one (D4) |
 *
 * ## Composition rules — which arithmetic each kind's SIZER must use
 *
 * `measureParticipantSymbol` returns the glyph half only; the caller composes
 * it with its own text measurement, and the composition is per-family:
 *
 * - `database`, `boundary`, `control`, `entity` —
 *   `width  = max(glyphW, textW)`, `height = glyphH + textH`
 *   (`ComponentRoseDatabase.java:96-105` and the identical bodies in
 *   `ComponentRoseBoundary`/`Control`/`Entity`).
 * - `queue` — `width = marginW + textW`, `height = marginH + textH`
 *   (`ComponentRoseQueue#getPreferredWidth/Height` returns the glyph's own
 *   dimension, and that glyph is `USymbolQueue#asSmall`'s
 *   `getMargin().addDimension(dimStereo.mergeTB(dimLabel))`), so the value
 *   returned here for `queue` is `USymbolQueue#getMargin()`'s own extent.
 * - `collections` — `width = textW + margins + shadow + 4`,
 *   `height = textH + margins + shadow + 1 + 4`
 *   (`ComponentRoseParticipant.java:114-124`); the value returned here is
 *   the `+4` delta alone.
 *
 * ## Scale
 *
 * The glyph geometry comes from klimt's own upstream pixel constants, which no
 * input scaling can reach, and it is drawn on the page's one graphic at scale
 * 1 (`renderer-ug.ts`): the page is drawn at `DRAW_SCALE = 1`, and a `scale`
 * directive or `skinparam dpi` is the exporter's single `SvgGraphics#format`
 * pass over the finished body (`SvgGraphics.java:466-473`). No
 * `<g transform="scale(...)">` wrapper is ever produced, matching the jar
 * (the only upstream `transform="scale(...)"` is `manageScale`, for embedded
 * sprites).
 *
 * ## What this module does NOT draw
 *
 * The participant's own LABEL. `renderer-participant-shapes.ts#drawNameBlock`
 * draws it — with stereotype rows and sprite badges this engine models separately from
 * upstream's single `getTextBlock()` — and the render half holds no
 * `StringMeasurer` to lay text out with. `opts.display` is accepted (it is
 * part of the contract T2-T5 compile against, and `queue`'s text-inside form
 * will need it) but no branch reads it yet: `queue`'s glyph is sized from the
 * caller's already-laid-out box instead, which needs no measurement.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/Rose.java#createComponentParticipant
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseDatabase.java
 * @see src/diagrams/class/renderer-usymbol-entity.ts — the same "faithful
 *      primitives, engine-local composition" split (SI14 ADR-1/ADR-2)
 */

import type { ParticipantType } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { SequencePaint } from './sequence-skin-param.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import type { PageTheme } from './renderer-ug.js';

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { SymbolContext } from '../../core/decoration/symbol/SymbolContext.js';
import { USymbolDatabase, getMargin as databaseMargin } from '../../core/decoration/symbol/USymbolDatabase.js';
import { USymbolQueue, getMargin as queueMargin } from '../../core/decoration/symbol/USymbolQueue.js';
import { actorStyleGetTextBlock } from '../../core/skin/ActorStyle.js';
import { resolveActorStyle } from '../../core/decoration/symbol/usymbol-resolve.js';
import { Boundary } from '../../core/svek/Boundary.js';
import { Control } from '../../core/svek/Control.js';
import { EntityDomain } from '../../core/svek/EntityDomain.js';

/** The SYMBOL-backed participant types — those whose glyph comes from a
 *  `USymbol` or a `svek/` drawing class. `actor` is deliberately absent: it is
 *  an `ActorStyle` case, not a symbol one (D4), and `participant` is absent
 *  because its component draws a bare box with no glyph at all. */
export type SymbolParticipantType = 'database' | 'collections' | 'queue' | 'entity' | 'boundary' | 'control';

/** Every kind with a GLYPH. `actor` joins the symbol types here and only
 *  here: `ComponentRoseActor` is byte-for-byte the same component as
 *  `ComponentRoseDatabase` — same `topRightBottomLeft(0, 3, 0, 3)` padding,
 *  same `drawInternalU`, same `getPreferredWidth`/`Height`
 *  (`ComponentRoseActor.java:44-84`) — differing ONLY in where the glyph comes
 *  from, `actorStyle.getTextBlock(biColor)` instead of `USymbols.*.asSmall`
 *  (`:50`). Keeping the two type names distinct preserves D4's correction;
 *  sharing one composition avoids re-deriving it. */
export type GlyphParticipantType = SymbolParticipantType | 'actor';

/** The already-laid-out participant box, in RENDER
 *  coordinates, and the participant's merged-style paint (`ParticipantGeo
 *  .paint`). For `participant` and `collections` the box is the PAINTED one
 *  (`participantBoxOf`). */
export interface ParticipantSymbolGeo {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly paint: SequencePaint;
  /** The participant's resolved delta shadow (`ParticipantGeo.shadow`), in
   *  the same units as the box; 0 or absent draws none. */
  readonly shadow?: number;
}

/** `head` flips the glyph/text order exactly as `ComponentRoseDatabase.java
 *  :81-87` does. There is deliberately no `measurer` here: no branch below
 *  lays out text (see the module header), so one would be a knob with no
 *  caller. */
export interface ParticipantSymbolOpts {
  readonly head: boolean;
  readonly display: string;
  readonly theme: PageTheme;
}

/** `ComponentRoseParticipant#getDeltaCollection` — the offset of the second,
 *  "stacked" rectangle, and the term added to both preferred dimensions.
 *  Exported because all three sides of this feature need the SAME number and a
 *  cited constant should exist once: the seam offsets the back rectangle by
 *  it, `renderer-participant-shapes.ts` offsets the front one, and
 *  `sequence-layout-participants.ts` adds it to both preferred dimensions.
 *  @see ~/git/plantuml/.../skin/rose/ComponentRoseParticipant.java:107-112 */
export const COLLECTIONS_DELTA = 4;

/** The two empty blocks `ComponentRoseDatabase.java:70` passes as the
 *  cylinder's label and stereotype. The `16,17` is that line's own literal. */
const DATABASE_LABEL = { width: 16, height: 17 };

/** Every `ComponentRose*` in this family passes `TextBlockUtils.empty(0, 0)`
 *  for the blocks it does not use. */
const EMPTY = TextBlockUtils.empty(0, 0);

/** Measure-only stand-ins. `Boundary`/`Control`/`EntityDomain` each declare
 *  their `calculateDimension` parameter as `_stringBounder` and return pure
 *  `radius`/`margin`/`left` arithmetic, so neither the paint nor the bounder
 *  can reach the result — `NO_BOUNDER` is a real measurer-backed bounder, not
 *  a stub, so if that ever stops being true the answer degrades to a wrong
 *  number the pinned dimensions in `renderer-participant-symbol.test.ts`
 *  reject rather than to a silently plausible one. */
const NO_PAINT = new SymbolContext(null, null);

/** `Style#getStroke()` (`Style.java:299-320`): the thickness, dashed when the
 *  style's `LineStyle` names a dash. */
function strokeOf(paint: SequencePaint): UStroke {
  const dash = paint.dash;
  return dash === undefined ? UStroke.withThickness(paint.thickness) : new UStroke(dash[0]!, dash[1]!, paint.thickness);
}

/**
 * Each component's `Fashion`, read off the merged style:
 * - `ComponentRoseDatabase.java:66-69` re-builds it as `new Fashion(back,
 *   fore).withStroke(getStroke()).withShadow(deltaShadow)` -- no corners;
 * - `ComponentRoseActor`/`Boundary`/`Control`/`Entity`/`Queue` pass
 *   `getSymbolContext()` itself (`ComponentRoseActor.java:63-64` and
 *   siblings), which carries `withCorner(RoundCorner, DiagonalCorner)`
 *   (`Style.java:270-281`);
 * - `ComponentRoseParticipant` applies the colours and `getStroke()` and
 *   rounds its rectangle by `getRoundCorner()`/`getDiagonalCorner()`
 *   (`ComponentRoseParticipant.java:73-84,94-106`).
 */
function symbolContextFor(type: ParticipantType, geo: ParticipantSymbolGeo): SymbolContext {
  const paint = geo.paint;
  const cornered = type !== 'database';
  return new SymbolContext(
    paint.fill,
    paint.stroke,
    strokeOf(paint),
    geo.shadow ?? 0,
    cornered ? paint.roundCorner : 0,
    cornered ? paint.diagonalCorner : 0,
  );
}

/**
 * `ComponentRoseParticipant#drawInternalU:101-111`: ONE rectangle,
 * `getTextWidth` x `getTextHeight`, rounded and diagonal-cornered by the
 * style; a `collections` head draws it twice, first `getDeltaCollection()`
 * to the right, then that much down. `geo` is the painted box, so the
 * rectangle is `geo` less the delta.
 */
function participantRectangles(geo: ParticipantSymbolGeo, ctx: SymbolContext, collections: boolean): TextBlock {
  const delta = collections ? COLLECTIONS_DELTA : 0;
  const width = geo.width - delta;
  const height = geo.height - delta;
  return {
    calculateDimension: (): XDimension2D => new XDimension2D(geo.width, geo.height),
    drawU(ug: UGraphic): void {
      const rect = URectangle.build(width, height)
        .rounded(ctx.getRoundCorner())
        .diagonalCorner(ctx.getDiagonalCorner());
      rect.setDeltaShadow(ctx.getDeltaShadow());
      ug = ctx.apply(ug);
      if (collections) {
        ug.apply(UTranslate.dx(delta)).draw(rect);
        ug = ug.apply(UTranslate.dy(delta));
      }
      ug.draw(rect);
    },
  };
}

/**
 * `ComponentRoseQueue`'s constructor passes the participant's own text block
 * as `asSmall`'s LABEL, so the glyph's dimension is
 * `getMargin().addDimension(labelDim)`. The render half holds no measurer, so
 * the label extent is recovered from the box the layout already sized:
 * `labelDim = geoDim - marginDim`, which reproduces `geo` exactly.
 */
function queueGlyph(geo: ParticipantSymbolGeo, ctx: SymbolContext): TextBlock {
  const margin = queueMargin();
  const label = TextBlockUtils.empty(
    Math.max(0, geo.width - margin.getWidth()),
    Math.max(0, geo.height - margin.getHeight()),
  );
  return new USymbolQueue().asSmall(EMPTY, label, EMPTY, ctx, HorizontalAlignment.CENTER);
}

/** `ComponentRoseBoundary`/`Control`/`Entity` each build their glyph from the
 *  matching `svek/` drawing class directly — `new Boundary(biColor)` and
 *  siblings — never through a `USymbol`. Their `calculateDimension` is a pure
 *  function of the class's own `radius`/`margin`/`left` fields, so it is safe
 *  to probe with a colourless context (`measureParticipantSymbol`). */
function simpleGlyph(type: 'boundary' | 'control' | 'entity', ctx: SymbolContext): TextBlock {
  if (type === 'boundary') return new Boundary(ctx);
  if (type === 'control') return new Control(ctx);
  return new EntityDomain(ctx);
}

/** The `ComponentRose*` dispatch of `Rose.java:137-190`, one arm per kind. */
function glyphFor(type: ParticipantType, geo: ParticipantSymbolGeo, theme: Theme): TextBlock {
  const ctx = symbolContextFor(type, geo);
  if (type === 'actor') return actorStyleGetTextBlock(resolveActorStyle(theme.actorStyle), ctx);
  if (type === 'participant' || type === 'collections') return participantRectangles(geo, ctx, type === 'collections');
  if (type === 'queue') return queueGlyph(geo, ctx);
  if (type === 'boundary' || type === 'control' || type === 'entity') return simpleGlyph(type, ctx);
  return new USymbolDatabase().asSmall(
    EMPTY,
    TextBlockUtils.empty(DATABASE_LABEL.width, DATABASE_LABEL.height),
    EMPTY,
    ctx,
    HorizontalAlignment.CENTER,
  );
}

/**
 * The glyph's offset inside the participant box.
 *
 * `dx` is `ComponentRoseDatabase.java:79`'s `(getPreferredWidth() -
 * dimStickman.getWidth()) / 2`, shared verbatim by `ComponentRoseBoundary`,
 * `ComponentRoseControl`, `ComponentRoseEntity` and `ComponentRoseQueue`.
 *
 * `dy` is the `head` flip of `:81-87`: at the head the glyph sits at the top
 * and the text is translated down by the glyph's height; at the tail the text
 * comes first and the glyph is translated down by `getTextHeight()`, which is
 * `getPreferredHeight() - glyphHeight`. `queue` and `collections` have no such
 * flip — `ComponentRoseQueue#drawInternalU` applies `dx` only, and
 * `ComponentRoseParticipant` draws its rectangles at fixed offsets inside
 * the painted box.
 */
function glyphOffset(type: ParticipantType, geo: ParticipantSymbolGeo, glyph: XDimension2D, head: boolean): UTranslate {
  const dx = (geo.width - glyph.getWidth()) / 2;
  if (type === 'participant' || type === 'collections') return new UTranslate(0, 0);
  if (type === 'queue') return new UTranslate(dx, 0);
  return new UTranslate(dx, head ? 0 : geo.height - glyph.getHeight());
}

/**
 * `getPreferredWidth`/`getPreferredHeight`'s glyph term
 * (`ComponentRoseDatabase.java:95-105`) — the glyph half only. See the module
 * header for which composition rule each kind's caller must apply; the value
 * is a pure upstream constant for five of the six kinds and the collections
 * delta for the sixth.
 */
export function measureParticipantSymbol(
  type: GlyphParticipantType,
  paint: SequencePaint,
  theme: Theme,
  measurer: StringMeasurer,
): { width: number; height: number } {
  if (type === 'actor') {
    // The ONE kind whose glyph dimension is style-dependent:
    // `ActorStickMan` 27x60 (or 26x33 hollow, 55x61 awesome) per
    // `skinparam actorStyle` (`ActorStyle.java:60-71`), widened and heightened
    // by twice the stroke and heightened by the delta shadow
    // (`ActorStickMan.java:116-122`, `ActorHollow.java:110`).
    const probe = glyphFor(
      'actor',
      { x: 0, y: 0, width: 0, height: 0, paint, shadow: paint.shadowing },
      theme,
    ).calculateDimension(new MeasurerStringBounder(measurer));
    return { width: probe.getWidth(), height: probe.getHeight() };
  }
  if (type === 'collections') return { width: COLLECTIONS_DELTA, height: COLLECTIONS_DELTA };
  if (type === 'queue') {
    const margin = queueMargin();
    return { width: margin.getWidth(), height: margin.getHeight() };
  }
  if (type === 'boundary' || type === 'control' || type === 'entity') {
    const probe = simpleGlyph(type, NO_PAINT).calculateDimension(new MeasurerStringBounder(measurer));
    return { width: probe.getWidth(), height: probe.getHeight() };
  }
  const margin = databaseMargin();
  const dim = margin.addDimension(new XDimension2D(DATABASE_LABEL.width, DATABASE_LABEL.height));
  return { width: dim.getWidth(), height: dim.getHeight() };
}

/**
 * Draws one participant glyph into the page's graphic, positioned absolutely
 * at `geo`: `LivingSpace#drawHeadOrTail`'s `comp.drawU(ug, area, ctx)`
 * (`LivingSpace.java:190-215`) for the glyph half of the component --
 * `glyph.drawU(ug.apply(UTranslate(x, y)).apply(offset))`
 * (`ComponentRoseDatabase.java:81-93` and its siblings).
 *
 * The seam graphic is the page's own (`renderer-ug.ts#openSequenceGraphic`),
 * at scale 1: the page is drawn at `DRAW_SCALE = 1` (`renderer.ts`), the
 * export scale being the exporter's single `SvgGraphics#format` pass, so
 * klimt's pixel constants need no scale here. The drop-shadow filter a
 * shadowed glyph mints, and the id a gradient fill takes, are normalised when
 * the graphic is serialised (`renderer-ug.ts#normaliseMintedIds`).
 */
export function drawParticipantSymbol(
  ug: UGraphic,
  type: ParticipantType,
  geo: ParticipantSymbolGeo,
  opts: ParticipantSymbolOpts,
): void {
  const glyph = glyphFor(type, geo, opts.theme);
  const offset = glyphOffset(type, geo, glyph.calculateDimension(ug.getStringBounder()), opts.head);
  glyph.drawU(ug.apply(new UTranslate(geo.x, geo.y)).apply(offset));
}
