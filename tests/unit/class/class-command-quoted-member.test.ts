/**
 * A2s R2f dibinu-95-kavo178: the standalone member-add shorthand
 * (`NAME : member`, CommandAddMethod) accepts a QUOTED name — upstream's
 * NAME group is `([%pLN_.]+|[%g][^%g]+[%g])` (`%g` = double quote), so
 * `"this is my class" : dummy() with stange chars$%//` attaches the member
 * to the quoted-named classifier instead of silently dropping the line.
 * @see ~/git/plantuml/.../classdiagram/command/CommandAddMethod.java:63
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from '../../../src/diagrams/class/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { isMethodMember } from '../../../src/diagrams/class/class-member-rows.js';

function parse(source: string): ReturnType<typeof parseClass> {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('standalone member syntax — quoted class name (dibinu-95-kavo178)', () => {
  it('attaches the member to an already-declared quoted-name classifier', () => {
    const ast = parse('class "this is my class"\n"this is my class" : dummy() with stange chars$%//');
    expect(ast.classifiers).toHaveLength(1);
    const c = ast.classifiers[0]!;
    expect(c.members).toHaveLength(1);
    // Malformed method text falls to the raw-display fallback and buckets
    // as a METHOD (contains parens), same as the unquoted-alias path.
    expect(c.members[0]!.rawDisplay).toBe('dummy() with stange chars$%//');
    expect(isMethodMember(c.members[0]!)).toBe(true);
  });

  it('resolves to the same classifier a quoted relationship endpoint created', () => {
    const ast = parse('A *-- "this is my class"\n"this is my class" : dummy()');
    const target = ast.classifiers.find((c) => c.display === 'this is my class');
    expect(target).toBeDefined();
    expect(target!.members).toHaveLength(1);
    expect(target!.members[0]!.name).toBe('dummy');
  });

  it('auto-creates a missing quoted-name classifier (CommandAddMethod always creates)', () => {
    const ast = parse('"quoted target" : field: int');
    expect(ast.classifiers).toHaveLength(1);
    expect(ast.classifiers[0]!.display).toBe('quoted target');
    expect(ast.classifiers[0]!.members[0]!.name).toBe('field');
  });

  it('does not steal a bodyless relationship line between quoted endpoints', () => {
    const ast = parse('"a b" *-- "c d"');
    expect(ast.relationships).toHaveLength(1);
    expect(ast.classifiers.every((c) => c.members.length === 0)).toBe(true);
  });
});
