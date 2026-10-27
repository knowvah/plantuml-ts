import type { ISkinParam } from '../../../core/abel/ISkinParam.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { HColorGradient } from '../../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../../core/klimt/color/HColorSimple.js';
import type { UFont } from '../../../core/klimt/font/UFont.js';
import type { Pragma } from '../../../core/skin/Pragma.js';
import type { SName } from '../../../core/style/SName.js';
import type { Style } from '../../../core/style/Style.js';
import type { HColor, HColorSet } from '../../../core/style/Value.js';
import type { GanttStyle } from '../GanttStyle.js';

/** `ug.apply(HColor)`: Java's cast to the concrete colour classes (same as `Style#applyStrokeAndLineColor`). */
function foregroundOf(color: HColor): HColorSimple | HColorGradient {
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
  throw new Error('ClassCastException: line colour is not an HColorSimple');
}

/**
 * TimelineStyleData -- the `timeline` / `closed` / `verticalSeparator` style
 * reads the header and body drawers share.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:45-125
 */
export class TimelineStyleData {
  readonly #ganttStyle: GanttStyle;
  readonly #colorSet: HColorSet;
  readonly #skinParam: ISkinParam;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:50-54 */
  public constructor(skinParam: ISkinParam, ganttStyle: GanttStyle, colorSet: HColorSet) {
    this.#skinParam = skinParam;
    this.#ganttStyle = ganttStyle;
    this.#colorSet = colorSet;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:56-58 */
  public getSkinParam(): ISkinParam {
    return this.#skinParam;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:60-62 */
  public getPragma(): Pragma {
    return this.#skinParam.getPragma();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:64-66 */
  public getFontSizeDay(): number {
    return this.#getStyleDay().value('FontSize').asDouble();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:68-70 */
  public getFontSizeMonth(): number {
    return this.#ganttStyle.getStyle('timeline', 'month').value('FontSize').asDouble();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:72-74 */
  public getFontSizeYear(): number {
    return this.#ganttStyle.getStyle('timeline', 'year').value('FontSize').asDouble();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:76-78 */
  public getFont(param: SName): UFont {
    return this.#ganttStyle.getStyle('timeline', param).getUFont();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:80-82 */
  public getClosedBackgroundColor(): HColor {
    return this.#ganttStyle.getStyle('closed').value('BackGroundColor').asColor(this.#colorSet);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:84-86 */
  public getClosedFontColor(): HColor {
    return this.#ganttStyle.getStyle('closed').value('FontColor').asColor(this.#colorSet);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:88-90 */
  public getOpenFontColor(): HColor {
    return this.#ganttStyle.getStyle('timeline').value('FontColor').asColor(this.#colorSet);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:92-94 */
  public getLineColor(): HColor {
    return this.#ganttStyle.getStyle('timeline').value('LineColor').asColor(this.#colorSet);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:96-98 */
  public getColorSet(): HColorSet {
    return this.#colorSet;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:100-106 */
  public applyVerticalSeparatorStyle(ug: UGraphic): UGraphic {
    const style = this.#ganttStyle.getStyle('verticalSeparator');
    const color = style.value('LineColor').asColor(this.#colorSet);
    const stroke = style.getStroke();
    return ug.apply(new Fore(foregroundOf(color))).apply(stroke);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:108-111 */
  public getCellWidth(): number {
    const w = this.#getStyleDay().value('FontSize').asDouble();
    return w * 1.6;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:113-115 */
  #getStyleDay(): Style {
    return this.#ganttStyle.getStyle('timeline', 'day');
  }
}
