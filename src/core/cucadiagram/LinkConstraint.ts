import type { Link } from '../abel/Link.js';
import type { Display } from '../klimt/creole/Display.js';
import type { XPoint2D } from '../klimt/geom/XPoint2D.js';

/**
 * LinkConstraint — the paired-link `{constraint}` label drawn between
 * two links. `CucaDiagram#constraintOnLinks` constructs one and hangs
 * it on both links; the svek assembly later positions (`setPosition`)
 * and draws (`drawMe`) it.
 *
 * SI1/T10 — real class replacing T6's opaque `abel/LinkConstraint.ts`
 * brand stub at its upstream-mirrored home (the stub's own doc
 * scheduled exactly this move). 3/4 members ported faithfully;
 * `drawMe` is an ADR-2 deferred throw (its body needs the unported
 * `UGraphic`/`FontConfiguration.create(skinParam, FontParam.ARROW,
 * null)` render seam — the T5 `getStateDescription` precedent).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/LinkConstraint.java:53
 */
export class LinkConstraint {
  /** @see cucadiagram/LinkConstraint.java:55-57 */
  private readonly link1: Link;
  private readonly link2: Link;
  private readonly display: Display;

  /** @see cucadiagram/LinkConstraint.java:59-62 */
  private x1 = 0;
  private y1 = 0;
  private x2 = 0;
  private y2 = 0;

  /** @see cucadiagram/LinkConstraint.java:64-68 */
  constructor(link1: Link, link2: Link, display: Display) {
    this.link1 = link1;
    this.link2 = link2;
    this.display = display;
  }

  /** @see cucadiagram/LinkConstraint.java:70-80 */
  setPosition(link: Link, pt: XPoint2D): void {
    if (link === this.link1) {
      this.x1 = pt.getX();
      this.y1 = pt.getY();
    } else if (link === this.link2) {
      this.x2 = pt.getX();
      this.y2 = pt.getY();
    } else {
      throw new Error('IllegalArgumentException');
    }
  }

  /** Deferred per SI1/ADR-2: the body draws the dashed line + centered
   * label over `UGraphic` with `FontConfiguration.create(skinParam,
   * FontParam.ARROW, null)` — the unported klimt drawing seam. The
   * early-return guards (`x1==0&&y1==0`, `x2==0&&y2==0`) are preserved
   * so an unpositioned constraint stays drawable-as-no-op, exactly as
   * upstream.
   * @see cucadiagram/LinkConstraint.java:82-104 */
  drawMe(): void {
    if (this.x1 === 0 && this.y1 === 0) {
      return;
    }
    if (this.x2 === 0 && this.y2 === 0) {
      return;
    }
    void this.display;
    throw new Error(
      'deferred per SI1/ADR-2: LinkConstraint.drawMe needs the UGraphic render seam not yet ported (cucadiagram/LinkConstraint.java:82-104)',
    );
  }
}
