import { Display, type DisplayElement } from '../klimt/creole/Display.js';
import { CreoleMode } from '../klimt/creole/CreoleMode.js';
import type { CreoleRenderContext } from '../klimt/creole/DisplayCreole.js';
import type { AtomOps } from '../klimt/creole/Sea.js';
import { isTreeStart } from '../klimt/creole/Parser.js';
import { CreoleParser } from '../klimt/creole/legacy/CreoleParser.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { XRectangle2D } from '../klimt/geom/XRectangle2D.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../klimt/shape/TextBlockUtils.js';
import { TextBlockVertical } from '../klimt/shape/TextBlockVertical.js';
import type { NestedDiagramRenderer } from '../EmbeddedDiagram.js';
import type { Entity } from '../abel/Entity.js';
import { LeafType } from '../abel/LeafType.js';
import type { Url } from '../url/Url.js';
import { Ports } from '../svek/Ports.js';
import type { WithPorts } from '../svek/WithPorts.js';
import { BodyEnhancedAbstract } from './BodyEnhancedAbstract.js';
import { Member } from './Member.js';
import { MethodsOrFieldsArea } from './MethodsOrFieldsArea.js';
import type { MethodsOrFieldsAreaSkinParam } from './MethodsOrFieldsAreaConfig.js';
import type { BodyEnhanced1Config, BodyEnhanced1StyleValues } from './BodyEnhanced1Config.js';

/**
 * BodyEnhanced1 — the `BodyEnhancedAbstract` concrete for the class/
 * object member-list body AND the folder/package title body
 * (`BodyFactory.create1`/`create2`, ADR-4): raw body lines are split at
 * `--`/`==`/`..`/`__` block separators, each run rendered as one
 * `MethodsOrFieldsArea` compartment `decorate`d with the shared
 * separator geometry (`BodyEnhancedAbstract.ts` — `getMarginX()=6`, the
 * T6-narrowing-#1 folder-title margin), tree/table runs rendered as one
 * creole block, member urls collected for the entity image.
 *
 * Upstream: cucadiagram/BodyEnhanced1.java (246 lines). Ported in full:
 * both package-private constructors (java:78-109, collapsed onto one TS
 * constructor discriminated by `rawBody instanceof Display` — exactly
 * upstream's `List<CharSequence>` vs `Display` overload split; the
 * entry points are `BodyFactory.create1`/`create2`), `getMarginX`,
 * `isTreeOrTable`, `getArea` (the separator loop, java:123-187),
 * `buildTextBlock`, the `p` leading-whitespace pattern,
 * `buildTreeOrTable`, `purge`, `getPorts`, `getUrls`,
 * `getInnerPosition`, and all seven fields.
 *
 * ## Constructor shape — the ADR-9 seam idiom
 *
 * Upstream's `(align, rawBody|display, skinParam, entity, style)`
 * becomes `(rawBody|display, config, entity, styleValues, atomOps)`:
 * `align`+`skinParam` group into {@link BodyEnhanced1Config} and the
 * `Style` reads into {@link BodyEnhanced1StyleValues}
 * (`MethodsOrFieldsArea.ts`'s landed constructor mirrored member for
 * member — see `BodyEnhanced1Config.ts` for every upstream expression).
 * Upstream's `super(align, style.getFontConfiguration(skinParam
 * .getIHtmlColorSet(), entity.getColors()), style)` call collapses to
 * `super(styleValues.lineThickness)` because this port's
 * `BodyEnhancedAbstract` (T2a) keeps only the thickness field; `align`
 * and the title `FontConfiguration` are stored HERE instead
 * (`BodyEnhanced2.ts`'s identical adaptation).
 *
 * ## `getTitle` — third scope-forced private copy (reported)
 *
 * Upstream defines `getTitle` on `BodyEnhancedAbstract` (java:93-100
 * there); this port's abstract has no `titleConfig`/`skinParam`/
 * `atomOps` fields to host it, and adding them would change
 * `BodyEnhanced2.ts`'s `super()` call — out of this task's write-set. So
 * this class carries a private copy, exactly as `BodyEnhanced2.ts#getTitle`
 * already does (its doc comment flagged this consolidation for T9;
 * honoring it requires a BodyEnhanced2 edit, so it remains flagged for a
 * batch that owns all three files).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java
 */
export class BodyEnhanced1 extends BodyEnhancedAbstract implements WithPorts {
  private readonly rawBody2: Display;
  private readonly skinParam: MethodsOrFieldsAreaSkinParam;
  private readonly lineFirst: boolean;
  private readonly urls: Url[] = [];
  private readonly entity: Entity;
  private readonly inEllipse: boolean;
  private readonly align: HorizontalAlignment;
  private readonly styleValues: BodyEnhanced1StyleValues;
  private readonly atomOps: AtomOps;
  private readonly nestedDiagramRenderer: NestedDiagramRenderer | undefined;
  /** Upstream's shared `BodyEnhancedAbstract#area` memoization field —
   *  reimplemented locally since T2a dropped it from the abstract
   *  (`BodyEnhanced2.ts#getArea`'s identical note). */
  private area: TextBlock | undefined;

  /** Both upstream constructors: `List<CharSequence> rawBody` (java:
   *  78-90 — `lineFirst=true`, `inEllipse=false`) vs `Display display`
   *  (java:92-109 — `lineFirst=false`, `inEllipse` from the leaf type,
   *  with the leading-separator blank-line append). Discriminated by
   *  `rawBody instanceof Display`, exactly upstream's overload split.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:78-109 */
  constructor(
    rawBody: readonly (string | Member)[] | Display,
    config: BodyEnhanced1Config,
    entity: Entity,
    styleValues: BodyEnhanced1StyleValues,
    atomOps: AtomOps,
  ) {
    super(styleValues.lineThickness);
    this.skinParam = config.skinParam;
    this.align = config.align;
    this.nestedDiagramRenderer = config.nestedDiagramRenderer;
    this.entity = entity;
    this.styleValues = styleValues;
    this.atomOps = atomOps;

    if (rawBody instanceof Display) {
      // java:92-109
      this.lineFirst = false;
      const leafType = entity.getLeafType();
      this.inEllipse = leafType === LeafType.USECASE || leafType === LeafType.USECASE_BUSINESS;
      let display = rawBody;
      if (this.inEllipse && display.size() > 0 && BodyEnhancedAbstract.isBlockSeparator(String(display.get(0))))
        display = display.add('');

      this.rawBody2 = display;
    } else {
      // java:78-90
      this.rawBody2 = Display.create(rawBody as readonly DisplayElement[]);
      this.lineFirst = true;
      this.inEllipse = false;
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:111-115 */
  protected getMarginX(): number {
    return 6;
  }

  /** java:123-187 — the separator loop. `this.area` memoizes exactly as
   *  upstream's `if (area != null) return area;` (java:124-125). Split
   *  from {@link collectBlocks} purely for this project's per-function
   *  NLOC ceiling (`BodyEnhanced2.ts#getArea`'s identical split — no
   *  behavioral change).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:123-187 */
  protected getArea(stringBounder: StringBounder): TextBlock {
    if (this.area !== undefined) return this.area;

    // java:127 `urls.clear()`
    this.urls.length = 0;
    const blocks = this.collectBlocks(stringBounder);

    // java:177-180
    this.area = blocks.length === 1 ? blocks[0]! : new TextBlockVertical(blocks, this.align);

    // java:182-184
    const minClassWidth = this.styleValues.minimumWidth;
    if (minClassWidth > 0) this.area = TextBlockUtils.withMinWidth(this.area, minClassWidth, this.align);

    return this.area;
  }

  /** The body of java:128-175's loop plus the trailing blank-display
   *  handling and final `blocks.add(...)` — see {@link getArea}. The
   *  shared index cursor replaces Java's `ListIterator<CharSequence>`
   *  passed into `buildTreeOrTable` (`MethodsOrFieldsArea.ts`'s
   *  documented cursor adaptation). */
  private collectBlocks(stringBounder: StringBounder): TextBlock[] {
    const blocks: TextBlock[] = [];
    let separator: string | 0 = this.lineFirst ? '_' : 0; // java:131
    let title: TextBlock | undefined;
    let display: Display | undefined;
    const elements = this.rawBody2.asList();
    const cursor = { i: 0 };
    while (cursor.i < elements.length) {
      const cs = elements[cursor.i]!;
      cursor.i++;
      const s = String(cs);
      if (BodyEnhancedAbstract.isBlockSeparator(s)) {
        // java:137-142
        blocks.push(this.buildTextBlock(display ?? Display.empty(), separator, title, stringBounder));
        separator = s.charAt(0);
        title = this.getTitle(s, this.skinParam);
        display = undefined;
      } else if (isTreeOrTable(s)) {
        // java:143-160
        const isTable = CreoleParser.isTableLine(s);
        blocks.push(this.buildTextBlock(display ?? Display.empty(), separator, title, stringBounder));
        separator = 0;
        title = undefined;
        display = undefined;
        const allTree = buildTreeOrTable(s, elements, cursor);
        let block = Display.create(allTree).create7(
          this.renderContext(this.styleValues.treeTableFontConfig),
          this.align,
          CreoleMode.FULL,
        );
        // java:156-157 — Java's 4-margin overload `(x1, x2, y1, y2)`.
        if (isTable) block = TextBlockUtils.withMargin(block, 10, 10, 0, 5);

        blocks.push(block);
      } else {
        // java:161-168
        display = (display ?? Display.empty()).add(cs);
        if (cs instanceof Member && cs.getUrl() !== null) this.urls.push(cs.getUrl()!);
      }
    }

    // java:170-173
    if (display === undefined) display = Display.empty();
    if (this.inEllipse && display.size() === 0) display = display.add('');

    blocks.push(this.buildTextBlock(display, separator, title, stringBounder));
    return blocks;
  }

  /** The upstream commented-out `create9` line stays commented-out there
   *  — not ported. The `MethodsOrFieldsArea` construction is upstream's
   *  5-arg `(display, skinParam, align, entity, style)` overload,
   *  threaded through T8's ADR-9 seam (`MethodsOrFieldsAreaConfig.ts` —
   *  every upstream value mapped in `BodyEnhanced1Config.ts`).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:189-195 */
  private buildTextBlock(
    display: Display,
    separator: string | 0,
    title: TextBlock | undefined,
    stringBounder: StringBounder,
  ): TextBlock {
    let result: TextBlock = new MethodsOrFieldsArea(
      display,
      {
        skinParam: this.skinParam,
        align: this.align,
        memberFontConfig: this.styleValues.memberFontConfig,
        ...(this.nestedDiagramRenderer !== undefined && { nestedDiagramRenderer: this.nestedDiagramRenderer }),
      },
      this.entity,
      {
        lineThickness: this.styleValues.lineThickness,
        wrapWidth: this.styleValues.wrapWidth,
        ...(this.styleValues.resolveVisibilityStyle !== undefined && {
          resolveVisibilityStyle: this.styleValues.resolveVisibilityStyle,
        }),
      },
      this.atomOps,
    );
    result = this.decorate(result, separator, title, stringBounder);
    return result;
  }

  /** `BodyEnhancedAbstract#getTitle(String, ISkinSimple)` (java:93-100
   *  there) — scope-forced private copy, see the class doc comment.
   *  `s.length() <= 4` covers the bare 2-/4-char separators; the title
   *  renders with `titleConfig` at `HorizontalAlignment.LEFT` (upstream
   *  hard-codes LEFT, not `align`). */
  private getTitle(s: string, spriteContainer: MethodsOrFieldsAreaSkinParam): TextBlock | undefined {
    if (s.length <= 4) return undefined;
    const inner = trin(s.slice(2, s.length - 2));
    return Display.getWithNewlines(spriteContainer.getPragma(), inner).create(
      this.renderContext(this.styleValues.titleConfig),
      HorizontalAlignment.LEFT,
    );
  }

  /** Bundles the positional `(fontConfiguration, align, skinParam, …)`
   *  creole arguments into this port's `CreoleRenderContext` (ADR-9's
   *  `atomOps` alongside — `BodyEnhanced2.ts#renderContext`'s shape). */
  private renderContext(fontConfiguration: CreoleRenderContext['fontConfiguration']): CreoleRenderContext {
    return { fontConfiguration, spriteContainer: this.skinParam, atomOps: this.atomOps };
  }

  /** Upstream's `area instanceof WithPorts` — duck-typed per
   *  `TextBlockLineBefore.ts#getPorts`'s documented convention.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:227-234 */
  getPorts(stringBounder: StringBounder): Ports {
    const area = this.getArea(stringBounder);
    const candidate = area as Partial<WithPorts>;
    if (typeof candidate.getPorts === 'function') return candidate.getPorts(stringBounder);

    return new Ports();
  }

  /** `Collections.unmodifiableList(urls)` → readonly snapshot. The list
   *  is populated by `getArea` (a measurement must happen first, exactly
   *  as upstream — `EntityImageClass` always measures before reading).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:236-238 */
  getUrls(): readonly Url[] {
    return [...this.urls];
  }

  /** `getInnerPosition` is not on this port's `TextBlock` interface —
   *  duck-typed per `TextBlockLineBefore.ts`'s documented convention.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:240-243 */
  getInnerPosition(member: string, stringBounder: StringBounder): XRectangle2D | undefined {
    const area = this.getArea(stringBounder) as Partial<{
      getInnerPosition(m: string, sb: StringBounder): XRectangle2D | undefined;
    }>;
    return area.getInnerPosition?.(member, stringBounder);
  }
}

/** `StringUtils.trim2` then `Parser.isTreeStart || CreoleParser.isTableLine`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:117-120 */
function isTreeOrTable(s: string): boolean {
  const trimmed = trim2(s);
  return isTreeStart(trimmed) || CreoleParser.isTableLine(trimmed);
}

/** `private static final Pattern p = Pattern.compile("^(\\s+)")`
 *  (java:197). Java's `\s` is the ASCII class `[ \t\n\x0B\f\r]` — NOT
 *  JS's Unicode-wide `\s` — so the class is written out explicitly. */
const p = /^([ \t\n\x0B\f\r]+)/;

/** The tree/table run collector: consumes consecutive tree/table lines,
 *  un-indenting each by the FIRST line's leading whitespace (`purge`).
 *  Java's shared `ListIterator` + `it.previous()` pushback becomes a
 *  peek-then-advance over the shared index cursor — the non-matching
 *  line is never consumed, exactly as upstream's pushback leaves it for
 *  the caller's loop.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:199-218 */
function buildTreeOrTable(init: string, elements: readonly DisplayElement[], cursor: { i: number }): string[] {
  const result: string[] = [];
  const m = p.exec(init);
  let start = '';
  if (m !== null) start = m[1]!;

  result.push(purge(init, start));
  while (cursor.i < elements.length) {
    const s = String(elements[cursor.i]);
    if (isTreeOrTable(s)) {
      result.push(purge(s, start));
      cursor.i++;
    } else {
      return result;
    }
  }
  return result;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodyEnhanced1.java:220-225 */
function purge(s: string, start: string): string {
  if (s.startsWith(start)) return s.slice(start.length);

  return s;
}

/** `StringUtils.trin(String)` — same local copy as `BodyEnhanced2.ts`
 *  (established precedent; no shared `StringUtils.ts` owner exists). */
function trin(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}

/** `StringUtils.trim2(CharSequence)` — same local copy as
 *  `BodyEnhanced2.ts` (established precedent; no shared owner). */
function trim2(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}
