/**
 * sdd2 T7k2 -- `CommunicationTileNoteTop#drawU` draws the wrapped tile under
 * `UTranslate.dy(note height + spacey)` (`:60`), so everything the message
 * draws moves, its label padder box included.
 */
import { describe, expect, it } from 'vitest';
import type { EventGeo, MessageGeo } from '../../../src/diagrams/sequence/ast.js';
import { shiftDrawn } from '../../../src/diagrams/sequence/sequence-layout-note.js';

describe('shiftDrawn', () => {
  it('moves a message and its labelPadder by dy, leaving earlier events', () => {
    const padder = { x: 5, y: 20, width: 30, height: 12, fill: '#EEE', stroke: '#000', roundCorner: 0 } as const;
    const before = { kind: 'message', y: 10, labelLines: [], labelPadder: padder } as unknown as MessageGeo;
    const moved = { kind: 'message', y: 40, labelLines: [], labelPadder: padder } as unknown as MessageGeo;
    const geos: EventGeo[] = [before, moved];
    shiftDrawn(geos, 1, 7);
    expect(moved.y).toBe(47);
    expect(moved.labelPadder).toEqual({ ...padder, y: 27 });
    expect(before.y).toBe(10);
    expect(before.labelPadder).toBe(padder);
  });

  it('leaves a message with no padder without one', () => {
    const m = { kind: 'message', y: 0, labelLines: [] } as unknown as MessageGeo;
    shiftDrawn([m], 0, 3);
    expect(m.labelPadder).toBeUndefined();
    expect(m.y).toBe(3);
  });
});
