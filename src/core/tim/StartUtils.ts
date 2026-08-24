/**
 * The two directive probes `DiagramExtractor` needs: is this line a
 * `@start...` / `@end...` (or the backslash spelling, `\startuml`)?
 *
 * Scope guard: upstream's `StartUtils` is a 200-line grab-bag. Ported here are
 * the directive probes `DiagramExtractor` and `splitRawBlocks` need —
 * start/end, and the pause family (`@pause` / `@unpause` / `!exit` /
 * `@append`). `beforeStartUml`, the filename patterns and `@start` argument
 * parsing still have no caller and are not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/utils/StartUtils.java
 */

import { isJavaWhitespaceAt } from '../java-whitespace.js';

/** @see ~/git/plantuml/.../utils/StartUtils.java#isStartDirective */
export function isStartDirective(s: string): boolean {
  const n = s.length;
  let i = 0;
  while (i < n && isJavaWhitespaceAt(s, i)) i++;
  if (i >= n) return false;

  const c = s.charAt(i);
  if (c !== '@' && c !== '\\') return false;

  // need '@' + "start" + at least one char after
  return i + 6 < n && s.startsWith('start', i + 1);
}

/** @see ~/git/plantuml/.../utils/StartUtils.java#startsWithDirectiveKeyword */
function startsWithDirectiveKeyword(text: string, from: number, keyword: string): boolean {
  const n = text.length;
  let i = from;
  while (i < n) {
    const c = text.charAt(i);
    if (isJavaWhitespaceAt(text, i)) {
      i++;
      continue;
    }
    if (c !== '@' && c !== '\\') return false;

    const start = i + 1;
    if (start + keyword.length > n) return false;

    return text.startsWith(keyword, start);
  }
  return false;
}

/** @see ~/git/plantuml/.../utils/StartUtils.java#isEndDirective */
export function isEndDirective(s: string): boolean {
  return startsWithDirectiveKeyword(s, 0, 'end');
}

/** @see ~/git/plantuml/.../utils/StartUtils.java#isPauseDirective */
export function isPauseDirective(s: string): boolean {
  return startsWithDirectiveKeyword(s, 0, 'pause');
}

/** @see ~/git/plantuml/.../utils/StartUtils.java#isUnpauseDirective */
export function isUnpauseDirective(s: string): boolean {
  return startsWithDirectiveKeyword(s, 0, 'unpause');
}

/**
 * `!exit`, matched as EXACTLY five non-whitespace characters — upstream
 * compares the trimmed length to 5 and then the five chars one by one, so
 * `!exitnow` is not a match.
 * @see ~/git/plantuml/.../utils/StartUtils.java#isExit
 */
export function isExit(s: string): boolean {
  const len = s.length;
  let start = 0;
  let end = len - 1;
  while (start < len && isJavaWhitespaceAt(s, start)) start++;
  while (end >= start && isJavaWhitespaceAt(s, end)) end--;
  if (end - start + 1 !== 5) return false;
  return s.startsWith('!exit', start);
}

/**
 * While paused, a line of the form `@append <text>` (or `@a`, or the
 * backslash spelling) still contributes `<text>` to the block. Returns the
 * remainder, trimmed, or `undefined` when the line is not an append.
 * @see ~/git/plantuml/.../utils/StartUtils.java#getPossibleAppend
 */
const APPEND_RE = /^\W*[@\\](append|a)\b/;

export function possibleAppend(s: string): string | undefined {
  const m = APPEND_RE.exec(s);
  return m === null ? undefined : s.slice(m[0].length).trim();
}
