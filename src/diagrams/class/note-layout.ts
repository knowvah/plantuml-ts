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
 * plain folded box + separate connector. Mission `note-leaf-model` D3: the
 * notch is resolved at DRAW time by `note-tips-resolve.ts` (as
 * `EntityImageTips#drawU` does); `mapNoteGeos` only stacks the tips and
 * bakes their `tipRequest` inputs — it reads no classifier.
 *
 * Split (500-line file cap) into a one-way dependency chain of sibling
 * modules -- this file is now a re-export barrel so every external import
 * site (`from './note-layout.js'`) keeps working unchanged:
 *   `note-layout-types.ts`   -- shared `NoteGeo`/`NoteLeafType`/`ClassifierAnchor` (leaf)
 *   `note-layout-measure.ts` -- note text measurement (leaf)
 *   `note-layout-groups.ts`  -- same-side/host grouping (depends on measure)
 *   `note-layout-tip.ts`     -- geo building + `mapNoteGeos` entry (depends
 *                                on types, measure, groups; reads no classifier)
 */
export type { NoteGeo, NoteLeafType, TipRequest, ClassifierAnchor } from './note-layout-types.js';
export { buildNoteGraphParts } from './note-layout-groups.js';
export { mapNoteGeos } from './note-layout-tip.js';
