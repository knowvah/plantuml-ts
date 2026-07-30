import { Display, type DisplayElement } from '../klimt/creole/Display.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../klimt/shape/UText.js';
import type { LineBreakStrategy } from '../klimt/LineBreakStrategy.js';
import type { ISkinSimple } from '../style/ISkinSimple.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../klimt/shape/TextBlockUtils.js';
import { TextBlockVertical } from '../klimt/shape/TextBlockVertical.js';
import { BodyEnhancedAbstract } from './BodyEnhancedAbstract.js';
import { EmbeddedDiagram, getEmbeddedType } from '../EmbeddedDiagram.js';
import type { AtomOps } from '../klimt/creole/Sea.js';
import type { CreoleRenderContext } from '../klimt/creole/DisplayCreole.js';

/**
 * BodyEnhanced2 — the `BodyEnhancedAbstract` concrete used for description-
 * style bodies (component/usecase/state/note/tips titles — every real
 * `BodyFactory.create3` caller upstream: `AbstractTextualComponent.java:89`,
 * `EntityImageDescription.java:188,191`, `EntityImageNote.java:117`,
 * `EntityImageTips.java:185`). NOT the class/object member-list body —
 * that is `BodyEnhanced1` (SI1, ADR-10 in
 * `plans/bodyenhanced-atom-seams/decisions.md`).
 *
 * Upstream: cucadiagram/BodyEnhanced2.java (142 lines). Ported in full:
 * the constructor, `getMarginX`, `getArea` (the separator loop, ADR-4),
 * `addOneSingleLineManageEmbedded2`, `getTextBlock`.
 *
 * ## Constructor shape: `Style style` -> two numeric params + `atomOps`
 *
 * Upstream's trailing `Style style` feeds exactly two scalar reads, NEITHER
 * of which this port can obtain from a `Style` object at all — this port
 * has no `Style`/`PName` cascade anywhere (ADR-8 corollary; the same gap
 * `BodyEnhancedAbstract.ts`'s own `getDefaultThickness()` doc comment
 * already names, `Display.ts#withoutStereotypeIfNeeded`,
 * `SheetBlock1.ts`'s Style-overload drop, `ClockwiseTopRightBottomLeft.ts
 * #marginForDocument` — five independent hits this mission per ADR-9/10):
 *
 *  - `getDefaultThickness()` (`BodyEnhancedAbstract.java`'s `style.value(
 *    PName.LineThickness).asDouble()`) -> `defaultThickness: number`,
 *    forwarded to `super()` -- SAME adaptation T2a already made for
 *    `BodyEnhancedAbstract`'s own constructor.
 *  - `getStyle().value(PName.MinimumWidth).asDouble()` (java:114, this
 *    class's own `getArea`) -> `minimumWidth: number`. Traced:
 *    `style/FromSkinparamToStyle.java:241` converts the user-facing
 *    `MinClassWidth` skinparam to `PName.MinimumWidth`; no `plantuml.skin`
 *    default sets it (grep-verified), so it is always caller-resolved, not
 *    a fittable constant -- the caller (T4) supplies whatever `resolveSkinparam`
 *    resolves for `MinClassWidth`.
 *
 * `atomOps: AtomOps` is an ADR-9 addition with no upstream equivalent --
 * `getTextBlock`/`getTitle` both reach `Display#create*`, whose
 * `CreoleRenderContext` (`DisplayCreole.ts`) requires one. Appended last,
 * matching `Display.ts`'s own established precedent for this exact bundle.
 *
 * The constructor's upstream 6 flat params (plus the 2 numeric Style
 * substitutes and `atomOps` above) exceed this project's 5-parameter
 * complexity-hook ceiling (`CreoleParser.ts`'s own established precedent),
 * so `skinParam`/`align`/`titleConfig`/`lineBreakStrategy` group into
 * {@link BodyEnhanced2Config} and the two Style substitutes into {@link
 * BodyEnhanced2StyleValues} -- shape-only, every upstream value still
 * threaded through unchanged (matching `CreoleDispatchParams`/
 * `CreoleRenderContext`'s identical grouping in `DisplayCreole.ts`).
 *
 * ## `getTitle` — ported HERE, not on `BodyEnhancedAbstract`
 *
 * T2a dropped `BodyEnhancedAbstract#getTitle` because `Display` did not
 * exist yet (`BodyEnhancedAbstract.ts`'s own doc comment). `Display` now
 * exists (T9c) and THIS task is `getTitle`'s one real caller (java:98,
 * `title = getTitle(s.toString(), skinParam)`) -- so, per the ADR-8
 * corollary, it must be ported, not skipped a second time on stale
 * reasoning. `BodyEnhancedAbstract.ts` is OFF-LIMITS for this task's
 * write-set (only `BodyEnhanced2.ts`/`BodyFactory.ts` may be written), so
 * `getTitle` is ported as a PRIVATE method on this class instead of the
 * shared base -- a scope-forced duplication, flagged for whoever ports
 * `BodyEnhanced1` (SI1) next to consolidate onto one shared owner (ADR-7's
 * own "one owner" preference, deferred here only by the write-set
 * boundary, not by choice).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced2.java
 */

/** Upstream `ISkinSimple skinParam, HorizontalAlignment align,
 *  FontConfiguration titleConfig, LineBreakStrategy lineBreakStrategy` --
 *  grouped per this class's own doc comment ("Constructor shape" section). */
export interface BodyEnhanced2Config {
  readonly skinParam: ISkinSimple;
  readonly align: HorizontalAlignment;
  readonly titleConfig: FontConfiguration;
  readonly lineBreakStrategy: LineBreakStrategy;
}

/** Upstream's single trailing `Style style`, split into the two scalar
 *  reads it actually fed -- see this class's own doc comment. */
export interface BodyEnhanced2StyleValues {
  readonly defaultThickness: number;
  readonly minimumWidth: number;
}

export class BodyEnhanced2 extends BodyEnhancedAbstract {
  private readonly rawBody: Display;
  private readonly skinParam: ISkinSimple;
  private readonly align: HorizontalAlignment;
  private readonly titleConfig: FontConfiguration;
  private readonly lineBreakStrategy: LineBreakStrategy;
  private readonly minimumWidth: number;
  private readonly atomOps: AtomOps;
  private area: TextBlock | undefined;

  constructor(rawBody: Display, config: BodyEnhanced2Config, styleValues: BodyEnhanced2StyleValues, atomOps: AtomOps) {
    super(styleValues.defaultThickness);
    this.rawBody = rawBody;
    this.skinParam = config.skinParam;
    this.align = config.align;
    this.titleConfig = config.titleConfig;
    this.lineBreakStrategy = config.lineBreakStrategy;
    this.minimumWidth = styleValues.minimumWidth;
    this.atomOps = atomOps;
  }

  /** java:72-75 -- unlike `BodyEnhanced1#getMarginX` (6, class/object
   *  diagrams), THIS subclass's title-separator inner margin is
   *  ASYMMETRIC via `decorate`'s `withMargin(block, marginX, 6, ...)`
   *  branch (`BodyEnhancedAbstract.ts:120`): LEFT = `marginX` = 0,
   *  RIGHT = literal `6` -- see this class's own doc comment / T2a's
   *  `.agent-notes/T2a-body-base.md` observation for the derivation. Not
   *  smoothed to symmetric: the literal `6` on `decorate`'s title branch is
   *  upstream's OWN asymmetry, reproduced as-is. */
  protected getMarginX(): number {
    return 0;
  }

  /** java:77-119 -- the separator loop (ADR-4). `this.area` mirrors
   *  upstream's shared `BodyEnhancedAbstract#area` field memoization
   *  (java:79-80's `if (area != null) return area;`), reimplemented here
   *  since `BodyEnhancedAbstract.ts` (T2a) dropped that field -- out of
   *  this task's write-set to restore there, and this subclass is its only
   *  consumer today. Split from {@link collectBlocks} (this class's own
   *  extraction, no upstream equivalent) purely to stay under this
   *  project's per-function NLOC ceiling -- no behavioral change. */
  protected getArea(stringBounder: StringBounder): TextBlock {
    if (this.area !== undefined) return this.area;

    const blocks = this.collectBlocks(stringBounder);
    this.area = blocks.length === 1 ? blocks[0]! : new TextBlockVertical(blocks, this.align);

    // java:114-116.
    if (this.minimumWidth > 0) {
      this.area = TextBlockUtils.withMinWidth(this.area, this.minimumWidth, this.align);
    }

    return this.area;
  }

  /** The body of java:84-107's separator loop plus the trailing
   *  java:109's final `blocks.add(...)` -- see {@link getArea}'s doc
   *  comment for why this is split out. */
  private collectBlocks(stringBounder: StringBounder): TextBlock[] {
    const blocks: TextBlock[] = [];
    let separator: string | 0 = 0;
    let title: TextBlock | undefined;
    let display = Display.empty();

    // java:88, `rawBody.iterator()` -- Java's `ListIterator<CharSequence>`
    // yields `displayData` VERBATIM (`Display.java:551-553`), unlike this
    // port's `[Symbol.iterator]()` (which coerces a `MessageNumber` element
    // to a plain string, `Display.ts`'s own module doc comment) -- so
    // `asList()` (the raw, uncoerced accessor) is the faithful equivalent
    // here, walked by index so `addOneSingleLineManageEmbedded2` can share
    // the same cursor (Java's `Iterator<CharSequence> it` passed by
    // reference into that method).
    const elements = this.rawBody.asList();
    let i = 0;
    while (i < elements.length) {
      const element = elements[i]!;
      i++;
      const text = String(element);
      if (getEmbeddedType(text) !== null) {
        display = display.add(element);
        const consumed = addOneSingleLineManageEmbedded2(elements, i, display);
        display = consumed.display;
        i = consumed.index;
      } else if (BodyEnhancedAbstract.isBlockSeparator(text)) {
        blocks.push(this.decorate(this.getTextBlock(display), separator, title, stringBounder));
        separator = text.charAt(0);
        title = this.getTitle(text);
        display = Display.empty();
      } else {
        display = display.add(element);
      }
    }

    blocks.push(this.decorate(this.getTextBlock(display), separator, title, stringBounder));
    return blocks;
  }

  /** java:137-140. `titleConfig`/`align`/`skinParam`/`lineBreakStrategy`
   *  bundle into `create9`'s `CreoleRenderContext` (ADR-9's `atomOps`
   *  injected alongside, no upstream equivalent). */
  private getTextBlock(display: Display): TextBlock {
    return display.create9(this.renderContext(), this.align, this.lineBreakStrategy);
  }

  /** `BodyEnhancedAbstract#getTitle(String, ISkinSimple)` (java:56-62,
   *  `BodyEnhancedAbstract.java`) -- see this class's own doc comment for
   *  why it lives here instead of the shared base. `s.length() <= 4`
   *  (java:57) covers the empty-title `"--"`/`"=="`/`".."`/`"__"` case
   *  (length 2 or 4 for the 2- and 4-char bare separators) faithfully. */
  private getTitle(s: string): TextBlock | undefined {
    if (s.length <= 4) return undefined;
    const inner = trin(s.slice(2, s.length - 2));
    return Display.getWithNewlines(this.skinParam.getPragma(), inner).create(this.renderContext(), HorizontalAlignment.LEFT);
  }

  private renderContext(): CreoleRenderContext {
    return { fontConfiguration: this.titleConfig, spriteContainer: this.skinParam, atomOps: this.atomOps };
  }
}

/**
 * `BodyEnhanced2#addOneSingleLineManageEmbedded2` (java:121-134, `private
 * static Display addOneSingleLineManageEmbedded2(Iterator<CharSequence>,
 * Display)`). Adapted to an index-cursor pair (`{display, index}`) instead
 * of Java's shared mutable `Iterator` -- the two are behaviorally
 * identical consumption models, only the "how the caller sees progress"
 * mechanism differs (TS has no `ListIterator` to pass by reference).
 *
 * Faithfully reproduces the easy-to-miss detail T2a's own module doc
 * comment on the sibling `EmbeddedDiagram.createAndSkip` flags for a
 * DIFFERENT method: here, UNLIKE `createAndSkip`, the line is added to
 * `display` BEFORE the nested-depth check runs (java:127, `display =
 * display.add(s);` precedes the `if`/`else if`) -- so even the OUTERMOST
 * closing `"}}"` line IS appended to the returned `Display`. This is a
 * distinct algorithm from `EmbeddedDiagram.createAndSkip` (which swallows
 * the outer closer), not a reuse of it.
 */
function addOneSingleLineManageEmbedded2(
  elements: readonly DisplayElement[],
  startIndex: number,
  initialDisplay: Display,
): { display: Display; index: number } {
  let nested = 1;
  let display = initialDisplay;
  let i = startIndex;
  while (i < elements.length) {
    const element = elements[i]!;
    i++;
    display = display.add(element);
    const text = String(element);
    if (getEmbeddedType(text) !== null) {
      nested++;
    } else if (trim2(text) === EmbeddedDiagram.EMBEDDED_END) {
      nested--;
      if (nested === 0) return { display, index: i };
    }
  }
  return { display, index: i };
}

/** `StringUtils.trin(String)` (`StringUtils.java:502-520`) -- trims only
 *  characters whose code point is <= U+0020, from both ends. Duplicated
 *  locally rather than imported: this exact one-liner is already
 *  independently duplicated in `driver-text-svg.ts`/`link-decor.ts`
 *  (established precedent -- no shared `StringUtils.ts` owner exists in
 *  this port). */
function trin(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}

/** `StringUtils.trim2(CharSequence)` (`StringUtils.java:534-552`) -- same
 *  trim predicate as {@link trin} over a different upstream signature.
 *  Duplicated locally matching `EmbeddedDiagram.ts`/`CreoleParser.ts`'s own
 *  established precedent for this exact utility (no shared owner). */
function trim2(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}
