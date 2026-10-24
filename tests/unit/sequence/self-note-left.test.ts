/**
 * sdd3-T1b: a `note left` on a self message ends at the loop's `getMinX`.
 *
 * Expected values cite the Java, never this port's own output.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/CommunicationTileSelfNoteLeft.java:108-114,152-159
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/CommunicationTileSelf.java:263-270
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseSelfArrow.java:326-328
 */
import { describe, it, expect } from 'vitest';

import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { FrameGeo, NoteGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { SELF_ARROW_MIN_WIDTH } from '../../../src/diagrams/sequence/sequence-note-anchor.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

/** `LEFT_MARGIN`: where the leftmost tile of a diagram lands. */
const LEFT_MARGIN = 10;
/** `LIVE_DELTA_SIZE` (`LiveBoxes`): one activation level. */
const LIVE_DELTA = 5;
/** `ComponentRoseNote.getPaddingX()`, both sides of the note component. */
const NOTE_PADDING_BOTH_SIDES = 10;
/** `note` padding for a LEFT-aligned text (`ComponentRoseNote` constructor). */
const NOTE_TEXT_PADDING = 6 + 15;

/** `ComponentRoseSelfArrow.getDrawnWidth` floor `xRight` (`:348-352`). */
const SELF_ARROW_DRAWN_MIN_WIDTH = 42;
/** `GroupingTile.MARGINX` (`:90`). */
const GROUP_MARGIN_X = 16;

function laidOut(lines: readonly string[]): { note: NoteGeo; centerX: number } {
  const ast = parseSequence(sequenceSource([...lines])) as SequenceDiagramAST;
  const geo = layoutSequence(ast, defaultTheme, new DeterministicMeasurer());
  const note = geo.events.find((e): e is NoteGeo => e.kind === 'note')!;
  return { note, centerX: geo.participants[0]!.centerX };
}

/** `getPreferredWidth` of the one-letter note: text + paddings. */
const usedWidth = (note: NoteGeo): number => note.textRuns[0]!.textWidth + NOTE_TEXT_PADDING + NOTE_PADDING_BOTH_SIDES;

describe('note left on a self message (CommunicationTileSelfNoteLeft#getNotePosition)', () => {
  it('forward loop: the note ends at posC, the loop min (CommunicationTileSelf.java:263-265)', () => {
    const { note, centerX } = laidOut(['A -> A : x', 'note left : n']);
    expect(note.minX).toBeCloseTo(centerX - usedWidth(note), 6);
    expect(note.maxX).toBeCloseTo(centerX, 6);
  });

  it('reverse loop: the note ends at posC - getCompWidth (CommunicationTileSelf.java:266-269)', () => {
    const { note, centerX } = laidOut(['A <- A : x', 'note left : n']);
    // A short label: `max(getTextWidth, arrowWidth + 5)` is the 50 floor (ComponentRoseSelfArrow.java:326-328).
    expect(note.minX).toBeCloseTo(centerX - SELF_ARROW_MIN_WIDTH - usedWidth(note), 6);
  });

  it('reverse loop: the participant margin grows so the note clears the left margin (:152-159)', () => {
    const { note } = laidOut(['A <- A : x', 'note left : n']);
    // overflowLeft = posB - getMinX() > 0 -> ensureMarginBefore: nothing sits left of LEFT_MARGIN.
    expect(note.minX).toBeCloseTo(LEFT_MARGIN, 6);
  });

  it('reverse loop at activation level > 0 also clears the live bar (CommunicationTileSelf.java:266-269)', () => {
    const { note, centerX } = laidOut(['activate A', 'A <- A : x', 'note left : n']);
    expect(note.minX).toBeCloseTo(centerX - SELF_ARROW_MIN_WIDTH - LIVE_DELTA - usedWidth(note), 6);
  });
});

describe('a group frame folds the wrapper drawn min (CommunicationTileSelfNoteLeft#getDrawnMinX)', () => {
  it('frame x = loop drawn min - note width - MARGINX, not the note layout min', () => {
    const ast = parseSequence(sequenceSource(['group G', 'A <- A : x', 'note left : n', 'end'])) as SequenceDiagramAST;
    const geo = layoutSequence(ast, defaultTheme, new DeterministicMeasurer());
    const note = geo.events.find((e): e is NoteGeo => e.kind === 'note')!;
    const frame = geo.events.find((e): e is FrameGeo => e.kind === 'frame')!;
    const centerX = geo.participants[0]!.centerX;
    // CommunicationTileSelfNoteLeft.java:170-177: tile.getDrawnMinX() - width.
    const drawnMin = centerX - SELF_ARROW_DRAWN_MIN_WIDTH - usedWidth(note);
    expect(note.drawnMinX).toBeCloseTo(drawnMin, 6);
    // GroupingTile.java:211: min2.add(tile.getDrawnMinX().addFixed(-MARGINX)).
    expect(frame.x).toBeCloseTo(drawnMin - GROUP_MARGIN_X, 6);
    // The layout min (getMinX) is wider by compWidth - drawnWidth = 50 - 42.
    expect(note.minX).toBeCloseTo(drawnMin - (SELF_ARROW_MIN_WIDTH - SELF_ARROW_DRAWN_MIN_WIDTH), 6);
  });
});
