/**
 * A2s round 2 / R2g — hide/show portion directives written INSIDE a
 * `package { }` block are scoped to that package's DIRECT children, not
 * global. Upstream `CommandHideShowByGender#executeArg` ANDs the gender with
 * `byPackage(currentGroup)` whenever the current group is non-root
 * (classdiagram/command/CommandHideShowByGender.java:272-273), and
 * `byPackage.contains` is DIRECT parent-container equality only — an entity
 * in a nested subpackage does NOT match the outer package's directive
 * (abel/EntityGenderUtils.java:91-104; jar-probe h1, R2e).
 *
 * Symptom fixture: jecopa-66-vepe168 (`hide methods` + `hide enum fields`
 * inside `package example { }`) — jar keeps root-level Dummy1's methods
 * (2.261806x1.444444) while our port hid them globally (1.222222x0.944444,
 * delta 1.039584).
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { Classifier } from '../../../src/diagrams/class/ast.js';
import { layoutClass, classifierLeaves } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';

const measurer = new FormulaMeasurer();

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

function classifier(ast: ReturnType<typeof parseClass>, id: string): Classifier {
  const c = ast.classifiers.find((x) => x.id === id);
  if (c === undefined) throw new Error(`no classifier ${id}`);
  return c;
}

// ---------------------------------------------------------------------------
// Parse — the enclosing group is captured onto the directive
// ---------------------------------------------------------------------------

describe('hide/show directive package scope — parse capture', () => {
  it('stamps scopeNsId on a global-portion directive inside a package', () => {
    const ast = parse(`
      package example {
        class A
        hide methods
      }
    `);
    expect(ast.directives).toHaveLength(1);
    expect(ast.directives[0]).toMatchObject({
      kind: 'hideshow', action: 'hide', target: 'methods', scopeNsId: 'example',
    });
  });

  it('leaves scopeNsId unset for a root-level directive', () => {
    const ast = parse(`
      class A
      hide methods
    `);
    expect(ast.directives).toHaveLength(1);
    expect(ast.directives[0]!.scopeNsId).toBeUndefined();
  });

  it('stamps scopeNsId on a kind directive inside a package', () => {
    const ast = parse(`
      package example {
        enum Foo2
        hide enum fields
      }
    `);
    expect(ast.hideKindDirectives).toHaveLength(1);
    expect(ast.hideKindDirectives![0]).toMatchObject({
      kind: 'hideshowkind', classifierKind: 'enum', target: 'fields', scopeNsId: 'example',
    });
  });

  it('stamps scopeNsId on an entity-qualified directive inside a package', () => {
    const ast = parse(`
      package example {
        class A {
          +m()
        }
        hide A methods
      }
    `);
    expect(ast.hideEntityDirectives).toHaveLength(1);
    expect(ast.hideEntityDirectives![0]).toMatchObject({
      kind: 'hideshowentity', target: 'methods', scopeNsId: 'example',
    });
  });

  it('stamps the NESTED package id when the directive sits in a subpackage', () => {
    const ast = parse(`
      package outer {
        package inner {
          class C
          hide methods
        }
      }
    `);
    expect(ast.directives[0]!.scopeNsId).toBe('outer.inner');
  });
});

// ---------------------------------------------------------------------------
// Apply — direct children only (jecopa-66-vepe168 shape)
// ---------------------------------------------------------------------------

const JECOPA_SHAPE = `
  class Dummy1 {
    +m1()
    +String a1
  }
  package example {
    enum Foo2
    class Dummy3 {
      +m1()
      +String a1
    }
    hide methods
    hide enum fields
  }
  enum Foo1
`;

describe('hide/show directive package scope — application', () => {
  it('hides methods only on the package direct children (member.hidden marking)', () => {
    const ast = parse(JECOPA_SHAPE);
    const d1 = classifier(ast, 'Dummy1');
    const d3 = classifier(ast, 'example.Dummy3');
    expect(d1.members.every((m) => m.hidden !== true)).toBe(true);
    expect(d3.members.filter((m) => m.params !== undefined).every((m) => m.hidden === true)).toBe(true);
    expect(d3.members.filter((m) => m.params === undefined).every((m) => m.hidden !== true)).toBe(true);
  });

  it('applies the kind directive only inside the package (suppressFields)', () => {
    const ast = parse(JECOPA_SHAPE);
    expect(classifier(ast, 'example.Foo2').suppressFields).toBe(true);
    expect(classifier(ast, 'Foo1').suppressFields).not.toBe(true);
  });

  it('does NOT reach a nested subpackage (jar probe h1: direct children only)', () => {
    const ast = parse(`
      package outer {
        hide methods
        class Direct {
          +m()
        }
        package inner {
          class Nested {
            +m()
          }
        }
      }
      class Outside {
        +m()
      }
    `);
    expect(classifier(ast, 'outer.Direct').members[0]!.hidden).toBe(true);
    expect(classifier(ast, 'outer.inner.Nested').members[0]!.hidden).not.toBe(true);
    expect(classifier(ast, 'Outside').members[0]!.hidden).not.toBe(true);
  });

  it('scopes hide circle to the package direct children', () => {
    const ast = parse(`
      class A
      package p {
        class B
        hide circle
      }
    `);
    expect(classifier(ast, 'A').hideCircle).not.toBe(true);
    expect(classifier(ast, 'p.B').hideCircle).toBe(true);
  });

  it('does not let a scoped entity directive reach a same-named root entity', () => {
    const ast = parse(`
      class A {
        +m()
      }
      package p {
        class B
        hide A methods
      }
    `);
    expect(classifier(ast, 'A').suppressMethods).not.toBe(true);
  });

  it('a later root-level directive still applies globally (last writer wins per entity)', () => {
    const ast = parse(`
      package p {
        class B {
          +m()
        }
        hide methods
      }
      class A {
        +m()
      }
      hide methods
    `);
    expect(classifier(ast, 'A').members[0]!.hidden).toBe(true);
    expect(classifier(ast, 'p.B').members[0]!.hidden).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Layout — the sizing fold honors the scope (the R2g delta mechanism)
// ---------------------------------------------------------------------------

describe('hide/show directive package scope — layout sizing', () => {
  it('a scoped "hide methods" shrinks only the in-package twin', () => {
    const ast = parse(`
      class Twin1 {
        +aVeryLongMethodName()
        +String a1
      }
      package example {
        class Twin2 {
          +aVeryLongMethodName()
          +String a1
        }
        hide methods
      }
      Twin1 -- Twin2
    `);
    const geo = layoutClass(ast, defaultTheme, measurer);
    const g1 = classifierLeaves(geo.leaves).find((c) => c.id === 'Twin1')!;
    const g2 = classifierLeaves(geo.leaves).find((c) => c.id === 'example.Twin2')!;
    // Identical bodies: the out-of-scope twin must keep its methods
    // compartment and therefore be strictly taller than the suppressed one.
    expect(g1.height).toBeGreaterThan(g2.height);
  });

  it('a scoped "hide empty methods" leaves the root twin its empty compartment', () => {
    const ast = parse(`
      class Twin1 {
        +String a1
      }
      package example {
        class Twin2 {
          +String a1
        }
        hide empty methods
      }
      Twin1 -- Twin2
    `);
    const geo = layoutClass(ast, defaultTheme, measurer);
    const g1 = classifierLeaves(geo.leaves).find((c) => c.id === 'Twin1')!;
    const g2 = classifierLeaves(geo.leaves).find((c) => c.id === 'example.Twin2')!;
    expect(g1.height).toBeGreaterThan(g2.height);
  });
});
