import { describe, it, expect } from 'vitest';
import { HEADER_PADDING, CORNER_SIZE, groupingHeaderDisplay } from '../../../src/diagrams/sequence/frame-style.js';

// ---------------------------------------------------------------------------
// Constants — ComponentRoseGroupingHeader.java:64,76 (every style-owned
// value is the frame's paint since sdd1 T3a: `frame-paint.test.ts`)
// ---------------------------------------------------------------------------

describe('frame-style constants', () => {
  it('header padding matches ComponentRoseGroupingHeader.java:76 order', () => {
    expect(HEADER_PADDING).toEqual({ top: 1, right: 30, bottom: 1, left: 15 });
  });

  it('corner size matches ComponentRoseGroupingHeader.java:64', () => {
    expect(CORNER_SIZE).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// groupingHeaderDisplay — GroupingTile.java:126-127
// ---------------------------------------------------------------------------

describe('groupingHeaderDisplay', () => {
  it('a bare "group" draws the comment AS the tab text, no comment box', () => {
    expect(groupingHeaderDisplay('group', 'foo')).toEqual({ tabText: 'foo' });
  });

  it('a typed frame draws its title in the tab and comment beside it', () => {
    expect(groupingHeaderDisplay('alt', 'cond')).toEqual({
      tabText: 'alt',
      tabComment: 'cond',
    });
  });

  it('"group" with no comment falls back to an empty tab (Display.create(null))', () => {
    const result = groupingHeaderDisplay('group', undefined);
    expect(result.tabText).toBe('');
    expect(result.tabComment).toBeUndefined();
  });

  it('a typed frame with no comment omits the comment box', () => {
    const result = groupingHeaderDisplay('loop', undefined);
    expect(result.tabText).toBe('loop');
    expect(result.tabComment).toBeUndefined();
  });
});
