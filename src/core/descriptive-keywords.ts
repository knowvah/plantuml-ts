/**
 * Shared descriptive-keyword table — single source of truth for the descriptive
 * diagram engine (component / use-case / deployment).
 *
 * Mirrors upstream PlantUML's `CommandCreateElementFull.ALL_TYPES`
 * (`net.sourceforge.plantuml.descdiagram.command`), which keys every descriptive
 * element off one keyword set, each carrying a `USymbol` shape. Consumed by the
 * Phase-1 dispatch guard (`class`/`sequence` `accepts()`) and the Phase-2
 * description engine (AST, parser, layout, renderer).
 *
 * See plans/consolidate-description-engine/decisions.md — D2 (full `ALL_TYPES`),
 * D3 (descriptive-signal guard, exclusions `interface`/`package`/`actor`).
 */

import {
  isSpriteMultilineOpenLine,
  isSpriteMultilineCloseLine,
  isSvgSpriteOpenLine,
  isSvgSpriteCloseLine,
} from './sprite-commands.js';

/**
 * Every shape in upstream `ALL_TYPES`, plus `note` — a leaf entity created by
 * `CommandFactoryNote`/`CommandFactoryNoteOnEntity`/`CommandFactoryNoteOnLink`
 * (`net.sourceforge.plantuml.command.note`), never dispatched through the
 * `ALL_TYPES` keyword table (notes have their own `note ...` grammar).
 * Business variants of `actor`/`usecase` (upstream `actor/` / `usecase/`) map
 * to the `-business` symbols. The `port` symbol covers the `port` / `portin` /
 * `portout` keywords.
 */
export type USymbol =
  | 'component'
  | 'interface'
  | 'node'
  | 'package'
  | 'folder'
  | 'frame'
  | 'cloud'
  | 'database'
  | 'storage'
  | 'actor'
  | 'actor-business'
  | 'usecase'
  | 'usecase-business'
  | 'rectangle'
  | 'artifact'
  | 'card'
  | 'file'
  | 'queue'
  | 'stack'
  | 'agent'
  | 'boundary'
  | 'control'
  | 'entity'
  | 'person'
  | 'hexagon'
  | 'label'
  | 'circle'
  | 'collections'
  | 'port'
  | 'action'
  | 'process'
  | 'note';

/**
 * Keyword → `USymbol`, in upstream `ALL_TYPES` declaration order. Business
 * variants (`actor/`, `usecase/`) precede their plain forms, mirroring upstream
 * so the longer token is preferred during alternation. The single source the
 * other exports are derived from — never hand-duplicate this list.
 */
const KEYWORD_SYMBOL_ENTRIES: readonly (readonly [string, USymbol])[] = [
  ['person', 'person'],
  ['artifact', 'artifact'],
  ['actor/', 'actor-business'],
  ['actor', 'actor'],
  ['folder', 'folder'],
  ['card', 'card'],
  ['file', 'file'],
  ['package', 'package'],
  ['rectangle', 'rectangle'],
  ['hexagon', 'hexagon'],
  ['label', 'label'],
  ['node', 'node'],
  ['frame', 'frame'],
  ['cloud', 'cloud'],
  ['action', 'action'],
  ['process', 'process'],
  ['database', 'database'],
  ['queue', 'queue'],
  ['stack', 'stack'],
  ['storage', 'storage'],
  ['agent', 'agent'],
  // `archimate` is NOT part of upstream `CommandCreateElementFull.ALL_TYPES`
  // -- it is its own dedicated command (`descdiagram/command/
  // CommandArchimate.java`, mandatory `#color` token then CODE/DISPLAY,
  // `as <alias>` supported) registered separately in the diagram factory.
  // T8 (description-leaf-sizing-audit) wires only its single-line leaf
  // form here; `CommandArchimateMultilines` (`[ … ]` body) and
  // `CommandArchimatePackage` (`{ … }` group) are filed, not implemented
  // (plans/s1l-leaf-sizing/ledger.md).
  //
  // Mapped to the EXISTING 'rectangle' USymbol, not a new 'archimate' tag:
  // upstream's `USymbols.ARCHIMATE = new USymbolRectangle(SName.archimate)`
  // is the SAME `USymbolRectangle` class `USymbols.RECTANGLE` uses, just
  // parameterized with a different `SName` -- and `SName` is read ONLY by
  // `getSNames()` (CSS/stereotype class naming during `drawU`), never by
  // `asSmall`/`asBig`'s `calculateDimension` (verified: `USymbolRectangle
  // .ts` never reads `this.sname` in either). Sizing is therefore
  // byte-identical to plain `rectangle`. Reaching the TRUE `USymbols
  // .ARCHIMATE` singleton (for its distinct CSS class) would require a new
  // `fromStringWithSkinParam` branch in `core/svek/image/
  // EntityImageDescriptionSupport.ts` -- out of this task's write-set;
  // filed in the ledger as a rendering-fidelity follow-up, not a sizing gap.
  ['archimate', 'rectangle'],
  ['usecase/', 'usecase-business'],
  ['usecase', 'usecase'],
  ['component', 'component'],
  ['boundary', 'boundary'],
  ['control', 'control'],
  ['entity', 'entity'],
  ['interface', 'interface'],
  ['circle', 'circle'],
  ['collections', 'collections'],
  ['port', 'port'],
  ['portin', 'port'],
  ['portout', 'port'],
];

/** The descriptive keyword list (lowercase), in upstream declaration order. */
export const ALL_TYPES: readonly string[] =
  KEYWORD_SYMBOL_ENTRIES.map(([keyword]) => keyword);

/** Keyword → `USymbol` shape lookup. */
export const KEYWORD_TO_SYMBOL: ReadonlyMap<string, USymbol> = new Map(
  KEYWORD_SYMBOL_ENTRIES,
);

/**
 * `ALL_TYPES` keywords sequence's own `CommandParticipant` TYPE alternation
 * also claims (`CommandParticipant.java:79-83` vs. `CommandCreateElementFull
 * .java:84-100`, mirrored by `SEQUENCE_PATTERNS[1]`, `sequence/index.ts`): no
 * per-line grammar tells a `queue bar as q` participant from a `queue bar as
 * q` element apart, so upstream resolves it purely by factory order
 * (`SequenceDiagramFactory` before `DescriptionDiagramFactory`,
 * `PSystemBuilder.java:135,138`; D1). Excluded (T4) from BOTH the decline
 * signal below and description's own accept signal
 * ({@link DESCRIPTION_ACCEPTS_KEYWORDS}): a bare declaration of one of these
 * six decides nothing alone — any OTHER unambiguous marker in the block
 * still wins, and a block whose only signal is these six falls to sequence.
 */
const SEQUENCE_TYPE_OVERLAP: ReadonlySet<string> = new Set([
  'boundary', 'control', 'entity', 'database', 'collections', 'queue',
]);

/** D3 exclusions, plus {@link SEQUENCE_TYPE_OVERLAP} (T4, same reason). */
const SIGNAL_EXCLUSIONS: ReadonlySet<string> = new Set([
  'interface',
  'package',
  'actor',
  ...SEQUENCE_TYPE_OVERLAP,
]);

/** `ALL_TYPES` minus `SIGNAL_EXCLUSIONS` (D3 + T4). */
export const DESCRIPTIVE_ONLY_KEYWORDS: ReadonlySet<string> =
  new Set(ALL_TYPES.filter((keyword) => !SIGNAL_EXCLUSIONS.has(keyword)));

/** Number of leading lines scanned, matching the existing `accepts()` slice. */
const SCAN_LINE_LIMIT = 20;

function escapeRegExp(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a case-insensitive regex matching a trimmed line that starts with any
 * of `keywords` followed by whitespace or end-of-line. Longest keywords first
 * so `actor/` wins over `actor` and `portin` over `port`. The whitespace must
 * not be immediately followed by `-`/`<` (T4): no `CommandCreateElementFull`
 * CODE_CORE alternative (`CommandCreateElementFull.java:126`) starts with
 * either, so a keyword-named identifier starting an arrow line (`Node ->
 * SUT`, participant literally named `Node`) can't be a real declaration.
 */
function buildKeywordPattern(keywords: readonly string[]): RegExp {
  return new RegExp(
    '^(?:' +
      [...keywords]
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExp)
        .join('|') +
      ')(?=$|\\s(?!\\s*[-<]))',
    'i',
  );
}

/** Descriptive-only keywords (D3 subset) — for the class/sequence guard. */
const DESCRIPTIVE_KEYWORD_PATTERN = buildKeywordPattern([
  ...DESCRIPTIVE_ONLY_KEYWORDS,
]);

/**
 * Keywords the description plugin claims via `accepts()`: `ALL_TYPES` minus bare
 * `actor` and `interface`. Those two route elsewhere even though the engine can
 * render them — a bare `actor` + messages is a sequence diagram, and a pure
 * `interface` block is a class diagram (both registered ahead of description).
 * `package` IS kept (unlike the D3 guard set) so empty component packages route
 * here; the business forms `actor/`/`usecase/` are kept (unambiguous), and the
 * `:User:` colon actor is handled by ACTOR_COLON_SHORTHAND below.
 *
 * {@link SEQUENCE_TYPE_OVERLAP} (T4) is ALSO excluded, unlike `package` — see
 * that constant's comment for the mechanism.
 */
const DESCRIPTION_ACCEPTS_KEYWORDS = ALL_TYPES.filter(
  (keyword) =>
    keyword !== 'actor' &&
    keyword !== 'interface' &&
    !SEQUENCE_TYPE_OVERLAP.has(keyword),
);
const DESCRIPTIVE_ELEMENT_PATTERN = buildKeywordPattern(
  DESCRIPTION_ACCEPTS_KEYWORDS,
);

/**
 * Element shorthands that are themselves descriptive signals, mirroring the
 * existing component/usecase `accepts()` patterns: `[Comp]` (component),
 * `(Use Case)` / `()` (use-case / interface). The bracket form excludes
 * nested brackets (T4), matching upstream's own grammar
 * (`CommandCreateElementFull.java:126`'s CODE_CORE: `\[[^\[\]]+\]`, not
 * `\[.+\]`) — un-anchored/greedy also matched a `[[url]]` hyperlink and
 * sequence's own `[<[#color]-Node` found-message bracket-arrow syntax.
 */
const ELEMENT_SHORTHAND_PATTERNS: readonly RegExp[] = [
  /^\[[^[\]]+\]/, // [Component] bracket notation, no nested brackets
  /^\(.+\)/, //       (Use Case) parens notation
  /^\(\)/, //         () interface shorthand
];

/**
 * Upstream classdiagram `CommandLinkClass`'s `COUPLE` grammar (NOT
 * descdiagram): `\([%s]*(SINGLE2)[%s]*,[%s]*(SINGLE2)[%s]*\)` — a
 * parenthesized pair of comma-separated identifiers, used only as a
 * relationship endpoint that references an existing association
 * (association-class shorthand, e.g. `(A,B) .. R1`), and — per that same
 * grammar — always immediately followed by the arrow-decor alternation
 * (`ARROW_HEAD1`/`ARROW_BODY1`, `[-=.]+` at minimum) on the same line.
 * Descdiagram's own parens grammar (`CommandCreateElementFull.CODE_CORE`,
 * `\([^()]+\)/?`) is a single opaque phrase with no comma requirement and is
 * never followed by an arrow on the same line. The two grammars are
 * therefore distinguishable by "does a comma-separated pair in parens
 * immediately precede an arrow", which is what this pattern reproduces
 * (decision-journal.md T1 cat. 2 / T5b).
 */
const ASSOCIATION_CLASS_COUPLE = /^\([^(),]+,[^(),]+\)\s*[-.=<>|*o]/;

/**
 * True when `trimmed` matches one of {@link ELEMENT_SHORTHAND_PATTERNS},
 * EXCLUDING the classdiagram association-class couple
 * ({@link ASSOCIATION_CLASS_COUPLE}). A bare `(Use Case)` or `()` always
 * counts as a shorthand; only the comma-pair-plus-arrow association-class
 * form is carved out, so it is not mistaken for the descdiagram
 * use-case/interface shorthand and misrouted away from the class engine.
 */
function matchesElementShorthand(trimmed: string): boolean {
  return (
    ELEMENT_SHORTHAND_PATTERNS.some((pattern) => pattern.test(trimmed)) &&
    !ASSOCIATION_CLASS_COUPLE.test(trimmed)
  );
}

/**
 * `legend` … `endlegend` / `end legend` region markers — upstream registers
 * both the single-line (`CommandLegend`) and multi-line block
 * (`CommandMultilinesLegend`) legend commands as `CommonCommand`s, available
 * to every diagram type (`command/CommonCommands.java:115-116`,
 * `command/UBrexCommonCommands.java:102-103`). A legend's body is
 * `DisplayPositioned` text — display-only, never diagram content — so it
 * must never be read as a descriptive-element declaration during dispatch
 * probing (a salt-widget or shorthand token inside a legend would otherwise
 * misroute the whole block).
 *
 * Block-opener grammar mirrors `CommandMultilinesLegend.getRegexConcat`:
 * `legend` optionally followed by one VALIGN token (`top`|`bottom`) and
 * independently one ALIGN token (`left`|`right`|`center`), end-anchored — a
 * bare `legend`, `legend top`, `legend left`, or `legend top left` all open
 * the block. Trailing content beyond those tokens (`legend: "text"`, `legend
 * some text`) is the *single-line* `CommandLegend` form instead, so the
 * opener is end-anchored to exclude it; that text is left for the
 * descriptive scan (unclaimed by any fixture, inert either way).
 *
 * Closer grammar mirrors `CommandMultilinesLegend.END`:
 * `^end[%s]?legend$` — `endlegend` (no space) or `end legend` (exactly one
 * whitespace char), case-insensitive.
 *
 * @see ~/git/plantuml/.../command/CommandMultilinesLegend.java:65-77 (opener),
 *   :57 (END pattern)
 * @see ~/git/plantuml/.../command/CommandLegend.java:59-68 (single-line form)
 */
const LEGEND_OPEN_RE =
  /^legend(?:\s+(?:top|bottom))?(?:\s+(?:left|right|center))?\s*$/i;
const LEGEND_CLOSE_RE = /^end\s?legend$/i;

/** True when `trimmed` opens a `legend` … `endlegend` block. */
export function isLegendOpenLine(trimmed: string): boolean {
  return LEGEND_OPEN_RE.test(trimmed);
}
/** True when `trimmed` closes a `legend` … `endlegend` block. */
export function isLegendCloseLine(trimmed: string): boolean {
  return LEGEND_CLOSE_RE.test(trimmed);
}

/**
 * Remove `legend` … `endlegend`/`end legend` block regions (opener, body, and
 * closer lines) from `lines`. Applied before any descriptive-signal or
 * descriptive-element scan so legend body content — which may contain salt
 * widgets, shorthand tokens, or any other display text — is never mistaken
 * for a diagram-content declaration. See {@link isLegendOpenLine} for the
 * grammar this mirrors.
 */
export function stripLegendRegions(lines: readonly string[]): string[] {
  const out: string[] = [];
  let inLegend = false;
  for (const line of lines) {
    const t = line.trim();
    if (inLegend) {
      if (isLegendCloseLine(t)) inLegend = false;
      continue;
    }
    if (isLegendOpenLine(t)) {
      inLegend = true;
      continue;
    }
    out.push(line);
  }
  return out;
}

/**
 * Remove `sprite $name [WxH/N] { ... }` multiline block regions (opener,
 * body, and closer lines) from `lines` — a sibling of {@link
 * stripLegendRegions} for the same reason: a vendored stdlib sprite commonly
 * runs 30-50 body lines, which pushed the REAL diagram content (`title`,
 * `rectangle`, …) past {@link SCAN_LINE_LIMIT} and made
 * `hasDescriptiveSignal`/`hasDescriptiveElement` blind to it — `class`'s
 * decline guard then failed to decline and mis-claimed the block
 * (vivido-49-nisu863). Single-line `sprite $name [WxH/N] DATA` forms need no
 * stripping and are left untouched, matching {@link
 * isSpriteMultilineOpenLine}'s multiline-only grammar.
 */
export function stripSpriteRegions(lines: readonly string[]): string[] {
  const out: string[] = [];
  let inSprite = false;
  let inSvgSprite = false;
  for (const line of lines) {
    const t = line.trim();
    if (inSprite) {
      if (isSpriteMultilineCloseLine(t)) inSprite = false;
      continue;
    }
    // S1L-f part 2b: the `sprite name <svg …>` form needs the same treatment
    // — the bootstrap bundle is ~7200 lines of them, which buries the real
    // diagram content far past SCAN_LINE_LIMIT.
    if (inSvgSprite) {
      if (isSvgSpriteCloseLine(t)) inSvgSprite = false;
      continue;
    }
    if (isSvgSpriteOpenLine(t)) {
      inSvgSprite = true;
      continue;
    }
    if (isSpriteMultilineOpenLine(t)) {
      inSprite = true;
      continue;
    }
    out.push(line);
  }
  return out;
}

/** Shared pre-scan filter: strip legend/sprite regions AND blank lines
 *  before the keyword-scan window. Blanks are dropped in the SCAN only
 *  (they stay in the real line stream — A2s preprocessor change): bootstrap
 *  has one blank per ~1600 sprite defs, which would push real content past
 *  SCAN_LINE_LIMIT exactly as un-stripped sprite bodies did (vivido-49). */
function stripNonContentRegions(lines: readonly string[]): string[] {
  return stripSpriteRegions(stripLegendRegions(lines)).filter((l) => l.trim() !== '');
}

/**
 * The use-case actor colon shorthand `:Name:` / `:Name:/` (business). Owned only
 * by the description plugin's `accepts()` (not the class/sequence guard). The
 * closing colon distinguishes it from activity's `:action;` and `:opener` forms
 * (activity explicitly excludes `:actor:`), so this is order-independent and
 * reproduces the *effective* old usecase `/^:\w/` claim.
 */
const ACTOR_COLON_SHORTHAND = /^:[^:;]+:/;

/**
 * A bare-id declaration whose DISPLAY (not CODE) carries the decoration —
 * upstream's "CODE3 STEREOTYPE3? as DISPLAY3" alternative
 * (CommandCreateElementFull.getRegexConcat:95-100), e.g. `Admin as :Main
 * Admin:` or `Use as (Use the application)`. Neither `ACTOR_COLON_SHORTHAND`
 * nor `ELEMENT_SHORTHAND_PATTERNS` catch this: the line doesn't *start* with
 * the decoration, it ends with it, after a bare id and `as`. Description-only
 * dispatch signal, mirroring `ACTOR_COLON_SHORTHAND` above.
 */
const ALIAS_DECORATED_DISPLAY = /\bas\s+(?::[^:;]+:\/?|\([^)]+\)\/?)\s*$/i;

/**
 * A standalone `"Quoted Display" as code` / `code as "Quoted Display"` line
 * with NO leading type keyword. Upstream `CommandCreateElementFull`'s
 * `SYMBOL` group is OPTIONAL (`(?:(ALL_TYPES|\(\))[%s]+)?`,
 * `descdiagram/command/CommandCreateElementFull.java:84`), so a bare
 * DISPLAY2/CODE2 (or CODE4/DISPLAY4) alias line is a fully valid descdiagram
 * declaration even with zero keyword — it defaults to `LeafType.DESCRIPTION`
 * / `diagram.getSkinParam().actorStyle().toUSymbol()`
 * (CommandCreateElementFull.java:273-275). Neither sequence's `CommandArrow`/
 * `CommandParticipant*` nor class's declaration commands have an equivalent
 * keyword-less alias form, so a bare alias line alone is what makes
 * upstream's SequenceDiagramFactory fail and fall through to
 * DescriptionDiagramFactory (xacaxe-43-bupe002: `"Website/Webview" as
 * Website` is the sole non-arrow line in an otherwise all-bare-arrow source,
 * so it alone decides the factory). Description-only dispatch signal, like
 * {@link ALIAS_DECORATED_DISPLAY} above.
 */
const BARE_ALIAS_DECL_RE = /^(?:"[^"]+"\s+as\s+\S+|\S+\s+as\s+"[^"]+")$/;

/**
 * A standalone bare quoted declaration with NO "as" clause and NO leading
 * keyword: CommandCreateElementFull's CODE1 branch (CODE_WITH_QUOTE, java:88)
 * with SYMBOL omitted (java:84) and no alias -- symbol stays null, defaulting
 * to LeafType.DESCRIPTION / actorStyle().toUSymbol() (java:273-275), same as
 * {@link BARE_ALIAS_DECL_RE} above but without the "as" clause.
 * isForbidden (java:134-138, a pure `[%pL0-9_.]+` token) declines this branch
 * for a bare unquoted identifier, so only quoted content ever qualifies
 * (camevo-41-suki094: `"Only one actor --><u:red>Transparent: KO"`, the sole
 * line in the diagram -- no keyword, no arrow, no "as"). Built via new
 * RegExp: a /regex/ literal containing this file's `<<[^>]+>>` alternative
 * desyncs lizard's brace-depth counting for adjacent functions (see
 * DECORATED_TARGET_AFTER_ARROW_RE above, same workaround).
 */
const BARE_QUOTED_DECL_RE = new RegExp(
  '^"[^"]+"(?:\\s*(?:#\\S+|<<[^>]+>>|\\$\\S+|' +
    '\\[\\[[^\\]]*(?:\\][^\\]]+)*\\]\\]))*\\s*$',
);

/**
 * True when any of the first {@link SCAN_LINE_LIMIT} lines, trimmed, carries a
 * descriptive-only keyword or an element shorthand. Used by `class`/`sequence`
 * `accepts()` to decline descriptive blocks (D3), mirroring upstream (the
 * class/sequence factories fail on `node`/`cloud`/`usecase`/… lines).
 */
export function hasDescriptiveSignal(lines: readonly string[]): boolean {
  return stripNonContentRegions(lines)
    .slice(0, SCAN_LINE_LIMIT)
    .some((line) => {
      const trimmed = line.trim();
      return (
        DESCRIPTIVE_KEYWORD_PATTERN.test(trimmed) ||
        matchesElementShorthand(trimmed)
      );
    });
}

/**
 * A `(Use Case)` decorated TARGET immediately following an arrow body —
 * `CommandLinkElement`'s `LINK_ENT_ALT` (`link-grammar.ts`'s `LINK_ENT_ALT`,
 * the `\((?!\*\))[^)]+\)/?` alternative) — is not a legal sequence-diagram
 * PART2 (`CommandArrow.java`'s `PART2CODE`/`PART2LONG`: bare parens are never
 * allowed), so `foo --> (Use case)` cannot parse as a sequence message no
 * matter how eagerly `isSequenceLine` matches `-->`. `matchesElementShorthand`
 * only catches this decoration at the line START (ENT1); this catches it as
 * ENT2, anywhere after an arrow run — the shape that was falling through
 * every `accepts()` straight to `sequencePlugin` (last-registered, most
 * permissive fallback).
 *
 * Deliberately narrow, to avoid firing on prose with a parenthetical remark
 * (e.g. "Fixed the bug. (#130)"):
 *  - arrow-body run >= 2 chars (a lone `.`/`=` before a paren is common free
 *    text; every real PlantUML arrow token is >= 2 chars)
 *  - `(?!\d+\))` excludes pure-digit content — `CommandArrow.java`'s
 *    `ARROW_DRESSING2` inclination dressing, a legal SEQUENCE token
 *  - `(?!\*)` excludes legacy activity's `(*)`/`(*1)`/`(*2)` markers
 *  - no comma in the paren content — mirrors {@link ASSOCIATION_CLASS_COUPLE}
 *    (a comma pair after an arrow could be the classdiagram COUPLE form,
 *    reversed shape included; verified by that dispatch test)
 *
 * Used only by {@link hasDescriptiveElement}: `descriptionPlugin` is
 * registered before `sequencePlugin`, so claiming these lines there is
 * sufficient. `hasDescriptiveSignal` stays unchanged — no reason to widen
 * `class`'s decline surface for a signal only description needs.
 */
const ARROW_BODY_RUN =
  '(?:[-=.~]{2,4}[<>ox^*|{}0@#+\\/]{0,3}|[-=.~][<>ox^*|{}0@#+\\/]{1,3})';
const DECORATED_TARGET_AFTER_ARROW_RE = new RegExp(
  ARROW_BODY_RUN + '\\s*\\((?!\\d+\\))(?!\\*)[^(),]+\\)/?',
);

/** True when `trimmed` carries a {@link DECORATED_TARGET_AFTER_ARROW_RE} match. */
function hasArrowDecoratedTarget(trimmed: string): boolean {
  return DECORATED_TARGET_AFTER_ARROW_RE.test(trimmed);
}

/**
 * True when any of the first {@link SCAN_LINE_LIMIT} lines, trimmed, carries a
 * description-claimable keyword (`ALL_TYPES` minus bare `actor`/`interface`; see
 * {@link DESCRIPTION_ACCEPTS_KEYWORDS}), an element shorthand, the `:User:`
 * colon-actor form, or a bare-id-as-decorated-display alias
 * ({@link ALIAS_DECORATED_DISPLAY}). This is the description plugin's
 * `accepts()` test — broader than {@link hasDescriptiveSignal} (it adds
 * `package`, the colon actor, and the decorated-display alias) but it leaves
 * bare `actor`/`interface` to the sequence/class plugins.
 */
export function hasDescriptiveElement(lines: readonly string[]): boolean {
  return stripNonContentRegions(lines)
    .slice(0, SCAN_LINE_LIMIT)
    .some((line) => {
      const trimmed = line.trim();
      return (
        DESCRIPTIVE_ELEMENT_PATTERN.test(trimmed) ||
        ACTOR_COLON_SHORTHAND.test(trimmed) ||
        matchesElementShorthand(trimmed) ||
        ALIAS_DECORATED_DISPLAY.test(trimmed) ||
        hasArrowDecoratedTarget(trimmed) ||
        BARE_ALIAS_DECL_RE.test(trimmed) ||
        BARE_QUOTED_DECL_RE.test(trimmed)
      );
    });
}
