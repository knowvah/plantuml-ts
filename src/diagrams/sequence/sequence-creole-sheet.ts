/**
 * sequence-creole-sheet.ts — every sequence label sized and drawn through the
 * REAL core creole pipeline (sdd2 T6b, decision D5).
 *
 * Upstream builds every label a sequence component draws with one call in
 * `AbstractTextualComponent`'s constructor:
 *
 * ```java
 * if (display.size() == 1 && display.get(0).length() == 0)
 *     textBlock = new TextBlockEmpty();
 * else
 *     textBlock = display.create0(fc, horizontalAlignment, skinParam, maxMessageSize, CreoleMode.FULL,
 *             fontForStereotype, htmlColorForStereotype, padding.getLeft(), padding.getRight());
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractTextualComponent.java:84-92
 *
 * `create0` dispatches to `getCreole` (`Display.java:692-701`: `skinParam.sheet(...)
 * .createSheet(display)` -> `SheetBlock1` -> `SheetBlock2`) or, for a leading
 * `MessageNumber`, `createMessageNumber` (`:703-712`). Core ports all of it
 * (`core/klimt/creole/DisplayCreole.ts#create0`), so this module is the
 * sequence twin of `activity-creole-sheet.ts`: an `ISkinSimple` over the
 * diagram's sprites, the shared `chromeAtomOps`, and nothing re-implemented.
 * Tables, trees, `----` rules, `<code>`, vector sprites, OpenIconic, emoji,
 * `<math>`, `[[url]]`s and `{{ }}` embeds are core's stripes and atoms.
 *
 * What the engine adds is the boundary D1 draws: renderers hold no measurer,
 * so {@link sequenceLabelBlock} sizes the block AND draws it once, onto a
 * recording graphic (`sequence-label-primitives.ts`), and hands back a
 * {@link LabelBlock}: its dimension and its primitives relative to its
 * top-left, in the jar's emission order.
 *
 * ## The participant head: `createStereotype` without the badge
 *
 * A head's display carries its `Stereotype` (`Participant#getDisplay`,
 * `Participant.java:124-135`), so `create0` takes `createStereotype`
 * (`Display.java:671-690`), which is `getCreole` over the SAME display plus a
 * `TextBlockSprited` around it when the stereotype has a circled character or
 * sprite. Core's `createStereotype` throws (no `CircledCharacter`), and this
 * engine already draws that badge itself (`sequence-layout-participant-label
 * .ts#anyBadgeFor`), so a head with stereotype rows goes straight to the
 * `getCreole` half: {@link LabelOptions.stereotype} is the `Stereotype`
 * element's labels, laid out by `CreoleParser` in the stereotype font
 * (`CreoleParser.java:168-173`).
 */
import type { StringMeasurer } from '../../core/measurer.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { Display } from '../../core/klimt/creole/Display.js';
import { create0, type CreoleMargins, type CreoleRenderContext } from '../../core/klimt/creole/DisplayCreole.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { SheetBlock1 } from '../../core/klimt/creole/SheetBlock1.js';
import { SheetBlock2 } from '../../core/klimt/creole/SheetBlock2.js';
import type { Sheet } from '../../core/klimt/creole/Sheet.js';
import type { DisplayLike, DisplayLine } from '../../core/klimt/creole/SheetBuilder.js';
import type { CreoleAtom } from '../../core/klimt/creole/atom/Atom.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { chromeAtomOps } from '../../core/annotations/blocks-creole.js';
import { GUILLEMET_DEFAULT } from '../../core/text/Guillemet.js';
import { Pragma } from '../../core/skin/Pragma.js';
import { MONOSPACED } from '../../core/klimt/creole/Parser.js';
import { getNestedDiagramRenderer } from '../../core/nested-diagram-registry.js';
import type { NestedDiagramRenderer } from '../../core/EmbeddedDiagram.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { ISkinSimple } from '../../core/style/ISkinSimple.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UGraphicStencil } from '../../core/klimt/drawing/UGraphicStencil.js';
import { getSprite, type SpriteRegistry } from '../../core/sprite-registry.js';
import type { Paint } from '../../core/paint.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { MessageNumber } from '../../core/sequencediagram/MessageNumber.js';
import { BodyFactory } from '../../core/cucadiagram/BodyFactory.js';
import type { BodyEnhanced2StyleValues } from '../../core/cucadiagram/BodyEnhanced2.js';
import {
  NO_TEXT_BOUNDER,
  plainDimension,
  recordDrawing,
  sequenceStringBounder,
  type SequenceTextPrimitive,
} from './sequence-label-primitives.js';

export {
  atomFontSpec,
  offsetRun,
  primitiveKind,
  sequenceStringBounder,
  type SequencePrimitiveKind,
  type SequenceRunShape,
  type SequenceTextPrimitive,
} from './sequence-label-primitives.js';

/** A sized label: upstream's `TextBlock` from `Display.create0` + `SheetBlock`
 *  (batch-6 contract). Primitives are relative to the block's top-left; a
 *  text primitive's `y` is its baseline. */
export interface LabelBlock {
  readonly width: number;
  readonly height: number;
  /** Primitives in the jar's emission order, relative to the block origin. */
  readonly primitives: readonly SequenceTextPrimitive[];
}

/** The `ug.apply(...)` chain a component runs before `getTextBlock().drawU`:
 *  the ink a `----` rule, a table grid or a monochrome sprite's tint reads
 *  off the `UParam` (`ComponentRoseNote.java:121`, `ComponentRoseParticipant
 *  .java:93-111`). Absent members are not applied. */
export interface LabelInk {
  readonly fore?: Paint | undefined;
  readonly back?: Paint | undefined;
  readonly stroke?: UStroke | undefined;
}

/** A style's stroke as `Style#getStroke` builds it (`Style.java:299-320`):
 *  its dash and its `LineThickness`. */
export function strokeOfPaint(paint: Pick<SequencePaint, 'dash' | 'thickness'>): UStroke {
  const dash = paint.dash;
  return new UStroke(dash?.[0] ?? 0, dash?.[1] ?? 0, paint.thickness);
}

/** `symbolContext.apply(ug)` (`Fashion#apply`): the style's `BackGroundColor`,
 *  `LineColor` and stroke (`Style#getSymbolContext`, `Style.java:271-280`). */
export function symbolInk(paint: Pick<SequencePaint, 'dash' | 'thickness' | 'fill' | 'stroke'>): LabelInk {
  return { back: paint.fill, fore: paint.stroke, stroke: strokeOfPaint(paint) };
}

/** The `Stereotype` element of a head's display: its visible labels and the
 *  font `CreoleParser` lays them out in (`stereotypeConfiguration`,
 *  `Display.java:649-650`). */
export interface LabelStereotype {
  readonly labels: readonly string[];
  readonly font: FontConfiguration;
  /** `Participant#getDisplay` appends the stereotype (`Participant.java:
   *  125-135`); `Display#create0` finds it at `size() - 1` (`Display.java:
   *  651-653`). */
  readonly bottom?: boolean | undefined;
}

/** Everything `create0` reads besides the display and the font. */
export interface LabelOptions {
  /** `getHorizontalAlignment()` (`AbstractTextualComponent.java:81`); LEFT
   *  when unset. */
  readonly align?: HorizontalAlignment | undefined;
  /** `skinParam.getSprite` (`StripeSimple.java:229`). */
  readonly sprites?: SpriteRegistry | undefined;
  /** A leading `MessageNumber` (`AbstractMessage.java:200-206`). */
  readonly numberText?: string | undefined;
  /** `padding.getLeft()`/`getRight()` (`AbstractTextualComponent.java:91`). */
  readonly marginX1?: number | undefined;
  readonly marginX2?: number | undefined;
  readonly ink?: LabelInk | undefined;
  readonly stereotype?: LabelStereotype | undefined;
  /** An `enhanced` component (`ComponentRoseNote.java:66-71`): the block is
   *  `BodyFactory.create3` (`AbstractTextualComponent.java:88-89`), whose
   *  `--`/`==`/`..`/`__` lines are block separators (`BodyEnhanced2`), at the
   *  style's `LineThickness` and `MinimumWidth`. */
  readonly enhanced?: BodyEnhanced2StyleValues | undefined;
  /** The component as a `Stencil` around the block (`UGraphicStencil.create
   *  (ug, this, UStroke.simple())`, `ComponentRoseNote.java:124`): a
   *  `UHorizontalLine` the block draws -- a `BodyEnhanced2` separator --
   *  spans `getStartingX`..`getEndingX` (`:140-146`), here relative to the
   *  block: `before` left of it, `after` past its width. */
  readonly componentStencil?: LabelStencil | undefined;
  /** The component's `LineBreakStrategy` -- `AbstractTextualComponent`'s
   *  `maxMessageSize` argument (`:84-92`): an arrow's style `MaximumWidth` else
   *  `skinparam maxMessageSize` (`Rose.java:289-292`), a note's
   *  `style.wrapWidth()` (`ComponentRoseNote.java:67`). {@link
   *  LineBreakStrategy.NONE} when unset. `Fission` splits at `Math.abs` of it
   *  whenever it is not 0 (`Fission.java:63-101`). */
  readonly maxWidth?: LineBreakStrategy | undefined;
}

/** {@link LabelOptions.componentStencil}'s span around the block. */
export interface LabelStencil {
  readonly before: number;
  readonly after: number;
}

/** `{{ }}` inside a label -- the global registry `src/index.ts` fills, absent
 *  only when nothing registered one (a unit test). */
function nestedRenderer(): NestedDiagramRenderer {
  return (
    getNestedDiagramRenderer() ?? {
      render(): TextBlock {
        throw new Error('sequence: no nested-diagram renderer is registered');
      },
    }
  );
}

/** `activity-creole-sheet.ts#activitySkinSimple`'s `ISkinSimple`: the
 *  `SkinParam.java` defaults `CreoleParser`/`StripeSimple` read, over the
 *  diagram's sprites. */
export function sequenceSkinSimple(font: FontConfiguration, sprites: SpriteRegistry | undefined): CreoleRenderContext {
  const atomOps = chromeAtomOps(sprites, font);
  const pragma = Pragma.createEmpty();
  const skin: ISkinSimple = {
    getSprite: (name: string) => (sprites === undefined ? null : (getSprite(sprites, name) ?? null)),
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => MONOSPACED,
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => pragma,
    sheet: (fc, align, mode, stereo?: FontConfiguration) =>
      new CreoleParser(
        fc,
        align,
        skin,
        { creoleMode: mode, stereotype: stereo ?? fc },
        { atomOps, renderer: nestedRenderer() },
      ),
  };
  return { fontConfiguration: font, spriteContainer: skin, atomOps };
}

/** A head's display, `[Stereotype, ...lines]` (`Participant.java:127-128`):
 *  the stereotype element duck-typed as the `StereotypeLike` `CreoleParser`
 *  reads (`SheetBuilder.ts`), its labels already computed and guillemet-
 *  wrapped by the head layout. */
function headDisplay(labels: readonly string[], lines: readonly string[], bottom = false): DisplayLike {
  const stereo = { getLabels: () => labels, toString: () => labels.join('') };
  const items: readonly DisplayLine[] = bottom ? [...lines, stereo] : [stereo, ...lines];
  return {
    isNull: false,
    showStereotype: true,
    cacheKey: () => JSON.stringify([labels, lines, bottom]),
    [Symbol.iterator]: () => items[Symbol.iterator](),
  };
}

/** `Display#getCreole` (`Display.java:692-701`) over a head's display --
 *  `createStereotype`'s `result`, without the badge (module doc). */
function stereotypedCreole(
  lines: readonly string[],
  ctx: CreoleRenderContext,
  stereotype: LabelStereotype,
  align: HorizontalAlignment,
  margins: Required<CreoleMargins>,
  maxWidth: LineBreakStrategy,
): TextBlock {
  const skin = ctx.spriteContainer as ISkinSimple;
  const sheet = skin
    .sheet(ctx.fontConfiguration, align, CreoleMode.FULL, stereotype.font)
    .createSheet(headDisplay(stereotype.labels, lines, stereotype.bottom)) as unknown as Sheet<CreoleAtom>;
  const block1 = new SheetBlock1(sheet, maxWidth, ctx.atomOps, skin.getPadding(), margins.marginX1, margins.marginX2);
  return new SheetBlock2(block1, block1, UStroke.withThickness(SHEET_BLOCK2_THICKNESS));
}

/** `BodyFactory.create3(display, skinParam, align, fc, maxMessageSize, style)`
 *  (`AbstractTextualComponent.java:88-89`, `BodyFactory.java:79-82`). */
function enhancedBlock(
  lines: readonly string[],
  ctx: CreoleRenderContext,
  align: HorizontalAlignment,
  style: BodyEnhanced2StyleValues,
  maxWidth: LineBreakStrategy,
): TextBlock {
  const skinParam = ctx.spriteContainer as ISkinSimple;
  const config = { skinParam, align, titleConfig: ctx.fontConfiguration, lineBreakStrategy: maxWidth };
  return BodyFactory.create3(Display.create(lines), config, style, ctx.atomOps);
}

/** `new SheetBlock2(sheetBlock1, sheetBlock1, UStroke.withThickness(1.5))`
 *  (`Display.java:700`). */
const SHEET_BLOCK2_THICKNESS = 1.5;

/**
 * The display's core `TextBlock`: `display.create0(fc, align, skinParam,
 * maxWidth, CreoleMode.FULL, ..., marginX1, marginX2)`
 * (`AbstractTextualComponent.java:89-92`), a number riding as element 0
 * (`AbstractMessage.java:200-206` -> `Display.java:662-664`).
 */
export function sequenceTextBlock(lines: readonly string[], font: FontConfiguration, opts: LabelOptions): TextBlock {
  const ctx = sequenceSkinSimple(font, opts.sprites);
  const align = opts.align ?? HorizontalAlignment.LEFT;
  const margins = marginsOf(opts);
  const maxWidth = opts.maxWidth ?? LineBreakStrategy.NONE;
  if (opts.stereotype !== undefined && opts.stereotype.labels.length > 0)
    return stereotypedCreole(lines, ctx, opts.stereotype, align, margins, maxWidth);
  if (opts.enhanced !== undefined) return enhancedBlock(lines, ctx, align, opts.enhanced, maxWidth);
  return create0(
    Display.create(displayElements(lines, opts.numberText)),
    ctx,
    { horizontalAlignment: align, maxMessageSize: maxWidth, creoleMode: CreoleMode.FULL },
    {},
    margins,
  );
}

/** `padding.getLeft()`/`getRight()` as `create0`'s margins, 0 when unset
 *  (`Display.java:630-634`'s two-argument overload). */
function marginsOf(opts: LabelOptions): Required<CreoleMargins> {
  return { marginX1: opts.marginX1 ?? 0, marginX2: opts.marginX2 ?? 0 };
}

/** The display's elements, a number first (`AbstractMessage.java:200-206`). */
function displayElements(
  lines: readonly string[],
  numberText: string | undefined,
): readonly (string | MessageNumber)[] {
  return numberText === undefined ? lines : [new MessageNumber(numberText), ...lines];
}

/** A throwaway core graphic that only tracks `UParam` state for the
 *  recorder; it draws nothing. */
function stateGraphic(ink: LabelInk | undefined): UGraphic {
  let ug: UGraphic = UGraphicSvg.build(0, basicSvgOption(), '$version$', NO_TEXT_BOUNDER);
  if (ink?.fore !== undefined) ug = ug.apply(new Fore(ink.fore));
  if (ink?.back !== undefined) ug = ug.apply(new Back(ink.back));
  if (ink?.stroke !== undefined) ug = ug.apply(ink.stroke);
  return ug;
}

/** Size and draw one block (no cache). */
function buildLabelBlock(
  lines: readonly string[],
  font: FontConfiguration,
  opts: LabelOptions,
  measurer: StringMeasurer,
): LabelBlock {
  const tb = sequenceTextBlock(lines, font, opts);
  const bounder = sequenceStringBounder(measurer);
  const dim = plainDimension(tb.calculateDimension(bounder));
  const stencil = opts.componentStencil;
  const wrap = (ug: UGraphic): UGraphic =>
    stencil === undefined
      ? ug
      : UGraphicStencil.create(
          ug,
          { getStartingX: () => -stencil.before, getEndingX: () => dim.width + stencil.after },
          UStroke.simple(),
        );
  const primitives = recordDrawing(stateGraphic(opts.ink), { measurer, bounder }, (ug) => tb.drawU(wrap(ug)));
  return { ...dim, primitives };
}

/**
 * The batch-6 factory: `lines` (one `Display` entry each) at `font`, sized
 * and drawn. Memoized per measurer: upstream builds each component's block
 * once (`AbstractTextualComponent`'s constructor) while this engine asks for
 * the same label's width from several layout passes.
 */
export function sequenceLabelBlock(
  lines: readonly string[],
  font: FontConfiguration,
  opts: LabelOptions,
  measurer: StringMeasurer,
): LabelBlock {
  const cache = cacheFor(measurer);
  const key = memoKey(lines, font, opts);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const made = buildLabelBlock(lines, font, opts, measurer);
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, made);
  return made;
}

/** The empty block `TextBlockEmpty` sizes to (`AbstractTextualComponent
 *  .java:86-87`). */
export const EMPTY_LABEL_BLOCK: LabelBlock = { width: 0, height: 0, primitives: [] };

/**
 * `AbstractTextualComponent`'s empty-display rule (`java:86-87`): a display
 * of ONE empty line is a `TextBlockEmpty`, 0 x 0 and drawing nothing; no line
 * at all is the same. Everything else is {@link sequenceLabelBlock}.
 */
export function componentLabelBlock(
  lines: readonly string[],
  font: FontConfiguration,
  opts: LabelOptions,
  measurer: StringMeasurer,
): LabelBlock {
  const empty = lines.length === 0 || (lines.length === 1 && lines[0] === '');
  if (empty && opts.numberText === undefined && (opts.stereotype?.labels.length ?? 0) === 0) return EMPTY_LABEL_BLOCK;
  return sequenceLabelBlock(lines, font, opts, measurer);
}

// ---------------------------------------------------------------------------
// Memo
//
// CONCURRENCY CONTRACT: single-threaded, synchronous. A cache entry is a pure
// function of its key (the block reads only its arguments, the sprite
// registry's contents and the process-wide nested renderer), so clearing a
// full cache changes timing, never output.
// ---------------------------------------------------------------------------

/** Entries per measurer before the cache is dropped -- a bound on a
 *  long-lived measurer, not a tuning value (a survey row holds a few hundred). */
const CACHE_LIMIT = 4096;

const CACHES = new WeakMap<StringMeasurer, Map<string, LabelBlock>>();

function cacheFor(measurer: StringMeasurer): Map<string, LabelBlock> {
  let cache = CACHES.get(measurer);
  if (cache === undefined) {
    cache = new Map();
    CACHES.set(measurer, cache);
  }
  return cache;
}

const IDENTITIES = new WeakMap<object, number>();
let nextIdentity = 0;

/** A stable number for an object compared by identity (the sprite registry,
 *  a bridged `HColor`). */
function identityOf(o: object | undefined): number {
  if (o === undefined) return -1;
  let id = IDENTITIES.get(o);
  if (id === undefined) {
    id = nextIdentity++;
    IDENTITIES.set(o, id);
  }
  return id;
}

/** Every `FontConfiguration` field, objects by identity. */
function fontKey(font: FontConfiguration): unknown {
  return [
    font.family,
    font.size,
    font.color,
    [...font.styles].sort(),
    font.fontFace,
    font.extendedColor,
    font.fontPosition,
    font.hyperlinkColor,
    font.hyperlinkUnderlineStroke,
    identityOf(font.hColor),
  ];
}

function memoKey(lines: readonly string[], font: FontConfiguration, opts: LabelOptions): string {
  return JSON.stringify([
    lines,
    fontKey(font),
    opts.align,
    identityOf(opts.sprites),
    opts.numberText,
    opts.marginX1,
    opts.marginX2,
    opts.ink === undefined ? null : [opts.ink.fore, opts.ink.back, opts.ink.stroke],
    opts.stereotype === undefined ? null : [opts.stereotype.labels, fontKey(opts.stereotype.font)],
    opts.enhanced ?? null,
    opts.componentStencil ?? null,
    opts.maxWidth?.toString() ?? null,
  ]);
}
