/**
 * The document-level ink walk folds each transition label's marged box, not
 * only its anchor point -- the same `UEmpty` the composite-level walk folds.
 *
 * `SvekEdge.java:950-953` draws `labelText` (a `TextBlockMarged`), whose
 * `drawU` first draws `UEmpty.create(dim)` over the WHOLE marged block
 * (`TextBlockMarged.java:79-87`); `LimitFinder#drawEmpty` folds it
 * (`LimitFinder.java:159-162`). `SvekResult#calculateDimension` then moves the
 * drawing by `6 - minX` (`SvekResult.java:130-135`).
 *
 * Oracle: `state/pavuzo-79-zodu430` (`skinparam linetype ortho`). Its
 * leftmost ink is the `EvShutterReleased` xlabel box at graphviz x=0, so the
 * jar translates by 6 and draws the glyphs at x=7 (box + marginLabel 1),
 * canvas 219. Folding only the anchor point put minX at 1: shift 5, glyphs at
 * x=6, canvas 218.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const PAVUZO = `@startuml
skinparam linetype ortho
[*] --> NotShooting

state NotShooting begin
  [*] --> Idle
  Idle --> Configuring : EvConfig
  Configuring --> Idle : EvConfig
end state

NotShooting --> Shooting : EvShutterReleased
Shooting --> NotShooting : EvShutterHalf

@enduml`;

describe('document-level transition label ink', () => {
  const svg = renderSync(PAVUZO, { measurer: new DeterministicMeasurer() });

  it('canvas width is the jar 219', () => {
    expect(/ width="(\d+)px"/.exec(svg)?.[1]).toBe('219');
  });

  it('leftmost label glyphs sit at the jar x=7', () => {
    expect(/<text x="([\d.]+)"[^>]*>EvShutterReleased</.exec(svg)?.[1]).toBe('7');
  });
});
