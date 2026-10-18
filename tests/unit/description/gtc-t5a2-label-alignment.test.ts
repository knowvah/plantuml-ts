/**
 * gtc-T5a2 -- the edge label block's line alignment.
 * `SvekEdge.java:376-381` `getMessageTextAlignment`: `skinParam.getDefaultTextAlignment(CENTER)` for a
 * description diagram; `Display.java:648-649` (`create0`): a `\l`/`\r` marker's natural alignment overrides it.
 * Expected `x` of the short first line "ab" (width 14.462 inside a 38.35 wide block): jar probes
 * (scripts/oracle-render.sh) of `component a / component b / a --> b : <label>`.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const render = (prefix: string, label: string): string =>
  renderSync(`@startuml\n${prefix}component a\ncomponent b\na --> b : ${label}\n@enduml`, {
    measurer: new DeterministicMeasurer(),
  });

function shortLineX(svg: string): string | undefined {
  return /<g class="link"[\s\S]*?<text x="([\d.]+)"[^>]*>ab<\/text>/.exec(svg)?.[1];
}

const CENTRE = '43.834';
const RIGHT = '55.777';
const LEFT = '31.89';

describe('edge label line alignment', () => {
  it.each([
    ['centre by default', '', 'ab\\ndefghij', CENTRE],
    ['defaultTextAlignment right', 'skinparam defaultTextAlignment right\n', 'ab\\ndefghij', RIGHT],
    ['defaultTextAlignment left', 'skinparam defaultTextAlignment left\n', 'ab\\ndefghij', LEFT],
    ['\\r marker without skinparam', '', 'ab\\rdefghij', RIGHT],
    ['\\l marker without skinparam', '', 'ab\\ldefghij\\nk', LEFT],
    ['\\l marker beats defaultTextAlignment right', 'skinparam defaultTextAlignment right\n', 'ab\\ldefghij', LEFT],
    ['\\r marker beats defaultTextAlignment left', 'skinparam defaultTextAlignment left\n', 'ab\\rdefghij', RIGHT],
  ])('%s', (_name, prefix, label, x) => {
    expect(shortLineX(render(prefix, label))).toBe(x);
  });

  it('applies defaultTextAlignment to an ortho (xlabel) label too', () => {
    const svg = render('skinparam defaultTextAlignment right\nskinparam linetype ortho\n', 'ab\\ndefghij');
    expect(shortLineX(svg)).toBe('30.887');
  });
});
