import { javaDoubleToString as d } from '../../../core/decoration/LinkStyle.js';

/**
 * FingerPrint — a rectangle used to detect overlaps between drawn items.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/FingerPrint.java:38-69
 */
export class FingerPrint {
  private readonly x: number;
  private readonly y: number;
  private readonly width: number;
  private readonly height: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/FingerPrint.java:45-51 */
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /** Java `double` concatenation (`1.0`, not `1`). @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/FingerPrint.java:53-55 */
  toString(): string {
    return `X=(${d(this.x)}->${d(this.x + this.width)}) Y=(${d(this.y)} ->${d(this.y + this.height)})`;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/FingerPrint.java:57-67 */
  overlap(other: FingerPrint): number {
    if (this.x >= other.x + other.width || other.x >= this.x + this.width) return 0;

    if (this.y >= other.y + other.height || other.y >= this.y + this.height) return 0;

    return this.y + this.height - other.y;
  }
}
