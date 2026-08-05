/**
 * A2s R2d (rakuci-96-tuti371): a NESTED descriptive container / namespace
 * opened with a quoted display and an alias must keep the quoted display
 * verbatim (spaces included).
 *
 * Upstream mechanism: `CommandPackageWithUSymbol#executeArg`
 * (descdiagram/command/CommandPackageWithUSymbol.java:178-198) threads the
 * DISPLAY capture — quotes stripped, inner text verbatim — into
 * `CucaDiagram#gotoGroup` (net/atmp/CucaDiagram.java:349-355), which calls
 * `result.setDisplay(display)` on the newly-created group entity; nesting
 * depth plays no part. An EXISTING group keeps its display (`setDisplay`
 * only runs under `quark.getData() == null`).
 *
 * The port previously lost the display for a NESTED container only: the
 * enclosing package qualifies the id to a dotted path
 * (`openNamespaceBlock` → `ensureNamespaceChain`), and the chain creates
 * each level with `display: seg` — the alias, not the quoted display. The
 * standalone (non-dotted) branch already threaded it.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function parse(lines: string[]): ReturnType<typeof parseClass> {
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('nested container quoted display (A2s R2d, rakuci-96-tuti371)', () => {
  it('keeps the quoted display verbatim for an aliased EMPTY nested rectangle', () => {
    const ast = parse([
      'package " XY " as XXY [[/text/web/92:2]] {',
      'rectangle " YY " as YYY [[/text/web/222:0]] {',
      '}',
      '}',
    ]);
    // The empty rectangle collapses to a descriptive rect leaf whose display
    // is the QUOTED text, spaces preserved — never the alias.
    const leaf = ast.classifiers.find((c) => c.id === 'XXY.YYY');
    expect(leaf).toBeDefined();
    expect(leaf!.display).toBe(' YY ');
  });

  it('keeps the quoted display on a NON-empty nested rectangle cluster', () => {
    const ast = parse([
      'package " XY " as XXY {',
      'rectangle " YX " as XYY {',
      'class " AB " as AAB',
      '}',
      '}',
    ]);
    const ns = ast.namespaces.find((n) => n.id === 'XXY.XYY');
    expect(ns).toBeDefined();
    expect(ns!.display).toBe(' YX ');
  });

  it('keeps the quoted display for a nested `namespace "Display" as alias`', () => {
    const ast = parse([
      'package outer {',
      'namespace "My Space" as ms {',
      '}',
      '}',
    ]);
    const ns = ast.namespaces.find((n) => n.id === 'outer.ms');
    // Still open-then-closed empty plain namespace: collapse is deferred, so
    // it survives as a namespace here — display must be the quoted text.
    expect(ns).toBeDefined();
    expect(ns!.display).toBe('My Space');
  });

  it('does NOT overwrite the display when re-entering an existing group (gotoGroup gate)', () => {
    const ast = parse([
      'package P {',
      'rectangle "First" as R {',
      'class C1',
      '}',
      'rectangle "Second" as R {',
      'class C2',
      '}',
      '}',
    ]);
    const ns = ast.namespaces.find((n) => n.id === 'P.R');
    expect(ns).toBeDefined();
    // CucaDiagram.java:351-355 — setDisplay only on creation.
    expect(ns!.display).toBe('First');
  });

  it('leaves a dotted bare-name package display on segment semantics (no regression)', () => {
    const ast = parse(['package a.b {', 'class C', '}']);
    const inner = ast.namespaces.find((n) => n.id === 'a.b');
    expect(inner).toBeDefined();
    expect(inner!.display).toBe('b');
  });
});
