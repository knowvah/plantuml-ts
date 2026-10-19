/**
 * gtc-T6d -- `hide stereotype` filters only the PRINTED labels: upstream styles an element from the full
 * `entity.getStereotype()` (EntityImageDescription.java:151-159) and prints
 * `portionShower.getVisibleStereotypeLabels(entity)` (:193). Expected values: jar oracles of the reduced
 * fixture (fill #8FF, stroke #F00 on the component entities; node #8F8; label text per `hide` form).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const source = (hide: string): string =>
  [
    '@startuml',
    'skinparam ComponentBackgroundColor<<V3>> #8ff',
    'skinparam ComponentBorderColor<<V3>> #f00',
    'skinparam NodeBackgroundColor<<V3>> #8f8',
    hide,
    'package P <<V3>> {',
    '  component A <<V3>> <<Other>>',
    '}',
    'component B <<V3>>',
    'node N <<V3>>',
    'A --> B',
    '@enduml',
  ].join('\n');

const render = (hide: string): string => renderSync(source(hide), { measurer: new DeterministicMeasurer() });
const countOf = (svg: string, needle: string): number => svg.split(needle).length - 1;
const STYLED = 'fill="#8FF" style="stroke:#F00';

describe('stereotype style under hide stereotype', () => {
  it('keeps the colours with the labels shown', () => {
    const svg = render('');
    expect(countOf(svg, STYLED)).toBe(8);
    expect(svg).toContain('«V3»');
  });

  it('keeps the colours and prints no label under `hide stereotype`', () => {
    const svg = render('hide stereotype');
    expect(countOf(svg, STYLED)).toBe(8);
    expect(countOf(svg, 'fill="#8F8"')).toBe(1);
    expect(svg).not.toContain('«');
  });

  it('prints only the unhidden label under `hide <<V3>> stereotype`', () => {
    const svg = render('hide <<V3>> stereotype');
    expect(countOf(svg, STYLED)).toBe(8);
    expect(svg).not.toContain('«V3»');
    expect(countOf(svg, '«Other»')).toBe(1);
  });
});

describe('cluster stereotype style (Cluster.java:364,389 `getStyle()` signs the group stereotype)', () => {
  const cluster = (hide: string): string =>
    renderSync(
      [
        '@startuml',
        'skinparam RectangleBackgroundColor<<V3>> #abcdef',
        'skinparam RectangleBorderColor<<V3>> #f0f',
        hide,
        'rectangle R <<V3>> {',
        '  component C',
        '}',
        '@enduml',
      ].join('\n'),
      { measurer: new DeterministicMeasurer() },
    );

  it.each(['', 'hide stereotype'])('fills the cluster from its stereotype (%j)', (hide) => {
    expect(cluster(hide)).toContain('fill="#ABCDEF" style="stroke:#F0F;stroke-width:1;"');
  });

  it('keeps the ELK cluster unstyled: MyElkCluster.java:92-101 merges the style without the stereotype', () => {
    const svg = renderSync(
      [
        '@startuml',
        '!pragma layout elk',
        'skinparam RectangleBackgroundColor<<V3>> #abcdef',
        'rectangle R <<V3>> {',
        '  component C',
        '}',
        '@enduml',
      ].join('\n'),
      { measurer: new DeterministicMeasurer() },
    );
    expect(svg).not.toContain('#ABCDEF');
  });
});
