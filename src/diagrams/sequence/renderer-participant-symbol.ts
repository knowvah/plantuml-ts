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
 * The sequence engine scales its layout INPUTS at the layout→render boundary
 * (`scale-geo.ts`), but the glyph geometry below comes from klimt's own
 * upstream pixel constants, which no input scaling can reach. This module
 * therefore uses klimt's OWN scale seam — `SvgOption.scale`, applied in
 * `SvgGraphicsCore#format` exactly as upstream's `SvgGraphics.java:466-473`
 * does — and hands klimt an UNSCALED position (`geo.x / k`), so the emitted
 * coordinate is `(geo.x / k) * k`. No `<g transform="scale(...)">` wrapper is
 * ever produced, matching the jar (see `scale-geo.ts`'s header: the only
 * upstream `transform="scale(...)"` is `manageScale`, for embedded sprites).
 * `k` is 1 for every fixture without a `scale` directive, where the
 * round-trip is exact; elsewhere it is exact to the emitter's 4-decimal
 * rounding.
 *
 * ## What this module does NOT draw
 *
 * The participant's own LABEL. `renderer.ts#renderNameBlock` already draws it
 * — with stereotype rows and sprite badges this engine models separately from
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

import type { Paint } from '../../core/paint.js';
import type { Theme } from '../../core/theme.js';
import { resolveElementLineThickness, resolveElementShadowing } from '../../core/theme.js';
import { WidthTableMeasurer } from '../../core/measurer.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import type { ScaledTheme } from './scale-geo.js';

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import { SymbolContext } from '../../core/decoration/symbol/SymbolContext.js';
import { USymbolDatabase, getMargin as databaseMargin } from '../../core/decoration/symbol/USymbolDatabase.js';
import { USymbolQueue, getMargin as queueMargin } from '../../core/decoration/symbol/USymbolQueue.js';
import { Boundary } from '../../core/svek/Boundary.js';
import { Control } from '../../core/svek/Control.js';
import { EntityDomain } from '../../core/svek/EntityDomain.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { seedOf } from '../../core/klimt/drawing/svg/svg-seed.js';
import type { StringBounder as DriverStringBounder } from '../../core/klimt/drawing/svg/driver-text-svg.js';
import { extractFlatContent, VERSION_PLACEHOLDER } from '../../core/klimt/document-shell.js';

/** The glyph-bearing participant types. `actor` is deliberately absent — it is
 *  an `ActorStyle` case, not a symbol one (D4), and lands in T6. `participant`
 *  is absent because its component draws a bare box with no glyph at all. */
export type SymbolParticipantType = 'database' | 'collections' | 'queue' | 'entity' | 'boundary' | 'control';

/** The already-laid-out participant box, in RENDER (post-`scale-geo`)
 *  coordinates. `background`/`border` are optional so a caller may pass a bare
 *  rectangle, and are satisfied structurally by `ParticipantGeo`, whose
 *  `background`/`border` carry the inline-`#color`-over-style precedence
 *  `sequence-layout-participants.ts#resolveParticipantBackground` resolved. */
export interface ParticipantSymbolGeo {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly background?: Paint;
  readonly border?: Paint;
}

/** `head` flips the glyph/text order exactly as `ComponentRoseDatabase.java
 *  :81-87` does. There is deliberately no `measurer` here: no branch below
 *  lays out text (see the module header), so one would be a knob with no
 *  caller. */
export interface ParticipantSymbolOpts {
  readonly head: boolean;
  readonly display: string;
  readonly theme: ScaledTheme;
}

/**
 * `element { LineThickness 0.5 }` — the bucket every participant kind's style
 * signature inherits (`ParticipantType#getStyleSignature`: `root, element,
 * sequenceDiagram, <kind>`), with no `sequenceDiagram` override for any of the
 * six kinds here.
 *
 * @see ~/git/plantuml/src/main/resources/skin/plantuml.skin:91-93
 */
const PARTICIPANT_LINE_THICKNESS = 0.5;

/**
 * `RoundCorner 5` is scoped to `sequenceDiagram { participant { ... } }`
 * alone (`skin/plantuml.skin:183-185`) and `COLLECTIONS`'s signature does not
 * include the `participant` bucket (`ParticipantType.java:77-78`), so the
 * collections rectangles fall through to the root default `RoundCorner 0`
 * (`skin/plantuml.skin:13`).
 */
const COLLECTIONS_ROUND_CORNER = 0;

/** `ComponentRoseParticipant#getDeltaCollection` — the offset of the second,
 *  "stacked" rectangle, and the term added to both preferred dimensions.
 *  @see ~/git/plantuml/.../skin/rose/ComponentRoseParticipant.java:107-112 */
const COLLECTIONS_DELTA = 4;

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
const MEASURER = new WidthTableMeasurer();
const NO_BOUNDER: StringBounder = new MeasurerStringBounder(MEASURER);

/** `DriverTextSvg`'s own width-only seam. Every consumer of it defines its own
 *  local adapter (`document-shell.ts#driverBounderFor`,
 *  `description/renderer-ink-extent.ts#driverBounderFor`) rather than sharing
 *  one; this is the third. It is never consulted in practice — no glyph here
 *  draws a `UText` — but `UGraphicSvg.build` requires one. */
const DRIVER_BOUNDER: DriverStringBounder = {
  calculateDimension: (font, text) => ({ width: MEASURER.measure(text, font).width }),
};

/**
 * `ComponentRoseDatabase.java:66-69` — `new Fashion(biColor.getBackColor(),
 * biColor.getForeColor()).withStroke(getStroke()).withShadow(
 * biColor.getDeltaShadow())`, with the kind's own resolved colours standing in
 * for `getSymbolContext()`'s style lookup.
 */
function symbolContextFor(
  type: SymbolParticipantType,
  geo: ParticipantSymbolGeo,
  theme: Theme,
  roundCorner = 0,
): SymbolContext {
  const thickness = resolveElementLineThickness(theme, type) ?? PARTICIPANT_LINE_THICKNESS;
  return new SymbolContext(
    geo.background ?? null,
    geo.border ?? null,
    UStroke.withThickness(thickness),
    resolveElementShadowing(theme, type),
    roundCorner,
    0,
  );
}

/** `ComponentRoseParticipant#drawInternalU:93-96` — the stacked rectangle
 *  drawn BEHIND the participant's own box, `getDeltaCollection()` to its
 *  right and that much shorter in both axes. */
function collectionsGlyph(geo: ParticipantSymbolGeo, ctx: SymbolContext): TextBlock {
  const width = geo.width - COLLECTIONS_DELTA;
  const height = geo.height - COLLECTIONS_DELTA;
  return {
    calculateDimension: (): XDimension2D => new XDimension2D(width, height),
    drawU(ug: UGraphic): void {
      const box = URectangle.build(width, height).rounded(COLLECTIONS_ROUND_CORNER);
      box.setDeltaShadow(ctx.getDeltaShadow());
      ctx.apply(ug).draw(box);
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

/** The `ComponentRose*` dispatch of `Rose.java:157-190`, one arm per kind. */
function glyphFor(type: SymbolParticipantType, geo: ParticipantSymbolGeo, theme: Theme): TextBlock {
  if (type === 'collections')
    return collectionsGlyph(geo, symbolContextFor(type, geo, theme, COLLECTIONS_ROUND_CORNER));
  const ctx = symbolContextFor(type, geo, theme);
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
 * `ComponentRoseParticipant` draws both rectangles at fixed offsets.
 */
function glyphOffset(
  type: SymbolParticipantType,
  geo: ParticipantSymbolGeo,
  glyph: XDimension2D,
  head: boolean,
): UTranslate {
  const dx = (geo.width - glyph.getWidth()) / 2;
  if (type === 'collections') return new UTranslate(COLLECTIONS_DELTA, 0);
  if (type === 'queue') return new UTranslate(dx, 0);
  return new UTranslate(dx, head ? 0 : geo.height - glyph.getHeight());
}

/**
 * `getPreferredWidth`/`getPreferredHeight`'s glyph term
 * (`ComponentRoseDatabase.java:95-105`) — the glyph half only. See the module
 * header for which composition rule each kind's caller must apply; the value
 * is a pure upstream constant for five of the six kinds and the collections
 * delta for the sixth, so no `Theme` lookup reaches it.
 */
export function measureParticipantSymbol(
  type: SymbolParticipantType,
  _theme: Theme,
): { width: number; height: number } {
  if (type === 'collections') return { width: COLLECTIONS_DELTA, height: COLLECTIONS_DELTA };
  if (type === 'queue') {
    const margin = queueMargin();
    return { width: margin.getWidth(), height: margin.getHeight() };
  }
  if (type === 'boundary' || type === 'control' || type === 'entity') {
    const probe = simpleGlyph(type, NO_PAINT).calculateDimension(NO_BOUNDER);
    return { width: probe.getWidth(), height: probe.getHeight() };
  }
  const margin = databaseMargin();
  const dim = margin.addDimension(new XDimension2D(DATABASE_LABEL.width, DATABASE_LABEL.height));
  return { width: dim.getWidth(), height: dim.getHeight() };
}

/**
 * Draws one participant glyph and returns its SVG fragment, positioned
 * absolutely at `geo`.
 *
 * Builds its own single-drawable `UGraphicSvg` document and unwraps it — the
 * mechanism `document-shell.ts#renderDrawableToFragment` established (SI14
 * ADR-2), inlined here only so `SvgOption.scale` can be threaded (see the
 * module header's Scale section; that helper hard-codes scale 1).
 */
export function renderParticipantSymbol(
  type: SymbolParticipantType,
  geo: ParticipantSymbolGeo,
  opts: ParticipantSymbolOpts,
): string {
  const k = opts.theme.scaleK;
  const option = basicSvgOption({
    scale: k,
    minDim: { width: (geo.x + geo.width) / k, height: (geo.y + geo.height) / k },
  });
  const ug = UGraphicSvg.build(seedOf(`${type}:${geo.x},${geo.y}`), option, VERSION_PLACEHOLDER, DRIVER_BOUNDER, MEASURER);

  const unscaled: ParticipantSymbolGeo = { ...geo, x: geo.x / k, y: geo.y / k, width: geo.width / k, height: geo.height / k };
  const glyph = glyphFor(type, unscaled, opts.theme);
  const offset = glyphOffset(type, unscaled, glyph.calculateDimension(ug.getStringBounder()), opts.head);
  glyph.drawU(ug.apply(new UTranslate(unscaled.x, unscaled.y)).apply(offset));

  const { body, extraDefs } = extractFlatContent(ug.getSvgString());
  // A shadowed glyph (`skinparam shadowing`) emits a `<filter>` its shape
  // references by id. The contract returns one string, and `<defs>` is a legal
  // child anywhere the caller splices this in, so the defs ride along inline
  // rather than being dropped and leaving a dangling `filter="url(#...)"`.
  return extraDefs.length > 0 ? `<defs>${extraDefs}</defs>${body}` : body;
}
