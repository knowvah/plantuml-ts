/**
 * add4-T3c HRULE-INK: `FtileBox` draws a creole separator through
 * `MyStencil` (`FtileBox.java:125-135`) as a full-width `ULine`
 * (`UGraphicStencil.java:83-84`), which `LimitFinder#drawULine` records
 * exactly (`LimitFinder.java:179-182`), one px past the box rectangle's own
 * `x + width - 1` (`:184-188`). Goldens rendered through
 * `scripts/oracle-render.sh`.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture } from '../../../helpers/activity-text-position.js';
import { compareSvg } from '../../../oracle/svg-conformance/compare.js';
import { nodeFudge } from '../../../../src/diagrams/activity/layout/canvas-origin-fudge.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add4-T3c');

const RECT = { near: 1, far: -1 };
const RECT_WITH_HLINE = { near: 1, far: 0 };

describe('nodeFudge', () => {
  it.each([
    ['top\n----\nbottom', RECT_WITH_HLINE],
    ['top\n====\nbottom', RECT_WITH_HLINE],
    ['top\n....\nbottom', RECT_WITH_HLINE],
    ['top\n-- mid --\nbottom', RECT_WITH_HLINE],
    ['top\n____\nbottom', RECT],
    ['plain', RECT],
  ])('action %j: x fudge %j', (label, x) => {
    expect(nodeFudge({ kind: 'action', label })).toEqual({ x, y: RECT });
  });

  it('a rule only counts on an action (FtileBox), never a note', () => {
    expect(nodeFudge({ kind: 'note', label: 'a\n----\nb' }).x).toEqual({ near: 0, far: 0 });
  });

  it('a card keeps its own hline fudge; a package its polygon', () => {
    expect(nodeFudge({ kind: 'partition', usymbol: 'card' })).toEqual({ x: RECT_WITH_HLINE, y: RECT });
    expect(nodeFudge({ kind: 'partition', usymbol: 'package' })).toEqual({
      x: { near: 10, far: 10 },
      y: { near: 0, far: 0 },
    });
  });
});

describe('a ruled action inks its full width', () => {
  it.each([
    ['action-hrule-single', 'a title-centred body shifts by the 1 px of ink'],
    ['action-hrule-dotted', 'a dotted rule widens the canvas'],
  ])('%s: %s, equal to the jar', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
