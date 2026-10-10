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
import { removeEmptyColumns } from './dispatch-multiline-body.js';

/** `CommandArrow3`'s executeArg (`CommandArrow3.java:110`): the single-line
 *  label goes through `Display.getWithNewlines` -- `\n` is a line break. */
export function singleLineArrowLabel(ctx: ParseContext, label: string): string {
  return parseWithNewlines(ctx.pragma, label)?.lines.join('\n') ?? '';
}

/** `CommandMultilines2#isValid` (`CommandMultilines2.java:98-107`) never
 *  tests the FIRST line against END, and tests the others TRIMMED
 *  (`Trim.BOTH`, `CommandArrowLong3.java:64`; `CommandMultilines2.java:105`)
 *  -- the trim decides the close only. The content (`executeNow`,
 *  `CommandArrowLong3.java:100-116`) is the RAW block: `removeEmptyColumns`
 *  strips only the shared indentation (`BlocLines.java:234-248`),
 *  `removeStartingAndEnding(LABEL, 1)` swaps the opener for LABEL and drops
 *  the last line's final character (`BlocLines.java:271-283`), and
 *  `toDisplay` is `Display.createFoo` -- no `\n` conversion. A
 *  continuation line's leading spaces therefore stay in the label
 *  (isw-T2-act F2). `null` when no later line closes the block. */
export function tryArrowLong(ctx: ParseContext, idx: number, line: string): DispatchResult | null {
  const head = RE_ARROW_LONG.exec(line);
  if (head === null) return null;
  for (let i = idx + 1; i < ctx.lines.length; i++) {
    if (!RE_ARROW_LONG_END.test(ctx.lines[i]!.trim())) continue;
    const block = removeEmptyColumns(ctx.lines.slice(idx, i + 1));
    block[0] = head[2]!;
    block[block.length - 1] = block[block.length - 1]!.slice(0, -1);
    const style = head[1];
    const node: ActivityArrowLabel = {
      kind: 'arrow-label',
      label: block.join('\n'),
      ...(style !== undefined ? { style } : {}),
      ...swimlaneSpread(ctx),
    };
    return { idx: i + 1, node };
  }
  return null;
}
