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

/**
 * cdd-T15 (A2a/M1, D6): the qualified-association box(es) on one link —
 * `svek/Kal.java`, built per qualified END (`SvekEdge.java:242-246`, drawn
 * at `:1015-1019` immediately before `ug.closeGroup()`).
 *
 * `start` is the box at `points[0]`'s end and `end` the box at
 * `points.at(-1)`'s end — i.e. upstream's `kal1` (`link.getEntity1()`) and
 * `kal2` (`getEntity2()`) respectively, since `class-edge-geo.ts
 * #normalizeEdgePoints` has already ordered the array entity1 → entity2.
 * Both are optional and independent: `ririlu-13-zipi740`'s
 * `HashMap [a1] <|-u-> [e] V1` carries both, `baneru-00-kuro607` only
 * `start`.
 *
 * INDEPENDENT of the `groupInheritance` sametail decor/dash suppression:
 * a qualified end and a grouped-inheritance end are two unrelated features
 * that can sit on the same edge, so suppression logic must leave this
 * field untouched.
 */
export interface EdgeKalBoxes {
  readonly start?: KalBox;
  readonly end?: KalBox;
}

import type { KalBox } from './class-kal.js';

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

/**
 * cdd-T16 (M7/E11): present only when `class-edge-geo.ts#buildEdgeGeos`
 * found this relationship's index in `EdgeGeoTextContext
 * .sametailByRelIndex` -- i.e. an extends-like link `skinparam
 * groupInheritance` grouped. `parentId` is the protected parent's
 * classifier id (`Relationship.idEntity1FullId`, upstream's
 * `link.getEntity1()` -- `dot/DotData.java:126`); `contact` is that
 * parent's RAW (pre-clip, padded-node) spline contact point --
 * `normalizedPts[0]`, since `normalizeEdgePoints` runs entity1 -> entity2
 * unconditionally (mirrors `SvekEdge#getStartContactPoint()`,
 * `dot/Neighborhood.java:74-76`). `renderer-group.ts
 * #renderGroupInheritanceNeighborhood` groups edges by `parentId` and
 * draws one shared triangle per unique `contact`.
 */
export interface SametailGeo {
  readonly parentId: string;
  readonly contact: { readonly x: number; readonly y: number };
}
