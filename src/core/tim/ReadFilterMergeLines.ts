/**
 * Trailing-`\` line continuation: a source line ending in a bare `\` merges
 * with the NEXT physical line, before `@start`/`@end` block splitting or
 * command dispatch sees the document.
 *
 * Upstream is a `ReadLine` decorator pulled one line at a time
 * (`preproc2/ReadFilterMergeLines.java:48-88`). This port already has the
 * whole document read into an array (`ReadLineReader.ts`'s "browser-safe: no
 * streams" note applies equally here), so it is a single forward pass over
 * that array instead of a stream decorator.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc2/ReadFilterMergeLines.java
 */

import { isEndDirective, isStartDirective } from './StartUtils.js';
import { StringLocated } from './StringLocated.js';

/**
 * A single trailing `\` is a continuation marker; a literal `\\` (an escaped
 * backslash) is not.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/StringUtils.java:454-456
 */
function endsWithBackslash(s: string): boolean {
  return s.endsWith('\\') && !s.endsWith('\\\\');
}

/**
 * The `@start` line's diagram word, matched the same char-by-char way
 * `DiagramType#getTypes` (`core/DiagramType.java:94-232`) reads it -- so
 * `@startditaa(...)` still counts, trailing arguments included.
 */
const RE_START_WORD = /^\s*[@\\]start(\w+)/u;

/**
 * ditaa ASCII art uses a trailing `\` as a diagonal-line glyph, not a
 * continuation marker; continuation is suspended for the block's duration.
 * @see ~/git/plantuml/.../preproc2/ReadFilterMergeLines.java#isDitaa
 */
function isDitaaStart(line: string): boolean {
  return (RE_START_WORD.exec(line)?.[1]?.toLowerCase() ?? '').startsWith('ditaa');
}

/** @see ~/git/plantuml/.../text/StringLocated.java#mergeEndBackslash */
function mergeEndBackslash(current: StringLocated, next: StringLocated): StringLocated {
  const s = current.getString();
  return new StringLocated(
    s.slice(0, -1) + next.getString(),
    current.getLocation(),
    undefined,
    current.getPreprocessorError(),
  );
}

/**
 * Comment lines consumed while looking ahead for a continuation are dropped
 * entirely, and an inline comment is stripped from the line that is finally
 * merged in -- upstream reads the lookahead through a SEPARATE
 * `ReadFilterQuoteComment`-wrapped cursor over the same source
 * (`ReadFilterMergeLines.java:70-78`), so those comment lines never resurface
 * as output either.
 * @see ~/git/plantuml/.../preproc2/ReadFilterQuoteComment.java#readLine
 */
function nextUncommentedLine(
  lines: readonly StringLocated[],
  from: number,
): { line: StringLocated; index: number } | undefined {
  let longComment = false;
  for (let i = from; i < lines.length; i++) {
    const trim = lines[i]!.getString().replace(/\t/gu, ' ').trim();
    if (longComment) {
      if (trim.endsWith("'/")) longComment = false;
      continue;
    }
    if (trim.startsWith("'")) continue;
    if (trim.startsWith("/'")) {
      if (trim.endsWith("'/")) continue;
      if (!trim.includes("'/")) {
        longComment = true;
        continue;
      }
    }
    return { line: lines[i]!.removeInnerComment(), index: i + 1 };
  }
  return undefined;
}

/**
 * Merge every trailing-`\` line with the line(s) that follow it. The merged
 * line keeps the FIRST line's location (`mergeEndBackslash` above), so error
 * diagrams still cite the line a user would expect.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc2/ReadFilterMergeLines.java#applyFilter
 */
export function mergeEndingBackslashLines(lines: readonly StringLocated[]): StringLocated[] {
  const result: StringLocated[] = [];
  let manageEndingBackslash = true;
  let i = 0;
  while (i < lines.length) {
    const text = lines[i]!.getString();
    if (isStartDirective(text) && isDitaaStart(text)) manageEndingBackslash = false;
    if (isEndDirective(text)) manageEndingBackslash = true;

    let current = lines[i]!;
    i++;
    while (manageEndingBackslash && endsWithBackslash(current.getString())) {
      const next = nextUncommentedLine(lines, i);
      if (next === undefined) break;
      current = mergeEndBackslash(current, next.line);
      i = next.index;
    }
    result.push(current);
  }
  return result;
}
