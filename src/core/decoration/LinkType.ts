/**
 * LinkType — the immutable decor1/style/decor2/middle-decor bundle a
 * `Link` carries (via `WithLinkType.type` — T6's write-set), with the
 * copy-on-write mutators the command layer uses and the svek dot
 * attribute emission.
 *
 * Upstream: decoration/LinkType.java:44-326, ported in full. Placed
 * under `src/core/abel/decoration/` — see `LinkDecor.ts`'s header note
 * on the write-set-constrained home. SI1/T2 (batch 1); ADR-1.
 *
 * Constructor note: upstream has a public 2-arg constructor delegating
 * to a PRIVATE 4-arg one (:72-81). TS cannot split overload
 * visibility, so the extra parameters are optional with upstream's
 * 2-arg defaults (`LinkMiddleDecor.NONE`, a fresh `LinkStyle.NORMAL()`
 * per call); internal copies pass all four.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:44
 */
import type { UStroke } from '../klimt/UStroke.js';
import { LinkStrategy } from '../abel/LinkStrategy.js';
import { LinkDecor, getArrowSize } from './LinkDecor.js';
import { LinkMiddleDecor, getInversed } from './LinkMiddleDecor.js';
import { LinkStyle, javaDoubleToString } from './LinkStyle.js';

export class LinkType {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:46-49 */
  private readonly decor1: LinkDecor;
  private readonly linkStyle: LinkStyle;
  private readonly decor2: LinkDecor;
  private readonly middleDecor: LinkMiddleDecor;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:72-81 */
  constructor(
    decor1: LinkDecor,
    decor2: LinkDecor,
    middleDecor: LinkMiddleDecor = LinkMiddleDecor.NONE,
    style: LinkStyle = LinkStyle.NORMAL(),
  ) {
    this.decor1 = decor1;
    this.decor2 = decor2;
    this.middleDecor = middleDecor;
    this.linkStyle = style;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:51-53 */
  isDoubleDecorated(): boolean {
    return this.decor1 !== LinkDecor.NONE && this.decor2 !== LinkDecor.NONE;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:55-60 */
  looksLikeRevertedForSvg(): boolean {
    if (this.decor1 === LinkDecor.NONE && this.decor2 !== LinkDecor.NONE) return true;

    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:62-70 */
  looksLikeNoDecorAtAllSvg(): boolean {
    if (this.decor1 === LinkDecor.NONE && this.decor2 === LinkDecor.NONE) return true;

    if (this.decor1 !== LinkDecor.NONE && this.decor2 !== LinkDecor.NONE) return true;

    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:83-85 */
  withoutDecors1(): LinkType {
    return new LinkType(LinkDecor.NONE, this.decor2, this.middleDecor, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:87-89 */
  withoutDecors2(): LinkType {
    return new LinkType(this.decor1, LinkDecor.NONE, this.middleDecor, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:96-99 */
  toString(): string {
    return `${this.decor1}-${this.linkStyle.toString()}-${this.decor2}`;
  }

  /** Java `String#hashCode` of {@link toString} (32-bit int).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:101-104 */
  hashCode(): number {
    let h = 0;
    const s = this.toString();
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return h;
  }

  /** Upstream compares `linkStyle` with `==` — REFERENCE identity, so
   * two independently-built `LinkType`s (each holding a fresh
   * `LinkStyle.NORMAL()`) are NOT equal. Load-bearing quirk, preserved
   * with `===`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:106-109 */
  equals(other: LinkType): boolean {
    return (
      this.decor1 === other.decor1 &&
      this.decor2 === other.decor2 &&
      this.linkStyle === other.linkStyle
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:111-113 */
  isInvisible(): boolean {
    return this.linkStyle.isInvisible();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:115-117 */
  goDashed(): LinkType {
    return new LinkType(this.decor1, this.decor2, this.middleDecor, LinkStyle.DASHED());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:119-121 */
  goDotted(): LinkType {
    return new LinkType(this.decor1, this.decor2, this.middleDecor, LinkStyle.DOTTED());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:123-125 */
  goThickness(thickness: number): LinkType {
    return new LinkType(
      this.decor1,
      this.decor2,
      this.middleDecor,
      this.linkStyle.goThickness(thickness),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:127-129 */
  goBold(): LinkType {
    return new LinkType(this.decor1, this.decor2, this.middleDecor, LinkStyle.BOLD());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:131-133 */
  getInversed(): LinkType {
    return new LinkType(this.decor2, this.decor1, getInversed(this.middleDecor), this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:135-137 */
  withMiddleCircle(): LinkType {
    return new LinkType(this.decor1, this.decor2, LinkMiddleDecor.CIRCLE, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:139-141 */
  withMiddleCircleCircled(): LinkType {
    return new LinkType(this.decor1, this.decor2, LinkMiddleDecor.CIRCLE_CIRCLED, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:143-145 */
  withMiddleCircleCircled1(): LinkType {
    return new LinkType(this.decor1, this.decor2, LinkMiddleDecor.CIRCLE_CIRCLED1, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:147-149 */
  withMiddleCircleCircled2(): LinkType {
    return new LinkType(this.decor1, this.decor2, LinkMiddleDecor.CIRCLE_CIRCLED2, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:151-153 */
  withMiddleSubset(): LinkType {
    return new LinkType(this.decor1, this.decor2, LinkMiddleDecor.SUBSET, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:155-157 */
  withMiddleSuperset(): LinkType {
    return new LinkType(this.decor1, this.decor2, LinkMiddleDecor.SUPERSET, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:159-161 */
  getInvisible(): LinkType {
    return new LinkType(this.decor1, this.decor2, this.middleDecor, LinkStyle.INVISIBLE());
  }

  /** The dot `arrowtail`/`arrowhead`/`dir`/`arrowsize` attribute string
   * svek emits for this link. `SIMPLEST` (the live strategy) always
   * emits no decor; the `LEGACY_toberemoved` branch is ported verbatim
   * (dead upstream, `Link.getLinkStrategy()` is hardwired). The
   * `arrowsize` concatenation uses Java `Double.toString` formatting
   * (`2.0`, not `2`) — jar-parity-sensitive.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:163-197 */
  getSpecificDecorationSvek(linkStrategy: LinkStrategy): string {
    if (linkStrategy === LinkStrategy.SIMPLEST) return 'arrowtail=none,arrowhead=none';

    let sb = '';

    const isEmpty1 = this.decor1 === LinkDecor.NONE;
    const isEmpty2 = this.decor2 === LinkDecor.NONE;

    if (isEmpty1 && isEmpty2) {
      sb += 'arrowtail=none';
      sb += ',arrowhead=none';
    } else if (!isEmpty1 && !isEmpty2) {
      sb += 'dir=both,';
      sb += 'arrowtail=empty';
      sb += ',arrowhead=empty';
    } else if (isEmpty1 && !isEmpty2) {
      sb += 'arrowtail=empty';
      sb += ',arrowhead=none';
      sb += ',dir=back';
    }

    const arrowsize = Math.max(getArrowSize(this.decor1), getArrowSize(this.decor2));
    if (arrowsize > 0) {
      if (sb.length > 0) sb += ',';

      sb += `arrowsize=${javaDoubleToString(arrowsize)}`;
    }
    return sb;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:199-201 */
  getDecor1(): LinkDecor {
    return this.decor1;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:203-205 */
  getStyle(): LinkStyle {
    return this.linkStyle;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:207-209 */
  getDecor2(): LinkDecor {
    return this.decor2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:224-226 */
  isExtends(): boolean {
    return this.decor1 === LinkDecor.EXTENDS || this.decor2 === LinkDecor.EXTENDS;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:237-239 */
  getPart1(): LinkType {
    return new LinkType(this.decor1, LinkDecor.NONE, this.middleDecor, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:241-243 */
  getPart2(): LinkType {
    return new LinkType(LinkDecor.NONE, this.decor2, this.middleDecor, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:245-256 */
  getStroke3(defaultThickness: UStroke | null): UStroke {
    if (this.linkStyle.isThicknessOverrided()) return this.linkStyle.getStroke3();

    if (defaultThickness === null) return this.linkStyle.getStroke3();

    if (defaultThickness.getDashVisible() === 0 && defaultThickness.getDashSpace() === 0)
      return this.linkStyle.goThickness(defaultThickness.getThickness()).getStroke3();

    return defaultThickness;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:258-260 */
  getMiddleDecor(): LinkMiddleDecor {
    return this.middleDecor;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:262-264 */
  withLollipopInterfaceEye2(): LinkType {
    return new LinkType(LinkDecor.NONE, this.decor2, this.middleDecor, this.linkStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:266-268 */
  withLollipopInterfaceEye1(): LinkType {
    return new LinkType(this.decor1, LinkDecor.NONE, this.middleDecor, this.linkStyle);
  }

  /** The semantic link-type name for the SVG `data-link-type`
   * attribute, in upstream's priority order; null when undetermined.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:276-308 */
  getLinkTypeName(): string | null {
    if (this.has(LinkDecor.COMPOSITION)) return 'composition';

    if (this.has(LinkDecor.AGGREGATION)) return 'aggregation';

    if (this.has(LinkDecor.EXTENDS)) return 'extension';

    if (this.has(LinkDecor.REDEFINES)) return 'redefines';

    if (this.has(LinkDecor.DEFINEDBY)) return 'definedby';

    if (this.hasAny(LinkDecor.ARROW, LinkDecor.ARROW_TRIANGLE)) return 'dependency';

    if (this.has(LinkDecor.NOT_NAVIGABLE)) return 'not_navigable';

    if (this.hasAny(LinkDecor.CROWFOOT, LinkDecor.CIRCLE_CROWFOOT, LinkDecor.LINE_CROWFOOT))
      return 'crowfoot';

    if (this.hasAny(LinkDecor.CIRCLE_LINE, LinkDecor.DOUBLE_LINE) || this.bothNone())
      return 'association';

    if (this.has(LinkDecor.PLUS)) return 'nested';

    return null;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:310-312 */
  private has(decor: LinkDecor): boolean {
    return this.decor1 === decor || this.decor2 === decor;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:314-320 */
  private hasAny(...decors: LinkDecor[]): boolean {
    for (const d of decors) if (this.has(d)) return true;

    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/decoration/LinkType.java:322-324 */
  private bothNone(): boolean {
    return this.decor1 === LinkDecor.NONE && this.decor2 === LinkDecor.NONE;
  }
}
