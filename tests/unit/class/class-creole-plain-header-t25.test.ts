/**
 * cdd-T25 — registering `FontStyle.PLAIN` (`src/core/klimt/creole/legacy/
 * CommandCreoleBuilder.ts`) end to end against the corpus fixture that
 * motivated it: diseka-11-gozu390 (`enum BookCategory as "<color:#888888>
 * <plain>Enumeration</plain></color>\nBookCategory"`).
 *
 * Jar oracle (`test-results/dot-cache/class/diseka-11-gozu390/in.svg`):
 * `<text x="40.681" y="22.889" fill="#888" font-size="14"
 * textLength="79.363" font-weight="700">Enumeration</text>`. Before this
 * task, `<plain>` was unregistered (`class-layout-header-creole.ts
 * #buildHeaderLine` treated the whole `<plain>Enumeration</plain>` run as
 * ONE literal-text atom) — the rendered text was the literal tag string at
 * `textLength` 175.438 (the tag characters measured as glyphs).
 *
 * `font-weight="700"` is a KNOWN, separately-diagnosed residual
 * (`.agent-notes/cdd-T25.md`): jar's `DriverTextSvg.java:93-103` falls back
 * to the classifier header's own BASE font face weight
 * (`skinparam classFontStyle bold`) even when `<plain>` clears the tracked
 * `styles` set, via a two-tier `FontConfiguration`/`UFontFace` split this
 * port's flat `FontConfiguration` (`shape/UText.ts`) does not model. NOT
 * asserted here — see the regression-guard test below, which pins the
 * TRUE (not force-fitted) current behavior instead.
 */
import { describe, expect, test } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';

const DISEKA_SOURCE = [
  '@startuml',
  'skinparam classFontStyle bold',
  'enum BookCategory as "<color:#888888><plain>Enumeration</plain></color>\\nBookCategory"',
  '@enduml',
].join('\n');

function svgOf(source: string): string {
  const out = renderSync(source, { measurer: new WidthTableMeasurer() });
  return typeof out === 'string' ? out : (out as { svg: string }).svg;
}

function headerTexts(svg: string): Array<{ text: string; fill: string; textLength: string }> {
  return [...svg.matchAll(/<text ([^>]*)>([^<]*)<\/text>/g)].map((m) => {
    const attrs = m[1] as string;
    const fill = /fill="([^"]*)"/.exec(attrs)?.[1] ?? '';
    const textLength = /textLength="([^"]*)"/.exec(attrs)?.[1] ?? '';
    return { text: m[2] as string, fill, textLength };
  });
}

describe('cdd-T25 — <plain> registered (diseka-11-gozu390)', () => {
  test('line 1 renders "Enumeration" (not the literal tag), textLength 79.363, fill #888', () => {
    const [line1] = headerTexts(svgOf(DISEKA_SOURCE));
    expect(line1).toEqual({ text: 'Enumeration', fill: '#888', textLength: '79.363' });
  });

  test('line 2 ("BookCategory") is untouched by the <plain>/<color:> scope on line 1', () => {
    const [, line2] = headerTexts(svgOf(DISEKA_SOURCE));
    expect(line2).toMatchObject({ text: 'BookCategory', fill: '#000' });
  });

  test('regression guard — a header with NO creole markup keeps its own bold (measurement-identity path unaffected)', () => {
    const svg = svgOf(['@startuml', 'skinparam classFontStyle bold', 'enum BookCategory', '@enduml'].join('\n'));
    expect(svg).toMatch(/<text[^>]*font-weight="700"[^>]*>BookCategory<\/text>/);
  });

  test('a bare "<plain>" with no matching "</plain>" (EOL form) still consumes to end of line', () => {
    // "a" (plain, pre-command) and "b" (PLAIN-tagged, legacyEol-consumed to
    // EOL) are two adjacent text atoms -- the tag itself must not survive
    // as literal text in either.
    const svg = svgOf(['@startuml', 'class "a<plain>b" as X', '@enduml'].join('\n'));
    expect(svg).not.toContain('<plain>');
    expect(svg).toMatch(/<text[^>]*>a<\/text><text[^>]*>b<\/text>/);
  });
});
