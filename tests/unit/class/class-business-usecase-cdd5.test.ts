/**
 * cdd5-T4b (class-business-usecase-dropped): `usecase/` is
 * `LeafType.USECASE_BUSINESS` (`CommandCreateElementFull2.java:236-237`),
 * whose USymbol is `USECASE_BUSINESS` (`abel/Entity.java:412-413`) -- a
 * larger ellipse with the business slash line. Expected numbers are the
 * jar's `xisora-84-faca166` golden.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseClassifierDecl } from '../../../src/diagrams/class/class-declaration-parser.js';

describe('business usecase', () => {
  it('parses `usecase/` as a usecase carrying the business keyword', () => {
    expect(parseClassifierDecl('usecase/ U1')).toMatchObject({ kind: 'usecase', usymbol: 'usecase/' });
    expect(parseClassifierDecl('usecase U1')?.usymbol).toBeUndefined();
  });

  it('sizes and draws the business ellipse with its slash (xisora-84-faca166)', () => {
    const svg = renderSync(['@startuml', 'allowmixing', 'usecase/ "usecase/"', '@enduml'].join('\n'), {
      measurer: new WidthTableMeasurer(),
    });
    expect(svg).toContain('<ellipse cx="60.154" cy="20.031" rx="53.154" ry="13.031" fill="#F1F1F1"');
    expect(svg).toMatch(/<text x="28.654" y="22.725"[^>]*>usecase\/<\/text>/);
    expect(svg).toContain('<line x1="109.071" y1="15.488" x2="95.14" y2="29.419"');
    expect(svg).toContain('width="126px"');
  });

  // cdd5-T5c (usecase-business-alignment, gejuvu-17-vufu851): the title
  // signature is `{root, element, <diagram>, usecase, business, title}`
  // (`EntityImageDescription.java:147-148` + `USymbolUsecase.java:67-70`),
  // which `plantuml.skin:452-454`'s `usecase { HorizontalAlignment center }`
  // matches by subsequence -- so each line is centred, not left-flush. Jar:
  // "test 15" at x=75.3, "multiline with alias" at x=41.7.
  it('centres every title line of a business usecase', () => {
    const svg = renderSync(
      ['@startuml', 'usecase/ test15 #cccccc as "', '    test 15', '    multiline with alias', '"', '@enduml'].join(
        '\n',
      ),
      { measurer: new WidthTableMeasurer() },
    );
    const texts = [...svg.matchAll(/<text x="([\d.]+)"[^>]*textLength="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({
      mid: Number(m[1]) + Number(m[2]) / 2,
      x: Number(m[1]),
      label: m[3],
    }));
    const first = texts.find((t) => t.label === 'test 15');
    const second = texts.find((t) => t.label === 'multiline with alias');
    expect(first?.x).toBeGreaterThan(second!.x + 30);
    expect(first?.mid).toBeCloseTo(second!.mid, 3);
  });
});
