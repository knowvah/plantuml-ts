/**
 * `parseDot` — upstream's `PSystemDotFactory` driven by
 * `PSystemBasicFactory#createSystem`, and nothing more.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/directdot/PSystemDotFactory.java:48-87
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/PSystemBasicFactory.java:41-68
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/core/UmlSource.java:79-106
 */
import { describe, it, expect } from 'vitest';

import { parseDot } from '../../../src/diagrams/dot/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';

function src(lines: string[], extra: Partial<UmlSource> = {}): UmlSource {
  return { type: 'dot', lines, ...extra };
}

/** The header test, observed through `parseDot`: a first line it rejects is refused. */
function isGraphvizDotHeader(line: string): boolean {
  return !('refused' in parseDot(src([line, '}'])));
}

describe('isGraphvizDotHeader — PSystemDotFactory.java:48-56', () => {
  it.each([
    'digraph G {',
    'graph {',
    '  strict digraph x {  ',
    'digraph "a \\" b" {',
    'graph -1.5 {',
    'digraph Ünïcode_1 {',
  ])('accepts %j', (line) => {
    expect(isGraphvizDotHeader(line)).toBe(true);
  });

  it.each(['digraph G { a -> b; }', 'Digraph G {', 'digraph G', 'digraph{', 'title My Graph', 'digraph 1x {'])(
    'rejects %j',
    (line) => {
      expect(isGraphvizDotHeader(line)).toBe(false);
    },
  );
});

describe('parseDot — the DOT body', () => {
  it('is the header and every later line, each with its newline, verbatim', () => {
    const ast = parseDot(src(['digraph G {', '  a [label="http://x"]; // c', '/* b */', '}']));
    expect(ast).toEqual({ dotContent: 'digraph G {\n  a [label="http://x"]; // c\n/* b */\n}\n' });
  });

  it('keeps PlantUML directives after the header — graphviz reads them as DOT', () => {
    const ast = parseDot(src(['digraph G {', 'title Hello', 'skinparam X Y', '}']));
    expect(ast).toEqual({ dotContent: 'digraph G {\ntitle Hello\nskinparam X Y\n}\n' });
  });

  it('stops at the first end directive (PSystemBasicFactory.java:54-58)', () => {
    const ast = parseDot(src([], { seedSourceLines: ['@startdot', 'digraph G {', '}', '@enddot', 'ignored'] }));
    expect(ast).toEqual({ dotContent: 'digraph G {\n}\n' });
  });
});

describe('parseDot — before the header', () => {
  it('drops skinparam/skinparamlocked/!pragma/blank lines directly after @startdot', () => {
    const lines = ['skinparam a b', '', 'skinparamlocked c d', '!pragma x', 'digraph G {', '}'];
    expect(parseDot(src(lines))).toEqual({ dotContent: 'digraph G {\n}\n' });
  });

  it('skips whitespace-only lines before the first content line', () => {
    expect(parseDot(src(['   ', 'digraph G {', '}']))).toEqual({ dotContent: 'digraph G {\n}\n' });
  });

  it('refuses `title` with Syntax Error? on its line', () => {
    expect(parseDot(src(['title My Graph', 'digraph G {', '}']))).toEqual({
      refused: true,
      kind: 'syntax',
      line: 1,
      consumed: 1,
      message: 'Syntax Error?',
      commandScore: 0,
    });
  });

  it('noise is only noise directly after @startdot (isNoise is case-sensitive)', () => {
    expect(parseDot(src(['   ', 'skinparam a b', 'digraph G {', '}']))).toMatchObject({ refused: true, line: 2 });
    expect(parseDot(src(['Skinparam a b', 'digraph G {', '}']))).toMatchObject({ refused: true, line: 1 });
  });

  it('no header at all is Empty description, named on the @enddot line', () => {
    expect(parseDot(src(['skinparam a b']))).toMatchObject({
      refused: true,
      line: 2,
      message: 'Empty description',
    });
  });
});

describe('parseDot — the refused line is a DOCUMENT line', () => {
  it('reads the offender off linePositions when it survived directive stripping', () => {
    const source = src(['title X', 'digraph G {', '}'], {
      linePositions: [5, 6, 7],
      seedSourceLines: ['@startdot', 'title X', 'digraph G {', '}', '@enddot'],
    });
    expect(parseDot(source)).toMatchObject({ refused: true, line: 5 });
  });

  it('places a hoisted <style> line by its distance from the next aligned line', () => {
    const source = src(['digraph G {', '}'], {
      linePositions: [4, 5],
      seedSourceLines: ['@startdot', '<style>', 'node { }', '</style>', 'digraph G {', '}', '@enddot'],
    });
    expect(parseDot(source)).toMatchObject({ refused: true, line: 1 });
  });

  it('places an offender after every aligned line by its distance from the last one', () => {
    const source = src(['x'], {
      linePositions: [3],
      seedSourceLines: ['@startdot', 'x', '@enddot'],
    });
    expect(parseDot(source)).toMatchObject({ refused: true, line: 3 });
    const tail = src(['  '], { linePositions: [2], seedSourceLines: ['@startdot', '  ', 'skinparam a b', '@enddot'] });
    expect(parseDot(tail)).toMatchObject({ refused: true, line: 3 });
  });

  it('falls back to the upstream index when nothing aligns', () => {
    const source = src([], { linePositions: [], seedSourceLines: ['@startdot', '<style>', '@enddot'] });
    expect(parseDot(source)).toMatchObject({ refused: true, line: 1 });
  });
});
