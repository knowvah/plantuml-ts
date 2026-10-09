/**
 * desc-embed-ensure-visible.test.ts — cdd6 T3b (journal row 47), amended
 * lgm-T1e: a description-label `{{ }}` embed reaches the canvas through
 * `SvgGraphics#ensureVisible` (`SvgGraphics.java:129-133,1033-1034`:
 * `(int)(x + w + 1)`). The stock jar's ink pass takes the SVG arm too
 * (`LimitFinder.java:99-100,201-204`); T3b's "the ink pass skips the embed"
 * fitted the oracle's old `matchesProperty("SVG") = false` (oracle seam #3).
 *
 * Jar canvases (`test-results/dot-cache/unknown/<slug>/in.svg`, re-captured
 * after oracle seam #3 so the embed slot is the nested document's own
 * size, `EmbeddedDiagram.java:129-133`): rozugu-82 293x159 (image y 17 +
 * h 118 -> 135, slot-driven box -> 159); rojida-14 558x458 (image
 * 280.5 + 243 -> 524, 363 + 70 -> 433, slot-driven -> 558x458).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const measurer = new DeterministicMeasurer();

function canvas(svg: string): string {
  return /width="(\d+)px" height="(\d+)px"/.exec(svg)!.slice(1, 3).join('x');
}

const ROZUGU = [
  '@startuml',
  'rectangle A [',
  '{{',
  'skinparam BackgroundColor #Transparent',
  'rectangle FailCase [',
  '**Fail Case**',
  '----',
  'åäöÅÄÖ',
  'test 1 %newline()This is a newline :-)',
  'test 2',
  ']',
  '}}',
  ']',
  'rectangle OkCase [',
  '**OK Case**',
  '----',
  'åäöÅÄÖ',
  ']',
  '@enduml',
].join('\n');

const ROJIDA = [
  '@startuml',
  'package Application [',
  '{{',
  '  class class',
  '}}',
  ']',
  'package ClientInterface [',
  '{{',
  '  class class1',
  '}}',
  ']',
  'package LibraryInterface [',
  '{{',
  '  interface interface1',
  '  interface interface2',
  '}}',
  ']',
  'package LibraryImplementation [',
  '{{',
  '  class class2',
  '  class class3',
  '}}',
  ']',
  'Application ..> ClientInterface',
  'ClientInterface .down.> LibraryInterface',
  'ClientInterface .down.> LibraryImplementation',
  'LibraryImplementation .right.> LibraryInterface',
  '@enduml',
].join('\n');

describe('description-label embed: canvas via ensureVisible, not ink', () => {
  it('unknown/rozugu-82: the embed is not in the ink (canvas 293x159, not ink + 15 + 5)', () => {
    expect(canvas(renderSync(ROZUGU, { measurer }))).toBe('293x159');
  });

  it('unknown/rojida-14: package-leaf embeds stretch the canvas to (int)(x + w + 1)', () => {
    expect(canvas(renderSync(ROJIDA, { measurer }))).toBe('558x458');
  });
});
