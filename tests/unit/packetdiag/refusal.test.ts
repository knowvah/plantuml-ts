/**
 * Strict unrecognised-line refusal (mission dispatch-by-parse-attempt, T11).
 *
 * Upstream's `PacketDiagramFactory#initCommandsList` registers
 * `CommonCommands.addCommonCommands1` plus `CommandPacketDiagStart/End`,
 * `CommandColWidth`, `CommandNodeHeight`, `CommandScaleDirection`,
 * `CommandScaleInterval`, `CommandSameHeight`, `CommandNumRange`
 * (`packetdiag/PacketDiagramFactory.java:74-85`). `getCandidate` returns
 * `null` once every one of those has declined, and `executeFewLines` builds
 * `SYNTAX_ERROR "Syntax Error?"` instead of dropping the line
 * (`command/PSystemCommandFactory.java:169-175`).
 *
 * `PacketDiagram` overrides neither `isIncomplete()` (inherited from
 * `AbstractDiagram`, always `false` — `core/AbstractDiagram.java:169-171`)
 * in a way that changes it, nor does its `checkFinalError()` override ever
 * return non-null: it calls `build()` for its layout side effect and returns
 * `super.checkFinalError()`, which is `AbstractDiagram`'s own `null`-always
 * implementation, never further overridden in between
 * (`packetdiag/PacketDiagram.java:225-229`, `core/AbstractDiagram.java:162-164`).
 * Neither of those two upstream refusal points, nor the execution-failure
 * point (`PSystemCommandFactory.java:180-186`), is reachable for this
 * factory: `CommandColWidth`/`CommandNodeHeight`/`CommandScaleInterval`/
 * `CommandNumRange`'s `NumberFormatException` catches guard integer parses
 * whose upstream regex groups already constrain the input to digit
 * characters (`\d{1,3}` / `\d{1,7}`), exactly as this port's own regexes do
 * — so only the syntax-refusal case is implemented here.
 */
import { describe, it, expect } from 'vitest';
import { parsePacket } from '../../../src/diagrams/packetdiag/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ParseRefusal } from '../../../src/core/parse-refusal.js';

function src(lines: string[]): UmlSource {
  return { lines, type: 'packetdiag' };
}

/** Narrows `parsePacket`'s widened return to the refusal arm, failing loudly
 *  if the fixture unexpectedly parsed clean. */
function parseRefused(lines: string[]): ParseRefusal {
  const parsed = parsePacket(src(lines));
  if (!('refused' in parsed)) {
    throw new Error('expected parsePacket to refuse this source, but it parsed');
  }
  return parsed;
}

describe('parsePacket — strict refusal (mission dispatch-by-parse-attempt, T11)', () => {
  it('refuses a line no registered command recognises, kind syntax', () => {
    const r = parseRefused(['garbage line']);
    expect(r.kind).toBe('syntax');
    expect(r.message).toBe('Syntax Error?');
    expect(r.commandScore).toBe(0);
  });

  it('names the 0-based offending line and counts it toward consumed', () => {
    // 'garbage line' is index 1; consumed includes the offending line
    // itself, per PSystemCommandFactory.java:171-174 (it.peek() names the
    // location, then it.next() -- which appends to the trace -- runs BEFORE
    // it.getTrace() is read).
    const r = parseRefused(['0-7: A', 'garbage line', '8-15: B']);
    expect(r.line).toBe(1);
    expect(r.consumed).toBe(2);
  });

  it('refuses when the very first line is unrecognised (line 0, consumed 1)', () => {
    const r = parseRefused(['garbage line']);
    expect(r.line).toBe(0);
    expect(r.consumed).toBe(1);
  });

  it('counts blank lines toward consumed before an unrecognised line', () => {
    const r = parseRefused(['', '', 'garbage line']);
    expect(r.line).toBe(2);
    expect(r.consumed).toBe(3);
  });

  it('does not refuse a valid document -- refusal never fires on recognised input', () => {
    const parsed = parsePacket(src(['0-7: Source Port', '8-15: Dest Port']));
    expect('refused' in parsed).toBe(false);
  });

  it('accepts blank lines interleaved with fields (CommandNope, registered on every factory)', () => {
    const parsed = parsePacket(src(['0-7: A', '', '8-15: B']));
    if ('refused' in parsed) throw new Error(`unexpected refusal: ${parsed.message}`);
    expect(parsed.items).toHaveLength(2);
  });

  it('accepts a title line -- CommonCommands.addTitleCommands, registered on every factory', () => {
    // Regression guard alongside annotations.test.ts: a CommonCommands line
    // must never fall through to the new syntax-refusal branch.
    const parsed = parsePacket(src(['title T', '0-7: A']));
    if ('refused' in parsed) throw new Error(`unexpected refusal: ${parsed.message}`);
    expect(parsed.annotations?.title.display).toEqual(['T']);
  });
});
