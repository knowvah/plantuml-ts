/**
 * The post-parse `skinparam ResponseMessageBelowArrow` pass: upstream hands
 * `param.responseMessageBelowArrow()` to every `ComponentRoseArrow` as
 * `belowForResponse` (`Rose.java:339-340`), read when the tile builds its
 * component, i.e. after the whole parse.
 *
 * `SkinParam#isTrue` is `"true".equalsIgnoreCase(getValue(key))`
 * (`SkinParam.java:347-353`); `getValue` is the legacy store's, whose first
 * read fixes the answer (`sequence-skin-param.ts#SequenceLegacyParams`).
 */
import type { MessageEvent, SequenceDiagramAST, SequenceEvent } from './ast.js';
import type { SequenceLegacyParams } from './sequence-skin-param.js';

/** The `params` key, lower-case as `isTrue("responsemessagebelowarrow")`
 *  (`SkinParam.java:1185-1187`). */
const RESPONSE_BELOW_KEY = 'responsemessagebelowarrow';

function markMessages(events: readonly SequenceEvent[]): void {
  for (const event of events) {
    if (event.kind === 'message') event.belowForResponse = true;
    else if (event.kind === 'frame') for (const branch of event.branches) markMessages(branch);
  }
}

/** Flag every message `belowForResponse` when the skin parameter is on. */
export function applyResponseMessageBelowArrow(ast: SequenceDiagramAST, params: SequenceLegacyParams): void {
  if (params.getValue(RESPONSE_BELOW_KEY)?.toLowerCase() !== 'true') return;
  markMessages(ast.events);
}

/**
 * `isBelowForResponse` (`ComponentRoseArrow.java:195-197`): `belowForResponse
 * && getArrowConfiguration().isReverseDefine()`. Only the flat component has
 * it; `ComponentRoseSelfArrow` has no such parameter.
 */
export function isBelowForResponse(event: MessageEvent): boolean {
  return event.belowForResponse === true && event.arrow.reverseDefine === true && event.from !== event.to;
}

/**
 * The y `messageLabelBlock` hangs its block from. It places the block one
 * `getTextHeight` above the arrow (`posArrow = getTextHeight`, `yText = 0`,
 * `ComponentRoseArrow.java:147-148`); a below-the-arrow response has
 * `posArrow = 0` and `yText = getOldPaddingY()` (`:143-145`), so the block
 * top is `getOldPaddingY()` BELOW the arrow -- the anchor that puts it there
 * is the arrow plus that padding plus the `getTextHeight` the block
 * subtracts. `getOldPaddingY` is the padding's top (`AbstractTextualComponent
 * .java:124-126`), and `getTextHeight` the block plus top and bottom
 * (`:110-114`); both paddings are `oldPaddingY` (`topRightBottomLeft(1, 7, 1,
 * 7)`, `AbstractComponentRoseArrow.java:62`).
 */
export function belowLabelAnchorY(event: MessageEvent, arrowY: number, blockH: number, oldPaddingY: number): number {
  if (!isBelowForResponse(event)) return arrowY;
  return arrowY + oldPaddingY + blockH + 2 * oldPaddingY;
}
