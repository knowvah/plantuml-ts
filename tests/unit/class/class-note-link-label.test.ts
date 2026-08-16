/**
 * Unit tests for T10's note-on-link merged label box in the class engine
 * (`class-layout-edge-labels.ts#computeRelLabelAttrs`/`NoteBoxContext`) --
 * routes `rel.linkNote` through `core/edge-label-box.ts#computeMergedLabelBox`
 * (T8), sourcing the note operand from `class-note-link-box.ts
 * #measureLinkNoteDim` (`EntityImageNoteLink`'s real `ComponentRoseNote`
 * dimension -- see that module's own doc comment), never a string measure.
 *
 * `noteCtx` is OPTIONAL and, as of this task, not yet threaded by any
 * production caller (orchestrator ruling 2026-08-16: further write-set
 * widening into class-dot-edges.ts/class-dot-graph.ts to reach a `Theme`
 * needs separate authorization) -- these tests activate the merge directly
 * via `edgeLabelAttrs`'s 5th argument, and also pin the interim "no noteCtx"
 * behavior that the (unmodified) production call site still exercises.
 *
 * Expected numbers are DERIVED from the real `WidthTableMeasurer` + the
 * SAME formulas `computeMergedLabelBox`/`computeReservedLabelBox`/
 * `measureLinkNoteDim` are cited as implementing (mirrors
 * `note-layout-measure.test.ts`'s own convention) -- never fitted literals.
 */
import { describe, it, expect } from 'vitest';
import { edgeLabelAttrs } from '../../../src/diagrams/class/class-layout-helpers.js';
import { measureLinkNoteDim } from '../../../src/diagrams/class/class-note-link-box.js';
import { measureNote } from '../../../src/diagrams/class/note-layout-measure.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { ARROW_LABEL_FONT_SIZE } from '../../../src/core/klimt/font/FontParam.js';
import type { Relationship } from '../../../src/diagrams/class/ast.js';

const measurer = new WidthTableMeasurer();
const font = { family: defaultTheme.fontFamily, size: ARROW_LABEL_FONT_SIZE };
const noteCtx = { theme: defaultTheme };
/** `class-layout-edge-labels.ts#LINK_LABEL_MARGIN` -- 1 for a non-self link. */
const LINK_LABEL_MARGIN = 1;

function rel(overrides: Partial<Relationship>): Relationship {
  return { from: 'A', to: 'B', type: 'association', ...overrides };
}

/** The label operand `computeMergedLabelBox` builds internally
 *  (`computeReservedLabelBox(label, font, measurer, false)`'s
 *  `measuredWidth + 2*marginLabel` / `reservedHeight`) -- reproduced here
 *  from the SAME cited formula so the merge tests below can assert the
 *  merged result without re-deriving `computeMergedLabelBox` itself. */
function labelOperand(label: string): { width: number; height: number } {
  const width = measurer.measure(label, font).width + 2 * LINK_LABEL_MARGIN;
  const height = 1 * font.size + 2 * LINK_LABEL_MARGIN; // single line, ReservedLabelBox never floors height
  return { width, height };
}

const noteOperand = (text: string): { width: number; height: number } =>
  measureLinkNoteDim(text, defaultTheme, measurer);

describe('edgeLabelAttrs — note-on-link merge, interim inert state (T10)', () => {
  it('ignores rel.linkNote when noteCtx is not supplied (production not yet wired)', () => {
    const r = rel({ label: 'Items', linkNote: 'Note on rel', linkNotePosition: 'bottom' });
    const attrs = edgeLabelAttrs(r, font, font, measurer);
    const plain = measurer.measure('Items', font);
    expect(attrs.label).toBe('Items');
    expect(attrs.labelWidth).toBe(plain.width + 2 * LINK_LABEL_MARGIN);
    expect(attrs.labelHeight).toBe(plain.height + 2 * LINK_LABEL_MARGIN);
  });
});

describe('edgeLabelAttrs — note-on-link merge, activated via noteCtx (T10)', () => {
  it('merges at position=bottom (default): mergeTB(label, note), shield=0, no halving', () => {
    // `Order --{ OrderItem:Items` / `note on link ... : Note on rel` shape,
    // minus lozego's `<$test>` sprite (see the sprite-gap test below).
    const r = rel({ label: 'Items', linkNote: 'Note on rel' });
    const attrs = edgeLabelAttrs(r, font, font, measurer, noteCtx);
    const labelDim = labelOperand('Items');
    const noteDim = noteOperand('Note on rel');
    const expectedWidth = Math.floor(Math.max(labelDim.width, noteDim.width));
    const expectedHeight = Math.floor(labelDim.height + noteDim.height);
    expect(attrs.label).toBe('Items');
    expect(attrs.labelWidth).toBe(expectedWidth);
    expect(attrs.labelHeight).toBe(expectedHeight);
  });

  it('does NOT double the label margin (withLabelMargin skips a linkNote-bearing rel)', () => {
    // If the outer withLabelMargin ran too, labelWidth would be 2px wider
    // than computeMergedLabelBox's own (already-margined) result.
    const r = rel({ label: 'Items', linkNote: 'Note on rel' });
    const attrs = edgeLabelAttrs(r, font, font, measurer, noteCtx);
    const labelDim = labelOperand('Items');
    const noteDim = noteOperand('Note on rel');
    const doubled = Math.floor(Math.max(labelDim.width, noteDim.width) + 2 * LINK_LABEL_MARGIN);
    expect(attrs.labelWidth).not.toBe(doubled);
  });

  it('merges at position=left: mergeLR(note, label) -- widths sum, heights max', () => {
    const r = rel({ label: 'foo', linkNote: 'note red', linkNotePosition: 'left' });
    const attrs = edgeLabelAttrs(r, font, font, measurer, noteCtx);
    const labelDim = labelOperand('foo');
    const noteDim = noteOperand('note red');
    expect(attrs.labelWidth).toBe(Math.floor(noteDim.width + labelDim.width));
    expect(attrs.labelHeight).toBe(Math.floor(Math.max(noteDim.height, labelDim.height)));
  });

  it('merges at position=right: mergeLR(label, note) -- same totals as left (commutative)', () => {
    const r = rel({ label: 'Another link', linkNote: 'this is my note on right link\nand in blue', linkNotePosition: 'right' });
    const attrs = edgeLabelAttrs(r, font, font, measurer, noteCtx);
    const labelDim = labelOperand('Another link');
    const noteDim = noteOperand('this is my note on right link\nand in blue');
    expect(attrs.labelWidth).toBe(Math.floor(labelDim.width + noteDim.width));
    expect(attrs.labelHeight).toBe(Math.floor(Math.max(labelDim.height, noteDim.height)));
  });

  it('an empty label (note-only) passes the note dimension through unmerged', () => {
    // TextBlockUtils.mergeLR/mergeTB's own EMPTY_TEXT_BLOCK short-circuit
    // (computeMergedLabelBox's own doc comment) -- no corpus fixture in this
    // backlog reaches this shape, but the contract must hold.
    const r = rel({ linkNote: 'solo note' });
    const attrs = edgeLabelAttrs(r, font, font, measurer, noteCtx);
    const noteDim = noteOperand('solo note');
    expect(attrs.labelWidth).toBe(Math.floor(noteDim.width));
    expect(attrs.labelHeight).toBe(Math.floor(noteDim.height));
  });

  it('a note-bearing edge wins over linkConstraint (hasNoteLabelText precedence, SvekEdge.java:437)', () => {
    const r = rel({ linkNote: 'solo note', linkConstraint: true });
    const attrs = edgeLabelAttrs(r, font, font, measurer, noteCtx);
    // Not the 10x10 CONSTRAINT_SPOT -- the merge ran instead.
    expect(attrs.labelWidth).not.toBe(10);
    expect(attrs.labelHeight).not.toBe(10);
  });

  it("lozego-15-coci435's shape: the <$test> sprite atom measures 0x0 " +
      '(no SpriteDimsLookup threaded), so the box stays BELOW the oracle 137x135', () => {
    // Orchestrator finding (2026-08-16): creole-atoms-measure.ts:49-50
    // returns {width:0, height:0} for a sprite atom absent a
    // SpriteDimsLookup. Sprite threading is explicitly NOT authorized for
    // this task -- this test pins the gap rather than closing it.
    const r = rel({ label: 'Items', linkNote: '<$test>Note on rel' });
    const attrs = edgeLabelAttrs(r, font, font, measurer, noteCtx);
    const withoutSprite = measureNote('Note on rel', defaultTheme, measurer);
    const withSpriteToken = measureNote('<$test>Note on rel', defaultTheme, measurer);
    // The sprite token contributes nothing beyond what its own (zero-width)
    // atom would -- i.e. no wider than the bare text alone.
    expect(withSpriteToken.width).toBeLessThanOrEqual(withoutSprite.width + 1);
    expect(attrs.labelWidth).toBeLessThan(137);
    expect(attrs.labelHeight).toBeLessThan(135);
  });
});
