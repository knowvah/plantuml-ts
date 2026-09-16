import { describe, expect, it } from 'vitest';
import { emitDiamondLabels } from '../../../../src/diagrams/activity/layout/diamond-labels.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import type { Out } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

const labelBounder: StringBounder = {
  getDimension: (text: string, _size: number) => ({ width: text.length * 7, height: 13 }),
};

function makeOut(): Out {
  let n = 0;
  return {
    nodes: [],
    edges: [],
    edgeMeta: [],
    reservations: [],
    nextId: (prefix: string) => `${prefix}-${++n}`,
  };
}

describe('emitDiamondLabels', () => {
  it('pushes one if-label node per side whose labelAt is non-null, in the given order', () => {
    const diamond = new GtileDiamondInside('cond', { north: 'yes', west: 'no' }, labelBounder, theme);
    const out = makeOut();
    emitDiamondLabels(diamond, { x: 100, y: 200 }, ['north', 'west'], 'lane1', out);

    expect(out.nodes).toHaveLength(2);
    expect(out.nodes.every((n) => n.kind === 'if-label')).toBe(true);
    expect(out.nodes[0]!.label).toBe('yes');
    expect(out.nodes[1]!.label).toBe('no');
  });

  it('translates each label by the given origin (labelAt is diamond-local)', () => {
    const diamond = new GtileDiamondInside('cond', { north: 'yes' }, labelBounder, theme);
    const out = makeOut();
    const local = diamond.labelAt('north')!;
    emitDiamondLabels(diamond, { x: 100, y: 200 }, ['north'], undefined, out);

    expect(out.nodes[0]!.x).toBe(100 + local.x);
    expect(out.nodes[0]!.y).toBe(200 + local.y);
    expect(out.nodes[0]!.width).toBe(local.width);
    expect(out.nodes[0]!.height).toBe(local.height);
  });

  it('skips a side whose labelAt is null (unset slot)', () => {
    // Repeat's default condition (D1: FtileRepeat.java:150-151) never sets
    // north/west -- only south/east.
    const diamond = new GtileDiamondInside('cond', { east: 'yes', south: 'no' }, labelBounder, theme);
    const out = makeOut();
    emitDiamondLabels(diamond, { x: 0, y: 0 }, ['north', 'south', 'west', 'east'], undefined, out);

    expect(out.nodes).toHaveLength(2);
    expect(out.nodes.map((n) => n.label)).toEqual(['no', 'yes']);
  });

  it('pushes nothing when no side in the list is set', () => {
    const diamond = new GtileDiamondInside('cond', {}, labelBounder, theme);
    const out = makeOut();
    emitDiamondLabels(diamond, { x: 0, y: 0 }, ['north', 'south', 'west', 'east'], undefined, out);

    expect(out.nodes).toHaveLength(0);
  });

  it('assigns the given lane to every pushed label node', () => {
    const diamond = new GtileDiamondInside('cond', { north: 'yes' }, labelBounder, theme);
    const out = makeOut();
    emitDiamondLabels(diamond, { x: 0, y: 0 }, ['north'], 'swim1', out);

    expect(out.nodes[0]!.swimlane).toBe('swim1');
  });

  it('assigns no swimlane when lane is undefined', () => {
    const diamond = new GtileDiamondInside('cond', { north: 'yes' }, labelBounder, theme);
    const out = makeOut();
    emitDiamondLabels(diamond, { x: 0, y: 0 }, ['north'], undefined, out);

    expect(out.nodes[0]!.swimlane).toBeUndefined();
  });

  it('ids every pushed node via out.nextId("if-label")', () => {
    const diamond = new GtileDiamondInside('cond', { north: 'yes', west: 'no' }, labelBounder, theme);
    const out = makeOut();
    emitDiamondLabels(diamond, { x: 0, y: 0 }, ['north', 'west'], undefined, out);

    expect(out.nodes[0]!.id).toBe('if-label-1');
    expect(out.nodes[1]!.id).toBe('if-label-2');
  });
});
