/**
 * The message arrow's style (sdd1 T2c): the merged `arrow` style every
 * message, self message and exo message strokes from, and the stroke
 * `ArrowConfiguration` applies to its shaft.
 *
 * Upstream merges the style per message — `getUsedStyles`
 * (`sequencediagram/AbstractMessage.java:67-73`) over the builder captured
 * at the command (`:89-97`) and the stereotype `CommandArrow` sets after
 * construction (`CommandArrow.java:411-414`) — and every teoz tile hands it
 * to `Rose#createComponentArrow` (`CommunicationTile.java:163,176`,
 * `CommunicationExoTile.java:107`, `CommunicationTileSelf.java:106`). The
 * component reads off it, in its constructor
 * (`skin/rose/AbstractComponentRoseArrow.java:65-68`):
 * - `getColorLine()` → `LineColor` (`skin/AbstractComponent.java:101-103`):
 *   the shaft, every head's stroke and the polygon's fill;
 * - `getColorBackGround()` → `BackGroundColor` (`:105-107`): the `o` fill;
 * - `getStroke()` → `LineThickness`/`LineStyle` (`:117-119`,
 *   `style/Style.java:299-320`): the shaft, and through
 *   `arrowConfiguration.withThickness(stroke.getThickness())` every
 *   `applyThicknessOnly` head and the self loop.
 *
 * The shaft's stroke depends on the component as well as the style, so it is
 * resolved here, where the arrow configuration and the full `UStroke` are
 * both in hand, and carried as {@link SequencePaint.dash}: a flat or exo arrow
 * applies `applyStroke(ug, style)` (`ComponentRoseArrow.java:158-162`), a self
 * arrow the deprecated `applyStroke(ug)` (`ComponentRoseSelfArrow.java:81`).
 * `SequencePaint.dash` alone cannot tell the two apart: the dotted exception
 * keys on BOTH dash lengths being 0 (`ArrowConfiguration.java:248`), and
 * `getDasharraySvg` drops the space when the visible part is 0.
 */
import { Colors } from '../../core/abel/Colors.js';
import { ColorType } from '../../core/abel/ColorType.js';
import { ColorMapper, toSvgPaint } from '../../core/klimt/color/ColorMapper.js';
import { HColorAutomagic } from '../../core/klimt/color/HColorAutomagic.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSet, parseConditionalColor, resolveConditionalColor } from '../../core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { HColor } from '../../core/style/Value.js';
import type { MessageGeo } from './geo-message.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import {
  createSequenceStyleDispatch,
  currentStyleBuilder,
  messageStyle,
  paintOf,
  type SequencePaint,
} from './sequence-skin-param.js';

/** `new UStroke(2, 2, thickness)`: a dotted body's dash. @see skin/ArrowConfiguration.java:249,257 */
const DOTTED_DASH = 2;

/**
 * `ArrowConfiguration#applyStroke(UGraphic, Style)` — the style's stroke,
 * except that a dotted body whose style draws no dash dots at 2,2.
 *
 * ```java
 * if (isDotted() && stroke.getDashVisible() == 0 && stroke.getDashSpace() == 0)
 *     return ug.apply(new UStroke(2, 2, stroke.getThickness()));
 * return ug.apply(stroke);
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/ArrowConfiguration.java:244-252
 */
export function applyStroke(stroke: UStroke, dotted: boolean): UStroke {
  if (dotted && stroke.getDashVisible() === 0 && stroke.getDashSpace() === 0)
    return new UStroke(DOTTED_DASH, DOTTED_DASH, stroke.getThickness());
  return stroke;
}

/**
 * The deprecated `ArrowConfiguration#applyStroke(UGraphic)` the self arrow
 * still calls: the configuration's thickness only — the style's `LineStyle`
 * never reaches a self loop — dotted at 2,2.
 *
 * ```java
 * if (isDotted())
 *     return ug.apply(new UStroke(2, 2, thickness));
 * return ug.apply(UStroke.withThickness(thickness));
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/ArrowConfiguration.java:254-260
 */
export function applyStrokeDeprecated(thickness: number, dotted: boolean): UStroke {
  if (dotted) return new UStroke(DOTTED_DASH, DOTTED_DASH, thickness);
  return UStroke.withThickness(thickness);
}

/**
 * The shaft's stroke. `thickness` is the style's in both branches: the self
 * component's `thickness` field is `withThickness(stroke.getThickness())`
 * (`AbstractComponentRoseArrow.java:67-68`).
 */
function shaftStroke(style: Style, dotted: boolean, self: boolean): UStroke {
  const stroke = style.getStroke();
  return self ? applyStrokeDeprecated(stroke.getThickness(), dotted) : applyStroke(stroke, dotted);
}

/** `paint` with its `dash` and `font` replaced, every other read still lazy
 *  (`paintOf`'s contract). */
function withDashAndFont(
  paint: SequencePaint,
  dash: SequencePaint['dash'],
  font: () => FontConfiguration,
): SequencePaint {
  return {
    get stroke() {
      return paint.stroke;
    },
    get thickness() {
      return paint.thickness;
    },
    dash,
    get fill() {
      return paint.fill;
    },
    get roundCorner() {
      return paint.roundCorner;
    },
    get diagonalCorner() {
      return paint.diagonalCorner;
    },
    get padding() {
      return paint.padding;
    },
    get margin() {
      return paint.margin;
    },
    get font() {
      return font();
    },
    get shadowing() {
      return paint.shadowing;
    },
    get align() {
      return paint.align;
    },
  };
}

/** A back colour's simple part: a gradient answers for its first colour
 *  (`HColorGradient#opposite`, `HColorGradient.java:108-110`). */
function simpleBack(back: HColor): HColorSimple {
  const base = back instanceof HColorGradient ? back.getColor1() : back;
  if (!(base instanceof HColorSimple)) throw new Error('UnsupportedOperationException: HColor#opposite');
  return base;
}

/**
 * The colour a context-dependent `FontColor` is drawn in, or `undefined` for
 * a plain one (`HColor#getAppropriateColor`, `HColor.java:121-123`):
 * `#?light:dark[:transparent]` is `HColorScheme#getAppropriateColor(back)`
 * (`HColorScheme.java:50-60`), resolved at the string level
 * (`HColorSet.ts#resolveConditionalColor`; the `HColorScheme` class is not
 * ported, so `asColor` would throw); `automatic` is `back.opposite()`
 * (`HColorAutomagic.java:38-41`). The same reads
 * `sequence-participant-paints.ts#appropriateTextColor` makes for a head.
 */
function appropriateTextColor(style: Style, back: () => HColor): HColor | undefined {
  const raw = style.value('FontColor').asString() ?? '';
  const spec = raw.startsWith('#') ? raw : `#${raw}`;
  if (parseConditionalColor(spec) !== undefined) {
    const backHex = toSvgPaint(simpleBack(back()), ColorMapper.IDENTITY) as string;
    return HColorSet.instance().getColor(resolveConditionalColor(spec, backHex)!);
  }
  if (!(style.value('FontColor').asColor(HColorSet.instance()) instanceof HColorAutomagic)) return undefined;
  return simpleBack(back()).opposite();
}

/**
 * The label's font: the arrow style's `getFontConfiguration` with its colour
 * as `AtomText#drawU` draws it -- `fontConfiguration.adjustColorForBackground
 * (ug)` (`AtomText.java:205`, `FontConfiguration.java:349-356`). The arrow
 * component draws its text block on a `ug` with no back colour
 * (`ComponentRoseArrow.java:179`, `ComponentRoseSelfArrow.java:88`), so the
 * back is `ug.getDefaultBackground()`: the document style's
 * `BackGroundColor` (`TitledDiagram.java:280-289`), merged from the
 * message's own builder. Jar-verified on `duzico-51-misi485` (`#?black:
 * white` over darkblue draws the label `#FFF`).
 */
function labelFont(style: Style, builder: StyleBuilder): FontConfiguration {
  const back = (): HColor =>
    StyleSignatureBasic.of('root', 'document', 'sequenceDiagram')
      .getMergedStyle(builder)!
      .value('BackGroundColor')
      .asColor(HColorSet.instance());
  const color = appropriateTextColor(style, back);
  const drawn = color === undefined ? style : style.eventuallyOverride(Colors.empty().add(ColorType.TEXT, color));
  return paintOf(drawn, HColorSet.instance()).font;
}

/**
 * A message's paint: its merged arrow style, with {@link SequencePaint.dash}
 * the dash its shaft is drawn with (see the module header).
 *
 * `stereotype` is the `<<...>>` run as written (`ast.ts#AbstractMessageEvent
 * .stereotype`), built as `CommandArrow.java:411-414` builds it. The arrow's
 * own `[#color]` overrides the style's `LineColor`
 * (`arrowConfiguration.getColor()`, `AbstractMessage.java:69-70`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/AbstractMessage.java:67-78
 */
export function messagePaint(
  builder: StyleBuilder,
  stereotype: string | undefined,
  arrow: ArrowConfiguration,
  self: boolean,
): SequencePaint {
  const style = messageStyle(builder, Stereotype.build(stereotype), arrow.color);
  const dash = shaftStroke(style, arrow.dashed, self).getDasharraySvg();
  return withDashAndFont(paintOf(style, HColorSet.instance()), dash, () => labelFont(style, builder));
}

/**
 * The default skin's builder, built once on first use. Read-only after
 * construction: nothing executes a declaration against it.
 */
let defaultBuilder: StyleBuilder | undefined;

function defaultStyleBuilder(): StyleBuilder {
  defaultBuilder ??= currentStyleBuilder(createSequenceStyleDispatch({ lines: [], type: 'sequence' }));
  return defaultBuilder;
}

/**
 * The paint a message geometry draws with. Layout always sets it
 * (`sequence-layout-message.ts`, `sequence-layout-exo.ts`); a hand-authored
 * geometry that predates the field resolves the same style against the
 * default skin, as `MessageGeo.selfReturnX`'s fallback does for its own field.
 */
export function messagePaintOf(msg: MessageGeo): SequencePaint {
  return msg.paint ?? messagePaint(defaultStyleBuilder(), msg.stereotype, msg.arrow, msg.arrowDirection === 'self');
}

/**
 * The default skin's message-label font: `arrow` merged over `root`
 * (`plantuml.skin:316-317` `FontSize 13`, `:9` `FontColor`), as
 * `style.getFontConfiguration(set)` builds it (`AbstractComponent.java:
 * 129-131`). Layout always passes the message's own paint font to
 * `text-block-geo.ts#messageLabelBlock`; this is the fallback for a block
 * built with no message in hand, as {@link messagePaintOf}'s is for a
 * geometry.
 */
export function defaultMessageFont(): FontConfiguration {
  return labelFont(messageStyle(defaultStyleBuilder()), defaultStyleBuilder());
}
