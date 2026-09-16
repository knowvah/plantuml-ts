import { describe, expect, it } from 'vitest';
import { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = {
  getDimension: (_text: string, _size: number) => ({ width: 0, height: 0 }),
};

// A REAL resolved theme, not a `{ fontSize, fontFamily } as unknown as
// Theme` stub. The tiles now resolve per-element style through
// `activityFontSize` (`activity-style-defaults.ts`), which reads
// `theme.colors.elements` -- a partial cast had no `colors` at all and
// threw. `fontSize` is kept at 13 so every assertion below that depends
// on the ROOT font is unchanged.
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function stubTile(width: number, height: number, hasPointOut = true): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: () => ({ x: 0, y: 0 }),
    hasPointOut: () => hasPointOut,
  };
}

// A stub whose NORTH_HOOK/SOUTH_HOOK.x IS `left`, distinct from
// `width / 2` -- exercises T6b's `FtileAssemblySimple`/`FtileGeometryMerger`
// alignment, which reads every child's own `left`, not its centre.
function stubTileAt(width: number, height: number, left: number, hasPointOut = true): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (hook) => (hook === NORTH_HOOK || hook === SOUTH_HOOK ? { x: left, y: 0 } : { x: 0, y: 0 }),
    hasPointOut: () => hasPointOut,
  };
}

// A trailing-note stand-in: `kind: 'gtile-note'` is the only thing
// `hasPointOut` inspects (`FtileWithNotes.java:195-212` -- a note is an
// attachment, not an AST sibling, so it never gets a vote).
function stubNote(width: number, height: number): Tile {
  return {
    kind: 'gtile-note',
    width,
    height,
    getCoord: () => ({ x: width / 2, y: 0 }),
    hasPointOut: () => true,
  };
}

describe('GtileTopDown — 0 children', () => {
  const tile = new GtileTopDown([], bounder, theme);

  it('width === 0', () => {
    expect(tile.width).toBe(0);
  });

  it('height === 0', () => {
    expect(tile.height).toBe(0);
  });

  it('childOffsets === []', () => {
    expect(tile.childOffsets).toEqual([]);
  });

  it('hasPointOut() === true when empty (FtileEmpty.java:91-92)', () => {
    expect(tile.hasPointOut()).toBe(true);
  });
});

describe('GtileTopDown — 1 child', () => {
  const child = stubTile(100, 50);
  const tile = new GtileTopDown([child], bounder, theme);

  it('width === 100', () => {
    expect(tile.width).toBe(100);
  });

  it('height === 50', () => {
    expect(tile.height).toBe(50);
  });

  it('childOffsets === [0]', () => {
    expect(tile.childOffsets).toEqual([0]);
  });
});

describe('GtileTopDown — 2 children', () => {
  // child0: w=100, h=50 → offset=0; after: y=70
  // child1: w=80,  h=30 → offset=70; after: y=120
  // height = 120 - 20 = 100
  const child0 = stubTile(100, 50);
  const child1 = stubTile(80, 30);
  const tile = new GtileTopDown([child0, child1], bounder, theme);

  it('width === 100 (max of 100, 80)', () => {
    expect(tile.width).toBe(100);
  });

  it('height === 100', () => {
    expect(tile.height).toBe(100);
  });

  it('childOffsets === [0, 70]', () => {
    expect(tile.childOffsets).toEqual([0, 70]);
  });
});

describe('GtileTopDown — hooks', () => {
  const child = stubTile(100, 50);
  const tile = new GtileTopDown([child], bounder, theme);

  it('NORTH_HOOK.y === 0', () => {
    expect(tile.getCoord(NORTH_HOOK).y).toBe(0);
  });

  it('SOUTH_HOOK.y === height', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(tile.height);
  });
});

// T6b: `FtileAssemblySimple.java:124-141` / `FtileGeometryMerger.java:44-56`
// -- children are aligned on their own `left` (NORTH_HOOK.x), not centred
// on the composite's width.
describe('GtileTopDown — siblings align on `left` (FtileAssemblySimple.java:124-141)', () => {
  it('left = max of child lefts; width = max(left - child.left + child.width) (FtileGeometryMerger.java:44-49)', () => {
    const c0 = stubTileAt(40, 10, 10);
    const c1 = stubTileAt(50, 10, 30);
    const c2 = stubTileAt(30, 10, 15);
    const tile = new GtileTopDown([c0, c1, c2], bounder, theme);

    expect(tile.left).toBe(30);
    // max(30-10+40, 30-30+50, 30-15+30) = max(60, 50, 45) = 60
    expect(tile.width).toBe(60);
    expect(tile.childOffsetsX).toEqual([20, 0, 15]);
  });

  it("a leaf's centre x equals a wider if-shaped sibling's left, not the composite's own centre", () => {
    // Stand-in for an `if` tile whose own left is 20px right of width/2
    // (`width: 100 -> width/2 = 50`, `left: 70`).
    const ifLike = stubTileAt(100, 40, 70);
    const start = stubTileAt(30, 20, 15); // a leaf: left === width/2
    const tile = new GtileTopDown([start, ifLike], bounder, theme);

    expect(tile.left).toBe(70);
    // start's local centre (15) offset by childOffsetsX[0] = 70-15=55 -> 70
    expect(tile.childOffsetsX[0]! + 15).toBe(70);
    // ifLike's own left, offset by childOffsetsX[1] = 70-70=0 -> 70
    expect(tile.childOffsetsX[1]! + 70).toBe(70);
  });

  it('symmetric children (left === width/2) reproduce the pre-T6b geometry exactly', () => {
    const a = stubTileAt(100, 50, 50); // left === width/2
    const b = stubTileAt(80, 30, 40); // left === width/2
    const tile = new GtileTopDown([a, b], bounder, theme);

    expect(tile.left).toBe(50);
    expect(tile.width).toBe(100); // unchanged from the pre-T6b max(100, 80)
    expect(tile.childOffsetsX).toEqual([0, 10]); // centres both at x=50
  });
});

describe("GtileTopDown — hasPointOut() is the LAST child's (FtileGeometryMerger.java:42-54)", () => {
  it('is true when the last child has an out point (an action)', () => {
    const tile = new GtileTopDown([stubTile(100, 50, false), stubTile(80, 30, true)], bounder, theme);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('is false when the last child has none (a stop)', () => {
    const tile = new GtileTopDown([stubTile(100, 50, true), stubTile(80, 30, false)], bounder, theme);
    expect(tile.hasPointOut()).toBe(false);
  });

  it("a single-child chain also takes that child's value", () => {
    const tile = new GtileTopDown([stubTile(100, 50, false)], bounder, theme);
    expect(tile.hasPointOut()).toBe(false);
  });
});

// T6b: `FtileWithNotes.java:195-212` -- a note is an attachment in the
// jar, not an `InstructionList` element, so it never decides `hasPointOut`.
describe('GtileTopDown — hasPointOut() skips trailing notes (FtileWithNotes.java:195-212)', () => {
  it('[stop, note]: false (the stop has no out point, the note is skipped)', () => {
    const tile = new GtileTopDown([stubTile(100, 50, false), stubNote(60, 30)], bounder, theme);
    expect(tile.hasPointOut()).toBe(false);
  });

  it('[action, note]: true (the action has an out point, the note is skipped)', () => {
    const tile = new GtileTopDown([stubTile(100, 50, true), stubNote(60, 30)], bounder, theme);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('[note] alone: true (no non-note child exists, FtileEmpty.java:91-92)', () => {
    const tile = new GtileTopDown([stubNote(60, 30)], bounder, theme);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('[action, note, note]: true -- multiple trailing notes are all skipped', () => {
    const tile = new GtileTopDown([stubTile(100, 50, true), stubNote(60, 30), stubNote(40, 20)], bounder, theme);
    expect(tile.hasPointOut()).toBe(true);
  });
});
