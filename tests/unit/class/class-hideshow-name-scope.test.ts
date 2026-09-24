/**
 * cdd-T31 (A2b E5): three compounding gaps in the pattern-form `hide`/`show`
 * matcher, all rooted in upstream's single `HideOrShow`/`fixWhat` mechanism.
 *
 * (a) `matchEntityName` unconditionally stripped a qualified id to its leaf
 *     segment; upstream (`HideOrShow#match`, cucadiagram/HideOrShow.java:
 *     107-122) strips only when the id contains `Plasma.MAGIC_SEPARATOR`
 *     (`\u0001`) -- which a class diagram's default `.`-separator
 *     (AbstractClassOrObjectDiagram.java:65) never produces. Only `set
 *     separator none` (plasma/Plasma.java:52,85-88) restores that.
 * (b) `computeHiddenIds` never walked `ast.namespaces`, and never cascaded a
 *     hidden container's status to its children (`Entity#isHidden`,
 *     abel/Entity.java:428-440: `parentContainer.isHidden()` recurses up).
 * (c) A pattern-form directive parsed inside a `package {}` block never
 *     resolved to a same-package sibling: `CucaDiagram#fixWhat` (net/atmp/
 *     CucaDiagram.java:638-646) unconditionally PREFIXES `what` with the
 *     enclosing group's qualified id + separator before matching.
 *
 * cicovi-23-zipe215/senece-96-fomu913/verufu-58-jile750 are the corpus
 * fixtures naming these three; the JSON-shaped tests below mirror them.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { computeHiddenIds } from '../../../src/diagrams/class/class-directives.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

// ---------------------------------------------------------------------------
// (a) separator-aware leaf strip
// ---------------------------------------------------------------------------

describe('matchEntityName is separator-aware (defect a, cicovi-23-zipe215)', () => {
  it('a root-level "hide Foo1" does NOT hide the qualified pack1.Foo1 sibling', () => {
    const ast = parse(['package pack1 {', 'class Foo1', '}', 'class Foo2', 'class Foo3', 'hide Foo1'].join('\n'));
    expect(computeHiddenIds(ast).size).toBe(0);
  });

  it('under "set separator none", the bare pattern strips to the leaf and matches', () => {
    // Foo1 is qualified ("pack1.Foo1") while the default "." separator is
    // still active; `set separator none` AFTER that flips the diagram-level
    // flag `matchEntityName` reads (ast.namespaceSeparator's own doc
    // comment on why this is diagram-level, not per-entity-creation-time)
    // -- the leftover "." in the already-built id is what the strip finds.
    const ast = parse(['package pack1 {', 'class Foo1', '}', 'set separator none', 'hide Foo1'].join('\n'));
    expect(ast.namespaceSeparator).toBeNull();
    expect([...computeHiddenIds(ast)]).toEqual(['pack1.Foo1']);
  });

  it('the default (unset) namespaceSeparator behaves as "." (no strip)', () => {
    const ast = parse(['package pack1 {', 'class Foo1', '}', 'hide Foo1'].join('\n'));
    expect(ast.namespaceSeparator).toBe('.');
  });
});

// ---------------------------------------------------------------------------
// (c) fixWhat in-package prefix
// ---------------------------------------------------------------------------

describe('pattern-form hide/show carries the fixWhat scope prefix (defect c)', () => {
  it('an in-package "hide Foo1" DOES hide its same-package sibling pack1.Foo1', () => {
    const ast = parse(['package pack1 {', 'class Foo1', 'hide Foo1', '}', 'class Foo2'].join('\n'));
    expect(ast.hidePatternDirectives).toHaveLength(1);
    expect(ast.hidePatternDirectives![0]!.scopeNsId).toBe('pack1');
    expect([...computeHiddenIds(ast)]).toEqual(['pack1.Foo1']);
  });

  it('a root-level pattern directive carries no scopeNsId', () => {
    const ast = parse(['class Foo1', 'hide Foo1'].join('\n'));
    expect(ast.hidePatternDirectives![0]!.scopeNsId).toBeUndefined();
  });

  it('the in-package prefix does not reach a same-named ROOT entity', () => {
    const ast = parse(['class Foo1', 'package pack1 {', 'class Bar', 'hide Foo1', '}'].join('\n'));
    expect(computeHiddenIds(ast).has('Foo1')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (b) namespace walk + ancestor cascade
// ---------------------------------------------------------------------------

describe('computeHiddenIds walks namespaces and cascades to children (defect b, senece-96-fomu913)', () => {
  it('"hide util" hides the namespace id itself', () => {
    const ast = parse(['class Foo1', 'package util {', 'class util1', '}', 'hide util'].join('\n'));
    expect(computeHiddenIds(ast).has('util')).toBe(true);
  });

  it('"hide util" cascades to util1 even though util1 matches no directive directly', () => {
    const ast = parse(['class Foo1', 'package util {', 'class util1', '}', 'hide util'].join('\n'));
    expect(computeHiddenIds(ast).has('util.util1')).toBe(true);
  });

  it('a sibling top-level classifier is unaffected by the cascade', () => {
    const ast = parse(['class Foo1', 'package util {', 'class util1', '}', 'hide util'].join('\n'));
    expect(computeHiddenIds(ast).has('Foo1')).toBe(false);
  });

  it('senece shape: hide Foo1 / hide Foo3 / hide util hides exactly {Foo1,Foo3,util,util.util1}', () => {
    const ast = parse(
      [
        'class Foo1',
        'class Foo2',
        'hide Foo1',
        'class Foo3',
        'Foo2 *-- Foo3',
        'hide Foo3',
        'package util {',
        'class util1',
        '}',
        'hide util',
      ].join('\n'),
    );
    expect([...computeHiddenIds(ast)].sort()).toEqual(['Foo1', 'Foo3', 'util', 'util.util1']);
  });

  it('a nested grandchild cascades through two ancestor levels', () => {
    const ast = parse(['package outer {', 'package inner {', 'class Leaf', '}', '}', 'hide outer'].join('\n'));
    const hidden = computeHiddenIds(ast);
    expect(hidden.has('outer')).toBe(true);
    expect(hidden.has('outer.inner')).toBe(true);
    expect(hidden.has('outer.inner.Leaf')).toBe(true);
  });

  it('does not cascade DOWN-to-UP: hiding a child never hides its parent', () => {
    const ast = parse(['package p {', 'class Child', 'hide Child', '}'].join('\n'));
    expect(computeHiddenIds(ast).has('p')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (b) $tag fold on Namespace -- readiness test (verufu-58-jile750's shape).
// The real parser does not yet populate Namespace.tags (class-command-
// containers.ts's `package` regex still discards its TAGS runs -- a stop-
// condition-1 gap outside this task's write-set); this constructs the AST
// directly to prove the FOLD+CASCADE logic in computeHiddenIds is correct
// and ready for whenever that population lands.
// ---------------------------------------------------------------------------

describe('computeHiddenIds folds $tag against a tagged Namespace (verufu-58-jile750 shape)', () => {
  const ast: ClassDiagramAST = {
    classifiers: [
      { id: 'foo1', display: 'foo1', kind: 'class', typeParams: [], members: [], tags: ['tag1'] },
      { id: 'p1.inside1', display: 'inside1', kind: 'class', typeParams: [], members: [], namespace: 'p1' },
      { id: 'foo3', display: 'foo3', kind: 'class', typeParams: [], members: [] },
    ],
    relationships: [],
    namespaces: [{ id: 'p1', display: 'p1', classifiers: ['p1.inside1'], tags: ['txn'] }],
    directives: [],
    notes: [],
    hidePatternDirectives: [{ kind: 'hideshowpattern', action: 'hide', what: '$txn' }],
  };

  it('hides the tagged namespace p1', () => {
    expect(computeHiddenIds(ast).has('p1')).toBe(true);
  });

  it('cascades to p1.inside1', () => {
    expect(computeHiddenIds(ast).has('p1.inside1')).toBe(true);
  });

  it('leaves foo1 (a different tag) and foo3 (no tag) alone', () => {
    const hidden = computeHiddenIds(ast);
    expect(hidden.has('foo1')).toBe(false);
    expect(hidden.has('foo3')).toBe(false);
  });
});
