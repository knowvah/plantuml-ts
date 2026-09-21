/**
 * T9b (mission unknown-bucket-routing-repair) — state over-claims a
 * positioned note with no explicit `of <State>` target and no prior
 * `lastEntity`. Upstream's shared `CommandFactoryNoteOnEntity#executeInternal`
 * (`command/note/CommandFactoryNoteOnEntity.java:293-303`) resolves `cl1` to
 * `diagram.getLastEntity()` when `idShort == null`; when THAT is also
 * `null`, it returns `CommandExecutionResult.error("Nothing to note to")` —
 * an EXECUTION-error refusal that aborts the whole state attempt
 * (`command/PSystemCommandFactory.java:169-175`), not the silent no-op
 * `state-commands-notes.ts:98` used to perform. Registered for state at
 * `statediagram/StateDiagramFactory.java:97-100`
 * (`new CommandFactoryNoteOnEntity("state", ...)`).
 *
 * Both the single-line (rule 11) and multi-line (rule 10) forms share the
 * SAME upstream `executeInternal` — checked here on both.
 *
 * Fixture provenance (plans/unknown-bucket-routing-repair/diagnosis/T2.md,
 * mechanism M8): `tiseze-53-gace410`'s preprocessed body is two consecutive
 * `note right: <text>` lines with no prior entity anywhere in the document;
 * `coruvi-63-vuzu133`/`nezaxe-99-mumo948` reach the identical shape via
 * `!define` macro expansion (`note right: def a, def b` /
 * `note right: 123, def b`). The exact preprocessed single-line shape is
 * reproduced directly below (`note right: def a, def b`).
 */
import { describe, it, expect } from 'vitest';

import { parseState } from '../../../src/diagrams/state/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ParseRefusal } from '../../../src/core/parse-refusal.js';

function block(...lines: string[]): UmlSource {
  return { lines, type: 'state' };
}

describe('T9b -- state note with no target and no prior entity', () => {
  it('single-line: refuses "Nothing to note to" (coruvi-63-vuzu133 preprocessed shape)', () => {
    const result = parseState(block('note right: def a, def b'));
    expect((result as ParseRefusal).refused).toBe(true);
    expect((result as ParseRefusal).kind).toBe('execution');
    expect((result as ParseRefusal).message).toBe('Nothing to note to');
  });

  it('single-line: refuses "Nothing to note to" (tiseze-53-gace410 preprocessed shape)', () => {
    const result = parseState(block('note right: %filename%', 'note left: %filenameNoExtension%'));
    expect((result as ParseRefusal).refused).toBe(true);
    expect((result as ParseRefusal).kind).toBe('execution');
    expect((result as ParseRefusal).message).toBe('Nothing to note to');
  });

  it('multi-line (end note form): refuses "Nothing to note to" too (shared executeInternal)', () => {
    const result = parseState(block('note right', 'orphan note body', 'end note'));
    expect((result as ParseRefusal).refused).toBe(true);
    expect((result as ParseRefusal).kind).toBe('execution');
    expect((result as ParseRefusal).message).toBe('Nothing to note to');
  });

  it('multi-line (bracket form): refuses "Nothing to note to" too', () => {
    const result = parseState(block('note right {', 'orphan note body', '}'));
    expect((result as ParseRefusal).refused).toBe(true);
    expect((result as ParseRefusal).kind).toBe('execution');
    expect((result as ParseRefusal).message).toBe('Nothing to note to');
  });

  it('regression control: an explicit "of <State>" target is unaffected (no refusal)', () => {
    const result = parseState(block('note right of A: text'));
    expect('refused' in result).toBe(false);
    if ('refused' in result) throw new Error('unreachable');
    expect(result.notes?.[0]).toMatchObject({ target: 'A', position: 'right' });
  });

  it('regression control: a note with a prior entity still attaches (no refusal)', () => {
    const result = parseState(block('A --> B', 'note right: trailing note'));
    expect('refused' in result).toBe(false);
    if ('refused' in result) throw new Error('unreachable');
    expect(result.notes?.[0]).toMatchObject({ target: 'B', position: 'right', implicitTarget: true });
  });
});
