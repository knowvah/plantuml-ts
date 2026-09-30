/**
 * cdd6-T3d (xuloxo-85-vibu502): `CommandPackageWithUSymbol`'s name head is a
 * RegexOr of five alternatives (`CommandPackageWithUSymbol.java:79-116`):
 * DISPLAY1 quoted [STEREOTYPE1] as CODE1 | CODE2 [STEREOTYPE2] as DISPLAY2
 * quoted | DISPLAY3 [STEREOTYPE3] as CODE3 | CODE8 quoted | CODE9. The
 * stereotype may sit BEFORE `as` (C4's `rectangle "D" <<person>> as X {`).
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';

function parse(lines: string[]): ReturnType<typeof parseClass> {
  return parseClass({ lines, type: 'class' });
}

function namespace(ast: ReturnType<typeof parseClass>, id: string) {
  return ast.namespaces.find((n) => n.id === id);
}

describe('descriptive container: DISPLAY [STEREOTYPE] as CODE', () => {
  it('keeps the stereotype written between a quoted display and `as`', () => {
    const ast = parse(['rectangle "Display" <<person>> as X {', 'class A', '}']);
    const ns = namespace(ast, 'X');
    expect(ns?.display).toBe('Display');
    expect(ns?.stereotype).toBe('person');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['X.A']);
  });

  it('resolves a later link endpoint to the aliased container, not a new class', () => {
    const ast = parse(['rectangle "D" <<boundary>> as B {', 'class A', '}', 'class C', 'C --> B']);
    expect(namespace(ast, 'B')?.stereotype).toBe('boundary');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['B.A', 'C']);
  });

  it('accepts CODE2 [STEREOTYPE2] as "DISPLAY2"', () => {
    const ast = parse(['node N <<s>> as "Shown" {', 'class A', '}']);
    const ns = namespace(ast, 'N');
    expect(ns?.display).toBe('Shown');
    expect(ns?.stereotype).toBe('s');
  });

  it('accepts DISPLAY3 [STEREOTYPE3] as CODE3', () => {
    const ast = parse(['frame Shown <<s>> as F {', 'class A', '}']);
    const ns = namespace(ast, 'F');
    expect(ns?.display).toBe('Shown');
    expect(ns?.stereotype).toBe('s');
  });

  it('still reads a trailing stereotype after a bare code', () => {
    const ast = parse(['cloud K <<t>> {', 'class A', '}']);
    const ns = namespace(ast, 'K');
    expect(ns?.display).toBe('K');
    expect(ns?.stereotype).toBe('t');
  });
});
