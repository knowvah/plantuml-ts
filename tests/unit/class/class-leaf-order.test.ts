/**
 * T2 (leaf-draw-order mission): `computeLeafDrawOrder` reproduces jar's
 * `GraphvizImageBuilder#buildImage` node-print order — `printGroups(root)`
 * (each group's own leaves, by creation rank, THEN its subgroups) followed
 * by `printEntities(getUnpackagedEntities())` (leaves with no namespace, by
 * creation rank) — over the port's `creationIndex`/`tipGroupPhantomIndex`
 * counters (D1, no new parse-time tick).
 *
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:226-227 buildImage
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:408-422 printGroups
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:425-435 printGroup
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:399-405 getUnpackagedEntities
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import { computeLeafDrawOrder } from '../../../src/diagrams/class/class-leaf-order.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('computeLeafDrawOrder (T2, leaf-draw-order)', () => {
  it('a namespace group draws before unpackaged siblings — jar-verified ' +
     '2026-08-15 (`P.A, P.N, X, Y, GMN6`): package P (own leaf A then its ' +
     'note N) THEN the unpackaged X, Y, and the trailing freestanding-target ' +
     'note, in creation-rank order', () => {
    const ast = parse(
      'class X\npackage P {\nclass A\nnote "n" as N\n}\nclass Y\nnote left of X : hello',
    );
    const pA = ast.classifiers.find((c) => c.display === 'A' && c.namespace === 'P')!;
    expect(pA.id).toBe('P.A');
    const order = computeLeafDrawOrder(ast);
    expect(order).toEqual([pA.id, 'N', 'X', 'Y', '__note_1']);
  });

  it('a group\'s own leaves precede its subgroups (`printGroup`): P{ Q{B} A } ' +
     'draws P\'s own A before Q\'s B', () => {
    const ast = parse('package P {\npackage Q {\nclass B\n}\nclass A\n}');
    const pA = ast.classifiers.find((c) => c.display === 'A')!;
    const qB = ast.classifiers.find((c) => c.display === 'B')!;
    expect(pA.id).toBe('P.A');
    expect(qB.id).toBe('P.Q.B');
    expect(computeLeafDrawOrder(ast)).toEqual([pA.id, qB.id]);
  });

  it('a member-tip note (targetPort set) ranks at its group leader\'s ' +
     'tipGroupPhantomIndex, positioned exactly between the classifiers whose ' +
     'creationIndex straddles it — read, not assumed', () => {
    const ast = parse(
      'class U {\nm\n}\nclass V\nnote right of U::m\nmulti-line\ntip\nend note\nclass W',
    );
    const u = ast.classifiers.find((c) => c.id === 'U')!;
    const v = ast.classifiers.find((c) => c.id === 'V')!;
    const w = ast.classifiers.find((c) => c.id === 'W')!;
    const tip = ast.notes[0]!;
    // Observed parsed indices: U=1, V=2, tip.tipGroupPhantomIndex=3, W=5.
    expect(u.creationIndex).toBe(1);
    expect(v.creationIndex).toBe(2);
    expect(tip.targetPort).toBe('m');
    expect(tip.tipGroupPhantomIndex).toBe(3);
    expect(w.creationIndex).toBe(5);
    expect(v.creationIndex!).toBeLessThan(tip.tipGroupPhantomIndex!);
    expect(tip.tipGroupPhantomIndex!).toBeLessThan(w.creationIndex!);
    expect(computeLeafDrawOrder(ast)).toEqual(['U', 'V', tip.id, 'W']);
  });

  it('a hand-built AST with no creationIndex anywhere keeps declaration ' +
     'order — classifiers then notes, D1\'s fallback', () => {
    const ast: ClassDiagramAST = {
      classifiers: [
        { id: 'a', display: 'a', kind: 'class', typeParams: [], members: [] },
        { id: 'b', display: 'b', kind: 'class', typeParams: [], members: [] },
      ],
      relationships: [],
      namespaces: [{ id: 'NS', display: 'NS', classifiers: [] }],
      directives: [],
      notes: [{ id: 'n1', text: 'hi' }],
    };
    expect(computeLeafDrawOrder(ast)).toEqual(['a', 'b', 'n1']);
  });

  it('a SECOND member-tip on the same (host, side) has no ' +
     'tipGroupPhantomIndex of its own — it reuses the leader\'s rank and ' +
     'sorts immediately after it (array order among group members)', () => {
    const ast = parse(
      'class U {\nm\nn\n}\nclass V\nnote right of U::m\ntip1\nend note\n' +
        'note right of U::n\ntip2\nend note\nclass W',
    );
    const [tip1, tip2] = ast.notes;
    expect(tip1!.tipGroupPhantomIndex).toBe(3);
    expect(tip2!.tipGroupPhantomIndex).toBeUndefined();
    expect(computeLeafDrawOrder(ast)).toEqual(['U', 'V', tip1!.id, tip2!.id, 'W']);
  });

  it('a hand-built member-tip note with no tipGroupPhantomIndex and no ' +
     'preceding leader on its key falls back to declaration order, not a ' +
     'crash', () => {
    const ast: ClassDiagramAST = {
      classifiers: [
        { id: 'a', display: 'a', kind: 'class', typeParams: [], members: [] },
      ],
      relationships: [],
      namespaces: [],
      directives: [],
      notes: [{ id: 'n1', target: 'a', position: 'right', targetPort: 'x', text: 'hi' }],
    };
    expect(computeLeafDrawOrder(ast)).toEqual(['a', 'n1']);
  });

  it('the result is always a permutation of every classifier id and every ' +
     'note id, with no duplicates', () => {
    const ast = parse(
      'class X\npackage P {\nclass A\nnote "n" as N\n}\nclass Y\nnote left of X : hello',
    );
    const order = computeLeafDrawOrder(ast);
    const expectedIds = new Set([
      ...ast.classifiers.map((c) => c.id),
      ...ast.notes.map((n) => n.id),
    ]);
    expect(order.length).toBe(ast.classifiers.length + ast.notes.length);
    expect(new Set(order).size).toBe(order.length);
    expect(new Set(order)).toEqual(expectedIds);
  });
});
