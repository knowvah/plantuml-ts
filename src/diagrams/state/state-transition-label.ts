/**
 * Transition label placement — shared by every state-layout pipeline (flat,
 * T3; composite, T4) so antiparallel transitions don't overlap their labels.
 * Split out to a standalone module (no dependents) to avoid an import cycle
 * between ./layout.ts and the composite-pass modules, both of which need it.
 *
 * G8/T2 (`plans/g8-label-placement/`): D1 replaces the perpendicular-offset
 * guess with a jar-faithful centre->anchor conversion whenever the layout
 * result actually placed the label (graphviz reads the FIXEDSIZE box back
 * and reports its centre, `SvekEdge.java:741-745,808-813` -- dot places,
 * jar reads back) -- gated on `labelX !== undefined`, never truthiness (D1).
 * The legacy perpendicular formula stays as the explicit fallback for edges
 * whose result carries no label position (orphan-swept edges, paths that
 * never handed the label to graphviz).
 *
 * @see plans/g8-label-placement/spec.md (§1a mechanism, §2 formula, §6 fallback contract)
 * @see plans/g8-label-placement/decisions.md (D1/D2)
 */

import type { Transition } from './ast.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { ReservedLabelBox } from '../../core/edge-label-box.js';
import type { LabelInkBox } from './state-geo-types.js';
import { transitionLabelText } from './state-dot-graph.js';
import { computeReservedLabelBox } from '../../core/edge-label-box.js';

/** Label offset perpendicular to the edge direction -- legacy fallback only
 *  (D1): still used verbatim when the layout result carries no label
 *  position at all. */
const LABEL_PERP = 12;

// Relocated to `core/edge-label-box.ts` (T1) -- one box formula for every
// engine, per that module's header. Re-exported so `state-composite-edge-
// label.ts` and any other state caller is unchanged.
export { computeReservedLabelBox };

/**
 * Closed-form centre->anchor conversion (spec.md §2, no fixture-conditional
 * terms -- D5). `centre` is the graphviz-returned label position
 * (`labelX`/`labelY`); the FIXEDSIZE box jar actually placed is centered
 * there, and jar draws its (with-margin) `labelText` block's top-left at
 * that box's own top-left corner + `marginLabel` (spec.md §1b) -- the
 * visible text therefore starts `marginLabel` further in from the box's own
 * corner on the x axis. The y axis needs no floor/margin split: `reservedHeight
 * = measuredHeight + 2*marginLabel` is already exact for every jar-verified
 * case (`fontSize`/`marginLabel` both integers, `measuredHeight = lines *
 * fontSize`), so `anchor.y` reduces algebraically to `centre.y -
 * measuredHeight/2 + ascent` with zero residual from the floor.
 *
 * Jar-verified 11/11 exact (spec.md §3): 3 composite-pass nesting depths,
 * the flat (non-composite) pipeline, self-loops with BOTH `marginLabel`
 * values, and duplicate parallel edges between the same state pair.
 */
export function transitionLabelAnchor(
  centre: { x: number; y: number },
  text: string,
  font: FontSpec,
  measurer: StringMeasurer,
  isSelfLoop: boolean,
): { x: number; y: number } {
  return anchorFromCentre(centre, measureLabel(text, font, measurer, isSelfLoop));
}

/** The reserved box plus the first line's ascent -- everything both the
 *  anchor conversion and the ink box need, measured once. */
interface MeasuredLabel {
  readonly box: ReservedLabelBox;
  readonly ascent: number;
}

function measureLabel(
  text: string,
  font: FontSpec,
  measurer: StringMeasurer,
  isSelfLoop: boolean,
): MeasuredLabel {
  const box = computeReservedLabelBox(text, font, measurer, isSelfLoop);
  return { box, ascent: font.size - measurer.getDescent(font, box.lines[0]!) };
}

function anchorFromCentre(
  centre: { x: number; y: number },
  { box, ascent }: MeasuredLabel,
): { x: number; y: number } {
  return {
    x: centre.x - box.reservedWidth / 2 + box.marginLabel,
    y: centre.y - box.measuredHeight / 2 + ascent,
  };
}

/**
 * Round to the 2 decimals graphviz's SVG writer prints — the precision jar's
 * label geometry actually carries.
 *
 * PlantUML never sees a full-precision label position: it scrapes `dot
 * -Tsvg`'s TEXT, taking the min corner of the invisible label table's
 * `points="..."` (`svek/SvekEdge.java:808-813`, `SvekUtils.getMinXY`), and
 * graphviz prints every coordinate through
 * `snprintf(buf, 50, "%.02f", num)`.
 *
 * Measured, not assumed: real graphviz 15.1.1 on jar's own
 * `test-results/dot-cache/state/bemena-23-zebu249/svek-1.dot` puts the
 * `EvNewValueSaved` box corner at `235.61` where our engine carries
 * `235.61168` — the whole of that fixture's residual composite-width error
 * once the marged-box fold is correct.
 *
 * Applied to the ink box ONLY, never to `label.x`/`label.y`: the draw
 * anchor and the document-level (`labelInk: false`) point fold are pinned
 * and must stay byte-identical (mission decision D5). We therefore draw the
 * label at the unquantized x where jar draws the quantized one — ≤0.005px,
 * inside the 0.01px SVG-conformance band.
 *
 * `toFixed` rounds half away from zero where C's `%.02f` rounds half to
 * even; they differ only for a double that is an exact `n.xx5`, which a
 * layout coordinate is not in practice. The `+ 0` normalizes `-0`, matching
 * graphviz's own `num > -0.005 && num < 0.005` guard.
 *
 * @see ~/git/graphviz/lib/gvc/gvdevice.c:513-528 (`gvprintdouble`)
 * @see .agent-notes/class-edge-spline-2dp-quantization.md
 */
function svgPrecision(v: number): number {
  return Number(v.toFixed(2)) + 0;
}

/** The label fields `TransitionGeo.label` carries beyond text and anchor:
 *  the floored DOT reservation (`width`/`height`, unchanged) and the
 *  unfloored, box-anchored ink extent ({@link LabelInkBox}). */
function labelBoxFields(
  anchor: { x: number; y: number },
  { box, ascent }: MeasuredLabel,
): { width: number; height: number; inkBox: LabelInkBox } {
  return {
    width: box.reservedWidth,
    height: box.reservedHeight,
    // `LimitFinder#drawEmpty` over `TextBlockMarged`'s own `UEmpty`: the
    // marged block's top-left corner, and its UNfloored dimension.
    inkBox: {
      x: svgPrecision(anchor.x - box.marginLabel),
      y: svgPrecision(anchor.y - ascent - box.marginLabel),
      width: box.measuredWidth + 2 * box.marginLabel,
      height: box.measuredHeight + 2 * box.marginLabel,
    },
  };
}

/** Legacy perpendicular-offset placement (D1 fallback, unchanged formula) --
 *  used only when the layout result carries no label position at all. */
function perpendicularOffsetLabel(
  points: ReadonlyArray<{ x: number; y: number }>,
): { x: number; y: number } | undefined {
  if (points.length < 2) return undefined;
  let mid: { x: number; y: number };
  if (points.length === 2) {
    const p0 = points[0]!;
    const p1 = points[1]!;
    mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  } else {
    mid = points[Math.floor(points.length / 2)]!;
  }
  const p0 = points[0]!;
  const pLast = points[points.length - 1]!;
  const eDx = pLast.x - p0.x;
  const eDy = pLast.y - p0.y;
  const eLen = Math.sqrt(eDx * eDx + eDy * eDy) || 1;
  return {
    x: mid.x + (eDy / eLen) * LABEL_PERP,
    y: mid.y + (-eDx / eLen) * LABEL_PERP - 4,
  };
}

/** Layout result fields {@link attachTransitionLabel} needs -- a narrow
 *  structural subset of `DotLayoutResult['edges'][number]` so this module
 *  stays decoupled from the full result shape (only `labelX`/`labelY` are
 *  ever read; `labelWidth`/`labelHeight` are NOT -- the box stored on
 *  `TransitionGeo.label` is independently recomputed via
 *  {@link computeReservedLabelBox} from the transition's OWN text, so it
 *  reflects the SAME jar-verified formula regardless of which pipeline
 *  built the edge or whether that pipeline's own DOT-input box happened to
 *  carry margin/floor already). */
interface LabelEdgeResult {
  readonly labelX?: number;
  readonly labelY?: number;
}

/** Attach a transition's label. D1: when the layout result placed the label
 *  (graphviz read the FIXEDSIZE box back) AND a font/measurer is available,
 *  convert its centre to a draw anchor via {@link transitionLabelAnchor};
 *  otherwise fall back to the legacy perpendicular-offset formula,
 *  unchanged. Pure function of the transition, the routed points, and the
 *  layout result. */
export function attachTransitionLabel(
  t: Transition,
  points: ReadonlyArray<{ x: number; y: number }>,
  edgeResult: LabelEdgeResult | undefined,
  font: FontSpec | undefined,
  measurer: StringMeasurer | undefined,
):
  | { text: string; x: number; y: number; width?: number; height?: number; inkBox?: LabelInkBox }
  | undefined {
  const labelText = transitionLabelText(t);
  if (labelText === undefined) return undefined;

  const isSelfLoop = t.from === t.to;
  // `font`/`measurer` are unavailable only for a pass whose accumulator was
  // built outside this task's write-set (state-composite-concurrent.ts's
  // own `newAccumulator()` call, concurrent-region passes) -- box/anchor
  // conversion needs a real measurer, so those labels keep the EXACT
  // pre-existing perpendicular-only, no-box shape (D1's own "absent falls
  // back unchanged" spirit, generalized to a missing measurer rather than
  // just a missing layout position).
  const measured =
    font !== undefined && measurer !== undefined
      ? measureLabel(labelText, font, measurer, isSelfLoop)
      : undefined;

  // D1: gate on `labelX !== undefined` specifically, never truthiness (0 is
  // a valid coordinate) -- `labelY` is present together with `labelX`
  // whenever it is (`graph-layout.ts#toEdgeEntry` sets both from the same
  // `ge.label` pair).
  if (edgeResult?.labelX !== undefined && measured !== undefined) {
    const anchor = anchorFromCentre({ x: edgeResult.labelX, y: edgeResult.labelY! }, measured);
    return { text: labelText, x: anchor.x, y: anchor.y, ...labelBoxFields(anchor, measured) };
  }

  const legacy = perpendicularOffsetLabel(points);
  if (legacy === undefined) return undefined;
  // The fallback anchor is this port's own (upstream draws no label at all
  // when graphviz returned no position), so it keeps the SAME box
  // convention rather than a second one.
  const boxFields = measured !== undefined ? labelBoxFields(legacy, measured) : {};
  return { text: labelText, x: legacy.x, y: legacy.y, ...boxFields };
}
