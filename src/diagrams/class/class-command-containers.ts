/**
 * Container/creation commands for the class diagram dispatch table (rules
 * 4-5g of the original class-commands.ts COMMANDS array): brace close,
 * `together {`, namespace/package blocks, descriptive containers, the `()`
 * lollipop declaration, diamond associations, association-class couples,
 * `note on link`, `constraint on links`, and `url`. Split out of
 * class-commands.ts to stay under the line cap; order preserved (spread
 * second in COMMANDS, right after the directive group).
 */
import { applyAssocCouple, ASSOC_COUPLE_RE, ASSOC_DOUBLE_COUPLE_RE } from './class-assoc-couple.js';
import { applyDoubleCouple } from './class-assoc-double-couple.js';
import type { Command } from './class-command-types.js';
import {
  closeBraceScope,
  openNamespaceBlock,
  openTogetherBlock,
  setNamespaceStereotype,
  setNamespaceUrl,
  setNamespaceColor,
  NAMESPACE_COMMANDS,
} from './class-container.js';
import { collapseEmptyNamespace } from './class-namespace.js';
import {
  applyConstraintOnLinks,
  applyNoteOnLink,
  resolveLinkNotePosition,
  CONSTRAINT_ON_LINKS_RE,
  NOTE_ON_LINK_RE,
  NOTE_ON_LINK_MULTI_RE,
  NOTE_COLOR,
} from './class-notes.js';
import { applyUrlStatement, URL_STATEMENT_RE } from './class-url-command.js';
import { ensureClassifier } from './parser.js';
import { parseTagTokens } from './class-declaration-parser.js';

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const CONTAINER_COMMANDS: readonly Command[] = [
  // 4. Closing brace — ends a pending body, together block, or namespace
  //    block (LIFO; see closeBraceScope in class-container.ts).
  { pattern: /^\}\s*$/, execute: (state) => closeBraceScope(state) },

  // 4b. `together {` (CommandTogether, ClassDiagramFactory.java:131) — a
  //     layout-proximity grouping with no comparator-visible DOT cluster; see
  //     openTogetherBlock (class-container.ts).
  { pattern: /^together\s*\{\s*$/i, execute: (state) => openTogetherBlock(state) },

  // 4b/5. Namespace block commands (CommandNamespace2 + CommandNamespace) —
  //       moved to class-container.ts (NAMESPACE_COMMANDS) to keep this file
  //       under the line cap; order preserved (2 tried first).
  ...NAMESPACE_COMMANDS,

  // 5b. Package block. Upstream routes package through the same PACKAGE group
  //     as namespace, so it clusters alike. Trailing `(\s*\})?` (group 5)
  //     captures same-line 'X {}' (CommandPackageEmpty) for immediate collapse.
  //     `$tag` tokens after the name (CommandPackage's Stereotag.pattern()
  //     TAGS1/TAGS2 slots — `package p1 $txn {`, one run each side of the
  //     stereotype, mirroring CommandPackage.java:88-90) are accepted and
  //     discarded: group removal/tag-selection on packages is not
  //     implemented, and `hide $tag` never affects the DOT export (see rule
  //     3). A2s F-G mechanism A8: the `<<stereotype>>` (group 4, between the
  //     TAGS runs like upstream's STEREOTYPE slot) is stored on the
  //     Namespace via `setNamespaceStereotype` (gated: a USymbol-naming
  //     stereotype selects the shape instead, CommandPackage.java:178-191).
  // T3 (unknown-bucket-routing-repair): optional leading VISIBILITY char
  // (`CommandPackage.java:74`, the SAME `VisibilityModifier
  // .regexForVisibilityCharacter()` prefix `class-declaration-parser.ts`'s
  // `DECL_KIND_RE` carries) -- captured by the non-capturing `(?:...)` group
  // and discarded, matching that command's own posture (no render-side
  // field consumes a package's visibility marker either).
  // T11 (E4/M3): the `[[url]]` group (5) is now CAPTURING (was
  // non-capturing, discarded) and NOTE_COLOR (6, the SAME bare/`back:`
  // grammar `class-notes.ts` note commands already reuse) is inserted
  // ahead of the old trailing catch-all -- both read onto the Namespace
  // via setNamespaceUrl/setNamespaceColor below; the same-line-close brace
  // group shifted from 5 to 7. The trailing `(?:[#<][^{]*)?` catch-all is
  // kept as a no-op safety net for whatever it used to silently absorb.
  {
    pattern: new RegExp(
      String.raw`^(?:[-#+~]\s*)?package\b\s*(?:"([^"]*)"|([^\s#<{]+))?(?:\s+as\s+([^\s{]+))?(?:\s+\$[^\s{}"'<>$]+)*(?:\s*(<<.+?>>))?(?:\s+\$[^\s{}"'<>$]+)*(?:\s*(\[\[[^\]]*\]\]))?\s*` +
        NOTE_COLOR +
        // T11: a `\s*` gap here is load-bearing -- without it, a trailing
        // space before `{` (e.g. `#DDD {`) makes the whole match fail at
        // NOTE_COLOR's end position, and the engine backtracks NOTE_COLOR
        // to zero-width so the catch-all below (whose `[^{]*` tolerates
        // the space) silently swallows the colour text instead, leaving
        // the capture group undefined (caught by this task's own tests).
        String.raw`\s*(?:[#<][^{]*)?\{(\s*\})?\s*$`,
      'i',
    ),
    execute(state, match) {
      const name = match[1] ?? match[2];
      let effectiveId: string;
      if (name !== undefined) {
        effectiveId = openNamespaceBlock(state, match[3] ?? name, name);
      } else {
        const id = '__pkg' + String(state.ast.namespaces.length);
        effectiveId = openNamespaceBlock(state, id, '');
      }
      setNamespaceStereotype(state, effectiveId, match[4], true);
      setNamespaceUrl(state, effectiveId, match[5]);
      setNamespaceColor(state, effectiveId, match[6]);
      if (match[7] !== undefined) {
        state.ast.namespaces = collapseEmptyNamespace(
          state.ast.namespaces,
          state.classifierIndex,
          state.ast.classifiers,
          effectiveId,
        );
        state.activeNamespace = state.namespaceStack.pop() ?? null;
      }
    },
  },

  // 5b'. Descriptive container (CommandPackageWithUSymbol): `stack a as a {`,
  //      `rectangle "Y" as Z [[url]] {`. Non-empty → cluster; EMPTY → rect leaf on close.
  {
    pattern:
      // `$tag` runs on BOTH sides of the stereotype, as `TAGS1`/`TAGS2`
      // (`CommandPackageWithUSymbol.java:121,123`) -- the same pair rule 5's
      // `package` pattern above already carries. Without them
      // `component C1 $tag1 {` matched no container command at all, so the
      // block never opened and its BODY went unparsed: `component C1 $tag1 {
      // qwe rty !!! }` was accepted whole. That let the class engine claim
      // `component/jebovo-64-rasa849` and `sodoza-93-nanu557`, which the jar
      // routes to DESCRIPTION -- upstream's class factory refuses them on the
      // nested `node n` leaf, via `CommandCreateElementFull2`'s allowmixing
      // gate, and only reaches that gate because the container DID open.
      // T5 M2 (unknown-bucket-routing-repair): `action`/`process` added --
      // both are already present in `class-descriptive-leaf-command.ts`'s
      // `CONTAINER_KEYWORD` (CommandPackageWithUSymbol's own SYMBOL
      // alternation verbatim) but were absent from THIS list, so `action
      // action {` fell to the DESCRIPTIVE_LEAF_COMMANDS fallback's
      // `isContainerOpener` exemption instead of opening a real container --
      // the nested body's own lines were then never re-dispatched through
      // the per-line/allowmixing gate at all.
      /^(rectangle|node|component|folder|frame|cloud|database|storage|artifact|file|card|queue|stack|hexagon|agent|action|process)\s+(?:"([^"]*)"|([^\s{]+))(?:\s+as\s+([^\s{]+))?((?:\s+\$[^\s{}"'<>$]+)*)(?:\s*(?:<<.+?>>))?((?:\s+\$[^\s{}"'<>$]+)*)(?:\s*\[\[[^\]]*\]\])?\s*(?:[#<][^{]*)?\{\s*$/i,
    execute(state, match) {
      const usymbol = match[1]!.toLowerCase();
      const name = match[2] !== undefined ? match[2] : match[3]!;
      const id = match[4] ?? name;
      const effectiveId = openNamespaceBlock(state, id, name);
      state.descriptiveContainers.set(effectiveId, usymbol);
      // `addTags(p, arg.getLazzy("TAGS", 0))` -- upstream applies BOTH tag
      // runs to the group it just created (`CommandPackageWithUSymbol
      // .java:214`). `remove $tag` / `restore $tag` resolve against them, so
      // discarding them here would leave `component a $a {}` un-removable
      // (kokebo-27-vafi688).
      const tags = parseTagTokens(`${match[5] ?? ''} ${match[6] ?? ''}`);
      if (tags.length > 0) state.pendingContainerTags.set(effectiveId, tags);
    },
  },

  // 5b''. `() "name"` interface lollipop (CommandCreateElementParenthesis) — a
  //       plaintext circle node (same svek shape as a `circle` element).
  {
    pattern: /^\(\)\s+(?:"([^"]*)"|(\S+))(?:\s+as\s+(\S+))?\s*$/,
    execute(state, match) {
      const name = match[1] ?? match[2]!;
      ensureClassifier(state, match[3] ?? name, 'circle', name).kind = 'circle';
    },
  },

  // 5c. Association diamond: `<> name` (CommandDiamondAssociation) — a
  //     diamond-shaped n-ary/association-class connector node.
  {
    pattern: /^<>\s+(\S+)\s*$/,
    execute(state, match) {
      // Force kind even if a relationship endpoint auto-created it as a class.
      ensureClassifier(state, match[1]!, 'association').kind = 'association';
    },
  },

  // 5d. Association-class couple. Double `(A,B).(C,D)` before single `(A,B)..C`.
  // Endpoint resolution mirrors CommandLinkClass's couple handling
  // (executeArgSpecial1/2/3, reuseExistingChild=true for every A/B/C/D
  // endpoint) — a bare endpoint name may reuse an existing classifier.
  {
    pattern: ASSOC_DOUBLE_COUPLE_RE,
    execute(state, match) {
      // cdd-T3 (A1 SB3): the double couple burns jar's shared counter too --
      // see `stampDoubleCouple` (class-assoc-double-couple.ts).
      applyDoubleCouple(
        state.ast,
        (id) => ensureClassifier(state, id, undefined, undefined, true),
        match.input,
        state.creationCounter,
      );
    },
  },
  {
    pattern: ASSOC_COUPLE_RE,
    execute(state, match) {
      // G2 N19: single-coupling-only creationIndex/synthetic-name tracking
      // -- see `AssocCoupleCounter`'s doc comment (class-assoc-couple.ts).
      applyAssocCouple(
        state.ast,
        (id) => ensureClassifier(state, id, undefined, undefined, true),
        match.input,
        state.creationCounter,
      );
    },
  },

  // 5e. `note on|of link: text` — see NOTE_ON_LINK_RE's doc (class-notes.ts).
  // T10: position is now group 1 (optional, default BOTTOM); G2 N34's
  // capturing NOTE_COLOR is group 2 (still not consumed here, same
  // "captured but not wired to render" posture as the link-note-color
  // cluster generally -- surveyed, named remainder, not this iteration's
  // scope); text is group 3.
  {
    pattern: NOTE_ON_LINK_RE,
    execute: (state, match) => applyNoteOnLink(state.ast, resolveLinkNotePosition(match[1]), match[3]!),
  },

  // 5e-multi. `note [pos] on|of link [#color]` (no colon) — opens a
  // multi-line note-on-link block closed by `end note`. See
  // NOTE_ON_LINK_MULTI_RE's doc (class-notes.ts).
  {
    pattern: NOTE_ON_LINK_MULTI_RE,
    execute: (state, match) => {
      state.pendingNote = { kind: 'link', position: resolveLinkNotePosition(match[1]), textLines: [] };
    },
  },

  // 5f. `constraint on links` — see CONSTRAINT_ON_LINKS_RE (class-notes.ts).
  { pattern: CONSTRAINT_ON_LINKS_RE, execute: (state, match) => applyConstraintOnLinks(state.ast, match[1] ?? '') },

  // 5g. `url [of|for] <Code> [is] [[...]]` — CommandUrl.java (README item
  //     #7, G2 N15). Attaches a url to an ALREADY-DECLARED classifier;
  //     silent no-op when the target doesn't exist (mirrors this port's
  //     established no-throw posture for unresolvable post-hoc directives —
  //     see class-notes.ts's "Nothing to note to" precedent — rather than
  //     upstream's thrown error).
  { pattern: URL_STATEMENT_RE, execute: (state, match) => applyUrlStatement(state, match[1]!, match[2]!) },
];
