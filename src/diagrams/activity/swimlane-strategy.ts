/**
 * Upstream's one-way swimlane gate: the first thing added to the diagram
 * decides whether lanes are still legal.
 *
 * - `manageSwimlaneStrategy()` (called by every instruction-adding method)
 *   turns a still-unset strategy into `SWIMLANE_FORBIDDEN`.
 * - `swimlane(...)` turns an unset strategy into `SWIMLANE_ALLOWED`, and
 *   returns `error("This swimlane must be defined at the start of the
 *   diagram.")` when it is `SWIMLANE_FORBIDDEN`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:69-95
 *
 * Callers of `manageSwimlaneStrategy` (the "first instruction" events):
 * addActivity :114, addSpot :136, start :154, stop :160, end :169,
 * breakInstruction :195, fork :217, startSwitch :276, startIf :308,
 * startRepeat :352, repeatWhile :363, backward :379, doWhile :396,
 * startGroup :422 (same file). `split`, `kill`, `detach`, notes, labels and
 * arrows do not call it.
 */

import { refuse, type ParseRefusal } from '../../core/parse-refusal.js';
import type { LineHandler, ParseContext } from './dispatch-support.js';

/** `ActivityDiagram3.SwimlaneStrategy` (`ActivityDiagram3.java:69`). */
export const SwimlaneStrategy = {
  FORBIDDEN: 'SWIMLANE_FORBIDDEN',
  ALLOWED: 'SWIMLANE_ALLOWED',
} as const;
export type SwimlaneStrategy = (typeof SwimlaneStrategy)[keyof typeof SwimlaneStrategy];

/** `ActivityDiagram3.java:91`. */
export const SWIMLANE_AT_START_MESSAGE = 'This swimlane must be defined at the start of the diagram.';

/** Bare keywords whose method calls `manageSwimlaneStrategy` (`start`,
 *  `stop`, `end`, `break`); `kill` and `detach` do not. */
const INSTRUCTION_KEYWORDS: ReadonlySet<string> = new Set(['start', 'stop', 'end', 'break']);

/** `manageSwimlaneStrategy` (`ActivityDiagram3.java:80-83`). */
export function manageSwimlaneStrategy(ctx: ParseContext): void {
  ctx.swimlaneStrategy ??= SwimlaneStrategy.FORBIDDEN;
}

/** `swimlane(...)`'s gate (`ActivityDiagram3.java:86-91`): a refusal at
 *  `idx`, or `null` when the lane may be declared. */
export function enterSwimlane(ctx: ParseContext, idx: number): ParseRefusal | null {
  ctx.swimlaneStrategy ??= SwimlaneStrategy.ALLOWED;
  return ctx.swimlaneStrategy === SwimlaneStrategy.FORBIDDEN
    ? refuse('execution', idx, idx, SWIMLANE_AT_START_MESSAGE)
    : null;
}

/** Whether the line's handler is one whose upstream method calls
 *  `manageSwimlaneStrategy`. `lc` disambiguates the shared keyword handler. */
export function isInstructionHandler(
  handler: LineHandler,
  lc: string,
  instructionHandlers: ReadonlySet<LineHandler>,
  keywordHandler: LineHandler,
): boolean {
  return handler === keywordHandler ? INSTRUCTION_KEYWORDS.has(lc) : instructionHandlers.has(handler);
}
