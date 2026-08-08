/**
 * `Stereotype` — a `<<label>>` decoration attached to a classifier/entity,
 * and one of the `CharSequence`-typed element kinds a `Display`'s element
 * list can hold (`Display.create0`'s `get(0) instanceof Stereotype` /
 * `get(size()-1) instanceof Stereotype` dispatch, T9c's own consumer).
 *
 * Faithful port of `stereo/Stereotype.java` (239 ln) — NOT `cucadiagram/`,
 * see this file's own package. No pre-existing equivalent: this port's
 * `src/diagrams/class/class-stereotype.ts` models a classifier's stereotype
 * as a raw `string` field plus free functions scoped to CLASS-DIAGRAM
 * header layout only (`splitStereotypeLabels`, `parseCircledCharDecoration`,
 * ...) — a differently-shaped, narrower thing than upstream's general
 * `Stereotype` value object, which every diagram type's `Display` element
 * list can hold. Adapting `class-stereotype.ts` to BE this class (or vice
 * versa) would mean rewiring its callers, which this batch's "pure
 * addition, nothing routes through your code" constraint forbids — see
 * this file's own report for the full comparison. This is a genuine
 * addition, not a parallel representation of something this port already
 * has in the same shape.
 *
 * `CharSequence` has no TypeScript equivalent; `charAt`/`length`/
 * `subSequence` are ported as ordinary methods (see each below). Per the
 * task brief: `Display`'s dispatch needs `Stereotype`/`MessageNumber`/plain
 * elements to be discriminable. Since both are REAL classes here (unlike
 * Java's shared `CharSequence` interface), `instanceof Stereotype` already
 * works in TypeScript — this class ALSO carries an explicit
 * `readonly kind = 'Stereotype'` discriminant field plus an {@link
 * isStereotype} type guard, for a `Display` element union that also
 * includes plain `string` (which has no `instanceof`).
 */

import { PackageStyle } from '../svek/PackageStyle.js';
import type { PackageStyleName } from '../svek/PackageStyle.js';
import type { ResolvedColor } from '../klimt/color/HColorSet.js';
import type { GuillemetPair } from '../text/Guillemet.js';
import { manageGuillemet } from '../text/Guillemet.js';
import { StereotypeDecoration, cutLabels, GUILLEMET_DOUBLE_COMPARATOR } from './StereotypeDecoration.js';
import type { SpriteRegistry } from '../sprite-commands.js';
import { getSprite as lookupSprite } from '../sprite-commands.js';
import type { Sprite } from '../klimt/sprite/Sprite.js';

/**
 * Stand-in for `UFont` — the SAME scope reduction as
 * `klimt/font/StringBounder.ts`'s own `{family,size}` narrowing (that
 * file's doc comment: porting the full `UFont` class, bold/italic/
 * monospaced flags, AWT `Font` construction, is out of scope). Nothing
 * inside `Stereotype.java` reads `circledFont`'s own fields — it is only
 * stored (constructor) and returned (`getCircledFont`) — so this minimal
 * shape is sufficient for full fidelity here.
 */
export interface CircledFont {
  readonly family: string;
  readonly size: number;
}

/** `Stereotype.checkLabel` (java:75-79). */
function checkLabel(label: string): void {
  if (!label.startsWith('<<') || !label.endsWith('>>')) {
    throw new Error(`Stereotype label must be wrapped in << >>, got: ${label}`);
  }
}

/** `Stereotype.p` (java:123) — BYTE-IDENTICAL to `core/text/Guillemet.ts`'s
 *  own local `GUILLEMET_PATTERN`, matching upstream's own duplication:
 *  `Guillemet.java:76` declares the exact same pattern string independently
 *  in a different file, for a different purpose (rewrite vs. extract). */
const MULTIPLE_LABELS_RE = /<<\s?((?:<&\w+>|[^<>])+?)\s?>>/g;

export class Stereotype {
  /** Discriminant for a `Display` element-list union (see file doc). */
  readonly kind = 'Stereotype' as const;

  /**
   * `Stereotype`'s private constructor (java:66-73) took an unused `label`
   * parameter (never read in the constructor body — `decoration.label` is
   * what every other method reads). Dropped here: it is dead weight in the
   * Java itself, not a divergence in observable behavior, and keeping a
   * provably-unread parameter would trip this project's own
   * no-unused-vars lint convention for zero fidelity benefit.
   */
  private constructor(
    private readonly automaticPackageStyle: boolean,
    private readonly decoration: StereotypeDecoration,
    private readonly radius: number,
    private readonly circledFont: CircledFont | undefined,
  ) {}

  /** `Stereotype.build(String)` (java:81-85) — `undefined` in, `undefined`
   *  out, matching upstream's null-in/null-out short-circuit. */
  static build(label: string | undefined): Stereotype | undefined;
  /** `Stereotype.build(String, boolean)` (java:87-91). */
  static build(label: string, automaticPackageStyle: boolean): Stereotype;
  /** `Stereotype.build(String, double, UFont, HColorSet)` (java:93-98).
   *  `htmlColorSet` replaces upstream's `HColorSet` instance with a plain
   *  resolver function — see `StereotypeDecoration.ts`'s file doc for why,
   *  and why `throws NoSuchColorException` is not propagated. */
  static build(
    label: string,
    radius: number,
    circledFont: CircledFont | undefined,
    htmlColorSet: (name: string) => ResolvedColor | undefined,
  ): Stereotype;
  static build(
    label: string | undefined,
    arg2?: boolean | number,
    circledFont?: CircledFont,
    htmlColorSet?: (name: string) => ResolvedColor | undefined,
  ): Stereotype | undefined {
    if (label === undefined) return undefined;
    if (arg2 === undefined) return Stereotype.build(label, true);
    if (typeof arg2 === 'boolean') {
      checkLabel(label);
      return new Stereotype(arg2, StereotypeDecoration.buildSimple(label), 0, undefined);
    }
    checkLabel(label);
    return new Stereotype(true, StereotypeDecoration.buildComplex(label, htmlColorSet!), arg2, circledFont);
  }

  /** java:100-102. */
  getHtmlColor(): ResolvedColor | undefined {
    return this.decoration.htmlColor;
  }

  /** java:104-106. `''` where upstream returns the `'\0'` sentinel char —
   *  see {@link isSpotted}. */
  getCharacter(): string {
    return this.decoration.character;
  }

  /**
   * `Stereotype#getSprite(SpriteContainer): TextBlock` (java:108-117),
   * adapted to a LOOKUP-only result: this port's `Sprite` interface
   * (`klimt/sprite/Sprite.ts`) deliberately never ported `asTextBlock` —
   * that file's own doc comment records the architecture reason (no
   * AWT-style `UGraphic`-drawable abstraction in this browser-safe,
   * pure-SVG renderer) and names the port's actual equivalent capability
   * (`sprite-raster.ts#spriteToPngDataUri`, a render-time PNG/tint
   * pipeline needing font-color params this method does not itself carry
   * the machinery to assemble without importing render-layer modules
   * outside this task's write-set). `container` -> this port's real
   * `SpriteRegistry` (`sprite-commands.ts`) rather than a newly-invented
   * `SpriteContainer` type — that registry already fills the identical
   * per-diagram name-lookup role upstream's `SpriteContainer#getSprite`
   * does. Null/undefined guards preserved exactly (both the
   * `spriteName == null` and `container == null` early-returns).
   * @see ~/git/plantuml/.../klimt/sprite/SpriteContainer.java (upstream's
   *   `getSprite(String): Sprite`, the piece this DOES faithfully reach)
   */
  getSprite(registry: SpriteRegistry | undefined): Sprite | undefined {
    if (this.decoration.spriteName === undefined || registry === undefined) return undefined;
    return lookupSprite(registry, this.decoration.spriteName);
  }

  /**
   * `decoration.spriteName` / `decoration.spriteScale`, read directly.
   *
   * Upstream has no such accessor because it does not need one: everything
   * that wants the sprite calls {@link getSprite}, handing it the ambient
   * `SpriteContainer` (the classpath-backed `SkinParam`). This port's
   * container is the per-diagram `SpriteRegistry`, which is built during
   * PARSING and consumed during LAYOUT/RENDER — two different phases with
   * two different views of it (`SpriteDimsLookup` for the sizer, the raw
   * registry for the renderer). The stereotype is parsed in the first
   * phase and resolved in the second, so the NAME has to survive the trip
   * on its own. `EntityImageDescriptionDelegates.ts#resolveStereotypeSprite`
   * is the single place that turns it back into a sprite, and it is the
   * only reader of these two accessors.
   */
  getSpriteName(): string | undefined {
    return this.decoration.spriteName;
  }

  /** `decoration.spriteScale` — see {@link getSpriteName}. `0` when the
   *  stereotype names no sprite (upstream's own unset value). */
  getSpriteScale(): number {
    return this.decoration.spriteScale;
  }

  /** java:119-121. */
  isWithOOSymbol(): boolean {
    return this.decoration.label.toLowerCase() === '<<o-o>>';
  }

  /** java:125-133. */
  getMultipleLabels(): string[] {
    const result: string[] = [];
    MULTIPLE_LABELS_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = MULTIPLE_LABELS_RE.exec(this.decoration.label)) !== null) {
      result.push(m[1]!);
    }
    return result;
  }

  /** java:135-137. */
  isSpotted(): boolean {
    return this.decoration.character !== '';
  }

  /** java:139-145. */
  toString(): string {
    if (this.decoration.character === '') return this.decoration.label;
    return `${this.decoration.character} ${this.decoration.label}`;
  }

  /** `CharSequence#charAt` (java:147-149). */
  charAt(index: number): string {
    return this.toString().charAt(index);
  }

  /** `CharSequence#length` (java:151-153). */
  length(): number {
    return this.toString().length;
  }

  /** `CharSequence#subSequence` (java:155-157). */
  subSequence(start: number, end: number): string {
    return this.toString().substring(start, end);
  }

  /** java:159-161. */
  getRadius(): number {
    return this.radius;
  }

  /** java:163-165. */
  getCircledFont(): CircledFont | undefined {
    return this.circledFont;
  }

  /** java:167-175. */
  getLabel(guillemet: GuillemetPair): string | undefined {
    if (this.isWithOOSymbol()) return undefined;
    if (this.decoration.spriteName !== undefined && this.decoration.spriteName.startsWith('archimate/')) {
      return manageGuillemet(`<<${this.decoration.spriteName.slice('archimate/'.length)}>>`, guillemet);
    }
    return manageGuillemet(this.decoration.label, guillemet);
  }

  /** java:177-183. */
  getLabels(guillemet: GuillemetPair): string[] {
    const labelLocal = this.getLabel(GUILLEMET_DOUBLE_COMPARATOR);
    if (labelLocal === undefined) return [];
    return cutLabels(labelLocal, guillemet);
  }

  /**
   * `Stereotype#getStyles(StyleBuilder): List<Style>` (java:185-193) — NOT
   * ported. Blocked on `Style`/`StyleBuilder`/`PName`/`SName`, which do not
   * exist anywhere in this port — the SAME gap `SheetBlock1.ts` (T8) and
   * `ClockwiseTopRightBottomLeft.ts` (T7) already independently hit and
   * documented for this exact mission batch (T8's dropped-item #3;
   * `ClockwiseTopRightBottomLeft.ts`'s own `marginForDocument(StyleBuilder)`
   * doc comment). Per this task's brief ("port them if small and clearly
   * in-scope, or STOP and report if they are large"): `Style`/`StyleBuilder`
   * is a full style-resolution subsystem, not a small sibling — echoing the
   * established precedent rather than re-deciding it. {@link
   * getStyleNames} (below), the dependency-light half of the same upstream
   * method pair, IS fully ported. Wire `getStyles` when a future task ports
   * `Style`/`StyleBuilder`.
   */
  // getStyles intentionally omitted — see doc comment above.

  /** java:195-197. */
  getStyleNames(): string[] {
    return this.decoration.getStyleNames();
  }

  /** `Stereotype#getPackageStyle` (java:199-208). */
  getPackageStyle(): PackageStyleName | undefined {
    if (!this.automaticPackageStyle) return undefined;
    for (const p of Object.values(PackageStyle)) {
      if (`<<${p}>>`.toLowerCase() === this.decoration.label.toLowerCase()) return p;
    }
    return undefined;
  }

  /** java:210-213. Ported verbatim, including the bare (bracket-less)
   *  comparisons — see {@link isMachineOrSpecification}'s own note on
   *  upstream's asymmetry across this family of methods. */
  isBiddableOrUncertain(): boolean {
    const l = this.decoration.label;
    return l.toLowerCase() === '<<b>>' || l.toLowerCase() === '<<biddable>>' || l.toLowerCase() === '<<uncertain>>';
  }

  /** java:215-217. */
  isCausal(): boolean {
    const l = this.decoration.label;
    return l.toLowerCase() === '<<c>>' || l.toLowerCase() === '<<causal>>';
  }

  /** java:219-222. */
  isLexicalOrGiven(): boolean {
    const l = this.decoration.label.toLowerCase();
    return l === '<<l>>' || l === '<<lexical>>' || l === '<<x>>' || l === '<<given>>';
  }

  /** java:224-227. */
  isDesignedOrSolved(): boolean {
    const l = this.decoration.label.toLowerCase();
    return l === '<<d>>' || l === '<<designed>>' || l === '<<nested>>' || l === '<<solved>>';
  }

  /**
   * java:229-233. Ported VERBATIM including the bare `"M"` comparison
   * (no `<<`/`>>` wrapping) — every sibling `isXxx` method in this class
   * compares a bracketed form (`"<<B>>"`, `"<<C>>"`, ...); this one alone
   * compares an unbracketed `"M"`. That reads like an upstream oversight,
   * but per this project's porting discipline ("preserve behavior;
   * diverge only deliberately" — a bug worth fixing is a named divergence
   * for the maintainer, never a quiet inline correction), it is preserved
   * exactly as written rather than "fixed" to match its siblings.
   */
  isMachineOrSpecification(): boolean {
    const l = this.decoration.label.toLowerCase();
    return (
      l === 'm' ||
      l === '<<machine>>' ||
      l === '<<s>>' ||
      l === '<<spec>>' ||
      l === '<<specification>>'
    );
  }

  /** java:235-237. */
  isIcon(): boolean {
    return this.decoration.label.toLowerCase() === '<<icon>>';
  }
}

/** Discriminate a `Display` element (see file doc) as a `Stereotype`. */
export function isStereotype(value: unknown): value is Stereotype {
  return value instanceof Stereotype;
}
