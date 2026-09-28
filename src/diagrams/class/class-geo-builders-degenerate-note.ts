/**
 * class-geo-builders-degenerate-note.ts — the single-freestanding-note
 * branch of the degenerate-diagram skip, split out of `class-geo-
 * builders.ts` purely to keep that file under the project's 500-line cap
 * (cdd5-T4a, mirrors the existing `class-geo-builders-fields.ts` split
 * precedent — see that file's own doc comment). A pure move plus the new
 * `degenerateNoteGeo` function this task adds; no behavior change to
 * anything this file does not itself introduce.
 *
 * @see degenerateSingleClassifier in ./class-geo-builders.ts
 */
import type { ClassNote } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { measureNote } from './note-layout-measure.js';
import type { NoteGeo } from './note-layout.js';
import { applyClassDocumentMargin } from './layout-ink-extent.js';
import type { ClassGeometry } from './layout.js';

/**
 * `EntityImageDegenerated.java`'s translate delta -- shared by the
 * classifier branch (`class-geo-builders.ts#degenerateSingleClassifier`)
 * and the note branch below (both wrap the SAME upstream
 * `EntityImageDegenerated`, `GraphvizImageBuilder.java:216-221`); see
 * `degenerateSingleClassifier`'s own doc comment for the full margin
 * derivation.
 */
export const DEGENERATE_NEAR_MARGIN = 7;

/** The parse-side fields a degenerate note geo copies verbatim from its
 *  `ClassNote` -- split out purely to keep {@link degenerateNoteGeo} under
 *  the project's per-function NLOC cap; mirrors `note-layout-tip.ts
 *  #copiedNoteFields`'s identical shape (duplicated, not imported, for the
 *  same out-of-write-set reason as this file's own doc comment). */
function degenerateNoteCopiedFields(note: ClassNote): Pick<NoteGeo, 'target' | 'color' | 'stereotype' | 'url'> {
  return {
    ...(note.target !== undefined ? { target: note.target } : {}),
    ...(note.color !== undefined ? { color: note.color } : {}),
    ...(note.stereotype !== undefined ? { stereotype: note.stereotype } : {}),
    ...(note.url !== undefined ? { url: note.url } : {}),
  };
}

/** The degenerate note leaf itself (position + measured text) -- split out
 *  purely to keep {@link degenerateNoteGeo} under the project's
 *  per-function NLOC cap. */
function buildDegenerateNoteLeaf(note: ClassNote, theme: Theme, measurer: StringMeasurer): NoteGeo {
  const m = measureNote(note.text, theme, measurer, undefined);
  return {
    id: note.id,
    kind: 'note',
    x: DEGENERATE_NEAR_MARGIN,
    y: DEGENERATE_NEAR_MARGIN,
    width: m.width,
    height: m.height,
    lines: m.lines,
    lineWidths: m.lineWidths,
    lineAtoms: m.lineAtoms,
    lineHeights: m.lineHeights,
    lineDividers: m.lineDividers,
    lineTables: m.lineTables,
    connector: [],
    ...(note.creationIndex !== undefined ? { creationIndex: note.creationIndex } : {}),
    ...(note.phantomSlot !== undefined ? { phantomSlot: note.phantomSlot } : {}),
    ...degenerateNoteCopiedFields(note),
  };
}

/**
 * The single-note counterpart of `degenerateSingleClassifier`'s classifier
 * branch -- upstream's `single` entity (`GraphvizImageBuilder.java:214-221`)
 * is a NOTE leaf, routed through `GeneralImageBuilder.java:118-119`
 * ("if (leaf.getLeafType() == LeafType.NOTE) return new
 * EntityImageNote(leaf);") instead of `createEntityImageBlock`'s classifier
 * branch, then wrapped in the SAME `EntityImageDegenerated` (`:53,88`)
 * `delta = 7` translate. A lone freestanding note has no host/graph
 * position to measure from, so its geo is built directly from
 * `measureNote` -- the SAME per-note text measurement `buildNoteGraphParts`
 * (`note-layout-groups.ts`) uses for every OTHER (non-degenerate) note,
 * minus the graph node/connector that function builds for
 * grouping/routing (there is no host to connect to and no graphviz graph
 * to size a node for). Field-for-field mirror of `note-layout-tip.ts
 * #plainNoteGeo` (duplicated rather than imported: that module is outside
 * this task's write-set, T4a's own task spec) -- `connector: []` (no host,
 * no routed connector, matching a `'tips'` leaf's own empty-connector
 * convention, `NoteGeo.connector`'s doc comment).
 */
export function degenerateNoteGeo(note: ClassNote, theme: Theme, measurer: StringMeasurer): ClassGeometry {
  const geo = buildDegenerateNoteLeaf(note, theme, measurer);
  const rawDims = { width: geo.width + DEGENERATE_NEAR_MARGIN * 2, height: geo.height + DEGENERATE_NEAR_MARGIN * 2 };
  const totalDims = applyClassDocumentMargin(rawDims);
  return {
    totalWidth: totalDims.width,
    totalHeight: totalDims.height,
    rawWidth: rawDims.width,
    rawHeight: rawDims.height,
    leaves: [geo],
    edges: [],
    namespaces: [],
  };
}
