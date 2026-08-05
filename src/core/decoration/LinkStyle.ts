/**
 * LinkStyle — the line style of a link (normal/dashed/dotted/bold/
 * invisible) plus an optional thickness override, and its `UStroke`
 * derivation.
 *
 * Upstream: decoration/LinkStyle.java:40-152 — a small immutable class
 * (NOT an enum; the style/thickness pair has identity: `LinkType.equals`
 * compares `LinkStyle` references with `==`). Ported as a class with a
 * private constructor and the upstream static factory methods, each of
 * which allocates a fresh instance exactly like upstream.
 *
 * Placed under `src/core/abel/decoration/` — see `LinkDecor.ts`'s
 * header note on the write-set-constrained home. SI1/T2 (batch 1);
 * ADR-1.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:40
 */
import { UStroke } from '../klimt/UStroke.js';

/** `LinkStyle.Type` (LinkStyle.java:42-44) — the inner 5-value enum. */
const Type = {
  NORMAL: 'NORMAL',
  DASHED: 'DASHED',
  DOTTED: 'DOTTED',
  BOLD: 'BOLD',
  INVISIBLE: 'INVISIBLE',
} as const;
type Type = (typeof Type)[keyof typeof Type];

/**
 * `Double.toString` for the finite, non-exponent-range doubles used
 * here (thickness, arrowsize): Java prints whole doubles with a
 * trailing `.0` (`2.0`), fractional ones as-is (`1.3`). Shared with
 * `LinkType.getSpecificDecorationSvek`'s `"arrowsize=" + arrowsize`
 * concatenation.
 *
 * @see java.lang.Double#toString (whole-number doubles print as "N.0")
 */
export function javaDoubleToString(value: number): string {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

export class LinkStyle {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:52-53 */
  private readonly type: Type;
  private readonly thickness: number | null;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:46-50 */
  private constructor(type: Type, thickness: number | null) {
    this.type = type;
    this.thickness = thickness;
  }

  /** `TYPE(thickness)`, Java `null`/`Double.toString` formatting.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:56-58 */
  toString(): string {
    const t = this.thickness === null ? 'null' : javaDoubleToString(this.thickness);
    return `${this.type}(${t})`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:66-68 */
  isNormal(): boolean {
    return this.type === Type.NORMAL;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:70-72 */
  isInvisible(): boolean {
    return this.type === Type.INVISIBLE;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:74-76 */
  static NORMAL(): LinkStyle {
    return new LinkStyle(Type.NORMAL, null);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:78-80 */
  static INVISIBLE(): LinkStyle {
    return new LinkStyle(Type.INVISIBLE, null);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:82-84 */
  static BOLD(): LinkStyle {
    return new LinkStyle(Type.BOLD, null);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:86-88 */
  static DOTTED(): LinkStyle {
    return new LinkStyle(Type.DOTTED, null);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:90-92 */
  static DASHED(): LinkStyle {
    return new LinkStyle(Type.DASHED, null);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:94-96 */
  goThickness(thickness: number): LinkStyle {
    return new LinkStyle(this.type, thickness);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:98-109 */
  getStroke3(): UStroke {
    if (this.type === Type.DASHED) return new UStroke(7, 7, this.nonZeroThickness());

    if (this.type === Type.DOTTED) return new UStroke(1, 3, this.nonZeroThickness());

    if (this.type === Type.BOLD) return UStroke.withThickness(2);

    return UStroke.withThickness(this.nonZeroThickness());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:111-116 */
  muteStroke(stroke: UStroke): UStroke {
    if (this.type === Type.DASHED || this.type === Type.DOTTED || this.type === Type.BOLD)
      return this.getStroke3();

    return stroke;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:118-123 */
  private nonZeroThickness(): number {
    if (this.thickness === null) return 1;

    return this.thickness;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:125-131 */
  static fromString1(s: string): LinkStyle {
    const result = LinkStyle.fromString2(s);
    if (result === null) return LinkStyle.NORMAL();

    return result;
  }

  /** `dashed`/`dotted`/`bold`/`hidden` (case-insensitive), else null.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:133-147 */
  static fromString2(s: string): LinkStyle | null {
    const lower = s.toLowerCase();
    if (lower === 'dashed') return LinkStyle.DASHED();

    if (lower === 'dotted') return LinkStyle.DOTTED();

    if (lower === 'bold') return LinkStyle.BOLD();

    if (lower === 'hidden') return LinkStyle.INVISIBLE();

    return null;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkStyle.java:149-151 */
  isThicknessOverrided(): boolean {
    return this.thickness !== null;
  }
}
