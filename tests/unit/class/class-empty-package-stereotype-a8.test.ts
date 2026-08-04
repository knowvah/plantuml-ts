/**
 * A2s F-G mechanism A8: a `package P <<Stereo>> { }` header's stereotype
 * must survive the collapse of the (still-empty) package into an
 * `EntityImageEmptyPackage` rect leaf, so the leaf's stereo block widens
 * the node (`class-namespace-shape.ts#measureEmptyPackageLeafDim`, already
 * jar-exact for dojanu-92-vizo468 p3: 85.7875x48px = 1.191493x0.666667in).
 *
 * Upstream chain:
 *  - `CommandPackage#executeArg` captures STEREOTYPE and calls
 *    `p.setStereotype(Stereotype.build(stereotype))` ONLY when
 *    `USymbols.fromString(stereotype, ...)` returns null — a stereotype
 *    naming a USymbol (`<<Rectangle>>`, `<<Database>>`, ...) selects the
 *    package SHAPE instead of being displayed.
 *    @see ~/git/plantuml/.../command/CommandPackage.java:178-193
 *  - `CommandNamespace#executeArg` has the same gate
 *    (@see ~/git/plantuml/.../command/CommandNamespace.java:113-124);
 *    `CommandNamespace2` (quoted `"Display" as alias` form) sets the
 *    stereotype UNCONDITIONALLY — no `USymbols.fromString` call at all
 *    (@see ~/git/plantuml/.../command/CommandNamespace2.java:122-124).
 *  - `USymbols.fromString` matches `goUpperCase(s.replaceAll("\\W", ""))`
 *    against the registry names (@see ~/git/plantuml/.../decoration/symbol/
 *    USymbols.java:98-120); the bracket-including special cases
 *    (`equalsIgnoreCase("package")` etc.) can never match a `<<...>>`
 *    string, so only the registry lookup is live on this path.
 *  - `EntityImageEmptyPackage` builds its stereo block from
 *    `entity.getStereotype()` (@see ~/git/plantuml/.../svek/image/
 *    EntityImageEmptyPackage.java:126-137).
 *
 * Scope guard: a NON-empty package keeps its stereotype on the `Namespace`
 * only — no cluster-title stereotype display is wired (out of A8 scope).
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import { collapseEmptyNamespacesFinal } from '../../../src/diagrams/class/class-namespace.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('A8: package stereotype reaches the collapsed-empty-package leaf', () => {
  it('same-line `package P <<Dummy>> {}` collapses with the stereotype', () => {
    const ast = parse(`
      package p3 <<Dummy>> {}
      class Foo
    `);
    const p3 = ast.classifiers.find((c) => c.id === 'p3');
    expect(p3).toBeDefined();
    expect(p3!.kind).toBe('descriptive');
    expect(p3!.stereotype).toBe('Dummy');
  });

  it('multi-line empty package keeps the stereotype through the final collapse (dojanu-92 p3 shape)', () => {
    const ast = collapseEmptyNamespacesFinal(parse(`
      package p1 <<Dummy>> {
      class Foo1 <<Other>>
      }
      package p3 <<Dummy>> {
      }
    `));
    const p3 = ast.classifiers.find((c) => c.id === 'p3');
    expect(p3).toBeDefined();
    expect(p3!.stereotype).toBe('Dummy');
    // p1 is non-empty: survives as a cluster; its stereotype stays on the
    // Namespace and does NOT leak onto any classifier (scope guard).
    expect(ast.namespaces.map((n) => n.id)).toEqual(['p1']);
    expect(ast.namespaces[0]!.stereotype).toBe('Dummy');
    expect(ast.classifiers.find((c) => c.display === 'Foo1')!.stereotype).toBe('Other');
  });

  it('a USymbol-naming stereotype selects the shape upstream and is NOT stored (CommandPackage gate)', () => {
    const ast = parse(`
      package a <<Rectangle>> {}
      package b <<Database>> {}
      package c <<data base>> {}
    `);
    // `<<data base>>`: \W-strip joins to "DATABASE" — still a USymbol name.
    for (const id of ['a', 'b', 'c']) {
      const leaf = ast.classifiers.find((c) => c.id === id);
      expect(leaf).toBeDefined();
      expect(leaf!.stereotype).toBeUndefined();
    }
  });

  it('`namespace N <<Dummy>> {}` carries the stereotype too (CommandNamespace, same gate)', () => {
    const ast = parse(`
      namespace n1 <<Dummy>> {}
      namespace n2 <<Frame>> {}
    `);
    expect(ast.classifiers.find((c) => c.id === 'n1')!.stereotype).toBe('Dummy');
    expect(ast.classifiers.find((c) => c.id === 'n2')!.stereotype).toBeUndefined();
  });

  it('`namespace "D" as n <<Rectangle>> {}` stores it UNGATED (CommandNamespace2 has no USymbol gate)', () => {
    const ast = parse(`
      namespace "D" as n <<Rectangle>> {}
    `);
    expect(ast.classifiers.find((c) => c.id === 'n')!.stereotype).toBe('Rectangle');
  });

  it('package stereotype coexists with an url and a color spec in the header', () => {
    const ast = parse(`
      package p <<Dummy>> [[http://example.com]] #DDDDDD {}
    `);
    expect(ast.classifiers.find((c) => c.id === 'p')!.stereotype).toBe('Dummy');
  });
});
