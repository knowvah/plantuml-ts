/**
 * gtc-T6e -- a chromed description is drawn through ONE scaled `UGraphic` upstream, so each number is
 * `String.format("%.3f", value * scale)` once (SvgGraphics.java:468-475; TextBlockExporter.java:159-177).
 * Drawn at 1x and re-scaled as strings it rounded twice. Expected tokens are from jar oracles of this
 * source (scripts/oracle-render.sh) at `skinparam dpi 60`, `dpi 150` and `scale 1.5`, with a title.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const source = (directive: string): string =>
  [
    '@startuml',
    directive,
    'title My Title',
    'component "Color Type" as A #8ff',
    'component "Plan Stream Publisher" as B <<fn>>',
    'database "Some db" as C',
    'interface I',
    'A --> B : use thing',
    'B ..> C',
    'A -[dashed]-> I',
    'note right of A : a note',
    '@enduml',
  ].join('\n');

const render = (directive: string): string => renderSync(source(directive), { measurer: new DeterministicMeasurer() });

describe('chromed description scale rounds once', () => {
  it('dpi 60: the arrow polygon and dashed path match the jar', () => {
    const svg = render('skinparam dpi 60');
    expect(svg).toContain('points="71.306,100.337,76.377,96.848,72.939,97.673,72.115,94.235,71.306,100.337"');
    expect(svg).toContain('M116.069,53.95 C126.844,71.519 143.629,98.911 150.798,110.605');
  });

  it('dpi 150: the entity rects match the jar', () => {
    const svg = render('skinparam dpi 150');
    expect(svg).toContain('<rect x="184.984" y="65.625" width="169.551" height="68.75"');
    expect(svg).toContain('<rect x="323.285" y="73.438" width="23.438" height="15.625"');
  });

  it('scale 1.5: the title baseline and entity rect match the jar', () => {
    const svg = render('scale 1.5');
    expect(svg).toContain('<text x="208.639" y="31.333" fill="#000" font-size="21" textLength="73.5"');
    expect(svg).toContain('<rect x="177.585" y="63" width="162.769" height="66"');
  });

  it('scale 0.7: the entity rect matches the jar', () => {
    expect(render('scale 0.7')).toContain('<rect x="82.873" y="29.4" width="75.959" height="30.8"');
  });
});
