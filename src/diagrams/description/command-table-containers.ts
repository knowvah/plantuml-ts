/**
 * Bracket/paren shorthand, container-block, and generic keyword-dispatch
 * commands for the descriptive diagram dispatch table (rules 10-15 of the
 * original command-table.ts COMMANDS array): `[Name]` bracket shorthand,
 * `(Name)` use-case shorthand, quoted-display-with-wrapped-alias, container
 * inline blocks, container open blocks, the generic KEYWORD_TO_SYMBOL
 * dispatch, and the bare-quoted trailing declaration. Split out of
 * command-table.ts to stay under the line cap; order preserved (must run
 * AFTER the links rule (9), and rule 15 must stay last).
 */

import { KEYWORD_TO_SYMBOL } from '../../core/descriptive-keywords.js';
import type { Command } from './command-table-types.js';
import { SHORTHAND_TRAILER, shorthandNode } from './command-table-helpers.js';
import {
  CONTAINER_INLINE_RE,
  CONTAINER_OPEN_RE,
  KEYWORD_RE,
  makeNode,
  parseInlineBody,
  parseNameSection,
} from './parse-helpers.js';
import { parseBracketDeclaration } from './element-grammar.js';
import {
  RE_BARE_DECORATED_DECL,
  RE_BARE_QUOTED_DECL,
} from './element-grammar-nosymbol.js';
import { emitNode, nextCreationIndex } from './parse-state.js';
import { leafDisplayName } from './namespace-groups.js';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const CONTAINER_COMMANDS: readonly Command[] = [
  // 10. Bracket shorthand: [Name] [as Alias] [<<stereotype>>] [#color]
  {
    pattern: /^\[([^\]]+)\](.*)?$/,
    execute(state, match) {
      const decl = parseBracketDeclaration(match[1]!.trim(), match[2] ?? '');
      emitNode(state, makeNode(decl.id, decl.display, 'component', decl.stereotype, decl.color));
    },
  },

  // 11. Use-case shorthand: (Name) [as Alias] [decorations] — the alias may
  //     itself be wrapped ((uc1), :a:, [c]); parseNameSection + cleanId
  //     normalize it (cimare-47: `(another use case) as (uc1)`).
  {
    pattern: new RegExp(
      '^(\\([^)]+\\)(?:\\s+as\\s+(?:\\([^)]+\\)|:[^:]+:|\\S+))?)' +
        SHORTHAND_TRAILER + '$',
    ),
    execute(state, match) {
      shorthandNode(state, match[1]!.trim(), 'usecase', match[2]);
    },
  },

  // 11b. Quoted display with wrapped alias: `"another use case" as (uc4)` —
  //      the alias notation picks the symbol (paren→usecase, colon→actor,
  //      bracket→component), mirroring getDummy's codeChar dispatch.
  {
    pattern: new RegExp(
      '^("[^"]+"\\s+as\\s+(\\([^)]+\\)|:[^:]+:|\\[[^\\]]+\\]))' +
        SHORTHAND_TRAILER + '$',
    ),
    execute(state, match) {
      const alias = match[2]!;
      const symbol =
        alias.startsWith('(') ? 'usecase' : alias.startsWith(':') ? 'actor' : 'component';
      shorthandNode(state, match[1]!.trim(), symbol, match[3]);
    },
  },

  // 12. Container inline block: CONTAINER header { body }
  {
    pattern: CONTAINER_INLINE_RE,
    execute(state, match) {
      const kw = match[1]!.toLowerCase();
      const symbol = KEYWORD_TO_SYMBOL.get(kw) ?? 'node';
      const { id, display, stereotype, color, tags } = parseNameSection(match[2]!.trim());
      const container = makeNode(id, display, symbol, stereotype, color, tags);
      container.declaredAsGroup = true;
      for (const child of parseInlineBody(match[3]!)) {
        container.children.push(child);
      }
      // CommandPackageWithUSymbol.java:178-180: an anonymous container (no
      // CODE) burns ONE extra shared-counter value generating its internal
      // quark name (`getUniqueSequence("##")`) BEFORE the group Entity's own
      // uid is assigned -- see DescriptiveNode.creationIndex's doc comment.
      if (id.length === 0) nextCreationIndex(state);
      emitNode(state, container);
    },
  },

  // 13. Container open block: CONTAINER header {
  //     CucaDiagram.quarkInContext: a container id is a GLOBAL quark
  //     identity -- reopening the SAME id later in the source (the same
  //     `KEYWORD "..." as SameId {` appearing twice) reuses the SAME group
  //     entity rather than creating a duplicate sibling cluster; new body
  //     lines become additional children of that one group
  //     (tajuki-26-bime046: clusterOk).
  {
    pattern: CONTAINER_OPEN_RE,
    execute(state, match) {
      const kw = match[1]!.toLowerCase();
      const symbol = KEYWORD_TO_SYMBOL.get(kw) ?? 'node';
      const { id, display, stereotype, color, tags } = parseNameSection(match[2]!.trim());
      const existing = state.nodesById.get(id);
      if (existing !== undefined && existing.declaredAsGroup === true) {
        state.containerStack.push(existing);
        return;
      }
      const container = makeNode(id, display, symbol, stereotype, color, tags);
      container.declaredAsGroup = true;
      // CommandPackageWithUSymbol.java:178-180: an anonymous container (no
      // CODE) burns ONE extra shared-counter value generating its internal
      // quark name (`getUniqueSequence("##")`) BEFORE the group Entity's own
      // uid is assigned -- see DescriptiveNode.creationIndex's doc comment.
      if (id.length === 0) nextCreationIndex(state);
      emitNode(state, container);
      state.containerStack.push(container);
    },
  },

  // 14. Generic keyword dispatch: any KEYWORD_TO_SYMBOL key followed by a name.
  //     Handles non-container keywords (artifact, person, boundary, …) and
  //     container keywords used standalone without braces (node Foo).
  //     Business-variant keywords: actor/ Name, usecase/ Name.
  //     `port`/`portin`/`portout` (CommandCreateElementFull.java:276-284,
  //     :316-317): only valid inside an open container — at root level the
  //     command errors and creates nothing; else the raw keyword (not the
  //     unified `port` USymbol) decides the EntityPosition direction.
  {
    pattern: KEYWORD_RE,
    execute(state, match) {
      const kw = match[1]!.toLowerCase();
      const symbol = KEYWORD_TO_SYMBOL.get(kw);
      if (symbol === undefined) return;
      if (symbol === 'port' && state.containerStack.length === 0) return;
      // CommandCreateElementFull's CODE-can-be-`[bracket]` alternative
      // (getRegexConcat CODE1, codeChar `[`): a keyword-prefixed bracket
      // declaration whose alias follows the bracket -- `component [Disp] as Id`
      // -- must strip the `[...]`/`as` wrapper into display/id via the SAME
      // `parseBracketDeclaration` the bare `[Name] as Alias` shorthand uses
      // (rule 10 above), routing the keyword's own USymbol. Without this the
      // whole `[Disp] as Id` string leaked into `parseNameSection`'s
      // fallthrough as BOTH id and display (pebace-74: the box was measured
      // and the label drawn as the literal `[Application1 ...] as A1`). Only
      // the bracket-PLUS-`as` form leaked; a bracket with no alias (`[Disp]`,
      // `[Disp] #color`) already resolves through the normal parseNameSection
      // path (verified: cegale-42/detona-13/dodeni-90/mobugi-89 parse clean),
      // so it is intentionally NOT intercepted here.
      const bracketAs = /^\[([^\]]*)\]\s+(as\s+.+)$/i.exec(match[2]!.trim());
      if (bracketAs !== null) {
        const bdecl = parseBracketDeclaration(bracketAs[1]!.trim(), bracketAs[2]!);
        emitNode(state, makeNode(bdecl.id, bdecl.display, symbol, bdecl.stereotype, bdecl.color));
        return;
      }
      const { id, display, stereotype, color, tags } = parseNameSection(match[2]!);
      // CommandCreateElementFull.java:317-318: `display = quark.getName()`
      // when no explicit alias/display was given — the LEAF segment only,
      // not the full dotted path, once `set separator` is active.
      const finalDisplay =
        display === id ? leafDisplayName(id, state.namespaceSeparator) : display;
      const decl = makeNode(id, finalDisplay, symbol, stereotype, color, tags);
      if (symbol === 'port') decl.position = kw === 'portout' ? 'portout' : 'portin';
      emitNode(state, decl);
    },
  },

  // 14b. Bare UNQUOTED declaration, no keyword: `User << Human >>` —
  //      CommandCreateElementFull's CODE1 branch on CODE_CORE's plain
  //      `[%pLN_.]+` alternative (java:126,:128), SYMBOL omitted (java:84).
  //      `isForbidden` (java:134-138) tests the WHOLE line, so a decoration
  //      is REQUIRED: a pure `User` line declares nothing and must keep
  //      falling through. Same `symbol == null` → plain actor resolution as
  //      rule 15 (java:271-274), not a STILL_UNKNOWN leaf.
  //
  //      Ordered after rule 14 so a single-keyword line carrying only a
  //      decoration (`card <<x>>`) keeps its existing KEYWORD_RE reading,
  //      and disjoint from rule 15 by construction (that one is anchored on
  //      a leading quote, this one on a leading identifier char).
  {
    pattern: RE_BARE_DECORATED_DECL,
    execute(state, match) {
      const { id, display, stereotype, color, tags } = parseNameSection(match[0]);
      emitNode(state, makeNode(id, display, 'actor', stereotype, color, tags));
    },
  },

  // 15. Bare quoted declaration, no keyword, no alias
  //     (CommandCreateElementFull.java:84,88,236-268,273-275): SYMBOL is
  //     optional and CODE1 (CODE_WITH_QUOTE) allows a standalone quoted
  //     string with no "as" clause -- symbol stays null, defaulting to
  //     LeafType.DESCRIPTION / actorStyle().toUSymbol() (plain actor).
  //     MUST be last: every other declaration/link/shorthand rule takes a
  //     leading keyword, bracket, paren, or colon that a quote can't supply.
  {
    pattern: RE_BARE_QUOTED_DECL,
    execute(state, match) {
      const { id, display, stereotype, color, tags } = parseNameSection(match[0]);
      emitNode(state, makeNode(id, display, 'actor', stereotype, color, tags));
    },
  },
];
