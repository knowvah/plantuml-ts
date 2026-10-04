import { describe, expect, it } from 'vitest';
import { GtileLabel } from '../../../../src/diagrams/activity/tiles/gtile-label.js';
import { GtileSpot } from '../../../../src/diagrams/activity/tiles/gtile-spot.js';
import { GtileGoto } from '../../../../src/diagrams/activity/tiles/gtile-goto.js';

// mission add2-T2g: `GtileSpot`/`GtileLabel` no longer take a
// `bounder`/`theme` -- neither needs to MEASURE anything at tile-build
// time (`FtileCircleSpot`'s SIZE is a Java-hardcoded 20x20, never
// text-width-dependent; `FtileLabel`/`FtileGoto` are a zero-size
// `FtileEmpty`, drawn and sized through NEITHER argument). The circled
// character's own font size/colour is resolved at RENDER time instead
// (`activity-renderer-terminals.ts#renderSpot`, covered by
// `tests/unit/activity/renderer-shapes.test.ts`).

describe('GtileSpot', () => {
  it('is a fixed 20x20 circle regardless of the character (FtileCircleSpot.java:60)', () => {
    const short = new GtileSpot({ kind: 'spot', name: 'A' });
    const long = new GtileSpot({ kind: 'spot', name: 'W' });
    expect(short.width).toBe(20);
    expect(short.height).toBe(20);
    expect(long.width).toBe(20);
    expect(long.height).toBe(20);
  });

  it('tile.name/tile.color mirror the AST node', () => {
    const tile = new GtileSpot({ kind: 'spot', name: 'A', color: '#FF0000' });
    expect(tile.name).toBe('A');
    expect(tile.color).toBe('#FF0000');
  });

  it('color is undefined when the node carries none', () => {
    const tile = new GtileSpot({ kind: 'spot', name: 'A' });
    expect(tile.color).toBeUndefined();
  });

  it('hasPointOut() === true (FtileCircleSpot.java:116-117, 5-arg ctor)', () => {
    const tile = new GtileSpot({ kind: 'spot', name: 'A' });
    expect(tile.hasPointOut()).toBe(true);
  });
});

describe('GtileLabel', () => {
  it('is zero-size (FtileLabel extends FtileEmpty with no override)', () => {
    const tile = new GtileLabel({ kind: 'label', name: 'myLabel' });
    expect(tile.width).toBe(0);
    expect(tile.height).toBe(0);
  });

  it('tile.name matches input', () => {
    const tile = new GtileLabel({ kind: 'label', name: 'myLabel' });
    expect(tile.name).toBe('myLabel');
  });

  it('hasPointOut() === true (FtileEmpty.java:87-92, no outY sentinel)', () => {
    const tile = new GtileLabel({ kind: 'label', name: 'myLabel' });
    expect(tile.hasPointOut()).toBe(true);
  });
});

describe('GtileGoto', () => {
  it('is zero-size, same as GtileLabel', () => {
    const tile = new GtileGoto({ kind: 'goto', name: 'myLabel' });
    expect(tile.width).toBe(0);
    expect(tile.height).toBe(0);
  });

  it('tile.name matches input', () => {
    const tile = new GtileGoto({ kind: 'goto', name: 'myLabel' });
    expect(tile.name).toBe('myLabel');
  });

  it('hasPointOut() === false (FtileGoto.java:51-53, .withoutPointOut())', () => {
    const tile = new GtileGoto({ kind: 'goto', name: 'myLabel' });
    expect(tile.hasPointOut()).toBe(false);
  });
});
