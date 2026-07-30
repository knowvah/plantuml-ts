import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import type { XDimension2D } from '../klimt/geom/XDimension2D.js';
import { TextBlockUtils } from '../klimt/shape/TextBlockUtils.js';
import { TextBlockLineBefore } from '../klimt/shape/TextBlockLineBefore.js';

/**
 * BodyEnhancedAbstract — the single `src/core/` owner of `decorate`'s
 * Creole block-separator geometry (ADR-7, `plans/bodyenhanced-atom-seams/
 * decisions.md`). Subclasses (`BodyEnhanced1`/`BodyEnhanced2`, T2b) supply
 * `getArea`/`getMarginX`; every consumer of this port (class/object
 * sizing+rendering today via the rewire below, description rendering in
 * T4) shares this one `decorate` implementation.
 *
 * Upstream: cucadiagram/BodyEnhancedAbstract.java (129 lines). Ported:
 * `isBlockSeparator` (static), `calculateDimension`, `drawU`, `decorate`
 * (lines 106-118 — the heart of this class, see below).
 *
 * `decorate`'s three branches (upstream lines 106-118), each constant
 * traced to its Java expression:
 *
 * ```java
 * if (separator == 0)  return withMargin(block, marginX, 0);
 * if (title == null)   return new TextBlockLineBefore(thickness, withMargin(block, marginX, 4), separator);
 *                      return new TextBlockLineBefore(thickness, withMargin(block, marginX, 6, dimTitle.getHeight()/2, 4), separator, title);
 * ```
 *
 * `withMargin(block, marginX, 0)` / `withMargin(block, marginX, 4)` are
 * Java's TWO-arg `(marginX, marginY)` overload (`TextBlockUtils.java:
 * 64-69`) — `marginX` applies to LEFT+RIGHT, the second value to TOP+
 * BOTTOM both. This port's consolidated `TextBlockUtils.withMargin(tb,
 * marginX1, marginX2, marginY1, marginY2)` (`TextBlockUtils.ts`) does
 * NOT correctly reproduce that two-arg meaning if called positionally
 * with just 2 args (confirmed precedent: `USymbolUsecase.ts:97-110`'s
 * identical note, `state-sizing.ts:152-165`'s `BODY_MARGIN_X` corroborates
 * marginX=6 independently) — so both calls below are written as the
 * explicit 4-arg form `withMargin(block, marginX, marginX, Y, Y)`,
 * matching the established convention throughout this codebase.
 * `withMargin(block, marginX, 6, dimTitle.height/2, 4)` and the final
 * `withMargin(raw, 0, 0, dimTitle.height/2, 0)` are ALREADY Java's 4-arg
 * `(marginX1, marginX2, marginY1, marginY2)` overload and pass straight
 * through unchanged.
 *
 * `getDefaultThickness()` (upstream: `final protected double
 * getDefaultThickness() { return style.value(PName.LineThickness)
 * .asDouble(); }`) has no portable equivalent — this port has no
 * `Style`/`PName` cascade at all. Adapted (reported) to a constructor-
 * supplied numeric field instead of a `Style` lookup: the VALUE a
 * subclass must supply is unchanged (still whatever the Java cascade
 * would resolve for that classifier's `element`-selector style — for
 * class/object diagrams that is `0.5`, traced to `plantuml.skin:91-93`'s
 * `element { LineThickness 0.5 }`, which is MORE specific than `root`'s
 * `LineThickness 1.0` at line 15 and so wins the cascade), only the
 * mechanism supplying it changes.
 *
 * `getTitle(String, ISkinSimple)` and the `align`/`titleConfig`/`style`
 * constructor fields (Java) are NOT ported (reported, no caller in this
 * task's write-set or interface contract): they depend on `Display`/
 * `FontConfiguration`/`ISkinSimple`/`Style`, none of which exist in this
 * port. This task's `decorate` interface contract already takes a
 * pre-built `title: TextBlock | undefined` from its caller (the rewired
 * class-side code builds its own title block via `buildMemberRow`), so
 * `getTitle`'s Creole-parsing responsibility is not needed here.
 * `getStyle()` is dropped along with the `Style` field for the same
 * reason.
 */
export abstract class BodyEnhancedAbstract implements TextBlock {
  private readonly defaultThickness: number;

  protected constructor(defaultThickness: number) {
    this.defaultThickness = defaultThickness;
  }

  protected abstract getArea(stringBounder: StringBounder): TextBlock;

  protected abstract getMarginX(): number;

  protected getDefaultThickness(): number {
    return this.defaultThickness;
  }

  /** Upstream: `BodyEnhancedAbstract.java:67-82`, ported verbatim. */
  static isBlockSeparator(cs: string): boolean {
    if (cs.startsWith('--') && cs.endsWith('--')) return true;
    if (cs.startsWith('==') && cs.endsWith('==')) return true;
    if (cs.startsWith('..') && cs.endsWith('..') && cs !== '...') return true;
    if (cs.startsWith('__') && cs.endsWith('__')) return true;
    return false;
  }

  calculateDimension(stringBounder: StringBounder): XDimension2D {
    return this.getArea(stringBounder).calculateDimension(stringBounder);
  }

  drawU(ug: UGraphic): void {
    this.getArea(ug.getStringBounder()).drawU(ug);
  }

  protected decorate(
    block: TextBlock,
    separator: string | 0,
    title: TextBlock | undefined,
    stringBounder: StringBounder,
  ): TextBlock {
    const marginX = this.getMarginX();
    if (separator === 0) return TextBlockUtils.withMargin(block, marginX, marginX, 0, 0);

    if (title === undefined) {
      return new TextBlockLineBefore(
        this.getDefaultThickness(),
        TextBlockUtils.withMargin(block, marginX, marginX, 4, 4),
        separator,
      );
    }

    const dimTitle = title.calculateDimension(stringBounder);
    const raw = new TextBlockLineBefore(
      this.getDefaultThickness(),
      TextBlockUtils.withMargin(block, marginX, 6, dimTitle.getHeight() / 2, 4),
      separator,
      title,
    );
    return TextBlockUtils.withMargin(raw, 0, 0, dimTitle.getHeight() / 2, 0);
  }
}
