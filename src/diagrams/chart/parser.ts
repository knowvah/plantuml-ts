/**
 * Parser for PlantUML chart diagrams (@startchart / @endchart).
 *
 * A flat, priority-ordered dispatch chain over trimmed lines: axes, then
 * series (bar/line/area/scatter), then title/legend/stackMode/orientation/
 * annotation. Per-line-shape handlers live in `line-handlers.ts`; shared
 * regex constants and value-parsing helpers live in `parse-helpers.ts` —
 * both split out of this file (mission G0b/T6) purely to stay under the
 * project's 500-line file cap; no behavior change beyond the chrome
 * annotation-matcher wiring documented below.
 */

import type { UmlSource } from '../../core/block-extractor.js';
import type { ChartDiagramAST } from './ast.js';
import { createAnnotations, matchAnnotationCommand } from '../../core/annotations/index.js';
import { createSpriteRegistry, matchSpriteCommand } from '../../core/sprite-commands.js';
import { extractStyleMap, makeAxis } from './parse-helpers.js';
import type { StyleMap } from '../../core/skinparam.js';
import { refuse } from '../../core/parse-refusal.js';
import type { ParseRefusal } from '../../core/parse-refusal.js';
import {
  tryArea, tryBar, tryChartAnnotation, tryChartLegend, tryGrid, tryHAxis, tryLine,
  tryOrientation, tryScatter, tryStackMode, tryV2Axis, tryVAxis,
} from './line-handlers.js';

/** Uniform shape every dispatch-chain handler is called through: `(ast,
 *  line, styleMap)`, in that argument order. Handlers that don't need
 *  `styleMap` (axes, title, legend) simply declare fewer parameters and
 *  ignore the extra positional argument -- safe ONLY because every handler
 *  agrees on this same (ast, line, styleMap) order (see project note on
 *  the activity/node-dispatch.ts parameter-misalignment bug this mirrors
 *  the fix for). */
type ChartLineHandler = (ast: ChartDiagramAST, line: string, styleMap: StyleMap) => boolean;

const PRIMARY_HANDLERS: readonly ChartLineHandler[] = [
  tryV2Axis, tryVAxis, tryHAxis, tryGrid, tryBar, tryLine, tryArea, tryScatter,
  tryChartLegend,
];

const SECONDARY_HANDLERS: readonly ChartLineHandler[] = [tryStackMode, tryOrientation, tryChartAnnotation];

/**
 * Dispatch one trimmed, non-blank line at index `i` of `lines`. Handlers
 * run in upstream priority order (axes, then series, then legend);
 * `tryChartLegend` (chart's own `legend left|right|top|bottom` position
 * command) is tried BEFORE the shared chrome matcher so `legend right`
 * resolves as a position, never as chrome legend TEXT "right" — see
 * `line-handlers.ts#tryChartLegend`'s doc comment. `title` (mission
 * G0b/T8) no longer has its own PRIMARY_HANDLERS entry (`tryTitle` is
 * gone) -- it now falls through to the shared chrome matcher below like
 * caption/legend/header/footer/mainframe. Returns the number of lines
 * consumed (> 1 only when the chrome matcher consumed a multiline
 * title/caption/legend/header/footer block).
 */
function dispatchChartLine(
  ast: ChartDiagramAST,
  lines: readonly string[],
  i: number,
  line: string,
  styleMap: StyleMap,
): number | null {
  for (const handler of PRIMARY_HANDLERS) {
    if (handler(ast, line, styleMap)) return 1;
  }

  const annotationMatch = matchAnnotationCommand(lines, i, ast.chrome!);
  if (annotationMatch !== null) return annotationMatch.consumed;

  // `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4): tried
  // immediately after the chrome matcher, same fallback position.
  const spriteMatch = matchSpriteCommand(lines, i, ast.sprites!);
  if (spriteMatch !== null) return spriteMatch.consumed;

  for (const handler of SECONDARY_HANDLERS) {
    if (handler(ast, line, styleMap)) return 1;
  }

  // No registered command recognised this line -- mission
  // dispatch-by-parse-attempt/T10 (D0/D1). The permissive fall-through
  // that used to `return 1` unconditionally here silently dropped the
  // line; it now signals "no candidate matched" so `parseChart` can build
  // a `ParseRefusal` instead. Mirrors `getCandidate` returning `null` when
  // no `Command` in `cmds` matches.
  // @see ~/git/plantuml/.../command/PSystemCommandFactory.java:169-175,225-246
  return null;
}

function initChartAst(): ChartDiagramAST {
  return {
    hAxis: makeAxis(),
    vAxis: makeAxis(),
    v2Axis: null,
    series: [],
    legendPosition: 'none',
    stackMode: 'grouped',
    orientation: 'vertical',
    annotations: [],
    errors: [],
    chrome: createAnnotations(),
    sprites: createSpriteRegistry(),
  };
}

export function parseChart(source: UmlSource): ChartDiagramAST | ParseRefusal {
  const ast = initChartAst();
  const styleMap = extractStyleMap(source);
  const lines = source.lines;

  // `consumed` mirrors upstream's `trace.size()` in spirit (D2,
  // decisions.md): lines of `source.lines` successfully parsed before the
  // offending one. `@startchart`/`@endchart` are already stripped from
  // `source.lines` by the block extractor, so unlike upstream's
  // `IteratorCounter2` (which also counts the start-directive line) there
  // is no constant offset to add here; chart is single-candidate (T10
  // read-set), so this score never breaks a cross-engine tie regardless.
  let consumed = 0;
  for (let i = 0; i < lines.length; ) {
    const line = lines[i]!.trim();
    if (line === '') {
      i++;
      consumed++;
      continue;
    }
    const advance = dispatchChartLine(ast, lines, i, line, styleMap);
    if (advance === null) {
      return refuse('syntax', i, consumed, 'Syntax Error?');
    }
    i += advance;
    consumed += advance;
  }

  return ast;
}
