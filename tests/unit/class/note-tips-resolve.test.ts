/**
 * `note-tips-resolve.ts` -- the draw-time port of `EntityImageTips#drawU`
 * (mission note-leaf-model T3/D3). The stacking/notch arithmetic itself is
 * pinned by `note-layout.test.ts`'s member-tip block through the real
 * `mapNoteGeos` -> `resolveTips` chain; this file covers the branches that
 * block does not reach: the one-sided direction flip, an enhanced-body host,
 * a missing host, and NOTE leaves being ignored.
 */
import { describe, it, expect } from 'vitest';
import { resolveTips } from '../../../src/diagrams/class/note-tips-resolve.js';
import type { NoteGeo, ClassifierAnchor } from '../../../src/diagrams/class/note-layout.js';

const METRICS = { baselineOffset: 10, rowHeight: 13 };

function tip(id: string, member: string, position: 'left' | 'right', x: number, y = 0): NoteGeo {
  return {
    id, kind: 'tips', x, y, width: 80, height: 40, lines: ['hi'], lineWidths: [10], connector: [],
    target: 'A', tipRequest: { member, position, ...METRICS },
  };
}

const classicHost: ClassifierAnchor = {
  id: 'A', x: 100, y: 50,
  rows: [
    { text: 'A', y: 20, indent: 0 },
    { text: 'member1', y: 46.8889, width: 59.0625, indent: 6 },
  ],
};

describe('resolveTips -- EntityImageTips#drawU at draw time', () => {
  it('ignores NOTE leaves entirely (returns no entry for them)', () => {
    const plain: NoteGeo = { id: 'n', kind: 'note', x: 0, y: 0, width: 1, height: 1, lines: [], lineWidths: [], connector: [], target: 'A' };
    expect(resolveTips([plain], [classicHost]).size).toBe(0);
  });

  it('`position.reverseDirection()`: a LEFT-side tip seeds RIGHT, flipped to LEFT only when the host sits left of the note (x < 0)', () => {
    // note at x=200, host at x=100 -> xRaw = -100 < 0 -> RIGHT flips to LEFT
    const flipped = resolveTips([tip('t', 'member1', 'left', 200)], [classicHost]).get('t');
    expect(flipped).not.toBe('dropped');
    if (flipped === undefined || flipped === 'dropped') throw new Error('unreachable');
    expect(flipped.direction).toBe('left');
    // note at x=0, host at x=100 -> xRaw = 100 -> RIGHT stays RIGHT; pp2.x
    // uses the row's MIN x (flat ROW_TEXT_LEFT_MARGIN, 6): 100 - 0 + 6.
    const kept = resolveTips([tip('t', 'member1', 'left', 0)], [classicHost]).get('t');
    if (kept === undefined || kept === 'dropped') throw new Error('unreachable');
    expect(kept.direction).toBe('right');
    expect(kept.pp2.x).toBe(106);
    // pp2.y = host.y - note.y + (row.y - baselineOffset + rowHeight/2)
    expect(kept.pp2.y).toBeCloseTo(50 - 0 + (46.8889 - 10 + 6.5), 6);
    expect(kept.pp1).toEqual({ x: 0, y: 20 });
  });

  it('G2 N47: an enhanced-body host matches against its `enhancedBody` rows and tree rows, not the classic `rows`', () => {
    const enhancedHost: ClassifierAnchor = {
      id: 'A', x: 100, y: 50,
      rows: [{ text: 'A', y: 20, indent: 0 }], // header only -- no member content here
      enhancedBody: {
        width: 0, height: 0,
        parts: [
          { kind: 'divider', y: 30, strokeWidth: 1 },
          { kind: 'rows', rows: [{ text: 'attr', y: 46, width: 20, indent: 6 }] },
          { kind: 'tree', rows: [{ text: 'leaf', y: 60, width: 25, indent: 14 }], connectors: [] },
        ],
      },
    };
    const out = resolveTips([tip('r', 'attr', 'right', 200), tip('l', 'leaf', 'left', 200, 50)], [enhancedHost]);
    expect(out.get('r')).not.toBe('dropped');
    expect(out.get('l')).not.toBe('dropped');
    // classic-only lookup would have dropped both (header row is skipped)
    expect(resolveTips([tip('r', 'attr', 'right', 200)], [classicHost]).get('r')).toBe('dropped');
  });

  it('a host that is not a drawn classifier drops the WHOLE group (Error1/Error2 return before the loop)', () => {
    const out = resolveTips([tip('a', 'member1', 'right', 200), tip('b', 'member1', 'right', 200, 50)], []);
    expect(out.get('a')).toBe('dropped');
    expect(out.get('b')).toBe('dropped');
  });

  it('groups by (target, side): a failure on one side never aborts the other side', () => {
    const out = resolveTips(
      [tip('bad', 'typo', 'right', 200), tip('okR', 'member1', 'right', 200, 50), tip('okL', 'member1', 'left', 0)],
      [classicHost],
    );
    expect(out.get('bad')).toBe('dropped');
    expect(out.get('okR')).toBe('dropped'); // same group, after the abort
    expect(out.get('okL')).not.toBe('dropped'); // other side, its own group
  });
});
