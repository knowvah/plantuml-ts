/**
 * cdd3-T9 S-1 — `AbstractEntityDiagram#packSomePackage`
 * (`classdiagram/AbstractEntityDiagram.java:85-106`), gated by
 * `!pragma useIntermediatePackages false` (`ClassDiagram.java:84-85`).
 *
 * Upstream never collapses a dotted qualifier at resolution time: every
 * segment is its own Quark, materialised as a PACKAGE group (and its uid
 * minted, `abel/Entity.java:171`) by the leaf-creation sweep
 * (`net/atmp/CucaDiagram.java:239-240,325-336`). Only at `checkFinalError`
 * does the pack pass mark a single-child group `packed`
 * (`abel/Entity.java:717-741`) and prepend its first display line to the
 * child's. A packed group emits no `subgraph` (`svek/ClusterDotString.java:
 * 83-88`) and is never drawn (`svek/SvekResult.java:72-74`) — but its uid
 * tick stays burned.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';
import { packSomePackage } from '../../../src/diagrams/class/class-namespace-pack.js';

const PRAGMA = '!pragma useIntermediatePackages false';

function parse(source: string): ClassDiagramAST {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

function render(body: string): string {
  return renderSync(`@startuml\n${body}\n@enduml`, { measurer: new DeterministicMeasurer() });
}

/** Every `<g class="...">` open tag's (class, qualified-name, id) triple. */
function groupIds(svg: string): string[] {
  return [...svg.matchAll(/<g class="(cluster|entity)" data-qualified-name="([^"]*)" id="([^"]*)"/g)].map(
    (m) => `${m[1]!}:${m[2]!}=${m[3]!}`,
  );
}

describe('packSomePackage — parse side (AbstractEntityDiagram.java:85-106)', () => {
  it('sugifi: keeps the whole quark chain and packs the single-child outer group', () => {
    const ast = parse(`${PRAGMA}\nclass A.B.Z {\n}`);
    expect(ast.namespaces.map((n) => [n.id, n.display, n.packed === true, n.creationIndex])).toEqual([
      // Z = 1 (Entity ctor, CucaDiagram.java:228); A = 2, A.B = 3 (the
      // like-class sweep, CucaDiagram.java:239-240,325-336); A packed after.
      ['A', 'A', true, 2],
      ['A.B', 'A.B', false, 3],
    ]);
    expect(ast.namespaces[1]!.parentId).toBe('A');
  });

  it('sumule: packs every link of a longer chain, left to right (display "A.B.C.D")', () => {
    const ast = parse(`${PRAGMA}\nclass A.B.C.D.Z {\n}`);
    expect(ast.namespaces.map((n) => [n.id, n.display, n.packed === true])).toEqual([
      ['A', 'A', true],
      ['A.B', 'A.B', true],
      ['A.B.C', 'A.B.C', true],
      ['A.B.C.D', 'A.B.C.D', false],
    ]);
  });

  it('does nothing without the pragma (ClassDiagram.java:84 gate)', () => {
    const ast = parse('class A.B.Z {\n}');
    expect(ast.namespaces.map((n) => [n.display, n.packed === true])).toEqual([
      ['A', false],
      ['B', false],
    ]);
  });

  it('does not pack a group that has a leaf of its own (Entity.java:722)', () => {
    const ast = parse(`${PRAGMA}\nclass A.X\nclass A.B.Z`);
    expect(ast.namespaces.find((n) => n.id === 'A')!.packed).toBeUndefined();
  });

  it('does not pack a group used as a link endpoint (Entity.java:724-726)', () => {
    const ast = parse(`${PRAGMA}\npackage A {\n package B {\n class Z\n }\n}\nA --> C`);
    expect(ast.namespaces.find((n) => n.id === 'A')!.packed).toBeUndefined();
  });

  it('does not pack onto a child group with no children (Entity.java:728-730)', () => {
    const ast: ClassDiagramAST = {
      ...parse('class Q'),
      namespaces: [
        { id: 'A', display: 'A', classifiers: [], creationIndex: 1 },
        { id: 'A.B', display: 'B', classifiers: [], parentId: 'A', creationIndex: 2 },
      ],
    };
    packSomePackage(ast, '.');
    expect(ast.namespaces.map((n) => n.packed === true)).toEqual([false, false]);
  });

  it('uses the active separator and keeps only the FIRST display line of the packed group', () => {
    const ast: ClassDiagramAST = {
      ...parse('class Q'),
      namespaces: [
        { id: 'A', display: 'A\\nsecond', classifiers: [], creationIndex: 1 },
        { id: 'A::B', display: 'B', classifiers: ['A::B::Z'], parentId: 'A', creationIndex: 2 },
      ],
    };
    packSomePackage(ast, '::');
    expect(ast.namespaces[1]!.display).toBe('A::B');
    expect(ast.namespaces[0]!.packed).toBe(true);
  });

  it('re-escapes a backslash in the packed first line so the child display re-parses to it', () => {
    const ast: ClassDiagramAST = {
      ...parse('class Q'),
      namespaces: [
        { id: 'A', display: 'x\\\\y', classifiers: [], creationIndex: 1 },
        { id: 'A.B', display: 'B', classifiers: ['A.B.Z'], parentId: 'A', creationIndex: 2 },
      ],
    };
    packSomePackage(ast, null);
    // Display line 0 of `x\\y` is `x\y`; prepended as the raw `x\\y.`.
    expect(ast.namespaces[1]!.display).toBe('x\\\\y.B');
  });
});

describe('packSomePackage — render side (uids, cluster emission)', () => {
  it('sugifi-33-xefe083: cluster A.B keeps uid ent0003; packed A burns ent0002 and draws nothing', () => {
    const svg = render(`${PRAGMA}\nclass A.B.Z {\n}`);
    expect(groupIds(svg)).toEqual(['cluster:A.B=ent0003', 'entity:A.B.Z=ent0001']);
    expect(svg).toContain('>A.B</text>');
  });

  it('sumule-00-pefa744: cluster A.B.C.D keeps uid ent0005 (A..A.B.C burn 2-4)', () => {
    const svg = render(`${PRAGMA}\nclass A.B.C.D.Z {\n}`);
    expect(groupIds(svg)).toEqual(['cluster:A.B.C.D=ent0005', 'entity:A.B.C.D.Z=ent0001']);
    expect(svg).toContain('>A.B.C.D</text>');
  });

  it('xadudi-62-pupa491: explicit nested packages pack too (jar: foo1.foo2 ent0002, foo3 ent0003)', () => {
    const svg = render(`set separator .\n${PRAGMA}\npackage foo1 {\n package foo2 {\n class foo3\n }\n}`);
    expect(groupIds(svg)).toEqual(['cluster:foo1.foo2=ent0002', 'entity:foo1.foo2.foo3=ent0003']);
    expect(svg).toContain('>foo1.foo2</text>');
  });
});
