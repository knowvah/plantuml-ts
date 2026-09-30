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
import type { Visibility } from './ast.js';
import type { ParseState } from './parser.js';
import {
  openNamespaceBlock,
  setNamespaceStereotype,
  setNamespaceTags,
  setNamespaceUrl,
  setNamespaceColor,
  NAMESPACE_COMMANDS,
} from './class-container.js';
import { collapseEmptyNamespace } from './class-namespace.js';
import { closeBraceScope, openTogetherBlock } from './class-together.js';
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
/** `%g` -- PlantUML's double-quote class (`"`, U+201C, U+201D, U+E121;
 *  the same set `core/url/UrlBuilder.ts` expands). */
const G = String.raw`["\u201C\u201D\uE121]`;
const NOT_G = String.raw`[^"\u201C\u201D\uE121]`;
const NOT_G_CODE = String.raw`[^#\s{}"\u201C\u201D\uE121]`;

/**
 * cdd6-T3d (xuloxo-85-vibu502): `CommandPackageWithUSymbol`'s name head, the
 * RegexOr of five alternatives tried left to right, eleven capture groups
 * (match indices 2-12 after the SYMBOL group):
 *
 *   DISPLAY1 `[%g].+?[%g]` [STEREOTYPE1] `as` CODE1 `[^#%s{}]+`       (2,3,4)
 *   CODE2 `[^#%s{}%g]+` [STEREOTYPE2] `as` DISPLAY2 `[%g].+?[%g]`     (5,6,7)
 *   DISPLAY3 `[^#%s{}%g]+` [STEREOTYPE3] `as` CODE3 `[^#%s{}%g]+`     (8,9,10)
 *   CODE8 `[%g][^%g]+[%g]`                                          (11)
 *   CODE9 `[^#%s{}%g]*`                                             (12)
 *
 * The stereotype may therefore sit BEFORE `as` (C4's `rectangle "D"
 * <<person>> as X {`); the old head accepted `as` only before it and the
 * trailing `[#<][^{]*` swallowed `<<person>> as X`, losing both the
 * stereotype and the alias. Quoted displays are captured inside their
 * quotes (`eventuallyRemoveStartingAndEndingDoubleQuote`, java:180,183).
 * CODE9 is ported as `+`, not `*`: the empty-code branch
 * (`getUniqueSequence("##")`, display null, java:181-188) is not ported.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandPackageWithUSymbol.java:79-116
 */
const USYMBOL_CONTAINER_HEAD =
  `(?:${G}(.+?)${G}(?:\\s+(<<.+>>))?\\s*as\\s+([^#\\s{}]+)` +
  `|(${NOT_G_CODE}+)(?:\\s+(<<.+>>))?\\s*as\\s+${G}(.+?)${G}` +
  `|(${NOT_G_CODE}+)(?:\\s+(<<.+>>))?\\s*as\\s+(${NOT_G_CODE}+)` +
  `|${G}(${NOT_G}+)${G}` +
  `|(${NOT_G_CODE}+))`;

/**
 * The head's `getLazzy("CODE")`/`getLazzy("DISPLAY")`/`getLazzy("STEREOTYPE")`
 * reads (`CommandPackageWithUSymbol.java:178-205`): `display` falls back to
 * the code when no DISPLAY alternative matched (`ident.getName()`, java:186).
 * `stereotype` is the in-head STEREOTYPEn; the caller falls back to the
 * trailing STEREOTYPE group. When both are present `getLazzy` walks a
 * HashMap (`RegexComposed.java:84`), so that order is unspecified upstream.
 */
function usymbolContainerHead(match: RegExpExecArray): { code: string; display: string; stereotype?: string } {
  const first = (groups: readonly number[]): string | undefined =>
    groups.map((g) => match[g]).find((v) => v !== undefined);
  // CODE1, CODE2, CODE3, CODE8, CODE9 -- exactly one alternative matched.
  const code = first([4, 5, 10, 11, 12])!;
  const display = first([2, 7, 8]) ?? code;
  const stereotype = first([3, 6, 9]);
  return stereotype !== undefined ? { code, display, stereotype } : { code, display };
}

/**
 * cdd6-T3d (topave-65-ceso890): `CommandPackage.executeArg`'s
 * `p.setVisibilityModifier(VisibilityModifier.getVisibilityModifier(
 * visibilityString + "FOO", false))` -- the char alone selects the modifier
 * (`[-#+~]`, `VisibilityModifier.java:75-77`); `false` is the METHOD
 * variant, which the drawn `<g data-visibility-modifier>` names.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/CommandPackage.java:189-192
 */
function setNamespaceVisibility(state: ParseState, nsId: string, visibility: string | undefined): void {
  if (visibility === undefined) return;
  const ns = state.ast.namespaces.find((n) => n.id === nsId);
  if (ns !== undefined) ns.visibilityModifier = visibility as Visibility;
}

export const CONTAINER_COMMANDS: readonly Command[] = [
  // 4. Closing brace — ends a pending body, together block, or namespace
  //    block (LIFO; see closeBraceScope in class-together.ts).
  { pattern: /^\}\s*$/, execute: (state) => closeBraceScope(state) },

  // 4b. `together {` (CommandTogether, ClassDiagramFactory.java:131) — a
  //     layout-proximity grouping with no comparator-visible DOT cluster; see
  //     openTogetherBlock (class-together.ts).
  { pattern: /^together\s*\{\s*$/i, execute: (state) => openTogetherBlock(state) },

  // 4b/5. Namespace block commands (CommandNamespace2 + CommandNamespace) —
  //       moved to class-container.ts (NAMESPACE_COMMANDS) to keep this file
  //       under the line cap; order preserved (2 tried first).
  ...NAMESPACE_COMMANDS,

  // 5b. Package block. Upstream routes package through the same PACKAGE group
  //     as namespace, so it clusters alike. Trailing `(\s*\})?` (group 9)
  //     captures same-line 'X {}' (CommandPackageEmpty) for immediate collapse.
  //     `$tag` tokens after the name (CommandPackage's Stereotag.pattern()
  //     TAGS1/TAGS2 slots — `package p1 $txn {`, one run each side of the
  //     stereotype, mirroring CommandPackage.java:87,89) are now CAPTURING
  //     (groups 4/6, cdd-T31 round 2, E5 defect b -- were non-capturing and
  //     discarded) and read onto the Namespace via `setNamespaceTags` (its
  //     own doc comment cites `CommandPackage.java:198` + `Entity
  //     #addStereotag`). A2s F-G mechanism A8: the `<<stereotype>>` (group
  //     5, between the TAGS runs like upstream's STEREOTYPE slot) is stored
  //     on the Namespace via `setNamespaceStereotype` (gated: a
  //     USymbol-naming stereotype selects the shape instead,
  //     CommandPackage.java:178-191).
  // T3 (unknown-bucket-routing-repair): optional leading VISIBILITY char
  // (`CommandPackage.java:74`, the SAME `VisibilityModifier
  // .regexForVisibilityCharacter()` prefix `class-declaration-parser.ts`'s
  // `DECL_KIND_RE` carries). cdd6-T3d: now CAPTURED (group 1) and stored
  // (`CommandPackage.java:189-192`) -- `ClusterHeader.java:130-138` draws it
  // left of the title, so every later group index below is +1 from the
  // numbers the older notes in this comment give.
  // T11 (E4/M3): the `[[url]]` group (7) is CAPTURING and NOTE_COLOR (8,
  // the SAME bare/`back:` grammar `class-notes.ts` note commands already
  // reuse) is inserted ahead of the old trailing catch-all -- both read
  // onto the Namespace via setNamespaceUrl/setNamespaceColor below; the
  // same-line-close brace group is 9. cdd5-T4b: the trailing
  // `(?:[#<][^{]*)?` catch-all is gone -- upstream has nothing after COLOR
  // but `\s*\{` (`CommandPackage.java:92-96`), so a second `<<B>>` must
  // widen the lazy STEREOTYPE group (`StereotypePattern.java:66-67`,
  // "(\\<\\<.+?\\>\\>)") to `<<A>><<B>>`; the catch-all swallowed it
  // instead (`mupavi-50-fijo192`).
  {
    pattern: new RegExp(
      String.raw`^(?:([-#+~])\s*)?package\b\s*(?:"([^"]*)"|([^\s#<{]+))?(?:\s+as\s+([^\s{]+))?((?:\s+\$[^\s{}"'<>$]+)*)(?:\s*(<<.+?>>))?((?:\s+\$[^\s{}"'<>$]+)*)(?:\s*(\[\[[^\]]*\]\]))?\s*` +
        NOTE_COLOR +
        // T11: a `\s*` gap here is load-bearing -- without it, a trailing
        // space before `{` (e.g. `#DDD {`) makes the whole match fail at
        // NOTE_COLOR's end position, and the engine backtracks NOTE_COLOR
        // to zero-width so the catch-all below (whose `[^{]*` tolerates
        // the space) silently swallows the colour text instead, leaving
        // the capture group undefined (caught by this task's own tests).
        String.raw`\s*\{(\s*\})?\s*$`,
      'i',
    ),
    execute(state, match) {
      const name = match[2] ?? match[3];
      let effectiveId: string;
      if (name !== undefined) {
        effectiveId = openNamespaceBlock(state, match[4] ?? name, name);
      } else {
        const id = '__pkg' + String(state.ast.namespaces.length);
        effectiveId = openNamespaceBlock(state, id, '');
      }
      setNamespaceStereotype(state, effectiveId, match[6], true);
      setNamespaceTags(state, effectiveId, `${match[5] ?? ''} ${match[7] ?? ''}`);
      setNamespaceUrl(state, effectiveId, match[8]);
      setNamespaceColor(state, effectiveId, match[9]);
      // cdd6-T3d: `p.setVisibilityModifier(...)` (CommandPackage.java:189-192).
      setNamespaceVisibility(state, effectiveId, match[1]);
      if (match[10] !== undefined) {
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
      new RegExp(
        String.raw`^(rectangle|node|component|folder|frame|cloud|database|storage|artifact|file|card|queue|stack|hexagon|agent|action|process)\s+` +
          USYMBOL_CONTAINER_HEAD +
          String.raw`((?:\s+\$[^\s{}"'<>$]+)*)(?:\s*(<<.+?>>))?((?:\s+\$[^\s{}"'<>$]+)*)(?:\s*(\[\[[^\]]*\]\]))?\s*` +
          NOTE_COLOR +
          String.raw`\s*(?:[#<][^{]*)?\{\s*$`,
        'i',
      ),
    execute(state, match) {
      const usymbol = match[1]!.toLowerCase();
      const head = usymbolContainerHead(match);
      const effectiveId = openNamespaceBlock(state, head.code, head.display);
      state.descriptiveContainers.set(effectiveId, usymbol);
      // cdd2-T19b: `if (stereotype != null) p.setStereotype(Stereotype
      // .build(stereotype, false))` -- UNGATED (the SYMBOL token already
      // named the shape), so the stereotype is displayed in the cluster
      // header (`CommandPackageWithUSymbol.java:204-206`).
      setNamespaceStereotype(state, effectiveId, head.stereotype ?? match[14], false);
      // `addTags(p, arg.getLazzy("TAGS", 0))` -- upstream applies BOTH tag
      // runs to the group it just created (`CommandPackageWithUSymbol
      // .java:214`). `remove $tag` / `restore $tag` resolve against them, so
      // discarding them here would leave `component a $a {}` un-removable
      // (kokebo-27-vafi688).
      const tags = parseTagTokens(`${match[13] ?? ''} ${match[15] ?? ''}`);
      if (tags.length > 0) state.pendingContainerTags.set(effectiveId, tags);
      // cdd3-T10 (S-11): `p.addUrl(url)` (`CommandPackageWithUSymbol.java:
      // 208-213`) and `p.setColors(color().getColor(...))` with
      // `ColorType.BACK` (`:215-216`, `color()` at `:132-134`).
      setNamespaceUrl(state, effectiveId, match[16]);
      setNamespaceColor(state, effectiveId, match[17]);
    },
  },

  // 5b''. `() "name"` interface lollipop (CommandCreateElementParenthesis) — a
  //       plaintext circle node (same svek shape as a `circle` element).
  //       cdd5-T4b: groups 1/2 are the CODE3 `as` DISPLAY3 alternative
  //       (`CommandCreateElementParenthesis.java:94-104`: "CODE3" CODE,
  //       spaceOneOrMore, "as", spaceZeroOrMore, "DISPLAY3" DISPLAY) -- a
  //       bare code followed by a quoted display, which the two earlier
  //       alternatives cannot match. Tried first here: for that shape it is
  //       the only alternative upstream accepts. The display is unquoted by
  //       `eventuallyRemoveStartingAndEndingDoubleQuote` (java:197).
  {
    pattern: /^\(\)\s+(?:([\p{L}\p{N}_.]+)\s+as\s*"([^"]+)"|(?:"([^"]*)"|(\S+))(?:\s+as\s+(\S+))?)\s*$/u,
    execute(state, match) {
      if (match[1] !== undefined) {
        ensureClassifier(state, match[1], 'circle', match[2]).kind = 'circle';
        return;
      }
      const name = match[3] ?? match[4]!;
      ensureClassifier(state, match[5] ?? name, 'circle', name).kind = 'circle';
    },
  },

  // 5c. Association diamond: `<> name` (CommandDiamondAssociation) — a
  //     diamond-shaped n-ary/association-class connector node.
  {
    pattern: /^<>\s+(\S+)\s*$/,
    execute(state, match) {
      // cdd-T34 (E14, luzive-62-zote562): `CommandDiamondAssociation
      // .executeArg` (`classdiagram/command/CommandDiamondAssociation.java:
      // 73-84`) refuses UNCONDITIONALLY whenever `quark.getData() != null`
      // -- i.e. whenever ANY entity already exists at this id, whatever its
      // origin (an explicit `class X {}` declaration, OR an earlier
      // relationship endpoint that auto-vivified a placeholder) -- "Unlike
      // most creation commands, executeArg fails if the name already
      // exists" (that method's own `explainArg` comment). `ensureClassifier`
      // passes `kind: 'association'` as the CREATE-time default, so a
      // freshly-minted classifier already has `.kind === 'association'`
      // the instant it's created -- nothing else in this port ever creates
      // one with that kind, so `classifier.kind !== 'association'` here is
      // exactly upstream's `quark.getData() != null`: this id already
      // named something before this line ran.
      const classifier = ensureClassifier(state, match[1]!, 'association');
      if (classifier.kind !== 'association') {
        (state.ast.errors ??= []).push(`Already existing : ${classifier.id}`);
        state.ast.errorLine = state.currentLine;
        return;
      }
      classifier.kind = 'association';
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
  // T10: position is now group 1 (optional, default BOTTOM); cdd2-T19c:
  // group 2's NOTE_COLOR is now wired through to `applyNoteOnLink`, which
  // parses it via `parseNoteOnLinkColors`; text is group 3.
  {
    pattern: NOTE_ON_LINK_RE,
    execute: (state, match) => applyNoteOnLink(state.ast, resolveLinkNotePosition(match[1]), match[3]!, match[2]),
  },

  // 5e-multi. `note [pos] on|of link [#color]` (no colon) — opens a
  // multi-line note-on-link block closed by `end note`. See
  // NOTE_ON_LINK_MULTI_RE's doc (class-notes.ts). cdd2-T19c: group 2's
  // NOTE_COLOR is now carried on the pending note, applied at `end note`
  // (`finalizePendingNote`'s `'link'` branch, class-notes.ts).
  {
    pattern: NOTE_ON_LINK_MULTI_RE,
    execute: (state, match) => {
      state.pendingNote = {
        kind: 'link',
        position: resolveLinkNotePosition(match[1]),
        textLines: [],
        ...(match[2] !== undefined ? { color: match[2] } : {}),
      };
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
