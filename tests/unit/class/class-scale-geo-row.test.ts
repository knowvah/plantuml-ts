/**
 * Unit tests for `class-scale-geo-row.ts` (cdd-T29, D4) — the atom-kind
 * dispatch (image/bullet/vector), `genericTag`/`folderTab`/`symbolInk`/
 * `badgeSpriteImage` chrome scalers, and `scaleDashArrayString`, not
 * already covered by `class-scale-geo.test.ts`'s fixture-adjacent tests.
 */
import { describe, it, expect } from 'vitest';
import {
  scaleAtom,
  scaleGenericTag,
  scaleFolderTab,
  scaleBadgeSpriteImage,
  scaleDashArrayString,
} from '../../../src/diagrams/class/class-scale-geo-row.js';
import type { MemberRenderAtom } from '../../../src/diagrams/class/class-member-creole.js';
import type { GenericTagGeo } from '../../../src/diagrams/class/class-stereotype.js';

describe('scaleAtom — text', () => {
  it('multiplies renderWidth and dy when present (whitespace-run NBSP substitution / Sea baseline correction)', () => {
    const atom: MemberRenderAtom = {
      kind: 'text',
      text: '  ',
      font: { family: 'sans-serif', size: 10, color: null, styles: new Set() },
      width: 6,
      renderText: '  ',
      renderWidth: 8,
      dy: 3,
    };
    const scaled = scaleAtom(atom, 2);
    expect(scaled).toEqual({
      ...atom,
      font: { ...atom.font, size: 20 },
      width: 12,
      renderWidth: 16,
      dy: 6,
    });
  });
});

describe('scaleAtom — image', () => {
  it('multiplies width/height by k', () => {
    const atom: MemberRenderAtom = { kind: 'image', href: 'x.png', width: 10, height: 20 };
    expect(scaleAtom(atom, 0.5)).toEqual({ kind: 'image', href: 'x.png', width: 5, height: 10 });
  });
});

describe('scaleAtom — bullet', () => {
  it('multiplies width by k, leaves order/fill untouched', () => {
    const atom: MemberRenderAtom = { kind: 'bullet', order: 1, fill: '#000', width: 4 };
    expect(scaleAtom(atom, 2)).toEqual({ kind: 'bullet', order: 1, fill: '#000', width: 8 });
  });
});

describe('scaleAtom — vector', () => {
  it('multiplies width/height/factor by k', () => {
    const atom: MemberRenderAtom = { kind: 'vector', name: 'key', factor: 1, fill: '#000', width: 16, height: 14 };
    expect(scaleAtom(atom, 2)).toEqual({ kind: 'vector', name: 'key', factor: 2, fill: '#000', width: 32, height: 28 });
  });
});

describe('scaleGenericTag', () => {
  it('multiplies every numeric field, including line entries', () => {
    const tag: GenericTagGeo = {
      text: 'T',
      lines: [{ text: 'T', x: 1, y: 2, width: 3 }],
      rectX: 4,
      rectY: 5,
      rectWidth: 6,
      rectHeight: 7,
      textX: 8,
      textY: 9,
      textWidth: 10,
      fontFamily: 'sans-serif',
      fontSize: 12,
      italic: true,
    };
    const scaled = scaleGenericTag(tag, 2);
    expect(scaled).toEqual({
      text: 'T',
      lines: [{ text: 'T', x: 2, y: 4, width: 6 }],
      rectX: 8,
      rectY: 10,
      rectWidth: 12,
      rectHeight: 14,
      textX: 16,
      textY: 18,
      textWidth: 20,
      fontFamily: 'sans-serif',
      fontSize: 24,
      italic: true,
    });
  });
});

describe('scaleFolderTab', () => {
  it('multiplies every numeric field', () => {
    const tab = { width: 10, height: 8, wtitle: 6, htitle: 4, baselineOffset: 3 };
    expect(scaleFolderTab(tab, 2)).toEqual({ width: 20, height: 16, wtitle: 12, htitle: 8, baselineOffset: 6 });
  });
});

describe('scaleBadgeSpriteImage', () => {
  it('multiplies width/height, leaves href untouched', () => {
    const badge = { href: 'x.png', width: 10, height: 20 };
    expect(scaleBadgeSpriteImage(badge, 0.5)).toEqual({ href: 'x.png', width: 5, height: 10 });
  });
});

describe('scaleDashArrayString', () => {
  it('scales and reformats a two-number dash pattern', () => {
    expect(scaleDashArrayString('1,2', 2)).toBe('2,4');
  });

  it('drops a trailing zero via fmt when the scaled value is a whole number', () => {
    expect(scaleDashArrayString('5,5', 0.2)).toBe('1,1');
  });
});
