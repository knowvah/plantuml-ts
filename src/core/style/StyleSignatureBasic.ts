/**
 * StyleSignatureBasic — a {@link StyleKey} plus a set of cleaned
 * stereotype names: both the selector a `<style>` rule is stored under
 * (built by `style/parser/Context.java:70-99`) and the query an element
 * resolves its style with (e.g. `mindmap/Idea.java:65-90`). Immutable, as
 * upstream: every `add*` returns a new signature.
 *
 * Translation notes:
 * - `HashSet<String> stereotypes` → an insertion-ordered
 *   `ReadonlySet<string>`; only `toString` observes order (HashSet order
 *   upstream is hash order, not reproduced).
 * - `equals`/`hashCode` → {@link equals} plus {@link keyString}, a
 *   canonical string for JS `Map` keys.
 * - Java's `addStereotype(String)`/`addStereotype(Stereotype)` and the
 *   three `of` overloads are single methods dispatching on argument shape.
 * - `getMergedStyle(StyleBuilder)` (java:253-259: `styleBuilder == null ?
 *   null : styleBuilder.getMergedStyle(this)`) is T2a's, with `Style` and
 *   `StyleBuilder`.
 *
 * SName is re-exported here for `skin/VisibilityModifier.ts`, which
 * imports it from this module.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java
 */
import type { SName } from './SName.js';
import { StyleKey } from './StyleKey.js';
import { STAR } from './StyleSignature.js';
import type { StyleSignature } from './StyleSignature.js';
import { StyleSignatures } from './StyleSignatures.js';
import type { Stereotype } from '../stereo/Stereotype.js';
import { GUILLEMET_NONE } from '../stereo/StereotypeDecoration.js';
import type { Stereostyles } from '../abel/Stereostyles.js';
import type { Url } from '../url/Url.js';

export type { SName };

/** The one member of `style/Style.java` `mergeWith(List<Style>)` reads. */
interface SignedStyle {
  getSignature(): StyleSignatureBasic;
}

/** `clean` (java:226-235): lowercase, dropping every `_` and `.`. */
function clean(name: string): string {
  let sb = '';
  for (const c of name) if (c !== '_' && c !== '.') sb += c.toLowerCase();
  return sb;
}

/** Distinguishes the `SName[]` parameter of the array `of` overloads. */
function isSNameArray(arg: SName | readonly SName[] | undefined): arg is readonly SName[] {
  return typeof arg === 'object';
}

/** `Collection.containsAll` (tsconfig lib is ES2022, so no `Set#isSubsetOf`). */
function containsAll<T>(set: ReadonlySet<T>, items: ReadonlySet<T>): boolean {
  for (const item of items) if (!set.has(item)) return false;
  return true;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:50 */
export class StyleSignatureBasic implements StyleSignature {
  /** Inherited `StyleSignature.STAR` (StyleSignature.java:44), read as `StyleSignatureBasic.STAR` upstream. */
  static readonly STAR = STAR;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:68-71 */
  private constructor(
    /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:53 */
    private readonly key: StyleKey,
    /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:52 */
    private readonly stereotypes: ReadonlySet<string>,
  ) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:55-57 */
  static createStereotype(s: string): StyleSignatureBasic {
    return StyleSignatureBasic.empty().addStereotype(s);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:59-62 */
  toString(): string {
    return `${this.key.toString()} [${[...this.stereotypes].join(', ')}]`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:64-66 */
  static empty(): StyleSignatureBasic {
    return new StyleSignatureBasic(StyleKey.empty(), new Set());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:73-79 */
  addClickable(url: Url | undefined): StyleSignatureBasic {
    if (url === undefined) return this;

    return new StyleSignatureBasic(this.key.addClickable(url), this.stereotypes);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:81-83 */
  addLevel(level: number): StyleSignatureBasic {
    return new StyleSignatureBasic(this.key.addLevel(level), this.stereotypes);
  }

  /**
   * `addStereotype(String)` (java:85-90) adds `clean(stereo)`;
   * `addStereotype(Stereotype)` (java:104-116) adds every cleaned
   * `getLabels(Guillemet.NONE)` entry and is identity for `null`.
   */
  addStereotype(stereo: string | Stereotype | undefined): StyleSignatureBasic {
    if (stereo === undefined) return this;

    const labels = typeof stereo === 'string' ? [stereo] : stereo.getLabels(GUILLEMET_NONE);
    const result = new Set(this.stereotypes);
    for (const s of labels) result.add(clean(s));

    return new StyleSignatureBasic(this.key, result);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:92-102 */
  with(stereostyles: Stereostyles): StyleSignature {
    if (stereostyles.isEmpty()) return this;
    const result = new Set(this.stereotypes);
    for (const name of stereostyles.getStyleNames()) result.add(name);

    return new StyleSignatureBasic(this.key, result);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:118-132 */
  withTOBECHANGED(stereo: Stereotype | undefined): StyleSignature {
    if (stereo === undefined || stereo.getStyleNames().length === 0) return this;

    const labels = stereo.getLabels(GUILLEMET_NONE);
    if (labels.length === 0) return this;

    const result = new StyleSignatures();
    for (const name of labels) result.add(this.addStereotype(name));

    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:134-148 */
  forStereotypeItself(stereo: Stereotype | undefined): StyleSignature {
    if (stereo === undefined || stereo.getStyleNames().length === 0) return this;

    const labels = stereo.getLabels(GUILLEMET_NONE);
    if (labels.length === 0) return this;

    const result = new StyleSignatures();
    for (const name of labels) result.add(this.addStereotype(name).addSName('stereotype'));

    return result;
  }

  /**
   * Upstream's first two lines clone `key.snames` into an unused local
   * (java:151-152); dropped as a dead store.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:150-154
   */
  addSName(name: SName): StyleSignatureBasic {
    return new StyleSignatureBasic(this.key.addSName(name), this.stereotypes);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:156-158 */
  addStar(): StyleSignatureBasic {
    return new StyleSignatureBasic(this.key.addStar(), this.stereotypes);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:160-162 */
  isStarred(): boolean {
    return this.key.isStared;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:164-172 */
  equals(other: StyleSignatureBasic): boolean {
    if (this === other) return true;
    return this.keyString() === other.keyString();
  }

  /**
   * `hashCode` stand-in (`Objects.hash(key, stereotypes)`, java:174-184):
   * a canonical string, equal exactly when {@link equals} holds.
   */
  keyString(): string {
    return JSON.stringify([this.key.keyString(), [...this.stereotypes].sort()]);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:188-192 */
  matchAll(other: StyleSignatureBasic): boolean {
    return StyleSignatureBasic.matchAllImpl(this, other);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:194-220 */
  private static matchAllImpl(declaration: StyleSignatureBasic, element: StyleSignatureBasic): boolean {
    if (declaration.key.level !== -1)
      if (declaration.key.isStared) {
        if (element.key.level === -1) return false;
        if (element.key.level < declaration.key.level) return false;
      } else {
        if (element.key.level === -1) return false;
        if (element.key.level !== declaration.key.level) return false;
      }

    if (element.isStarred() && !declaration.isStarred()) return false;

    if (!containsAll(element.key.snames, declaration.key.snames)) return false;

    if (!containsAll(element.stereotypes, declaration.stereotypes)) return false;

    return true;
    // #lizard forgives -- line-for-line port of matchAllImpl's nested level
    // branches (StyleSignatureBasic.java:196-208); splitting them hides the
    // starred/unstarred asymmetry the probe pins.
  }

  /**
   * The three upstream `of` overloads:
   * - `of(SName...)` (java:222-224);
   * - `of(n0, n1, n2, n3, SName[] names)` (java:280-286) — only 1 or 2
   *   trailing names, otherwise `UnsupportedOperationException`;
   * - `of(n0, n1, n2, SName[] sNames, SName... other)` (java:288-298).
   */
  static of(...names: SName[]): StyleSignatureBasic;
  static of(name0: SName, name1: SName, name2: SName, name3: SName, names: readonly SName[]): StyleSignatureBasic;
  static of(name0: SName, name1: SName, name2: SName, sNames: readonly SName[], ...other: SName[]): StyleSignatureBasic;
  static of(...args: (SName | readonly SName[])[]): StyleSignatureBasic {
    const [name0, name1, name2, fourth, fifth] = args;
    if (isSNameArray(fourth))
      return StyleSignatureBasic.of(...([name0, name1, name2, ...fourth, ...args.slice(4)] as SName[]));
    if (args.length === 5 && isSNameArray(fifth)) {
      if (fifth.length === 1 || fifth.length === 2)
        return StyleSignatureBasic.of(...([name0, name1, name2, fourth, ...fifth] as SName[]));
      throw new Error(`StyleSignatureBasic.of: unsupported trailing SName[] of length ${String(fifth.length)}`);
    }
    return new StyleSignatureBasic(StyleKey.of(...(args as SName[])), new Set());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:237-251 */
  mergeWith(others: StyleSignatureBasic | readonly SignedStyle[]): StyleSignatureBasic {
    if (others instanceof StyleSignatureBasic) {
      const result2 = new Set(this.stereotypes);
      for (const s of others.stereotypes) result2.add(s);

      return new StyleSignatureBasic(this.key.mergeWith(others.key), result2);
    }
    return others.reduce<StyleSignatureBasic>((result, other) => result.mergeWith(other.getSignature()), this);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:261-263 */
  isWithDot(): boolean {
    return this.stereotypes.size > 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:267-269 */
  static activity(): StyleSignatureBasic {
    return StyleSignatureBasic.of('root', 'element', 'activityDiagram', 'activity');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:271-273 */
  static activityDiamond(): StyleSignatureBasic {
    return StyleSignatureBasic.of('root', 'element', 'activityDiagram', 'activity', 'diamond');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:275-277 */
  static activityArrow(): StyleSignatureBasic {
    return StyleSignatureBasic.of('root', 'element', 'activityDiagram', 'activity', 'arrow');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:300-302 */
  isEmpty(): boolean {
    return this.key.snames.size === 0 && this.stereotypes.size === 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:304-306 */
  getKey(): StyleKey {
    return this.key;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleSignatureBasic.java:308-310 */
  getStereotypes(): ReadonlySet<string> {
    return this.stereotypes;
  }

  /**
   * Port-only accessor kept for `skin/VisibilityModifier.ts`'s existing
   * consumers (the pre-T1b `{ names }` shape): the snames in `of(...)`
   * insertion order. Upstream reads `getKey().snames` instead.
   */
  get names(): readonly SName[] {
    return [...this.key.snames];
  }
}
