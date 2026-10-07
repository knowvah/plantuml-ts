import { describe, expect, it } from 'vitest';
import { GtileWithNotes } from '../../../../src/diagrams/activity/tiles/gtile-with-notes.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';

// `FtileWithNotes` (`ftile/vcompact/FtileWithNotes.java:73-226`): stub
// bounder mirrors `gtile-text-tiles.test.ts`'s own convention (7px/char
// width, 14px line height, independent of fontSize).
const bounder: StringBounder = {
  getDimension: (text: string) => ({ width: text.length * 7, height: 14 }),
};
const FONT_SIZE = 13;

function stubTile(width: number, height: number): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (hook) =>
      hook === NORTH_HOOK || hook === SOUTH_HOOK
        ? { x: width / 2, y: hook === NORTH_HOOK ? 0 : height }
        : { x: 0, y: 0 },
    hasPointOut: () => true,
  };
}

// One note's own outer (marged) box: width = text.length*7 + 21 (Opale
// margins) + 20 (NOTE_STACK_MARGIN, both sides); height = 14 + 10 + 20.
// 'n' (1 char): outer 48 x 44.

describe('GtileWithNotes — one note, LEFT only', () => {
  const tile = stubTile(100, 50);
  const t = new GtileWithNotes(tile, [{ text: 'n', position: 'left' }], bounder, FONT_SIZE);

  it('width = tile.width + leftStack.width (48), no gap', () => {
    expect(t.left?.width).toBe(48);
    expect(t.right).toBeNull();
    expect(t.width).toBe(148);
  });

  it('height = max(leftStack.height, 0, tile.height) -- tile dominates here', () => {
    expect(t.left?.height).toBe(44);
    expect(t.height).toBe(50);
  });

  it('tileOffsetX = leftStack.width; both centred vertically (equal height here, offsets 0)', () => {
    expect(t.tileOffsetX).toBe(48);
    expect(t.tileOffsetY).toBe(0);
    expect(t.leftOffsetY).toBe(3); // (50-44)/2
  });
});

describe('GtileWithNotes — one note, RIGHT only, note TALLER than the tile', () => {
  const tile = stubTile(100, 20);
  // 2-line note: outer height = 2*14 + 10 + 20 = 58, taller than tile (20).
  const t = new GtileWithNotes(tile, [{ text: 'a\nb', position: 'right' }], bounder, FONT_SIZE);

  it('height is dominated by the note stack, not the tile', () => {
    expect(t.right?.height).toBe(58);
    expect(t.height).toBe(58);
  });

  it('rightOffsetX = width - rightStack.width; tile is vertically centred within the taller composite', () => {
    expect(t.rightOffsetX).toBe(t.width - (t.right?.width ?? 0));
    expect(t.tileOffsetY).toBe((58 - 20) / 2);
  });
});

describe('GtileWithNotes — two notes, BOTH LEFT, stack flush (no gap, FtileWithNotes.java has no suppSpace use)', () => {
  const tile = stubTile(40, 20);
  const t = new GtileWithNotes(
    tile,
    [
      { text: 'n', position: 'left' },
      { text: 'nn', position: 'left' },
    ],
    bounder,
    FONT_SIZE,
  );

  it('left stack width = max across both notes; height = sum (flush, no gap)', () => {
    // 'n': outer 48; 'nn': 2*7+21+20=55.
    expect(t.left?.width).toBe(55);
    expect(t.left?.height).toBe(44 + 44);
    expect(t.left?.notes[1]!.y).toBe(44); // second note starts right after the first's outer height
  });

  it('right is unset (no right-side notes)', () => {
    expect(t.right).toBeNull();
  });
});

describe('GtileWithNotes — notes on BOTH sides', () => {
  const tile = stubTile(40, 20);
  const t = new GtileWithNotes(
    tile,
    [
      { text: 'left', position: 'left' },
      { text: 'right', position: 'right' },
    ],
    bounder,
    FONT_SIZE,
  );

  it('width = tile + left + right', () => {
    // 'left' (4 chars): 4*7+21+20=69. 'right' (5 chars): 5*7+21+20=76.
    expect(t.left?.width).toBe(69);
    expect(t.right?.width).toBe(76);
    expect(t.width).toBe(40 + 69 + 76);
  });

  it('hasPointOut() passes through the wrapped tile', () => {
    expect(t.hasPointOut()).toBe(true);
  });

  it('getCoord(NORTH_HOOK)/getCoord(SOUTH_HOOK) shift by tileOffsetX, not centred on the whole composite', () => {
    const north = t.getCoord(NORTH_HOOK);
    const south = t.getCoord(SOUTH_HOOK);
    expect(north.x).toBe(tile.getCoord(NORTH_HOOK).x + t.tileOffsetX);
    expect(south.x).toBe(north.x);
  });
});
