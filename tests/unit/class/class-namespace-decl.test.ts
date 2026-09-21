/**
 * Namespace/package block-open regex coverage (mission A2, Fix 1):
 *  - same-line empty body `namespace X {}` / `package X {}` — must register
 *    (and immediately collapse) the empty namespace/package, matching the
 *    oracle DOT for gatula-10-bifu561 (three flat `shape=rect` leaves, no
 *    cluster subgraph — verified via `dot-sync-report.ts --slug
 *    gatula-10-bifu561 class`).
 *  - an optional `[[url {tooltip}]]` segment between the name and a trailing
 *    `#color`/`{` (vacole-77-vivo236) — the tooltip's own `{`/`}` must not be
 *    mistaken for the block's opening/closing brace.
 *
 * @see ~/git/plantuml/.../command/CommandNamespace.java
 * @see ~/git/plantuml/.../command/CommandNamespaceEmpty.java
 * @see ~/git/plantuml/.../command/CommandPackageEmpty.java
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

describe('empty same-line namespace/package (gatula-10-bifu561)', () => {
  it('collapses an empty package and namespace to flat rect classifiers', () => {
    const ast = parse(`
      package foo {}
      namespace bar {}
      class qux {}
    `);
    const ids = ast.classifiers.map((c) => c.id).sort();
    expect(ids).toEqual(['bar', 'foo', 'qux']);
    // Neither empty container survives as a namespace/cluster.
    expect(ast.namespaces).toHaveLength(0);
    const foo = ast.classifiers.find((c) => c.id === 'foo')!;
    const bar = ast.classifiers.find((c) => c.id === 'bar')!;
    expect(foo.kind).toBe('descriptive');
    expect(bar.kind).toBe('descriptive');
    const qux = ast.classifiers.find((c) => c.id === 'qux')!;
    expect(qux.kind).toBe('class');
  });

  it('still opens a normal (non-empty) namespace as a cluster', () => {
    const ast = parse(`
      namespace bar {
        class X
      }
    `);
    expect(ast.namespaces.map((n) => n.id)).toEqual(['bar']);
    expect(ast.classifiers.map((c) => c.id)).toEqual(['bar.X']);
  });
});

describe('namespace with [[url {tooltip}]] + color (vacole-77-vivo236)', () => {
  it('parses the tooltip segment without corrupting the block body', () => {
    const ast = parse(`
      namespace Dummy [[http://www.google.com {this is a tooltip on Dummy}]] #DDDDDD {
      class foo
      }
    `);
    expect(ast.namespaces.map((n) => n.id)).toEqual(['Dummy']);
    expect(ast.classifiers.map((c) => c.id)).toEqual(['Dummy.foo']);
  });

  it('still handles a namespace with only a stereotype decoration', () => {
    const ast = parse(`
      namespace Foo <<cloud>> {
      class X
      }
    `);
    expect(ast.namespaces.map((n) => n.id)).toEqual(['Foo']);
    expect(ast.classifiers.map((c) => c.id)).toEqual(['Foo.X']);
  });
});

/**
 * cdd-T1: implicit (phantom) package uid ticks are deferred past the leaf
 * that caused them. Upstream never materialises an implicit intermediate
 * package eagerly: a qualified name only creates data-less Quarks, and the
 * `Entity` (which is where the uid is minted -- `abel/Entity.java:171`
 * `StringUtils.getUid("ent", diagram.getUniqueSequenceValue())`, off the one
 * shared `cpt1` counter at `net/atmp/CucaDiagram.java:129`) is created at the
 * TAIL of `reallyCreateLeaf`:
 *
 *   CucaDiagram.java:239-240   if (type.isLikeClass())
 *                                  eventuallyBuildPhantomGroups(location);
 *   CucaDiagram.java:325-336   for (Quark<Entity> quark : this.quarks()) {
 *                                  if (quark.getData() != null) continue;
 *                                  if (quark.countChildren() > 0)
 *                                      createGroup(location, quark, PACKAGE);
 *                              }
 *
 * An EXPLICIT `package a.b.c { }` still numbers its OWN innermost segment at
 * `gotoGroup` time (`CucaDiagram.java:349-355` creates a group for the ONE
 * quark it is handed) -- only its ancestors are phantoms and go late.
 * Expected values below are the jar's, read off the cached oracle SVGs.
 */
describe('implicit package uid ticks are deferred past their leaf (cdd-T1)', () => {
  it('xakatu-11-tapu041: the leaf takes slot 1, its 4 implicit packages 2..5', () => {
    const ast = parse('class javax.sound.sampled.AudioFormat.Encoding');
    const leaf = ast.classifiers.find((c) => c.id === 'javax.sound.sampled.AudioFormat.Encoding')!;
    expect(leaf.creationIndex).toBe(1);
    expect(ast.namespaces.map((n) => [n.id, n.creationIndex])).toEqual([
      ['javax', 2],
      ['javax.sound', 3],
      ['javax.sound.sampled', 4],
      ['javax.sound.sampled.AudioFormat', 5],
    ]);
  });

  it('vuresa-33-kumu160: leaf-then-its-own-implicit-parents, interleaved', () => {
    const ast = parse(`
      class My.Namespace.Person
      class My.Namespace.Meeting
      class Customer.Implementation.Namespace.Person
    `);
    const index = (id: string): number | undefined =>
      ast.classifiers.find((c) => c.id === id)?.creationIndex ?? ast.namespaces.find((n) => n.id === id)?.creationIndex;
    expect(index('My.Namespace.Person')).toBe(1);
    expect(index('My')).toBe(2);
    expect(index('My.Namespace')).toBe(3);
    expect(index('My.Namespace.Meeting')).toBe(4);
    expect(index('Customer.Implementation.Namespace.Person')).toBe(5);
    expect(index('Customer')).toBe(6);
    expect(index('Customer.Implementation')).toBe(7);
    expect(index('Customer.Implementation.Namespace')).toBe(8);
  });

  it('pidagu-83-dopu070: an EXPLICIT innermost package keeps its gotoGroup slot', () => {
    const ast = parse(`
      package org.junit.jupiter.engine {
      class AbstractJupisterTestEngineTests
      }
    `);
    const leaf = ast.classifiers.find((c) => c.id === 'org.junit.jupiter.engine.AbstractJupisterTestEngineTests')!;
    expect(leaf.creationIndex).toBe(2);
    expect(ast.namespaces.map((n) => [n.id, n.creationIndex])).toEqual([
      ['org', 3],
      ['org.junit', 4],
      ['org.junit.jupiter', 5],
      ['org.junit.jupiter.engine', 1],
    ]);
  });
});
