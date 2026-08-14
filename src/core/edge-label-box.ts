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

/**
 * Inline creole tags that change FORMATTING and contribute no glyphs, so a
 * measurer must not see them. Built as a string so the alternation stays
 * readable; longer names precede their prefixes (`back` before `b`, `size`
 * before `s`) because regex alternation is first-match, not longest-match.
 *
 * A tag may carry a `:value` (`<color:green>`, `<size:13>`) or HTML-style
 * attributes after a space (`<font color="red">`), and may be a closing form.
 *
 * **Deliberately absent: `img`, `$` and `&`.** Those are ATOMS — they occupy
 * real width, and `creole-atoms.ts#scanLineForAtoms` sizes them
 * (`<img…>`, `<$sprite>`, `<&openicon>`). Stripping them here would silently
 * shrink every label carrying an icon. None of their names appears in the
 * alternation below, which is what keeps the atom scan intact.
 */
const CREOLE_FORMAT_TAG_SOURCE =
  '</?(?:color|back|size|font|plain|w|b|i|u|s)(?::[^>]*|\\s[^>]*)?>';

/**
 * Strip inline creole formatting to the text a measurer should see.
 *
 * Upstream never faces this: `SvekEdge` measures a real creole `TextBlock`
 * (`SvekEdge.java:441`), where a colour tag is a formatting change rather than
 * characters. This port measures strings, so the tags have to come out first
 * or they are counted as glyphs — measured at 336.1px against a 72px oracle
 * box on `usecase/jecici-56-bimu826`, whose label carries two colour tags.
 *
 * A faithful TextBlock port is the Phase 4h creole track and is out of scope
 * here; this closes the measurement gap without it. The one case it cannot
 * represent is a per-run font change inside a label (`<size:N>` mid-string),
 * which genuinely needs the block — no corpus fixture exercises it.
 */
export function stripCreoleMarkup(text: string): string {
  return text.replace(new RegExp(CREOLE_FORMAT_TAG_SOURCE, 'gi'), '');
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
  // Strip BEFORE measuring: a colour tag is a formatting change upstream, not
  // glyphs. `lines` carries the stripped text because its only consumer is a
  // descent measurement (`state-transition-label.ts:60`), not drawing.
  const lines = splitCreoleLines(text).map(stripCreoleMarkup);
  const measuredWidth = Math.max(...lines.map((l) => measurer.measure(l, font).width));
  const measuredHeight = lines.length * font.size;
  const reservedWidth = Math.floor(measuredWidth + 2 * marginLabel);
  const reservedHeight = measuredHeight + 2 * marginLabel;
  return { marginLabel, lines, measuredWidth, measuredHeight, reservedWidth, reservedHeight };
}
