/**
 * sdd1 T1b (D2, D3): `parseSequence(source: UmlSource)` replays the
 * preprocessor-collected `skinparam`/`<style>` declarations per command, and
 * every node captures the builder current at its command, as upstream's
 * constructors read `getSkinParam().getCurrentStyleBuilder()`
 * (`SequenceDiagram.java:129-130,171-172,248,270,289,371-372,427-432`,
 * `CommandArrow.java:401`, `FactorySequenceNoteCommand.java:233`); a
 * `skinparam`/`<style>` mutes the builder where it is dispatched
 * (`SkinParam.java:164-167`).
 *
 * Expected values cite `~/git/plantuml/src/main/resources/skin/plantuml.skin`.
 */
import { describe, expect, it } from 'vitest';
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import type { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import type {
  FrameEvent,
  MessageEvent,
  NoteEvent,
  SequenceDiagramAST,
  SequenceEvent,
} from '../../../src/diagrams/sequence/ast.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { componentStyle, paintOf } from '../../../src/diagrams/sequence/sequence-skin-param.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const SET = HColorSet.instance();
/** `plantuml.skin:93` `element { LineThickness 0.5 }`. */
const ELEMENT_THICKNESS = 0.5;

/** `src/index.ts#umlSourceOfBlock`'s widening, over a `@startuml` body. */
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

function parsed(source: UmlSource): SequenceDiagramAST {
  return astOrThrow(parseSequence(source), 'sequence');
}

/** A hand-built source with explicit document positions and `<style>` blocks. */
function positioned(lines: readonly string[], styles: readonly string[], stylePositions: readonly number[]): UmlSource {
  return {
    ...sequenceSource(lines),
    linePositions: lines.map((_, i) => i),
    stylePositions,
    styleSource: { skinparam: new Map(), styles },
  };
}

function messages(events: readonly SequenceEvent[]): MessageEvent[] {
  return events.filter((e): e is MessageEvent => e.kind === 'message');
}

function headThickness(builder: StyleBuilder): number {
  return paintOf(componentStyle(builder, 'PARTICIPANT_HEAD'), SET).thickness;
}

const THICK_STYLE = ['<style>', 'participant { LineThickness 2 }', '</style>'];

describe('per-event builder capture (D2)', () => {
  it('a <style> between two messages reaches only the second', () => {
    const ast = parsed(sourceOf(['A -> B', ...THICK_STYLE, 'C -> D']));
    const [first, second] = messages(ast.events);
    expect(headThickness(first!.styleBuilder)).toBe(ELEMENT_THICKNESS);
    expect(headThickness(second!.styleBuilder)).toBe(2);
  });

  it('participants keep the builder current at their creation (SequenceDiagram.java:129-130)', () => {
    const ast = parsed(sourceOf(['A -> B', ...THICK_STYLE, 'C -> D']));
    const thickness = ast.participants.map((p) => [p.id, headThickness(p.styleBuilder)]);
    expect(thickness).toEqual([
      ['A', ELEMENT_THICKNESS],
      ['B', ELEMENT_THICKNESS],
      ['C', 2],
      ['D', 2],
    ]);
  });

  it('a skinparam above the first command reaches every event', () => {
    const ast = parsed(sourceOf(['skinparam participantBorderThickness 2', 'A -> B', 'C -> D']));
    expect(messages(ast.events).map((m) => headThickness(m.styleBuilder))).toEqual([2, 2]);
  });

  it('a skinparam between two messages reaches only the second (CommandSkinParam.java:101)', () => {
    const ast = parsed(sourceOf(['A -> B', 'skinparam participantBorderThickness 2', 'C -> D']));
    expect(messages(ast.events).map((m) => headThickness(m.styleBuilder))).toEqual([ELEMENT_THICKNESS, 2]);
  });

  it('a skinparam block runs at its opening line (CommandSkinParamMultilines.java:90-102)', () => {
    const body = ['A -> B', 'skinparam sequence {', '  ParticipantBorderThickness 2', '}', 'C -> D'];
    const ast = parsed(sourceOf(body));
    expect(messages(ast.events).map((m) => headThickness(m.styleBuilder))).toEqual([ELEMENT_THICKNESS, 2]);
  });

  it('a <style> then a skinparam keep document order: the later one wins for later events', () => {
    const body = ['A -> B', ...THICK_STYLE, 'C -> D', 'skinparam participantBorderThickness 5', 'E -> F'];
    const ast = parsed(sourceOf(body));
    expect(messages(ast.events).map((m) => headThickness(m.styleBuilder))).toEqual([ELEMENT_THICKNESS, 2, 5]);
  });

  it('a skinparam then a <style> keep document order: the style wins for later events', () => {
    const body = ['A -> B', 'skinparam participantBorderThickness 5', 'C -> D', ...THICK_STYLE, 'E -> F'];
    const ast = parsed(sourceOf(body));
    expect(messages(ast.events).map((m) => headThickness(m.styleBuilder))).toEqual([ELEMENT_THICKNESS, 5, 2]);
  });

  it('a key assigned twice applies each value from its own line (oracle: 0.5 / 2 / 4)', () => {
    const body = [
      'A -> B',
      'skinparam participantBorderThickness 2',
      'C -> D',
      'skinparam participantBorderThickness 4',
      'E -> F',
    ];
    const ast = parsed(sourceOf(body));
    expect(messages(ast.events).map((m) => headThickness(m.styleBuilder))).toEqual([ELEMENT_THICKNESS, 2, 4]);
  });

  it('a multi-line note captures at its opening line (FactorySequenceNoteCommand.java:233)', () => {
    // The block executes as ONE command, so a declaration placed inside its
    // body (document position 2) has not run when the note is built.
    const lines = ['participant A', 'note over A', 'body', 'end note', 'A -> A'];
    const ast = parsed(positioned(lines, ['participant { LineThickness 2 }'], [2]));
    const note = ast.events.find((e): e is NoteEvent => e.kind === 'note')!;
    expect(note.styleBuilder).toBe(ast.participants[0]!.styleBuilder);
    expect(headThickness(note.styleBuilder)).toBe(ELEMENT_THICKNESS);
    expect(headThickness(messages(ast.events)[0]!.styleBuilder)).toBe(2);
  });

  it('a multi-line ref captures at its opening line (CommandReferenceMultilinesOverSeveral.java:152-153)', () => {
    const lines = ['participant A', 'ref over A', 'body', 'end ref', 'A -> A'];
    const ast = parsed(positioned(lines, ['participant { LineThickness 2 }'], [2]));
    const ref = ast.events.find((e): e is FrameEvent => e.kind === 'frame')!;
    expect(headThickness(ref.styleBuilder)).toBe(ELEMENT_THICKNESS);
    expect(ref.branchStyleBuilders).toEqual([ref.styleBuilder]);
  });

  it('each else keeps its own GroupingLeaf builder (SequenceDiagram.java:427-432)', () => {
    const lines = ['alt x', 'A -> A', 'else y', 'A -> A', 'end'];
    const ast = parsed(positioned(lines, ['participant { LineThickness 2 }'], [1]));
    const frame = ast.events.find((e): e is FrameEvent => e.kind === 'frame')!;
    expect(frame.branchStyleBuilders).toHaveLength(2);
    expect(frame.branchStyleBuilders[0]).toBe(frame.styleBuilder);
    expect(headThickness(frame.styleBuilder)).toBe(ELEMENT_THICKNESS);
    expect(headThickness(frame.branchStyleBuilders[1]!)).toBe(2);
  });

  it('a box reads the builder after every command, as a Doll does at tile time (Doll.java:81-83)', () => {
    const lines = ['box "B"', 'participant A', 'end box', 'A -> A'];
    const ast = parsed(positioned(lines, ['participant { LineThickness 2 }'], [2]));
    expect(headThickness(ast.participants[0]!.styleBuilder)).toBe(ELEMENT_THICKNESS);
    expect(ast.boxes[0]!.styleBuilder).toBe(messages(ast.events)[0]!.styleBuilder);
    expect(headThickness(ast.boxes[0]!.styleBuilder)).toBe(2);
  });

  it('a <style> after the last command still reaches the box (WBSDiagramFactory.ts#parseWbs)', () => {
    const lines = ['box "B"', 'participant A', 'end box', 'A -> A'];
    const ast = parsed(positioned(lines, ['participant { LineThickness 2 }'], [9]));
    expect(headThickness(messages(ast.events)[0]!.styleBuilder)).toBe(ELEMENT_THICKNESS);
    expect(headThickness(ast.boxes[0]!.styleBuilder)).toBe(2);
  });

  it('a hand-built source runs every declaration before its first line', () => {
    const source: UmlSource = {
      ...sequenceSource(['A -> B']),
      styleSource: { skinparam: new Map(), styles: ['participant { LineThickness 2 }'] },
    };
    expect(headThickness(messages(parsed(source).events)[0]!.styleBuilder)).toBe(2);
  });
});

describe('style refusals (D3)', () => {
  it('refuses a <style> block the parser rejects (CommandStyleMultilinesCSS.java:92-93)', () => {
    const source: UmlSource = {
      ...sequenceSource(['A -> B']),
      styleSource: { skinparam: new Map(), styles: ['node { { }'] },
    };
    const result = parseSequence(source);
    expect(result).toMatchObject({ refused: true, kind: 'execution', line: 0 });
    expect('refused' in result && result.message.startsWith('Error in style definition: ')).toBe(true);
  });

  it('refuses a rejected <style> placed after the last command', () => {
    const result = parseSequence(positioned(['A -> B'], ['node { { }'], [5]));
    expect(result).toMatchObject({ refused: true, kind: 'execution', line: 0 });
  });
});
