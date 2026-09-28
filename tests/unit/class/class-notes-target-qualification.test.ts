/**
 * cdd5-T3c: pins the upstream `quarkInContext(true, idShort)` qualification
 * `class-notes.ts#addNote` now applies to a note's own `of <Entity>` target,
 * mirroring the classifier reference resolver
 * (`class-namespace-resolve.ts#resolveReference`).
 *
 * Rows closed: cejegu-93-kobo234, muvici-42-dumo371, rilere-84-seba785,
 * tenule-05-fovi294 (note-target-not-namespace-qualified).
 *
 * `free-note-alias-not-quark-qualified` (pojeje-60-vata579,
 * rexupa-61-nezi165, tamovu-79-fifo533, ticemi-41-laze086) is NOT closed --
 * see `addFreestandingNote`'s own doc comment in class-notes.ts for the
 * measured collateral regression that stopped it, and this task's final
 * report.
 *
 * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java:304
 * @see ~/git/plantuml/.../command/note/CommandFactoryTipOnEntity.java:206
 */
import { describe, it, expect } from 'vitest';
import { addNote, finalizePendingNote, type PendingNote } from '../../../src/diagrams/class/class-notes.js';
import { makeClassifier } from '../../../src/diagrams/class/class-namespace.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeAst(overrides?: Partial<ClassDiagramAST>): ClassDiagramAST {
  return { classifiers: [], relationships: [], namespaces: [], directives: [], notes: [], ...overrides };
}

// ---------------------------------------------------------------------------
// addNote: `note ... of X` target qualification (S2-edge.md
// note-target-not-namespace-qualified) -- the single-line direct-call path
// (class-command-notes.ts rule 6b), exercised by rilere-84-seba785's
// `note left of A: note`.
// ---------------------------------------------------------------------------

describe('addNote target qualification', () => {
  it('qualifies a bare target against the active namespace -- cejegu-93-kobo234', () => {
    const ast = makeAst({
      namespaces: [{ id: 'pragma', display: 'pragma', classifiers: ['pragma.PragmaStringMultiTest'] }],
      classifiers: [makeClassifier('pragma.PragmaStringMultiTest', 'class', undefined, 'pragma')],
    });
    addNote(ast, 'left', 'PragmaStringMultiTest', 'text', {
      namespace: 'pragma',
      implicitTarget: false,
      sep: '.',
    });
    expect(ast.notes[0]!.target).toBe('pragma.PragmaStringMultiTest');
  });

  it('qualifies a bare target via unique-name reuse across namespaces -- rilere-84-seba785', () => {
    const ast = makeAst({
      namespaces: [
        { id: 'p1', display: 'p1', classifiers: ['p1.A'] },
        { id: 'p2', display: 'p2', classifiers: ['p2.B'] },
      ],
      classifiers: [
        makeClassifier('p1.A', 'class', undefined, 'p1'),
        makeClassifier('p2.B', 'class', undefined, 'p2'),
      ],
    });
    addNote(ast, 'left', 'A', 'note', { namespace: 'p1', implicitTarget: false, sep: '.' });
    expect(ast.notes[0]!.target).toBe('p1.A');
  });

  it('leaves a root-level target unqualified when there is no active namespace', () => {
    const ast = makeAst({ classifiers: [makeClassifier('Foo', 'class', undefined, null)] });
    addNote(ast, 'left', 'Foo', 'text', { namespace: null, implicitTarget: false, sep: '.' });
    expect(ast.notes[0]!.target).toBe('Foo');
  });

  it('preserves a `Class::member` tip target suffix while qualifying the host -- CommandFactoryTipOnEntity', () => {
    const ast = makeAst({
      namespaces: [{ id: 'p1', display: 'p1', classifiers: ['p1.A'] }],
      classifiers: [makeClassifier('p1.A', 'class', undefined, 'p1')],
    });
    addNote(ast, 'left', 'A::field', 'text', { namespace: 'p1', implicitTarget: false, sep: '.' });
    expect(ast.notes[0]!.target).toBe('p1.A');
    expect(ast.notes[0]!.targetPort).toBe('field');
  });
});

// ---------------------------------------------------------------------------
// finalizePendingNote: threads PendingNote.sep through to addNote's
// 'attached' branch (the multi-line `note ... of X / end note` path
// muvici-42-dumo371 and tenule-05-fovi294 exercise).
// ---------------------------------------------------------------------------

describe('finalizePendingNote threads sep through to the attached branch', () => {
  it('qualifies an attached multi-line note target -- muvici-42-dumo371/tenule-05-fovi294 shape', () => {
    const ast = makeAst({
      namespaces: [{ id: 'ns', display: 'ns', classifiers: ['ns.X'] }],
      classifiers: [makeClassifier('ns.X', 'class', undefined, 'ns')],
    });
    const pending: PendingNote = {
      kind: 'attached',
      target: 'X',
      implicitTarget: false,
      position: 'right',
      textLines: ['hello'],
      namespace: 'ns',
      sep: '.',
    };
    finalizePendingNote(ast, pending);
    expect(ast.notes[0]!.target).toBe('ns.X');
  });
});
