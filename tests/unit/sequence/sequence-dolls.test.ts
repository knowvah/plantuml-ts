/**
 * sdd2-T5c: the teoz `Doll`/`Dolls` englober layout (`sequence-dolls.ts`).
 *
 * The fixture cases render the committed `dot-cache` markup through the
 * ratchet path and assert the jar's own golden numbers -- the box rectangle,
 * the lifelines it pushes, the document size -- each of which only matches
 * once the Doll constraints, the englober offsets and `getMaxX` all land. The
 * model cases pin each Java rule on its own.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { boxPaddingOf, Dolls, LivingSpaceMargins } from '../../../src/diagrams/sequence/sequence-dolls.js';
import { engloberDimension, boxPaint } from '../../../src/diagrams/sequence/sequence-layout-box.js';
import type { BoxGroup, Participant, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import { renderFixtureSequence, sequenceBlockSource } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { DEFAULT_SEQUENCE_STYLE_BUILDER, sequenceSource } from '../../helpers/sequence-source.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, '..', '..', '..', 'test-results', 'dot-cache', 'sequence');
const measurer = new DeterministicMeasurer();

function oursFor(slug: string): string {
  return renderFixtureSequence(readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'), measurer);
}

/** Every `<rect>` before the first lifeline group: the englobers, drawn first
 *  (`SequenceDiagramFileMakerTeoz.java:144-146`). Read as numbers. */
function boxRects(svg: string): number[][] {
  const head = svg.slice(0, svg.indexOf('<g><title>'));
  return [...head.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((m) =>
    m.slice(1, 5).map(Number),
  );
}

function lifelineXs(svg: string): number[] {
  return [...svg.matchAll(/<g><title>[^<]*<\/title><rect [^>]*\/><line x1="([\d.]+)"/g)].map((m) => Number(m[1]));
}

function viewBox(svg: string): number[] {
  return /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!.slice(1, 3).map(Number);
}

function parse(lines: readonly string[]): SequenceDiagramAST {
  const ast = parseSequence(sequenceSource(lines));
  if ('refused' in ast) throw new Error(ast.message);
  return ast;
}

describe('Doll layout against the jar goldens', () => {
  it('fugilu: posA(first) >= xorigin + 10, rect posA-4 at y 1, englober offsets and getMaxX', () => {
    const svg = oursFor('fugilu-74-jivu585');
    // `Doll.java:203-216`: x = posB(A) - 4 = 20 - 4, y = 10 + 1; height
    // `body + heightEnglober1 + heightEnglober2 / 2` (`FileMakerTeoz:144-146`).
    expect(boxRects(svg)).toEqual([[16, 11, 68.725, 107]]);
    expect(lifelineXs(svg)).toEqual([31.681, 67.044]);
    // +20 wide (`getMaxX = posE + 10`), +28 tall (18 + 10) over the box-less row.
    expect(viewBox(svg)).toEqual([101, 133]);
  });

  it('podije: next.posA >= posE(last) + 20 between two boxes (Doll.java:261-269)', () => {
    const svg = oursFor('podije-21-guxe276');
    expect(boxRects(svg)).toEqual([
      [16, 11, 207.813, 99],
      [235.813, 11, 207.813, 99],
    ]);
    expect(lifelineXs(svg).slice(0, 2)).toEqual([49.969, 119.906]);
    expect(viewBox(svg)).toEqual([460, 125]);
  });

  it('binupo: nested boxes -- the outer frame is drawn, children shift by its title (Doll.java:203-216)', () => {
    const svg = oursFor('binupo-93-begi656');
    expect(boxRects(svg)).toEqual([
      [16, 11, 130.675, 117],
      [16, 29, 59.338, 99],
      [87.338, 29, 59.338, 99],
    ]);
    // `getOffsetForEnglobers` sums the chain: 18 + 18 (`Dolls.java:80-92`).
    expect(viewBox(svg)).toEqual([163, 143]);
  });

  it('teoz-ng-001: BoxPadding 200 widens both clearances (Doll.java:250-273)', () => {
    const svg = oursFor('teoz-ng-001');
    expect(boxRects(svg)).toEqual([[245.275, 11, 113.387, 243]]);
    expect(lifelineXs(svg).at(-1)).toBe(799.887);
    expect(viewBox(svg)).toEqual([836, 269]);
  });

  it('datetu: the unquoted title keeps its trailing space -- marginX grows by space / 2', () => {
    const svg = oursFor('datetu-47-vunu236');
    expect(boxRects(svg)).toEqual([[16, 11, 127.844, 153]]);
    expect(lifelineXs(svg)).toEqual([52.697, 104.391, 184.3]);
  });

  it('pakado: a bare box is a TextBlockEmpty title, 0 + 1 + 1 + 3 = 5 (AbstractTextualComponent.java:84-85)', () => {
    const svg = oursFor('pakado-65-cijo067');
    expect(boxRects(svg)[0]).toEqual([16, 11, 46.938, 113]);
    expect(/<rect x="35.969" y="44"/.test(svg)).toBe(true);
  });
});

describe('box parse', () => {
  it('nests a box opened inside another; end box pops one level (SequenceDiagram.java:502-515)', () => {
    const ast = parse(['box "outer"', 'box "inner"', 'participant a', 'end box', 'participant b', 'end box']);
    const [outer, inner] = ast.boxes;
    expect(inner!.parentId).toBe(outer!.id);
    expect(outer!.parentId).toBeUndefined();
    expect(ast.participants.map((p) => p.boxId)).toEqual([inner!.id, outer!.id]);
  });

  it('reads boxPadding from the legacy params at tile time (SkinParam.java:1153-1164)', () => {
    const preprocessed = (body: string): SequenceDiagramAST => {
      const block = buildBlockUmls(`@startuml\n${body}\n@enduml`)[0]!;
      if (!block.ok) throw new Error('preprocessor failure');
      const ast = parseSequence(sequenceBlockSource(block));
      if ('refused' in ast) throw new Error(ast.message);
      return ast;
    };
    // Declared AFTER the box: a Doll reads the value once the parse is done.
    expect(preprocessed('box\nparticipant a\nend box\nskinparam BoxPadding 40').boxes[0]!.boxPadding).toBe('40');
    expect(preprocessed('box\nparticipant a\nend box').boxes[0]!.boxPadding).toBeNull();
  });
});

function box(id: string, label: string, parentId?: string): BoxGroup {
  return {
    id,
    label,
    color: '',
    participantIds: [],
    ...(parentId !== undefined ? { parentId } : {}),
    styleBuilder: DEFAULT_SEQUENCE_STYLE_BUILDER,
  };
}

function participant(id: string, order: number, boxId?: string): Participant {
  return {
    id,
    display: id,
    type: 'participant',
    order,
    ...(boxId !== undefined ? { boxId } : {}),
    styleBuilder: DEFAULT_SEQUENCE_STYLE_BUILDER,
  };
}

describe('Dolls model', () => {
  const titleOf = (label: string) => engloberDimension(label, boxPaint(box('t', label)), measurer);

  it('boxPaddingOf accepts only \\d+(\\.\\d+)? (SkinParam.java:133,1158-1164)', () => {
    expect(
      [boxPaddingOf('40'), boxPaddingOf('1.5'), boxPaddingOf('40px'), boxPaddingOf('-3'), boxPaddingOf(null)].map((p) =>
        p.getLeft(),
      ),
    ).toEqual([40, 1.5, 0, 0, 0]);
    expect(boxPaddingOf(undefined).getRight()).toBe(0);
  });

  it('the englober title is the text plus (1, 3, 1, 3) padding plus 3 (ComponentRoseEnglober.java:58,83,88)', () => {
    expect(titleOf('AB')).toEqual({ width: 17.387500762939453 + 6, height: 13 + 2 + 3 });
    expect(titleOf('')).toEqual({ width: 6, height: 5 });
  });

  it('getOffsetForEnglobers is the tallest title chain; parents draw first (Dolls.java:56-92,114-118)', () => {
    const boxes = [box('o', 'outer'), box('i', 'inner', 'o'), box('s', '')];
    const ps = [participant('a', 0, 'i'), participant('b', 1, 's')];
    const dolls = new Dolls(ps, boxes, { measurer, margins: new LivingSpaceMargins(2) });
    expect(dolls.size()).toBe(3);
    expect(dolls.getOffsetForEnglobers()).toBe(36);
    const frames = dolls.drawEnglobers({ xs: [10, 50], widths: [20, 20] }, 100, 10);
    expect(frames.map((f) => [f.englober.id, f.x, f.y, f.width, f.height])).toEqual([
      ['o', 6, 11, 28, 100],
      ['i', 6, 29, 28, 82],
      ['s', 46, 11, 28, 100],
    ]);
  });

  it('a title wider than its participants sets both margins; the checks read them live', () => {
    const margins = new LivingSpaceMargins(3);
    const dolls = new Dolls([participant('a', 0), participant('b', 1, 'x'), participant('c', 2)], [box('x', 'AB')], {
      measurer,
      margins,
    });
    dolls.addConstraints([10, 10, 10]);
    // (23.3875 + 10 - 10) / 2 (`Doll.java:225-235`).
    const marginX = (17.387500762939453 + 6) / 2;
    expect([margins.marginBefore(1), margins.marginAfter(1)]).toEqual([marginX, marginX]);
    expect(dolls.minPosB(1, 30, 10)).toBe(30 + 10 + marginX);
    // `20 + 0 + 0` from posE(b) = 60 + marginX, plus c's own (zero) margin.
    expect(dolls.minPosB(2, 60, 10)).toBe(60 + marginX + 20);
    expect(dolls.minPosB(0, undefined, 10)).toBe(Number.NEGATIVE_INFINITY);
    expect(dolls.getMaxX({ xs: [0, 40, 80], widths: [10, 10, 10] }, margins.snapshot())).toBe(50 + marginX + 10);
  });

  it('a box on the first participant clears xorigin; none after the last (Doll.java:170-176,262-264)', () => {
    const margins = new LivingSpaceMargins(1);
    const dolls = new Dolls([participant('a', 0, 'x')], [box('x', '')], { measurer, margins });
    dolls.addConstraints([40]);
    expect(dolls.minPosB(0, undefined, 10)).toBe(20);
    expect(dolls.minPosB(1, 50, 10)).toBe(Number.NEGATIVE_INFINITY);
  });

  it('no dolls: getMaxX contributes nothing (PlayingSpace.java:81-84)', () => {
    const dolls = new Dolls([participant('a', 0)], [], { measurer, margins: new LivingSpaceMargins(1) });
    expect(dolls.getMaxX({ xs: [0], widths: [10] }, { before: [0], after: [0] })).toBeUndefined();
    expect(dolls.getOffsetForEnglobers()).toBe(0);
  });

  it('margins only grow and refuse a negative value (LivingSpace.java:281-291)', () => {
    const margins = new LivingSpaceMargins(1);
    margins.ensureMarginBefore(0, 5);
    margins.ensureMarginBefore(0, 2);
    margins.ensureMarginAfter(0, 3);
    const baked = margins.snapshot();
    margins.ensureMarginAfter(0, 7);
    expect([margins.marginBefore(0), margins.marginAfter(0), baked.after[0]]).toEqual([5, 7, 3]);
    expect(() => margins.ensureMarginBefore(0, -1)).toThrow('marginBefore -1 for participant 0 must not be negative');
    expect(() => margins.ensureMarginAfter(0, -1)).toThrow('marginAfter -1 for participant 0 must not be negative');
  });
});
