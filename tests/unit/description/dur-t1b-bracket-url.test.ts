/**
 * dur-T1b: the bracket shorthand `[Name] <<st>> [[url]]` and `() Name [[url]]`
 * attach the raw url token to the entity (CommandCreateElementFull.java:113
 * `UrlBuilder.OPTIONAL`, :333-337). jazabe-68-bica131 is the oracle fixture.
 */
import { describe, it, expect } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { parseBracketDeclaration } from '../../../src/diagrams/description/element-grammar.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { DescriptiveNode } from '../../../src/diagrams/description/ast.js';
import { descriptionAst } from './parse-description-ast.js';

function nodes(source: string): readonly DescriptiveNode[] {
  const block: UmlSource = { lines: source.split('\n'), type: 'description' };
  return descriptionAst(parseDescription(block)).nodes;
}

const JAZABE = [
  '[Component1] << Stereotype >> [[http://Component1]]',
  '() Interface << Other Stereotype >> [[http://Interface]]',
  "'url of Component1 [[http://Component1]]",
].join('\n');

describe('bracket shorthand url', () => {
  it('attaches the raw token to both jazabe declarations, stereotypes unchanged', () => {
    const all = nodes(JAZABE);
    const comp = all.find((n) => n.id === 'Component1');
    const iface = all.find((n) => n.id === 'Interface');
    expect(comp?.url).toBe('[[http://Component1]]');
    expect(comp?.stereotype).toEqual(['Stereotype']);
    expect(iface?.url).toBe('[[http://Interface]]');
    expect(iface?.stereotype).toEqual(['Other Stereotype']);
  });
  it('carries the url with an alias and a colour', () => {
    const d = parseBracketDeclaration('Disp', 'as X [[http://u]] #red');
    expect(d.url).toBe('[[http://u]]');
    expect(d.id).toBe('X');
    expect(d.color).toBe('#red');
  });
  it('keyword-prefixed bracket-as form keeps the url', () => {
    const n = nodes('component [Disp] as X [[http://k]]').find((x) => x.id === 'X');
    expect(n?.url).toBe('[[http://k]]');
    expect(n?.display).toBe('Disp');
  });
  it('leaves url undefined without a token', () => {
    expect(parseBracketDeclaration('A', '<<s>>').url).toBeUndefined();
  });
});
