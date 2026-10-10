/**
 * Pure arithmetic of `sequence-note-tile.ts` and the paths the jar fixtures do
 * not reach: a note written under a message.
 */
import { describe, it, expect } from 'vitest';

import { notePadding } from '../../../src/diagrams/sequence/sequence-note-tile.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { NoteGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

function notesOf(lines: readonly string[]): { notes: NoteGeo[]; centers: number[] } {
  const ast = parseSequence([...lines]) as SequenceDiagramAST;
  const geo = layoutSequence(ast, defaultTheme, new DeterministicMeasurer());
  return {
    notes: geo.events.filter((e): e is NoteGeo => e.kind === 'note'),
    centers: geo.participants.map((p) => p.centerX),
  };
}

describe('notePadding (ComponentRoseNote*.java constructors)', () => {
  it.each([
    ['note', HorizontalAlignment.LEFT, { top: 5, bottom: 5, left: 6, right: 15 }],
    ['note', HorizontalAlignment.CENTER, { top: 5, bottom: 5, left: 15, right: 15 }],
    ['rnote', HorizontalAlignment.CENTER, { top: 4, bottom: 4, left: 4, right: 4 }],
    ['hnote', HorizontalAlignment.LEFT, { top: 4, bottom: 4, left: 12, right: 12 }],
  ] as const)('%s / %s', (style, align, expected) => {
    expect(notePadding(style, align)).toEqual(expected);
  });
});

describe('a note written under a message', () => {
  // `CommunicationTileNoteRight#getNotePosition:105`: `posC + level * 5`, the
  // level counting the `++` this very message opens (IGNORE_FUTURE_DEACTIVATE),
  // then the component's own 5 inset.
  it('right of an activating message sits one live level right of the lifeline', () => {
    const { notes, centers } = notesOf(['A -> B ++ : go', 'note right: n']);
    expect(notes[0]!.x).toBe(centers[1]! + 5 + 5);
  });

  it('right of a deactivating message still sits at the level the `--` has not lowered', () => {
    const { notes, centers } = notesOf(['A -> B ++ : go', 'A -> B -- : again', 'note right: n']);
    expect(notes[0]!.x).toBe(centers[1]! + 5 + 5);
  });

  // `top`/`bottom` stay on the placement they had before `NoteTile` was
  // ported: 10 either side of the message's two lifelines.
  it('bottom keeps its legacy box, 10 left of the leftmost lifeline', () => {
    const { notes, centers } = notesOf(['A -> B : go', 'note bottom: n']);
    expect(notes[0]!.x).toBe(centers[0]! - 10);
    expect(notes[0]!.width).toBe(Math.trunc(centers[1]! - centers[0]! + 20));
  });
});
