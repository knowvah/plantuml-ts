/**
 * Transition edge label/xlabel attribute building — split out of
 * ./state-composite-pass.ts (mission A4 Phase L, 500-line file-cap
 * compliance; pure move, zero behavior change) for its own coherent
 * concern: turning a `Transition`'s guard/action/label/note-on-link fields
 * into the DOT edge `label`/`labelWidth`/`labelHeight` (or `xlabel*` under
 * `skinparam linetype ortho`) attributes.
 *
 * @see ~/git/plantuml/.../svek/SvekEdge.java
 */

import type { Transition } from './ast.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { DotInputEdge } from '../../core/graph-layout.js';
import type { DiagramCtx } from './state-composite-pass.js';
import type { ReservedLabelBox } from '../../core/edge-label-box.js';
import { computeReservedLabelBox } from './state-transition-label.js';
import { computeMergedLabelBox } from '../../core/edge-label-box.js';
// `EntityImageNoteLink`'s own margins — see `measureLinkNoteDim`'s doc in
// ./state-dot-graph.ts (duplicated here per this file's own D1 rationale,
// avoid-import-cycle) for the full derivation.
import { OPALE_MARGIN_X1, OPALE_MARGIN_X2, OPALE_MARGIN_Y } from '../../core/svek/image/Opale.js';
import { NOTE_FONT_SIZE } from '../../core/klimt/font/FontParam.js';

/** Guard/action/plain label — same precedence as ./state-dot-graph.ts's
 *  `transitionLabelText` (duplicated to avoid an import cycle: layout.ts
 *  imports ./state-composite-pass.ts; both read the same four `Transition`
 *  fields). */
function transitionLabelOf(t: Transition): string | undefined {
  if (t.label !== undefined) return t.label;
  if (t.guard !== undefined && t.action !== undefined) return `[${t.guard}] / ${t.action}`;
  if (t.guard !== undefined) return `[${t.guard}]`;
  if (t.action !== undefined) return `/ ${t.action}`;
  return undefined;
}

/** `EntityImageNoteLink`'s own dimension — duplicated from
 *  ./state-dot-graph.ts's `measureLinkNoteDim` (D1, same avoid-import-cycle
 *  rationale as `transitionLabelOf` above); see that file's doc comment for
 *  the full `ComponentRoseNote`/`Opale` derivation and its numeric proof
 *  against `fotigo-12-gufu949`. `ROSE_NOTE_PADDING` = `Rose.java:65-66`. */
const ROSE_NOTE_PADDING = 5;

interface LabelDims {
  width: number;
  height: number;
}

function measureLinkNoteDim(text: string, fontFamily: string, measurer: StringMeasurer): LabelDims {
  const font = { family: fontFamily, size: NOTE_FONT_SIZE };
  const lines = text.split('\n');
  let maxW = 0;
  for (const ln of lines) maxW = Math.max(maxW, measurer.measure(ln, font).width);
  return {
    width: maxW + OPALE_MARGIN_X1 + OPALE_MARGIN_X2 + 2 * ROSE_NOTE_PADDING,
    height: lines.length * NOTE_FONT_SIZE + 2 * OPALE_MARGIN_Y + 2 * ROSE_NOTE_PADDING,
  };
}

type EdgeAttrs = NonNullable<DotInputEdge['attributes']>;

/** See ./state-dot-graph.ts's `computeEdgeLabelBox` (same split rationale:
 *  keep `edgeLabelAttrs`'s own optional-presence branching separate from
 *  this one's which-formula branching). `halfWidth`/`hasMiddleDecor` are
 *  always false for state — see ./state-dot-graph.ts's
 *  `measureLinkNoteDim` doc for the citations. */
function computeEdgeLabelBox(
  t: Transition,
  text: string | undefined,
  font: FontSpec,
  measurer: StringMeasurer,
): ReservedLabelBox {
  if (t.linkNote === undefined) return computeReservedLabelBox(text!, font, measurer, t.from === t.to);
  return computeMergedLabelBox({
    label: text ?? '',
    noteDim: measureLinkNoteDim(t.linkNote, font.family, measurer),
    position: t.linkNotePosition ?? 'bottom',
    halfWidth: false,
    hasMiddleDecor: false,
    font,
    measurer,
  });
}

/** Both `labelWidth`/`labelHeight` (DOT-gate) and `labelBoxWidth`/
 *  `labelBoxHeight` (the real `@knowvah/dot-engine` layout input) are set
 *  together from the same box, including when a `note on link` is attached
 *  — T9 closes the gap the prior "merged label+note margin story is still
 *  unverified" comment named; see `computeEdgeLabelBox`. */
function edgeLabelAttrs(t: Transition, font: FontSpec, measurer: StringMeasurer): EdgeAttrs {
  const text = transitionLabelOf(t);
  if (text === undefined && t.linkNote === undefined) return {};
  const box = computeEdgeLabelBox(t, text, font, measurer);
  return {
    label: text ?? t.linkNote ?? '',
    labelWidth: box.reservedWidth,
    labelHeight: box.reservedHeight,
    labelBoxWidth: box.reservedWidth,
    labelBoxHeight: box.reservedHeight,
  };
}

/** Under `skinparam linetype ortho`, svek routes the main edge label through
 *  `xlabel` instead of `label` (SvekEdge.java:434-441) — duplicated from
 *  ./state-dot-graph.ts's `moveLabelToXlabel` (D1). */
function moveLabelToXlabel(attrs: EdgeAttrs): void {
  if (attrs.label === undefined) return;
  attrs.xlabel = attrs.label;
  attrs.xlabelWidth = attrs.labelWidth!;
  attrs.xlabelHeight = attrs.labelHeight!;
  delete attrs.label;
  delete attrs.labelWidth;
  delete attrs.labelHeight;
}

export function buildEdgeAttrs(t: Transition, font: FontSpec, ctx: DiagramCtx): EdgeAttrs {
  const attrs: EdgeAttrs = {
    minLen: (t.length ?? 2) - 1,
    ...edgeLabelAttrs(t, font, ctx.measurer),
  };
  if (ctx.theme.linetype === 'ortho') moveLabelToXlabel(attrs);
  return attrs;
}
