/**
 * cdd-T6: the four geometry shapes `EdgeGeo` grew for A2a's render-only
 * link mechanisms (M2 visibility icon, M5 `note on link` box, M9
 * `constraint on links`, M10 multi-line quantifier). Split out of
 * `class-geo-types.ts`, which was already at the 500-line hook cap
 * (pre-authorised split re-export, `batch-2/T6-edge-geometry.md` quality
 * bar); `class-geo-types.ts` re-exports every name below, so no consumer's
 * import path changed.
 */
export type { VisibilityIconGeo } from './class-edge-visibility.js';

/** One measured line of a link note's body — same `{ text, width }` shape
 *  the state engine's `StateTextLine` carries (`state-geo-types.ts:13-16`),
 *  duplicated rather than imported so the class engine keeps no dependency
 *  on the state engine's geometry module. */
export interface EdgeNoteLine {
  readonly text: string;
  readonly width: number;
}

/**
 * A2a/M5: the `note on link` box, mirroring the state engine's already
 * jar-verified `noteBoxFields` shape (`state-transition-label.ts:290-306`)
 * with the anchor folded in — there it rides on the transition label's own
 * `x`/`y`, here the note is only ONE operand of the merged label block so
 * it needs its own.
 *
 * `x`/`y` is the note operand's top-left inside the merged block
 * (`SvekEdge.java:307-327`'s `mergeLR`/`mergeTB`, drawn at `:952-954`);
 * `width`/`height` is `EntityImageNoteLink#calculateDimension`'s FULL
 * preferred box, and `inkBox` the smaller rectangle `ComponentRoseNote
 * #drawInternalU` actually paints (inset by `Rose.java:65-66`'s
 * `paddingX`/`paddingY`, both 5) — the same two-box distinction
 * `state-transition-label.ts#noteBoxFields` documents in full.
 */
export interface EdgeNoteBoxGeo {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly inkBox: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly noteLines: readonly EdgeNoteLine[];
}

/**
 * A2a/M9: `constraint on links: text`. `LinkConstraint#drawMe`
 * (`cucadiagram/LinkConstraint.java:82-103`) draws ONE dashed
 * `ULine(x2-x1, y2-y1)` from the FIRST constrained link's sampled point to
 * the SECOND's, plus the constraint text centred on that line's midpoint —
 * and it early-returns while either point is still unset, so the pair is
 * emitted exactly once, inside the SECOND link's group. This field is
 * therefore present on the second link of a constrained pair only.
 */
export interface EdgeConstraintGeo {
  readonly line: { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number };
  readonly text: string;
}

/** A2a/M10: one physical line of a tail/head quantifier — the same
 *  `{ text, x, y, width }` anchor shape `EdgeGeo.labelLines` carries.
 *  `x` is the line's left edge and `y` its baseline. */
export interface QuantifierLineGeo {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

/** A2a/M10: `[tailLines, headLines]` — `Display.getWithNewlines(...)
 *  .create(cardinalityFont, CENTER, skinParam)` over `getQuantifier1()`/
 *  `getQuantifier2()` (`SvekEdge.java:330-340`), one entry per physical
 *  line, stacked at `cardinalityFont.size`. An end carrying no quantifier
 *  (or whose position graphviz never placed) contributes an EMPTY array,
 *  never a hole, so `[0]`/`[1]` always mean tail/head. */
export type QuantifierLinesGeo = readonly [readonly QuantifierLineGeo[], readonly QuantifierLineGeo[]];
