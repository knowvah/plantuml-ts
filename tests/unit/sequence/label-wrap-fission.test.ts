/**
 * sdd2 T6c: sequence labels are wrapped by `Fission` at the component's
 * `LineBreakStrategy`. Expected texts and baselines are the jar's own output
 * (`test-results/dot-cache/sequence/{taboza-78-vali232,suneke-72-kexi504,
 * jafufe-08-begu830}/in.svg`).
 */
import { describe, it, expect } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { LineBreakStrategy } from '../../../src/core/klimt/LineBreakStrategy.js';
import { arrowMaxWidth, messageLabelLayout } from '../../../src/diagrams/sequence/text-block-geo.js';
import { defaultMessageFont } from '../../../src/diagrams/sequence/sequence-arrow-paint.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const LABEL = 'this is a very long message on several words';
/** taboza's first message in the jar: `this` ` ` `is` ` ` `a`, then one word per line. */
const JAR_NEUTRONS = ['this', ' ', 'is', ' ', 'a', 'very', 'long', 'message', 'on', 'several', 'words'];
const LINE_STEP = 13;

/** The jar writes a space neutron as U+00A0 in `<text>`. */
const spaces = (t: string): string => t.replaceAll('\u00a0', ' ');

function neutrons(maxMessageSize: number | undefined): readonly string[] {
  const theme = maxMessageSize === undefined ? {} : { maxMessageSize };
  const block = messageLabelLayout(LABEL, undefined, defaultMessageFont(), {
    measurer: new DeterministicMeasurer(),
    theme,
  });
  return block.primitives.map((p) => spaces(p.text));
}

describe('arrowMaxWidth (Rose.java:289-292)', () => {
  it('prefers a positive style MaximumWidth', () => {
    const style = new LineBreakStrategy('150');
    expect(arrowMaxWidth(style, 50)).toBe(style);
  });
  it('falls back to maxMessageSize when the style has none', () => {
    expect(arrowMaxWidth(LineBreakStrategy.NONE, 50).getMaxWidth()).toBe(50);
    expect(arrowMaxWidth(undefined, -100).getMaxWidth()).toBe(-100);
  });
  it('is NONE with neither', () => {
    expect(arrowMaxWidth(undefined, undefined)).toBe(LineBreakStrategy.NONE);
  });
});

describe('message labels through Fission (taboza, suneke)', () => {
  it('maxMessageSize 50 emits the jar neutrons', () => {
    expect(neutrons(50)).toEqual(JAR_NEUTRONS);
  });
  it('a negative maxMessageSize splits at its absolute value (Fission.java Math.abs; suneke)', () => {
    expect(neutrons(-50)).toEqual(JAR_NEUTRONS);
  });
  it('without maxMessageSize the label stays one run', () => {
    expect(neutrons(undefined)).toEqual([LABEL]);
  });
});

describe('note text honours wrapWidth (ComponentRoseNote.java:67; jafufe)', () => {
  const texts = (svg: string): string[] =>
    [...svg.matchAll(/<text[^>]*font-size="13"[^>]*>([^<]*)<\/text>/g)].map((m) => spaces(m[1] ?? ''));
  const SRC = (wrap: string): string =>
    `@startuml\n${wrap}Alice->Bob: hello\nnote right\nThis is a very very long note\nend note\n@enduml\n`;

  it('splits the note into the jar neutrons', () => {
    const svg = renderFixtureSequence(SRC('skinparam wrapWidth 50\n'), new DeterministicMeasurer());
    expect(texts(svg).slice(1)).toEqual(['This', ' ', 'is', ' ', 'a', 'very', 'very', 'long', 'note']);
  });
  it('keeps one run per line without wrapWidth', () => {
    const svg = renderFixtureSequence(SRC(''), new DeterministicMeasurer());
    expect(texts(svg).slice(1)).toEqual(['This is a very very long note']);
  });
  it('steps lines by the font line height', () => {
    const svg = renderFixtureSequence(SRC('skinparam wrapWidth 50\n'), new DeterministicMeasurer());
    const ys = [...svg.matchAll(/<text[^>]*y="([\d.]+)"[^>]*font-size="13"/g)].map((m) => Number(m[1]));
    expect(ys[ys.length - 1]! - ys[ys.length - 2]!).toBe(LINE_STEP);
  });
});
