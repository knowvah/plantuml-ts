/**
 * `ClassGeometry`'s single leaf collection — mission `leaf-draw-order` T3:
 * folds `ClassGeometry.classifiers`/`.notes` into one `leaves` array,
 * mirroring jar's own single leaf collection (`Bibliotekon#allNodes()`,
 * `net/atmp/CucaDiagram.java`) that `GeneralImageBuilder
 * #createEntityImageBlock` dispatches over by leaf type, and this port's
 * own `state/state-geo-types.ts#StateNodeGeo.kind` precedent (states +
 * notes in one array). Split out of `class-geo-types.ts` (already at the
 * project's 500-line file-size cap — directional, must not grow) rather
 * than added there; guards/views are re-exported from `class-geo-types.ts`
 * so `ClassGeometry`'s own module stays the one public import site.
 *
 * `leaves` order: from T4 on, this order IS the draw order (mission
 * decision D3, `plans/leaf-draw-order/decisions.md`) — `leaves` is jar's
 * `bibliotekon.allNodes()`. T3 (this file) is a pure TYPE fold only: order
 * stays today's `[...classifiers, ...notes]` concatenation, unchanged.
 */
import type { ClassifierGeo } from './class-geo-types.js';
import type { NoteGeo } from './note-layout.js';

export type ClassLeafGeo = ClassifierGeo | NoteGeo;

/** Type guard: true iff `leaf` is a `NoteGeo` (discriminated on `kind` —
 *  `ClassifierGeo.kind` is a `ClassifierKind` value, disjoint from
 *  `'note'`/`'tips'`). */
export function isNoteGeo(leaf: ClassLeafGeo): leaf is NoteGeo {
  return leaf.kind === 'note' || leaf.kind === 'tips';
}

/** Type guard: true iff `leaf` is a `ClassifierGeo`. */
export function isClassifierGeo(leaf: ClassLeafGeo): leaf is ClassifierGeo {
  return !isNoteGeo(leaf);
}

/** View over `leaves`: every `ClassifierGeo`, in `leaves` order — D4
 *  (`plans/leaf-draw-order/decisions.md`): ink/uid helpers keep their
 *  existing array-parameter signatures, so callers pass this view instead
 *  of threading `leaves` itself through every helper. */
export function classifierLeaves(leaves: readonly ClassLeafGeo[]): ClassifierGeo[] {
  return leaves.filter(isClassifierGeo);
}

/** View over `leaves`: every `NoteGeo`, in `leaves` order (D4). */
export function noteLeaves(leaves: readonly ClassLeafGeo[]): NoteGeo[] {
  return leaves.filter(isNoteGeo);
}
