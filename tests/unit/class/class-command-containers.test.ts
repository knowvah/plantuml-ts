/**
 * T11 — namespace `url`/`color`/`usymbol` AST fields (diagnosis A2b E4,
 * A3 M3). Parse-only: no render consumer exists yet (T12).
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { parseStyleBlock } from '../../../src/core/skinparam.js';
import { resolveStyleCascade } from '../../../src/core/style-map-element.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { Namespace } from '../../../src/diagrams/class/ast.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

function namespace(ast: ReturnType<typeof parseClass>, id: string): Namespace | undefined {
  return ast.namespaces.find((n) => n.id === id);
}

describe('T11 — Namespace.url', () => {
  it('captures a package header [[url]] onto Namespace.url (E4)', () => {
    const ast = parse('package foo [[http://x]] {\nclass Bar\n}');
    const ns = namespace(ast, 'foo');
    expect(ns?.url).toEqual({ url: 'http://x', tooltip: 'http://x', label: 'http://x' });
  });

  it('captures a namespace header [[url]] onto Namespace.url', () => {
    const ast = parse('namespace foo [[http://y{tip} label]] {\nclass Bar\n}');
    const ns = namespace(ast, 'foo');
    expect(ns?.url).toEqual({ url: 'http://y', tooltip: 'tip', label: 'label' });
  });

  it('leaves Namespace.url undefined when no bracket is written', () => {
    const ast = parse('package plain {\nclass Qux\n}');
    expect(namespace(ast, 'plain')?.url).toBeUndefined();
  });

  it('leaves Namespace.url undefined for a bracket the URL grammar cannot parse', () => {
    // The outer `[[...]]` capture only excludes `]`, so `[[a[b]]` matches
    // the command regex but fails every one of parseUrlBracket's 5
    // alternatives (the bare-link charset excludes `[`) -- a silent no-op,
    // same posture as a missing bracket.
    const ast = parse('package foo [[a[b]] {\nclass Bar\n}');
    expect(namespace(ast, 'foo')?.url).toBeUndefined();
  });
});

describe('T11 — Namespace.color', () => {
  it('captures a package inline #DDD background onto Namespace.color (M3)', () => {
    const ast = parse('package foo #DDD {\nclass Bar\n}');
    expect(namespace(ast, 'foo')?.color).toBe('#DDD');
  });

  it('captures a namespace #back:blue compound spec, resolved to its back half', () => {
    const ast = parse('namespace foo #back:blue;text:red {\nclass Bar\n}');
    expect(namespace(ast, 'foo')?.color).toBe('blue');
  });

  it('leaves Namespace.color undefined when no colour is written', () => {
    const ast = parse('package plain {\nclass Qux\n}');
    expect(namespace(ast, 'plain')?.color).toBeUndefined();
  });
});

describe('T11 — Namespace.usymbol', () => {
  it('surfaces a gated <<Node>> stereotype onto a NON-empty package Namespace', () => {
    const ast = parse('package foo <<Node>> {\nclass Bar\n}');
    const ns = namespace(ast, 'foo');
    expect(ns?.usymbol).toBe('node');
    // A8: consumed as the shape, never displayed.
    expect(ns?.stereotype).toBeUndefined();
  });

  it('surfaces <<Database>> the same way (case-insensitive registry match)', () => {
    const ast = parse('package "db2" <<Database>> {\nclass inner\n}');
    expect(namespace(ast, 'db2')?.usymbol).toBe('database');
  });

  it('leaves Namespace.usymbol undefined for a non-USymbol stereotype', () => {
    const ast = parse('package foo <<Custom>> {\nclass Bar\n}');
    const ns = namespace(ast, 'foo');
    expect(ns?.usymbol).toBeUndefined();
    expect(ns?.stereotype).toBe('Custom');
  });
});

describe('cdd2-T7b (R-8) — Namespace.usymbol for a DIRECT container keyword', () => {
  // `stack a as a { class foo1 }` (CommandPackageWithUSymbol, distinct
  // grammar from the `package X <<Node>>` gated-stereotype path above)
  // previously only recorded its keyword into the parser's transient
  // `state.descriptiveContainers` map (read by `closeContainer` for the
  // EMPTY->leaf collapse only) -- a NON-empty container's `Namespace.usymbol`
  // stayed `undefined`, so `NamespaceGeo.usymbol` never reached the render
  // dispatch (`class-namespace-usymbol-shape.ts#renderNamespaceUSymbol`),
  // which fell through to the generic folder-tab outline instead of
  // `USymbolStack#asBig`'s own chrome. `CommandPackageWithUSymbol.java:
  // 197-198`'s `diagram.gotoGroup(..., GroupType.PACKAGE, usymbol)` stamps
  // the group's USymbol UNCONDITIONALLY at open time, empty or not -- there
  // is no upstream branch that withholds it from a real (non-empty) cluster.
  it('surfaces "stack" onto a NON-empty direct-keyword container (lojiga-09-meka859)', () => {
    const ast = parse('stack a as a {\nclass foo1\nclass foo3\nclass foo2\n}');
    const ns = namespace(ast, 'a');
    expect(ns?.usymbol).toBe('stack');
    expect(ns?.classifiers.length).toBeGreaterThan(0);
  });

  it('still collapses an EMPTY direct-keyword container to a descriptive leaf', () => {
    // The pre-existing collapse path (`closeContainer`'s
    // `ns.classifiers.length > 0` branch) is unaffected by this fix -- an
    // empty `stack`/`rectangle`/... container still becomes a leaf, not a
    // real cluster, and that leaf's OWN `usymbol` (set separately, via
    // `collapseEmptyNamespace`) is unchanged.
    const ast = parse('stack a as a {\n}\nclass other');
    expect(namespace(ast, 'a')).toBeUndefined();
    const leaf = ast.classifiers.find((c) => c.id === 'a');
    expect(leaf?.kind).toBe('descriptive');
    expect(leaf?.usymbol).toBe('stack');
  });

  it('surfaces "rectangle"/"component" the same way -- unconditional, no per-keyword special case', () => {
    // Mirrors upstream exactly: `CommandPackageWithUSymbol.java:197-198`'s
    // `gotoGroup(..., usymbol)` stamps EVERY keyword's USymbol
    // unconditionally, with no branch singling out `stack`. Widening this
    // past `stack` moves two already-diverged corpus fixtures'
    // `xadado-92-lazo250`/`xenere-07-kuji864` diff counts -- both have a
    // stated mechanism/artifact in
    // `plans/class-divergence-drive-2/.agent-notes/cdd2-T7b.md` (mission
    // D4: a rise is acceptable once its mechanism is stated).
    const ast = parse('rectangle r as r {\nclass inner\n}');
    expect(namespace(ast, 'r')?.usymbol).toBe('rectangle');
    const ast2 = parse('component c as c {\nclass inner\n}');
    expect(namespace(ast2, 'c')?.usymbol).toBe('component');
  });
});

describe('T11 — url/color/usymbol together on one package header', () => {
  it('populates all three fields from a single declaration', () => {
    // Upstream token order: TAGS1, STEREOTYPE, TAGS2, URL, COLOR, '{'
    // (command/CommandPackage.java:70-88) -- stereotype precedes url/color.
    const ast = parse('package foo <<Node>> [[http://x]] #DDD {\nclass Bar\n}');
    const ns = namespace(ast, 'foo');
    expect(ns?.url?.url).toBe('http://x');
    expect(ns?.color).toBe('#DDD');
    expect(ns?.usymbol).toBe('node');
  });
});

describe("T11 — xitobu-41-lame230's <style> package {} cascade", () => {
  it('resolves BackGroundColor/LineThickness/LineColor via the existing generic cascade lookup', () => {
    // Upstream style signature for a class-diagram PACKAGE group:
    // {root, element, classDiagram, package_, group} —
    // svek/Cluster.java:293 (getDefaultStyleDefinition). No dedicated
    // package/namespace branch exists in style-cascade-class.ts; the
    // GENERIC subset-match lookup (resolveStyleCascade) already resolves
    // it correctly with no code change — see .agent-notes/cdd-T11.md.
    const raw = 'package {\n  BackGroundColor palegreen\n  LineThickness 2\n  LineColor red\n}';
    const styleMap = parseStyleBlock(raw);
    const snames = ['root', 'element', 'classdiagram', 'package', 'group'];
    expect(resolveStyleCascade(styleMap, snames, 'backgroundcolor')).toBe('palegreen');
    expect(resolveStyleCascade(styleMap, snames, 'linethickness')).toBe('2');
    expect(resolveStyleCascade(styleMap, snames, 'linecolor')).toBe('red');
  });

  it('keeps the empty "package package {}" as a real Namespace through parsing (not yet collapsed)', () => {
    // xitobu's own body: `package package {\n}\nclass foo` — a PLAIN
    // (non-descriptive) empty package is NOT collapsed at parse time
    // (class-container.ts's file doc comment); collapseEmptyNamespacesFinal
    // runs once at the layout-input boundary instead.
    const ast = parse('package package {\n}\nclass foo');
    expect(namespace(ast, 'package')).toBeDefined();
  });
});

// cdd2-T19c: rules 5e/5e-multi now thread NOTE_ON_LINK_COLOR (group 2)
// through to `applyNoteOnLink` -- see class-notes.ts#parseNoteOnLinkColors.
describe('5e/5e-multi — note on link colour dispatch', () => {
  it('single-line: lipazi-06-care921 "note on link #red: note red"', () => {
    const ast = parse('class toto\nclass titi\ntoto --> titi\nnote on link #red: note red');
    expect(ast.relationships[0]?.linkNoteBack).toBe('red');
    expect(ast.relationships[0]?.linkNoteLine).toBeUndefined();
  });

  it('single-line, no colour: the colour fields stay unset', () => {
    const ast = parse('class toto\nclass titi\ntoto --> titi\nnote on link: plain');
    expect(ast.relationships[0]?.linkNoteBack).toBeUndefined();
    expect(ast.relationships[0]?.linkNoteLine).toBeUndefined();
  });

  it('multi-line: lozego-15-coci435 "note on link #aqua/aliceblue"', () => {
    const ast = parse(
      'class Order\nclass OrderItem\nOrder --{ OrderItem\nnote on link #aqua/aliceblue\nNote on rel\nend note',
    );
    expect(ast.relationships[0]?.linkNoteBack).toBe('aqua/aliceblue');
  });

  it('multi-line, no colour: the colour fields stay unset', () => {
    const ast = parse('class A\nclass B\nA --> B\nnote on link\nplain\nend note');
    expect(ast.relationships[0]?.linkNoteBack).toBeUndefined();
    expect(ast.relationships[0]?.linkNoteLine).toBeUndefined();
  });

  it('multi-attribute: nuvake-96-gofe203 "#red;line.dotted:blue;text:white"', () => {
    const ast = parse(
      'class Dummy\nclass Foo\nDummy --> Foo\nnote on link #red;line.dotted:blue;text:white : note that is red',
    );
    expect(ast.relationships[0]?.linkNoteBack).toBe('red');
    expect(ast.relationships[0]?.linkNoteLine).toBe('blue');
  });
});
