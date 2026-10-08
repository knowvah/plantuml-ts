/**
 * dispatch-arrow-long -- `CommandArrowLong3`, the multi-line arrow label:
 * `->` (or `-[#red]->`) followed by label text with NO closing `;` on that
 * line opens a block that ends at the first later line ending in `;`.
 * `CommandArrow3` (`-> label;`) is tried first, so this only sees lines it
 * rejected.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandArrowLong3.java:56-111
 */
import { parseWithNewlines } from '../../core/klimt/creole/DisplayNewlines.js';
import type { ActivityArrowLabel } from './ast.js';
import { RE_ARROW_LONG, RE_ARROW_LONG_END, type DispatchResult, type ParseContext } from './dispatch-support.js';
import { swimlaneSpread } from './dispatch-support.js';

/** `CommandArrow3`'s executeArg (`CommandArrow3.java:110`): the single-line
 *  label goes through `Display.getWithNewlines` -- `\n` is a line break. */
export function singleLineArrowLabel(ctx: ParseContext, label: string): string {
  return parseWithNewlines(ctx.pragma, label)?.lines.join('\n') ?? '';
}

/** `CommandMultilines2#isValid` (`CommandMultilines2.java:98-107`) never
 *  tests the FIRST line against END; `Trim.BOTH` trims every line
 *  (`CommandArrowLong3.java:61`); `removeStartingAndEnding(LABEL, 1)`
 *  (`:100`) swaps the opener for LABEL and drops the closer's `;`;
 *  `toDisplay` (`:101`) is `Display.createFoo` -- no `\n` conversion.
 *  `null` when no later line closes the block. */
export function tryArrowLong(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const head = RE_ARROW_LONG.exec(line);
  if (head === null) return null;
  const parts: string[] = [head[2]!];
  for (let i = idx + 1; i < ctx.lines.length; i++) {
    const inner = ctx.lines[i]!.trim();
    const end = RE_ARROW_LONG_END.exec(inner);
    if (end === null) {
      parts.push(inner);
      continue;
    }
    parts.push(end[1]!);
    const style = head[1];
    const node: ActivityArrowLabel = {
      kind: 'arrow-label',
      label: parts.join('\n'),
      ...(style !== undefined ? { style } : {}),
      ...swimlaneSpread(ctx),
    };
    return { idx: i + 1, node };
  }
  return null;
}
