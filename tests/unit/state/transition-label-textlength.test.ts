/**
 * The transition label `<text>` carries `textLength` -- the label block's
 * measured width -- exactly as the jar's SVG driver emits it.
 *
 * `SvgGraphics.java:700-706` writes `textLength` on every `<text>` whose
 * content is longer than one character (`lengthAdjust` is spacing in the
 * default document). The value is the drawn string's width
 * (`DriverTextSvg`), i.e. the same measurement `SvekEdge` reserved the label
 * box from (`SvekEdge.java:372-373`).
 *
 * Expected values come from the jar's own
 * `test-results/dot-cache/state/pavuzo-79-zodu430/in.svg` (ortho xlabels:
 * `SvekEdge.java:433-437`): EvConfig 52.813 (x2, inside the composite),
 * EvShutterReleased 112.044, EvShutterHalf 80.194.
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

const render = (src: string): string => renderSync(src, { measurer: new DeterministicMeasurer() });

function labelTextLengths(svg: string): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const m of svg.matchAll(/<text([^>]*)>(Ev\w+|go|g|x)<\/text>/g)) {
    out[`${m[2]}#${Object.keys(out).filter((k) => k.startsWith(`${m[2]}#`)).length}`] = /textLength="([^"]+)"/.exec(
      m[1]!,
    )?.[1];
  }
  return out;
}

describe('state transition label textLength', () => {
  it('ortho xlabels carry the jar textLength (pavuzo)', () => {
    expect(labelTextLengths(render(PAVUZO))).toEqual({
      'EvConfig#0': '52.813',
      'EvConfig#1': '52.813',
      'EvShutterReleased#0': '112.044',
      'EvShutterHalf#0': '80.194',
    });
  });

  it('plain (non-ortho) labels carry it too', () => {
    const svg = render('@startuml\nstate A\nstate B\nA --> B : EvConfig\n@enduml');
    expect(labelTextLengths(svg)).toEqual({ 'EvConfig#0': '52.813' });
  });

  it('a one-character label has none (SvgGraphics.java:703 length > 1)', () => {
    const svg = render('@startuml\nstate A\nstate B\nA --> B : x\n@enduml');
    expect(labelTextLengths(svg)).toEqual({ 'x#0': undefined });
  });
});
