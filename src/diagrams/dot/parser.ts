import type { UmlSource } from '../../core/block-extractor.js';
import { refuse } from '../../core/parse-refusal.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import { isEndDirective } from '../../core/tim/StartUtils.js';
import type { DotDiagramAST } from './ast.js';

// ---------------------------------------------------------------------------
// `@startdot` parsing is upstream's `PSystemDotFactory` and nothing more: find
// the graphviz header, then hand every later line to graphviz untouched. No
// PlantUML directive is honoured — not `title`/`caption`/`legend`/`header`/
// `footer`, not `sprite`, not comments. Before the header such a line is a
// syntax error; after it, it is DOT (and graphviz decides what it means).
// ---------------------------------------------------------------------------

/** Java's `\s`: `[ \t\n\x0B\f\r]` — narrower than JavaScript's. */
const WS = '[ \\t\\n\\x0B\\f\\r]';

/**
 * The graphviz header, ported character for character; `Matcher#matches`
 * anchors both ends, hence `^…$`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/directdot/PSystemDotFactory.java:48-56
 */
const GRAPHVIZ_DOT_HEADER_PATTERN = new RegExp(
  `^${WS}*(strict${WS}+)?(di)?graph${WS}+` +
    `([_\\p{L}][_\\p{L}\\p{N}]*|-?(?:\\.[0-9]+|[0-9]+(?:\\.[0-9]*)?)|"([^"\\\\]|\\\\")*")?` +
    `${WS}*\\{${WS}*$`,
  'u',
);

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/directdot/PSystemDotFactory.java:84-87 */
function isGraphvizDotHeader(line: string): boolean {
  return GRAPHVIZ_DOT_HEADER_PATTERN.test(line);
}

/**
 * `UmlSource#isNoise` — tested on the UNtrimmed line, case-sensitively.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:95-106
 */
function isNoise(line: string): boolean {
  return (
    line === '' || line.startsWith('skinparam ') || line.startsWith('skinparamlocked ') || line.startsWith('!pragma ')
  );
}

/** One line of upstream's `UmlSource`, with its index into that source. */
interface Located {
  readonly text: string;
  readonly k: number;
}

/**
 * `UmlSource#removeInitialNoise`: keep the `@start` line, drop every noise
 * line directly after it.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:79-93
 */
function removeInitialNoise(all: readonly string[]): Located[] {
  let cut = 1;
  while (cut < all.length && isNoise(all[cut]!)) cut++;
  const located = all.map((text, k) => ({ text, k }));
  return [located[0]!, ...located.slice(cut)];
}

/**
 * Upstream's `UmlSource` lines — `BlockUml#data`, the PREPROCESSED block with
 * its `@start`/`@end` lines and every `skinparam`/`<style>` line still in
 * place. That is `seedSourceLines` (`block-extractor.ts#UmlSource`). A
 * hand-built fixture has none; its `lines` are then the whole interior.
 */
function upstreamLinesOf(source: UmlSource): readonly string[] {
  return source.seedSourceLines ?? ['@startdot', ...source.lines, '@enddot'];
}

/**
 * The DOCUMENT line (0-based, what `errorSvg` indexes) of upstream line `k`.
 *
 * `linePositions` is parallel to the directive-STRIPPED `lines`, which are a
 * subsequence of upstream's lines; aligning the two recovers the position of
 * every line that survived stripping. A hoisted directive line (`<style>`,
 * a late `skinparam`) has no entry of its own and is placed by its distance
 * from the nearest aligned line after it, else before it. With no positions
 * at all (hand-built fixture) `k` already is the document index.
 */
function documentLineOf(source: UmlSource, all: readonly string[], k: number): number {
  const positions = source.linePositions;
  if (positions === undefined) return k;
  const mapped: (readonly [number, number])[] = [];
  let j = 0;
  for (let i = 1; i < all.length && j < source.lines.length; i++) {
    if (all[i] !== source.lines[j]) continue;
    const p = positions[j++];
    if (p !== undefined) mapped.push([i, p]);
  }
  const after = mapped.find(([i]) => i >= k);
  if (after !== undefined) return after[1] - (after[0] - k);
  const before = mapped.at(-1);
  return before === undefined ? k : before[1] + (k - before[0]);
}

/**
 * `PSystemBasicFactory#createSystem` driving `PSystemDotFactory#executeLine`.
 *
 * Leading blank lines are skipped (java:50-51). Until the header matches,
 * `executeLine` returns `null` (PSystemDotFactory.java:76-77), which
 * `createSystem` turns into `Syntax Error?` on that very line (java:61-64).
 * From the header on, every line is appended with its `\n` (java:72-81).
 * Reaching `@end` with no diagram yields `Empty description` when only the
 * two directive lines remain (java:54-56).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemBasicFactory.java:41-68
 */
export function parseDot(source: UmlSource): DotDiagramAST | ParseRefusal {
  const all = upstreamLinesOf(source);
  const lines = removeInitialNoise(all);
  let data: string | undefined;
  let first = true;
  for (const { text, k } of lines.slice(1)) {
    if (first && text.trim() === '') continue;
    first = false;
    if (isEndDirective(text)) break;
    if (data === undefined && !isGraphvizDotHeader(text)) {
      return refuse('syntax', documentLineOf(source, all, k), k, 'Syntax Error?');
    }
    data = `${data ?? ''}${text}\n`;
  }
  if (data !== undefined) return { dotContent: data };
  return refuse('syntax', documentLineOf(source, all, all.length - 1), lines.length, 'Empty description');
}
