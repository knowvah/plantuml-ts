/**
 * gtc-T5b -- `SvekEdge#drawU` (SvekEdge.java:863-869): a link whose two ends are the SAME group
 * (`Link#isAutoLinkOfAGroup`, abel/Link.java:341-352) is drawn `x` further right, with
 * `x = cluster.getRectangleArea().getWidth() - (dotPath.getStartPoint().getX() - cluster.getRectangleArea().getMinX())`
 * (+ `dx`). The line, its arrowhead and its label move together. `SvekResult#calculateDimension` (:133) measures the
 * drawing once with dx = 0 and THEN `moveDelta`s the cluster rectangle (not the edge's dotPath), so the final draw
 * evaluates the same formula against a rectangle already moved by dx -- one extra dx.
 * Expected values: jar probe (scripts/oracle-render.sh) of the source below.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SRC = [
  '@startuml',
  'component a',
  'component M {',
  '  component x',
  '}',
  'a --> M : go',
  'M --> M : loop',
  '@enduml',
].join('\n');

describe('autolink of a group', () => {
  const svg = renderSync(SRC, { measurer: new DeterministicMeasurer() });

  it('draws the loop path and its label beside the cluster', () => {
    expect(svg).toContain(
      '<path d="M159,182.45 C170.87,159.38 194.08,159.56 194.08,183 C194.08,206.44 173.158,211.066 161.288,187.996" style="stroke:#181818;stroke-width:1;" fill="none" id="M-to-M"/>',
    );
    expect(svg).toContain('<text x="200.08" y="186.611" fill="#000" font-size="13" textLength="24.619">loop</text>');
  });
});
