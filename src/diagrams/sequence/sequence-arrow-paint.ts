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
import { UStroke } from '../../core/klimt/UStroke.js';
import { Stereotype } from '../../core/stereo/Stereotype.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
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

/** `paint` with its `dash` replaced, every other read still lazy (`paintOf`'s contract). */
function withDash(paint: SequencePaint, dash: SequencePaint['dash']): SequencePaint {
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
      return paint.font;
    },
    get shadowing() {
      return paint.shadowing;
    },
    get align() {
      return paint.align;
    },
  };
}

/**
 * A message's paint: its merged arrow style, with {@link SequencePaint.dash}
 * the dash its shaft is drawn with (see the module header).
 *
 * `stereotype` is the `<<...>>` run as written (`ast.ts#AbstractMessageEvent
 * .stereotype`), built as `CommandArrow.java:411-414` builds it. The arrow's
 * own `[#color]` (`AbstractMessage.java:69-70`) is not passed: the parser
 * does not carry it yet (`command-arrow.ts#applyStyle`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/AbstractMessage.java:67-78
 */
export function messagePaint(
  builder: StyleBuilder,
  stereotype: string | undefined,
  arrow: ArrowConfiguration,
  self: boolean,
): SequencePaint {
  const style = messageStyle(builder, Stereotype.build(stereotype));
  const dash = shaftStroke(style, arrow.dashed, self).getDasharraySvg();
  return withDash(paintOf(style, HColorSet.instance()), dash);
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
