/**
 * `ElementDroplist` (ElementDroplist.java:56-118) against the 1.2026.8beta1
 * jar. `ElementFactoryDroplist` strips the outer `^`s
 * (ElementFactoryDroplist.java:57), so `^A^b^` reaches the constructor as
 * `A^b`:
 *
 * - `fixtures/widget-droplist.puml` — `This is a droplist`: 18 chars x 8 =
 *   144 reserved, + 4 + 12 = 160 by 12 + 4 = 16 (java:86-89).
 * - `fixtures/widget-droplist-open.puml` — `Smart Mode^m2`: the head is
 *   `Smart Mode` (java:78-84), the open list `m2` (java:63-75), drawn below
 *   the box at z-index 0 AND again at z-index 1 (java:110-116 is outside
 *   the `zIndex == 0` guard) — the jar SVG carries it twice.
 * - `fixtures/widget-droplist-open-two.puml` — `Select^one item^two`: a
 *   two-line open list, wider than nothing (`atLeast`, java:111).
 */
import { describe, expect, it } from 'vitest';
import { ElementDroplist } from '../../../../src/diagrams/salt/element/ElementDroplist.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FONT_12, stringBounder } from '../salt-test-support.js';
import { drawAt, jarElements } from './widget-test-support.js';

function droplist(text: string): ElementDroplist {
  return new ElementDroplist(text, FONT_12, new SaltDictionary());
}

describe('ElementDroplist#getPreferredDimension (java:86-89)', () => {
  it('is the reserved text width + 4 + box by the text height + 4: 160 x 16', () => {
    const dim = droplist('This is a droplist').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBe(160);
    expect(dim.getHeight()).toBe(16);
  });

  it('measures only the head before the first ^ (Smart Mode: 10 x 8 + 16 = 96)', () => {
    const dim = droplist('Smart Mode^m2').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBe(96);
    expect(dim.getHeight()).toBe(16);
  });
});

describe('ElementDroplist#drawU (java:91-117)', () => {
  it('draws the jar box, divider and arrow at z-index 0 (widget-droplist)', () => {
    expect(drawAt(droplist('This is a droplist'), 0)).toEqual(jarElements('widget-droplist'));
  });

  it('draws nothing at z-index 1 without an open list', () => {
    expect(drawAt(droplist('This is a droplist'), 1)).toEqual([]);
  });

  it('draws the box and the open list at z-index 0, then the open list again at z-index 1 (widget-droplist-open)', () => {
    const jar = jarElements('widget-droplist-open');
    expect(jar).toHaveLength(8);
    expect([...drawAt(droplist('Smart Mode^m2'), 0), ...drawAt(droplist('Smart Mode^m2'), 1)]).toEqual(jar);
    expect(drawAt(droplist('Smart Mode^m2'), 1)).toEqual(jar.slice(6));
  });

  it('stacks a two-entry open list (widget-droplist-open-two)', () => {
    const d = droplist('Select^one item^two');
    expect([...drawAt(d, 0), ...drawAt(d, 1)]).toEqual(jarElements('widget-droplist-open-two'));
  });

  it('skips empty tokens as StringTokenizer does: "A^^b" opens [b]', () => {
    expect(drawAt(droplist('A^^b'), 1)).toEqual(drawAt(droplist('A^b'), 1));
    expect(drawAt(droplist('A^b'), 1)).toHaveLength(2);
  });

  it('has no open list for a trailing ^ alone ("A^": one token, removed)', () => {
    expect(drawAt(droplist('A^'), 1)).toEqual([]);
  });

  it('has no open list for an empty text (no token to remove, java:68-72)', () => {
    expect(drawAt(droplist(''), 1)).toEqual([]);
  });

  it('a leading ^ empties the head but the first non-empty token is still removed ("^a^b" opens [b])', () => {
    const d = droplist('^a^b');
    expect(d.getPreferredDimension(stringBounder, 0, 0).getWidth()).toBe(
      droplist('').getPreferredDimension(stringBounder, 0, 0).getWidth(),
    );
    const open = drawAt(d, 1);
    expect(open).toHaveLength(2);
    expect(open[1]).toMatch(/>b<\/text>$/);
  });
});
