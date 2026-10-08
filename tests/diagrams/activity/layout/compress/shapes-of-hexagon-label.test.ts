import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { ifOwnLabelShapes } from '../../../../../src/diagrams/activity/layout/compress/shapes-of-hexagon-label.js';
import type { ActivityNodeGeo } from '../../../../../src/diagrams/activity/activity-geometry.types.js';
import type { StringBounder } from '../../../../../src/diagrams/activity/tiles/tile.js';
import { resolveTheme } from '../../../../../src/core/theme.js';
import { compareSvg } from '../../../../oracle/svg-conformance/compare.js';
import { renderActivityFixture } from '../../../../helpers/activity-text-position.js';

const theme = resolveTheme('default');
const bounder: StringBounder = { getDimension: (text: string) => ({ width: text.length * 6, height: 11 }) };
const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '../../../../fixtures/activity/add4-T3a');

function ownLabel(label: string): ActivityNodeGeo {
  return { id: 'h', kind: 'if-own-label', x: 0, y: 0, width: 100, height: 46, label };
}

describe('ifOwnLabelShapes (SlotFinder#drawText per UText, SlotFinder.java:127-135)', () => {
  it('boxes each line on its own, never the joined string', () => {
    const shapes = ifOwnLabelShapes(ownLabel('no on\nseveral lines'), bounder, theme);
    expect(shapes.map((s) => s.width)).toEqual([5 * 6, 13 * 6]);
    expect(shapes.every((s) => s.kind === 'text')).toBe(true);
  });

  it('starts every LEFT line at the centred block left (FtileDiamondInside.java:94-96)', () => {
    const shapes = ifOwnLabelShapes(ownLabel('no on\nseveral lines'), bounder, theme);
    // add4-T3h: the block is the drawn Sheet measured through the same
    // bounder as the tile (6/char here), widest stripe `several lines`.
    const maxWidth = 13 * 6;
    expect(shapes.map((s) => s.x)).toEqual([50 - maxWidth / 2, 50 - maxWidth / 2]);
  });

  it('stacks baselines one floored line apart (AtomText.java:179-181)', () => {
    const [a, b] = ifOwnLabelShapes(ownLabel('one\ntwo'), bounder, theme);
    expect(b!.y - a!.y).toBe(11);
  });

  it('pekefu: the multi-line elseif hexagon renders equal to the jar', () => {
    const { ours, golden } = renderActivityFixture(FIXTURES, 'hex-multiline-elseif');
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
