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
import { makeNode, parseNameSection } from './parse-helpers.js';
import { emitNode } from './parse-state.js';
import {
  RE_BARE_AS_DECORATED,
  RE_CODE_AS_QUOTED_DISPLAY,
  parseBareAsDecorated,
  parseCodeAsQuotedDisplay,
} from './element-grammar-nosymbol.js';

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

  // 8c. CODE as "quoted DISPLAY" — the SAME "CODE3 as DISPLAY3" alternative
  //     (java:95-100) on its QUOTED display branch (DISPLAY_CORE, java:130).
  //     A quoted RHS cannot satisfy `DISPLAY2 as CODE2` (CODE_CORE has no
  //     quoted alternative), so the roles FLIP relative to every other alias
  //     rule: the LHS is the id, the quoted RHS is the display. See
  //     `element-grammar-nosymbol.ts#RE_CODE_AS_QUOTED_DISPLAY`.
  //
  //     Ordered HERE, ahead of the links rule and the container table, rather
  //     than after rule 11b: rule 10's `^\[([^\]]+)\](.*)?$` trailer is greedy
  //     and its `as\s+(\S+)` alias stops at the first space, so
  //     `[Comp] as "Big component"` MIS-parses to id `"Big` / display `Comp`
  //     before any later rule could see it. Nothing this rule can match is
  //     claimed by rules 5-8b (all require a `:`/`(`/`()` PREFIX and reject a
  //     quoted tail) or by rule 9 (a link line has no bare `as` in this
  //     position), and rule 11's own no-space case (`(Use) as "X"`) resolves
  //     to the identical id/display through parseNameSection's RE_ID_AS_DQ —
  //     so moving it earlier changes no existing shape's result.
  {
    pattern: RE_CODE_AS_QUOTED_DISPLAY,
    execute(state, match) {
      const decl = parseCodeAsQuotedDisplay(match[1]!, match[3]!);
      // STEREOTYPE3 (before `as`, java:96) and the trailing TAGS/STEREOTYPE/
      // URL/color run (java:108-115) are the SAME decoration vocabulary
      // parseNameSection already strips, in the same order — feed it the two
      // runs alone (no CODE/DISPLAY text) so this rule inherits that
      // extraction rather than duplicating it.
      const deco = parseNameSection((match[2] ?? '') + (match[4] ?? ''));
      emitNode(
        state,
        makeNode(decl.id, decl.display, decl.symbol, deco.stereotype, deco.color, deco.tags),
      );
    },
  },
];
