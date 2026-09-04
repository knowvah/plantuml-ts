import { describe, it, expect } from 'vitest';
import { dotSplinesAttrs } from '../../../src/core/dot-splines.js';

/**
 * lor-T1: `dotSplinesAttrs` is the shared contract two emitters will later
 * consume (D2) — this task is inert by construction, nothing sets
 * `DotInputGraph.linetype` yet, so no rendered fixture moves.
 */
describe('dotSplinesAttrs', () => {
  it('returns no attributes when linetype is undefined', () => {
    expect(dotSplinesAttrs(undefined)).toEqual([]);
  });

  it('returns only splines=polyline for polyline (D4: no forcelabels)', () => {
    const attrs = dotSplinesAttrs('polyline');
    expect(attrs).toEqual([['splines', 'polyline']]);
    expect(attrs).toHaveLength(1);
  });

  it('returns splines=ortho then forcelabels=true, in that order', () => {
    const attrs = dotSplinesAttrs('ortho');
    expect(attrs).toEqual([
      ['splines', 'ortho'],
      ['forcelabels', 'true'],
    ]);
    expect(attrs[0]).toEqual(['splines', 'ortho']);
    expect(attrs[1]).toEqual(['forcelabels', 'true']);
  });
});
