/**
 * sdd3 T1e: `skinparam sequenceParticipant underline` underlines the head.
 *
 * `SkinParam#forceSequenceParticipantUnderlined` is `valueIs
 * ("sequenceParticipant", "underline")` (`SkinParam.java:991-993`); it is read
 * at DRAW time -- `LivingSpace#drawHeadOrTail:198`, `#getHeadPreferredDimension
 * :219`, `MutingLine:107-108` -- and feeds `Participant#getDisplay(underlined)`,
 * i.e. `Display#underlined` (`Participant.java:125-126`), which prefixes EVERY
 * display line with `<u>` (`Display.java:462-469`). The jar's `<title>` for the
 * lifeline is `UGroup#fix` of that first line: `<u>Alice` -> `.u.Alice`
 * (golden `jeviru-31-gasi159`).
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { headRowsOf } from '../../../src/diagrams/sequence/sequence-layout-participant-label.js';
import { lifelineTitle } from '../../../src/diagrams/sequence/sequence-layout-lifeline.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { sequenceBlockSource } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

const UNDERLINE_ATTR = 'text-decoration="underline"';

function render(lines: readonly string[]): string {
  return renderFixtureSequence(['@startuml', ...lines, '@enduml'].join('\n'), new DeterministicMeasurer());
}

function parsed(lines: readonly string[]): SequenceDiagramAST {
  const block = buildBlockUmls(['@startuml', ...lines, '@enduml'].join('\n'))[0];
  if (block === undefined || !block.ok) throw new Error('no diagram block');
  const result = parseSequence(sequenceBlockSource(block));
  if ('refused' in result) throw new Error(JSON.stringify(result));
  return result;
}

const fonts = {
  font: {} as never,
  stereoFont: {} as never,
};

describe('headRowsOf underline (Display.java:462-469)', () => {
  it('prefixes every display line with <u>, leaving stereotype rows alone', () => {
    const rows = headRowsOf(['«s»'], 'a\nb', { ...fonts, underlined: true });

    expect(rows.lines).toEqual(['<u>a', '<u>b']);
    expect(rows.stereotypeLines).toEqual(['«s»']);
  });

  it('changes nothing without the flag', () => {
    expect(headRowsOf([], 'a\nb', fonts).lines).toEqual(['a', 'b']);
  });
});

describe('lifelineTitle underline (MutingLine.java:107-108)', () => {
  it('writes the <u> prefix through UGroup#fix', () => {
    expect(lifelineTitle({ display: 'Alice', underlined: true })).toBe('.u.Alice');
  });

  it('keeps the shown stereotype first (Participant.java:127-128)', () => {
    expect(lifelineTitle({ display: 'Alice', stereotype: '<<s>>', underlined: true })).toBe('..s..');
  });

  it('is unchanged without the flag', () => {
    expect(lifelineTitle({ display: 'Alice' })).toBe('Alice');
  });
});

describe('the draw-time skinparam read (SkinParam.java:991-993)', () => {
  it('reaches a participant declared BEFORE the skinparam', () => {
    const ast = parsed(['participant Alice', 'skinparam sequenceParticipant underline', 'Alice -> Bob : hi']);

    expect(ast.participants.map((p) => p.underlined)).toEqual([true, true]);
  });

  it('is absent without the skinparam, and for another value', () => {
    expect(parsed(['Alice -> Bob : hi']).participants.map((p) => p.underlined)).toEqual([undefined, undefined]);
    expect(
      parsed(['skinparam sequenceParticipant bold', 'Alice -> Bob : hi']).participants.map((p) => p.underlined),
    ).toEqual([undefined, undefined]);
  });

  it('draws underline on both heads, top and bottom, and not on the message (jeviru)', () => {
    const svg = render(['skinparam sequenceParticipant underline', 'Alice -> Bob : hello']);

    expect(svg.split(UNDERLINE_ATTR)).toHaveLength(5);
    expect(svg).toContain('<title>.u.Alice</title>');
    expect(svg).toContain('<title>.u.Bob</title>');
  });

  it('draws no underline without the skinparam', () => {
    const svg = render(['Alice -> Bob : hello']);

    expect(svg).not.toContain(UNDERLINE_ATTR);
    expect(svg).toContain('<title>Alice</title>');
  });
});
