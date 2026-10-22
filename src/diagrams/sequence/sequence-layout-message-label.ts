/**
 * A message's label block: where `ComponentRoseArrow#drawInternalU` puts it
 * (`textPos`, alignment per `Rose#createComponentArrow`), split out of
 * `sequence-layout-message.ts` to keep that file under the size cap.
 */
import type { MessageEvent } from './ast.js';
import type { EventProcessingContext } from './sequence-layout-events.js';
import { ARROW_PADDING_X } from './sequence-layout-shared.js';
import { selfLabelLeft, type MessageEndpoints } from './sequence-layout-message-self.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { arrowDirectionOf, labelTextPos, messagePosition } from './sequence-arrow-paint.js';
import { ARROW_LABEL_PADDING_X1, messageLabelWidth, numberTextOf } from './text-block-geo.js';

/**
 * The left edge of a message's label block.
 *
 * Upstream's default `messagePosition` is LEFT, and its component is drawn
 * translated to the arrow's own start, so the label sits a fixed padding right
 * of where the line begins:
 *
 * ```java
 * textPos = getOldPaddingX1()
 *     + (direction2 == ArrowDirection.RIGHT_TO_LEFT_REVERSE || direction2 == ArrowDirection.BOTH_DIRECTION
 *             ? getArrowDeltaX()
 *             : 0);
 * ```
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseArrow.java:164-179
 *
 * The clearance term asks whether there is a HEAD at the arrow's LEFT end, so
 * the text can be pushed clear of it. Upstream phrases that as a direction —
 * RIGHT_TO_LEFT_REVERSE when `dressing1` has a head and `dressing2` does not,
 * BOTH_DIRECTION when both do (`ArrowConfiguration.java:181-192`) — because
 * upstream keeps every arrow left-to-right in coordinates and encodes the
 * message's direction in WHICH DRESSING carries the head.
 *
 * This port encodes it the other way: `bob <- alice` comes out of the parser
 * with `dressing1.head = NONE`, `dressing2.head = NORMAL` and `fromX > toX`.
 * So the dressing sitting at the geometric left end is `dressing1` for a
 * rightward message and `dressing2` for a leftward one, and asking `dressing1`
 * directly would silently never fire. Jar-verified on `bosedo-77-loge384`,
 * whose three messages are two rightward and one leftward: the jar puts the
 * two rightward labels at `28.681 + 7` and the leftward one at `28.681 + 17`.
 *
 * A SELF message takes the padding alone —
 * `ComponentRoseSelfArrow#drawInternalU:88` is
 * `getTextBlock().drawU(ug.apply(UTranslate.dx(getOldPaddingX1())))`, with no
 * clearance term at all.
 */
export function labelLeftOf(
  event: MessageEvent,
  endpoints: MessageEndpoints,
  paint: SequencePaint,
  ctx: EventProcessingContext,
): number {
  if (endpoints.arrowDirection === 'self') return selfLabelLeft(endpoints);
  // The component spans the arrow, so its origin is the LEFTMOST end whichever
  // way the message runs. `fromX`/`toX` are that origin, not the drawn line:
  // the renderer applies upstream's own `start += getArrowDeltaX() / 2` shift
  // for a FULL NORMAL head (`ComponentRoseArrow.java:129-133`) itself.
  const start = Math.min(endpoints.fromX, endpoints.toX);
  const dir = arrowDirectionOf(event.arrow, endpoints.arrowDirection === 'left');
  // `Area.create(x2 - x1, ...)` (`CommunicationTile.java:354,369`): the
  // component's width is the distance between the two ends.
  const textPos = labelTextPos({
    position: messagePosition(event.styleBuilder, dir, event.arrow.reverseDefine === true),
    dir,
    width: Math.abs(endpoints.toX - endpoints.fromX),
    textDeltaX: 0,
    textWidth: messageLabelWidth(event.label, numberTextOf(event), paint.font, ctx, paint.wrapWidth),
    padX1: ARROW_LABEL_PADDING_X1,
    padX2: ARROW_PADDING_X,
  });
  return start + textPos;
}
