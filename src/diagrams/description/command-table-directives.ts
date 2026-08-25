/**
 * Directive-style commands for the descriptive diagram dispatch table
 * (rules 1-4 of the original command-table.ts COMMANDS array): comment
 * lines, `newpage`, direction directives, `skinparam linetype`, `set
 * separator`, `!pragma kermor`, `scale`, `hide`/`show` (portion and entity
 * forms plus the blanket ignore), `remove`/`restore`, `together { }`, and
 * the closing-brace pop. Split out of command-table.ts to stay under the
 * line cap; order preserved (spread first in COMMANDS).
 */

import type { Command } from './command-table-types.js';
import type { DescriptiveNode } from './ast.js';
import { startNewPage } from './parse-state.js';
import { removeMatching, removeMatchingLinks } from './element-grammar.js';
import { matchScaleCommand } from '../../core/scale-command.js';
import { cleanId } from './parse-helpers.js';

// ---------------------------------------------------------------------------
// Module-level regex constants
// Lizard 1.23.0 miscounts brace depth for $ inside /regex/ in function bodies.
// ---------------------------------------------------------------------------

const RE_SKINPARAM_LINETYPE = new RegExp('^skinparam\\s+linetype\\s+(ortho|polyline)\\b', 'i');
/** `left to right direction` — CommandRankDir.java sets skinparam Rankdir=LR. */
const RE_LEFT_TO_RIGHT_DIRECTION = /^left\s+to\s+right\s+direction\b/i;
/** `top to bottom direction` — explicit no-op; TB is already the default. */
const RE_TOP_TO_BOTTOM_DIRECTION = /^top\s+to\s+bottom\s+direction\b/i;
/** `set separator <sep>` / `set namespaceseparator <sep>`
 *  (CommandNamespaceSeparator.java:58-69) — SEPARATOR is `(?:none|null)` or
 *  any non-space run (CommandLinkClass.getSeparator()). */
const RE_SET_SEPARATOR = /^set\s+(?:separator|namespaceseparator)\s+(\S+)\s*$/i;

/** `hide|show [<<label>>] [empty] PORTION` (classdiagram/command/
 *  CommandHideShowByGender.java) -- scoped to what description diagrams
 *  observably render: the STEREOTYPE portion only (see ledger.md
 *  I-hideshow for the FIELD/METHOD/MEMBER/CIRCLED_CHARACTER portions this
 *  port has no rendering target for at all -- `hide empty attributes`,
 *  zanibo-14-sami874, matches here but resolves to a documented no-op in
 *  the rule below). `<<label>>` may contain spaces (`<<shared lib>>`);
 *  "empty" is matched but changes NOTHING for description diagrams --
 *  `CommandHideShowByGender#executeDescriptionDiagram` never reads the
 *  EMPTY capture group at all (java:169-213), a faithfully-preserved
 *  upstream quirk, not a gap in this port. Must be tried BEFORE
 *  RE_HIDE_SHOW_ENTITY below -- upstream registers CommandHideShowByGender
 *  before CommandHideShow2 (CommonCommands.addCommonHides runs inside
 *  addCommonCommands1, BEFORE DescriptionDiagramFactory's own
 *  `cmds.add(new CommandHideShow2())`), so a line ending in a PORTION
 *  keyword is claimed by this rule first. */
const RE_HIDE_SHOW_PORTION =
  /^(hide|show)\s+(?:<<\s*([^>]+?)\s*>>\s+)?(?:empty\s+)?(members?|attributes?|fields?|methods?|circles?|circled?|stereotypes?)\s*$/i;

/** `hide|show WHAT` entity-visibility form (classdiagram/command/
 *  CommandHideShow2.java) -- `*` (whole diagram), `$tag`
 *  (isApplyableTag), bare id (isApplyable's fullName match), or
 *  `<<label>>` (isApplyableStereotype -- ENTITY-level: hides the WHOLE
 *  entity, distinct from the PORTION form above, which hides only its
 *  guillemet TEXT). See RE_HIDE_SHOW_PORTION's doc comment for why this
 *  must be tried second. */
const RE_HIDE_SHOW_ENTITY = /^(hide|show)\s+(<<[^>]+>>|\S+)\s*$/i;

/** `url [of|for] CODE [is] [[url]]` (classdiagram/command/CommandUrl.java,
 *  registered on DescriptionDiagramFactory verbatim, `:87` — the SAME
 *  `Command` class the class engine ports in `class-url-command.ts`).
 *  CODE is a bare `[%pLN_.]+` token or a quoted string; `of`/`for` and `is`
 *  are both optional keywords; the bracket allows a single embedded `]`
 *  (not `]]`), mirroring `UrlBuilder.MANDATORY`'s own token shape (see
 *  `parse-helpers-strings.ts`'s `RE_INLINE_URL_TOKEN`).
 *  @see ~/git/plantuml/.../classdiagram/command/CommandUrl.java:62-75 */
const RE_URL_STATEMENT = new RegExp(
  '^url\\s*(?:of|for)?\\s+([\\p{L}\\p{N}_.]+|"[^"]+")\\s+(?:is\\s*)?' +
    '(\\[\\[[^\\]]*(?:\\][^\\]]+)*\\]\\])\\s*$',
  'iu',
);

/**
 * Order matters: patterns are tested top-to-bottom; first match wins.
 */
export const DIRECTIVE_COMMANDS: readonly Command[] = [
  // 1. Comment lines
  {
    pattern: /^'/,
    execute() { /* ignore */ },
  },

  // 1b. `newpage` (CommandNewpage) — finalize the current page, start a
  //     fresh one. See startNewPage's doc comment.
  {
    pattern: /^newpage\s*$/i,
    execute(state) { startNewPage(state); },
  },

  // 2. Direction directives — must precede the general ignore rule (3) since
  //    both patterns would otherwise match. left-to-right sets skinparam
  //    Rankdir=LR (CommandRankDir.java); top-to-bottom is an explicit no-op
  //    because top-to-bottom is already our unset default.
  {
    pattern: RE_LEFT_TO_RIGHT_DIRECTION,
    execute(state) { state.ast.rankdir = 'LR'; },
  },
  {
    pattern: RE_TOP_TO_BOTTOM_DIRECTION,
    execute() { /* explicit TB is the default; no-op */ },
  },

  // 2b. skinparam linetype ortho|polyline — svek routes edge labels through
  //     xlabel under ortho (SvekEdge.java:434-441). Must precede rule 3.
  {
    pattern: RE_SKINPARAM_LINETYPE,
    execute(state, match) {
      state.ast.linetype = match[1]!.toLowerCase() as 'ortho' | 'polyline';
    },
  },

  // 2c. `set separator <sep>` / `set namespaceseparator <sep>`
  //     (CommandNamespaceSeparator.java) — mirrored onto `state.ast` (not
  //     just `state`) so `layoutDescription` can read it; see
  //     `ast.ts#DescriptionDiagramAST.namespaceSeparator`'s doc for why the
  //     default is `null`, not ".". Must precede rule 3 (the general
  //     `skinparam|hide|show` ignore) — the `set` verb overlaps no other
  //     rule, but is placed with its sibling directives for readability.
  {
    pattern: RE_SET_SEPARATOR,
    execute(state, match) {
      const value = match[1]!;
      const sep = /^(?:none|null)$/i.test(value) ? null : value;
      state.namespaceSeparator = sep;
      state.ast.namespaceSeparator = sep;
    },
  },

  // 2e. `!pragma kermor on` (skin/PragmaKey.java:55) -- svek's alternate
  //     cluster/note DOT-emission path (ClusterDotStringKermor.java,
  //     Cluster.java:595-609). See ast.ts's `kermor` field doc + the
  //     description-dot-100 decision journal (I2) for the full mechanism.
  //     Must precede rule 3 (the general skinparam|hide|show ignore) -- the
  //     `!pragma` verb overlaps no other rule, but is placed with its
  //     sibling directives for readability.
  {
    pattern: /^!pragma\s+kermor\s+on\s*$/i,
    execute(state) {
      state.ast.kermor = true;
    },
  },

  // 2e2. `!pragma NAME [VALUE]` — CommandPragma, registered on EVERY factory
  //      via CommonCommands.addCommonCommands1 (DescriptionDiagramFactory
  //      .java:87). T13 (dispatch-by-parse-attempt): `!pragma svek_trace on`
  //      / `!pragma horizontalLineBetweenDifferentPackageAllowed` /
  //      `!pragma graphattributes ...` / `!pragma aspect 2,5` / `!pragma
  //      layout elk` are all real, universally-registered Commands upstream
  //      accepts -- newly refused once unrecognised lines stopped being
  //      silently dropped. No-op body, same precedent as state/
  //      state-commands.ts rule 3a: `!pragma`'s only non-storage side
  //      effects (svgsize, `layout smetana/elk/vizjs` selection) have no
  //      representation in `DescriptionDiagramAST` -- this port has one
  //      layout engine (dot-engine, CLAUDE.md ruling 2026-08-09). Must
  //      follow rule 2e (kermor) -- `!pragma kermor on` is more specific
  //      and sets a real AST field; this general rule is the fallback for
  //      every OTHER pragma name.
  // @see ~/git/plantuml/.../command/CommandPragma.java:60-69
  // @see ~/git/plantuml/.../command/CommonCommands.java:63
  {
    pattern: /^!pragma\s+[A-Za-z_][A-Za-z_0-9]*(?:\s+.*)?$/,
    execute() { /* ignored -- see rule 2e2's doc comment */ },
  },

  // 2f. `scale ...` directive (net/sourceforge/plantuml/command/
  //     CommandScale*.java, 6 forms -- see scale-command.ts's module doc
  //     for the full mechanism and jar Java citations). A loose trigger
  //     regex gates entry into this slot; the real 6-way grammar lives in
  //     the shared `matchScaleCommand` (`match.input` is always the exact
  //     `line` this table was dispatched against -- RegExpExecArray's own
  //     `.input` field, never re-derived). An unrecognized/rejected scale
  //     line (e.g. `scale 0`) leaves `state.ast.scale` unset, the same
  //     no-op disposition rule 3b's `remove`/`restore` already established
  //     for an input its own upstream command would itself reject.
  {
    pattern: /^scale\s/i,
    execute(state, match) {
      const spec = matchScaleCommand(match.input);
      if (spec !== undefined) state.ast.scale = spec;
    },
  },

  // 2g. `hide|show [<<label>>] stereotype` (mission G1 I-hideshow) --
  //     PORTION === STEREOTYPE only; every other PORTION keyword
  //     (members/attributes/fields/methods/circles/circled) matches here
  //     too but is a documented no-op (ledger.md I-hideshow) -- this port
  //     has no field/member/circled-character rendering subsystem for
  //     description diagrams at all, so filtering that portion can never
  //     be observed regardless of whether it is "implemented". Must
  //     precede rule 2h (RE_HIDE_SHOW_ENTITY's doc comment explains why).
  {
    pattern: RE_HIDE_SHOW_PORTION,
    execute(state, match) {
      const portion = match[3]!.toLowerCase();
      if (!portion.startsWith('ste')) return;
      const show = match[1]!.toLowerCase() === 'show';
      const pattern = match[2]?.trim();
      state.ast.stereotypeVisibilityRules ??= [];
      const rule: { pattern?: string; show: boolean } = { show };
      if (pattern !== undefined) rule.pattern = pattern;
      state.ast.stereotypeVisibilityRules.push(rule);
    },
  },

  // 2h. `hide|show <id|$tag|*|<<stereotype>>>` (mission G1 I-hideshow) --
  //     whole-entity draw-time visibility (CommandHideShow2.java). A LAZY
  //     rule list (element-grammar.ts#effectiveHiddenIds's own doc
  //     comment explains why, unlike remove/restore's parse-time-
  //     incremental marker below).
  {
    pattern: RE_HIDE_SHOW_ENTITY,
    execute(state, match) {
      const show = match[1]!.toLowerCase() === 'show';
      const what = match[2]!.trim();
      state.ast.hideShowRules ??= [];
      state.ast.hideShowRules.push({ what, show });
    },
  },

  // 2i. `url [of|for] CODE [is] [[url]]` — CommandUrl.java, the standalone
  //     statement that attaches a url to an already-declared entity. T13
  //     (dispatch-by-parse-attempt): `url of APP is [[...]]` / `url for Foo
  //     is [[...]]` are real, registered Commands upstream accepts, newly
  //     refused once unrecognised lines stopped being silently dropped.
  //     `entity.addUrl(url)` (java:100) has no observable effect in this
  //     port -- this engine already discards every INLINE `[[url]]` token
  //     on a declaration line unread (`parse-helpers-strings.ts`'s
  //     `stripUrl`/`stripTrailingUrl`), an established scope boundary this
  //     rule follows rather than introduces. `quark.getData() == null`
  //     (java:93-94) DOES have an observable effect -- an execution error
  //     (D1) -- so an unresolved target still refuses, matching the port's
  //     other execution-error precedent (parser.ts's port/portin/portout
  //     case, `CommandCreateElementFull.java:316-317`).
  // @see ~/git/plantuml/.../classdiagram/command/CommandUrl.java:62-101
  {
    pattern: RE_URL_STATEMENT,
    execute(state, match) {
      const rawCode = match[1]!;
      const id = cleanId(rawCode.startsWith('"') ? rawCode.slice(1, -1) : rawCode);
      if (!state.nodesById.has(id)) {
        state.executionError = `${id} does not exist`;
      }
    },
  },

  // 3. Ignored directive: skinparam. `title` used to be ignored here too;
  //    it is now consumed by the shared annotation matcher at the
  //    top-level dispatch point in parser.ts#processLine, BEFORE this
  //    table is ever tried (mission G0b/T6, decisions.md D3). `hide`/
  //    `show` were ALSO folded into this blanket ignore until mission G1
  //    I-hideshow (rules 2g/2h above) split out the corpus-exercised
  //    forms -- this now only catches skinparam plus any hide/show shape
  //    neither rule above claims (`@unlinked`, the `-class` command
  //    variants, a type-keyword GENDER on the portion form -- zero corpus
  //    reach for `hide`/`show`, see ledger.md I-hideshow).
  {
    pattern: /^(?:skinparam|hide|show)\b/i,
    execute() { /* ignore */ },
  },

  // 3b. `remove|restore <id|$tag|*>` — CommandRemoveRestore.java. A LAZY
  //     marker (upstream isRemoved evaluates at print time): the note
  //     cascade + filtering happen in layout via effectiveRemovedIds.
  {
    pattern: /^(remove|restore)\s+(\S+)\s*$/i,
    execute(state, match) {
      const isRemove = match[1]!.toLowerCase() === 'remove';
      if (match[2]!.toLowerCase() === '@unlinked') {
        if (isRemove) state.ast.removeUnlinked = true;
        else delete state.ast.removeUnlinked;
        return;
      }
      removeMatching(match[2]!, state.nodesById, isRemove);
      // Link.isRemoved (net/sourceforge/plantuml/abel/Link.java:492-498):
      // the SAME <<stereotype>> pattern independently removes LINKS
      // carrying that stereotype, regardless of node.removed above -- a
      // no-op for id/$tag/* forms (removeMatchingLinks only matches
      // `<<...>>`-shaped `what`, mirroring HideOrShow.isApplyable
      // (Stereotype) never matching a non-stereotype `what`).
      removeMatchingLinks(match[2]!, state.ast.links, isRemove);
    },
  },

  // 3c. `together {` — groups elements for layout proximity WITHOUT a
  //     visible container (CommandTogether.java; svek emits a clusterNtK
  //     wrapper whose members belong to the enclosing cluster). Transparent
  //     frame: children fall through to the enclosing container's array and
  //     the closing `}` pops it like any block (previously the stray `}`
  //     popped a REAL container, orphaning later siblings).
  {
    pattern: /^together\s*\{\s*$/i,
    execute(state) {
      const top = state.containerStack[state.containerStack.length - 1];
      const passthrough: DescriptiveNode = {
        id: `__together_${state.containerStack.length}_${state.ast.nodes.length}`,
        display: '',
        symbol: 'rectangle',
        children: top !== undefined ? top.children : state.ast.nodes,
      };
      state.containerStack.push(passthrough);
    },
  },

  // 4. Closing brace — pops the current container
  {
    pattern: /^\}\s*$/,
    execute(state) { state.containerStack.pop(); },
  },
];
