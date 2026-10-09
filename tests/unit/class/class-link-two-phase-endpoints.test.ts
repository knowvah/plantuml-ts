/**
 * cdd3-T9 S-1b — `CommandLinkClass#executeArg` resolves BOTH endpoints'
 * quarks (`quarkInContextSafe`, `CommandLinkClass.java:320-325` — a pure
 * Quark registration, no uid tick) BEFORE creating either missing leaf
 * (`reallyCreateLeaf`, `:327-333` — the `Entity` constructor's tick,
 * `abel/Entity.java:171`, then the like-class phantom-group sweep,
 * `net/atmp/CucaDiagram.java:239-240,325-336`). So the FIRST leaf's sweep
 * already sees the SECOND endpoint's registered package chain and numbers it.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';

function parse(source: string): ClassDiagramAST {
  const block: UmlSource = { lines: source.split('\n'), type: 'class' };
  return parseClass(block);
}

const XUMOFU = [
  'java.lang.Object <|-- classic.collections.ArrayList',
  'classic.collections.ArrayList <|-- net.sourceforge.plantuml.ArrayList',
].join('\n');

describe('two-phase link endpoint creation (CommandLinkClass.java:320-333)', () => {
  it('xumofu-43-fode658: creation ticks follow resolve-both-then-create', () => {
    const ast = parse(XUMOFU);
    const ticks = new Map<string, number | undefined>([
      ...ast.classifiers.map((c) => [c.id, c.creationIndex] as const),
      ...ast.namespaces.map((n) => [n.id, n.creationIndex] as const),
    ]);
    expect(Object.fromEntries(ticks)).toEqual({
      // Line 1: Object's ctor (1), its sweep numbers java/java.lang (2,3)
      // AND the already-registered classic/classic.collections (4,5);
      // ArrayList's ctor (6); the link (7).
      'java.lang.Object': 1,
      java: 2,
      'java.lang': 3,
      classic: 4,
      'classic.collections': 5,
      'classic.collections.ArrayList': 6,
      // Line 2: the new ArrayList (8), its sweep (9-11); the link is 12.
      'net.sourceforge.plantuml.ArrayList': 8,
      net: 9,
      'net.sourceforge': 10,
      'net.sourceforge.plantuml': 11,
    });
    expect(ast.relationships.map((r) => r.creationIndex)).toEqual([7, 12]);
    // Member lists are not duplicated by the early (quark) registration.
    expect(ast.namespaces.find((n) => n.id === 'classic.collections')!.classifiers).toEqual([
      'classic.collections.ArrayList',
    ]);
  });

  it('xumofu-43-fode658: rendered uids equal the jar', () => {
    const svg = renderSync(`@startuml\n${XUMOFU}\n@enduml`, { measurer: new DeterministicMeasurer() });
    const ids = [...svg.matchAll(/data-qualified-name="([^"]*)" id="([^"]*)"/g)].map((m) => `${m[1]!}=${m[2]!}`);
    expect(ids).toEqual([
      'java=ent0002',
      'java.lang=ent0003',
      'classic=ent0004',
      'classic.collections=ent0005',
      'net=ent0009',
      'net.sourceforge=ent0010',
      'net.sourceforge.plantuml=ent0011',
      'java.lang.Object=ent0001',
      'classic.collections.ArrayList=ent0006',
      'net.sourceforge.plantuml.ArrayList=ent0008',
    ]);
  });

  it('a bare second endpoint reuses the FIRST endpoint registered in phase 1 (Plasma#countByName)', () => {
    // quark1 `A.Foo` is registered before quark2 resolves, so `countByName
    // ("Foo") == 1` (Plasma.java:104-108 counts data-less quarks) and the
    // bare `Foo` resolves to it (CucaDiagram.java:264-271): one leaf.
    const ast = parse('A.Foo <|-- Foo');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A.Foo']);
    expect(ast.relationships.map((r) => [r.from, r.to])).toEqual([['A.Foo', 'A.Foo']]);
  });

  it('a self-link on a new name creates one leaf', () => {
    const ast = parse('Foo -- Foo');
    expect(ast.classifiers.map((c) => [c.id, c.creationIndex])).toEqual([['Foo', 1]]);
    expect(ast.relationships.map((r) => r.creationIndex)).toEqual([2]);
  });
});
