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
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { HColor } from '../../core/style/Value.js';
import type { MessageGeo } from './geo-message.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { ARROW_DELTA_X, type ArrowConfiguration, type ArrowDressing } from './sequence-arrowhead.js';
import {
  createSequenceStyleDispatch,
  currentStyleBuilder,
  messageStyle,
  paintOf,
  type SequencePaint,
} from './sequence-skin-param.js';
import { withTextColorFor } from './sequence-participant-paints.js';

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
    get wrapWidth() {
      return paint.wrapWidth;
    },
  };
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
export function labelFont(style: Style, builder: StyleBuilder): FontConfiguration {
  const back = (): HColor =>
    StyleSignatureBasic.of('root', 'document', 'sequenceDiagram')
      .getMergedStyle(builder)!
      .value('BackGroundColor')
      .asColor(HColorSet.instance());
  return paintOf(withTextColorFor(style, back), HColorSet.instance()).font;
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

/** `ArrowDirection` for a non-self arrow. @see skin/ArrowDirection.java */
export type ArrowDirectionKind = 'LEFT_TO_RIGHT_NORMAL' | 'RIGHT_TO_LEFT_REVERSE' | 'BOTH_DIRECTION';

/**
 * `ArrowConfiguration#getArrowDirection` (non-self branch), read off the
 * dressings at the arrow's geometric LEFT and RIGHT ends.
 *
 * Upstream keeps `dressing1` at the left end of the component (the tile
 * `reverse()`s the configuration for a right-to-left message,
 * `CommunicationTile.java:157-159`). This port keeps the message's own
 * order -- `dressing1` is the SENDER's -- so the geometric left end is
 * `dressing2` for a leftward message (see `labelLeftOf`'s history).
 * @see skin/ArrowConfiguration.java:181-192
 */
export function arrowDirectionOf(arrow: ArrowConfiguration, leftward: boolean): ArrowDirectionKind {
  const [left, right]: [ArrowDressing, ArrowDressing] = leftward
    ? [arrow.dressing2, arrow.dressing1]
    : [arrow.dressing1, arrow.dressing2];
  if (left.head === 'NONE' && right.head !== 'NONE') return 'LEFT_TO_RIGHT_NORMAL';
  if (left.head !== 'NONE' && right.head === 'NONE') return 'RIGHT_TO_LEFT_REVERSE';
  return 'BOTH_DIRECTION';
}

/** `Rose.java:299-342`'s `first` branch. */
function firstPosition(dir: ArrowDirectionKind, reverseDefine: boolean): HorizontalAlignment {
  const flip = dir === 'RIGHT_TO_LEFT_REVERSE' ? !reverseDefine : reverseDefine;
  return flip ? HorizontalAlignment.RIGHT : HorizontalAlignment.LEFT;
}

/** `Rose.java:315-341`'s `direction` / `reversedirection` branches. */
function directional(dir: ArrowDirectionKind, reversed: boolean): HorizontalAlignment {
  if (dir === 'BOTH_DIRECTION') return HorizontalAlignment.CENTER;
  const rightwards = (dir === 'LEFT_TO_RIGHT_NORMAL') !== reversed;
  return rightwards ? HorizontalAlignment.LEFT : HorizontalAlignment.RIGHT;
}

/**
 * `messageHorizontalAlignment` of `Rose#createComponentArrow`: the merged
 * `root/element/sequenceDiagram/arrow` style's `HorizontalAlignment`, where
 * the strings `first`, `direction` and `reversedirection` resolve against the
 * arrow's direction and `reverseDefine`. `undefined` is upstream's `null`
 * (an unset alignment), which `ComponentRoseArrow` draws as LEFT.
 * @see skin/rose/Rose.java:299-342
 */
export function messagePosition(
  builder: StyleBuilder,
  dir: ArrowDirectionKind,
  reverseDefine: boolean,
): HorizontalAlignment | undefined {
  const style = StyleSignatureBasic.of('root', 'element', 'sequenceDiagram', 'arrow').getMergedStyle(builder);
  const value = style?.value('HorizontalAlignment');
  switch (value?.asString()?.toLowerCase()) {
    case 'first':
      return firstPosition(dir, reverseDefine);
    case 'direction':
      return directional(dir, false);
    case 'reversedirection':
      return directional(dir, true);
    default:
      return value?.asHorizontalAlignment();
  }
}

/** What {@link labelTextPos} places a label block against. */
export interface LabelPlacement {
  readonly position: HorizontalAlignment | undefined;
  readonly dir: ArrowDirectionKind;
  /** `area.getDimensionToUse().getWidth()`. */
  readonly width: number;
  /** `area.getTextDeltaX()`; 0 off an exo border. */
  readonly textDeltaX: number;
  /** `getTextBlock().calculateDimension().getWidth()`. */
  readonly textWidth: number;
  /** `getOldPaddingX1()` and `getOldPaddingX2()`. */
  readonly padX1: number;
  readonly padX2: number;
}

/**
 * `textPos` of `ComponentRoseArrow#drawInternalU`, WITHOUT the final
 * `Math.max(0, area.getTextDeltaX())` the caller adds.
 * @see skin/rose/ComponentRoseArrow.java:164-179
 */
export function labelTextPos(p: LabelPlacement): number {
  const delta = Math.abs(p.textDeltaX);
  if (p.position === HorizontalAlignment.CENTER) return (p.width - delta - p.textWidth) / 2;
  const arrowDeltaX = p.dir === 'LEFT_TO_RIGHT_NORMAL' ? ARROW_DELTA_X : 0;
  if (p.position === HorizontalAlignment.RIGHT) return p.width - delta - p.textWidth - p.padX2 - arrowDeltaX;
  return p.padX1 + (p.dir === 'LEFT_TO_RIGHT_NORMAL' ? 0 : ARROW_DELTA_X);
}
