/**
 * Bare shorthand declaration commands for the descriptive diagram dispatch
 * table (rules 5-8b of the original command-table.ts COMMANDS array):
 * business-actor `:Name:/`, actor `:Name:`, business-usecase `(Name)/`,
 * interface `()Name`, and the bare-id decorated-display alias form
 * (`Admin as :Main Admin:`). Split out of command-table.ts to stay under
 * the line cap; order preserved.
 */

import type { Command } from './command-table-types.js';
import { SHORTHAND_TRAILER, shorthandNode } from './command-table-helpers.js';
import { makeNode } from './parse-helpers.js';
import { emitNode } from './parse-state.js';
import { RE_BARE_AS_DECORATED, parseBareAsDecorated } from './element-grammar.js';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const SHORTHAND_COMMANDS: readonly Command[] = [
  // 5. Business-actor shorthand: :Name:/ [decorations]
  //    More specific than plain :Name:, so must come first.
  {
    pattern: new RegExp('^:([^:]+):\\s*\\/' + SHORTHAND_TRAILER + '$'),
    execute(state, match) {
      shorthandNode(state, match[1]!.trim(), 'actor-business', match[2]);
    },
  },

  // 6. Actor shorthand: :Name: [decorations]
  {
    pattern: new RegExp('^:([^:]+):' + SHORTHAND_TRAILER + '$'),
    execute(state, match) {
      shorthandNode(state, match[1]!.trim(), 'actor', match[2]);
    },
  },

  // 7. Business-usecase shorthand: (Name)/ [decorations]
  {
    pattern: new RegExp('^\\(([^)]+)\\)\\s*\\/' + SHORTHAND_TRAILER + '$'),
    execute(state, match) {
      shorthandNode(state, match[1]!.trim(), 'usecase-business', match[2]);
    },
  },

  // 8. Interface shorthand: ()InterfaceName / () InterfaceName (standalone,
  //    no arrow). Upstream's CODE_CORE allows zero-or-more whitespace after
  //    the "()" prefix (`\(\)[%s]*[%pLN_.]+`), not one-or-more.
  //    CommandCreateElementFull.java's leading SYMBOL group
  //    (getRegexConcat:84, `(?:(ALL_TYPES|\(\))[%s]+)?`) matches a literal
  //    `()` in the SAME slot as the `interface`/`component`/… keywords --
  //    `() "text" as alias` reduces to the ordinary "DISPLAY as CODE" alias
  //    form once `()` is stripped (DISPLAY2=`"text"`, CODE2=`alias`),
  //    identical to `interface "text" as alias`. The name/alias unit is
  //    captured as ONE group so parseNameSection's own alias-form matching
  //    (RE_DQ_AS_ALIAS / RE_PLAIN_ALIAS) resolves it — SHORTHAND_TRAILER
  //    (tag/stereotype/color/url only) still gates what may follow.
  {
    pattern: new RegExp(
      '^\\(\\)\\s*("[^"]+"(?:\\s+as\\s+\\S+)?|\\S+(?:\\s+as\\s+\\S+)?)' +
        SHORTHAND_TRAILER + '$',
    ),
    execute(state, match) {
      shorthandNode(state, match[1]!.trim(), 'interface', match[2]);
    },
  },

  // 8b. Bare id, decorated display: `Admin as :Main Admin:` / `Use as (Use
  //     the application)` — CommandCreateElementFull's "CODE3 as DISPLAY3"
  //     alternative (no leading SYMBOL keyword).
  {
    pattern: RE_BARE_AS_DECORATED,
    execute(state, match) {
      const decl = parseBareAsDecorated(match[1]!, match[2]!);
      emitNode(state, makeNode(decl.id, decl.display, decl.symbol));
    },
  },
];
