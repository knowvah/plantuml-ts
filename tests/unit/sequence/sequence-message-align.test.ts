/**
 * sdd2 T4c -- a message label honours the arrow style's `HorizontalAlignment`.
 *
 * `Rose#createComponentArrow` resolves `messagePosition` from the merged
 * `root/element/sequenceDiagram/arrow` style, including the strings `first`,
 * `direction` and `reversedirection` (`skin/rose/Rose.java:299-342`);
 * `ComponentRoseArrow#drawInternalU` turns it into `textPos`
 * (`skin/rose/ComponentRoseArrow.java:164-179`), and the rows sit inside the
 * block by the style's own alignment (`AbstractTextualComponent.java:81,89-92`).
 * Rendered expectations are the `in.svg` x values of the named fixtures under
 * `test-results/dot-cache/sequence/` (oracle jar).
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import {
  arrowDirectionOf,
  labelTextPos,
  messagePosition,
} from '../../../src/diagrams/sequence/sequence-arrow-paint.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { DEFAULT_SEQUENCE_STYLE_BUILDER } from '../../helpers/sequence-source.js';

const PAD = 7;

/** The `x` of every `<text>` in document order. */
function textXs(source: string): number[] {
  const svg = renderFixtureSequence(source, new DeterministicMeasurer());
  return [...svg.matchAll(/<text [^>]*?\bx="([-\d.]+)"/g)].map((m) => Number(m[1]));
}

describe('labelTextPos (ComponentRoseArrow.java:164-179)', () => {
  const base = { width: 161.15, textDeltaX: 0, textWidth: 119.113, padX1: PAD, padX2: PAD };

  it('RIGHT, left-to-right: W - tw - padX2 - arrowDeltaX', () => {
    const pos = labelTextPos({ ...base, position: HorizontalAlignment.RIGHT, dir: 'LEFT_TO_RIGHT_NORMAL' });
    expect(pos).toBeCloseTo(25.037, 3);
  });

  it('RIGHT, right-to-left: no arrowDeltaX term', () => {
    const pos = labelTextPos({ ...base, position: HorizontalAlignment.RIGHT, dir: 'RIGHT_TO_LEFT_REVERSE' });
    expect(pos).toBeCloseTo(161.15 - 119.113 - 7, 6);
  });

  it('CENTER: (W - |textDeltaX| - tw) / 2', () => {
    const pos = labelTextPos({ ...base, textDeltaX: -10, position: HorizontalAlignment.CENTER, dir: 'BOTH_DIRECTION' });
    expect(pos).toBeCloseTo((161.15 - 10 - 119.113) / 2, 6);
  });

  it.each([
    ['LEFT_TO_RIGHT_NORMAL', 7],
    ['RIGHT_TO_LEFT_REVERSE', 17],
    ['BOTH_DIRECTION', 17],
  ] as const)('LEFT/unset, %s: padX1 + head clearance', (dir, expected) => {
    expect(labelTextPos({ ...base, position: undefined, dir })).toBe(expected);
    expect(labelTextPos({ ...base, position: HorizontalAlignment.LEFT, dir })).toBe(expected);
  });
});

describe('messagePosition (Rose.java:299-342)', () => {
  it('the default arrow alignment is LEFT', () => {
    expect(messagePosition(DEFAULT_SEQUENCE_STYLE_BUILDER, 'LEFT_TO_RIGHT_NORMAL', false)).toBe(
      HorizontalAlignment.LEFT,
    );
  });
});

describe('arrowDirectionOf (ArrowConfiguration.java:181-192)', () => {
  const arrow = arrowConfigurationOf({});
  it('reads the dressing at the geometric left end', () => {
    expect(arrowDirectionOf(arrow, false)).toBe('LEFT_TO_RIGHT_NORMAL');
    expect(arrowDirectionOf(arrow, true)).toBe('RIGHT_TO_LEFT_REVERSE');
  });
  it('a double-headed arrow is BOTH_DIRECTION either way', () => {
    const both = arrowConfigurationOf({ both: true });
    expect(arrowDirectionOf(both, false)).toBe('BOTH_DIRECTION');
    expect(arrowDirectionOf(both, true)).toBe('BOTH_DIRECTION');
  });
});

describe('rendered alignment (oracle in.svg x)', () => {
  it('cexelu-68: <style> arrow HorizontalAlignment right puts both rows right', () => {
    const xs = textXs(
      '@startuml\nskinparam useBetaStyle true\n<style>\narrow {\n  HorizontalAlignment right\n}\n</style>\nBob -> Alice : right\\non two different lines\nBob -> Alice : very very long message\n@enduml',
    );
    expect(xs).toContain(148.35);
    expect(xs).toContain(54.506);
  });

  it('dokuse-50: skinparam SequenceMessageAlign right', () => {
    const xs = textXs(
      '@startuml\nskinparam SequenceMessageAlign right\nBob -> Alice : right\\non two different lines\nBob -> Alice : very very long message\n@enduml',
    );
    expect(xs).toContain(148.35);
    expect(xs).toContain(54.506);
  });

  it('sizumo-60: first -- a2 is reverse-defined (RIGHT), b1 is right-to-left (RIGHT)', () => {
    const xs = textXs(
      '@startuml\nskinparam SequenceMessageAlign first\nparticipant alpha\nparticipant beta\n\nalpha -> beta: a1\nbeta <- alpha: a2\n\nbeta -> alpha: b1\nalpha <- beta: b2\n@enduml',
    );
    expect(xs).toContain(57.444);
    expect(xs).toContain(67.444);
  });

  it('dopuko-30: center puts each row mid-block', () => {
    const xs = textXs(
      '@startuml\nskinparam SequenceMessageAlign center\nBob -> Alice : center\\non two different lines\nBob -> Alice : very very long message\n@enduml',
    );
    expect(xs).toEqual(expect.arrayContaining([92.006, 50.487, 41.469]));
  });

  it('nizoxo-38: direction -- left for ->, right for <-, centre for <->', () => {
    const xs = textXs(
      '@startuml\nskinparam sequenceMessageAlign direction\nBob->Alice: This is a long message to increase the distance between Alice and Bob\nBob->Alice: should be left aligned\nAlice->Bob: should be right aligned\nAlice<->Bob: should be centered\n@enduml',
    );
    expect(xs).toEqual(expect.arrayContaining([325.888, 191.334]));
  });

  it('kemaba-15: direction on a return', () => {
    expect(
      textXs('@startuml\nskinparam SequenceMessageAlign direction\nAlice -> Bob : hello\nreturn ok\n@enduml'),
    ).toContain(63.188);
  });

  it('vuvuge-45: reverseDirection', () => {
    expect(
      textXs(
        '@startuml\nskinparam SequenceMessageAlign reverseDirection\nAlice -> Bob : hello with long\nAlice -> Bob : hello\nreturn ok\n@enduml',
      ),
    ).toContain(94.15);
  });
});
