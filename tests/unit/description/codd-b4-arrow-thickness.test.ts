/**
 * codd b4 close (T7b residual 1): `skinparam arrowThickness` is the default
 * stroke of every description edge without a bracket thickness of its own.
 * `SvekEdge.java:265` takes `skinParam.getThickness(LineParam.arrow, null)`
 * (`FromSkinparamToStyle.java:150` maps arrowThickness to the arrow
 * LineThickness) and `:899` applies it through `linkType.getStroke3`.
 * Expected strokes are the jar's, from component/fuzula-86-temo881.
 */
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const FUZULA = [
  '@startuml',
  'skinparam arrowThickness 4',
  'component c1',
  'component c2',
  'component c3',
  'c1 -[dotted]-> c2',
  'c1 -[dashed,thickness=2]-> c3',
  '@enduml',
].join('\n');

function edgeStyle(svg: string, id: string): string | undefined {
  return new RegExp(`<path[^>]*style="([^"]*)"[^>]*id="${id}"`).exec(svg)?.[1];
}

describe('description edges default to skinparam arrowThickness', () => {
  const svg = renderSync(FUZULA, { measurer: new DeterministicMeasurer() });

  it('an edge with no bracket thickness strokes at arrowThickness', () => {
    expect(edgeStyle(svg, 'c1-to-c2')).toBe('stroke:#181818;stroke-width:4;stroke-dasharray:1,3;');
  });

  it('a bracket thickness still wins over arrowThickness', () => {
    expect(edgeStyle(svg, 'c1-to-c3')).toBe('stroke:#181818;stroke-width:2;stroke-dasharray:7,7;');
  });
});
