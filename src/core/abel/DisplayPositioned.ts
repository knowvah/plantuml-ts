import { Display } from '../klimt/creole/Display.js';
import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { VerticalAlignment } from '../klimt/geom/VerticalAlignment.js';
import type { LineLocation } from '../tim/LineLocation.js';

/**
 * DisplayPositioned — a `Display` plus its alignment pair and source
 * location (titles, captions, legends). `Entity#setLegend/getLegend`
 * carries one.
 *
 * SI1/T5 — full port except `createRibbon` (deferred, see its own doc).
 * NOT this port's `annotations/model.ts` `DisplayPositioned` (a
 * `readonly string[]`-based flattening serving the annotations chrome —
 * per ADR-1 the base gets its own faithful abel version and engines are
 * untouched; same coexistence as batch-1's abel enums). Journaled (T5).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:51
 */
export class DisplayPositioned {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:52-55 */
  private readonly display: Display;
  private readonly horizontalAlignment: HorizontalAlignment;
  private readonly verticalAlignment: VerticalAlignment;
  private readonly location: LineLocation | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:57-63 */
  private constructor(
    location: LineLocation | undefined,
    display: Display,
    horizontalAlignment: HorizontalAlignment,
    verticalAlignment: VerticalAlignment,
  ) {
    this.location = location;
    this.display = display;
    this.horizontalAlignment = horizontalAlignment;
    this.verticalAlignment = verticalAlignment;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:65-68 */
  withPage(page: number, lastpage: number): DisplayPositioned {
    const newDisplay = this.display.withPage(page, lastpage);
    return new DisplayPositioned(this.location, newDisplay, this.horizontalAlignment, this.verticalAlignment);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:70-72 */
  withDisplay(display: Display): DisplayPositioned {
    return new DisplayPositioned(this.location, display, this.horizontalAlignment, this.verticalAlignment);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:74-76 */
  withHorizontalAlignment(horizontalAlignment: HorizontalAlignment): DisplayPositioned {
    return new DisplayPositioned(this.location, this.display, horizontalAlignment, this.verticalAlignment);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:78-80 */
  withLocation(location: LineLocation | undefined): DisplayPositioned {
    return new DisplayPositioned(location, this.display, this.horizontalAlignment, this.verticalAlignment);
  }

  /** Both upstream `single` overloads, runtime-discriminated by whether
   * the first argument is a `Display` (the 3-arg form) or a
   * location/undefined (the 4-arg form).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:82-90 */
  static single(
    display: Display,
    horizontalAlignment: HorizontalAlignment,
    verticalAlignment: VerticalAlignment,
  ): DisplayPositioned;
  static single(
    location: LineLocation | undefined,
    display: Display,
    horizontalAlignment: HorizontalAlignment,
    verticalAlignment: VerticalAlignment,
  ): DisplayPositioned;
  static single(
    a: Display | LineLocation | undefined,
    b: Display | HorizontalAlignment,
    c: HorizontalAlignment | VerticalAlignment,
    d?: VerticalAlignment,
  ): DisplayPositioned {
    if (a instanceof Display)
      return new DisplayPositioned(undefined, a, b as HorizontalAlignment, c as VerticalAlignment);

    return new DisplayPositioned(a, b as Display, c as HorizontalAlignment, d as VerticalAlignment);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:92-94 */
  static none(horizontalAlignment: HorizontalAlignment, verticalAlignment: VerticalAlignment): DisplayPositioned {
    return new DisplayPositioned(undefined, Display.NULL, horizontalAlignment, verticalAlignment);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:96-98 */
  getDisplay(): Display {
    return this.display;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:100-102 */
  getHorizontalAlignment(): HorizontalAlignment {
    return this.horizontalAlignment;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:104-106 */
  getVerticalAlignment(): VerticalAlignment {
    return this.verticalAlignment;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:108-110 */
  isNull(): boolean {
    return Display.isNull(this.display);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:112-114 */
  hasUrl(): boolean {
    return this.display.hasUrl();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:116-118 */
  getLineLocation(): LineLocation | undefined {
    return this.location;
  }

  /** DEFERRED per SI1/ADR-2: the ribbon build needs
   * `Style#createTextBlockBordered` + the `ISkinSimple` sheet seam
   * (`display.create(fontConfiguration, alignment, spriteContainer)`),
   * i.e. the style/render machinery scoped out of SI1. Throws until the
   * style slice lands; signature kept so callers can be written against
   * it. Journaled (T5).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/DisplayPositioned.java:120-131 */
  createRibbon(fontConfiguration: unknown, spriteContainer: unknown, style: unknown): never {
    void fontConfiguration;
    void spriteContainer;
    void style;
    throw new Error(
      'deferred per SI1/ADR-2: DisplayPositioned.createRibbon needs Style#createTextBlockBordered and the ISkinSimple sheet seam, not yet ported',
    );
  }
}
