import { VisibilityModifier } from '../skin/VisibilityModifier.js';
import { manageGuillemet } from '../text/Guillemet.js';
import type { Url } from '../url/Url.js';
import { UrlBuilder, getRegexp, transform } from '../url/UrlBuilder.js';
import { UrlMode } from '../url/UrlMode.js';

/**
 * Member — one field or method line of a class/object body: the raw line
 * plus the decomposition the `Member` constructor performs (doc-tag
 * removal, member-level `[...]` url extraction, `{static}`/`{classifier}`/
 * `{abstract}` modifiers, leading visibility character, guillemet
 * rewriting).
 *
 * Upstream: cucadiagram/Member.java — ported in full. `implements
 * CharSequence` over `raw` → the `charAt`/`length`/`subSequence`/
 * `toString` surface, per `stereo/Stereotype.ts`/`sequencediagram/
 * MessageNumber.ts`'s established translation; `Member` satisfies
 * `SheetBuilder.ts`'s `MemberLike` so `Display.create(List<Member>)`
 * (`BodierLikeClassOrObject`) typechecks, and consumers narrow via
 * `instanceof Member` exactly as upstream does.
 *
 * The class engine's `class-member-parser.ts` carries A2s F-B's
 * jar-verified fork of these same constructor semantics on its own AST
 * (ADR-5 — not rebased); comments there and here cite the same
 * `Member.java` lines.
 *
 * Java-regex notes (cite-aligned with `class-member-parser.ts`'s A2s F-B
 * translations of the SAME patterns): `(?i)` → `i` flag, `replaceAll` →
 * `g` flag; Java `\s` is narrower than JS `\s` (no NBSP/Unicode spaces)
 * — kept as JS `\s` matching the A2s jar-verified port. `equals`/
 * `hashCode` (java:180-189) compare on `display`; note this port's
 * `Display` element equality (`DisplayEquality.ts`) compares non-string
 * elements by identity, so `Member#equals` is only reached by direct
 * callers, as upstream's `List#equals` path is.
 *
 * SI1/T7.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java
 */

/** `StringUtils.trin` (StringUtils.java:502-520) — trims only chars whose
 *  code unit is <= U+0020, both ends. Duplicated locally per established
 *  precedent (`BodyEnhanced2.ts`'s own copy and its stated rationale: no
 *  shared `StringUtils.ts` owner exists in this port). */
function trin(text: string): string {
  let start = 0;
  let end = text.length - 1;
  while (start <= end && text.charCodeAt(start) <= 0x20) start++;
  while (end >= start && text.charCodeAt(end) <= 0x20) end--;
  return text.slice(start, end + 1);
}

/** `StringUtils.goLowerCase` — `toLowerCase(Locale.ENGLISH)`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java (goLowerCase) */
function goLowerCase(s: string): string {
  return s.toLowerCase();
}

/** `Pattern2.cmpile("^(.*?)(?:\\[(" + UrlBuilder.getRegexp() + ")\\])?$")`
 *  — `Pattern2` = `%`-token transform + CASE_INSENSITIVE (`UrlBuilder.ts`'s
 *  `transform` note); already `^...$`-anchored, so `exec` = `matches()`.
 *  Group 1 = display part, group 2 = the whole bracketed url text.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:93 */
const URL = new RegExp(transform('^(.*?)(?:\\[(' + getRegexp() + ')\\])?$'), 'iu');

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:95 */
const REMOVE_TAG_PATTERN = /\{(method|field)\}\s*/gi;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:97-98 */
const REMOVE_STATIC_CLASSIFIER_ABSTRACT_PATTERN = /\{(static|classifier|abstract)\}\s*/gi;

export class Member {
  private readonly display: string;
  private readonly raw: string;
  private readonly staticModifier: boolean;
  private readonly abstractModifier: boolean;
  private readonly url: Url | null;
  private readonly hasUrlFlag: boolean;

  private readonly visibilityModifier: VisibilityModifier | null;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:60-63 */
  toString(): string {
    return this.raw;
  }

  /** `CharSequence#charAt` (java:65-67). */
  charAt(index: number): string {
    return this.raw.charAt(index);
  }

  /** `CharSequence#length` (java:69-71). */
  length(): number {
    return this.raw.length;
  }

  /** `CharSequence#subSequence` (java:73-75). */
  subSequence(start: number, end: number): string {
    return this.raw.substring(start, end);
  }

  /** Both upstream `method` overloads (java:77-79 and :85-87) — the
   *  1-arg form is `manageModifier = true`. */
  static method(tmpDisplay: string, manageModifier = true): Member {
    return new Member(manageModifier, tmpDisplay, true);
  }

  /** Both upstream `field` overloads (java:81-83 and :89-91). */
  static field(tmpDisplay: string, manageModifier = true): Member {
    return new Member(manageModifier, tmpDisplay, false);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:100-148 */
  private constructor(manageModifier: boolean, tmpDisplay: string, isMethod: boolean) {
    this.raw = tmpDisplay;

    tmpDisplay = tmpDisplay.replace(REMOVE_TAG_PATTERN, '');

    if (manageModifier) {
      const matcher = URL.exec(tmpDisplay);
      if (matcher === null) throw new Error('IllegalStateException');

      tmpDisplay = matcher[1] as string;
      const urlString = matcher[2] ?? null;
      if (urlString === null) this.url = null;
      else this.url = new UrlBuilder(null, UrlMode.STRICT).getUrl(urlString);
    } else this.url = null;

    this.hasUrlFlag = this.url !== null;
    const lower = goLowerCase(tmpDisplay);

    if (manageModifier) {
      this.staticModifier = lower.includes('{static}') || lower.includes('{classifier}');
      this.abstractModifier = lower.includes('{abstract}');

      let displayClean = tmpDisplay.replace(REMOVE_STATIC_CLASSIFIER_ABSTRACT_PATTERN, '').trim();

      if (displayClean.length === 0) displayClean = ' ';

      if (VisibilityModifier.isVisibilityCharacter(displayClean)) {
        this.visibilityModifier = VisibilityModifier.getVisibilityModifier(displayClean, isMethod === false);
        this.display = trin(manageGuillemet(displayClean.substring(1)));
      } else {
        this.display = manageGuillemet(displayClean);
        this.visibilityModifier = null;
      }
    } else {
      this.staticModifier = false;
      this.visibilityModifier = null;
      this.abstractModifier = false;
      tmpDisplay = trin(tmpDisplay);
      this.display = tmpDisplay.length === 0 ? ' ' : manageGuillemet(trin(tmpDisplay));
    }
    // #lizard forgives -- faithful port of upstream's single constructor
    // (Member.java:100-148); splitting it would break the documented
    // statement-for-statement alignment ("do not refactor while porting").
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:150-155 */
  getDisplay(withVisibilityChar: boolean): string {
    if (withVisibilityChar) return this.getDisplayWithVisibilityChar();

    return this.getDisplayWithoutVisibilityChar();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:157-159 */
  private getDisplayWithoutVisibilityChar(): string {
    return this.display;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:161-178 */
  private getDisplayWithVisibilityChar(): string {
    if (this.isPrivate()) return '-' + this.display;

    if (this.isPublic()) return '+' + this.display;

    if (this.isPackagePrivate()) return '~' + this.display;

    if (this.isProtected()) return '#' + this.display;

    if (this.isIEMandatory()) return '*' + this.display;

    return this.display;
  }

  /** Upstream casts `obj` unchecked (java:180-184); typed to `Member`.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:180-184 */
  equals(obj: Member): boolean {
    return this.display === obj.display;
  }

  /** Java `String#hashCode` over `display` (java:186-189). */
  hashCode(): number {
    let h = 0;
    for (let i = 0; i < this.display.length; i++) h = (Math.imul(31, h) + this.display.charCodeAt(i)) | 0;
    return h;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:191-193 */
  isStatic(): boolean {
    return this.staticModifier;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:195-197 */
  isAbstract(): boolean {
    return this.abstractModifier;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:199-202 */
  private isPrivate(): boolean {
    return (
      this.visibilityModifier === VisibilityModifier.PRIVATE_FIELD ||
      this.visibilityModifier === VisibilityModifier.PRIVATE_METHOD
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:204-207 */
  private isProtected(): boolean {
    return (
      this.visibilityModifier === VisibilityModifier.PROTECTED_FIELD ||
      this.visibilityModifier === VisibilityModifier.PROTECTED_METHOD
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:209-212 */
  private isPublic(): boolean {
    return (
      this.visibilityModifier === VisibilityModifier.PUBLIC_FIELD ||
      this.visibilityModifier === VisibilityModifier.PUBLIC_METHOD
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:214-217 */
  private isPackagePrivate(): boolean {
    return (
      this.visibilityModifier === VisibilityModifier.PACKAGE_PRIVATE_FIELD ||
      this.visibilityModifier === VisibilityModifier.PACKAGE_PRIVATE_METHOD
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:219-221 */
  private isIEMandatory(): boolean {
    return this.visibilityModifier === VisibilityModifier.IE_MANDATORY;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:223-225 */
  getVisibilityModifier(): VisibilityModifier | null {
    return this.visibilityModifier;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:227-229 */
  getUrl(): Url | null {
    return this.url;
  }

  /** Java field and method are both named `hasUrl`; a TS class cannot
   *  carry both, so the FIELD is `hasUrlFlag` (same accommodation as
   *  `url/Check.ts`'s `isJunitFlag`, behavior unchanged).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/Member.java:231-233 */
  hasUrl(): boolean {
    return this.hasUrlFlag;
  }
}
