/**
 * T3c (D8, `smetana-pragma-ignored`): `!pragma layout smetana` capture.
 *
 * Upstream `CommandPragma#executeArg` (`command/CommandPragma.java:104-117`)
 * matches NAME/VALUE case-insensitively and calls `system.setUseSmetana
 * (true)` for exactly this one pair; `CucaDiagram#getCucaDiagramFileMaker`
 * (`net/atmp/CucaDiagram.java:480-481`) later reads that flag to swap the
 * whole document onto `CucaDiagramFileMakerSmetana`/`SmetanaEdge`. This
 * port captures the same flag onto `ClassDiagramAST.layoutEngine`
 * (`ast.ts`'s doc comment) — see `class-command-directives.ts`'s "2c-ter-pre"
 * rule.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';

function parse(source: string): ClassDiagramAST {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('!pragma layout smetana (T3c, D8)', () => {
  it('sets ast.layoutEngine to smetana', () => {
    const ast = parse('!pragma layout smetana\nclass A');
    expect(ast.layoutEngine).toBe('smetana');
  });

  it('is case-insensitive on both the pragma name and its value', () => {
    const ast = parse('!PRAGMA Layout SMETANA\nclass A');
    expect(ast.layoutEngine).toBe('smetana');
  });

  it('leaves layoutEngine unset for a plain diagram (no pragma)', () => {
    const ast = parse('class A');
    expect(ast.layoutEngine).toBeUndefined();
  });

  it('leaves layoutEngine unset for a DIFFERENT layout engine value (elk falls through to the general no-op)', () => {
    const ast = parse('!pragma layout elk\nclass A');
    expect(ast.layoutEngine).toBeUndefined();
  });

  it('the class still parses normally alongside the pragma (no refusal)', () => {
    const ast = parse('!pragma layout smetana\nclass A\nclass B\nA --> B');
    expect(ast.classifiers.map((c) => c.id)).toEqual(['A', 'B']);
    expect(ast.relationships).toHaveLength(1);
  });
});
