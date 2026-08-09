/**
 * `parseDot` — the PlantUML pre-step for `@startdot`, and nothing more.
 *
 * This file used to assert a projected graph model (node shapes, ranks, edge
 * ids, HTML-label stripping, default-attribute inheritance). The passthrough
 * rewrite removed that projection: @knowvah/dot-engine now both parses and
 * renders the DOT, exactly as the graphviz executable does for upstream's
 * `directdot/PSystemDot`. Those assertions were re-testing the library and are
 * gone with the code they covered.
 *
 * What remains is this port's OWN contract: lift the PlantUML-only directives
 * out, and hand the rest through byte-for-byte.
 */
import { describe, it, expect } from 'vitest';

import { parseDot } from '../../../src/diagrams/dot/parser.js';
import { isEmpty } from '../../../src/core/annotations/index.js';

function wrap(inner: string): string {
  return `@startdot\n${inner}\n@enddot`;
}

describe('parseDot — DOT body passthrough', () => {
  it('carries the DOT body through unchanged', () => {
    const ast = parseDot(wrap('digraph G {\n  a -> b;\n}'));
    expect(ast.dotContent.trim()).toBe('digraph G {\n  a -> b;\n}');
  });

  it('strips the @startdot / @enddot markers', () => {
    expect(parseDot(wrap('digraph { a }')).dotContent).not.toContain('@startdot');
    expect(parseDot(wrap('digraph { a }')).dotContent).not.toContain('@enddot');
  });

  it('parses a bare DOT body with no @startdot wrapper', () => {
    expect(parseDot('digraph { a }').dotContent.trim()).toBe('digraph { a }');
  });

  it('leaves DOT syntax it does not understand alone — the engine is the parser', () => {
    // Deliberately exotic: HTML labels, ports, records. None of it is this
    // module's business any more; it must survive verbatim.
    const body = 'digraph { n [shape=record, label="<f0> a|<f1> b"]; m [label=<<b>Bold</b>>]; n:f0 -> m; }';
    expect(parseDot(wrap(body)).dotContent.trim()).toBe(body);
  });

  it('does not throw on malformed DOT — surfacing that is the engine\'s job at layout', () => {
    expect(() => parseDot(wrap('digraph { a ->'))).not.toThrow();
  });
});

describe('parseDot — PlantUML directive lifting', () => {
  it('collects skinparam lines out of the DOT body', () => {
    const ast = parseDot(wrap('skinparam BackgroundColor #AABBCC\ndigraph { a }'));
    expect(ast.skinparamLines).toEqual(['skinparam BackgroundColor #AABBCC']);
    expect(ast.dotContent).not.toContain('skinparam');
  });

  it('collects every skinparam line, not just the first', () => {
    const ast = parseDot(wrap('skinparam One 1\nskinparam Two 2\ndigraph { a }'));
    expect(ast.skinparamLines).toHaveLength(2);
  });

  it('skinparamLines is empty when the block has none', () => {
    expect(parseDot(wrap('digraph { a }')).skinparamLines).toEqual([]);
  });

  it('lifts a title into annotations, out of the DOT body', () => {
    const ast = parseDot(wrap('title My Graph\ndigraph { a }'));
    expect(ast.annotations.title.display).toEqual(['My Graph']);
    expect(ast.dotContent).not.toContain('title');
  });

  it('leaves annotations empty when the block carries no chrome', () => {
    expect(isEmpty(parseDot(wrap('digraph { a }')).annotations)).toBe(true);
  });
});

describe('parseDot — comments', () => {
  it('strips // line comments', () => {
    const ast = parseDot(wrap('digraph { // a trailing note\n  a -> b;\n}'));
    expect(ast.dotContent).not.toContain('a trailing note');
    expect(ast.dotContent).toContain('a -> b;');
  });

  it('strips /* block */ comments, including multi-line ones', () => {
    const ast = parseDot(wrap('digraph {\n/* one\n   two */\n  a -> b;\n}'));
    expect(ast.dotContent).not.toContain('one');
    expect(ast.dotContent).toContain('a -> b;');
  });

  it('does not invent DOT content from comment text', () => {
    const ast = parseDot(wrap('digraph {\n// c -> d;\n  a -> b;\n}'));
    expect(ast.dotContent).not.toContain('c -> d');
  });
});

describe('parseDot — empty input', () => {
  it('an empty @startdot block yields an empty AST without throwing', () => {
    const ast = parseDot(wrap(''));
    expect(ast.dotContent.trim()).toBe('');
    expect(isEmpty(ast.annotations)).toBe(true);
  });

  it('a completely empty string yields an empty AST without throwing', () => {
    const ast = parseDot('');
    expect(ast.dotContent).toBe('');
    expect(ast.skinparamLines).toEqual([]);
  });

  it('a block holding only a title keeps the title and empties the body', () => {
    const ast = parseDot(wrap('title Just Chrome'));
    expect(ast.annotations.title.display).toEqual(['Just Chrome']);
    expect(ast.dotContent.trim()).toBe('');
  });
});
