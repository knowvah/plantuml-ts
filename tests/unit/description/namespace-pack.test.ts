/**
 * codd-T8 -- `packSomePackage` (`!pragma useIntermediatePackages false`) and the quark helpers behind the
 * separator-aware container/endpoint resolution.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/AbstractEntityDiagram.java:85-106
 */
import { describe, it, expect } from 'vitest';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import type { DescriptionDiagramAST, DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { countQuarksByName, scopedKey } from '../../../src/diagrams/description/namespace-groups.js';

function parse(lines: string[]): DescriptionDiagramAST {
  const block: UmlSource = { lines, type: 'description' };
  return astOrThrow(parseDescription(block), 'description');
}

const PRAGMA = '!pragma useIntermediatePackages false';
const shape = (nodes: readonly DescriptiveNode[]): unknown[] =>
  nodes.map((n) => (n.children.length > 0 ? { [n.display]: shape(n.children) } : n.display));

describe('packSomePackage (useIntermediatePackages false)', () => {
  it('folds a package whose only child is a non-empty package, joining titles with the separator', () => {
    const ast = parse([PRAGMA, 'package foo1 {', 'package foo2 {', 'component foo3', '}', '}']);
    expect(shape(ast.nodes)).toEqual([{ 'foo1.foo2': ['foo3'] }]);
  });

  it('folds a chain of three packages into one title, and uses the set separator', () => {
    const ast = parse([
      'set separator ::',
      PRAGMA,
      'package a {',
      'package b {',
      'package c {',
      'component d',
      '}',
      '}',
      '}',
    ]);
    expect(shape(ast.nodes)).toEqual([{ 'a::b::c': ['d'] }]);
  });

  it('keeps the packages when the pragma is absent or true', () => {
    const body = ['package foo1 {', 'package foo2 {', 'component foo3', '}', '}'];
    expect(shape(parse(body).nodes)).toEqual([{ foo1: [{ foo2: ['foo3'] }] }]);
    expect(shape(parse(['!pragma useIntermediatePackages true', ...body]).nodes)).toEqual([
      { foo1: [{ foo2: ['foo3'] }] },
    ]);
  });

  it('does not fold a package that also holds a leaf, or has two children', () => {
    const leaf = parse([PRAGMA, 'package a {', 'component x', 'package b {', 'component y', '}', '}']);
    expect(shape(leaf.nodes)).toEqual([{ a: ['x', { b: ['y'] }] }]);
    const two = parse([
      PRAGMA,
      'package a {',
      'package b {',
      'component y',
      '}',
      'package c {',
      'component z',
      '}',
      '}',
    ]);
    expect(shape(two.nodes)).toEqual([{ a: [{ b: ['y'] }, { c: ['z'] }] }]);
  });

  it('does not fold into an empty child package', () => {
    const ast = parse([PRAGMA, 'package a {', 'package b {', '}', '}']);
    expect(shape(ast.nodes)).toEqual([{ a: ['b'] }]);
  });

  it('does not fold a package a link touches', () => {
    const ast = parse([PRAGMA, 'package a {', 'package b {', 'component y', '}', '}', 'a --> y']);
    expect(shape(ast.nodes)).toEqual([{ a: [{ b: ['y'] }] }]);
  });

  it('re-roots a scoped link endpoint that ran through the folded package', () => {
    const ast = parse([
      'set separator .',
      PRAGMA,
      'package a {',
      'package b {',
      'component y',
      '}',
      '}',
      'component z',
      'z --> a.b.y',
    ]);
    expect(ast.links.map((l) => [l.from, l.to])).toEqual([['z', scopedKey(['b', 'y'])]]);
    expect(ast.nodes.map((n) => n.id)).toEqual(['b', 'z']);
  });

  it('applies per page: a newpage resets the pragma', () => {
    const ast = parse([
      PRAGMA,
      'package a {',
      'package b {',
      'component y',
      '}',
      '}',
      'newpage',
      'package c {',
      'package d {',
      'component w',
      '}',
      '}',
    ]);
    expect(shape(ast.pages![0]!.nodes)).toEqual([{ 'a.b': ['y'] }]);
    expect(shape(ast.pages![1]!.nodes)).toEqual([{ c: [{ d: ['w'] }] }]);
  });
});

describe('countQuarksByName', () => {
  const ast = parse([
    'set separator .',
    'package first {',
    'component r',
    'node p {',
    'component l',
    '}',
    '}',
    'component xx.yy.r',
  ]);

  it('counts every distinct quark path carrying the name, dotted segments included', () => {
    expect(countQuarksByName(ast.nodes, 'r', '.')).toBe(2);
    expect(countQuarksByName(ast.nodes, 'xx', '.')).toBe(1);
    expect(countQuarksByName(ast.nodes, 'yy', '.')).toBe(1);
    expect(countQuarksByName(ast.nodes, 'l', '.')).toBe(1);
    expect(countQuarksByName(ast.nodes, 'missing', '.')).toBe(0);
  });
});

describe('container and endpoint scoping under a separator', () => {
  const SRC = ['package a {', 'node p {', 'component l', '}', '}', 'package b {', 'node p {', 'component m', '}', '}'];

  it('without a separator a repeated container id is one global group', () => {
    const ast = parse(SRC);
    expect(shape(ast.nodes)).toEqual([{ a: [{ p: ['l', 'm'] }] }, 'b']);
  });

  it('with a separator an undotted container id is a child of the current group', () => {
    const ast = parse(['set separator .', ...SRC]);
    expect(shape(ast.nodes)).toEqual([{ a: [{ p: ['l'] }] }, { b: [{ p: ['m'] }] }]);
  });

  it('with a separator an undotted endpoint reuses the single existing entity, else is created in scope', () => {
    const reuse = parse(['set separator .', 'package a {', 'component l', '}', 'package b {', 'l --> k', '}']);
    expect(shape(reuse.nodes)).toEqual([{ a: ['l'] }, { b: ['k'] }]);
    const twice = parse([
      'set separator .',
      'package a {',
      'component l',
      '}',
      'package b {',
      'component l',
      'l --> k',
      '}',
    ]);
    expect(shape(twice.nodes)).toEqual([{ a: ['l'] }, { b: ['l', 'k'] }]);
  });
});
