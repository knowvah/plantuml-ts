/**
 * dur-T1a: an inline `[[url]]` on a declaration is captured raw on the node
 * (CommandCreateElementFull.java:113, 333-337; CommandPackageWithUSymbol.java
 * :125, 208-212). The display must not change.
 */
import { describe, it, expect } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { extractUrlToken, stripUrl } from '../../../src/diagrams/description/parse-helpers-strings.js';
import { parseNameSection, makeNode } from '../../../src/diagrams/description/parse-helpers.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { DescriptionDiagramAST, DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { descriptionAst } from './parse-description-ast.js';

function parse(source: string): DescriptionDiagramAST {
  const block: UmlSource = { lines: source.split('\n'), type: 'description' };
  return descriptionAst(parseDescription(block));
}

function find(nodes: readonly DescriptiveNode[], id: string): DescriptiveNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const inner = find(n.children, id);
    if (inner !== undefined) return inner;
  }
  return undefined;
}

describe('extractUrlToken', () => {
  it('returns the first top-level token verbatim', () => {
    expect(extractUrlToken('Dog [[http://www.yahoo.com{This is Dog}]] #red')).toBe(
      '[[http://www.yahoo.com{This is Dog}]]',
    );
  });
  it('ignores a token inside a quoted display', () => {
    expect(extractUrlToken('A as "x [[http://q]] y"')).toBeUndefined();
  });
  it('ignores a token inside a bracket code and a stereotype span', () => {
    expect(extractUrlToken('[a [[u]] b] <<[[s]]>>')).toBeUndefined();
  });
  it('returns undefined with no token, and leaves stripUrl output unchanged', () => {
    expect(extractUrlToken('plain')).toBeUndefined();
    expect(stripUrl('A [[u]] #red')).toBe('A #red');
  });
});

describe('parseNameSection url', () => {
  it('captures the token on the unquoted branch', () => {
    const s = parseNameSection('foo1 as "My comp" [[My_component_1]]');
    expect(s.url).toBe('[[My_component_1]]');
    expect(s.display).toBe('My comp');
    expect(s.id).toBe('foo1');
  });
  it('captures the token on the leading-quote branch', () => {
    const s = parseNameSection('"My comp" as foo1 [[http://x]]');
    expect(s.url).toBe('[[http://x]]');
    expect(s.display).toBe('My comp');
  });
  it('omits url when absent', () => {
    expect('url' in parseNameSection('A')).toBe(false);
  });
});

describe('makeNode decorations', () => {
  it('sets url only when given', () => {
    expect(makeNode('a', 'a', 'actor', undefined, undefined, undefined, undefined, { url: '[[u]]' }).url).toBe('[[u]]');
    expect('url' in makeNode('a', 'a', 'actor')).toBe(false);
  });
});

describe('parser captures declaration urls', () => {
  it('component with alias and display', () => {
    const n = find(parse('component foo1 as "My comp" [[My_component_1]]').nodes, 'foo1');
    expect(n?.url).toBe('[[My_component_1]]');
    expect(n?.display).toBe('My comp');
  });
  it('actor and usecase', () => {
    const ast = parse('actor Mamal [[http://www.google.com]]\nusecase Dog [[http://www.yahoo.com{This is Dog}]]');
    expect(find(ast.nodes, 'Mamal')?.url).toBe('[[http://www.google.com]]');
    expect(find(ast.nodes, 'Dog')?.url).toBe('[[http://www.yahoo.com{This is Dog}]]');
  });
  it('containers', () => {
    const ast = parse('package P [[http://x]] {\nrectangle R [[http://y]] {\ncomponent C\n}\n}');
    expect(find(ast.nodes, 'P')?.url).toBe('[[http://x]]');
    expect(find(ast.nodes, 'R')?.url).toBe('[[http://y]]');
    expect(find(ast.nodes, 'C')?.url).toBeUndefined();
  });
  it('bare colon-actor and paren-usecase', () => {
    const ast = parse(':Bob: [[http://b]]\n(Use) [[http://u]]');
    expect(find(ast.nodes, 'Bob')?.url).toBe('[[http://b]]');
    expect(find(ast.nodes, 'Use')?.url).toBe('[[http://u]]');
  });
  it('endpoint auto-creates get no url', () => {
    const ast = parse('component A [[http://a]]\nA --> B');
    expect(find(ast.nodes, 'B')?.url).toBeUndefined();
  });
});
