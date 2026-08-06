import type { ColorType } from './ColorType.js';
import { LinkStyle } from '../decoration/LinkStyle.js';
import type { UStroke } from '../klimt/UStroke.js';

/**
 * HColor — opaque stand-in for `klimt/color/HColor.java`. Everything in
 * this task's closure only STORES and RETURNS colors (never calls a
 * method on one), so an opaque object type is the exact consumed
 * surface. Callers today may pass this port's `ResolvedColor`
 * (`klimt/color/HColorSet.ts`) or any richer color object; the real
 * `HColor` class hierarchy (gradients, transparency, dark-mode pairs)
 * is future missions' work.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColor.java
 */
export type HColor = object;

/**
 * Colors — an element's resolved per-slot color map plus optional line
 * style and shadowing override (`klimt/color/Colors.java`, 246 ln).
 *
 * SI1/T5 consumed-slice LOCAL port. Upstream home is `klimt/color/` —
 * move there when the full class lands. Ported: the zero-unported-dep
 * slice (`empty`, `isEmpty`, `copy`, `mergeWith`, `getColor` both
 * overloads, `add(ColorType,HColor)`, `addLegacyStroke`, `muteStroke`,
 * `getLineStyle`, `getShadowing`, `toString`). Omitted, each blocked on
 * unported machinery (journaled; revisit when the blockers land):
 *  - the private `add(ColorType, Colors)` overload — its only callers
 *    are the omitted `applyStereotype*` members below
 *  - `Colors(String, HColorSet, ColorType)` parsing constructor — needs
 *    the OOP `HColorSet#getColor` + `NoSuchColorException` (this port's
 *    `HColorSet.ts` is free functions; see `style/ISkinSimple.ts`'s own
 *    audit of the same divergence)
 *  - `getSpecificLineStroke` — needs `LinkStyle#getStroke3` (unported)
 *  - `mute(ISkinParam)`, `applyStroke(UGraphic,...)`,
 *    `applyStereotype(...)`, `applyStereotypeForNote(...)`,
 *    `applyStyle(...)`, `getColor(Style,PName,HColorSet)` — the
 *    skinparam/style/UGraphic application layer (ADR-2's rejected
 *    whole-package skin/ port)
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:55
 */
export class Colors {
  /** `EnumMap<ColorType, HColor>` → insertion-ordered `Map`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:56 */
  private readonly map = new Map<ColorType, HColor>();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:57 */
  private lineStyle: LinkStyle | undefined = undefined;

  /** `Boolean shadowing` (three-state: null / true / false).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:58 */
  private shadowing: boolean | undefined = undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:92-93 */
  private constructor() {}

  /** Upstream is `map.toString() + " " + lineStyle`. `HColor` is an
   * opaque stub here (no `toString` contract), so values print via
   * `JSON.stringify` — diagnostic-only output, adaptation documented.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:60-63 */
  toString(): string {
    const entries = [...this.map.entries()].map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ');
    return `{${entries}} ${String(this.lineStyle)}`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:65-67 */
  static empty(): Colors {
    return new Colors();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:69-71 */
  isEmpty(): boolean {
    return this.map.size === 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:73-78 */
  private copy(): Colors {
    const result = new Colors();
    for (const [k, v] of this.map) result.map.set(k, v);
    result.lineStyle = this.lineStyle;
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:80-89 */
  mergeWith(other: Colors | undefined): Colors {
    if (other === undefined) return this;

    const result = this.copy();
    for (const [k, v] of other.map) result.map.set(k, v);
    if (other.lineStyle !== undefined) result.lineStyle = other.lineStyle;
    return result;
  }

  /** Both upstream overloads: `getColor(key)` and `getColor(key1, key2)`
   * (first non-null wins).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:126-136 */
  getColor(key1: ColorType, key2?: ColorType): HColor | undefined {
    const result = this.map.get(key1);
    if (result !== undefined) return result;
    if (key2 !== undefined) return this.map.get(key2);
    return undefined;
  }

  /** `add(ColorType, HColor)` — copy-on-write put; a null color is a
   * no-op returning `this`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:145-152 */
  add(type: ColorType, color: HColor | undefined): Colors {
    if (color === undefined) return this;

    const result = this.copy();
    result.map.set(type, color);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:163-165 */
  getLineStyle(): LinkStyle | undefined {
    return this.lineStyle;
  }

  /** `addLegacyStroke(String)` — copy with `lineStyle` parsed via
   * `LinkStyle.fromString1(goUpperCase(s))`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:171-176 */
  addLegacyStroke(s: string): Colors {
    const result = this.copy();
    result.lineStyle = LinkStyle.fromString1(s.toUpperCase());
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:210-212 */
  getShadowing(): boolean | undefined {
    return this.shadowing;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java:214-219 */
  muteStroke(stroke: UStroke): UStroke {
    if (this.lineStyle === undefined) return stroke;

    return this.lineStyle.muteStroke(stroke);
  }
}
