/**
 * cdd6 T3g (D2): the `ElementColors` fields T3g adds, filled by
 * `collectElementStyleBuckets` from `<style> <sname> { ... }`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/Style.java:265,330-332,345-347
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/HorizontalAlignment.java:49-60
 */
import { describe, it, expect } from 'vitest';
import { collectElementStyleBuckets } from '../../../src/core/style-map-element.js';
import { parseStyleBlock } from '../../../src/core/skinparam-style-block.js';
import { resolveElementMaximumWidth } from '../../../src/core/theme-element-resolve.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';

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

  it('<sname> { MaximumWidth N } -> maximumWidth (nadedo-37-nesa665)', () => {
    expect(buckets('json {\n  MaximumWidth 200\n  MinimumWidth 200\n}').json).toMatchObject({
      maximumWidth: 200,
      minimumWidth: 200,
    });
  });

  it('<sname> { HorizontalAlignment } -> upper-case token; an unknown value is dropped', () => {
    expect(buckets('note {\n  HorizontalAlignment center\n}').note?.horizontalAlignment).toBe('CENTER');
    expect(buckets('note {\n  HorizontalAlignment Right\n}').note?.horizontalAlignment).toBe('RIGHT');
    expect(buckets('note {\n  HorizontalAlignment middle\n}').note).toBeUndefined();
  });
});

describe('resolveElementMaximumWidth (Style#wrapWidth)', () => {
  const withJson = (maximumWidth: number | undefined, wrapWidth: number | undefined): Theme => ({
    ...defaultTheme,
    ...(wrapWidth === undefined ? {} : { wrapWidth }),
    colors: { ...defaultTheme.colors, elements: maximumWidth === undefined ? {} : { json: { maximumWidth } } },
  });

  it('the SName bucket wins over skinparam wrapWidth', () => {
    expect(resolveElementMaximumWidth(withJson(200, 80), 'json')).toBe(200);
  });

  it('falls back to skinparam wrapWidth (FromSkinparamToStyle.java:250, SName.element)', () => {
    expect(resolveElementMaximumWidth(withJson(undefined, 80), 'json')).toBe(80);
  });

  it('neither set -> undefined (no wrap)', () => {
    expect(resolveElementMaximumWidth(withJson(undefined, undefined), 'json')).toBeUndefined();
  });
});

// isw-T2b-ca: a bare diagram-type selector's own declarations are signed
// `{<diagram>}` (`style/parser/Context.java:68-100,127-139`) and reach every
// element of that diagram (`StyleStorage.java:102-116`) -- collected into a
// bucket keyed by the diagram SName, beside (not into) the nested buckets.
describe('collectElementStyleBuckets — bare diagram-type selector', () => {
  it('activityDiagram { MaximumWidth N } -> the activitydiagram bucket', () => {
    const b = buckets('activityDiagram {\n  MaximumWidth 100\n  diamond {\n    FontColor green\n  }\n}');
    expect(b.activitydiagram).toEqual({ maximumWidth: 100 });
    expect(b.diamond?.maximumWidth).toBeUndefined();
    expect(b.diamond?.font).toBe('green');
  });

  it('a nested-only block creates no diagram bucket', () => {
    expect(buckets('activityDiagram {\n  diamond {\n    FontColor green\n  }\n}').activitydiagram).toBeUndefined();
  });
});
