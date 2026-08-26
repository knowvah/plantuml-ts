/**
 * T11 (mission sequence-command-coverage): `parser.ts`'s note-body port of
 * `PSystemCommandFactory#addOneSingleLineManageEmbedded2` (`:288-307`) —
 * while a multi-line note accumulates, a `{{` line swallows every following
 * line up to its matching `}}` without the note's own `end note` matcher ever
 * seeing them.
 *
 * Closes `lezonu-15-cege608` and `menoke-22-luxo044`, both of which pin the
 * defect this fixes: the inner `end note` closed the OUTER note, leaving `}}`
 * to be dispatched as a top-level command and refuse.
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { NoteEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

function notes(ast: SequenceDiagramAST): NoteEvent[] {
  return ast.events.filter((e): e is NoteEvent => e.kind === 'note');
}

describe('embedded `{{ }}` blocks inside a note body', () => {
  it('keeps the inner `end note` inside the block, so the OUTER `end note` closes the note', () => {
    const ast = parse([
      'a->b: test',
      'note right',
      '{{',
      'c->d',
      'note right',
      'test',
      'end note',
      '}}',
      'end note',
      'a->b: after',
    ]);

    expect(notes(ast)).toHaveLength(1);
    expect(notes(ast)[0]?.text).toBe('{{\nc->d\nnote right\ntest\nend note\n}}');
    // The line AFTER the outer `end note` is dispatched normally again --
    // i.e. the note really closed, rather than swallowing the rest.
    expect(ast.events.filter((e) => e.kind === 'message')).toHaveLength(2);
  });

  it('keeps both delimiters in the note text, mirroring java:289-290 and :295', () => {
    const ast = parse(['a->b', 'note right', '{{', 'c->d', '}}', 'end note']);

    expect(notes(ast)[0]?.text.split('\n')).toEqual(['{{', 'c->d', '}}']);
  });

  it('counts nesting, so only the OUTERMOST `}}` ends the block (java:296-302)', () => {
    const ast = parse([
      'a->b',
      'note right',
      '{{',
      'c->d',
      'note over c',
      '{{',
      'x->y',
      '}}',
      'end note',
      '}}',
      'end note',
      'a->b: after',
    ]);

    expect(notes(ast)).toHaveLength(1);
    expect(notes(ast)[0]?.text.split('\n')).toEqual([
      '{{',
      'c->d',
      'note over c',
      '{{',
      'x->y',
      '}}',
      'end note',
      '}}',
    ]);
    expect(ast.events.filter((e) => e.kind === 'message')).toHaveLength(2);
  });

  it('recognises a TYPED opener (`{{salt`, `{{json`, …) as a block start', () => {
    const ast = parse(['a->b', 'note right', '{{salt', '{+', 'end note', '}', '}}', 'end note', 'a->b: after']);

    expect(notes(ast)).toHaveLength(1);
    expect(notes(ast)[0]?.text.split('\n')[0]).toBe('{{salt');
    expect(ast.events.filter((e) => e.kind === 'message')).toHaveLength(2);
  });

  it('leaves a NON-type suffix (`{{nope`) as ordinary note text', () => {
    // `getEmbeddedType` returns null for an unknown keyword
    // (`EmbeddedDiagram.java:355`), so no block opens and the very next
    // `end note` closes the note as usual.
    const ast = parse(['a->b', 'note right', '{{nope', 'end note', 'a->b: after']);

    expect(notes(ast)[0]?.text).toBe('{{nope');
    expect(ast.events.filter((e) => e.kind === 'message')).toHaveLength(2);
  });

  it('absorbs every remaining line when the block is never closed (java falls through to `return lines`)', () => {
    const ast = parse(['a->b', 'note right', '{{', 'c->d', 'end note']);

    // The outer `end note` was swallowed by the unterminated block, so the
    // note never closes and is never emitted.
    expect(notes(ast)).toHaveLength(0);
    expect(ast.participants.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('does not open a block OUTSIDE a note body — `{{` alone still refuses', () => {
    const result = parseSequence(['a->b', '{{', 'c->d', '}}']);

    expect('refused' in result).toBe(true);
  });
});

describe('pinned corpus fixtures route SEQUENCE', () => {
  it('lezonu-15-cege608 shape: a nested sequence diagram with its own note', () => {
    const ast = parse([
      'a->b: test',
      'note right',
      '{{',
      'c->d',
      'note right',
      'test',
      'end note',
      '}}',
      'end note',
    ]);

    expect(ast.participants.map((p) => p.id)).toEqual(['a', 'b']);
    expect(notes(ast).map((n) => n.position)).toEqual(['right']);
  });

  // `skinparam handwritten true` heads the real fixture but never reaches
  // this parser: `preprocessor.ts`'s `PlainLineFilter` consumes every
  // `skinparam` line ahead of command dispatch, so the line stream below is
  // what `parseSequence` actually sees.
  it('menoke-22-luxo044 shape: an unindented block body with its own `end note`', () => {
    const ast = parse([
      'a->b',
      'note right',
      '{{',
      'c->d',
      'note right',
      'skinparam',
      'handwritten',
      'is not',
      'inherited',
      'end note',
      '}}',
      'end note',
    ]);

    expect(ast.participants.map((p) => p.id)).toEqual(['a', 'b']);
    expect(notes(ast)).toHaveLength(1);
    expect(notes(ast)[0]?.text.split('\n')).toHaveLength(9);
  });
});
