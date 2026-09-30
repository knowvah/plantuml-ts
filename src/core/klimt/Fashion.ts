import type { HColor } from '../style/Value.js';

/**
 * Fashion — a back/fore colour pair plus stroke, shadow and corners.
 *
 * Ported slice: the public two-colour constructor (java:90-92, stroke
 * `UStroke.simple()`, shadow and corners 0) and `getBackColor` /
 * `getForeColor` — what `Style#eventuallyOverride(Fashion)`
 * (Style.java:219-227) reads. Not ported: the `with*` builders and
 * getters for stroke/shadow/corners (reached only from
 * `Style#getSymbolContext`, not ported) and the `UGraphic` `apply*`
 * methods.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/Fashion.java:43-140
 */
export class Fashion {
  /** @see Fashion.java:90-92 */
  constructor(
    /** @see Fashion.java:45 */
    private readonly backColor: HColor | undefined,
    /** @see Fashion.java:46 */
    private readonly foreColor: HColor | undefined,
  ) {}

  /** @see Fashion.java:118-120 */
  getBackColor(): HColor | undefined {
    return this.backColor;
  }

  /** @see Fashion.java:122-124 */
  getForeColor(): HColor | undefined {
    return this.foreColor;
  }
}
