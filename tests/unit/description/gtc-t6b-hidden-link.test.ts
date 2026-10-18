/**
 * gtc-T6b -- `Link#isHidden()` (abel/Link.java:458-459) includes the link's own `hidden` flag
 * (`WithLinkType#goHidden`, WithLinkType.java:149-150, set by the `-[hidden]->` keyword).
 * `SvekResult#drawU` (SvekResult.java:97-100) draws such an edge through `UHidden`: nothing is
 * painted (no `<g class="link">`, no path), the `<!--link X to Y-->` comment of
 * `SvekEdge#drawU` (SvekEdge.java:845) is still written, and the LimitFinder pass still sees it.
 * Expected values: oracle of the reduced fixture (scripts/oracle-render.sh), 155x169.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SRC = ['@startuml', 'component A', 'component B', 'component C', 'A -[hidden]-> B', 'A --> C', '@enduml'].join(
  '\n',
);

const render = (src: string): string => renderSync(src, { measurer: new DeterministicMeasurer() });

describe('hidden link keyword', () => {
  const svg = render(SRC);

  it('paints no group or path for the hidden edge', () => {
    expect(svg.match(/<g class="link"/g)?.length).toBe(1);
    expect(svg).not.toContain('id="A-to-B"');
    expect(svg).toContain('id="A-to-C"');
  });

  it('still writes the link comment, in creation order', () => {
    expect(svg).toContain('<!--link A to B--><!--link A to C--><g class="link"');
  });

  it('keeps the canvas of the jar oracle', () => {
    expect(/ width="(\d+)px" height="(\d+)px"/.exec(svg)?.slice(1, 3)).toEqual(['155', '169']);
  });

  it('keeps the hidden edge label in the canvas and consumes duplicate path ids (jar 471x184)', () => {
    const src = [
      '@startuml',
      'component A',
      'component B',
      'A -[hidden]-> B : a very long hidden label that makes the canvas wide wide wide',
      'A -[hidden]-> B',
      '@enduml',
    ].join('\n');
    const wide = render(src);
    expect(wide).not.toContain('<g class="link"');
    expect(wide).toContain('<!--link A to B--><!--link A to B-->');
    expect(/ width="(\d+)px" height="(\d+)px"/.exec(wide)?.slice(1, 3)).toEqual(['471', '184']);
  });
});
