import { Back } from '../../../core/klimt/Back.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { HColorAutomagic } from '../../../core/klimt/color/HColorAutomagic.js';
import { HColors } from '../../../core/klimt/color/HColors.js';
import type { HColorOrPaint } from '../../../core/klimt/color/ColorMapper.js';

/** The jar's crash text for an `HColorAutomagic` reaching a draw: `"" + getClass()`. */
const AUTOMAGIC_TO_COLOR_FAILURE =
  'UnsupportedOperationException: class net.sourceforge.plantuml.klimt.color.HColorAutomagic';

/** Any upstream `HColor` (`CenterBorderColor.java:42-48`). */
export type GanttColor = HColorOrPaint | HColorAutomagic;

/**
 * `HColors.unlinear` over {@link GanttColor}: the klimt port takes no
 * `HColorAutomagic`, which is not an `HColorSimple`, so it can only take the
 * `0` / `100` / fallback-to-`color1` branches.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColors.java:156-167
 */
function unlinear(
  color1: GanttColor | undefined,
  color2: GanttColor | undefined,
  completion: number,
): GanttColor | undefined {
  if (color1 instanceof HColorAutomagic || color2 instanceof HColorAutomagic) {
    if (completion === 100) return color2;
    return color1;
  }
  return HColors.unlinear(color1, color2, completion);
}

/**
 * CenterBorderColor — a fill ("center") and optional line ("border") colour pair.
 *
 * `unlinearTo` (java:83-88) shades both colours toward `other` by task
 * completion through `HColors.unlinear`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:42-89
 */
export class CenterBorderColor {
  private readonly center: GanttColor | undefined;
  private readonly border: GanttColor | undefined;
  private readonly style: string | undefined;

  /** The two Java constructors (:42-48), `style` defaulting to `null`. */
  constructor(center: GanttColor | undefined, border: GanttColor | undefined, style?: string) {
    this.center = center;
    this.border = border;
    this.style = style;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:58-69 */
  apply(ug: UGraphic): UGraphic {
    if (this.center === undefined) throw new Error('IllegalStateException');

    // An HColorAutomagic does not override HColor#toColor, which throws
    // `"" + getClass()` (HColor.java:66); the jar's SVG driver reaches it at
    // draw time (DriverRectangleSvg.java:85-95, jar oracle: crash report).
    // This is the earliest point the port can fail with the same message.
    if (this.center instanceof HColorAutomagic || this.border instanceof HColorAutomagic)
      throw new Error(AUTOMAGIC_TO_COLOR_FAILURE);

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
  getCenter(): GanttColor | undefined {
    return this.center;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:79-81 */
  getStyle(): string | undefined {
    return this.style;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/lang/CenterBorderColor.java:83-88 */
  unlinearTo(other: CenterBorderColor, completion: number): CenterBorderColor {
    const newCenter = unlinear(this.center, other.center, completion);
    const newBorder = unlinear(this.border, other.border, completion);

    return new CenterBorderColor(newCenter, newBorder, this.style);
  }
}
