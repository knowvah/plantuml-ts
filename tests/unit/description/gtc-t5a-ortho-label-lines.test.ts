/**
 * gtc-T5a -- under `skinparam linetype ortho` the main link label is an xlabel
 * (`SvekEdge.java:434-441`), but it is still drawn as the label block
 * (`SvekEdge.java:951-954`), so the `Display` line splits (`\n`, `\l`, `\r`;
 * `Display.java#getWithNewlines`, :273-300) apply. `\rA. text` is the two lines
 * `""` / `"A. text"`: the empty line draws a blank `<text>`.
 * Expected values: a jar probe of this source (scripts/oracle-render.sh).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SRC = [
  '@startuml',
  'skinparam defaultTextAlignment right',
  'skinparam linetype ortho',
  'left to right direction',
  'component a',
  'component b',
  'component c',
  'a --> b : \\rA. text',
  'a --> c : x\\ny',
  'b --> c : p\\lq',
  '@enduml',
].join('\n');

function linkTexts(svg: string): string[][] {
  return [...svg.matchAll(/<g class="link"[\s\S]*?<\/g>/g)].map((g) =>
    [...g[0].matchAll(/<text [^>]*>[^<]*<\/text>/g)].map((t) => t[0]),
  );
}

describe('ortho (xlabel) link label lines', () => {
  it('splits \\r, \\n and \\l like the jar and keeps the blank first line', () => {
    const svg = renderSync(SRC, { measurer: new DeterministicMeasurer() });
    expect(linkTexts(svg)).toEqual([
      [
        '<text x="98.37" y="81.111" fill="#000" font-size="13">\u00a0</text>',
        '<text x="65.22" y="94.111" fill="#000" font-size="13" textLength="36.725">A. text</text>',
      ],
      [
        '<text x="131.69" y="90.611" fill="#000" font-size="13">x</text>',
        '<text x="131.69" y="103.611" fill="#000" font-size="13">y</text>',
      ],
      [
        '<text x="171.77" y="71.611" fill="#000" font-size="13">p</text>',
        '<text x="171.77" y="84.611" fill="#000" font-size="13">q</text>',
      ],
    ]);
  });
});
