/**
 * Unit tests for `GtileRepeat`'s optional `backward` child (mission
 * `activity-divergence-drive` T3h -- `FtileRepeat.java:84,92-99,701-717,
 * 750-757`). Companion to `gtile-repeat.test.ts`, which never passes a
 * `backward` tile.
 */

import { describe, expect, it } from 'vitest';
import { GtileRepeat } from '../../../../src/diagrams/activity/tiles/gtile-repeat.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { GPoint, HookName } from '../../../../src/diagrams/activity/tiles/points.js';
import type { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';

const bounder: StringBounder = {
  getDimension: (_text: string, _size: number) => ({ width: 0, height: 0 }),
};
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function makeTile(width: number, height: number, hasPointOut = true, left = width / 2): Tile {
  return {
    kind: 'stub',
    width,
    height,
    getCoord: (): GPoint => ({ x: left, y: 0 }),
    hasPointOut: () => hasPointOut,
  };
}

function makeDiamond(width: number, height: number) {
  return {
    kind: 'gtile-diamond-inside' as const,
    label: '',
    width,
    height,
    getCoord: (_hook: HookName): GPoint => ({ x: width / 2, y: 0 }),
    hasPointOut: () => true,
  } as unknown as GtileDiamondInside;
}

// Same T5-acceptance geometry as `gtile-repeat.test.ts`: body 40x60 (left
// 10), condition 50x40, entry 24x24 -> left=25, width=79 (no backward),
// height=220.
const entry = makeTile(24, 24);
const body = makeTile(40, 60, true, 10);
const condition = makeDiamond(50, 40);

describe('GtileRepeat — backward unset: byte-identical to the pre-T3h shape', () => {
  const tile = new GtileRepeat(entry, body, condition, 'simple2', { bounder, theme });

  it('width is the T5 acceptance value, unchanged (`FtileRepeat.java:710-711` only runs when backward != null)', () => {
    expect(tile.width).toBe(79);
  });

  it('backward is undefined', () => {
    expect(tile.backward).toBeUndefined();
  });

  it('backwardOffsetX/Y are 0 (unread by the walker in this branch)', () => {
    expect(tile.backwardOffsetX).toBe(0);
    expect(tile.backwardOffsetY).toBe(0);
  });
});

// `FtileRepeat.java:710-711`: `if (backward != null) width += backward.w;`
// -- applied BEFORE the final `+2*hexagonHalfSize` (`:709`), never widening
// `height` (`:713-714` has no backward term).
describe('GtileRepeat — backward set (FtileRepeat.java:710-711,750-757)', () => {
  const backward = makeTile(30, 20);
  const tile = new GtileRepeat(entry, body, condition, 'simple2', { bounder, theme, backward });

  it('width is the no-backward width (79) plus backward.width (30) = 109', () => {
    expect(tile.width).toBe(109);
  });

  it('height is unchanged by backward (still 220, same as the no-backward case)', () => {
    expect(tile.height).toBe(220);
  });

  it('backward is carried onto the instance', () => {
    expect(tile.backward).toBe(backward);
  });

  it('getTranslateBackward: x = width - backward.width, y = (height - backward.height) / 2', () => {
    expect(tile.backwardOffsetX).toBe(109 - 30);
    expect(tile.backwardOffsetY).toBe((220 - 20) / 2);
  });

  it('children stays the 3-tuple [entry, body, condition] -- backward excluded, mirroring getMyChildren()', () => {
    expect(tile.children).toHaveLength(3);
  });
});
