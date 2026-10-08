import { describe, expect, it } from 'vitest';
import { dropRootShadowed, rootColoursOf } from '../../../src/core/style-root-shadowing.js';
import type { StyleSkinparamSegment } from '../../../src/core/style-skinparam-segments.js';

const skin = (entries: [string, string][]): StyleSkinparamSegment => ({ kind: 'skinparam', entries: new Map(entries) });
const style = (map: Record<string, Record<string, string>>): StyleSkinparamSegment => ({
  kind: 'style',
  styleMap: new Map(Object.entries(map).map(([k, v]) => [k, new Map(Object.entries(v))])),
});

describe('dropRootShadowed', () => {
  it('drops an earlier narrower FontColor skinparam a later root redeclares', () => {
    const out = dropRootShadowed([skin([['activityfontcolor', '#FFF']]), style({ root: { fontcolor: '#F00' } })]);
    expect(out[0]).toEqual({ kind: 'skinparam', entries: new Map() });
    expect(out[1]).toEqual(style({ root: { fontcolor: '#F00' } }));
  });

  it('keeps a skinparam that also declares a non-colour property', () => {
    const out = dropRootShadowed([skin([['activityfontsize', '12']]), style({ root: { fontcolor: '#F00' } })]);
    expect(out[0]).toEqual(skin([['activityfontsize', '12']]));
  });

  it('keeps declarations AFTER the last root', () => {
    const segments = [style({ root: { linecolor: '#FFF' } }), skin([['arrowcolor', '#0A0']])];
    expect(dropRootShadowed(segments)).toEqual(segments);
  });

  it('strips the colour from earlier element selectors but keeps stereotype ones', () => {
    const out = dropRootShadowed([
      style({ groupheader: { fontcolor: '#000', backgroundcolor: '#FFF' }, '.tag': { fontcolor: '#123' } }),
      skin([['defaultfontcolor', '#F00']]),
    ]);
    expect(out[0]).toEqual(style({ groupheader: { backgroundcolor: '#FFF' }, '.tag': { fontcolor: '#123' } }));
  });
});

describe('rootColoursOf', () => {
  it('maps defaultFontColor to root FontColor (FromSkinparamToStyle.java:157)', () => {
    expect(rootColoursOf(new Map([['defaultfontcolor', '#F00']]))).toEqual(new Map([['fontcolor', '#F00']]));
  });

  it('ignores narrower keys and conditional colours', () => {
    const entries = new Map([
      ['classfontcolor', '#F00'],
      ['defaultfontcolor', '#?black:white'],
    ]);
    expect(rootColoursOf(entries)).toEqual(new Map());
  });
});
