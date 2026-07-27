/**
 * Command dispatch table for the descriptive diagram parser (component /
 * use-case / deployment). Split out of parser.ts (mission G0b/T6) purely to
 * keep parser.ts under the project's 500-line file cap — no behavior
 * change; every export here is verbatim code moved from parser.ts.
 *
 * The COMMANDS array itself was further split into grouped sub-tables (this
 * file's own line cap) — each group lives in its own module and is
 * concatenated below in the exact order the original single array used:
 * command-table-directives.ts (rules 1-4), command-table-shorthand.ts
 * (rules 5-8b), command-table-links.ts (rule 9), and
 * command-table-containers.ts (rules 10-15). Shared helpers live in
 * command-table-helpers.ts; the `Command` shape lives in
 * command-table-types.ts (both split out to avoid an import cycle with
 * this file).
 *
 * Order matters: patterns are tested top-to-bottom; first match wins. More
 * specific patterns MUST precede more general ones.
 */

import type { Command } from './command-table-types.js';
import { DIRECTIVE_COMMANDS } from './command-table-directives.js';
import { SHORTHAND_COMMANDS } from './command-table-shorthand.js';
import { LINK_COMMANDS } from './command-table-links.js';
import { CONTAINER_COMMANDS } from './command-table-containers.js';

export type { Command } from './command-table-types.js';

export const COMMANDS: readonly Command[] = [
  ...DIRECTIVE_COMMANDS,
  ...SHORTHAND_COMMANDS,
  ...LINK_COMMANDS,
  ...CONTAINER_COMMANDS,
];
