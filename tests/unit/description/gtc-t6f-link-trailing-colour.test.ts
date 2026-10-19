/**
 * gtc-T6f -- the trailing `#color` of a description link (CommandLinkElement.java:118,329): a `Colors` of
 * `ColorType.LINE` that draws the line AND the arrowhead (SvekEdge.java:884-893), mutes the label font via
 * `text:` (:260-262), and carries a `line.dashed|dotted|bold` stroke (:903-904). A bracket `[#c]` is applied
 * afterwards (WithLinkType.setSpecificColor, :68-74) and wins. Expected values: jar oracles of these sources.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseLinkColors } from '../../../src/diagrams/description/link-colors.js';

const render = (links: readonly string[]): string =>
  renderSync(['@startuml', 'component A', 'component B', ...links, '@enduml'].join('\n'), {
    measurer: new DeterministicMeasurer(),
  });
const PATH_STROKE =
  /<path [^>]*style="stroke:(#[0-9A-F]+);stroke-width:([\d.]+);(stroke-dasharray:[\d,]+;)?"[^>]*id="A-to-B"/;
const HEAD_FILL = /<polygon [^>]*fill="(#[0-9A-F]+)"/;
const labelFill = (svg: string, text: string): string | undefined =>
  new RegExp(`<text [^>]*fill="(#[0-9A-F]+)"[^>]*>${text}<`).exec(svg)?.[1];

describe('link trailing colour', () => {
  it('colours the line and the arrowhead', () => {
    const svg = render(['A --> B #aaa']);
    expect(PATH_STROKE.exec(svg)?.[1]).toBe('#AAA');
    expect(HEAD_FILL.exec(svg)?.[1]).toBe('#AAA');
  });

  it('is overridden by a bracket colour', () => {
    const svg = render(['A -[#red]-> B #aaa']);
    expect(PATH_STROKE.exec(svg)?.[1]).toBe('#F00');
    expect(HEAD_FILL.exec(svg)?.[1]).toBe('#F00');
  });

  it('coexists with a stereotype and with a label', () => {
    expect(PATH_STROKE.exec(render(['A --> B #aaa <<st>>']))?.[1]).toBe('#AAA');
    const labelled = render(['A --> B #aaa : the label']);
    expect(PATH_STROKE.exec(labelled)?.[1]).toBe('#AAA');
    expect(labelFill(labelled, 'the label')).toBe('#000');
  });

  it('applies line:, text: and line.dashed', () => {
    const keyed = render(['A --> B #line:blue;text:red : lbl']);
    expect(PATH_STROKE.exec(keyed)?.[1]).toBe('#00F');
    expect(labelFill(keyed, 'lbl')).toBe('#F00');
    const dashed = PATH_STROKE.exec(render(['A --> B #line.dashed:red']));
    expect(dashed?.slice(1, 4)).toEqual(['#F00', '1', 'stroke-dasharray:7,7;']);
    expect(PATH_STROKE.exec(render(['A --> B #line.bold']))?.[2]).toBe('2');
  });
});

describe('parseLinkColors', () => {
  it('reads the bare token as LINE and keyed tokens by type', () => {
    expect(parseLinkColors('aaa')).toEqual({ line: 'aaa' });
    expect(parseLinkColors('line:blue;arrow:red;text:green;back:x')).toEqual({
      line: 'blue',
      arrow: 'red',
      text: 'green',
    });
    expect(parseLinkColors('line.dotted:red')).toEqual({ line: 'red', lineStyle: 'dotted' });
    expect(parseLinkColors(undefined)).toEqual({});
  });
});
