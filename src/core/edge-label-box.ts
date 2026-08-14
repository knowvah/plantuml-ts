/**
 * The reserved box an edge label occupies in the DOT handed to graphviz.
 *
 * Upstream sizes EVERY edge label the same way — `SvekEdge` measures a creole
 * `TextBlock` and writes the result into a `<TABLE FIXEDSIZE="TRUE" WIDTH=".."
 * HEIGHT="..">` reservation (`svek/SvekEdge.java:441`,
 * `labelText.calculateDimension(stringBounder)`). One formula upstream, so one
 * formula here.
 *
 * Relocated from `diagrams/state/` (2026-08-14, mission
 * `edge-label-box-and-class-ports` T1) because it was correct and reachable
 * only by the state engine, while class and description each measured their
 * labels a different, wrong way. A pure move: the state engine's DOT output is
 * byte-identical across the relocation, which its DOT-parity suite proves.
 * `state-sizing.ts` and `state-transition-label.ts` re-export from here, so no
 * state-side import changed.
 */
import type { FontSpec, StringMeasurer } from './measurer.js';

/**
 * Split a display/description string on PlantUML's literal `\n` line-break
 * token (two source characters: backslash, n — NOT a real newline; our
 * parser never converts it, mirroring upstream's Creole renderer which
 * treats the literal token as a line break at draw time). A raw newline
 * character (if one ever appears) is also treated as a break, since no
 * upstream state-diagram source produces one but defensive parity costs
 * nothing here.
 * @see ~/git/plantuml/.../klimt/creole/Display.java (line splitting on `\n`)
 */
export function splitCreoleLines(text: string): string[] {
  return text.split(/\\n|\n/);
}

/** Every intermediate the box formula produces, so a caller that needs the
 *  margin or the pre-margin measurement reads it off the same computation
 *  rather than re-deriving it. */
export interface ReservedLabelBox {
  readonly marginLabel: number;
  readonly lines: readonly string[];
  readonly measuredWidth: number;
  readonly measuredHeight: number;
  readonly reservedWidth: number;
  readonly reservedHeight: number;
}

/**
 * Width is the MAX over lines, not their sum; height is the line count times
 * the font size; both then take `2 * marginLabel` and the width floors, as
 * the jar truncates toward zero (`(int)` cast, `SvekEdge.java:504-507`).
 *
 * `marginLabel` is 6 for a self-loop and 1 otherwise.
 */
export function computeReservedLabelBox(
  text: string,
  font: FontSpec,
  measurer: StringMeasurer,
  isSelfLoop: boolean,
): ReservedLabelBox {
  const marginLabel = isSelfLoop ? 6 : 1;
  const lines = splitCreoleLines(text);
  const measuredWidth = Math.max(...lines.map((l) => measurer.measure(l, font).width));
  const measuredHeight = lines.length * font.size;
  const reservedWidth = Math.floor(measuredWidth + 2 * marginLabel);
  const reservedHeight = measuredHeight + 2 * marginLabel;
  return { marginLabel, lines, measuredWidth, measuredHeight, reservedWidth, reservedHeight };
}
