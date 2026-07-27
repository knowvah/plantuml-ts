/**
 * Command dispatch table for the class diagram parser.
 *
 * Split out of parser.ts (which is at the lint line cap) to make room for new
 * commands. See parser.ts for `ParseState`, the `ensureClassifier` helper,
 * and the `parseClass` driver loop; `registerInNamespace` lives in
 * class-namespace.ts.
 *
 * The COMMANDS array itself was further split into grouped sub-tables (this
 * file's own line cap) — each group lives in its own module and is
 * concatenated below in the exact order the original single array used:
 * class-command-directives.ts (rules 1-3b), class-command-containers.ts
 * (rules 4-5g), class-command-relationships.ts (rules 6-pre/6/6a),
 * class-command-declarations.ts (rules 7-7c), class-command-notes.ts (rules
 * 6b-6e), then the descriptive-leaf spread (rule 9, already split out) and
 * the stereotype statement (rule 10), both small enough to stay inline.
 */

import { DIRECTIVE_COMMANDS } from './class-command-directives.js';
import { CONTAINER_COMMANDS } from './class-command-containers.js';
import { RELATIONSHIP_COMMANDS } from './class-command-relationships.js';
import { DECLARATION_COMMANDS } from './class-command-declarations.js';
import { NOTE_COMMANDS } from './class-command-notes.js';
import { DESCRIPTIVE_LEAF_COMMANDS } from './class-descriptive-leaf-command.js';
import {
  applyStereotypeStatement,
  STEREOTYPE_STATEMENT_RE,
} from './class-stereotype-command.js';
import type { Command } from './class-command-types.js';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const COMMANDS: readonly Command[] = [
  ...DIRECTIVE_COMMANDS,
  ...CONTAINER_COMMANDS,
  ...RELATIONSHIP_COMMANDS,
  ...DECLARATION_COMMANDS,
  ...NOTE_COMMANDS,

  // 9. Descriptive-element leaf declarations — moved to
  //    class-descriptive-leaf-command.ts (line cap); see that module.
  ...DESCRIPTIVE_LEAF_COMMANDS,

  // 10. `<Name> <<stereotype>>` post-hoc stereotype assignment (G2 N24) —
  //     tried LAST: the broadest catch-all in this table (`\S+` name +
  //     mandatory bracket, no keyword), every more specific command above
  //     (declarations, members, relationships, hide/show) is tried first.
  {
    pattern: STEREOTYPE_STATEMENT_RE,
    execute(state, match) {
      applyStereotypeStatement(state, match[1]!, match[2]!);
    },
  },
];
