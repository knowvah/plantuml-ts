/**
 * sdd1 T1b (D3): the ratchet harness and production hand `parseSequence` the
 * same `UmlSource`. `parseSequence` now replays the block's style sources per
 * command, so a harness that passed a narrower source than
 * `src/index.ts#umlSourceOfBlock` would measure a path production does not
 * take (memory `conformance-harness-mirrors-index-ts`).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ParseOptions } from '../../../src/core/dispatcher.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { renderFixtureSequence } from './render-fixture-sequence.js';
import type * as SequenceParser from '../../../src/diagrams/sequence/parser.js';

const received = vi.hoisted((): UmlSource[] => []);

vi.mock('../../../src/diagrams/sequence/parser.js', async (importOriginal) => {
  const actual = await importOriginal<typeof SequenceParser>();
  return {
    ...actual,
    parseSequence: (source: UmlSource, options?: ParseOptions) => {
      received.push(source);
      return actual.parseSequence(source, options);
    },
  };
});

const MARKUP = [
  '@startuml',
  'A -> B',
  'skinparam participantBorderThickness 2',
  '<style>',
  'participant { LineThickness 3 }',
  '</style>',
  'C -> D',
  '@enduml',
].join('\n');

/** Everything `parseSequence` reads off its source. */
function parseInputs(source: UmlSource): unknown {
  return {
    lines: source.lines,
    linePositions: source.linePositions,
    stylePositions: source.stylePositions,
    styles: source.styleSource?.styles,
    skinparam: [...(source.styleSource?.skinparam ?? new Map<string, string>())],
    declarationOrder: source.styleSource?.declarationOrder,
    skin: source.styleSource?.skin,
  };
}

describe('renderFixtureSequence hands parseSequence the production UmlSource (D3)', () => {
  beforeEach(() => {
    received.length = 0;
  });

  it('matches renderSync on every field the parse reads', () => {
    renderSync(MARKUP);
    renderFixtureSequence(MARKUP, new DeterministicMeasurer());
    expect(received).toHaveLength(2);
    const [production, harness] = received.map(parseInputs);
    expect(harness).toEqual(production);
    expect(received[1]!.stylePositions).toEqual([3]);
    expect(received[1]!.styleSource?.styles).toHaveLength(1);
  });
});
