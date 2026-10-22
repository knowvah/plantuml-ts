/**
 * T2d -- `->(N)` inclination in the message tile.
 *
 * `ComponentRoseArrow#getPreferredHeight` adds `inclination1 + inclination2`
 * (`ComponentRoseArrow.java:342-343`). A reverse tile builds its component
 * from `arrowConfiguration.reverse()` (`CommunicationTile.java:158-159`), which
 * swaps the dressings, so `getInclination1/2` (`ArrowConfiguration.java:285-
 * 297`) both see the head: a reverse `(N)` arrow reserves 2N, a forward one N.
 * Oracle: letagi-90-kome968 (`A ->(60) B` then `B ->(60) A`): jar viewBox
 * height 331 against 151 flat = 60 + 120.
 */
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { messageTileAdvance } from '../../../src/diagrams/sequence/sequence-layout-message.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const FLAT_TILE_HEIGHT = 27;
const INCLINATION = 30;
/** One 13pt label line (`ComponentRoseArrow` text height 15 + 4 + 8 = 27). */
const LABEL_BLOCK_H = 13;

function viewBoxHeight(body: string): number {
  const svg = renderFixtureSequence(
    `@startuml\nparticipant A\nparticipant B\n${body}\n@enduml\n`,
    new DeterministicMeasurer(),
  );
  return Number(/viewBox="0 0 [\d.]+ ([\d.]+)"/.exec(svg)![1]);
}

describe('messageTileAdvance inclination', () => {
  it('adds the inclination to the tile height, not to the arrow offset', () => {
    const flat = messageTileAdvance(LABEL_BLOCK_H, false);
    const sloped = messageTileAdvance(LABEL_BLOCK_H, false, INCLINATION);
    expect(flat.tileHeight).toBe(FLAT_TILE_HEIGHT);
    expect(sloped.tileHeight - flat.tileHeight).toBe(INCLINATION);
    expect(sloped.arrowY).toBe(flat.arrowY);
  });
});

describe('inclination reaches the diagram height', () => {
  const flat = viewBoxHeight('A -> B : t');
  it('forward A ->(30) B reserves inclination2 = 30', () => {
    expect(viewBoxHeight(`A ->(${INCLINATION}) B : t`) - flat).toBe(INCLINATION);
  });
  it('reverse B ->(30) A uses the reversed configuration: 2 x 30', () => {
    expect(viewBoxHeight(`B ->(${INCLINATION}) A : t`) - flat).toBe(2 * INCLINATION);
  });
});
