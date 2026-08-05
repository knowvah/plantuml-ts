import { TextBlockMemoized } from '../klimt/shape/TextBlockMemoized.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { TextBlockLineBefore } from '../klimt/shape/TextBlockLineBefore.js';
import { TextBlockUtils } from '../klimt/shape/TextBlockUtils.js';
import { TextBlockWithUrl } from '../klimt/shape/TextBlockWithUrl.js';
import type { FontConfiguration } from '../klimt/shape/UText.js';
import { FontStyle } from '../klimt/shape/UText.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import { UTranslate } from '../klimt/UTranslate.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import { XDimension2D } from '../klimt/geom/XDimension2D.js';
import { XRectangle2D } from '../klimt/geom/XRectangle2D.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { PlacementStrategy } from '../klimt/geom/PlacementStrategy.js';
import { PlacementStrategyVisibility } from '../klimt/geom/PlacementStrategyVisibility.js';
import { PlacementStrategyY1Y2Center } from '../klimt/geom/PlacementStrategyY1Y2Center.js';
import { PlacementStrategyY1Y2Left } from '../klimt/geom/PlacementStrategyY1Y2Left.js';
import { PlacementStrategyY1Y2Right } from '../klimt/geom/PlacementStrategyY1Y2Right.js';
import { ULayoutGroup } from '../klimt/geom/ULayoutGroup.js';
import { Display, type DisplayElement } from '../klimt/creole/Display.js';
import { CreoleMode } from '../klimt/creole/CreoleMode.js';
import type { CreoleRenderContext } from '../klimt/creole/DisplayCreole.js';
import type { AtomOps } from '../klimt/creole/Sea.js';
import type { LineBreakStrategy } from '../klimt/LineBreakStrategy.js';
import { EmbeddedDiagram, getEmbeddedType } from '../EmbeddedDiagram.js';
import type { Entity } from '../abel/Entity.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { Url } from '../url/Url.js';
import { CharHidder } from '../utils/CharHidder.js';
import { Ports } from '../svek/Ports.js';
import type { WithPorts } from '../svek/WithPorts.js';
import { Elected } from './Elected.js';
import type { Member } from './Member.js';
import { TextBlockTracer, fullInnerPosition, isMember } from './TextBlockTracer.js';
import type {
  MethodsOrFieldsAreaConfig,
  MethodsOrFieldsAreaSkinParam,
  MethodsOrFieldsAreaStyleValues,
  VisibilityModifierStyleValues,
} from './MethodsOrFieldsAreaConfig.js';

/**
 * MethodsOrFieldsArea — one fields-or-methods compartment of a
 * class/object-like entity: it stacks one creole `TextBlock` per member
 * row, reserves the visibility-icon zone on the left when icons are on,
 * reports per-row `Ports` for `entity::portName` edge targets, and can
 * present itself as a `Bodier` block member (`asBlockMemberImpl`).
 *
 * Upstream: cucadiagram/MethodsOrFieldsArea.java (442 lines). Ported in
 * full (ADR-1: every member, including callerless ones): both
 * constructors (collapsed — the 4-arg overload is `config.align`
 * defaulting to `HorizontalAlignment.LEFT`), `asBlockMemberImpl`,
 * `hasSmallIcon`, `calculateDimensionSlow`,
 * `calculateDimensionOnlyMembers` (incl. the TIKZ +1 branch),
 * `sortBySize`, `getPorts`, `convert`, `getElected`, `getScore`,
 * `createTextBlock`, `getUBlock`, `contains`, `getInnerPosition`,
 * `getLayout`, `drawU`. The nested `TextBlockTracer` class and the
 * static `fullInnerPosition` live in `./TextBlockTracer.ts` (500-line
 * cap split along the upstream nested-class boundary); the ADR-9
 * constructor-seam types live in `./MethodsOrFieldsAreaConfig.ts`.
 *
 * ## Constructor shape — the ADR-9 seam idiom (`BodyEnhanced2.ts`'s
 * established precedent, mirrored exactly)
 *
 * Upstream signature: `(Display members, ISkinParam skinParam,
 * HorizontalAlignment align, Entity leaf, Style style)`. The `Style`
 * cascade (`style/Style#value`, `PName`) is unported (ADR-2), so the
 * scalar reads it feeds are constructor-supplied instead
 * ({@link MethodsOrFieldsAreaStyleValues}); `Display#create8`'s port
 * requires an `AtomOps` (ADR-9, `Sea.ts`) appended last. Every upstream
 * value is still threaded through unchanged — only the mechanism
 * supplying it differs.
 *
 * ## `Member` discrimination — duck-typed, not `instanceof`
 *
 * See `TextBlockTracer.ts#isMember`'s doc comment: `Member` rows ride
 * through `Display` untyped and are recognized by surface, so this file
 * needs no VALUE import of T7's in-flight `Member.ts`.
 *
 * ## `matchesProperty("TIKZ")` — duck-typed optional capability
 *
 * The TIKZ `+1` branch (java:166-173) is ported faithfully. This port's
 * `StringBounder` interface deliberately declares no `matchesProperty`
 * (SVG-only architecture — `Sea.ts`'s own note), so the check duck-types
 * the optional member: a bounder that does not declare it behaves
 * exactly like every upstream non-TIKZ bounder (returns false).
 */
export class MethodsOrFieldsArea extends TextBlockMemoized implements WithPorts {
  private readonly skinParam: MethodsOrFieldsAreaSkinParam;
  private readonly members: Display;
  private readonly align: HorizontalAlignment;
  private readonly embeddeds: EmbeddedDiagram[] = [];
  private readonly leaf: Entity;
  private readonly memberFontConfig: FontConfiguration;
  private readonly lineThickness: number;
  private readonly wrapWidth: LineBreakStrategy;
  private readonly resolveVisibilityStyle: ((modifier: VisibilityModifier) => VisibilityModifierStyleValues) | undefined;
  private readonly atomOps: AtomOps;

  /** Both upstream constructors (java:97-123) — see the class doc
   *  comment's "Constructor shape" section for the parameter mapping.
   *  The body is java:109-122's embedded-diagram separation loop: an
   *  index cursor shared with `createAndSkip` via {@link stringIteratorOver}
   *  replaces Java's shared mutable `Iterator<CharSequence>`
   *  (`BodyEnhanced2.ts#collectBlocks`'s identical adaptation). */
  constructor(
    members: Display,
    config: MethodsOrFieldsAreaConfig,
    leaf: Entity,
    styleValues: MethodsOrFieldsAreaStyleValues,
    atomOps: AtomOps,
  ) {
    super();
    this.leaf = leaf;
    this.align = config.align ?? HorizontalAlignment.LEFT;
    this.skinParam = config.skinParam;
    this.memberFontConfig = config.memberFontConfig;
    this.lineThickness = styleValues.lineThickness;
    this.wrapWidth = styleValues.wrapWidth;
    this.resolveVisibilityStyle = styleValues.resolveVisibilityStyle;
    this.atomOps = atomOps;

    const result: DisplayElement[] = [];
    const elements = members.asList();
    const cursor = { i: 0 };
    const it = stringIteratorOver(elements, cursor);

    while (cursor.i < elements.length) {
      const cs = elements[cursor.i] as DisplayElement;
      cursor.i++;
      const type = getEmbeddedType(String(cs));
      if (type !== null) {
        if (config.nestedDiagramRenderer === undefined) {
          throw new Error(
            'deferred per SI1/ADR-2: MethodsOrFieldsArea met an embedded diagram block but ' +
              'MethodsOrFieldsAreaConfig.nestedDiagramRenderer was not supplied (EmbeddedDiagram.ts seam)',
          );
        }
        this.embeddeds.push(EmbeddedDiagram.createAndSkip(type, it, this.skinParam, config.nestedDiagramRenderer));
      } else {
        result.push(cs);
      }
    }

    this.members = Display.create(result);
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:83-86 — `TextBlockUtils
   *  .withMargin(this, 6, 4)` is Java's TWO-arg `(marginX, marginY)`
   *  overload (left+right 6, top+bottom 4), written 4-arg explicit per
   *  `BodyEnhancedAbstract.ts`'s documented convention (this port's
   *  positional 2-arg means something else). `lineThickness` substitutes
   *  `style.value(PName.LineThickness).asDouble()` (ADR-2). */
  asBlockMemberImpl(): TextBlock {
    return new TextBlockLineBefore(this.lineThickness, TextBlockUtils.withMargin(this, 6, 6, 4, 4));
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:125-138 */
  private hasSmallIcon(): boolean {
    if (this.skinParam.classAttributeIconSize() === 0) return false;

    for (const cs of this.members.asList()) {
      if (!isMember(cs)) continue;

      if (cs.getVisibilityModifier() !== null) return true;
    }
    return false;
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:140-152 */
  calculateDimensionSlow(stringBounder: StringBounder): XDimension2D {
    const dim1 = this.calculateDimensionOnlyMembers(stringBounder);
    let x = dim1.getWidth();
    let y = dim1.getHeight();
    for (const embedded of this.embeddeds) {
      const dim = embedded.calculateDimension(stringBounder);
      x = Math.max(dim.getWidth(), x);
      y += dim.getHeight();
    }

    return new XDimension2D(x, y);
  }

  /** The visibility-icon zone is `getCircledCharacterRadius() + 3`
   *  (java:156-157) — the SAME expression A2s R2f jar-verified in
   *  `src/diagrams/class/class-member-rows.ts#rowIconZoneWidth` (default
   *  radius 11 → zone 14); ADR-5: the class engine is NOT rebased onto
   *  this port. TIKZ branch: see the class doc comment.
   *  @see cucadiagram/MethodsOrFieldsArea.java:154-178 */
  private calculateDimensionOnlyMembers(stringBounder: StringBounder): XDimension2D {
    let smallIcon = 0;
    if (this.hasSmallIcon()) smallIcon = this.skinParam.getCircledCharacterRadius() + 3;

    let x = 0;
    let y = 0;
    for (const cs of this.members.asList()) {
      const block = this.createTextBlock(cs);
      const dim = block.calculateDimension(stringBounder);
      x = Math.max(dim.getWidth(), x);
      y += dim.getHeight();
      const bounder = stringBounder as Partial<{ matchesProperty(name: string): boolean }>;
      if (bounder.matchesProperty?.('TIKZ') === true && dim.getHeight() === 10) {
        // the modifier would add a hard-coded 1 to height
        // ref1: AtomText::calculateDimension
        // ref2: VisibilityModifier::getUBlock
        // https://github.com/plantuml/plantuml/pull/2424
        // https://github.com/plantuml/plantuml/issues/2055
        y += 1;
      }
    }
    x += smallIcon;

    return new XDimension2D(x, y);
  }

  /** Longest-first, ties lexicographic (`s2.length() - s1.length()` then
   *  `s1.compareTo(s2)`).
   *  @see cucadiagram/MethodsOrFieldsArea.java:180-192 */
  private sortBySize(all: Iterable<string>): string[] {
    const result = [...all];
    result.sort((s1, s2) => {
      const diff = s2.length - s1.length;
      if (diff !== 0) return diff;
      return s1 < s2 ? -1 : s1 > s2 ? 1 : 0;
    });
    return result;
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:194-211 */
  getPorts(stringBounder: StringBounder): Ports {
    const ports = new Ports();
    let y = 0;

    const shortNames = this.sortBySize(this.leaf.getPortShortNames());

    for (const cs of this.members.asList()) {
      const block = this.createTextBlock(cs);
      const dim = block.calculateDimension(stringBounder);
      const elected = this.getElected(this.convert(cs), shortNames);
      if (elected !== null) ports.add(elected.getShortName(), elected.getScore(), y, dim.getHeight());

      y += dim.getHeight();
    }
    return ports;
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:213-217 */
  private convert(cs: DisplayElement): string {
    if (isMember(cs)) return cs.getDisplay(false);
    return String(cs);
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:219-226 */
  getElected(cs: string, shortNames: Iterable<string>): Elected | null {
    for (const shortName of shortNames) {
      const score = this.getScore(cs, shortName);
      if (score > 0) return new Elected(shortName, score);
    }
    return null;
  }

  /** Java `cs.matches(".*\\b" + shortName + "\\b.*")` is a FULL-string
   *  match with `.` excluding line terminators — `^.*\b…\b.*$` without
   *  the `s`/`m` flags reproduces it exactly (string-built regex per this
   *  repo's established workaround; upstream performs no metacharacter
   *  escaping on `shortName` either).
   *  @see cucadiagram/MethodsOrFieldsArea.java:228-236 */
  private getScore(cs: string, shortName: string): number {
    if (new RegExp(`^.*\\b${shortName}\\b.*$`).test(cs)) return 100;

    if (cs.includes(shortName)) return 50;

    return 0;
  }

  /** `memberFontConfig` substitutes java:240's `FontConfiguration
   *  .create(skinParam, style, leaf.getColors())`; `addFontStyle`
   *  substitutes `config.italic()` / `config.underline()` (see its own
   *  note). Everything else is verbatim: the visibility-char prefix +
   *  `CharHidder.addTileAtBegin` for `#`, the `create8(…, SIMPLE_LINE,
   *  style.wrapWidth())` creole call, the `fullInnerPosition` +
   *  `TextBlockTracer` wrapping for `Member` rows. Upstream's
   *  commented-out `cs instanceof EmbeddedDiagram` branch (java:261-262)
   *  is commented-out there too — not ported.
   *  @see cucadiagram/MethodsOrFieldsArea.java:238-267 */
  private createTextBlock(cs: DisplayElement): TextBlock {
    let config = this.memberFontConfig;

    if (isMember(cs)) {
      const m = cs;
      const withVisibilityChar = this.skinParam.classAttributeIconSize() === 0;
      let s = m.getDisplay(withVisibilityChar);
      if (withVisibilityChar && s.startsWith('#')) s = CharHidder.addTileAtBegin(s);

      if (m.isAbstract()) config = addFontStyle(config, FontStyle.ITALIC);

      if (m.isStatic()) config = addFontStyle(config, FontStyle.UNDERLINE);

      let block = Display.getWithNewlines(this.skinParam.getPragma(), s).create8(
        this.renderContext(config),
        this.align,
        CreoleMode.SIMPLE_LINE,
        this.wrapWidth,
      );
      block = fullInnerPosition(block, m);
      return new TextBlockTracer(m, block);
    }

    return Display.getWithNewlines(this.skinParam.getPragma(), String(cs)).create8(
      this.renderContext(config),
      this.align,
      CreoleMode.SIMPLE_LINE,
      this.wrapWidth,
    );
  }

  /** Bundles java:255/264's `(config, align, skinParam, …)` positional
   *  arguments into this port's `CreoleRenderContext` (ADR-9's `atomOps`
   *  alongside — `BodyEnhanced2.ts#renderContext`'s identical shape). */
  private renderContext(fontConfiguration: FontConfiguration): CreoleRenderContext {
    return { fontConfiguration, spriteContainer: this.skinParam, atomOps: this.atomOps };
  }

  /** The `modifier == null` arm returns upstream's inline anonymous
   *  1×1 block verbatim (java:342-359). The style resolution for a real
   *  modifier goes through the `resolveVisibilityStyle` seam (see
   *  `MethodsOrFieldsAreaConfig.ts`); the `isField ? null : …`
   *  back-color branch and the final `TextBlockWithUrl.withUrl` wrap are
   *  verbatim.
   *  @see cucadiagram/MethodsOrFieldsArea.java:341-369 */
  private getUBlock(modifier: VisibilityModifier | null, url: Url | null): TextBlock {
    if (modifier === null) {
      return {
        drawU: (): void => {
          /* upstream: empty body (java:345-346) */
        },
        getInnerPosition: (): XRectangle2D | undefined => undefined,
        calculateDimension: (): XDimension2D => new XDimension2D(1, 1),
      } as TextBlock;
    }
    if (this.resolveVisibilityStyle === undefined) {
      throw new Error(
        'deferred per SI1/ADR-2: MethodsOrFieldsArea.getUBlock needs the merged-style cascade ' +
          '(VisibilityModifier.getStyleSignature().getMergedStyle + PName value resolution); supply ' +
          'MethodsOrFieldsAreaStyleValues.resolveVisibilityStyle',
      );
    }
    const style = this.resolveVisibilityStyle(modifier);
    const borderColor = style.lineColor;
    const isField = modifier.isField();
    const backColor = isField ? null : style.backGroundColor;

    const uBlock = modifier.getUBlock(this.skinParam.classAttributeIconSize(), borderColor, backColor, url !== null);
    return TextBlockWithUrl.withUrl(uBlock, url ?? undefined);
  }

  /** Upstream casts every element to `Member` unconditionally (java:373
   *  — a `ClassCastException` on a non-member); the equivalent here is a
   *  runtime `TypeError` when a non-member row is present.
   *  @see cucadiagram/MethodsOrFieldsArea.java:371-379 */
  contains(member: string): boolean {
    for (const cs of this.members.asList()) {
      const att = cs as unknown as Member;
      if (att.getDisplay(false).startsWith(member)) return true;
    }
    return false;
  }

  /** The icon-zone extension (java:386-390) widens the row rectangle by
   *  the SAME `getCircledCharacterRadius() + 3` zone the sizing side
   *  reserves — cite-aligned with `class-member-rows.ts#rowIconZoneWidth`
   *  (ADR-5: not rebased).
   *  @see cucadiagram/MethodsOrFieldsArea.java:381-393 */
  getInnerPosition(member: string, stringBounder: StringBounder): XRectangle2D | undefined {
    const group = this.getLayout(stringBounder);
    const dim = this.calculateDimension(stringBounder);
    const result = group.getInnerPosition(member, dim.getWidth(), dim.getHeight(), stringBounder);
    if (result !== undefined && this.hasSmallIcon()) {
      // Extend the inner position to include the visibility modifier on its left
      const smallIcon = this.skinParam.getCircledCharacterRadius() + 3;
      return new XRectangle2D(result.getMinX() - smallIcon, result.getMinY(), result.getWidth() + smallIcon, result.getHeight());
    }
    return result;
  }

  /** With icons: `PlacementStrategyVisibility(sb, radius + 3)` and one
   *  `getUBlock` + one text block per row (upstream's cast of each row
   *  to `Member` at java:405 preserved, CCE-equivalent — see
   *  {@link contains}); without: Left/Center/Right `Y1Y2` strategy by
   *  `align`. Upstream's commented-out `EmbeddedDiagram` branch
   *  (java:402-404, 408) stays commented-out.
   *  @see cucadiagram/MethodsOrFieldsArea.java:395-427 */
  private getLayout(stringBounder: StringBounder): ULayoutGroup {
    let group: ULayoutGroup;
    if (this.hasSmallIcon()) {
      group = new ULayoutGroup(new PlacementStrategyVisibility(stringBounder, this.skinParam.getCircledCharacterRadius() + 3));
      for (const cs of this.members.asList()) {
        const block = this.createTextBlock(cs);
        // if (cs instanceof EmbeddedDiagram) { group.add(getUBlock(null, null)); } else {
        const att = cs as unknown as Member;
        const modifier = att.getVisibilityModifier();
        group.add(this.getUBlock(modifier, att.getUrl()));
        // }
        group.add(block);
      }
    } else {
      let placementStrategy: PlacementStrategy;
      if (this.align === HorizontalAlignment.LEFT) placementStrategy = new PlacementStrategyY1Y2Left(stringBounder);
      else if (this.align === HorizontalAlignment.CENTER) placementStrategy = new PlacementStrategyY1Y2Center(stringBounder);
      else placementStrategy = new PlacementStrategyY1Y2Right(stringBounder);

      group = new ULayoutGroup(placementStrategy);
      for (const cs of this.members.asList()) {
        const block = this.createTextBlock(cs);
        group.add(block);
      }
    }
    return group;
  }

  /** @see cucadiagram/MethodsOrFieldsArea.java:429-440 */
  drawU(ug: UGraphic): void {
    const stringBounder = ug.getStringBounder();
    const group = this.getLayout(stringBounder);
    const dim = this.calculateDimensionOnlyMembers(stringBounder);
    group.drawU(ug, dim.getWidth(), dim.getHeight());
    ug = ug.apply(UTranslate.dy(dim.getHeight()));

    for (const embedded of this.embeddeds) {
      embedded.drawU(ug);
      ug = ug.apply(UTranslate.dy(embedded.calculateDimension(stringBounder).getHeight()));
    }
  }
}

/** Substitute for `FontConfiguration#italic()` / `#underline()`
 *  (klimt/font/FontConfiguration.java — each returns a COPY with the
 *  flag added, never mutates): same copy-on-add semantics over the
 *  `UText.ts` structural configuration. */
function addFontStyle(config: FontConfiguration, style: FontStyle): FontConfiguration {
  return { ...config, styles: new Set([...config.styles, style]) };
}

/** The shared-cursor `Iterator<string>` `createAndSkip` consumes —
 *  Java's single `Iterator<CharSequence>` shared between the
 *  constructor's `while (it.hasNext())` loop and
 *  `EmbeddedDiagram.createAndSkip(type, it, …)` (java:110-116), adapted
 *  to an index cursor over `Display#asList()` with `String(…)` coercion
 *  at the boundary (embedded-diagram content lines are plain strings
 *  upstream too; the RAW element is kept for `result` in the loop). */
function stringIteratorOver(elements: readonly DisplayElement[], cursor: { i: number }): Iterator<string> {
  return {
    next: (): IteratorResult<string> => {
      if (cursor.i >= elements.length) return { done: true, value: undefined };
      const value = String(elements[cursor.i]);
      cursor.i++;
      return { done: false, value };
    },
  };
}
