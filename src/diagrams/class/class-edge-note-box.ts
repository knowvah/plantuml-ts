/**
 * cdd-T6 (A2a/M5): the `note on link` operand of a class link's merged
 * label block.
 *
 * Split out of `class-edge-geo.ts` (500-line cap, pre-authorised).
 *
 * `SvekEdge.java:307-327` merges an `EntityImageNoteLink` block with the
 * label block — `mergeLR(noteOnly, labelOnly, CENTER)` for `Position.LEFT`,
 * `mergeLR(labelOnly, noteOnly, CENTER)` for `RIGHT`,
 * `mergeTB(noteOnly, labelOnly, CENTER)` for `TOP`, `mergeTB(labelOnly,
 * noteOnly, CENTER)` otherwise — and `:440-445` reserves the merged
 * dimension in the DOT label box. `:950-954` then draws the merged block at
 * `labelXY`'s own position, so the note's two `<path>`s and its `<text>`s
 * land inside `<g class="link">`.
 *
 * The RESERVATION half is already correct and is NOT recomputed here:
 * `class-layout-edge-labels.ts#computeNoteMergedLabelAttrs` feeds
 * `core/edge-label-box-note-merge.ts#computeMergedLabelBox`, whose result
 * this module calls again with the identical inputs purely to recover the
 * two operands' own dimensions — the merge is pure, so the box it returns
 * here is the box graphviz laid out.
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { computeMergedLabelBox, computeReservedLabelBox } from '../../core/edge-label-box.js';
import { measureLinkNoteDim } from './class-note-link-box.js';
import { measureNote } from './note-layout-measure.js';
import type { NoteBoxContext } from './class-layout-edge-labels.js';
import type { Relationship } from './ast.js';
import type { EdgeNoteBoxGeo } from './class-geo-edge-extras.js';

/** `Rose.java:65-66` — `paddingX`/`paddingY`, both 5; the inset between
 *  `EntityImageNoteLink`'s reported preferred box and the polygon
 *  `ComponentRoseNote#drawInternalU` actually paints. The state engine's
 *  `state-transition-label.ts#ROSE_NOTE_PADDING` carries the identical
 *  constant and the full jar derivation. */
const ROSE_NOTE_PADDING = 5;

/**
 * Where the note operand lands inside the merged block, as an offset from
 * that block's own top-left. `mergeLR` centres vertically and `mergeTB`
 * horizontally (`TextBlockHorizontal.java:79-91`,
 * `TextBlockVertical.java:79-102`); the note leads for `left`/`top` and
 * trails for `right`/`bottom` (`SvekEdge.java:318-325`).
 */
function noteOffset(
  position: 'left' | 'right' | 'top' | 'bottom',
  note: { width: number; height: number },
  label: { width: number; height: number },
  merged: { width: number; height: number },
): { x: number; y: number } {
  switch (position) {
    case 'left':
      return { x: 0, y: (merged.height - note.height) / 2 };
    case 'right':
      return { x: label.width, y: (merged.height - note.height) / 2 };
    case 'top':
      return { x: (merged.width - note.width) / 2, y: 0 };
    case 'bottom':
      return { x: (merged.width - note.width) / 2, y: label.height };
  }
}

/**
 * Build {@link EdgeNoteBoxGeo} for a relationship carrying `note on link`.
 *
 * `center` is graphviz's own placement of the merged label box (this
 * port's `edgeResult.labelX`/`labelY`), so the block's top-left is
 * `center - reserved / 2` — the same corner convention every other class
 * edge-label anchor uses. `NoteLinkStrategy.HALF_NOT_PRINTED` draws
 * nothing at all (`SvekEdge.java:950-951`'s `link.getNote().getStrategy()
 * != HALF_NOT_PRINTED` guard), which this port models as
 * `Relationship.linkNoteHalfWidth` — the only path that sets it
 * (`class-assoc-couple.ts`) is upstream's `HALF_*` path.
 */
export function computeEdgeNoteBox(
  rel: Relationship,
  center: { x: number; y: number },
  font: FontSpec,
  measurer: StringMeasurer,
  noteCtx: NoteBoxContext,
): EdgeNoteBoxGeo | undefined {
  if (rel.linkNote === undefined || rel.linkNoteHalfWidth === true) return undefined;
  const label = rel.label ?? '';
  const noteDim = measureLinkNoteDim(rel.linkNote, noteCtx.theme, measurer, noteCtx.sprites);
  const box = computeMergedLabelBox({
    label,
    noteDim,
    position: rel.linkNotePosition ?? 'bottom',
    halfWidth: false,
    // Always `LinkMiddleDecor.NONE` in this port -- see
    // `class-layout-edge-labels.ts#computeNoteMergedLabelAttrs`'s own
    // derivation of the same `hasMiddleDecor: false`.
    hasMiddleDecor: false,
    font,
    measurer,
  });
  const labelBox = computeReservedLabelBox(label, font, measurer, false);
  const labelDim = { width: labelBox.measuredWidth + 2 * labelBox.marginLabel, height: labelBox.reservedHeight };
  const merged = { width: box.measuredWidth, height: box.measuredHeight };
  const offset =
    label.length === 0 ? { x: 0, y: 0 } : noteOffset(rel.linkNotePosition ?? 'bottom', noteDim, labelDim, merged);
  const x = center.x - box.reservedWidth / 2 + offset.x;
  const y = center.y - box.reservedHeight / 2 + offset.y;
  const note = measureNote(rel.linkNote, noteCtx.theme, measurer, noteCtx.sprites);
  return {
    x,
    y,
    width: noteDim.width,
    height: noteDim.height,
    inkBox: {
      x: x + ROSE_NOTE_PADDING,
      y: y + ROSE_NOTE_PADDING,
      width: noteDim.width - 2 * ROSE_NOTE_PADDING,
      height: noteDim.height - 2 * ROSE_NOTE_PADDING,
    },
    noteLines: note.lines.map((text, i) => ({ text, width: note.lineWidths[i] ?? 0 })),
  };
}
