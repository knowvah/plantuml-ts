import type { ResolvedColor } from '../../core/klimt/color/HColorSet.js';
import { HColors } from '../../core/klimt/color/HColors.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import { LinkDecor } from '../../core/decoration/LinkDecor.js';
import { LinkType } from '../../core/decoration/LinkType.js';
import { WithLinkType } from '../../core/decoration/WithLinkType.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { HColor, HColorSet } from '../../core/style/Value.js';
import type { Task } from './core/Task.js';
import { TaskAttribute } from './core/TaskAttribute.js';
import type { TaskInstant } from './core/TaskInstant.js';
import type { TaskDrawRegistryData } from './data/TaskDrawRegistryData.js';
import { GanttArrow } from './GanttArrow.js';
import type { TimePoint } from './time/TimePoint.js';
import type { TimeScale } from './timescale/TimeScale.js';

/** A bare `XColor`-shaped record: what `WithLinkType`'s `getColorOrWhite` adaptation returns for `-[#012]->`. */
function isResolvedColor(color: object): color is ResolvedColor {
  const c = color as Partial<Record<keyof ResolvedColor, unknown>>;
  return typeof c.r === 'number' && typeof c.g === 'number' && typeof c.b === 'number' && typeof c.a === 'number';
}

/**
 * `WithLinkType#getSpecificColor` answers the abel layer's opaque colour; the style layer's
 * `Style#eventuallyOverride(PName, HColor)` takes the style `HColor` (Java has one `HColor`).
 *
 * The Java narrows nothing: `HColorSet.getColorOrWhite` returns an `HColorSimple`
 * (`HColorSet.java:58-63`), and any `HColor` flows into `eventuallyOverride`. The port's
 * `getColorOrWhite` adaptation (`WithLinkType.ts`) returns the bare `ResolvedColor`, so the
 * `HColors.simple(XColor)` wrap (`HColors.java:178-180`) that Java's parse performs happens here.
 * Every other colour passes through untouched; an unsupported one fails at draw time, as the jar does.
 */
function styleColorOf(color: object | undefined): HColor | undefined {
  if (color === undefined) return undefined;
  if (isResolvedColor(color)) return HColors.simple(color);
  return color as HColor;
}

/**
 * GanttConstraint -- a `->` link between two task instants; a `WithLinkType` that draws as a {@link GanttArrow}.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:55-131
 */
export class GanttConstraint extends WithLinkType {
  readonly #source: TaskInstant;
  readonly #dest: TaskInstant;
  readonly #styleBuilder: StyleBuilder;
  readonly #colorSet: HColorSet;

  /**
   * Both Java constructors: the second (java:75-77) is this one with `forcedColor` null.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:62-72
   */
  public constructor(
    colorSet: HColorSet,
    styleBuilder: StyleBuilder,
    source: TaskInstant,
    dest: TaskInstant,
    forcedColor?: HColor,
  ) {
    super();
    this.#styleBuilder = styleBuilder;
    this.#colorSet = colorSet;
    this.#source = source;
    this.#dest = dest;
    this.type = new LinkType(LinkDecor.NONE, LinkDecor.NONE);
    this.setSpecificColor(forcedColor);
  }

  /** `==` is identity. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:79-81 */
  public isOn(task: Task): boolean {
    return this.#source.getMoment() === task || this.#dest.getMoment() === task;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:83-92 */
  public isThereRightArrow(task: Task): boolean {
    if (this.#dest.getMoment() === task && this.#dest.getAttribute() === TaskAttribute.END) return true;

    if (
      this.#source.getMoment() === task &&
      this.#dest.getAttribute() === TaskAttribute.END &&
      this.#source.getAttribute() === TaskAttribute.END
    )
      return true;

    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:94-97 */
  public toString(): string {
    return this.#source.toString() + ' --> ' + this.#dest.toString();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:99-101 */
  public getStyleSignature(): StyleSignatureBasic {
    return StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'arrow');
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:103-108 */
  public getUDrawable(timeScale: TimeScale, toTaskDraw: TaskDrawRegistryData): UDrawable {
    const merged = this.getStyleSignature().getMergedStyle(this.#styleBuilder);
    if (merged === undefined) throw new Error('NullPointerException: no style for gantt arrow');
    let style = merged.eventuallyOverride('LineColor', styleColorOf(this.getSpecificColor()));
    style = style.eventuallyOverride(this.getType().getStroke3(style.getStroke()));
    return new GanttArrow(this.#colorSet, style, timeScale, this.#source, this.#dest, toTaskDraw, this.#styleBuilder);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:110-118 */
  public isHidden(min: TimePoint, max: TimePoint): boolean {
    if (GanttConstraint.#isHiddenAt(this.#source.getInstantPrecise(), min, max)) return true;

    if (GanttConstraint.#isHiddenAt(this.#dest.getInstantPrecise(), min, max)) return true;

    return false;
  }

  /** The private `isHidden(TimePoint, TimePoint, TimePoint)` overload. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:120-128 */
  static #isHiddenAt(now: TimePoint, min: TimePoint, max: TimePoint): boolean {
    if (now.compareTo(min) < 0) return true;

    if (now.compareTo(max) > 0) return true;

    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:130-131 */
  public goNorank(): void {}
}
