/**
 * Note-on-entity layout for class diagrams.
 *
 * PlantUML's Svek lays a `note <pos> of <Entity>` out as its own graphviz
 * node connected to the host by a connector edge. This module measures
 * notes, groups same-side notes on the same host into a single merged svek
 * node (see `groupNotes`), contributes the seam nodes + connector edges, and
 * maps the layout result back to `NoteGeo[]` for the renderer — one geo per
 * ORIGINAL note, stacked within its group's laid-out box. Kept separate from
 * layout.ts so the note feature doesn't grow that already-large module.
 *
 * G2/N13: member-tip notes (`note <left|right> of Class::member`, `invis`
 * groups below) draw via the Opale zigzag-notch mechanism instead of a
 * plain folded box + separate connector — `mapNoteGeos` now also resolves
 * each member-tip note's target row (fuzzy match, `note-opale.ts`) and
 * computes its notch anchor points; see that function's own doc comment.
 *
 * Split (500-line file cap) into a one-way dependency chain of sibling
 * modules -- this file is now a re-export barrel so every external import
 * site (`from './note-layout.js'`) keeps working unchanged:
 *   `note-layout-types.ts`   -- shared `NoteGeo`/`ClassifierAnchor` (leaf)
 *   `note-layout-measure.ts` -- note text measurement (leaf)
 *   `note-layout-groups.ts`  -- same-side/host grouping (depends on measure)
 *   `note-layout-tip.ts`     -- tip/geo resolution + `mapNoteGeos` entry
 *                                (depends on types, measure, groups)
 */
export type { NoteGeo, ClassifierAnchor } from './note-layout-types.js';
export { buildNoteGraphParts } from './note-layout-groups.js';
export { mapNoteGeos } from './note-layout-tip.js';
