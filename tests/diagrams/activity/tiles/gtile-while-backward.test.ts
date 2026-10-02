/**
 * Unit tests for `GtileWhile`'s optional `backward` child (mission
 * `activity-divergence-drive` T3h -- `FtileWhile.java:85,110-121,575-596,
 * 566-573`). Companion to `gtile-while.test.ts`, which never passes one.
 */

import { describe, expect, it } from 'vitest';
import { GtileWhile } from '../../../../src/diagrams/activity/tiles/gtile-while.js';
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

function makeDiamond(width: number, height: number, left = width / 2) {
  return {
    kind: 'gtile-diamond-inside' as const,
    label: '',
    width,
    height,
    getCoord: (_hook: HookName): GPoint => ({ x: left, y: 0 }),
    hasPointOut: () => true,
  } as unknown as GtileDiamondInside;
}

// Same acceptance geometry as `gtile-while.test.ts`: header 60x40 (left
// 30), body 80x80 (left 40), no label.
const header = makeDiamond(60, 40);
const body = makeTile(80, 80);

describe('GtileWhile — backward unset: byte-identical to the pre-T3h shape', () => {
  const tile = new GtileWhile(header, body, bounder, theme);

  it('backward is undefined', () => {
    expect(tile.backward).toBeUndefined();
  });

  it('backwardOffsetX/Y are 0', () => {
    expect(tile.backwardOffsetX).toBe(0);
    expect(tile.backwardOffsetY).toBe(0);
  });
});

// `FtileWhile.java:587-589`: `if (backward != null) backwardWidth +=
// backward.calculateDimension().getWidth();` -- added into `width`
// (`:592`), never `height` (`:585` has no backward term) or `left`
// (`:593`).
describe('GtileWhile — backward set (FtileWhile.java:587-589,566-573)', () => {
  const noBackward = new GtileWhile(header, body, bounder, theme);
  const backward = makeTile(30, 20);
  const tile = new GtileWhile(header, body, bounder, theme, backward);

  it('width is the no-backward width plus backward.width', () => {
    expect(tile.width).toBe(noBackward.width + 30);
  });

  it('height and left are unchanged by backward', () => {
    expect(tile.height).toBe(noBackward.height);
    expect(tile.left).toBe(noBackward.left);
  });

  it('backward is carried onto the instance', () => {
    expect(tile.backward).toBe(backward);
  });

  it('getTranslateBackward: x = width - backward.width, y = (height - backward.height) / 2', () => {
    expect(tile.backwardOffsetX).toBe(tile.width - 30);
    expect(tile.backwardOffsetY).toBe((tile.height - 20) / 2);
  });

  it('children stays [header, body] -- backward excluded, mirroring getMyChildren()', () => {
    expect(tile.children).toHaveLength(2);
  });
});
