/**
 * Annotation-command wiring for the packetdiag diagram parser (mission
 * G0b/T6).
 */

import { describe, it, expect } from 'vitest';
import { parsePacket } from '../../../src/diagrams/packetdiag/parser.js';
import { isEmpty } from '../../../src/core/annotations/index.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { PacketDiagramAST } from '../../../src/diagrams/packetdiag/ast.js';

function src(lines: string[]): UmlSource {
  return { lines, type: 'packetdiag' };
}

/** See `parser.test.ts`'s `parseOk` for why this narrows rather than casts
 *  (mission dispatch-by-parse-attempt, T11/D1). */
function parseOk(lines: string[]): PacketDiagramAST {
  const parsed = parsePacket(src(lines));
  if ('refused' in parsed) {
    throw new Error(
      `packetdiag refused at line ${String(parsed.line)} (${parsed.kind}): ${parsed.message}`,
    );
  }
  return parsed;
}

describe('parsePacket — annotation commands (mission G0b/T6)', () => {
  it('single-line `title X` populates annotations.title, not a field', () => {
    const ast = parseOk(['title My Packet', '0-15: Source Port']);
    expect(ast.annotations?.title.display).toEqual(['My Packet']);
    expect(ast.items.length).toBe(1);
    expect(ast.items[0]!.label).toBe('Source Port');
  });

  it('multi-line `legend ... end legend` populates annotations.legend, not a field', () => {
    const ast = parseOk(['0-15: Source Port', 'legend', 'a legend line', 'end legend']);
    expect(ast.annotations?.legend.display).toEqual(['a legend line']);
    expect(ast.items.length).toBe(1);
  });

  it('annotation-free fixture parses identically (no chrome, empty annotations)', () => {
    const ast = parseOk(['0-15: Source Port']);
    expect(isEmpty(ast.annotations!)).toBe(true);
    expect(ast.items.length).toBe(1);
  });
});
