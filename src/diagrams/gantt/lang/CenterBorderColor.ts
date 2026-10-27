import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { HColors } from '../../../core/klimt/color/HColors.js';
import type { HColorOrPaint } from '../../../core/klimt/color/ColorMapper.js';

/**
 * CenterBorderColor — a fill ("center") and optional line ("border") colour pair.
 *
 * `unlinearTo` (java:83-88) shades both colours toward `other` by task
 * completion through `HColors.unlinear`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:42-89
 */
export class CenterBorderColor {
  private readonly center: HColorOrPaint | undefined;
  private readonly border: HColorOrPaint | undefined;
  private readonly style: string | undefined;

  /** The two Java constructors (:42-48), `style` defaulting to `null`. */
  constructor(center: HColorOrPaint | undefined, border: HColorOrPaint | undefined, style?: string) {
    this.center = center;
    this.border = border;
    this.style = style;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:58-69 */
  apply(ug: UGraphic): UGraphic {
    if (this.center === undefined) throw new Error('IllegalStateException');

    // center.bg() is new Back(center); an HColor used as a UChange is the foreground.
    let result = ug.apply(new Back(this.center));
    if (this.border === undefined) result = result.apply(new Fore(this.center));
    else result = result.apply(new Fore(this.border));

    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:71-73 */
  isOk(): boolean {
    return this.center !== undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:75-77 */
  getCenter(): HColorOrPaint | undefined {
    return this.center;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:79-81 */
  getStyle(): string | undefined {
    return this.style;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:83-88 */
  unlinearTo(other: CenterBorderColor, completion: number): CenterBorderColor {
    const newCenter = HColors.unlinear(this.center, other.center, completion);
    const newBorder = HColors.unlinear(this.border, other.border, completion);

    return new CenterBorderColor(newCenter, newBorder, this.style);
  }
}
