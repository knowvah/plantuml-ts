/**
 * dispatch-multiline-body -- the BlocLines half of upstream's multi-line
 * activity command (`CommandActivityLong3#executeNow`,
 * `activitydiagram3/command/CommandActivityLong3.java:120-142`). Split out of
 * `node-dispatch.ts` (500-line cap).
 *
 * Upstream collects the block UNTRIMMED (`Trim.NONE`, `:69`), then:
 *  1. `lines.removeEmptyColumns()` (`:121`, `BlocLines.java:234-264`) strips
 *     the leading whitespace columns EVERY non-empty line shares, opener
 *     included;
 *  2. `removeStartingAndEnding(DATA, 0)` (`:139`) replaces the opener with
 *     the text after its `:`;
 *  3. `overrideLastLine(TEXT)` (`:140`) replaces the closer with the text
 *     before its `;` -- the END regex's `(.*)` (`:61`), untrimmed, kept even
 *     when empty;
 *  4. `Display.createFoo` (`klimt/creole/Display.java:185-198`) drops that
 *     last line only when it is empty AND follows a `}}`.
 * Middle lines -- blank ones included -- are kept verbatim.
 */
import { RE_ACTION_CLOSE, type ParseContext } from './dispatch-support.js';

/** `{{`/`}}` -- `EmbeddedDiagram.EMBEDDED_START`/`_END` (`EmbeddedDiagram.java:73-74`). */
const EMBEDDED_START = '{{';
const EMBEDDED_END = '}}';

/** `BlocLines#firstColumnRemovable` (`BlocLines.java:250-264`). */
function firstColumnRemovable(data: readonly string[]): boolean {
  let allEmpty = true;
  for (const s of data) {
    if (s.length === 0) continue;
    allEmpty = false;
    if (s[0] !== ' ' && s[0] !== '\t') return false;
  }
  return !allEmpty;
}

/** `BlocLines#removeEmptyColumns` (`BlocLines.java:234-248`). */
export function removeEmptyColumns(lines: readonly string[]): string[] {
  let copy = [...lines];
  while (firstColumnRemovable(copy)) copy = copy.map((s) => (s.length > 0 ? s.slice(1) : s));
  return copy;
}

export interface MultilineActionBody {
  cursor: number;
  labelParts: string[];
  multiStereo: string | undefined;
}

/** The block's closing line index (or `lines.length`): the first line,
 *  outside any `{{ }}` span, matching `RE_ACTION_CLOSE` (D6: `;` inside a
 *  nested diagram belongs to that diagram's grammar). */
function findCloseIndex(lines: readonly string[], startIdx: number): number {
  let braceDepth = 0;
  for (let i = startIdx; i < lines.length; i++) {
    const inner = lines[i]!.trim();
    if (inner.startsWith(EMBEDDED_START)) braceDepth++;
    if (braceDepth === 0 && RE_ACTION_CLOSE.test(inner)) return i;
    if (inner === EMBEDDED_END) braceDepth--;
  }
  return lines.length;
}

/** Steps 3-4 of the module doc: the closer's own TEXT, or nothing. */
function closingText(closer: string, previous: string | undefined): { text?: string; stereo?: string } {
  const m = RE_ACTION_CLOSE.exec(closer.trimEnd())!;
  const stereo = m[2]?.trim().toLowerCase();
  const text = m[1]!;
  const dropped = text === '' && previous?.trim() === EMBEDDED_END;
  return { ...(dropped ? {} : { text }), ...(stereo !== undefined ? { stereo } : {}) };
}

/**
 * Consumes body lines of a multiline action until its closing `;`
 * (optionally followed by `<<stereo>>`), or end-of-input, appending them to
 * `labelParts` after the caller's own first-line text. Exported: also
 * `list-backward-dispatch.ts#tryBackward`'s multiline form reuses it
 * (`CommandBackwardLong3.java:109-117` runs the same BlocLines steps).
 * @see net/sourceforge/plantuml/activitydiagram3/command/CommandActivityLong3.java:120-142
 */
export function readMultilineActionBody(
  ctx: ParseContext,
  startIdx: number,
  labelParts: string[],
): MultilineActionBody {
  const { lines } = ctx;
  const closeIdx = findCloseIndex(lines, startIdx);
  const end = Math.min(closeIdx + 1, lines.length);
  // The opener (`startIdx - 1`) takes part in the column count (step 1).
  const block = removeEmptyColumns(lines.slice(startIdx - 1, end));
  const closed = closeIdx < lines.length;
  const middle = block.slice(1, closed ? -1 : undefined);
  labelParts.push(...middle);
  let multiStereo: string | undefined;
  if (closed) {
    // `createFoo`'s `tmp.size() > 2` guard: the label already holds >= 2 lines.
    const previous = labelParts.length >= 2 ? labelParts[labelParts.length - 1] : undefined;
    const { text, stereo } = closingText(block[block.length - 1]!, previous);
    if (text !== undefined) labelParts.push(text);
    multiStereo = stereo;
  }
  return { cursor: end, labelParts, multiStereo };
}
