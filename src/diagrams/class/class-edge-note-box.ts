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
 * cdd3-T13r: the LABEL operand's offset inside the same merged block -- the
 * mirror of {@link noteOffset}. `TextBlockHorizontal#drawU` advances `x` by
 * each operand's width and centres it vertically (`klimt/shape/
 * TextBlockHorizontal.java:78-93`); `TextBlockVertical#drawU` advances `y`
 * by each operand's height and centres it horizontally
 * (`TextBlockVertical.java:77-99`). The label trails for `left`/`top` and
 * leads for `right`/`bottom` (`SvekEdge.java:318-325`).
 */
function labelOffset(
  position: 'left' | 'right' | 'top' | 'bottom',
  note: { width: number; height: number },
  label: { width: number; height: number },
  merged: { width: number; height: number },
): { x: number; y: number } {
  switch (position) {
    case 'left':
      return { x: note.width, y: (merged.height - label.height) / 2 };
    case 'right':
      return { x: 0, y: (merged.height - label.height) / 2 };
    case 'top':
      return { x: (merged.width - label.width) / 2, y: note.height };
    case 'bottom':
      return { x: (merged.width - label.width) / 2, y: 0 };
  }
}

/** The merged block's operand dimensions and top-left, shared by
 *  {@link computeEdgeNoteBox} and {@link labelOperandCenter}. */
interface MergedLayout {
  readonly noteDim: { width: number; height: number };
  readonly labelDim: { width: number; height: number };
  /** The label's OWN reservation (`computeReservedLabelBox`: width floored). */
  readonly labelReserved: { width: number; height: number };
  readonly merged: { width: number; height: number };
  readonly left: number;
  readonly top: number;
}

function mergedLayout(
  rel: Relationship & { linkNote: string },
  center: { x: number; y: number },
  font: FontSpec,
  measurer: StringMeasurer,
  noteCtx: NoteBoxContext,
): MergedLayout {
  const label = rel.label ?? '';
  const noteDim = measureLinkNoteDim(rel.linkNote, noteCtx.theme, measurer, noteCtx.sprites);
  const box = computeMergedLabelBox({
    label,
    noteDim,
    position: rel.linkNotePosition ?? 'bottom',
    // `eventuallyDivideByTwo` (`SvekEdge.java:440-442`): the table graphviz
    // centres on `labelX` is the halved one for both HALF_* strategies.
    halfWidth: rel.linkNoteHalfWidth ?? false,
    // T3e: mirrors `class-layout-edge-labels.ts#computeNoteMergedLabelAttrs`'s
    // own `hasMiddleDecor` (`rel.middleDecor !== undefined` is this port's
    // "not `LinkMiddleDecor.NONE`") -- this recovery MUST reproduce the same
    // merged box the reservation call built (this file's own header doc
    // comment: "the box graphviz laid out"), so a stale copy of that flag
    // here would silently re-diverge the two.
    hasMiddleDecor: rel.middleDecor !== undefined,
    font,
    measurer,
  });
  const labelBox = computeReservedLabelBox(label, font, measurer, false);
  return {
    noteDim,
    labelDim: { width: labelBox.measuredWidth + 2 * labelBox.marginLabel, height: labelBox.reservedHeight },
    // `appendTable` truncates BOTH table dims (`SvekEdge.java:504-507`).
    labelReserved: { width: labelBox.reservedWidth, height: Math.trunc(labelBox.reservedHeight) },
    merged: { width: box.measuredWidth, height: box.measuredHeight },
    left: center.x - box.reservedWidth / 2,
    top: center.y - box.reservedHeight / 2,
  };
}

/**
 * cdd3-T13r: the centre of the `labelOnly` operand inside a `note on link`
 * merged block (`SvekEdge.java:318-325`, drawn at `labelXY` by `:952-954`)
 * -- the anchor every main-label arm (`attachEdgeLabel`) positions from.
 * `labelOnly` carries `withMargin(marginLabel)` on both sides
 * (`SvekEdge.java:372-373`), inside the operand as it is inside a plain
 * label's own table. Returns
 * `center` unchanged when no note is merged (and for the `HALF_*` strategy,
 * which {@link computeEdgeNoteBox} does not model either).
 */
export function labelOperandCenter(
  rel: Relationship,
  center: { x: number; y: number },
  font: FontSpec,
  measurer: StringMeasurer,
  noteCtx: NoteBoxContext | undefined,
): { x: number; y: number } {
  const linkNote = rel.linkNote;
  if (noteCtx === undefined || linkNote === undefined || rel.linkNoteHalfWidth === true) return center;
  const m = mergedLayout({ ...rel, linkNote }, center, font, measurer, noteCtx);
  const off = labelOffset(rel.linkNotePosition ?? 'bottom', m.noteDim, m.labelDim, m.merged);
  // Every main-label arm turns its anchor back into the operand's top-left
  // as `center - reservation / 2` (graphviz's table corner, the label's OWN
  // floored reservation -- `portLabelAnchor`'s own doc comment), so hand it
  // the centre that reservation would have at this operand's corner.
  return { x: m.left + off.x + m.labelReserved.width / 2, y: m.top + off.y + m.labelReserved.height / 2 };
}

/**
 * Build {@link EdgeNoteBoxGeo} for a relationship carrying `note on link`.
 *
 * `center` is graphviz's own placement of the merged label box (this
 * port's `edgeResult.labelX`/`labelY`), so the block's top-left is
 * `center - reserved / 2` — the same corner convention every other class
 * edge-label anchor uses. `NoteLinkStrategy.HALF_NOT_PRINTED` draws
 * nothing at all (`SvekEdge.java:950-951`'s `link.getNote().getStrategy()
 * != HALF_NOT_PRINTED` guard), modelled as `Relationship
 * .linkNoteNotPrinted`. cdd3-T32: `HALF_PRINTED_FULL` DOES draw -- the full
 * merged block at `labelXY`, the corner of the HALF-width table
 * (`SvekEdge.java:314-316,440-442`), so `mergedLayout` reserves with the
 * relationship's own `linkNoteHalfWidth`.
 */
export function computeEdgeNoteBox(
  rel: Relationship,
  center: { x: number; y: number },
  font: FontSpec,
  measurer: StringMeasurer,
  noteCtx: NoteBoxContext,
): EdgeNoteBoxGeo | undefined {
  const linkNote = rel.linkNote;
  if (linkNote === undefined || rel.linkNoteNotPrinted === true) return undefined;
  const { noteDim, labelDim, merged, left, top } = mergedLayout({ ...rel, linkNote }, center, font, measurer, noteCtx);
  const offset =
    (rel.label ?? '').length === 0
      ? { x: 0, y: 0 }
      : noteOffset(rel.linkNotePosition ?? 'bottom', noteDim, labelDim, merged);
  const x = left + offset.x;
  const y = top + offset.y;
  const note = measureNote(linkNote, noteCtx.theme, measurer, noteCtx.sprites);
  return {
    x,
    y,
    width: noteDim.width,
    height: noteDim.height,
    // cdd3-T10: `drawInternalU` paints `x2 = (int) getTextWidth` by
    // `textHeight = (int) getTextHeight` (`ComponentRoseNote.java:107-109,
    // 118`; the area never exceeds the preferred box here, so `:114-116`'s
    // widening branch is dead) -- the text dims are the preferred box less
    // `2 * padding` (`:82-90`, no shadow on a link note).
    inkBox: {
      x: x + ROSE_NOTE_PADDING,
      y: y + ROSE_NOTE_PADDING,
      width: Math.trunc(noteDim.width - 2 * ROSE_NOTE_PADDING),
      height: Math.trunc(noteDim.height - 2 * ROSE_NOTE_PADDING),
    },
    noteLines: note.lines.map((text, i) => ({ text, width: note.lineWidths[i] ?? 0 })),
    // cdd2-T19c: carried through so the renderer can recover the merge's
    // operand order (`position`) and paint the note-on-link's own `#color`
    // (`back`/`line`) and creole/sprite atoms (`lineAtoms`) -- see
    // `EdgeNoteBoxGeo`'s own doc comments (class-geo-edge-extras.ts).
    position: rel.linkNotePosition ?? 'bottom',
    ...(rel.linkNoteBack !== undefined ? { back: rel.linkNoteBack } : {}),
    ...(rel.linkNoteLine !== undefined ? { line: rel.linkNoteLine } : {}),
    lineAtoms: note.lineAtoms,
  };
}
