/**
 * Shared `Command` shape for the descriptive diagram dispatch table. Split
 * out so every command-group module (command-table-directives.ts,
 * command-table-shorthand.ts, command-table-links.ts,
 * command-table-containers.ts) can type its exported array without
 * importing command-table.ts itself (which would create a cycle, since
 * command-table.ts imports those groups).
 */

import type { ParseState } from './parse-state.js';

export interface Command {
  pattern: RegExp;
  execute(state: ParseState, match: RegExpExecArray): void;
}
