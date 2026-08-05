/**
 * Display — the value type every diagram element's label/description text
 * flows through: an ordered list of lines (plain `string`, or a
 * `Stereotype`/`MessageNumber` "special" element at certain positions),
 * plus the metadata `create0`'s dispatch and the creole pipeline need.
 * `Display.NULL` (java:99-103) ports the "Null Object Pattern" sentinel.
 *
 * Upstream: klimt/creole/Display.java (796 lines). Split across five
 * files (all equally part of this port) to stay under this project's
 * per-file/per-function complexity budget: `Display.ts` (this file —
 * construction, core read surface, `create*` public API whose dispatch
 * lives in `DisplayCreole.ts`), `DisplayNewlines.ts` (`getWithNewlines`
 * scanner + `hasSeveralGuideLines`), `DisplayText.ts` ("same metadata, new
 * content" `add*`/`with*`/`replace*`/`underlined*`/`splitMultiline` —
 * every method here is a 1-line delegator built on {@link
 * Display#withData}), `DisplayEquality.ts` (`equals`/`hashCode`), and
 * `DisplayCreole.ts` (`create0`'s dispatch, needs `SheetBlock1`/
 * `SheetBlock2`/`ISkinSimple`/`AtomOps` — a separate rendering concern).
 *
 * ## `DisplayLike` compliance (`SheetBuilder.ts`, T9a's own seam)
 *
 * `isNull`/`showStereotype` are `get` accessors (not upstream's `boolean`
 * methods) so `display.isNull`/`display.showStereotype` satisfy
 * `DisplayLike`'s plain-property contract while remaining computed.
 *
 * `[Symbol.iterator]()` coerces a `MessageNumber` element to
 * `String(element)` (it does not structurally satisfy `StereotypeLike` —
 * no `getLabels`) rather than yielding it verbatim — matching upstream's
 * REAL behavior: `CreoleParser#createSheetSlow` (java:166-174) only
 * special-cases `cs instanceof Stereotype`; every other `CharSequence`
 * (including a `MessageNumber`, which `createMessageNumber`'s own
 * `subList(0,1)` feeds through `getCreole`, java:706) falls through to
 * `cs.toString()`. `get(i)`/`asList()`/`create0`'s own `instanceof`
 * checks still read the RAW element; only this iterator view coerces.
 *
 * `cacheKey()` is not an upstream member — see `SheetBuilder.ts`'s
 * contract: value-derived from `displayData`, one sentinel for `isNull`,
 * so value-equal `Display`s collide in `CreoleParser`'s cache exactly as
 * `hashCode`/`equals` (java:105-115) intend.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java
 */
import type { HorizontalAlignment } from '../geom/HorizontalAlignment.js';
import { CreoleMode } from './CreoleMode.js';
import type { Stereotype } from '../../stereo/Stereotype.js';
import { isStereotype } from '../../stereo/Stereotype.js';
import { Pragma } from '../../skin/Pragma.js';
import type { StringLocated } from '../../tim/StringLocated.js';
import { EmbeddedDiagram } from '../../EmbeddedDiagram.js';
import type { DisplayLike, DisplayLine, MemberLike } from './SheetBuilder.js';
import { parseWithNewlines, getWithNewlines3 as parseWithNewlines3, hasSeveralGuideLinesOfString } from './DisplayNewlines.js';
import { displayEquals, displayHashCode } from './DisplayEquality.js';
import {
  replaceBackslashT as replaceBackslashTImpl,
  replace as replaceText,
  manageGuillemet as manageGuillemetText,
  withPage as withPageText,
  removeEndingStereotype as removeEndingStereotypeText,
  getEndingStereotype as getEndingStereotypeText,
  underlined as underlinedText,
  underlinedName as underlinedNameText,
  addAll as addAllText,
  addFirst as addFirstText,
  appendFirstLine as appendFirstLineText,
  add as addText,
  addGeneric as addGenericText,
  splitMultiline as splitMultilineText,
  toTooltipText as toTooltipTextText,
  hasSeveralGuideLines as hasSeveralGuideLinesText,
} from './DisplayText.js';
import { create0 as creoleCreate0 } from './DisplayCreole.js';
import type { CreoleRenderContext, StereotypeFontOverride, CreoleMargins } from './DisplayCreole.js';
import type { TextBlock } from '../shape/TextBlock.js';
import { LineBreakStrategy } from '../LineBreakStrategy.js';
import type { MessageNumber as MessageNumberLike } from '../../sequencediagram/MessageNumber.js';

/** One element of `Display#displayData` (upstream: `List<CharSequence>`).
 *  `Stereotype`/`MessageNumber`/`Member` are the only non-`String` kinds
 *  upstream ever places there (`create0`'s `instanceof` dispatch, T9a/T9b;
 *  `Member` added SI1/T7 as `SheetBuilder.ts`'s duck-typed `MemberLike`). */
export type DisplayElement = string | Stereotype | MessageNumberLike | MemberLike;

/** `Display`'s private field bag — a single object rather than 5 loose
 *  private fields, matching `UHorizontalLine.ts`/`URectangle.ts`'s own
 *  established "fields object" complexity-hook accommodation (keeps the
 *  private constructor to 1 parameter instead of juggling 3 upstream
 *  constructor overloads' worth of positional params). */
interface DisplayFields {
  readonly showStereotype: boolean;
  readonly displayData: DisplayElement[] | null;
  readonly naturalHorizontalAlignment: HorizontalAlignment | null;
  readonly isNull: boolean;
  readonly defaultCreoleMode: CreoleMode;
}

/** `Quark<Entity>`'s minimal shape `Display.getWithNewlines(Quark)`
 *  (java:223-225) reads -- `plasma.Quark`/`abel.Entity` are not ported
 *  anywhere in this port; duck-typing the ONE method this call site reads
 *  avoids porting that whole subsystem, faithfully, with zero seam. */
export interface QuarkLike {
  getName(): string;
}

const ONLY_WHITESPACE = /^\s*$/;

export class Display implements DisplayLike, Iterable<DisplayLine> {
  private readonly f: DisplayFields;

  private constructor(fields: DisplayFields) {
    this.f = fields;
  }

  private static base(
    showStereotype: boolean,
    naturalHorizontalAlignment: HorizontalAlignment | null,
    isNull: boolean,
    defaultCreoleMode: CreoleMode,
  ): Display {
    return new Display({
      showStereotype,
      displayData: isNull ? null : [],
      naturalHorizontalAlignment: isNull ? null : naturalHorizontalAlignment,
      isNull,
      defaultCreoleMode,
    });
  }

  private static fromOther(showStereotype: boolean, other: Display, mode: CreoleMode): Display {
    const result = new Display({
      showStereotype,
      displayData: other.f.isNull ? null : [],
      naturalHorizontalAlignment: other.f.isNull ? null : other.f.naturalHorizontalAlignment,
      isNull: other.f.isNull,
      defaultCreoleMode: mode,
    });
    if (!other.f.isNull) (result.f.displayData as DisplayElement[]).push(...(other.f.displayData as DisplayElement[]));
    return result;
  }

  static fromElements(
    showStereotype: boolean,
    other: readonly DisplayElement[],
    naturalHorizontalAlignment: HorizontalAlignment | null,
    isNull: boolean,
    defaultCreoleMode: CreoleMode,
  ): Display {
    return new Display({
      showStereotype,
      displayData: isNull ? null : [...other],
      naturalHorizontalAlignment: isNull ? null : naturalHorizontalAlignment,
      isNull,
      defaultCreoleMode,
    });
  }

  /** java:103. */
  static readonly NULL: Display = Display.base(true, null, true, CreoleMode.FULL);

  /** java:177-179. A NON-null, EMPTY display -- distinct from {@link NULL}. */
  static empty(): Display {
    return Display.base(true, null, false, CreoleMode.FULL);
  }

  /** java:181-183 (varargs) / java:219-221 (`Collection`) -- one TS
   *  implementation covers both upstream overloads (a single array
   *  argument is type-distinguishable from a variadic element list only
   *  by shape, so both call styles route here). */
  static create(...s: readonly DisplayElement[]): Display;
  static create(other: readonly DisplayElement[]): Display;
  static create(...args: readonly DisplayElement[] | [readonly DisplayElement[]]): Display {
    const items: readonly DisplayElement[] =
      args.length === 1 && Array.isArray(args[0]) ? (args[0] as readonly DisplayElement[]) : (args as readonly DisplayElement[]);
    return Display.fromElements(true, items, null, false, CreoleMode.FULL);
  }

  /** java:185-198 -- `NoSuchColorException` not propagated (this port's
   *  color resolvers never throw, `HColorSet.ts`'s own established
   *  convention); `CreoleParser.checkColor(result)` is commented out
   *  upstream too (dead code, not a drop). */
  static createFoo(data: readonly StringLocated[]): Display {
    const tmp: string[] = data.map((s) => s.getString());
    if (tmp.length > 2) {
      const last = tmp[tmp.length - 1];
      const secondLast = tmp[tmp.length - 2];
      if (last === '' && secondLast === EmbeddedDiagram.EMBEDDED_END) tmp.pop();
    }
    return Display.create(tmp);
  }

  /** java:223-225 (`Quark<Entity>` overload) / java:262-346 (the real
   *  scanner). See {@link QuarkLike}'s own doc comment for the `Quark`
   *  adaptation. */
  static getWithNewlines(quark: QuarkLike): Display;
  static getWithNewlines(pragma: Pragma, s: string | null): Display;
  static getWithNewlines(pragmaOrQuark: Pragma | QuarkLike, s?: string | null): Display {
    if (s === undefined) {
      const quark = pragmaOrQuark as QuarkLike;
      return Display.getWithNewlines(Pragma.createEmpty(), quark.getName());
    }
    const pragma = pragmaOrQuark as Pragma;
    const parsed = parseWithNewlines(pragma, s);
    if (parsed === null) return Display.NULL;
    return Display.fromElements(true, parsed.lines, parsed.naturalHorizontalAlignment, false, CreoleMode.FULL);
  }

  /** java:227-231 -- `NoSuchColorException` not propagated, see {@link
   *  createFoo}'s identical note; `checkColor` is commented out upstream. */
  static getWithNewlines2(pragma: Pragma, s: string): Display {
    return Display.getWithNewlines(pragma, s);
  }

  /** java:233-258. */
  static getWithNewlines3(s: string | null): readonly string[] | null {
    return parseWithNewlines3(s);
  }

  /** java:609-612. */
  static isNull(display: Display | null | undefined): boolean {
    return display === null || display === undefined || display.isNull;
  }

  /** java:720-727 (the `String`-splitting overload). */
  static hasSeveralGuideLines(s: string): boolean {
    return hasSeveralGuideLinesOfString(s);
  }

  /** `DisplayLike.isNull` (`SheetBuilder.ts`) / java's private `isNull`
   *  field, read throughout the Java via `this.isNull`. */
  get isNull(): boolean {
    return this.f.isNull;
  }

  /** `DisplayLike.showStereotype` / java:123-125's `showStereotype()`. */
  get showStereotype(): boolean {
    return this.f.showStereotype;
  }

  /** Not an upstream member -- lets `DisplayText.ts`'s free functions
   *  rebuild a `Display` (same metadata, new content) via public surface
   *  only, with no private-field access across the file split. */
  withData(data: readonly DisplayElement[]): Display {
    return Display.fromElements(this.f.showStereotype, data, this.f.naturalHorizontalAlignment, this.f.isNull, this.f.defaultCreoleMode);
  }

  /** Companion to {@link withData}: an empty `Display` sharing this
   *  instance's metadata (`DisplayText.ts#splitMultiline`'s own need). */
  withMetadataOnly(): Display {
    return Display.base(this.f.showStereotype, this.f.naturalHorizontalAlignment, this.f.isNull, this.f.defaultCreoleMode);
  }

  /** java:105-110. See `DisplayEquality.ts`. */
  hashCode(): number {
    return displayHashCode(this, this.cacheKey());
  }

  /** java:112-115. See `DisplayEquality.ts` for the citation (ported
   *  VERBATIM, including the unguarded-on-NULL quirk). */
  equals(other: Display): boolean {
    return displayEquals(this, other);
  }

  /** java:117-121. */
  equalsLike(other: Display): boolean {
    if (Display.isNull(this)) return Display.isNull(other);
    return this.equals(other);
  }

  /** java:139-146. */
  getStereotypeIfAny(): Stereotype | undefined {
    for (const cs of this.f.displayData ?? []) {
      if (isStereotype(cs)) return cs;
    }
    return undefined;
  }

  /** java:127-137 -- BLOCKED on `Style`/`PName`/`Value`/`ValueNull`, none
   *  of which exists anywhere in this port (the SAME gap
   *  `Stereotype.ts#getStyles`/`SheetBlock1.ts`/`ClockwiseTopRightBottomLeft
   *  .ts#marginForDocument` already hit in this batch). ADR-8 corollary:
   *  genuinely large, separable follow-on, not silently dropped. */
  withoutStereotypeIfNeeded(_usedStyle: unknown): Display {
    if (this === Display.NULL) return Display.NULL;
    throw new Error('Display.withoutStereotypeIfNeeded: needs style/Style + PName + Value + ValueNull -- absent anywhere in this port.');
  }

  /** java:566-573 -- BLOCKED on `url/UrlBuilder.java`(148)+`Url.java`(131)+
   *  `UrlMode.java`(40), 319 lines, none ported, zero callers today
   *  (ADR-8). Genuinely large, separable follow-on, not silently dropped. */
  hasUrl(): boolean {
    throw new Error('Display.hasUrl: needs url/UrlBuilder+Url+UrlMode (319 Java lines), none ported anywhere in this port.');
  }

  /** java:148-157. See `DisplayText.ts` for the implementation + citation. */
  replaceBackslashT(): Display {
    return replaceBackslashTImpl(this);
  }

  /** java:159-168. See `DisplayText.ts`. */
  replace(src: string, dest: string): Display {
    return replaceText(this, src, dest);
  }

  /** java:410-425. See `DisplayText.ts`. */
  manageGuillemet(manageVisibilityModifier: boolean): Display {
    return manageGuillemetText(this, manageVisibilityModifier);
  }

  /** java:427-439. See `DisplayText.ts`. */
  withPage(page: number, lastpage: number): Display {
    return withPageText(this, page, lastpage);
  }

  /** java:441-450. See `DisplayText.ts`. */
  removeEndingStereotype(): Display {
    return removeEndingStereotypeText(this);
  }

  /** java:454-460. See `DisplayText.ts`. */
  getEndingStereotype(): Stereotype | undefined {
    return getEndingStereotypeText(this);
  }

  /** java:462-469. See `DisplayText.ts`. */
  underlined(): Display {
    return underlinedText(this);
  }

  /** java:473-488. See `DisplayText.ts`. */
  underlinedName(): Display {
    return underlinedNameText(this);
  }

  /** java:505-509. See `DisplayText.ts`. */
  addAll(other: Display): Display {
    return addAllText(this, other);
  }

  /** java:511-515. See `DisplayText.ts`. */
  addFirst(s: DisplayElement): Display {
    return addFirstText(this, s);
  }

  /** java:517-521. See `DisplayText.ts`. */
  appendFirstLine(appended: string): Display {
    return appendFirstLineText(this, appended);
  }

  /** java:523-527. See `DisplayText.ts`. */
  add(s: DisplayElement): Display {
    return addText(this, s);
  }

  /** java:529-538. See `DisplayText.ts`. */
  addGeneric(s: DisplayElement): Display {
    return addGenericText(this, s);
  }

  /** java:579-599. See `DisplayText.ts`. */
  splitMultiline(separator: RegExp): readonly Display[] {
    return splitMultilineText(this, separator);
  }

  /** java:601-605. See `DisplayText.ts`. */
  toTooltipText(): string {
    return toTooltipTextText(this);
  }

  /** java:715-717. See `DisplayText.ts`. */
  hasSeveralGuideLines(): boolean {
    return hasSeveralGuideLinesText(this);
  }

  /** java:172-175. */
  isWhite(): boolean {
    const data = this.f.displayData;
    if (data === null || data.length === 0) return true;
    return data.length === 1 && ONLY_WHITESPACE.test(String(data[0]));
  }

  /** java:490-495. */
  withCreoleMode(mode: CreoleMode): Display {
    if (this.f.isNull) throw new Error('IllegalArgumentException');
    return Display.fromOther(this.f.showStereotype, this, mode);
  }

  /** java:497-503. */
  toString(): string {
    if (this.f.isNull) return 'NULL';
    return `[${(this.f.displayData as DisplayElement[]).map((e) => String(e)).join(', ')}]`;
  }

  /** java:540-545. */
  size(): number {
    if (this.f.isNull) return 0;
    return (this.f.displayData as DisplayElement[]).length;
  }

  /** java:547-549. */
  get(i: number): DisplayElement {
    return (this.f.displayData as DisplayElement[])[i] as DisplayElement;
  }

  /** `DisplayLike`'s `Iterable<DisplayLine>` surface -- see this file's
   *  own module doc comment for why a `MessageNumber` element is coerced
   *  to a plain string here rather than yielded verbatim. */
  [Symbol.iterator](): Iterator<DisplayLine> {
    const data = this.f.displayData ?? [];
    let i = 0;
    return {
      next: (): IteratorResult<DisplayLine> => {
        if (i >= data.length) return { done: true, value: undefined };
        const element = data[i] as DisplayElement;
        i++;
        return { done: false, value: isStereotype(element) ? element : String(element) };
      },
    };
  }

  /** java:555-558. Upstream param name `size` is really a `toIndex`
   *  (preserved verbatim per "preserve names, including the misleading
   *  ones" -- `List#subList(fromIndex, toIndex)`'s own Java convention). */
  subList(i: number, size: number): Display {
    const data = (this.f.displayData as DisplayElement[]).slice(i, size);
    return Display.fromElements(this.f.showStereotype, data, this.f.naturalHorizontalAlignment, this.f.isNull, this.f.defaultCreoleMode);
  }

  /** java:560-564. */
  asList(): readonly DisplayElement[] {
    return this.f.displayData ?? [];
  }

  /** java:575-577. */
  getNaturalHorizontalAlignment(): HorizontalAlignment | null {
    return this.f.naturalHorizontalAlignment;
  }

  /** java:769-777. */
  contentWidth(): number {
    let width = 0;
    for (let i = 0; i < this.size(); i++) {
      const len = String(this.get(i)).length;
      if (len > width) width = len;
    }
    return width;
  }

  /** `cacheKey()` -- not an upstream member, see this file's own module
   *  doc comment / `SheetBuilder.ts`'s documented contract. Value-based:
   *  two `Display`s with identical `displayData` return equal keys; one
   *  reserved sentinel (`' NULL'`, cannot arise from real content since it
   *  starts with a space -- upstream's `create*` factories never produce a
   *  leading-space-only first line via this exact sentinel) covers {@link
   *  NULL}. */
  cacheKey(): string {
    if (this.f.isNull) return ' NULL';
    return (this.f.displayData as DisplayElement[]).map((e) => (isStereotype(e) ? `S:${e.toString()}` : `s:${String(e)}`)).join(' ');
  }

  // -- create* public API (java:614-669); dispatch lives in DisplayCreole.ts.

  /** java:614-617. */
  create(ctx: CreoleRenderContext, horizontalAlignment: HorizontalAlignment): TextBlock {
    return this.create7(ctx, horizontalAlignment, CreoleMode.FULL);
  }

  /** java:619-623. */
  create7(ctx: CreoleRenderContext, horizontalAlignment: HorizontalAlignment, creoleMode: CreoleMode): TextBlock {
    return creoleCreate0(this, ctx, { horizontalAlignment, maxMessageSize: LineBreakStrategy.NONE, creoleMode });
  }

  /** java:625-629. */
  create8(
    ctx: CreoleRenderContext,
    horizontalAlignment: HorizontalAlignment,
    modeSimpleLine: CreoleMode,
    maxMessageSize: LineBreakStrategy,
  ): TextBlock {
    return creoleCreate0(this, ctx, { horizontalAlignment, maxMessageSize, creoleMode: modeSimpleLine });
  }

  /** java:631-635. */
  create9(ctx: CreoleRenderContext, horizontalAlignment: HorizontalAlignment, maxMessageSize: LineBreakStrategy): TextBlock {
    return creoleCreate0(this, ctx, { horizontalAlignment, maxMessageSize, creoleMode: this.f.defaultCreoleMode });
  }

  /** java:637-669 (both overloads collapsed via optional trailing params,
   *  matching `TextBlockUtils.withMargin`'s precedent). `atomOps` (ADR-9)
   *  lives inside `ctx`. */
  create0(
    ctx: CreoleRenderContext,
    horizontalAlignment: HorizontalAlignment,
    maxMessageSize: LineBreakStrategy,
    creoleMode: CreoleMode,
    override: StereotypeFontOverride = {},
    margins: CreoleMargins = {},
  ): TextBlock {
    return creoleCreate0(this, ctx, { horizontalAlignment, maxMessageSize, creoleMode }, override, margins);
  }
}
