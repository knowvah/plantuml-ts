/**
 * sdd1 T3e item 5: `hide stereotype` hides only the stereotype upstream
 * DISPLAYS -- `Participant#getDisplay` skips it when `hiddenPortions`
 * contains `STEREOTYPE` (`Participant.java:125-135`) -- while
 * `getUsedStyles` still merges it (`:82-91`), so `.s { … }` keeps reaching
 * the head, the lifeline and the activation.
 *
 * Expected values from the jar (`scripts/oracle-render.sh`, 2026-10-20,
 * `hs.puml` = the source below): head `fill="#F00"`, lifeline
 * `stroke:#00F`, the name alone with no `«s»` row.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const SOURCE = [
  '@startuml',
  '<style>',
  '.s {',
  '  BackGroundColor red',
  '  lifeLine {',
  '    LineColor blue',
  '  }',
  '  activationBox {',
  '    BackGroundColor green',
  '  }',
  '}',
  '</style>',
  'participant A <<s>>',
  'participant B',
  'B -> A ++ : hi',
  'hide stereotype',
  '@enduml',
].join('\n');

describe('hide stereotype keeps the style (Participant.java:82-91,125-135)', () => {
  const svg = renderFixtureSequence(SOURCE, new DeterministicMeasurer());

  it('paints the head from .s and draws no stereotype row', () => {
    const heads = [...svg.matchAll(/<rect [^>]*rx="2.5"[^>]*>/g)].map((m) => /\sfill="([^"]*)"/.exec(m[0])?.[1]);
    expect(heads).toEqual(['#F00', '#E2E2F0', '#F00', '#E2E2F0']);
    expect(svg).not.toContain('«s»');
  });

  it('strokes the lifeline from .s lifeLine', () => {
    const [first] = [...svg.matchAll(/<line [^>]*stroke-dasharray="5,5"[^>]*>/g)].map((m) => m[0]);
    expect(first).toContain('stroke="#00F"');
  });

  it('fills the activation from .s activationBox (LiveBoxesDrawer.java:140)', () => {
    expect(svg).toMatch(/<rect [^>]*width="10"[^>]*fill="#008000"/);
  });
});
