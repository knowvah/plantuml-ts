/**
 * cdd5-T5d free-note-alias-not-quark-qualified (pojeje-60-vata579,
 * rexupa-61-nezi165, tamovu-79-fifo533, ticemi-41-laze086): a freestanding
 * note's alias resolves like any other quark --
 * "final Quark<Entity> quark = diagram.quarkInContext(false, diagram.cleanId(idShort));"
 * -- and a relationship endpoint naming it resolves through the SAME quark
 * tree (`quarkInContextSafe(true, …)`, where notes count in `countByName`),
 * so the note is found instead of a phantom classifier being created.
 * @see ~/git/plantuml/.../command/note/CommandFactoryNote.java:192-197
 * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:249-275
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

const noteIds = (ast: ReturnType<typeof parse>): string[] => ast.notes.map((n) => n.id);

describe('freestanding note alias is qualified by the current group', () => {
  it('two `note as _n` in packages x and y stay distinct (pojeje)', () => {
    const ast = parse('package x {\nnote as _n\nqwerty\nend note\n}\npackage y {\nnote as _n\naasdfg\nend note\n}');
    expect(noteIds(ast)).toEqual(['x._n', 'y._n']);
    expect(ast.notes.map((n) => n.namespace)).toEqual(['x', 'y']);
  });

  it('the single-line form qualifies too (ticemi)', () => {
    const ast = parse('package a {\nnote "my note" as M\n}\npackage b {\nnote "my other note" as M\n}');
    expect(noteIds(ast)).toEqual(['a.M', 'b.M']);
  });

  it('a root note and a same-named note inside a package do not collide (tamovu)', () => {
    const ast = parse('note as n\nmy note\nend note\npackage X {\nnote as n\nmy enother note\nend note\n}');
    expect(noteIds(ast)).toEqual(['n', 'X.n']);
  });

  it('a dotted alias at root builds its group chain (rexupa)', () => {
    const ast = parse('note as n\nmy note\nend note\nnote as X.n\nmy enother note\nend note');
    expect(noteIds(ast)).toEqual(['n', 'X.n']);
    expect(ast.notes[1]!.namespace).toBe('X');
    expect(ast.namespaces.map((ns) => ns.id)).toEqual(['X']);
  });
});

describe('relationship endpoints resolve a qualified note alias', () => {
  it('a same-scope reference finds the note, no phantom classifier', () => {
    const ast = parse('package P {\nnote as N4\ntext\nend note\nclass D\nN4 .> D\n}');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['P.D']);
    expect(ast.relationships.map((r) => [r.from, r.to])).toEqual([['P.N4', 'P.D']]);
  });

  it('a unique alias is reused from another scope (countByName == 1)', () => {
    const ast = parse('package P {\nnote as N4\ntext\nend note\n}\nclass D\nN4 .> D');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['D']);
    expect(ast.relationships.map((r) => [r.from, r.to])).toEqual([['P.N4', 'D']]);
  });

  it('an association couple finds the note as its C endpoint', () => {
    const ast = parse('package P {\nnote as N1\ntext\nend note\n}\nclass A\nclass B\nN1 .. (A,B)');
    expect(ast.classifiers.map((c) => c.id)).not.toContain('N1');
    expect(ast.relationships.some((r) => r.from === 'P.N1' || r.to === 'P.N1')).toBe(true);
  });
});
