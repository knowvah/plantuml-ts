/**
 * `PSystemSingleLineFactory` as a plugin helper: every `@startuml` utility
 * page (`license`, `colors`, `sudoku`, the eggs, ...) is a factory that
 * accepts a source of exactly one line between `@startuml` and `@enduml`,
 * after the noise directly following `@startuml` is dropped
 * (`createSystem`, java:69-103). Each factory is its own plugin, registered at
 * its `PSystemBuilder` position (decisions.md D2); the registry already tries
 * plugins sharing a candidate type in registration order
 * (`dispatcher.ts#DiagramRegistry.resolve`).
 *
 * The lines examined are upstream's `UmlSource` — `BlockUml#data`, `@start` /
 * `@end` and every directive line in place: `UmlSource.seedSourceLines`
 * (the `diagrams/dot/parser.ts#upstreamLinesOf` precedent).
 *
 * Refusal scale: a refusal's `consumed` is upstream's `trace.size() - 1`, the
 * document index of the offending line, as `class`'s and `dot`'s are, so the
 * merge among `@startuml` candidates keeps upstream's order.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemSingleLineFactory.java
 */
import type { DiagramType, UmlSource } from '../block-extractor.js';
import type { AssembledSvg, SyncPlugin } from '../dispatcher.js';
import type { StringMeasurer } from '../measurer.js';
import { refuse } from '../parse-refusal.js';
import type { ParseRefusal } from '../parse-refusal.js';
import { trin } from '../style/parser/StyleParser.js';
import type { Theme } from '../theme.js';
import { PreprocessingArtifact } from '../tim/PreprocessingArtifact.js';
import { isEndDirective, isStartDirective } from '../tim/StartUtils.js';

/** `super(DiagramType.SEQUENCE)` — "This is a hack for @startuml".
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemSingleLineFactory.java:58-61 */
const SEQUENCE_HACK = 'sequence' satisfies DiagramType;

/** The `@startuml` candidate type every single-line factory declares. */
export type SingleLineType = typeof SEQUENCE_HACK;

/** `source.getTotalLineCount() != 3`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemSingleLineFactory.java:75 */
const SINGLE_LINE_SOURCE_COUNT = 3;

/** `PSystemAbstractFactory.EMPTY_DESCRIPTION`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemAbstractFactory.java */
const EMPTY_DESCRIPTION = 'Empty description';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemSingleLineFactory.java:97 */
const SYNTAX_ERROR = 'Syntax Error?';

/** `COMMENT_LINE = Pattern.compile("\\s*'.*")`, used with `matches()`.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:253 */
const COMMENT_LINE = /^[ \t\n\x0B\f\r]*'.*$/;

/**
 * `createSystem` returning `null` (java:75-76): not a single-line source.
 * Upstream adds that `null` to the error list and `PSystemErrorUtils#merge`
 * skips it (`if (system == null) continue;`, PSystemErrorUtils.java:120-121),
 * so it can never own the error page. The registry merges `ParseRefusal`s
 * only; a `commandScore` of `-Infinity` makes this one lose to every real
 * refusal (`mergeRefusals` keeps the first maximum, so a later finite score
 * always replaces it).
 */
const NOT_SINGLE_LINE: ParseRefusal = refuse('incomplete', 0, 0, '', Number.NEGATIVE_INFINITY);

/** What `render` receives besides the diagram. */
export interface RenderContext {
  readonly theme: Theme;
  /** The measurer layout ran with (`SyncPlugin.layoutSync`'s). */
  readonly measurer: StringMeasurer;
}

/** One factory: its `executeLine` (java:56) and how its diagram exports. */
export interface SingleLineSpec<D> {
  /** Always `'sequence'`: the `@startuml` candidate type (java:58-61). */
  readonly type: SingleLineType;
  /** `undefined` is upstream's `null`: "Syntax Error?" on the line. */
  executeLine(source: UmlSource, line: string, preprocessing: PreprocessingArtifact): D | undefined;
  /** Typically `{ completeSvg: diagram.exportDiagram(0, ctx.measurer) }` (`UgDiagram`). */
  render(diagram: D, ctx: RenderContext): AssembledSvg;
}

/** What `layoutSync` hands `render`: the diagram and the layout measurer. */
export interface SingleLineGeometry<D> {
  readonly diagram: D;
  readonly measurer: StringMeasurer;
}

/** One line of upstream's `UmlSource`, with its index into that source. */
interface Located {
  readonly text: string;
  readonly k: number;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:95-106 */
function isNoise(line: string): boolean {
  return (
    line === '' || line.startsWith('skinparam ') || line.startsWith('skinparamlocked ') || line.startsWith('!pragma ')
  );
}

/** Keep the `@start` line, drop every noise line directly after it.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:79-93 */
function removeInitialNoise(all: readonly string[]): Located[] {
  let cut = 1;
  while (cut < all.length && isNoise(all[cut]!)) cut++;
  const located = all.map((text, k) => ({ text, k }));
  return [...located.slice(0, 1), ...located.slice(cut)];
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:255-270 */
function isEmpty(lines: readonly Located[]): boolean {
  for (const { text } of lines) {
    if (isStartDirective(text) || isEndDirective(text) || COMMENT_LINE.test(text)) continue;
    if (trin(text).length !== 0) return false;
  }
  return true;
}

/** `BlockUml#data`; a hand-built source has its interior only. */
function upstreamLinesOf(source: UmlSource): readonly string[] {
  return source.seedSourceLines ?? ['@startuml', ...source.lines, '@enduml'];
}

/**
 * The document line (what `errorSvg` indexes) of upstream line `k`: aligned
 * through `linePositions`, which is parallel to the directive-stripped
 * `lines`, a subsequence of upstream's. Without positions `k` already is it.
 * Mirrors `diagrams/dot/parser.ts#documentLineOf`.
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

/** `buildEmptyError(source, location, it.getTrace(), ...)`, `traceSize` lines read.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemAbstractFactory.java:59-65 */
function emptyError(source: UmlSource, all: readonly string[], at: Located, traceSize: number): ParseRefusal {
  return refuse('syntax', documentLineOf(source, all, at.k), traceSize - 1, EMPTY_DESCRIPTION);
}

/**
 * `createSystem`: the gate, the empty branches, then `executeLine` on the
 * one line, untrimmed (`s.getString()`).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemSingleLineFactory.java:69-103
 */
function createSystem<D>(spec: SingleLineSpec<D>, source: UmlSource): D | ParseRefusal {
  const all = upstreamLinesOf(source);
  const lines = removeInitialNoise(all);
  if (lines.length !== SINGLE_LINE_SOURCE_COUNT) return NOT_SINGLE_LINE;
  const startLine = lines[0]!;
  if (isEmpty(lines)) return emptyError(source, all, startLine, 1);
  if (!isStartDirective(startLine.text)) throw new Error('UnsupportedOperationException');
  const s = lines[1]!;
  if (isEndDirective(s.text)) return emptyError(source, all, s, 2);
  const sys = spec.executeLine(source, s.text, new PreprocessingArtifact());
  if (sys === undefined) return refuse('syntax', documentLineOf(source, all, s.k), 1, SYNTAX_ERROR);
  return sys;
}

/**
 * The plugin for one single-line factory. `D` must not carry a `refused`
 * field (the `ParseRefusal` discriminant).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemSingleLineFactory.java:54-105
 */
export function singleLinePlugin<D>(spec: SingleLineSpec<D>): SyncPlugin<D, SingleLineGeometry<D>> {
  return {
    type: SEQUENCE_HACK,
    parse: (source) => createSystem(spec, source),
    layoutSync: (diagram, _theme, measurer) => ({ diagram, measurer }),
    render: (geo, theme) => spec.render(geo.diagram, { theme, measurer: geo.measurer }),
  };
}
