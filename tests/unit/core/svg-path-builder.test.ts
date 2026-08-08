/**
 * T7b — the shared `<path>` `d`-string builder (`src/core/svg-path-builder.ts`).
 *
 * The defect this module exists to prevent: before T7b, three class-engine
 * renderers (`class-namespace-shape.ts`, `renderer-note.ts`,
 * `note-opale.ts`) each hand-interpolated raw numbers into `M`/`L`/`A`/`C`
 * segments. That bypassed `svg.ts#attrs`'s formatting entirely, so once the
 * class engine's compensating `javaRound4` calls were removed (T6a-T6e) they
 * emitted raw floats -- `d="M8.5,6 L28.925000000000004,6 ..."`.
 *
 * Upstream has no such duplication: every coordinate reaches SVG through
 * `SvgGraphics#svgPath`, which formats each `UPath` segment via its own
 * `format()`. This module is that seam for the plain-string renderers.
 */
import { describe, it, expect } from 'vitest';

import { moveTo, lineTo, arcTo, cubicTo } from '../../../src/core/svg-path-builder.js';
import { fmt } from '../../../src/core/svg-format.js';
import { attrs } from '../../../src/core/svg.js';

describe('svg-path-builder', () => {
  describe('formats every coordinate, so no raw float reaches a d attribute', () => {
    it('moveTo trims to 3 decimals', () => {
      expect(moveTo(8.5, 6)).toBe('M8.5,6');
      // The exact regression: 28.925000000000004 is what the namespace
      // folder tab emitted once its javaRound4 wrapper was removed.
      expect(lineTo(28.925000000000004, 6)).toBe('L28.925,6');
    });

    it('lineTo rounds HALF_UP on the shortest round-trip decimal', () => {
      expect(lineTo(77.8125, 28.4805)).toBe('L77.813,28.481');
    });

    it('arcTo formats both radii and the endpoint', () => {
      expect(arcTo(31.425000000000004, 8.5, 3.75, 0, 1)).toBe('A3.75,3.75 0 0 1 31.425,8.5');
    });

    it('cubicTo formats all three control points', () => {
      expect(
        cubicTo({ x: 1.00005, y: 2 }, { x: 3, y: 4.9999 }, { x: 5.5, y: 6 }),
      ).toBe('C1,2 3,5 5.5,6');
    });

    it('emits no value with more than three decimal places', () => {
      const d = moveTo(28.925000000000004, 18.888888888) + ' ' + lineTo(1 / 3, 2 / 3);
      for (const n of d.match(/\d+\.\d+/g) ?? []) {
        expect(n.split('.')[1]!.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('agrees with the attrs() path — ADR-3, the rules must not drift', () => {
    // Acceptance criterion 4: a coordinate written into a hand-built `d`
    // string and the same coordinate written through attrs() must format
    // identically, or the two emission paths diverge for the same input.
    const VALUES = [0, 6, 8.5, 28.925000000000004, 77.8125, 28.4805, 19.418750000000003, -4.5];

    it.each(VALUES)('formats %p the same way in a path segment and an attribute', (v) => {
      // attrs() leads with a space -- it is appended straight after a tag
      // name (`<rect${attrs(...)}/>`), so the separator is part of its job.
      const viaAttrs = attrs([['x', v]] as const);
      expect(viaAttrs).toBe(` x="${fmt(v)}"`);
      expect(lineTo(v, 0)).toBe(`L${fmt(v)},0`);
    });
  });
});
