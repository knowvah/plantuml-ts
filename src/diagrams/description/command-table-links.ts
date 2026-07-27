/**
 * Link-line command for the descriptive diagram dispatch table (rule 9 of
 * the original command-table.ts COMMANDS array). Split out of
 * command-table.ts to stay under the line cap; order preserved (must run
 * before the bracket (10) and paren (11) shorthands).
 */

import type { Command } from './command-table-types.js';
import { resolveEndpointNamespace } from './command-table-helpers.js';
import { LINK_LINE_RE, parseLinkLine } from './link-grammar.js';
import { addLink, ensureEndpoint, nextCreationIndex } from './parse-state.js';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const LINK_COMMANDS: readonly Command[] = [
  // 9. Links — MUST come before bracket (10) and paren (11) shorthands.
  //    Full CommandLinkElement.java grammar (see link-grammar.ts): endpoint
  //    shapes ([Comp], () IFace, (UseCase), :Actor:, bare/quoted identifier),
  //    LinkDecor head tokens, direction hints (-r->, -left->), inline
  //    [#color,style] brackets, and qualifier labels ("1" --> "0..*").
  {
    pattern: LINK_LINE_RE,
    execute(state, match) {
      // LINK_LINE_RE always carries named capture groups, so `.groups` is
      // never undefined when the pattern matches (see parseLinkLine).
      const parsed = parseLinkLine(match.groups!);
      const from = resolveEndpointNamespace(state, parsed.from);
      const to = resolveEndpointNamespace(state, parsed.to);
      // CommandLinkElement.executeArg:317-318: `cl1 = getDummy(ent1); cl2 =
      // getDummy(ent2);` -- both endpoints auto-create in RAW ENT1-then-ENT2
      // order, BEFORE the `dir == LEFT || dir == UP` inversion swap (:325-326)
      // ever runs. `parsed.from`/`.to` are ALREADY post-inversion (see
      // ParsedLink.inverted's doc comment), so when inverted, `to` is the
      // raw-first (ENT1) endpoint and `from` is raw-second (ENT2) --
      // ensureEndpoint must run in that raw order, not `from`-then-`to`.
      if (parsed.inverted) {
        ensureEndpoint(state, to);
        ensureEndpoint(state, from);
      } else {
        ensureEndpoint(state, from);
        ensureEndpoint(state, to);
      }
      parsed.link.from = from.id;
      parsed.link.to = to.id;
      // Link#getInv() (abel/Link.java:145-147) constructs a WHOLE NEW Link
      // on inversion, burning a SECOND shared-counter value beyond the
      // discarded pre-inversion Link's own -- see DescriptiveLink
      // .creationIndex's doc comment.
      if (parsed.inverted) nextCreationIndex(state);
      parsed.link.creationIndex = nextCreationIndex(state);
      addLink(state, parsed.link);
    },
  },
];
