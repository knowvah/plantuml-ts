/**
 * cdd4-T7b: the class-renderer consumers `!theme aws-orange` exposed
 * (mizupo-59-zala765).
 *
 * - The badge's radius AND glyph size read `FontParam.CIRCLED_CHARACTER`'s
 *   size through an explicit `defaultFontSize` (`SkinParam.java:450-455`,
 *   `:557-559`; `EntityImageClassHeader.java:171`), as the layout already did.
 * - `EntityImageClass`'s header split covers every `LeafType#LIKE_CLASS` kind
 *   (`abel/LeafType.java:85-91`), `annotation` included.
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const render = (body: string): string =>
  renderSync(`@startuml\n${body}\n@enduml`, { measurer: new WidthTableMeasurer() });

function entity(svg: string, name: string): string {
  const start = svg.indexOf(`data-qualified-name="${name}"`);
  return svg.slice(start, svg.indexOf('</g>', start));
}

describe('badge: CIRCLED_CHARACTER size through defaultFontSize', () => {
  it('draws radius 12/3+6 = 10 under defaultFontSize 12 (the box is sized for it)', () => {
    const cls = entity(render('skinparam defaultFontSize 12\nclass A'), 'A');
    expect(cls).toContain('rx="10" ry="10"');
  });

  it('keeps radius 11 without it (17/3+6)', () => {
    expect(entity(render('class A'), 'A')).toContain('rx="11" ry="11"');
  });

  it('draws the size-12 glyph captured for I, E and @, not the size-17 one', () => {
    const svg = render('skinparam defaultFontSize 12\ninterface I\nenum E\nannotation N');
    const size12 = render('skinparam circledCharacterFontSize 12\ninterface I\nenum E\nannotation N');
    const unset = render('interface I\nenum E\nannotation N');
    // The glyph relative to its badge center: the entities differ in width.
    const glyph = (s: string, n: string): string => {
      const e = entity(s, n);
      const [, cx, cy] = /<ellipse cx="([\d.]+)" cy="([\d.]+)"/.exec(e)!;
      const nums = /<path d="([^"]*)"/
        .exec(e)![1]!
        .match(/-?\d+(?:\.\d+)?/g)!
        .map(Number);
      return nums.map((v, i) => (v - Number(i % 2 === 0 ? cx : cy)).toFixed(3)).join(' ');
    };
    for (const n of ['I', 'E', 'N']) {
      expect(glyph(svg, n)).toBe(glyph(size12, n));
      expect(glyph(svg, n)).not.toBe(glyph(unset, n));
    }
  });
});

describe('header split: every LIKE_CLASS kind', () => {
  it('splits an annotation header like a class header', () => {
    const svg = render('skinparam classHeaderBackgroundColor #FF0000\nannotation N\nclass C');
    const rects = (n: string): number => (entity(svg, n).match(/<rect /g) ?? []).length;
    expect(rects('N')).toBe(4);
    expect(rects('N')).toBe(rects('C'));
  });
});
