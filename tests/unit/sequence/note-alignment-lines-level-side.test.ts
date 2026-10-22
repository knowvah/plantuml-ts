/**
 * Task T5e (sdd2): note text alignment (N1), raw note lines (N2), the level of
 * a standalone note (N3) and the side of a note on an exo arrow (N4). Each
 * expected value is the Java arithmetic quoted at the case.
 */
import { describe, expect, it } from 'vitest';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { NoteEvent, NoteGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { LiveBoxes, flattenLiveEvents } from '../../../src/diagrams/sequence/sequence-live-boxes.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

const measurer = new FixedMeasurer(8, 16);

/** `src/index.ts#umlSourceOfBlock`'s widening, over a `@startuml` body, so
 *  `skinparam` and `<style>` lines are collected as the preprocessor does. */
function sourceOf(body: readonly string[]): UmlSource {
  const block = buildBlockUmls(`@startuml\n${body.join('\n')}\n@enduml`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return {
    ...block.source,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
  };
}

function parse(lines: readonly string[]): SequenceDiagramAST {
  return astOrThrow(parseSequence(sourceOf(lines)), 'sequence');
}

function notesOf(ast: SequenceDiagramAST): NoteEvent[] {
  return ast.events.filter((e): e is NoteEvent => e.kind === 'note');
}

function noteGeos(ast: SequenceDiagramAST): { geos: NoteGeo[]; centers: number[] } {
  const geo = layoutSequence(ast, defaultTheme, measurer);
  return {
    geos: geo.events.filter((e): e is NoteGeo => e.kind === 'note'),
    centers: geo.participants.map((p) => p.centerX),
  };
}

describe('N1: padding alignment reads the legacy skinparam only (Rose.java:110)', () => {
  const body = ['A -> B : hi', 'note over A : text'];

  it('stamps the skinparam value on the note', () => {
    expect(notesOf(parse(['skinparam noteTextAlignment center', ...body]))[0]!.legacyTextAlignment).toBe(
      HorizontalAlignment.CENTER,
    );
  });

  it('falls back to defaulttextalignment (SkinParam.java:722-732)', () => {
    expect(notesOf(parse(['skinparam defaultTextAlignment right', ...body]))[0]!.legacyTextAlignment).toBe(
      HorizontalAlignment.RIGHT,
    );
  });

  it('leaves a <style> HorizontalAlignment off the legacy value', () => {
    const ast = parse(['<style>', 'note {', 'HorizontalAlignment center', '}', '</style>', ...body]);
    expect(notesOf(ast)[0]!.legacyTextAlignment).toBeUndefined();
  });

  it('is 9 px wider with a CENTER skinparam: left padding 15 against 6 (ComponentRoseNote.java:68-70)', () => {
    const plain = noteGeos(parse(['A -> B : hi', 'note right of B : text']));
    const center = noteGeos(parse(['skinparam noteTextAlignment center', 'A -> B : hi', 'note right of B : text']));
    expect(center.geos[0]!.width - plain.geos[0]!.width).toBe(9);
  });

  it('keeps the width under a <style>-only alignment', () => {
    const plain = noteGeos(parse(['A -> B : hi', 'note right of B : text']));
    const styled = noteGeos(
      parse([
        '<style>',
        'note {',
        'HorizontalAlignment center',
        '}',
        '</style>',
        'A -> B : hi',
        'note right of B : text',
      ]),
    );
    expect(styled.geos[0]!.width).toBe(plain.geos[0]!.width);
  });
});

describe('N2: a multi-line note body keeps its raw lines (FactorySequenceNoteCommand.java:145-147)', () => {
  it('strips only the common indent, keeping relative indent and trailing spaces', () => {
    const ast = parse(['A -> B', 'note right of B', '    one', '      two  ', 'end note']);
    expect(notesOf(ast)[0]!.text).toBe('one\n  two  ');
  });

  it('keeps blank lines, the first included', () => {
    const ast = parse(['A -> B', 'note right of B', '', 'one', '', '', 'two', 'end note']);
    expect(notesOf(ast)[0]!.text).toBe('\none\n\n\ntwo');
  });

  it('keeps the next command after the note', () => {
    const ast = parse(['A -> B', 'note right of B', 'one', '', 'end note', 'B -> A']);
    expect(ast.events.map((e) => e.kind)).toEqual(['message', 'note', 'message']);
  });
});

describe('N3: a standalone note counts an activate bound to the message before it (LiveBoxes.java:184-204)', () => {
  const ast = parse(['Bob -> Alice : c3', 'note right of Alice : x', 'activate Alice']);

  it('registers the note in the live list', () => {
    expect(flattenLiveEvents(ast.events).ofSource.get(ast.events[1]!)?.kind).toBe('note');
  });

  it('IGNORE_FUTURE_DEACTIVATE level is 1', () => {
    const live = flattenLiveEvents(ast.events);
    const boxes = new LiveBoxes('Alice', live.events);
    expect(boxes.getLevelAt(live.ofSource.get(ast.events[1]!)!, 'IGNORE_FUTURE_DEACTIVATE')).toBe(1);
  });

  it('moves the note right by LIVE_DELTA_SIZE (NoteTile.java:160-162)', () => {
    const withActivate = noteGeos(ast);
    const without = noteGeos(parse(['Bob -> Alice : c3', 'note right of Alice : x']));
    expect(withActivate.geos[0]!.x - without.geos[0]!.x).toBe(5);
  });
});

describe('N4: a note on an exo arrow takes the forced side (MessageExo.java:62-69)', () => {
  it.each([
    ['A ->]', 'note right', 'left'],
    ['[-> A', 'note left', 'right'],
    ['A ->]', 'note top', 'left'],
  ])('%s with %s is drawn %s of A', (arrow, note, side) => {
    const { geos, centers } = noteGeos(parse(['participant A', `${arrow} : m`, `${note} : x`]));
    const geo = geos[0]!;
    if (side === 'left') expect(geo.x + geo.width).toBeLessThanOrEqual(centers[0]!);
    else expect(geo.x).toBeGreaterThanOrEqual(centers[0]!);
  });
});
