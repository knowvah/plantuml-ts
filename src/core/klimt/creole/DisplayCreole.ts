/**
 * DisplayCreole — `Display#create0`'s three-way dispatch
 * (`createStereotype`/`createMessageNumber`/`getCreole`, java:614-713),
 * split out of `Display.ts` (rendering-layer responsibility, needs
 * `SheetBlock1`/`SheetBlock2`/`ISkinSimple`/`AtomOps` -- a different
 * dependency set than that file's data-manipulation surface).
 *
 * ## Parameter-shape adaptation (complexity-hook accommodation)
 *
 * Upstream's `create0`/`createStereotype`/`getCreole`/`createMessageNumber`
 * each take 7-10 flat positional params. This project's per-function
 * param budget (`CreoleParser.ts`'s own precedent: "5 total parameters,
 * this project's parameter-count ceiling") is honored by grouping:
 *  - {@link CreoleRenderContext} — `fontConfiguration`/`spriteContainer`/
 *    `atomOps` (this port's ADR-9 injected bundle, appended to every
 *    upstream `Display` render call as an extra parameter, matching
 *    `SheetBlock1.ts`/`CreoleParser.ts`'s own established precedent).
 *  - {@link StereotypeFontOverride} — `fontForStereotype`/
 *    `htmlColorForStereotype` (upstream's `UFont`/`HColor`, adapted per
 *    `FontConfiguration.ts`'s own established `{family,size}`/plain-color-
 *    string scope reductions).
 *  - {@link CreoleMargins} — `marginX1`/`marginX2`.
 * Every upstream VALUE is still threaded through unchanged -- this is a
 * shape-only change, not a behavioral one.
 *
 * ## `createStereotype`'s circled-character/sprite decoration is BLOCKED
 *
 * Upstream computes `circledCharacter` (`CircledCharacter` for a spotted
 * stereotype, or `Stereotype#getSprite` otherwise) BEFORE `result`
 * (java:674-685) -- so both branches are evaluated for every real
 * `Stereotype`-bearing `Display`, and this port cannot construct either:
 *  - Spotted: `klimt/shape/CircledCharacter.java` (88 lines) needs
 *    `HColor`/`UFont`/`UEllipse`/`UCenteredCharacter` -- this port has NO
 *    `HColor` color model ANYWHERE (`Position.ts`/`ISkinSimple.ts`/
 *    `StripeStyle.ts#getHeader` already independently hit this identical
 *    gap in this same batch).
 *  - Sprite: `Stereotype#getSprite` (`stereo/Stereotype.ts`, T9b) requires
 *    a `SpriteRegistry` (`core/sprite-commands.ts`), but this method only
 *    has an `ISkinSimple` on hand -- a genuine T9b/T9c integration gap
 *    (T9b chose a `SpriteRegistry` parameter rather than the
 *    `{getSprite(name):Sprite|null}` shape `ISkinSimple` already exposes).
 *    Even with one, `Sprite -> TextBlock` rendering has no creole-layer
 *    counterpart (T9b: `sprite-raster.ts` is render-time-only). Passing
 *    `undefined` to force a false "no sprite" answer would silently
 *    misreport a real capability gap -- not done.
 * Both are cited, thrown seams (ADR-8 corollary) -- `result` (via
 * `getCreole`) is never reached today because upstream itself evaluates
 * `circledCharacter` FIRST; `TextBlockSprited.ts` (T9c, a genuine sibling
 * addition) is still ported in full so a future task that closes either
 * gap gets it for free.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import type { Display } from './Display.js';
import { isStereotype } from '../../stereo/Stereotype.js';
import { isMessageNumber } from '../../sequencediagram/MessageNumber.js';
import type { FontConfiguration } from '../shape/UText.js';
import { FontStyle } from '../shape/UText.js';
import type { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import { VerticalAlignment } from '../geom/VerticalAlignment.js';
import type { ISkinSimple } from '../../style/ISkinSimple.js';
import type { LineBreakStrategy } from '../LineBreakStrategy.js';
import { CreoleMode } from './CreoleMode.js';
import { SheetBlock1 } from './SheetBlock1.js';
import { SheetBlock2 } from './SheetBlock2.js';
import { UStroke } from '../UStroke.js';
import { ClockwiseTopRightBottomLeft } from '../geom/ClockwiseTopRightBottomLeft.js';
import { TextBlockUtils } from '../shape/TextBlockUtils.js';
import type { TextBlock } from '../shape/TextBlock.js';
import type { AtomOps } from './Sea.js';
import type { Sheet } from './Sheet.js';
import type { CreoleAtom } from './atom/Atom.js';

/** ADR-9's injected render-capability bundle for this file's `create*`
 *  family -- see this file's own module doc comment. */
export interface CreoleRenderContext {
  readonly fontConfiguration: FontConfiguration;
  readonly spriteContainer: ISkinSimple | null;
  readonly atomOps: AtomOps;
}

/** Upstream `UFont newFont`/`HColor htmlColorForStereotype`, adapted --
 *  see this file's own module doc comment. */
export interface StereotypeFontOverride {
  readonly font?: Pick<FontConfiguration, 'family' | 'size'>;
  readonly color?: string | null;
}

/** Upstream `double marginX1, double marginX2`. */
export interface CreoleMargins {
  readonly marginX1?: number;
  readonly marginX2?: number;
}

/** Bundles `horizontalAlignment`/`maxMessageSize`/`creoleMode` -- the
 *  three upstream positional params every one of this file's dispatch
 *  functions threads through unchanged -- so each function stays within
 *  this project's per-function parameter budget (complexity-hook
 *  accommodation, matching `CreoleParser.ts`'s own established grouping
 *  precedent). Shape-only; no upstream value is dropped or renamed. */
export interface CreoleDispatchParams {
  readonly horizontalAlignment: HorizontalAlignment;
  readonly maxMessageSize: LineBreakStrategy;
  readonly creoleMode: CreoleMode;
}

const SHEET_BLOCK2_THICKNESS = 1.5;

/** `FontConfiguration#forceFont(UFont, HColor)` (java:236-246) -- adapted
 *  to this port's reduced `FontConfiguration` (`{family,size,color,
 *  styles}`, `klimt/shape/UText.ts`'s own established scope reduction: no
 *  `UFont`/`HColor` anywhere in this port). `override.font` stands in for
 *  `UFont` via the `{family,size}` shape `StringBounder.ts` already
 *  established; `override.color` stands in for `HColor` via the plain
 *  resolved-color-string `FontConfiguration.color` already uses. */
export function forceFont(fc: FontConfiguration, override: StereotypeFontOverride): FontConfiguration {
  if (override.font === undefined) {
    // java:238 -- `add(FontStyle.ITALIC)`: PLAIN would clear the set (n/a
    // here, ITALIC is never PLAIN), so this is just "add ITALIC if absent".
    return { ...fc, styles: new Set(fc.styles).add(FontStyle.ITALIC) };
  }
  return { family: override.font.family, size: override.font.size, color: override.color ?? fc.color, styles: fc.styles };
}

function blockedOnCircledCharacter(reason: string): Error {
  return new Error(`Display.createStereotype: building the stereotype's circled-character/sprite decoration is blocked -- ${reason}`);
}

const SPOTTED_BLOCKED_REASON =
  'klimt/shape/CircledCharacter.java (88 lines) needs HColor/UFont/UEllipse/UCenteredCharacter -- this port ' +
  'has no HColor color model ANYWHERE (Position.ts/ISkinSimple.ts/StripeStyle.ts#getHeader already hit the ' +
  'identical gap in this same batch). Genuinely large, separable follow-on (ADR-8 corollary).';

const SPRITE_BLOCKED_REASON =
  'Stereotype#getSprite (stereo/Stereotype.ts, T9b) requires a SpriteRegistry, but this method only has an ' +
  'ISkinSimple on hand (a genuine T9b/T9c integration gap). Even with one, Sprite -> TextBlock rendering has ' +
  'no creole-layer counterpart. Passing undefined to force a false "no sprite" answer would silently ' +
  'misreport a real capability gap -- not done.';

/** `Display#createStereotype` (java:671-690) -- see this file's own
 *  module doc comment for why BOTH branches are cited, thrown seams. */
function createStereotype(display: Display, position: number): TextBlock {
  const stereotype = display.get(position);
  if (!isStereotype(stereotype)) throw new Error('Display.createStereotype: position does not hold a Stereotype');
  throw blockedOnCircledCharacter(stereotype.isSpotted() ? SPOTTED_BLOCKED_REASON : SPRITE_BLOCKED_REASON);
}

/** `Display#getCreole` (java:692-701). */
function getCreole(
  display: Display,
  ctx: CreoleRenderContext,
  params: CreoleDispatchParams,
  stereotypeConfiguration: FontConfiguration,
  margins: CreoleMargins,
): TextBlock {
  // java:695-696 -- `spriteContainer.sheet(...)` is called UNCONDITIONALLY
  // before the padding null-check below, so a null `spriteContainer` would
  // already have NPE'd here in the Java too. This port preserves that
  // dead-code shape (`SheetBlock1.ts#getCellAlignment`'s own established
  // precedent) rather than defensively guarding it.
  const builder = (ctx.spriteContainer as ISkinSimple).sheet(
    ctx.fontConfiguration,
    params.horizontalAlignment,
    params.creoleMode,
    stereotypeConfiguration,
  );
  // `SheetBuilder.createSheet` returns `Sheet<StripeAtom>` (T10g's own
  // widening: a real `CreoleParser` sheet may mix CreoleAtom-flavored
  // plain-text stripes with Atom-flavored composite ones -- table/tree/
  // code/latex/horizontal-line/embedded-diagram). `SheetBlock1.ts` (T8,
  // out of this task's write-set) was DELIBERATELY left narrow to `Sheet`
  // bare (= `Sheet<CreoleAtom>`, `Stripe.ts`'s own doc comment: "so
  // `SheetBlock1.ts`'s existing `sheet: Sheet` field ... is unchanged").
  // This cast satisfies that narrower contract; it is SOUND only when the
  // display's actual creole content never triggers CreoleParser's table/
  // tree/code/latex/horizontal-line/embedded classification -- a
  // PRE-EXISTING architecture gap between those two already-landed
  // sibling files, not introduced or fixable here (out of this task's
  // write-set). Flagged for whoever wires a real `ISkinSimple.sheet()`
  // implementation next (T2b) -- see this task's own report.
  const sheet = builder.createSheet(display) as unknown as Sheet<CreoleAtom>;
  const padding = ctx.spriteContainer === null ? ClockwiseTopRightBottomLeft.none() : ctx.spriteContainer.getPadding();
  const sheetBlock1 = new SheetBlock1(sheet, params.maxMessageSize, ctx.atomOps, padding, margins.marginX1 ?? 0, margins.marginX2 ?? 0);
  return new SheetBlock2(sheetBlock1, sheetBlock1, UStroke.withThickness(SHEET_BLOCK2_THICKNESS));
}

/** `Display#createMessageNumber` (java:703-713) -- always renders both
 *  halves in `CreoleMode.FULL` (java:707,710), regardless of the caller's
 *  own `params.creoleMode`, matching upstream exactly. */
function createMessageNumber(
  display: Display,
  ctx: CreoleRenderContext,
  params: CreoleDispatchParams,
  stereotypeConfiguration: FontConfiguration,
  margins: CreoleMargins,
): TextBlock {
  const fullMode: CreoleDispatchParams = { ...params, creoleMode: CreoleMode.FULL };
  let tb1 = getCreole(display.subList(0, 1), ctx, fullMode, stereotypeConfiguration, margins);
  tb1 = TextBlockUtils.withMargin(tb1, 0, 4, 0, 0);
  const tb2 = getCreole(display.subList(1, display.size()), ctx, fullMode, stereotypeConfiguration, margins);
  return TextBlockUtils.mergeLR(tb1, tb2, VerticalAlignment.CENTER);
}

/** `Display#create0` (java:637-669) -- the real dispatch: `Stereotype` at
 *  position 0 or last -> `createStereotype` (BLOCKED, see module doc);
 *  `MessageNumber` at position 0 -> `createMessageNumber`; else ->
 *  `getCreole`. `Objects.requireNonNull(maxMessageSize)` (java:647) is
 *  enforced by the type system (`LineBreakStrategy`, non-optional) rather
 *  than a runtime check ("no null checks the type system already
 *  guarantees", code-principles). */
export function create0(
  display: Display,
  ctx: CreoleRenderContext,
  params: CreoleDispatchParams,
  override: StereotypeFontOverride = {},
  margins: CreoleMargins = {},
): TextBlock {
  const natural = display.getNaturalHorizontalAlignment();
  const effective: CreoleDispatchParams = { ...params, horizontalAlignment: natural ?? params.horizontalAlignment };
  const stereotypeConfiguration = forceFont(ctx.fontConfiguration, override);

  if (display.size() > 0) {
    if (isStereotype(display.get(0))) return createStereotype(display, 0);
    if (isStereotype(display.get(display.size() - 1))) return createStereotype(display, display.size() - 1);
    if (isMessageNumber(display.get(0))) {
      return createMessageNumber(display, ctx, effective, stereotypeConfiguration, margins);
    }
  }
  return getCreole(display, ctx, effective, stereotypeConfiguration, margins);
}
