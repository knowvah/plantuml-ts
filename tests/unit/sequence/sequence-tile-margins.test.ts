/**
 * sdd2-T5i: tile-driven box margins (`sequence-tile-margins.ts`, M1d) and the
 * participant `MinimumWidth` floor (M8). Fixture cases assert the jar's own
 * golden `in.svg` numbers; the model cases pin each Java rule alone.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { LivingSpaceMargins } from '../../../src/diagrams/sequence/sequence-dolls.js';
import { addTileMargins } from '../../../src/diagrams/sequence/sequence-tile-margins.js';
import { participantMinWidth } from '../../../src/diagrams/sequence/sequence-layout-participant-sizing.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, '..', '..', '..', 'test-results', 'dot-cache', 'sequence');
const measurer = new DeterministicMeasurer();

function oursFor(slug: string): string {
  return renderFixtureSequence(readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'), measurer);
}

function rects(svg: string): number[][] {
  return [...svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((m) =>
    m.slice(1, 5).map(Number),
  );
}

function parse(lines: readonly string[]): SequenceDiagramAST {
  const ast = parseSequence(sequenceSource(lines));
  if ('refused' in ast) throw new Error(ast.message);
  return ast;
}

/** The margins `addTileMargins` grows for `lines`, with uniform 40-wide heads. */
function marginsOf(lines: readonly string[]): LivingSpaceMargins {
  const ast = parse(lines);
  const participants = [...ast.participants].sort((a, b) => a.order - b.order);
  const margins = new LivingSpaceMargins(participants.length);
  addTileMargins(
    ast.events,
    participants,
    participants.map(() => 40),
    margins,
    { measurer, levels: undefined, sprites: ast.sprites, messageSpan: ast.options.sequenceMessageSpan },
  );
  return margins;
}

describe('M1d against the jar goldens', () => {
  it('ropame: `note over A` in a box draws the box 68.737 wide (NoteTile.java:204-218)', () => {
    // golden in.svg: box rect x=30.887 width=68.737 -- the note, not the head, sets it.
    const [box] = rects(oursFor('ropame-50-funo509'));
    expect(box![0]).toBeCloseTo(30.887, 2);
    expect(box![2]).toBeCloseTo(68.737, 2);
  });

  it('taraxa: self-message notes widen the box to 310.275 (CommunicationTileSelfNote*.java)', () => {
    const [box] = rects(oursFor('taraxa-93-reno112'));
    expect(box![0]).toBeCloseTo(16, 2);
    expect(box![2]).toBeCloseTo(310.275, 2);
  });
});

describe('ensureOwnBoxClears* model', () => {
  it('note left of: marginBefore = noteWidth - w/2 (NoteTile.java:204-211, getX = posC - width)', () => {
    const margins = marginsOf(['participant A', 'note left of A: hello']);
    expect(margins.marginBefore(0)).toBeGreaterThan(20);
    expect(margins.marginAfter(0)).toBe(0);
  });

  it('note right of: marginAfter grows, marginBefore does not (NoteTile.java:212-217)', () => {
    const margins = marginsOf(['participant A', 'note right of A: hello']);
    expect(margins.marginAfter(0)).toBeGreaterThan(20);
    expect(margins.marginBefore(0)).toBe(0);
  });

  it('a forward self loop grows marginAfter by maxPosition + compWidth - w/2 (CommunicationTileSelf.java:209-222, 272-277)', () => {
    const margins = marginsOf(['participant A', 'A -> A: hi']);
    // compWidth floor 50 (`ComponentRoseSelfArrow.java:326-328`), half head 20.
    expect(margins.marginAfter(0)).toBe(30);
    expect(margins.marginBefore(0)).toBe(0);
  });

  it('a reverse self loop grows marginBefore only (CommunicationTileSelf.java:212-217)', () => {
    const margins = marginsOf(['participant A', 'A <- A: hi']);
    expect(margins.marginBefore(0)).toBe(30);
    expect(margins.marginAfter(0)).toBe(0);
  });

  it('sequenceMessageSpan skips the loop check (CommunicationTileSelf.java:167-168)', () => {
    const margins = marginsOf(['!pragma sequenceMessageSpan true', 'participant A', 'A -> A: hi']);
    expect(margins.marginAfter(0)).toBe(0);
  });

  it('a note over several wider than its span overflows both ends (NoteTile.java:131-142, 287-306)', () => {
    const margins = marginsOf(['participant A', 'participant B', 'note over A, B: a very long note text indeed']);
    expect(margins.marginBefore(0)).toBeGreaterThan(0);
    expect(margins.marginAfter(1)).toBeGreaterThan(0);
    expect(margins.marginAfter(0)).toBe(0);
  });

  it('a one-participant `note over` overflows (width - w)/2 both ways (NoteTile.java:122-124)', () => {
    const margins = marginsOf(['participant A', 'note over A: a very long note text indeed']);
    expect(margins.marginBefore(0)).toBeGreaterThan(0);
    expect(margins.marginBefore(0)).toBe(margins.marginAfter(0));
  });
});

describe('M8 participant MinimumWidth', () => {
  it('rupasa: minClassWidth 400 makes heads 414 = 400 + 7 + 7 (ComponentRoseParticipant.java:139-142)', () => {
    const svg = oursFor('rupasa-72-neco694');
    expect(rects(svg).filter((r) => r[2] === 414).length).toBeGreaterThanOrEqual(2);
    // The text stays at the left padding, box x 434 + 7 = 441 (drawInternalU:121).
    expect(svg).toContain('x="441"');
  });

  it('rujapu: minClassWidth 150 makes the head 164 wide', () => {
    expect(oursFor('rujapu-71-bidi404')).toContain('width="164"');
  });

  it('the unset floor is 0 (ValueNull.java:57-59)', () => {
    const ast = parse(['participant A']);
    expect(participantMinWidth(ast.participants[0]!)).toBe(0);
  });
});
