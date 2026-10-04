import { describe, it, expect } from 'vitest';
import { activityPlugin } from '../../../src/diagrams/activity/index.js';
import type { ActivityDiagramAST } from '../../../src/diagrams/activity/ast.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { PragmaKey } from '../../../src/core/skin/PragmaKey.js';
import { parseAst } from '../../helpers/parse-ast.js';

/**
 * `!pragma NAME [VALUE]` recognition (D12/T1p-b, `dispatch-common-
 * commands.ts#tryPragma`). Before this task, NO activity command
 * recognised `!pragma` lines at all -- any activity source containing one
 * refused the whole parse (`node-dispatch.ts`'s unmatched-line fallback).
 */
function parse(lines: readonly string[]): ActivityDiagramAST {
  const block: UmlSource = { lines, type: 'activity' };
  return parseAst(activityPlugin, block);
}

describe('parseActivity — !pragma recognition', () => {
  it('a bare !pragma line no longer refuses the parse (the gap this task closes)', () => {
    const ast = parse(['start', '!pragma useVerticalIf true', 'stop']);
    expect(ast.nodes.map((n) => n.kind)).toEqual(['start', 'stop']);
  });

  it('!pragma useVerticalIf true sets PragmaKey.USE_VERTICAL_IF true on ast.pragma', () => {
    const ast = parse(['start', '!pragma useVerticalIf true', 'stop']);
    expect(ast.pragma?.isTrue(PragmaKey.USE_VERTICAL_IF)).toBe(true);
  });

  it('!pragma useVerticalIf false leaves it false (explicit false, not merely absent)', () => {
    const ast = parse(['start', '!pragma useVerticalIf false', 'stop']);
    expect(ast.pragma?.isTrue(PragmaKey.USE_VERTICAL_IF)).toBe(false);
  });

  it('no !pragma line at all: ast.pragma is still populated (Pragma.createEmpty()), isTrue is false', () => {
    const ast = parse(['start', 'stop']);
    expect(ast.pragma).toBeDefined();
    expect(ast.pragma?.isTrue(PragmaKey.USE_VERTICAL_IF)).toBe(false);
  });

  it('name matching is case-insensitive on the KEY name (CommandPragma.java:75, StringUtils.goLowerCase)', () => {
    const ast = parse(['start', '!pragma USEVERTICALIF true', 'stop']);
    expect(ast.pragma?.isTrue(PragmaKey.USE_VERTICAL_IF)).toBe(true);
  });

  it('a bare !pragma NAME with no value parses (VALUE group optional) and does not crash', () => {
    const ast = parse(['start', '!pragma teoz', 'stop']);
    // TEOZ carries a non-null default ("true") applied by Pragma#define
    // when declared with no explicit value (PragmaKey.ts's own doc).
    expect(ast.pragma?.isTrue(PragmaKey.TEOZ)).toBe(true);
  });

  it('an unrecognised pragma name parses without error and defines nothing observable', () => {
    const ast = parse(['start', '!pragma totallyUnknownName somevalue', 'stop']);
    expect(ast.nodes.map((n) => n.kind)).toEqual(['start', 'stop']);
  });

  it('!pragma svgsize W H parses (recognised, no observable effect -- no SVG-size consumer in this port)', () => {
    const ast = parse(['start', '!pragma svgsize 100 200', 'stop']);
    expect(ast.nodes.map((n) => n.kind)).toEqual(['start', 'stop']);
  });

  it('!pragma layout smetana (another real pragma name) still parses -- not specially broken by useVerticalIf wiring', () => {
    const ast = parse(['start', '!pragma layout smetana', 'stop']);
    expect(ast.nodes.map((n) => n.kind)).toEqual(['start', 'stop']);
  });

  it('a !pragma line produces no node of its own (same convention as skinparam/title directives)', () => {
    const ast = parse(['!pragma useVerticalIf true', 'start', ':a;', 'stop']);
    expect(ast.nodes.map((n) => n.kind)).toEqual(['start', 'action', 'stop']);
  });
});
