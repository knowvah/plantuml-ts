/**
 * isw-T2-cls F4: CommandCreateElementFull.java:126 CODE_CORE `\[[^\[\]]+\]`
 * captures the bracket content verbatim, so `[ E  F ]` keeps its edge and
 * inner spaces (jar: `<!--entity ' E  F '-->`, tests/fixtures/isw-T2-cls/
 * bracket-spaces.svg).
 */
import { describe, expect, it } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { diffsAgainstJar } from '../../helpers/isw-t2-cls-fixture.js';

describe('description bracket labels keep their spaces', () => {
  it('keeps the padded id and display of a bare [ x ] component', () => {
    const ast = parseDescription({ lines: ['[ Padded ]'] } as never);
    if ('kind' in ast) throw new Error('refused');
    expect(ast.nodes[0]!.id).toBe(' Padded ');
    expect(ast.nodes[0]!.display).toBe(' Padded ');
  });
  it('draws exactly the jar svg for the five bracket forms', () => {
    expect(diffsAgainstJar('bracket-spaces')).toEqual([]);
  });
});
