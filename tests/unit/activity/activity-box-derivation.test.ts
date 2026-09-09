/**
 * The activity box's DERIVED size (mission `activity-style-defaults`, T4).
 *
 * The port carried `ACTION_HEIGHT = 36` and `ACTION_H_PAD = 16` as fixed
 * constants. Upstream has neither: `FtileBox#calculateDimensionFtile`
 * (`ftile/vertical/FtileBox.java:237-243`) adds the resolved `Padding` to
 * both axes and floors the WIDTH only —
 *
 *   dimRaw = tb.calculateDimension(stringBounder);
 *   dimRaw = dimRaw.delta(padding.getLeft() + padding.getRight(),
 *                         padding.getBottom() + padding.getTop());
 *   dimRaw = dimRaw.atLeast(minimumWidth, 0);
 *
 * — the `0` being a literal, so there is NO minimum height on an action
 * box at all. The box height is therefore text height plus top and bottom
 * padding, and nothing else.
 *
 * D8 forbids substituting the `32` the jar emits on `bakopu-96-pudu086`.
 * The derivation below RETURNS 32 for one line at `FontSize 12` and
 * `Padding 10`; that is corroboration of the arithmetic, and the test says
 * so explicitly so nobody later mistakes it for the source.
 */
import { describe, it, expect } from 'vitest';

import { resolveTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import type { StringBounder } from '../../../src/diagrams/activity/tiles/tile.js';
import { GtileAction } from '../../../src/diagrams/activity/tiles/gtile-action.js';
import type { ActivityAction } from '../../../src/diagrams/activity/ast.js';
import {
  ACTIVITY_PADDING,
  ROOT_PADDING,
  activityBoxHeight,
  activityPadding,
} from '../../../src/diagrams/activity/activity-style-defaults.js';

const THEME = resolveTheme('default');

const bounder: StringBounder = {
  getDimension: (text: string, size: number) => ({ width: text.length * 10, height: size }),
};

function action(label: string): ActivityAction {
  return { kind: 'action', label };
}

describe('activityPadding', () => {
  it('is 10 for the action box — one number for all four sides', () => {
    // plantuml.skin:360. `Style#getPadding` parses through
    // `ClockwiseTopRightBottomLeft.read`, whose single-token case returns
    // `(v, v, v, v)` (klimt/geom/ClockwiseTopRightBottomLeft.java:74-77).
    expect(activityPadding('activity')).toBe(10);
    expect(ACTIVITY_PADDING).toBe(10);
  });

  it('is 0 for every kind declaring none — an absent Padding reads as none(), not as missing', () => {
    // The ROOT block declares no Padding at all (plantuml.skin:1-19), and
    // `read` returns `none()` for an absent value (:67-68).
    expect(ROOT_PADDING).toBe(0);
    for (const sname of ['activityBar', 'arrow', 'circle', 'composite', 'diamond', 'note'] as const) {
      expect(activityPadding(sname)).toBe(0);
    }
  });
});

describe('activityBoxHeight — derived, with no floor', () => {
  it('is text height plus top and bottom padding', () => {
    expect(activityBoxHeight(12, 'activity')).toBe(12 + 20);
    expect(activityBoxHeight(36, 'activity')).toBe(36 + 20);
  });

  it('imposes NO minimum height — upstream floors the width only', () => {
    // `atLeast(minimumWidth, 0)`, FtileBox.java:240. A one-pixel text block
    // yields a 21-high box, not a 36-high one; the old ACTION_HEIGHT floor
    // had no upstream counterpart.
    expect(activityBoxHeight(1, 'activity')).toBe(21);
    expect(activityBoxHeight(1, 'activity')).toBeLessThan(36);
  });

  it('reaches 32 for one line at FontSize 12 — CORROBORATION, never the source (D8)', () => {
    // The jar's action rect measures height="32" on bakopu-96-pudu086.
    // This test asserts that the ARITHMETIC lands there, which is why the
    // constant was derived rather than replaced: writing 32 directly would
    // be fitting a value to a golden, and it would stop tracking the moment
    // a fixture set its own FontSize or Padding.
    expect(activityBoxHeight(12, 'activity')).toBe(32);
  });
});

describe('GtileAction — the live box uses the derivation', () => {
  it('a single-line box is 32 high, not the old fixed 36', () => {
    const tile = new GtileAction(action('hello'), bounder, THEME);
    expect(tile.height).toBe(32);
  });

  it('a three-line box grows by exactly one font size per line', () => {
    const one = new GtileAction(action('a'), bounder, THEME);
    const three = new GtileAction(action('a\nb\nc'), bounder, THEME);
    expect(three.height - one.height).toBe(2 * 12);
  });

  it('grows with a user FontSize override — a fixed constant could not', () => {
    const themed: Theme = {
      ...THEME,
      colors: { ...THEME.colors, elements: { ...THEME.colors.elements, activity: { fontSize: 20 } } },
    };
    expect(new GtileAction(action('hello'), bounder, themed).height).toBe(20 + 20);
  });

  it('pads the width by the resolved 10 per side -- no floor at all by default (T2, D1)', () => {
    // `FtileBox.java:237-243` floors the width at `MinimumWidth`, unset = 0
    // (`ValueNull.java:61-63`); the port's own `ACTION_MIN_WIDTH = 120` was
    // deleted, not lowered, so the default theme applies no floor here.
    const label = 'abcdefghijklmno'; // 15 chars -> 150px
    expect(new GtileAction(action(label), bounder, THEME).width).toBe(150 + 2 * 10);
  });
});
