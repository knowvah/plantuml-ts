/**
 * Unit tests for `walkWhile`'s `backward` handling (mission `activity-
 * divergence-drive` T3h -- `ConnectionBackBackward1`/`Backward2`,
 * `FtileWhile.java:154-161,313-408,561-562`). Uses REAL tile classes
 * (`GtileAction`/`GtileDiamondInside`/`GtileWhile`), the same idiom
 * `tile-coordinates.test.ts`'s own `walkWhile`-exercising tests already
 * use, rather than a duck-typed `WhileFrame` -- the frame's own
 * `backPos`/`backInLane`/`backOutLane` fields are computed INSIDE
 * `buildWhileFrame`, so a hand-built stub would have to re-derive them
 * (risking a tautology), while a real `GtileWhile` constructor derives
 * them from the same `backwardOffsetX/Y` this task's `gtile-while.ts`
 * change ports.
 */

import { describe, expect, it } from 'vitest';
import { walkWhile } from '../../../../src/diagrams/activity/layout/walk-while-branch.js';
import { GtileAction } from '../../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { GtileWhile } from '../../../../src/diagrams/activity/tiles/gtile-while.js';
import type { Out } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';

const bounder: StringBounder = {
  getDimension: (_text: string, _size: number) => ({ width: 60, height: 16 }),
};
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

function makeOut(): Out {
  let n = 0;
  return { nodes: [], edges: [], edgeMeta: [], reservations: [], nextId: (prefix: string) => `${prefix}${n++}` };
}

describe('walkWhile — backward unset: identical to the pre-T3h shape', () => {
  it('pushes header then body, no third node; 4 edges (In, Simple, Out x2)', () => {
    const header = new GtileDiamondInside('cond', {}, bounder, theme);
    const body = new GtileAction({ kind: 'action', label: 'body' }, bounder, theme);
    const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme });
    const out = makeOut();
    walkWhile(tile, 0, 0, undefined, out);

    // WORD (mission add2-T3b): `drawU` draws `whileBlock` BEFORE `diamond1`
    // (`FtileWhile.java:556-557`) -- the body's own node lands first. T3k:
    // `header` carries a real own label ('cond'), so `pushWhileHeader`
    // pushes a `'while-header'` polygon-only node plus a sibling
    // `'if-own-label'` text node, not a single combined node.
    expect(out.nodes.map((n) => n.kind)).toEqual(['action', 'while-header', 'if-own-label']);
    expect(out.edges).toHaveLength(4);
    expect(out.reservations).toHaveLength(1);
  });
});

describe('walkWhile — backward set (FtileWhile.java:154-161,313-408,561-562)', () => {
  function build() {
    const header = new GtileDiamondInside('cond', {}, bounder, theme);
    const body = new GtileAction({ kind: 'action', label: 'body' }, bounder, theme);
    const backward = new GtileAction({ kind: 'action', label: 'back' }, bounder, theme);
    const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme, backward: backward });
    const out = makeOut();
    walkWhile(tile, 0, 0, undefined, out);
    return { header, body, backward, tile, out };
  }

  it('pushes the backward node LAST among nodes (FtileWhile.java:561-562)', () => {
    const { out } = build();
    expect(out.nodes.map((n) => n.kind)).toEqual(['action', 'while-header', 'if-own-label', 'action']);
    expect(out.nodes[3]!.label).toBe('back');
  });

  it('5 edges: ConnectionIn, Backward1, Backward2, then ConnectionOut x2 -- ConnectionBackSimple is replaced, not added to', () => {
    const { out } = build();
    expect(out.edges).toHaveLength(5);
  });

  it('ConnectionBackBackward1 starts at the body’s own SOUTH_HOOK (the SAME point ConnectionBackSimple would use), no emphasize (FtileWhile.java:354)', () => {
    const { body, tile, out } = build();
    const bX = 0 + tile.bodyOffsetX;
    const bY = 0 + tile.bodyOffsetY;
    const backFrom = { x: bX + body.getCoord(SOUTH_HOOK).x, y: bY + body.getCoord(SOUTH_HOOK).y };
    expect(out.edges[1]!.points[0]).toEqual(backFrom);
    expect(out.edges[1]!.emphasize).toBeUndefined();
  });

  it('ConnectionBackBackward1 ends at backward’s own SOUTH_HOOK, elbowed at max(backFrom.y, bodyBottomY) + 12', () => {
    const { body, backward, tile, out } = build();
    const bX = 0 + tile.bodyOffsetX;
    const bY = 0 + tile.bodyOffsetY;
    const backFrom = { x: bX + body.getCoord(SOUTH_HOOK).x, y: bY + body.getCoord(SOUTH_HOOK).y };
    const bodyBottomY = bY + body.height;
    const y1bis = Math.max(backFrom.y, bodyBottomY) + 12;
    const backPos = { x: 0 + tile.backwardOffsetX, y: 0 + tile.backwardOffsetY };
    const backSouth = {
      x: backPos.x + backward.getCoord(SOUTH_HOOK).x,
      y: backPos.y + backward.getCoord(SOUTH_HOOK).y,
    };

    expect(out.edges[1]!.points).toEqual([
      backFrom,
      { x: backFrom.x, y: y1bis },
      { x: backSouth.x, y: y1bis },
      backSouth,
    ]);
    // The SAME reservation `ConnectionBackSimple`/`ConnectionBackEmpty` draw,
    // at the SAME (backFrom.x, y1bis) elbow (`hexagon-reservations.ts
    // #whileHexagonReservation`'s own doc).
    expect(out.reservations).toEqual([{ x: backFrom.x, y: y1bis, width: 5, height: 12 }]);
  });

  // BACKLBL (add2 T3i): FtileWhile.java:146,158-161 -- incoming1/incoming2.
  it('attaches backIncoming/backOutgoing onto Backward1/Backward2, undefined when unset', () => {
    const { out } = build();
    expect(out.edges[1]!.label).toBeUndefined();
    expect(out.edges[2]!.label).toBeUndefined();
  });

  it('a set backIncoming/backOutgoing lands on Backward1/Backward2 only', () => {
    const header = new GtileDiamondInside('cond', {}, bounder, theme);
    const body = new GtileAction({ kind: 'action', label: 'body' }, bounder, theme);
    const backward = new GtileAction({ kind: 'action', label: 'back' }, bounder, theme);
    const tile = new GtileWhile(header, body, {
      bounder,
      theme,
      backward,
      backIncoming: 'incoming',
      backOutgoing: 'dsc_5',
    });
    const out = makeOut();
    walkWhile(tile, 0, 0, undefined, out);
    expect(out.edges[1]!.label).toBe('incoming');
    expect(out.edges[2]!.label).toBe('dsc_5');
    expect(out.edges[0]!.label).toBeUndefined();
  });

  // T1b (`activity-divergence-drive-3`): `Snake.create(...).withLabel(back,
  // BOTTOM)` (`FtileWhile.java:354`/`:261-262`) for Backward1,
  // `arrowHorizontalAlignment()` (`:389-390`) for Backward2.
  it('Backward1 carries {vertical: BOTTOM}; Backward2 carries {horizontal: LEFT}', () => {
    const header = new GtileDiamondInside('cond', {}, bounder, theme);
    const body = new GtileAction({ kind: 'action', label: 'body' }, bounder, theme);
    const backward = new GtileAction({ kind: 'action', label: 'back' }, bounder, theme);
    const tile = new GtileWhile(header, body, {
      bounder,
      theme,
      backward,
      backIncoming: 'incoming',
      backOutgoing: 'dsc_5',
    });
    const out = makeOut();
    walkWhile(tile, 0, 0, undefined, out);
    expect(out.edges[1]!.labelAlign).toEqual({ vertical: 'BOTTOM' });
    expect(out.edges[2]!.labelAlign).toEqual({ horizontal: 'LEFT' });
  });

  it('ConnectionBackBackward2 runs backward’s own NORTH_HOOK -> header’s own EAST_HOOK, no emphasize (FtileWhile.java:386-407)', () => {
    const { header, backward, tile, out } = build();
    const hX = 0 + tile.headerOffsetX;
    const hY = 0 + tile.headerOffsetY;
    const headerEast = { x: hX + header.getCoord(EAST_HOOK).x, y: hY + header.getCoord(EAST_HOOK).y };
    const backPos = { x: 0 + tile.backwardOffsetX, y: 0 + tile.backwardOffsetY };
    const backNorth = {
      x: backPos.x + backward.getCoord(NORTH_HOOK).x,
      y: backPos.y + backward.getCoord(NORTH_HOOK).y,
    };

    expect(out.edges[2]!.points).toEqual([backNorth, { x: backNorth.x, y: headerEast.y }, headerEast]);
    expect(out.edges[2]!.emphasize).toBeUndefined();
  });

  it('ConnectionBackBackward2 is drawn even when the body has NO point out (unlike Backward1)', () => {
    const header = new GtileDiamondInside('cond', {}, bounder, theme);
    const body = new GtileAction({ kind: 'action', label: 'body' }, bounder, theme);
    Object.defineProperty(body, 'hasPointOut', { value: () => false });
    const backward = new GtileAction({ kind: 'action', label: 'back' }, bounder, theme);
    const tile = new GtileWhile(header, body, { bounder: bounder, theme: theme, backward: backward });
    const out = makeOut();
    walkWhile(tile, 0, 0, undefined, out);

    // ConnectionIn, Backward2 (Backward1 skipped), ConnectionOut x2.
    expect(out.edges).toHaveLength(4);
    expect(out.reservations).toHaveLength(0);
  });
});
