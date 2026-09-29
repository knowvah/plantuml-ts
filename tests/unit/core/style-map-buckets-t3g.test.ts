/**
 * cdd6 T3g (D2): the `ElementColors` fields T3g adds, filled by
 * `collectElementStyleBuckets` from `<style> <sname> { ... }`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:265
 */
import { describe, it, expect } from 'vitest';
import { collectElementStyleBuckets } from '../../../src/core/style-map-element.js';
import { parseStyleBlock } from '../../../src/core/skinparam-style-block.js';

function buckets(src: string) {
  return collectElementStyleBuckets(parseStyleBlock(src));
}

describe('collectElementStyleBuckets — T3g fields', () => {
  it('<sname> { HyperLinkColor } -> hyperlinkColor', () => {
    expect(buckets('component {\n  HyperLinkColor #FF0000\n}').component?.hyperlinkColor).toBe('#FF0000');
  });

  it('<sname> { .tag { HyperLinkColor } } -> hyperlinkColorByStereo under the cleaned tag', () => {
    const b = buckets('rectangle {\n  .My_Tag {\n    HyperLinkColor #00FF00\n  }\n}');
    expect(b.rectangle?.hyperlinkColorByStereo).toEqual({ mytag: '#00FF00' });
    expect(b.rectangle?.fontByStereo).toBeUndefined();
  });

  it('a tag selector with both FontColor and HyperLinkColor fills both maps', () => {
    const b = buckets('rectangle {\n  .t {\n    FontColor red\n    HyperLinkColor blue\n  }\n}');
    expect(b.rectangle?.fontByStereo).toEqual({ t: 'red' });
    expect(b.rectangle?.hyperlinkColorByStereo).toEqual({ t: 'blue' });
  });
});
