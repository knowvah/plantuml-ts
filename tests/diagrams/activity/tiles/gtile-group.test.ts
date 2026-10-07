import { describe, expect, it } from 'vitest';
import { GtileGroup } from '../../../../src/diagrams/activity/tiles/gtile-group.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { HookName } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { GPoint } from '../../../../src/diagrams/activity/tiles/points.js';

// `FtileMarged.java:92-96` (`BODY_MARGIN`, `gtile-group.ts`'s own doc):
// the body is widened +20 and shifted +10 BEFORE any of this class's own
// title/frame math runs.
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

// Mission `activity-divergence-drive-2` T3g: hook-aware (unlike the
// prior flat `{ x: 0, y: 0 }` for every hook, which only "worked" because
// `GtileGroup#getCoord`'s own OLD formula ignored the body's in/out y
// entirely -- a realistic leaf tile's NORTH/SOUTH_HOOK.y differ, exactly
// like `gtile-action.ts`'s own `{0}`/`{height}`).
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
 *  .getHeight() + 20)`. The stub `bounder` always measures height 14, so
 *  every title in this file resolves to the same 34. */
const DIFF_HEIGHT_TITLE = Math.max(25, 14 + 20);

describe('GtileGroup — short title, body drives width', () => {
  // title = "Hi" => 2 chars * 7 = 14px wide; body = 100px wide.
  // margedBodyWidth = 100 + 20 = 120; titleWidth + 20 = 34 -- body wins.
  const body = makeTile(100, 50);
  const tile = new GtileGroup('Hi', body, bounder, theme);

  it('width >= body.width + 2 * BODY_MARGIN', () => {
    expect(tile.width).toBeGreaterThanOrEqual(100 + 2 * BODY_MARGIN);
  });

  it('width === 120 (body-driven)', () => {
    expect(tile.width).toBe(120);
  });

  it('kind === gtile-group', () => {
    expect(tile.kind).toBe('gtile-group');
  });

  it('title === "Hi"', () => {
    expect(tile.title).toBe('Hi');
  });
});

describe('GtileGroup — long title drives width', () => {
  // title = "A very long group title here" => 28 chars * 7 = 196px.
  // titleWidth + 20 = 216 vs margedBodyWidth 100 + 20 = 120 -- title wins.
  const title = 'A very long group title here';
  const body = makeTile(100, 50);
  const tile = new GtileGroup(title, body, bounder, theme);
  const expectedTitleWidth = title.length * 7;

  it('width === titleWidth + 20 when title is wider', () => {
    expect(tile.width).toBe(expectedTitleWidth + 20);
  });
});

// add4-T2b (PART-TITLE-CREOLE): the title is a creole `Display`
// (`FtileGroup.java:104-108`), so `[[url label]]` sizes as `label`.
describe('GtileGroup — creole title width', () => {
  it('a [[url label]] title is measured as its label', () => {
    const tile = new GtileGroup('[[https://google.com/ a long visible label]]', makeTile(10, 50), bounder, theme);
    expect(tile.width).toBe('a long visible label'.length * 7 + 20);
  });

  it('carries the backColor option (FtileGroup.java:94,101)', () => {
    const tile = new GtileGroup('T', makeTile(10, 50), bounder, theme, { backColor: '#Salmon' });
    expect(tile.backColor).toBe('#Salmon');
    expect(new GtileGroup('T', makeTile(10, 50), bounder, theme).backColor).toBeUndefined();
  });

  it('carries the usymbol option without changing the geometry (FtileGroup.java:190-203)', () => {
    const plain = new GtileGroup('T', makeTile(10, 50), bounder, theme);
    const card = new GtileGroup('T', makeTile(10, 50), bounder, theme, { usymbol: 'card' });
    expect(card.usymbol).toBe('card');
    expect([card.width, card.height]).toEqual([plain.width, plain.height]);
  });
});

describe('GtileGroup — bodyOffsetY', () => {
  const body = makeTile(100, 50);
  const tile = new GtileGroup('Title', body, bounder, theme);

  it('bodyOffsetY === diffHeightTitle', () => {
    expect(tile.bodyOffsetY).toBe(DIFF_HEIGHT_TITLE);
  });

  it('titleHeight === max(25, measured height + 20) (= max(25, 34) = 34)', () => {
    expect(tile.titleHeight).toBe(DIFF_HEIGHT_TITLE);
  });
});

describe('GtileGroup — total height', () => {
  const body = makeTile(100, 60);
  const tile = new GtileGroup('Grp', body, bounder, theme);

  it('height === bodyOffsetY + body.height + BOTTOM_PAD', () => {
    expect(tile.height).toBe(tile.bodyOffsetY + body.height + BOTTOM_PAD);
  });
});

describe('GtileGroup — children', () => {
  const body = makeTile(80, 40);
  const tile = new GtileGroup('G', body, bounder, theme);

  it('children contains only the body tile', () => {
    expect(tile.children).toHaveLength(1);
    expect(tile.children[0]).toBe(body);
  });
});

describe('GtileGroup — hooks', () => {
  const body = makeTile(100, 60);
  const tile = new GtileGroup('Test', body, bounder, theme);

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

// FtileGroup.java:190-201 `calculateDimensionFtile`: `if
// (orig.hasPointOut()) return ...outY...; return ...(no outY)`, i.e. a
// group/partition frame passes its single body's hasPointOut straight
// through.
describe('GtileGroup — hasPointOut() passes through the body', () => {
  it('is true when the body has an out point', () => {
    const tile = new GtileGroup('G', makeTile(80, 40, true), bounder, theme);
    expect(tile.hasPointOut()).toBe(true);
  });

  it('is false when the body has none (e.g. ends in a stop)', () => {
    const tile = new GtileGroup('G', makeTile(80, 40, false), bounder, theme);
    expect(tile.hasPointOut()).toBe(false);
  });
});
