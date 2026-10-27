import type { UGraphic } from '../../../../core/klimt/UGraphic.js';
import { Back } from '../../../../core/klimt/Back.js';
import { Fore } from '../../../../core/klimt/Fore.js';
import { UTranslate } from '../../../../core/klimt/UTranslate.js';
import { HColorGradient } from '../../../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../../../core/klimt/color/HColorSimple.js';
import { HColors } from '../../../../core/klimt/color/HColors.js';
import { UStroke } from '../../../../core/klimt/UStroke.js';
import { Display } from '../../../../core/klimt/creole/Display.js';
import { bridgeFontConfiguration } from '../../../../core/klimt/font/FontConfigurationBridge.js';
import type { StringBounder } from '../../../../core/klimt/font/StringBounder.js';
import { UFont, UFontFace } from '../../../../core/klimt/font/UFont.js';
import { HorizontalAlignment } from '../../../../core/klimt/geom/HorizontalAlignment.js';
import type { TextBlock } from '../../../../core/klimt/shape/TextBlock.js';
import { ULine } from '../../../../core/klimt/shape/ULine.js';
import { URectangle } from '../../../../core/klimt/shape/URectangle.js';
import { SpriteContainerEmpty } from '../../../../core/klimt/sprite/SpriteContainerEmpty.js';
import { FontConfiguration } from '../../../../core/abel/FontConfiguration.js';
import type { ISkinParam } from '../../../../core/abel/ISkinParam.js';
import type { InternalEmojiStore } from '../../../../core/internal-emoji-store.js';
import { Pragma } from '../../../../core/skin/Pragma.js';
import type { SName } from '../../../../core/style/SName.js';
import type { HColor } from '../../../../core/style/Value.js';
import type { DayOfWeek } from '../../../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../../../core/time/LocalDate.js';
import type { Locale } from '../../../../core/utils/I18nTimeData.js';
import type { DayCalendarData } from '../../data/DayCalendarData.js';
import type { TimeBoundsData } from '../../data/TimeBoundsData.js';
import type { TimeScaleConfigData } from '../../data/TimeScaleConfigData.js';
import type { TimelineStyleData } from '../../data/TimelineStyleData.js';
import type { WeekConfigData } from '../../data/WeekConfigData.js';
import { SkinParam } from '../../gantt-skin-param.js';
import { TimePoint } from '../../time/TimePoint.js';
import type { TimePointFormat } from '../../time/TimePointFormat.js';
import type { TimeScale } from '../../timescale/TimeScale.js';

/** `ug.apply(HColor)`: the style layer's `HColor` is an `HColorSimple`/`HColorGradient`; Java's cast otherwise. */
export function paintOf(color: HColor): HColorSimple | HColorGradient {
  if (color instanceof HColorSimple || color instanceof HColorGradient) return color;
  throw new Error('ClassCastException: colour is not an HColorSimple');
}

/**
 * `ug.apply(HColor)` (port-only seam: upstream overloads `apply` on `HColor`, which is `new Fore(color)`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/UGraphic.java
 */
export function applyForeColor(ug: UGraphic, color: HColor): UGraphic {
  return ug.apply(new Fore(paintOf(color)));
}

/**
 * `HColor.equals` as the colour classes define it: `HColorSimple` by `XColor` value, a gradient by
 * identity (`HColorGradient` overrides nothing).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSimple.java
 */
export function hColorEquals(a: HColor, b: HColor): boolean {
  if (a instanceof HColorSimple) return a.equals(b);
  return a === b;
}

/**
 * `Display#create(FontConfiguration, HorizontalAlignment, SpriteContainer)` with a `SpriteContainerEmpty`,
 * the way `TimeHeader#getTextBlockSLOW` and `TimeHeaderSimple#drawSimpleDayCounter` call it.
 *
 * `emoji` is the port-only Twemoji artwork store (ADR-2): upstream's `Emoji#getSvg` reads
 * `emoji/data/<unicode>.svg` off the classpath unconditionally (`Emoji.java:175-181`), which a
 * browser-safe library carries through `RenderOptions.assetStore` instead.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:70-299
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java:183-205
 */
export function createLeftTextBlock(
  display: Display,
  fontConfiguration: FontConfiguration,
  emoji?: InternalEmojiStore,
): TextBlock {
  const spriteContainer = new SpriteContainerEmpty(undefined, emoji);
  const bridged = bridgeFontConfiguration(fontConfiguration);
  const ctx = { fontConfiguration: bridged, spriteContainer, atomOps: spriteContainer.atomOps(bridged) };
  return display.create(ctx, HorizontalAlignment.LEFT);
}

/**
 * The Twemoji artwork store a gantt `SkinParam` carries in its sprite registry (`parseGantt` puts it
 * there); `undefined` for any other skin param (no artwork wired).
 */
export function emojiStoreOf(skinParam: ISkinParam): InternalEmojiStore | undefined {
  return skinParam instanceof SkinParam ? skinParam.getSprites().emoji : undefined;
}

/**
 * `TextBlockKey#equals` compares the text and `FontConfiguration#equals`
 * (font, colours); this is that identity as a string.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:201-226
 */
function textBlockKey(text: string, fontConfiguration: FontConfiguration): string {
  const font = fontConfiguration.getFont();
  if (!(font instanceof UFont)) throw new Error('ClassCastException: FontConfiguration font is not a UFont');
  const color = fontConfiguration.getColor();
  if (!(color instanceof HColorSimple))
    throw new Error('ClassCastException: FontConfiguration color is not an HColorSimple');
  const face = font.getFontFace();
  return [
    text,
    font.getFontStack().getFullDefinition(),
    String(font.getSize()),
    String(face.cssWeight),
    String(face.italic),
    color.asString(),
  ].join('\u0000');
}

/**
 * TimeHeader -- the header/footer drawer of the timeline.
 *
 * `null` is `undefined`; the `getColor` overloads (java:90,94) are one method over
 * `TimePoint | DayOfWeek`; the inner `Pending` (java:283-297) is the {@link Pending} class below.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:70-299
 */
export abstract class TimeHeader {
  readonly #timeScale: TimeScale;

  protected readonly dayCalendar: DayCalendarData;
  protected readonly timeBounds: TimeBoundsData;
  protected readonly scaleConfig: TimeScaleConfigData;
  protected readonly timelineStyle: TimelineStyleData;
  protected readonly weekConfigData: WeekConfigData;

  readonly #cache = new Map<string, TextBlock>();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:80 */
  public constructor(
    timeScale: TimeScale,
    weekConfigData: WeekConfigData,
    dayCalendar: DayCalendarData,
    timeBounds: TimeBoundsData,
    scaleConfig: TimeScaleConfigData,
    timelineStyle: TimelineStyleData,
  ) {
    this.weekConfigData = weekConfigData;
    this.dayCalendar = dayCalendar;
    this.timeBounds = timeBounds;
    this.scaleConfig = scaleConfig;
    this.timelineStyle = timelineStyle;
    this.#timeScale = timeScale;
  }

  /** `getColor(TimePoint)` (java:90-92) and `getColor(DayOfWeek)` (java:94-96). */
  public getColor(wink: TimePoint | DayOfWeek): HColor | undefined {
    if (wink instanceof TimePoint) return this.dayCalendar.getDayColor(wink);
    return this.dayCalendar.getDayOfWeekColor(wink);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:98 */
  protected isBold(wink: LocalDate): boolean {
    return this.dayCalendar.hasSeparatorBefore(wink);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:102 */
  protected getMinDay(): LocalDate {
    return this.timeBounds.getMinDay();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:106 */
  protected getMaxDay(): LocalDate {
    return this.timeBounds.getMaxDay();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:110 */
  protected closedBackgroundColor(): HColor {
    return this.timelineStyle.getClosedBackgroundColor();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:114 */
  protected closedFontColor(): HColor {
    return this.timelineStyle.getClosedFontColor();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:118 */
  protected openFontColor(): HColor {
    return this.timelineStyle.getOpenFontColor();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:122 */
  protected getLineColor(): HColor {
    return this.timelineStyle.getLineColor();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:126 */
  public abstract getTimeHeaderHeight(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:128 */
  public abstract getTimeFooterHeight(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:130 */
  public abstract getFullHeaderHeight(stringBounder: StringBounder): number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:132 */
  public abstract drawTimeHeader(ug: UGraphic, totalHeightWithoutFooter: number): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:134 */
  public abstract drawTimeFooter(ug: UGraphic): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:136 */
  public getTimeScale(): TimeScale {
    return this.#timeScale;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:140 */
  protected drawHline(ug: UGraphic, y: number): void {
    const xmin = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.timeBounds.getMinDay()));
    const xmax = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.timeBounds.getMaxDay()).addDays(1));
    const hline = ULine.hline(xmax - xmin);
    applyForeColor(ug, this.getLineColor()).apply(UTranslate.dy(y)).draw(hline);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:147 */
  protected drawVline(ug: UGraphic, x: number, y1: number, y2: number): void {
    const vbar = ULine.vline(y2 - y1);
    ug.apply(new UTranslate(x, y1)).draw(vbar);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:152 */
  protected getFontConfiguration(font: UFont, bold: boolean, color: HColor): FontConfiguration {
    if (bold) font = font.withFontFace(UFontFace.bold());

    // `FontConfiguration.create(font, color, color, null)`: the null hyperlink stroke is only read for
    // hyperlinks, which a header text never carries; `UStroke.simple()` is the port's non-null stand-in.
    return FontConfiguration.create(font, color, color, UStroke.simple());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:159 */
  protected abstract isZeroOnDay(instant: TimePoint): boolean;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:161 */
  protected drawColorsBackground(ug: UGraphic, totalHeightWithoutFooter: number): void {
    const height = totalHeightWithoutFooter - this.getFullHeaderHeight(ug.getStringBounder());
    let pending: Pending | undefined;

    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      const x2 = this.getTimeScale().getPosition(wink) + this.getTimeScale().getWidth(wink);
      let back = this.getColor(wink);
      // Day of week should be stronger than period of time (back color).
      const backDoW = this.getColor(wink.toDayOfWeek());
      if (backDoW !== undefined) back = backDoW;

      if (back === undefined && this.isZeroOnDay(wink)) back = this.closedBackgroundColor();

      if (back === undefined) {
        if (pending !== undefined) pending.draw(ug, height);
        pending = undefined;
      } else {
        if (pending !== undefined && hColorEquals(pending.color, back) === false) {
          pending.draw(ug, height);
          pending = undefined;
        }
        if (pending === undefined) pending = this.newPending(back, x1, x2);
        else pending.x2 = x2;
      }
    }

    if (pending !== undefined) pending.draw(ug, height);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:230 */
  protected getTextBlockSLOW(text: string, fontConfiguration: FontConfiguration): TextBlock {
    const key = textBlockKey(text, fontConfiguration);
    let block = this.#cache.get(key);
    if (block === undefined) {
      block = createLeftTextBlock(Display.getWithNewlines(this.getPragma(), text), fontConfiguration);
      this.#cache.set(key, block);
    }
    return block;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:236 */
  protected getFontConfigurationSLOW(param: SName, bold: boolean, color: HColor): FontConfiguration {
    const font = this.timelineStyle.getFont(param);
    return this.getFontConfiguration(font, bold, color);
  }

  /** Upstream answers `null`; only the name-bearing formats dereference it. @see TimeHeader.java:241 */
  protected locale(): Locale | undefined {
    return undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:245 */
  protected printCentered(
    ug: UGraphic,
    hideIfTooBig: boolean,
    start: number,
    end: number,
    when: TimePoint,
    fc: FontConfiguration,
    ...format: TimePointFormat[]
  ): void {
    const available = end - start;
    for (let i = format.length - 1; i >= 0; i--) {
      // `locale()` is Java's possibly-null Locale; `TimePointFormat#format` dereferences it for the named formats.
      const text = this.getTextBlockSLOW((format[i] as TimePointFormat).format(when, this.locale() as Locale), fc);
      const width = text.calculateDimension(ug.getStringBounder()).getWidth();
      if ((i === 0 && hideIfTooBig === false) || width <= available) {
        const diff = Math.max(0, available - width);
        text.drawU(ug.apply(UTranslate.dx(start + diff / 2)));
        return;
      }
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:260 */
  protected drawRectangle(ug: UGraphic, height: number, x1: number, x2: number): void {
    if (height === 0) return;

    ug = ug.apply(new Fore(HColors.none()));
    ug = ug.apply(new UTranslate(x1, this.getFullHeaderHeight(ug.getStringBounder())));
    if (x2 > x1) ug.draw(URectangle.build(x2 - x1, height));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:270 */
  protected printVerticalSeparators(ug: UGraphic, totalHeightWithoutFooter: number): void {
    ug = this.timelineStyle.applyVerticalSeparatorStyle(ug);
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1))
      if (this.isBold(day))
        this.drawVline(
          ug,
          this.getTimeScale().getPosition(TimePoint.ofStartOfDay(day)),
          this.getFullHeaderHeight(ug.getStringBounder()),
          totalHeightWithoutFooter,
        );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:279 */
  protected getPragma(): Pragma {
    return Pragma.createEmpty();
  }

  /**
   * `new Pending(color, x1, x2)` of the Java inner class (java:283-297), which reads `drawRectangle` of
   * its enclosing header; `drawRectangle` is `protected`, so the header hands it over bound.
   */
  protected newPending(color: HColor, x1: number, x2: number): Pending {
    return new Pending(color, x1, x2, (ug, height, px1, px2) => {
      this.drawRectangle(ug, height, px1, px2);
    });
  }
}

/**
 * TimeHeader.Pending -- a run of equally coloured days awaiting its rectangle.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:283-297
 */
export class Pending {
  readonly x1: number;
  x2: number;
  readonly color: HColor;
  readonly #drawRectangle: (ug: UGraphic, height: number, x1: number, x2: number) => void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeader.java:288 */
  public constructor(
    color: HColor,
    x1: number,
    x2: number,
    drawRectangle: (ug: UGraphic, height: number, x1: number, x2: number) => void,
  ) {
    this.x1 = x1;
    this.x2 = x2;
    this.color = color;
    this.#drawRectangle = drawRectangle;
  }

  /** `drawRectangle(ug.apply(color.bg()), height, x1, x2)`. @see TimeHeader.java:294-296 */
  public draw(ug: UGraphic, height: number): void {
    this.#drawRectangle(ug.apply(new Back(paintOf(this.color))), height, this.x1, this.x2);
  }
}
