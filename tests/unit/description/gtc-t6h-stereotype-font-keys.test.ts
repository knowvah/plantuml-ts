/**
 * gtc-T6h -- `<sname>FontColor<<X>>`, `InterfaceBorderColor<<X>>`, `ArrowFontColor<<X>>` (flat and block spellings):
 * `FromSkinparamToStyle` strips `<<X>>` off the key (:292-302), resolves the base key's registration
 * (`addMagic`, :213-227, :270-283: border -> LineColor, `addConFont` -> FontColor; `addConFont("arrow", SName.arrow)`,
 * :149) and re-signs it with the stereotype at +1000 priority (:396-408). Expected values: jar oracles of these
 * sources (scripts/oracle-render.sh).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const render = (lines: readonly string[]): string =>
  renderSync(['@startuml', ...lines, '@enduml'].join('\n'), { measurer: new DeterministicMeasurer() });
const BODY = ['component A <<X>>', 'component B', 'interface I1 <<X>>', 'A --> B <<X>> : lbl'];
const fillOf = (svg: string, text: string): string | undefined =>
  new RegExp(`<text [^>]*fill="(#[0-9A-F]+)"[^>]*>${text}<`).exec(svg)?.[1];
const ellipseStroke = (svg: string): string | undefined => /<ellipse [^>]*style="stroke:(#[0-9A-F]+)/.exec(svg)?.[1];

describe('stereotype-scoped font and interface keys', () => {
  it('flat spelling: component font, interface border and font, arrow label font', () => {
    const svg = render([
      'skinparam ComponentFontColor<<X>> #a00',
      'skinparam InterfaceBorderColor<<X>> #0a0',
      'skinparam InterfaceFontColor<<X>> #00f',
      'skinparam ArrowFontColor<<X>> #f0f',
      ...BODY,
    ]);
    expect(fillOf(svg, 'A')).toBe('#A00');
    expect(fillOf(svg, '«X»')).toBe('#A00');
    expect(fillOf(svg, 'I1')).toBe('#00F');
    expect(ellipseStroke(svg)).toBe('#0A0');
    expect(fillOf(svg, 'lbl')).toBe('#F0F');
    expect(fillOf(svg, 'B')).toBe('#000');
  });

  it('block spelling matches the flat one', () => {
    const svg = render([
      'skinparam component {',
      '  FontColor<<X>> #a00',
      '}',
      'skinparam interface {',
      '  BorderColor<<X>> #0a0',
      '}',
      'skinparam arrow {',
      '  FontColor<<X>> #f0f',
      '}',
      ...BODY,
    ]);
    expect(fillOf(svg, 'A')).toBe('#A00');
    expect(ellipseStroke(svg)).toBe('#0A0');
    expect(fillOf(svg, 'lbl')).toBe('#F0F');
  });

  it('keeps the colours under hide stereotype', () => {
    const svg = render(['skinparam ComponentFontColor<<X>> #a00', 'hide stereotype', ...BODY]);
    expect(fillOf(svg, 'A')).toBe('#A00');
    expect(svg).not.toContain('«X»');
  });

  it('colours a group title and stereotype, and an actor', () => {
    const svg = render([
      'skinparam ComponentFontColor<<X>> #a00',
      'skinparam ActorFontColor<<X>> #fa0',
      'component Grp <<X>> {',
      '  component In',
      '}',
      'actor Ac <<X>>',
    ]);
    expect(fillOf(svg, 'Grp')).toBe('#A00');
    expect(fillOf(svg, 'Ac')).toBe('#FA0');
  });

  it('applies <style> arrow { .X { FontColor } } to the label', () => {
    const svg = render(['<style>', 'arrow {', '  .X { FontColor #f0f }', '}', '</style>', ...BODY]);
    expect(fillOf(svg, 'lbl')).toBe('#F0F');
  });

  it('lets a link text: colour outrank the stereotype arrow font colour', () => {
    const svg = render([
      'skinparam ArrowFontColor<<X>> #f0f',
      'component A',
      'component B',
      'A --> B #text:blue <<X>> : lbl',
    ]);
    expect(fillOf(svg, 'lbl')).toBe('#00F');
  });
});
