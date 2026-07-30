/**
 * class-body-enhanced-geometry.ts — ADR-7's "one owner" bridge: derives
 * `BodyEnhancedAbstract#decorate`'s Y-axis geometry (content top, divider
 * y, total height) for `class-body-enhanced-layout.ts`'s plain/titled
 * divider branches by running the REAL ported `decorate()`
 * (`../../core/cucadiagram/BodyEnhancedAbstract.ts`) through a minimal
 * draw-order probe, rather than carrying an independent re-derivation of
 * the same arithmetic. Split out of `class-body-enhanced-layout.ts` purely
 * to stay under this project's 500-line file cap (mirrors `class-member-
 * rows.ts`'s own identical split precedent) — no behavior change.
 *
 * @see ~/git/plantuml/.../cucadiagram/BodyEnhancedAbstract.java#decorate
 * @see ~/git/plantuml/.../klimt/shape/TextBlockLineBefore.java
 */
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import type { UChange } from '../../core/klimt/UChange.js';
import type { UShape } from '../../core/klimt/UShape.js';
import type { UParam } from '../../core/klimt/UParam.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { UHorizontalLine } from '../../core/klimt/shape/UHorizontalLine.js';
import { BodyEnhancedAbstract } from '../../core/cucadiagram/BodyEnhancedAbstract.js';
import { parseMemberLine } from './class-member-parser.js';

/** `BodyEnhancedAbstract#getDefaultThickness`'s resolved value for a
 *  classifier's `element` style selector (`style.value(PName.LineThickness)
 *  .asDouble()`) — traced to `plantuml.skin:91-93`'s `element { LineThickness
 *  0.5 }`, which is MORE specific than `root`'s `LineThickness 1.0` (line 15)
 *  and so wins the cascade. Only reachable for the `_` synthetic sentinel
 *  separator (every named char — `-`/`=`/`.` — takes its own branch in
 *  `UHorizontalLine#getStroke`, see `class-body-enhanced-layout.ts
 *  #separatorStrokeWidth`); zero corpus reach in this iteration's
 *  fixtures, unchanged from N42's original scoping. */
export const ELEMENT_DEFAULT_LINE_THICKNESS = 0.5;
/** `BodyEnhanced1#getMarginX()` = 6 (`~/git/plantuml/.../cucadiagram/
 *  BodyEnhanced1.java:113-115`) — the same value as `class-member-rows.ts
 *  #ROW_TEXT_LEFT_MARGIN` (a DIFFERENT Java field, `MethodsOrFieldsArea`'s
 *  own row-indent margin; the two are independently-defined constants
 *  that happen to share a value for class/object diagrams, corroborated
 *  independently by `state-sizing.ts`'s `BODY_MARGIN_X`). Named
 *  separately here for traceability even though `decorate`'s Y-axis
 *  geometry (the only thing {@link ClassifierBodyGeometry} is used for)
 *  does not depend on it at all — `withMargin`'s X-margins never affect
 *  the computed height. */
export const BODY_ENHANCED_MARGIN_X = 6;

/** Satisfies the `StringBounder` interface `decorate`/`TextBlockLineBefore
 *  #calculateDimension` require as a parameter; its OWN `calculateDimension`
 *  method is never invoked here — every content/title probe block below
 *  ignores the `stringBounder` argument it receives and returns a fixed
 *  `XDimension2D` instead (their real dimensions are already known: the
 *  caller's own row-height/font-size arithmetic, not text measurement). */
const PROBE_STRING_BOUNDER: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/**
 * OffsetProbeUGraphic — a minimal `UGraphic` used ONLY to read back the Y
 * translate `TextBlockLineBefore#drawU` (`../../core/klimt/shape/
 * TextBlockLineBefore.ts`) accumulates at the moment it draws its
 * `UHorizontalLine` divider shape. Mirrors the `LimitFinder`-style probe
 * pattern `TextBlockUtils.getMinMax` already uses elsewhere in this port
 * (`core/klimt/drawing/LimitFinder.ts`) — intercepts `draw(shape)` rather
 * than dispatching to a real driver, since no actual rendering is wanted
 * here, only the composed translate at each draw call.
 */
class OffsetProbeUGraphic implements UGraphic {
  constructor(
    private readonly onDivider: (dy: number) => void,
    private readonly translate: UTranslate = UTranslate.none(),
  ) {}

  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate) return new OffsetProbeUGraphic(this.onDivider, this.translate.compose(change));
    return this;
  }

  draw(shape: UShape): void {
    if (shape instanceof UHorizontalLine) this.onDivider(this.translate.getDy());
  }

  getParam(): UParam {
    return {
      // Harmless placeholder, never read: neither `decorate()`,
      // `TextBlockLineBefore`, `TextBlockMarged`, nor this probe's own
      // `draw()` (which intercepts BEFORE any real driver dispatch would
      // call `UHorizontalLine#drawLineInternal`, the only upstream reader
      // of `getStroke()`) ever queries it through this probe -- mirrors
      // `UGraphicNo.ts`/`Footprint.ts`'s identical `UStroke.simple()`
      // placeholder for the same "interface requires it, this probe never
      // reads it" shape, per this project's error-handling convention
      // (no defensive throw for a state that cannot occur).
      getStroke: () => UStroke.simple(),
      getColor: () => 'none',
      // `getBackcolor`/`getTranslate` (the UParam pair, not this class's
      // own `getTranslate()` method below) are equally unread by this
      // probe's call graph -- only `getColor()` is actually queried,
      // by `TextBlockLineBefore#drawU`'s own `ug.getParam().getColor()`.
      getBackcolor: () => 'none',
      getTranslate: () => this.translate,
    };
  }

  getTranslate(): UTranslate {
    return this.translate;
  }

  getStringBounder(): StringBounder {
    return PROBE_STRING_BOUNDER;
  }
}

/** `decorate()`'s derived Y-axis offsets, relative to the block's own local
 *  `cursor` (i.e. as if `cursor === 0`) — the caller adds its real `cursor`. */
export interface DecorateHeightOffsets {
  readonly contentTop: number;
  readonly dividerY: number;
  readonly totalHeight: number;
}

/**
 * ClassifierBodyGeometry — ADR-7's "one owner" for the class-side enhanced-
 * body layout: a `BodyEnhancedAbstract` subclass that exists ONLY to run
 * the REAL ported `decorate()` (`../../core/cucadiagram/
 * BodyEnhancedAbstract.ts`) through {@link OffsetProbeUGraphic} and read
 * back the Y-axis offsets `class-body-enhanced-layout.ts`'s
 * `layoutPlainDividerRows`/`layoutTitledDividerRows` need, replacing that
 * file's own former independent re-derivation of the same arithmetic
 * (`BLOCK_MARGIN_BOTTOM`/`PLAIN_DIVIDER_MARGIN_TOP`, removed this task).
 * `getArea` is never called — callers only ever reach `decorate` through
 * {@link ClassifierBodyGeometry.deriveHeightOffsets} — so it throws,
 * matching this project's error-handling convention for a genuinely
 * unreachable path.
 *
 * WIDTH is deliberately untouched by this class: `decorate`'s X-margins
 * (`getMarginX()`) never affect the computed HEIGHT (`withMargin`'s width/
 * height deltas are independent per axis, and `TextBlockLineBefore
 * .calculateDimension`'s `atLeast` floor checks width/height independently
 * too), so probing for height needs no width input at all, and `class-
 * body-enhanced-layout.ts`'s existing width computation (`sectionWidth`/
 * `rowsBlockWidth`) is left exactly as-is — already cross-checked against
 * `BodyEnhanced1.getMarginX()` = 6 (see {@link BODY_ENHANCED_MARGIN_X}'s
 * own doc comment).
 *
 * The title's own baseline Y (`UHorizontalLine#drawTitleInternal`'s `y -
 * dimTitle.height/2 - 0.5`) is NOT derived through this probe: that formula
 * lives in `UHorizontalLine.ts` (already ported, out of this task's write-
 * set), reachable only by invoking the shape's OWN internal draw dispatch
 * (a real `Stencil`) rather than through the `TextBlock` interface this
 * probe intercepts at. It is applied analytically instead by the caller,
 * referencing the SAME hardcoded `0.5` `UHorizontalLine.ts:126` already
 * carries.
 */
export class ClassifierBodyGeometry extends BodyEnhancedAbstract {
  constructor(
    defaultThickness: number,
    private readonly marginX: number,
  ) {
    super(defaultThickness);
  }

  protected getArea(): never {
    throw new Error('ClassifierBodyGeometry.getArea: unreachable -- only decorate() is invoked directly');
  }

  protected getMarginX(): number {
    return this.marginX;
  }

  deriveHeightOffsets(contentHeight: number, separator: string, titleHeight?: number): DecorateHeightOffsets {
    let contentTop = 0;
    let dividerY = 0;
    const contentBlock: TextBlock = {
      calculateDimension: () => new XDimension2D(0, contentHeight),
      drawU: (ug: UGraphic): void => {
        contentTop = ug.getTranslate().getDy();
      },
    };
    const titleBlock: TextBlock | undefined =
      titleHeight === undefined
        ? undefined
        : {
            calculateDimension: () => new XDimension2D(0, titleHeight),
            // Never invoked by this probe: the title block's `drawU` is
            // only reached via `UHorizontalLine#drawLineInternal`'s real
            // `Stencil`-driven `drawTitleInternal` -- a different, deeper
            // call path than `draw(shape)` intercepts at (see {@link
            // ClassifierBodyGeometry}'s own doc comment on why the
            // title's baseline Y is derived analytically instead).
            drawU: (): void => undefined,
          };
    const wrapped = this.decorate(contentBlock, separator, titleBlock, PROBE_STRING_BOUNDER);
    const totalHeight = wrapped.calculateDimension(PROBE_STRING_BOUNDER).getHeight();
    wrapped.drawU(new OffsetProbeUGraphic((dy) => (dividerY = dy)));
    return { contentTop, dividerY, totalHeight };
  }
}

/** `lines`' member-row count, matching `class-body-enhanced-layout.ts
 *  #buildRowsBlockRows`'s own `members.length` exactly
 *  (`lines.map(parseMemberLine).filter(m => m !== null).length`) — needed
 *  BEFORE `buildRowsBlockRows` runs, since {@link
 *  ClassifierBodyGeometry.deriveHeightOffsets} needs the real content
 *  height up front (`TextBlockLineBefore`'s title-floor `Math.max` can
 *  bind on EMPTY content, `pacagu-24-nune023`'s fixture — a placeholder
 *  height would silently pick the wrong branch). This re-runs
 *  `parseMemberLine` per line a second time; it is a plain count, not a
 *  re-derivation of any `decorate`-owned arithmetic, so it does not
 *  conflict with ADR-7. */
export function memberLineCount(lines: readonly string[]): number {
  return lines.filter((line) => parseMemberLine(line) !== null).length;
}
