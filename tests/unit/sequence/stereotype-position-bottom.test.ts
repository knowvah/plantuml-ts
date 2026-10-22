/**
 * sdd2 T7k2 -- `skinparam stereotypePosition bottom`: `Participant#getDisplay`
 * appends the stereotype (`Participant.java:125-135`), so the head draws the
 * name first and the lifeline `<title>` is the first display line
 * (`Display.java:601-605`). Expected values: xakuro-97-tado489's jar svg.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const SRC = (position: string): string =>
  `@startuml\n${position}participant "Famous Bob" as Bob << Generated >>\nparticipant Alice << (C,#ADD1B2) Testable >>\n@enduml`;
const render = (position: string): string => renderFixtureSequence(SRC(position), new DeterministicMeasurer());
const texts = (svg: string): string[] => [...svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((m) => m[1]!);

describe('stereotypePosition', () => {
  it('bottom: name row first, lifeline titles are the names (SkinParam.java:845-846)', () => {
    const svg = render('skinparam stereotypePosition bottom\n');
    expect(texts(svg).slice(0, 4)).toEqual(['Famous Bob', '«Generated»', 'Alice', '«Testable»']);
    expect(svg).toContain('<title>Famous Bob</title>');
    expect(svg).toContain('<title>Alice</title>');
  });

  it('default top: stereotype row first, title from the stereotype', () => {
    const svg = render('');
    expect(texts(svg).slice(0, 2)).toEqual(['«Generated»', 'Famous Bob']);
    expect(svg).toContain('<title>.. Generated ..</title>');
  });

  it('the first read freezes the answer: a later skinparam reaches no later participant (SkinParam.java:323-340)', () => {
    const svg = renderFixtureSequence(
      '@startuml\nparticipant A <<x>>\nskinparam stereotypePosition bottom\nparticipant B <<y>>\n@enduml',
      new DeterministicMeasurer(),
    );
    expect(texts(svg).slice(0, 4)).toEqual(['«x»', 'A', '«y»', 'B']);
  });

  it('is case-insensitive (SkinParam.java:347-349)', () => {
    const svg = renderFixtureSequence(
      '@startuml\nskinparam stereotypePosition BOTTOM\nparticipant A <<x>>\n@enduml',
      new DeterministicMeasurer(),
    );
    expect(texts(svg).slice(0, 2)).toEqual(['A', '«x»']);
  });
});
