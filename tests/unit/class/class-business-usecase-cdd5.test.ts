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
});
