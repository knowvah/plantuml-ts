/**
 * SI1/T11 — class parser adoption of the shared `-[single]->` add-time
 * dedup (ADR-3): `CommandLinkClass` links flow through
 * `net.atmp.CucaDiagram#addLink` (:896-901) upstream, which silently drops
 * a `single` link when ANY other link already connects the same two
 * entities (`Link.sameConnections`, abel/Link.java:462-470 — endpoint
 * identity, either direction, ignoring style). Wired at the
 * relationship-push site (`class-command-relationships.ts`) via
 * `core/cucadiagram/linkDedup.ts`. Mirrors description's LG-10..LG-16
 * suite (tests/unit/description/parser.test.ts). Jar-oracle fixture:
 * oracle/goldens/class/si1-single-dedup-class/.
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

describe('class relationships — single keyword (add-time dedup, not a render style)', () => {
  it('CSD-1: A -[single]-> B parses with single=true, link kept (first of its pair)', () => {
    const ast = parse('class A\nclass B\nA -[single]-> B');
    expect(ast.relationships).toHaveLength(1);
    expect(ast.relationships[0]).toMatchObject({ from: 'A', to: 'B', single: true });
  });

  it('CSD-2: three identical single links between the same pair collapse to one', () => {
    const ast = parse(['A -[single]-> B', 'A -[single]-> B', 'A -[single]-> B'].join('\n'));
    expect(ast.relationships).toHaveLength(1);
  });

  it('CSD-3: a single link dedups against a same-pair link in EITHER direction', () => {
    const ast = parse(['A -[single]-> B', 'B -[single]-> A'].join('\n'));
    expect(ast.relationships).toHaveLength(1);
    expect(ast.relationships[0]).toMatchObject({ from: 'A', to: 'B' });
  });

  it('CSD-4: single dedup does not cross different endpoint pairs', () => {
    const ast = parse(['A -[single]-> B', 'A -[single]-> C', 'C -[single]-> B'].join('\n'));
    expect(ast.relationships).toHaveLength(3);
  });

  it('CSD-5: non-single links never dedup, even between the same pair', () => {
    const ast = parse(['A --> B', 'A --> B', 'A --> B'].join('\n'));
    expect(ast.relationships).toHaveLength(3);
  });

  it('CSD-6: a single link still dedups against a prior NON-single link on the same pair', () => {
    const ast = parse(['A --> B', 'A -[single]-> B'].join('\n'));
    expect(ast.relationships).toHaveLength(1);
    expect(ast.relationships[0]!.single).toBeUndefined();
  });

  it('CSD-7: both endpoints are still auto-created even when the link itself is dropped', () => {
    const ast = parse(['A -[single]-> B', 'A -[single]-> B'].join('\n'));
    expect(ast.classifiers.map((c) => c.id).sort()).toEqual(['A', 'B']);
  });

  it('CSD-8: a dropped duplicate still burns its shared-counter tick (Link ctor uid, abel/Link.java:135)', () => {
    // A(1), B(2), kept link(3), dropped link burns 4, C(5).
    const ast = parse(['A --> B', 'A -[single]-> B', 'class C'].join('\n'));
    expect(ast.relationships).toHaveLength(1);
    expect(ast.relationships[0]!.creationIndex).toBe(3);
    const c = ast.classifiers.find((cl) => cl.id === 'C');
    expect(c?.creationIndex).toBe(5);
  });

  it('CSD-9: dedup applies with single combined with other bracket tokens', () => {
    const ast = parse(['A --> B', 'A -[dotted,single]-> B'].join('\n'));
    expect(ast.relationships).toHaveLength(1);
  });
});
