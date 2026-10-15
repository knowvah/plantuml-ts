/**
 * codd-T3 M5 -- `Cluster.java:299` `if (group.isHidden()) return;` tests the
 * model flag, so a hidden cluster contributes no ink even to the LimitFinder
 * pass (`SvekResult.java:132`). Expected canvas width 249 is the jar's, from
 * component/mavuxi-16-jafi782/in.svg (ours drew 265 with the hidden `a` inked).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SRC = [
  '@startuml',
  'component a {',
  '    component a_sub',
  '}',
  'component b {',
  '    component b_sub',
  '}',
  'hide a',
  'hide b_sub',
  '@enduml',
].join('\n');

describe('hidden cluster ink', () => {
  it('does not widen the canvas', () => {
    const svg = renderSync(SRC, { measurer: new DeterministicMeasurer() });
    expect(/ width="(\d+)px"/.exec(svg)?.[1]).toBe('249');
  });
});
