/**
 * Type-level test: every engine's local `Command` dispatch-entry type
 * lines up with the shared `core/command/Command.ts` generic the way T7
 * (`plans/shared-seam-extraction/batch-1b/T7-generic-command.md`) says it
 * should. No runtime assertions — `expectTypeOf` is checked by
 * `npm run typecheck` (tsconfig.json's `include` covers `tests`); the
 * `it()` bodies just need to execute without throwing.
 */
import { describe, expectTypeOf, it } from 'vitest';
import type { Command as CoreCommand } from '../../../../src/core/command/Command.js';
import type { Command as ClassCommand } from '../../../../src/diagrams/class/class-command-types.js';
import type { ParseState as ClassParseState } from '../../../../src/diagrams/class/parser.js';
import type { Command as DescriptionCommand } from '../../../../src/diagrams/description/command-table-types.js';
import type { ParseState as DescriptionParseState } from '../../../../src/diagrams/description/parse-state.js';
import type {
  Command as SequenceCommand,
  ParseState as SequenceParseState,
} from '../../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type { Command as StateCommand } from '../../../../src/diagrams/state/state-commands.js';
import type { ParseState as StateParseState } from '../../../../src/diagrams/state/state-parse-state.js';

describe('Command<S> — engine aliases (T7)', () => {
  it('class.Command is CoreCommand<class.ParseState>', () => {
    expectTypeOf<ClassCommand>().toEqualTypeOf<CoreCommand<ClassParseState>>();
  });

  it('description.Command is CoreCommand<description.ParseState>', () => {
    expectTypeOf<DescriptionCommand>().toEqualTypeOf<CoreCommand<DescriptionParseState>>();
  });

  it('sequence.Command is CoreCommand<sequence.ParseState>', () => {
    expectTypeOf<SequenceCommand>().toEqualTypeOf<CoreCommand<SequenceParseState>>();
  });

  // state.Command deliberately does NOT alias CoreCommand<StateParseState>:
  // its `execute` keeps the 3rd `pass` argument upstream's real
  // `execute(D, BlocLines, ParserPass)` takes (Command.java:44), and
  // `passes` is required and typed `Pass[]`, not the core `ParserPass[]`.
  // See state-commands.ts's `Command` doc for the full citation and the
  // ~40 real call sites that verify this split is load-bearing, not
  // cosmetic.
  it('state.Command is NOT assignable to CoreCommand<state.ParseState>', () => {
    expectTypeOf<StateCommand>().not.toExtend<CoreCommand<StateParseState>>();
  });
});
