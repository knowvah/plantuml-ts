/**
 * T9 (mission unknown-bucket-routing-repair) — state-commands.ts's rule 16
 * transition pre-filter (`pattern: /[<>]/`, `passes: ['two']`) is a cheap
 * gate for CommandLinkState/CommandLinkStateReverse
 * (`CommandLinkStateCommon#isEligibleFor`); the real per-command candidate
 * match upstream performs is the FULL anchored grammar
 * (`CommandLinkState#getRegex`/`CommandLinkStateReverse#getRegex`), tested
 * BEFORE `isEligibleFor` is ever consulted
 * (`command/PSystemCommandFactory.java:169-175`'s `getCandidate`, called
 * every pass regardless of pass eligibility).
 *
 * Before this fix, `dispatchCommand` (`parser.ts:135-144`) treated ANY
 * pattern match as "this line is handled", so a line that merely contains
 * '<'/'>' but is not a real transition (`parseTransitionLine` returns
 * `null`) was silently swallowed on both passes instead of falling through
 * to `fallbackOrRefuse` — the whole diagram "parsed" successfully empty.
 * Fixture `kubuju-35-neji041` (unported `PSystemListFontsFactory`, jar
 * `data-diagram-type` absent) reproduces this exactly: its body is
 * `listfonts <U+1F680>...` — no arrow, several bracket-wrapped tokens.
 *
 * @see ~/git/plantuml/.../statediagram/command/CommandLinkStateCommon.java#isEligibleFor
 * @see ~/git/plantuml/.../statediagram/command/CommandLinkState.java#getRegex
 * @see ~/git/plantuml/.../command/PSystemCommandFactory.java:169-175
 */
import { describe, it, expect } from 'vitest';

import { parseState } from '../../../src/diagrams/state/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ParseRefusal } from '../../../src/core/parse-refusal.js';

function block(...lines: string[]): UmlSource {
  return { lines, type: 'state' };
}

describe('state rule 16 no longer silently swallows a false-positive </> match', () => {
  it('kubuju-35-neji041: "listfonts <U+1F680>..." (no arrow) refuses instead of parsing to an empty diagram', () => {
    const line = 'listfonts <U+1F680><U+263A><U+1F601><U+1F680><U+1F6E0>';
    const result = parseState(block(line));
    expect((result as ParseRefusal).refused).toBe(true);
    expect((result as ParseRefusal).kind).toBe('syntax');
    expect((result as ParseRefusal).message).toBe('Syntax Error?');
  });

  it('a bare "<>" with no arrow body also refuses (same false-positive-gate shape)', () => {
    const result = parseState(block('a <> b'));
    expect((result as ParseRefusal).refused).toBe(true);
    expect((result as ParseRefusal).kind).toBe('syntax');
  });

  it('a line with a stray "<<tag>>" and no arrow also refuses', () => {
    const result = parseState(block('foo <<bar>> baz'));
    expect((result as ParseRefusal).refused).toBe(true);
    expect((result as ParseRefusal).kind).toBe('syntax');
  });

  it('regression control: a real forward transition "A --> B" still parses (no refusal)', () => {
    const result = parseState(block('A --> B'));
    expect('refused' in result).toBe(false);
    if ('refused' in result) throw new Error('unreachable');
    expect(result.transitions).toHaveLength(1);
    expect(result.transitions[0]).toMatchObject({ from: 'A', to: 'B' });
  });

  it('regression control: a real reverse transition "A <-- B" still parses (no refusal)', () => {
    const result = parseState(block('A <-- B'));
    expect('refused' in result).toBe(false);
    if ('refused' in result) throw new Error('unreachable');
    expect(result.transitions).toHaveLength(1);
    expect(result.transitions[0]).toMatchObject({ from: 'B', to: 'A' });
  });

  it('regression control: a direction-abbreviated arrow "A -right-> B" still parses (no adjacent dashes)', () => {
    const result = parseState(block('A -right-> B'));
    expect('refused' in result).toBe(false);
    if ('refused' in result) throw new Error('unreachable');
    expect(result.transitions).toHaveLength(1);
    expect(result.transitions[0]).toMatchObject({ from: 'A', to: 'B' });
  });
});
