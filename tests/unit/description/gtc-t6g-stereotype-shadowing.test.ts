/**
 * gtc-T6g -- `skinparam <sname> { Shadowing<<label>> v }` re-signs a stereotype-scoped Shadowing style
 * (FromSkinparamToStyle.java:282,306-310,396-408), read by `Cluster.java:314-315` (`getStyle().getShadowing()`,
 * the stereotype-signed style of `:384-390`) and by the entity image. The shadow `<filter>` def is written once per
 * document; its `stdDeviation`/`dx`/`dy` are `format(2)`/`format(4)` (SvgGraphics.java:1081,1084), i.e. scaled
 * (`:468-475`). Expected counts and numbers: jar oracles of this source (scripts/oracle-render.sh).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { scaleShadowFilterDefs } from '../../../src/core/svg-defs-scale.js';

const source = (directive: string): string =>
  [
    '@startuml',
    directive,
    'skinparam component {',
    '  Shadowing<<package>> true',
    '}',
    'skinparam rectangle {',
    '  Shadowing<<sh>> 2',
    '}',
    'component "Svc One" <<package>> {',
    '  component Inner <<package>>',
    '  component Plain',
    '}',
    'component "Svc Two" <<other>> {',
    '  component Inner2',
    '}',
    'rectangle R <<sh>> {',
    '  component Q',
    '}',
    'component Solo <<package>>',
    'Inner --> Inner2',
    '@enduml',
  ].join('\n');

const render = (directive: string): string => renderSync(source(directive), { measurer: new DeterministicMeasurer() });
const count = (svg: string, needle: RegExp): number => svg.match(needle)?.length ?? 0;
const FILTERED = /<rect [^>]*filter="url\(#f/g;
const FILTER_DEF = /<filter /g;

describe('stereotype-scoped Shadowing', () => {
  it('shadows the two clusters and the two entities carrying the stereotype, with one filter def', () => {
    const svg = render('');
    expect(count(svg, FILTERED)).toBe(4);
    expect(count(svg, FILTER_DEF)).toBe(1);
    expect(svg).toContain('stdDeviation="2"');
    expect(svg).toContain('dx="4" dy="4"');
  });

  it('keeps the filter, scaled, under a title and skinparam dpi 60', () => {
    const svg = render('title T\nskinparam dpi 60');
    expect(count(svg, FILTERED)).toBe(4);
    expect(svg).toContain('stdDeviation="1.25"');
    expect(svg).toContain('dx="2.5" dy="2.5"');
  });

  it('scales the filter under a title and scale 1.5', () => {
    const svg = render('title T\nscale 1.5');
    expect(svg).toContain('stdDeviation="3"');
    expect(svg).toContain('dx="6" dy="6"');
  });
});

describe('scaleShadowFilterDefs', () => {
  const DEFS =
    '<filter id="f1"><feGaussianBlur result="blurOut" stdDeviation="2"/><feOffset result="blurOut3" in="blurOut2" dx="4" dy="4"/></filter>';

  it('multiplies the blur and the offset once', () => {
    expect(scaleShadowFilterDefs(DEFS, 0.625)).toBe(
      '<filter id="f1"><feGaussianBlur result="blurOut" stdDeviation="1.25"/><feOffset result="blurOut3" in="blurOut2" dx="2.5" dy="2.5"/></filter>',
    );
  });

  it('is the identity at factor 1', () => {
    expect(scaleShadowFilterDefs(DEFS, 1)).toBe(DEFS);
  });
});
