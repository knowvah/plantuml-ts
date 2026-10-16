/**
 * dur-T1c: `url of|for X is [[…]]` stores the raw token on the resolved node
 * (CommandUrl.java:91-100: quarkInContext(true, …) then entity.addUrl).
 */
import { describe, it, expect } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { parseRefusalOf } from '../../../src/core/dispatcher.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { descriptionAst } from './parse-description-ast.js';

function parse(source: string) {
  const block: UmlSource = { lines: source.split('\n'), type: 'description' };
  return parseDescription(block);
}

function find(nodes: readonly DescriptiveNode[], id: string): DescriptiveNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const inner = find(n.children, id);
    if (inner !== undefined) return inner;
  }
  return undefined;
}

describe('url statement (CommandUrl)', () => {
  it('givape-84-xano421: `url of APP is [[…]]` stores the token on the leaf', () => {
    const ast = descriptionAst(
      parse('[Oracle] as DB\n[Application] as APP\nurl of APP is [[http://tomcat.apache.org/]]'),
    );
    expect(find(ast.nodes, 'APP')?.url).toBe('[[http://tomcat.apache.org/]]');
    expect(find(ast.nodes, 'DB')?.url).toBeUndefined();
  });

  it('tukipe-82-ziva562: `url for Foo is [[…]]` reaches a container', () => {
    const ast = descriptionAst(parse('node Foo {\n [component1]\n}\nurl for Foo is [[http://www.google.com]]'));
    expect(find(ast.nodes, 'Foo')?.url).toBe('[[http://www.google.com]]');
    expect(find(ast.nodes, 'component1')?.url).toBeUndefined();
  });

  it('replaces an inline url (addUrl)', () => {
    const ast = descriptionAst(parse('[A] [[http://old]]\nurl of A is [[http://new]]'));
    expect(find(ast.nodes, 'A')?.url).toBe('[[http://new]]');
  });

  it('accepts a quoted CODE and omitted of/is', () => {
    const ast = descriptionAst(parse('component "A"\nurl "A" [[http://q]]'));
    expect(find(ast.nodes, 'A')?.url).toBe('[[http://q]]');
  });

  it('refuses an unknown name with the jar message (probe: "Nope does not exist")', () => {
    const refusal = parseRefusalOf(parse('[A]\nurl of Nope is [[http://x]]'));
    expect(refusal?.kind).toBe('execution');
    expect(refusal?.message).toBe('Nope does not exist');
  });

  it('with a separator, resolves a dotted path through the container', () => {
    const ast = descriptionAst(parse('set separator .\npackage p {\n[c]\n}\nurl of p.c is [[http://d]]'));
    expect(find(ast.nodes, 'c')?.url).toBe('[[http://d]]');
  });

  it("with a separator, an undotted name inside a group is that group's child", () => {
    const ast = descriptionAst(parse('set separator .\n[c]\npackage p {\n[c]\nurl of c is [[http://in]]\n}'));
    expect(ast.nodes.find((n) => n.id === 'c')?.url).toBeUndefined();
    expect(find(find(ast.nodes, 'p')!.children, 'c')?.url).toBe('[[http://in]]');
  });

  it('with a separator, an unknown dotted path reports the last segment (jar probe: "Nope does not exist")', () => {
    const refusal = parseRefusalOf(parse('set separator .\n[A]\nurl of p.Nope is [[http://x]]'));
    expect(refusal?.message).toBe('Nope does not exist');
  });
});
