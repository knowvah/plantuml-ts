/**
 * sdd2-T7a: multicast targets and part-anchored messages.
 *
 * Expected values cite the Java and the `punove-48-zugu202` /
 * `nivaje-50-tido759` goldens (shaft y 113 / 115 under a main arrow at 111).
 *
 * @see ~/git/plantuml/.../sequencediagram/teoz/CommunicationTile.java:169-177,328-338,373-390
 * @see ~/git/plantuml/.../sequencediagram/command/CommandArrow.java:420-422
 */

import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { MessageEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const MEASURER = new DeterministicMeasurer();
const MULTICAST_DY = 2;

function render(lines: readonly string[]): string {
  return renderFixtureSequence(['@startuml', ...lines, '@enduml'].join('\n'), MEASURER, {
    includeStore: fixtureIncludeStore(),
  });
}

/** The solid shafts (lifelines carry a dasharray), as `[x1, y, x2]`. */
function shafts(svg: string): [number, number, number][] {
  return [...svg.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"([^>]*)>/g)]
    .filter((m) => !m[5]!.includes('dasharray') && m[2] === m[4])
    .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
}

describe('multicast `A -> B & C & D`', () => {
  const svg = render(['participant A', 'participant B', 'participant C', 'participant D', 'A -> B & C & D : x']);
  const lines = shafts(svg);

  it('draws one shaft per target in order, 2 and 4 below the main arrow, before it (:338,380-388)', () => {
    expect(lines).toHaveLength(3);
    const main = lines[2]!;
    expect(lines[0]![1]).toBe(main[1] + MULTICAST_DY);
    expect(lines[1]![1]).toBe(main[1] + 2 * MULTICAST_DY);
  });

  it('spans the lifeline centres, longest for the farthest target', () => {
    expect(lines[1]![2]).toBeGreaterThan(lines[0]![2]);
    expect(lines[0]![2]).toBeGreaterThan(lines[2]![2]);
    expect(lines[0]![0]).toBe(lines[2]![0]);
  });

  it('draws a head per target', () => {
    expect(svg.match(/<polygon /g)).toHaveLength(3);
  });
});

describe('multicast to the left reverses the configuration (:383-384)', () => {
  it('draws the head at the lifeline of the leftward target', () => {
    const svg = render(['participant A', 'participant B', 'participant C', 'C -> A & B : x']);
    expect(svg.match(/<polygon /g)).toHaveLength(2);
    const [extra, main] = shafts(svg);
    expect(extra![1]).toBe(main![1] + MULTICAST_DY);
  });
});

describe('part anchors (CommandArrow.java:421-422)', () => {
  it('are captured on the message', () => {
    const ast = parseSequence(
      sequenceSource(['participant A', 'participant B', 'A{s} -> B{e} : x']),
    ) as SequenceDiagramAST;
    const msg = ast.events.find((e): e is MessageEvent => e.kind === 'message')!;
    expect(msg.part1Anchor).toBe('s');
    expect(msg.part2Anchor).toBe('e');
  });

  it('draw nothing, while the next message keeps its place below the reserved tile (:328-331)', () => {
    const plain = render(['participant A', 'participant B', 'A -> B : one', 'A -> B : two']);
    const anchored = render(['participant A', 'participant B', 'A -> B{e} : one', 'A -> B : two']);
    expect(shafts(anchored)).toHaveLength(1);
    expect(anchored).not.toContain('>one<');
    expect(shafts(anchored)[0]![1]).toBe(shafts(plain)[1]![1]);
  });
});
