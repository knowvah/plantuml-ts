/**
 * gtc-T6j -- an element with several stereotypes takes the value of its FIRST label that has one. Upstream fans the
 * style signature out one label at a time (`StyleSignatureBasic#withTOBECHANGED`, StyleSignatureBasic.java:119-132)
 * and merges in that order; on a priority tie `DarkString#mergeWith` returns the earlier (previous) value
 * (DarkString.java:50-57, `Style.java:132`). The declaration order of the skinparam / `<style>` lines does not matter.
 * Expected values: jar oracles of these sources (scripts/oracle-render.sh), crossing declaration order x label order.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const render = (lines: readonly string[]): string =>
  renderSync(['@startuml', ...lines, '@enduml'].join('\n'), { measurer: new DeterministicMeasurer() });
const RED = '#F00';
const BLUE = '#00F';
const entityFill = (svg: string, name: string): string | undefined =>
  new RegExp(`data-qualified-name="${name}"[^>]*><rect [^>]*fill="(#[0-9A-F]+)"`).exec(svg)?.[1];

const SKIN_AB = ['skinparam ComponentBackgroundColor<<A>> #f00', 'skinparam ComponentBackgroundColor<<B>> #00f'];
const SKIN_BA = [...SKIN_AB].reverse();
const STYLE_AB = [
  '<style>',
  'component {',
  '  .A { BackgroundColor #f00 }',
  '  .B { BackgroundColor #00f }',
  '}',
  '</style>',
];
const STYLE_BA = [
  '<style>',
  'component {',
  '  .B { BackgroundColor #00f }',
  '  .A { BackgroundColor #f00 }',
  '}',
  '</style>',
];

describe('first stereotype label wins', () => {
  it.each([
    ['skinparam A-then-B', SKIN_AB],
    ['skinparam B-then-A', SKIN_BA],
    ['style A-then-B', STYLE_AB],
    ['style B-then-A', STYLE_BA],
  ])('%s: label order alone decides', (_name, decl) => {
    const svg = render([...decl, 'component X1 <<A>> <<B>>', 'component X2 <<B>> <<A>>']);
    expect(entityFill(svg, 'X1')).toBe(RED);
    expect(entityFill(svg, 'X2')).toBe(BLUE);
  });

  it('resolves each property independently (three labels, border/font/background)', () => {
    const svg = render([
      'skinparam ComponentBackgroundColor<<A>> #f00',
      'skinparam ComponentBackgroundColor<<B>> #00f',
      'skinparam ComponentBorderColor<<B>> #0f0',
      'skinparam ComponentBorderColor<<C>> #0ff',
      'skinparam ComponentFontColor<<B>> #a0a',
      'skinparam ComponentFontColor<<A>> #0aa',
      'component X1 <<C>> <<A>> <<B>>',
      'component X3 <<A>> <<B>> <<C>>',
    ]);
    expect(entityFill(svg, 'X1')).toBe(RED);
    expect(new RegExp('data-qualified-name="X1"[^>]*><rect [^>]*style="stroke:(#[0-9A-F]+)').exec(svg)?.[1]).toBe(
      '#0FF',
    );
    expect(new RegExp('data-qualified-name="X3"[^>]*><rect [^>]*style="stroke:(#[0-9A-F]+)').exec(svg)?.[1]).toBe(
      '#0F0',
    );
    expect(/<text [^>]*fill="(#[0-9A-F]+)"[^>]*>X1</.exec(svg)?.[1]).toBe('#0AA');
  });
});

describe('class and usecase agree', () => {
  it('class: skinparam ClassBackgroundColor<<A>>/<<B>>', () => {
    const svg = render([
      ...SKIN_AB.map((l) => l.replace('Component', 'Class')),
      'class X1 <<A>> <<B>>',
      'class X2 <<B>> <<A>>',
    ]);
    expect(entityFill(svg, 'X1')).toBe(RED);
    expect(entityFill(svg, 'X2')).toBe(BLUE);
  });

  it('usecase: skinparam UsecaseBackgroundColor<<A>>/<<B>>', () => {
    const svg = render([
      ...SKIN_AB.map((l) => l.replace('Component', 'Usecase')),
      'usecase X1 <<A>> <<B>>',
      'usecase X2 <<B>> <<A>>',
    ]);
    expect(/data-qualified-name="X1"[^>]*><ellipse [^>]*fill="(#[0-9A-F]+)"/.exec(svg)?.[1]).toBe(RED);
    expect(/data-qualified-name="X2"[^>]*><ellipse [^>]*fill="(#[0-9A-F]+)"/.exec(svg)?.[1]).toBe(BLUE);
  });
});
