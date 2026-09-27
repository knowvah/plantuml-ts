/**
 * The line list upstream's `UmlSource#seed()` walks -- `BlockUml#data` as
 * `PSystemBuilder#createPSystem` turns it into a `UmlSource`.
 *
 * Upstream builds it in three steps, each ported below as its own method:
 *
 * 1. `BlockUml`'s constructor (`BlockUml.java:150-155`): the TIM result list,
 *    then `Jaws.mutateExpands1(tmp)` -- {@link mutateExpandsBreakline}
 *    (`PARSE_NEW_MULTILINE_TRIPLE_MARKS` is `false`, `JawsFlags.java:41`, so
 *    `mergeTripleMarkBlocks` never runs).
 * 2. `PSystemBuilder#createPSystem` (`PSystemBuilder.java:232-240`):
 *    `UmlSource.createWithRaw(source, types.contains(SEQUENCE), rawSource)`
 *    -- {@link loadInternal}.
 * 3. the same method's `umlSource.patchBase64()` (`UmlSource.java:310-320`)
 *    -- {@link patchBase64Line} over every line; `seed()`'s cache is
 *    invalidated there, so the seed sees the patched lines.
 *
 * This port parses from its own `PreprocessorResult.lines` (skinparam and
 * `<style>` hoisted out, right-trimmed); this list exists only for the seed,
 * which is why it is a separate, un-hoisted, un-trimmed copy.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java
 */

import { DiagramType, findStartTypes } from './diagram-type-set.js';
import { BLOCK_E1_BREAKLINE } from './tim/builtin/jaws-constants.js';
import { endsWithBackslash } from './tim/ReadFilterMergeLines.js';
import { SignatureUtils } from './utils/SignatureUtils.js';

/** `AtomImg.DATA_IMAGE_PNG_BASE64` (`AtomImg.java:75`), as
 *  `UmlSource.BASE64_TAG_START` (`UmlSource.java:305`). */
const BASE64_TAG_START = 'data:image/png;base64,';
/** `UmlSource.BASE64_TAG_REPLACEMENT` (`UmlSource.java:306`). */
const BASE64_TAG_REPLACEMENT = 'data:image/png;md5,';
/** `UmlSource#isBase64Char` (`UmlSource.java:370-373`). */
const RE_BASE64_CHAR = /[A-Za-z0-9+/=]/;

/**
 * Split each line at every `BLOCK_E1_BREAKLINE` that is not inside a `{{...}}`
 * embedded block; the tail piece is always emitted, even when empty.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jaws/Jaws.java:65-120
 */
export function mutateExpandsBreakline(lines: readonly string[]): string[] {
  const result: string[] = [];
  for (const s of lines) {
    if (!s.includes(BLOCK_E1_BREAKLINE)) result.push(s);
    else result.push(...splitBreaklines(s));
  }
  return result;
}

/** The per-line body of {@link mutateExpandsBreakline} (`Jaws.java:84-112`). */
function splitBreaklines(s: string): string[] {
  const pieces: string[] = [];
  let pending = '';
  let level = 0;
  for (let j = 0; j < s.length; j++) {
    const ch = s.charAt(j);
    if (ch === '{' && s.charAt(j + 1) === '{') level++;
    else if (ch === '}' && s.charAt(j + 1) === '}') level--;

    if (level <= 0 && ch === BLOCK_E1_BREAKLINE) {
      pieces.push(pending);
      pending = '';
    } else pending += ch;
  }
  pieces.push(pending);
  return pieces;
}

/**
 * With `checkEndingBackslash`, a line ending in a single `\` is joined to the
 * next one (the backslash dropped); a trailing pending run with no closing
 * line is discarded, as upstream's loop discards it.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:140-156
 */
export function loadInternal(source: readonly string[], checkEndingBackslash: boolean): string[] {
  if (!checkEndingBackslash) return [...source];
  const result: string[] = [];
  let pending = '';
  for (const s of source) {
    if (endsWithBackslash(s)) {
      pending += s.substring(0, s.length - 1);
    } else {
      result.push(pending + s);
      pending = '';
    }
  }
  return result;
}

/**
 * Replace each inline `data:image/png;base64,XXXX` run with
 * `data:image/png;md5,<md5 hex of XXXX>`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:332-368
 */
export function patchBase64Line(line: string): string {
  let from = 0;
  let sb: string | undefined;
  for (let start = line.indexOf(BASE64_TAG_START, from); start !== -1; start = line.indexOf(BASE64_TAG_START, from)) {
    const dataStart = start + BASE64_TAG_START.length;
    let base64End = dataStart;
    while (base64End < line.length && RE_BASE64_CHAR.test(line.charAt(base64End))) base64End++;

    const md5 = SignatureUtils.getMD5Hex(line.substring(dataStart, base64End));
    sb = (sb ?? '') + line.substring(from, start) + BASE64_TAG_REPLACEMENT + md5;
    from = base64End;
  }
  return sb === undefined ? line : sb + line.substring(from);
}

/**
 * `UmlSource#source` as `seed()` reads it, from the block's TIM result list
 * (`@start`/`@end` included). `types.contains(DiagramType.SEQUENCE)` is read
 * off the first line exactly as `PSystemBuilder.java:238` reads it.
 */
export function umlSourceSeedLines(timResult: readonly string[]): string[] {
  const data = mutateExpandsBreakline(timResult);
  const first = data[0];
  const checkEndingBackslash = first !== undefined && findStartTypes(first).has(DiagramType.SEQUENCE);
  return loadInternal(data, checkEndingBackslash).map(patchBase64Line);
}
