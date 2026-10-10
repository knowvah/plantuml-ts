/**
 * isw-T2b-obj: `<style> object|map|json { ... }` reaches the entity box, its
 * member rows and its header (EntityImageObject.java:93-134,
 * EntityImageMap.java:87-159, Style.java:241-253). The jar renders under
 * tests/fixtures/isw-T2b-obj/ are authored per property group.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { collectElementStyleBuckets } from '../../../src/core/style-map-element.js';
import { parseStyleBlock } from '../../../src/core/skinparam.js';
import type { ElementColors, Theme } from '../../../src/core/theme.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';
import {
  headerFontSpec,
  resolveHeaderFontOverride,
  resolveObjectBodyFont,
} from '../../../src/diagrams/class/object-kind-style.js';

const DIR = new URL('../../fixtures/isw-T2b-obj/', import.meta.url);

function diffsAgainstJar(name: string): string[] {
  const puml = readFileSync(new URL(`${name}.puml`, DIR), 'utf8');
  const jar = readFileSync(new URL(`${name}.svg`, DIR), 'utf8');
  const ours = renderSync(puml, { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, jar, 'deterministic').diffs.map((d) => JSON.stringify(d));
}

function themeWith(bucket: ElementColors): Theme {
  return { fontFamily: 'sans-serif', fontSize: 14, colors: { elements: { object: bucket } } } as unknown as Theme;
}

describe('object/map/json <style> against the jar', () => {
  it.each(['obj-body-font', 'obj-header-font', 'obj-stroke', 'map-style', 'json-style'])(
    '%s draws exactly the jar svg',
    (name) => {
      expect(diffsAgainstJar(name)).toEqual([]);
    },
  );
});

describe('object-kind font resolution', () => {
  it('body font reads FontName/FontSize/FontStyle of the sname bucket', () => {
    const theme = themeWith({ fontFamily: 'Helvetica', fontSize: 12, fontStyle: { bold: false, italic: true } });
    expect(resolveObjectBodyFont(theme, 'object', [])).toEqual({
      family: 'Helvetica',
      size: 12,
      bold: false,
      italic: true,
    });
  });

  it('body font falls back to the diagram default without a bucket', () => {
    expect(resolveObjectBodyFont(themeWith({}), 'map', [])).toEqual({
      family: 'sans-serif',
      size: 14,
      bold: false,
      italic: false,
    });
  });

  it('header { } wins over the sname value, property by property', () => {
    const theme = themeWith({
      fontSize: 12,
      fontStyle: { bold: false, italic: true },
      headerFontSize: 18,
      headerFontStyle: { bold: true, italic: false },
      headerFontFamily: 'Courier',
    });
    expect(resolveHeaderFontOverride(theme, 'object', [])).toEqual({ family: 'Courier', size: 18, bold: true });
  });

  it('header inherits the sname FontSize when header sets none', () => {
    expect(resolveHeaderFontOverride(themeWith({ fontSize: 16 }), 'object', [])).toEqual({ size: 16 });
  });

  it('a stereotype-scoped FontSize wins over header and plain sizes', () => {
    const theme = themeWith({ fontSize: 16, headerFontSize: 18, fontSizeByStereo: { foo1: 8 } });
    expect(resolveHeaderFontOverride(theme, 'object', ['Foo1']).size).toBe(8);
    expect(resolveObjectBodyFont(theme, 'object', ['Foo1']).size).toBe(8);
  });

  it('headerFontSpec maps flags to measurer weight/style', () => {
    expect(headerFontSpec(themeWith({}), { family: 'Courier', size: 18, bold: true, italic: true })).toEqual({
      family: 'Courier',
      size: 18,
      weight: 'bold',
      style: 'italic',
    });
  });
});

describe('<style> FontName/FontStyle collection', () => {
  const buckets = collectElementStyleBuckets(
    parseStyleBlock('map { FontName Helvetica\nFontStyle bold italic\nheader { FontName Courier\nFontStyle italic } }'),
  );
  it('fills the sname bucket and its header sub-selector', () => {
    expect(buckets['map']?.fontFamily).toBe('Helvetica');
    expect(buckets['map']?.fontStyle).toEqual({ bold: true, italic: true });
    expect(buckets['map']?.headerFontFamily).toBe('Courier');
    expect(buckets['map']?.headerFontStyle).toEqual({ bold: false, italic: true });
  });
  it('leaves non-object buckets to their skinparam population', () => {
    const other = collectElementStyleBuckets(parseStyleBlock('package { FontName Helvetica }'));
    expect(other['package']?.fontFamily).toBeUndefined();
  });
});
