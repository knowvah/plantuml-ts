/**
 * A2s round 2, R2h — a USymbol-naming `<<stereotype>>` on a `package` header
 * selects the group's SHAPE instead of being displayed (daxeno-00-kasu166).
 *
 * Upstream `CommandPackage` passes `USymbols.fromString(stereotype, ...)` to
 * `gotoGroup` as the group's USymbol whenever the registry lookup hits, and
 * only calls `setStereotype` when it does NOT. Pre-fix the port's gated
 * branch dropped the match entirely; now it records the mapped descriptive
 * keyword in `state.descriptiveContainers`, so the existing `closeContainer`
 * collapse attaches it to the collapsed-empty leaf and routes sizing through
 * `tryMeasureDescriptionLeaf` (R2c verified the description engine
 * reproduces daxeno's golden node byte-exact for the identical title).
 * @see ~/git/plantuml/.../command/CommandPackage.java:178-191
 * @see ~/git/plantuml/.../decoration/symbol/USymbols.java:60-95,98-120
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

function leaf(ast: ReturnType<typeof parseClass>, id: string): Classifier | undefined {
  return ast.classifiers.find((c) => c.id === id);
}

describe('R2h — gated USymbol package stereotype selects the shape', () => {
  it('collapses an empty <<Database>> package to a database descriptive leaf', () => {
    const ast = parse('package "db" <<Database>> {\n}\nclass foo');
    const c = leaf(ast, 'db');
    expect(c).toBeDefined();
    expect(c!.kind).toBe('descriptive');
    expect(c!.usymbol).toBe('database');
    // The stereotype was CONSUMED as the shape — never displayed.
    expect(c!.stereotype).toBeUndefined();
  });

  it('maps the registry name case-insensitively (<<cloud>>)', () => {
    const ast = parse('package "c" <<cloud>> {\n}\nclass foo');
    expect(leaf(ast, 'c')!.usymbol).toBe('cloud');
  });

  it('a registry name with no port keyword (<<Group>>) stays dropped', () => {
    // GROUP is a group-only USymbol with no leaf keyword in upstream's
    // ALL_TYPES grammar — consumed (never displayed) but unmapped, so the
    // package stays a plain namespace at parse time (its final-collapse
    // happens at layout time, collapseEmptyNamespacesFinal).
    const ast = parse('package "g" <<Group>> {\n}\nclass foo');
    expect(leaf(ast, 'g')).toBeUndefined();
    const ns = ast.namespaces.find((n) => n.id === 'g');
    expect(ns).toBeDefined();
    expect(ns!.stereotype).toBeUndefined();
  });

  it('a non-USymbol stereotype (<<Foo>>) is still displayed, not a shape', () => {
    const ast = parse('package "p" <<Foo>> {\n}\nclass foo');
    expect(leaf(ast, 'p')).toBeUndefined();
    const ns = ast.namespaces.find((n) => n.id === 'p');
    expect(ns).toBeDefined();
    expect(ns!.stereotype).toBe('Foo');
  });

  it('a NON-empty <<Database>> package keeps its namespace cluster', () => {
    const ast = parse('package "db2" <<Database>> {\nclass inner\n}');
    expect(leaf(ast, 'db2')).toBeUndefined();
    expect(ast.namespaces.some((n) => n.id === 'db2')).toBe(true);
  });
});
