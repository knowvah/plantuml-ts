import type { Entity } from '../abel/Entity.js';
import type { FontConfiguration } from '../abel/FontConfiguration.js';
import type { ISkinParam, Style } from '../abel/ISkinParam.js';
import { LeafType, isLikeClass } from '../abel/LeafType.js';
import { getEmbeddedType } from '../EmbeddedDiagram.js';
import { Display } from '../klimt/creole/Display.js';
import { isTreeStart } from '../klimt/creole/Parser.js';
import { CreoleParser } from '../klimt/creole/legacy/CreoleParser.js';
import { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../klimt/shape/TextBlockUtils.js';
import type { VisibilityModifier } from '../skin/VisibilityModifier.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import { getRegexp } from '../url/UrlBuilder.js';
import { BodierAbstract } from './BodierAbstract.js';
import { BodyEnhancedAbstract } from './BodyEnhancedAbstract.js';
import { BodyFactory } from './BodyFactory.js';
import { Member } from './Member.js';

/**
 * BodierLikeClassOrObject — the `Bodier` carrying the class/object
 * field-and-method model: raw body lines are classified into methods
 * (paren scan / `{method}`/`{field}` tags) and fields, wrapped in
 * {@link Member}, filtered by `hide` visibility modifiers, and cached
 * until the next mutation.
 *
 * Upstream: cucadiagram/BodierLikeClassOrObject.java — ported in full,
 * except: the `BodyFactory.BODY3` branch (java:212-213) is omitted
 * (permanently-`false` dead flag — `BodyFactory.ts`'s own doc comment),
 * and `TeaVM.a()`-gated asserts are dropped (`abel/Entity.ts`'s stated
 * precedent). The constructor is package-private upstream
 * (`BodyFactory.createLeaf` is the entry point, SI1 batch-4/T9); public
 * here because the factory lives in another module.
 *
 * `isBodyEnhanced`'s `BodyEnhanced1.isBlockSeparator` resolves to
 * `BodyEnhancedAbstract.isBlockSeparator` — upstream DEFINES it there
 * (BodyEnhancedAbstract.java:67-82) and merely references it through the
 * subclass name. `hasUrl` iterates `getFieldsToDisplay().asList()`
 * rather than the Display itself: this port's `for...of` over a
 * `Display` coerces non-Stereotype elements to strings (`Display.ts`
 * iterator doc), while `asList()` keeps `Member` identity for the
 * `instanceof` narrowing — same elements, same order.
 *
 * SI1/T7. Where A2s already jar-verified a rule in the class engine's
 * fork (ADR-5), comments cite-align: blank-row `rawBodyWithoutHidden`
 * semantics (A2s R2d, `class-body-enhanced-layout.ts:155-164`), the
 * `isMethod` tag/paren rules (A2s R2f, `class-member-parser.ts
 * #detectForcedBucket`), display-rule filters (A2s F-A, class
 * `parser.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java
 */

/** `String#replaceAll(UrlBuilder.getRegexp(), "")` (java:103) compiles the
 *  regexp RAW through `java.util.regex` — NO `Pattern2` `%`-token
 *  transform and NO case-insensitivity, unlike every other use of
 *  `getRegexp()` (e.g. `Member.ts`'s `URL`). `[%s]`/`[%g]` therefore
 *  literally match the characters `%`, `s` / `%`, `g` in this purge —
 *  preserved verbatim (an upstream quirk, load-bearing per "don't fix
 *  apparent bugs inline"). Computed lazily, matching Java's
 *  per-call `replaceAll` compile. */
let urlPurgePattern: RegExp | undefined;
function purgeUrl(s: string): string {
  if (urlPurgePattern === undefined) urlPurgePattern = new RegExp(getRegexp(), 'g');
  return s.replace(urlPurgePattern, '');
}

/** `Set#contains(vm)` with Java semantics: `contains(null)` is `false`,
 *  never an NPE — lets call sites pass `m.getVisibilityModifier()`
 *  (nullable) uncast. */
function setContains(set: ReadonlySet<VisibilityModifier>, vm: VisibilityModifier | null): boolean {
  return vm !== null && set.has(vm);
}

/** The `new MethodsOrFieldsArea(members, skinParam, leaf, style)` +
 *  `asBlockMemberImpl()` seam of `getBody` (java:237-249) — a TYPED
 *  THROWS-DEFERRED HOOK. T8's landed `MethodsOrFieldsArea.ts` takes the
 *  ADR-9 `MethodsOrFieldsAreaConfig` seam (resolved `memberFontConfig`
 *  instead of upstream's `Style`), so bridging `(skinParam, leaf, style)`
 *  → config is the style-resolution work of the SI1 batch-4/T9 assembly,
 *  which replaces this function body with the real construction.
 *  Journaled (SI1 decision journal, T7 — deferred-throw per T5's
 *  precedent). */
interface MethodsOrFieldsAreaLike {
  asBlockMemberImpl(): TextBlock;
}
function newMethodsOrFieldsArea(
  _members: Display,
  _skinParam: ISkinParam,
  _leaf: Entity,
  _style: Style,
): MethodsOrFieldsAreaLike {
  throw new Error(
    'BodierLikeClassOrObject.getBody: deferred to SI1 batch-4/T9 (MethodsOrFieldsArea wiring not yet landed)',
  );
}

export class BodierLikeClassOrObject extends BodierAbstract {
  private readonly hideVisibilityModifier: ReadonlySet<VisibilityModifier> | null;
  private type: LeafType;
  private methodsToDisplay: Member[] | null = null;
  private fieldsToDisplay: Member[] | null = null;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:67-72 */
  muteClassToObject(): void {
    this.methodsToDisplay = null;
    this.fieldsToDisplay = null;
    this.type = LeafType.OBJECT;
  }

  /** `Objects.requireNonNull` → explicit NPE throw (project convention);
   *  the TeaVM-gated `isLikeClass || OBJECT` assert is dropped.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:74-82 */
  constructor(type: LeafType, hideVisibilityModifier: ReadonlySet<VisibilityModifier> | null) {
    super();
    if (type === LeafType.MAP) throw new Error('IllegalArgumentException');

    if (type == null) throw new Error('NullPointerException');
    this.type = type;
    this.hideVisibilityModifier = hideVisibilityModifier;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:84-91 */
  addFieldOrMethod(s: string): boolean {
    // Empty cache
    this.methodsToDisplay = null;
    this.fieldsToDisplay = null;
    this.rawBody.push(s);
    return true;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:93-100 */
  private isBodyEnhanced(): boolean {
    for (const s of this.rawBody)
      if (
        BodyEnhancedAbstract.isBlockSeparator(s) ||
        CreoleParser.isTableLine(s) ||
        isTreeStart(s) ||
        getEmbeddedType(s) !== null
      )
        return true;

    return false;
  }

  /** Upstream's two private `isMethod` overloads share one name — kept via
   *  TS overload signatures. The 1-arg form (java:102-111, A2s R2f
   *  cite-align: `class-member-parser.ts#detectForcedBucket`) scans the
   *  URL-purged line for `{method}`/`{field}` (case-SENSITIVE
   *  `String#contains`), then parens. The 2-arg form (java:136-142)
   *  additionally counts an interior blank line as a method when both
   *  neighbors are methods.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:102-111
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:136-142 */
  private isMethod(s: string): boolean;
  private isMethod(i: number, rawBody: readonly string[]): boolean;
  private isMethod(arg: string | number, rawBody?: readonly string[]): boolean {
    if (typeof arg === 'number') {
      const i = arg;
      const body = rawBody as readonly string[];
      if (
        i > 0 &&
        i < body.length - 1 &&
        (body[i] as string).length === 0 &&
        this.isMethod(body[i - 1] as string) &&
        this.isMethod(body[i + 1] as string)
      )
        return true;

      return this.isMethod(body[i] as string);
    }
    const purged = purgeUrl(arg);
    if (purged.includes('{method}')) return true;

    if (purged.includes('{field}')) return false;

    return purged.includes('(') || purged.includes(')');
  }

  /** Display rules cite-align: A2s F-A ported these same filters into the
   *  class engine's `parser.ts` (ADR-5 — that fork is NOT touched here).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:113-134 */
  getMethodsToDisplay(): Display {
    if (this.methodsToDisplay === null) {
      this.methodsToDisplay = [];
      for (let i = 0; i < this.rawBody.length; i++) {
        const s = this.rawBody[i] as string;
        if (this.isMethod(i, this.rawBody) === false) continue;

        if (s.length === 0 && this.methodsToDisplay.length === 0) continue;

        const m = Member.method(s);
        if (this.hideVisibilityModifier === null || setContains(this.hideVisibilityModifier, m.getVisibilityModifier()) === false)
          this.methodsToDisplay.push(m);
      }
      this.removeFinalEmptyMembers(this.methodsToDisplay);
    }
    return Display.create(this.methodsToDisplay);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:144-164 */
  getFieldsToDisplay(): Display {
    if (this.fieldsToDisplay === null) {
      this.fieldsToDisplay = [];
      for (const s of this.rawBody) {
        if (this.type !== LeafType.OBJECT && this.isMethod(s) === true) continue;

        if (s.length === 0 && this.fieldsToDisplay.length === 0) continue;

        const m = Member.field(s);
        if (this.hideVisibilityModifier === null || setContains(this.hideVisibilityModifier, m.getVisibilityModifier()) === false)
          this.fieldsToDisplay.push(m);
      }
      this.removeFinalEmptyMembers(this.fieldsToDisplay);
    }
    return Display.create(this.fieldsToDisplay);
  }

  /** `StringUtils.trin(...).length() == 0` — `Member.ts` hosts the same
   *  local `trin`; a `' '` blank-fallback display trims to empty here.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:166-170 */
  private removeFinalEmptyMembers(result: Member[]): void {
    while (result.length > 0 && trin((result[result.length - 1] as Member).getDisplay(false)).length === 0) result.pop();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:172-190 */
  hasUrl(): boolean {
    for (const cs of this.getFieldsToDisplay().asList())
      if (cs instanceof Member) {
        if (cs.hasUrl()) return true;
      }

    for (const cs of this.getMethodsToDisplay().asList())
      if (cs instanceof Member) {
        if (cs.hasUrl()) return true;
      }
    return false;
  }

  /** EVERY raw line becomes one Member (blank lines included — never the
   *  `getFieldsToDisplay`/`getMethodsToDisplay` empties-filtering; A2s R2d
   *  jar-verified this blank-row rule in the class engine:
   *  `class-body-enhanced-layout.ts:155-164`, one 14px row per blank).
   *  Upstream reads `hideVisibilityModifier.contains(...)` UNGUARDED here
   *  (java:201 — NPE when the set is null, unlike :126/:156): preserved
   *  as an explicit NPE throw.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:192-206 */
  private rawBodyWithoutHidden(): Member[] {
    if (this.hideVisibilityModifier === null) throw new Error('NullPointerException');
    const result: Member[] = [];
    for (const s of this.rawBody) {
      let m: Member;
      if (this.isMethod(s)) m = Member.method(s);
      else m = Member.field(s);

      if (setContains(this.hideVisibilityModifier, m.getVisibilityModifier()) === false) result.push(m);
    }
    return result;
  }

  /** The `BodyFactory.BODY3` branch (java:212-213) is omitted (dead flag,
   *  see module doc); `create1` and the `MethodsOrFieldsArea` seam are
   *  the two SI1 batch-4/T9 throws-deferred hooks.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/BodierLikeClassOrObject.java:208-250 */
  getBody(
    skinParam: ISkinParam,
    showMethods: boolean,
    showFields: boolean,
    stereotype: Stereotype | undefined,
    style: Style,
    _fontConfiguration: FontConfiguration,
  ): TextBlock | null {
    if (isLikeClass(this.type) && this.isBodyEnhanced()) {
      if (showMethods || showFields)
        return BodyFactory.create1(
          skinParam.getDefaultTextAlignment(HorizontalAlignment.LEFT),
          this.rawBodyWithoutHidden(),
          skinParam,
          stereotype,
          this.leaf,
          style,
        );

      return null;
    }
    if (this.leaf === undefined) throw new Error('IllegalStateException');

    if (this.type === LeafType.OBJECT) {
      if (showFields === false)
        // return new TextBlockLineBefore(style.value(PName.LineThickness).asDouble(),
        // TextBlockUtils.empty(0, 0));
        return TextBlockUtils.empty(0, 0);

      return BodyFactory.create1(
        skinParam.getDefaultTextAlignment(HorizontalAlignment.LEFT),
        this.rawBodyWithoutHidden(),
        skinParam,
        stereotype,
        this.leaf,
        style,
      );
    }

    const fields = newMethodsOrFieldsArea(this.getFieldsToDisplay(), skinParam, this.leaf, style);

    const methods = newMethodsOrFieldsArea(this.getMethodsToDisplay(), skinParam, this.leaf, style);
    if (showFields && showMethods === false) return fields.asBlockMemberImpl();
    else if (showMethods && showFields === false) return methods.asBlockMemberImpl();
    else if (showFields === false && showMethods === false) return TextBlockUtils.empty(0, 0);

    const bb1 = fields.asBlockMemberImpl();
    const bb2 = methods.asBlockMemberImpl();
    // #lizard forgives -- faithful port of upstream's getBody dispatch
    // (BodierLikeClassOrObject.java:208-250).
    return TextBlockUtils.mergeTB(bb1, bb2, HorizontalAlignment.LEFT);
  }
}

/** `StringUtils.trin` — same local copy as `Member.ts` (no shared
 *  `StringUtils.ts` owner exists in this port; established precedent). */
function trin(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}
