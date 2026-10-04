import { describe, expect, it } from 'vitest';
import { GtilePartition } from '../../../../src/diagrams/activity/tiles/gtile-partition.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { HookName } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { GPoint } from '../../../../src/diagrams/activity/tiles/points.js';

// `FtileMarged.java:92-96` (`BODY_MARGIN`, `gtile-group.ts`'s own doc).
const BODY_MARGIN = 10;
// `FtileGroup.java:74` -- `diffYY2 = 20`.
const BOTTOM_PAD = 20;

const bounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({
    width: text.length * 7,
    height: 14,
  }),
};

// A REAL resolved theme, not a `{ fontSize, fontFamily } as unknown as
// Theme` stub. The tiles now resolve per-element style through
// `activityFontSize` (`activity-style-defaults.ts`), which reads
// `theme.colors.elements` -- a partial cast had no `colors` at all and
// threw. `fontSize` is kept at 13 so every assertion below that depends
// on the ROOT font is unchanged.
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

// Mission `activity-divergence-drive-2` T3g: hook-aware (unlike the prior
// flat `{ x: 0, y: 0 }` for every hook -- see `gtile-group.test.ts`'s own
// doc on this same change).
function makeTile(width: number, height: number, hasPointOut = true): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (hook: HookName): GPoint => ({ x: width / 2, y: hook === SOUTH_HOOK ? height : 0 }),
    hasPointOut: () => hasPointOut,
  };
}

/** `FtileGroup.java:140-143` -- `diffHeightTitle = max(25, dimTitle
 *  .getHeight() + 20)`. The stub `bounder` always measures height 14. */
const DIFF_HEIGHT_TITLE = Math.max(25, 14 + 20);

describe('GtilePartition — kind', () => {
  const body = makeTile(100, 50);
  const tile = new GtilePartition('Partition A', body, bounder, theme);

  it('kind === gtile-partition', () => {
    expect(tile.kind).toBe('gtile-partition');
  });
});

describe('GtilePartition — same geometry as GtileGroup', () => {
  const body = makeTile(100, 50);
  const tile = new GtilePartition('Hi', body, bounder, theme);

  it('width >= body.width + 2 * BODY_MARGIN', () => {
    expect(tile.width).toBeGreaterThanOrEqual(100 + 2 * BODY_MARGIN);
  });

  it('bodyOffsetY === diffHeightTitle', () => {
    expect(tile.bodyOffsetY).toBe(DIFF_HEIGHT_TITLE);
  });

  it('height === bodyOffsetY + body.height + BOTTOM_PAD', () => {
    expect(tile.height).toBe(tile.bodyOffsetY + body.height + BOTTOM_PAD);
  });

  it('children contains only the body tile', () => {
    expect(tile.children).toHaveLength(1);
    expect(tile.children[0]).toBe(body);
  });
});

describe('GtilePartition — long title drives width', () => {
  const title = 'A very long partition title here';
  const body = makeTile(100, 50);
  const tile = new GtilePartition(title, body, bounder, theme);
  const expectedTitleWidth = title.length * 7;

  it('width === titleWidth + 20 when title is wider', () => {
    expect(tile.width).toBe(expectedTitleWidth + 20);
  });
});

describe('GtilePartition — hooks', () => {
  const body = makeTile(100, 60);
  const tile = new GtilePartition('Zone', body, bounder, theme);

  it('NORTH_HOOK.y === bodyOffsetY (body.inY=0 + titleAndHeaderNoteHeight)', () => {
    expect(tile.getCoord(NORTH_HOOK).y).toBe(tile.bodyOffsetY);
  });

  it('SOUTH_HOOK.y === body.height + bodyOffsetY (NOT the frame-bottom-padded total height)', () => {
    expect(tile.getCoord(SOUTH_HOOK).y).toBe(body.height + tile.bodyOffsetY);
    expect(tile.getCoord(SOUTH_HOOK).y).not.toBe(tile.height);
  });

  it('EAST_HOOK.x === width', () => {
    expect(tile.getCoord(EAST_HOOK).x).toBe(tile.width);
  });

  it('WEST_HOOK.x === 0', () => {
    expect(tile.getCoord(WEST_HOOK).x).toBe(0);
  });
});

// GtilePartition inherits GtileGroup's hasPointOut() unmodified -- upstream
// partitions resolve through the same FtileGroup (FtileGroup.java:190-201)
// as composite/group frames, just a different USymbol.
describe('GtilePartition — hasPointOut() passes through the body (inherited)', () => {
  it('is false when the body has no out point', () => {
    const tile = new GtilePartition('Zone', makeTile(80, 40, false), bounder, theme);
    expect(tile.hasPointOut()).toBe(false);
  });
});
