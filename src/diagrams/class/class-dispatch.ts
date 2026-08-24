/**
 * Class-vs-description routing discriminator (mission A3; ADR-2 amended
 * 2026-08-03 -- the decline-on-descriptive-signal half is superseded, see
 * `planning/mission-a3-class-superset/decisions.md`).
 *
 * Mission A3 makes the class engine own the descriptive elements upstream's
 * `ClassDiagramFactory` owns. Per the mission's "route + render each tier
 * together" structure (decision-journal.md), this module grows one delta per
 * batch, alongside the rendering support for the elements that delta routes in —
 * never routing a fixture into the class engine before the engine can render it.
 *
 * The base behaviour mirrors upstream's factory-selection outcome: the class
 * factory (tried before the description factory) claims a block of native class
 * constructs, and the description factory claims a pure descriptive block.
 * `accepts()` implements that order directly: a block carrying an UNAMBIGUOUS
 * class construct is claimed outright, and only a block WITHOUT one declines on
 * a descriptive signal. Before the 2026-08-03 amendment it declined on the
 * signal unconditionally -- a keyword-presence approximation this ADR's own
 * Context warned against, adopted because the engine had no way to REFUSE a
 * line. It does now (`class-descriptive-leaf-command.ts`'s allowmixing gate).
 *
 * Implemented as class-local logic. Per ADR-1 this must NOT mutate the shared
 * `descriptive-keywords.ts` (the sequence and description guards also consume
 * it); it only *reads* `hasDescriptiveSignal`.
 *
 * Batch 1 delta (Δ2 — note-body stripping): a shorthand token inside a block
 * note body (e.g. `(palegreen)` in a `note left of X … end note`) must not read
 * as a `(usecase)` descriptive element and misroute a genuine class diagram to
 * the description engine (fixture taxemo-34).
 *
 * Batch 1b delta (Δ3 — member-line stripping): a class NAMED like a descriptive
 * keyword, declared with member lines (`Person : guid OID`), starts with the
 * token `person` and would trip the descriptive signal. A member line (`Id :
 * …`) is never a descriptive element declaration, so it is excluded from the
 * scan. Pairs with the leading-dot edge fix that renders the namespace fixtures.
 *
 * Later batches add the native keyword / container / allow_mixing deltas with
 * their rendering support.
 *
 * Mission object-dot-sync (T1) — object declarations: upstream's
 * `ClassDiagramFactory` registers `CommandCreateEntityObject` alongside the
 * class commands (there is no separate object-diagram engine), so a block
 * opening with `object Foo` is a class-diagram block too. Ported the
 * previously-separate object plugin's own accept heuristic
 * ({@link OBJECT_ACCEPTS_PATTERNS}, formerly `src/diagrams/object/index.ts`)
 * verbatim into the class engine's accept signal.
 *
 * Mission object-dot-sync (Phase L) — `json` declarations: same reasoning as
 * `map`/`object` above (`CommandCreateJson`/`CommandCreateJsonSingleLine` are
 * ALSO registered directly on `ClassDiagramFactory`, no separate engine for
 * this form — the standalone `@startjson` engine, src/diagrams/json/, is a
 * different upstream package and untouched by this accept signal).
 */

import {
  hasDescriptiveSignal,
  stripLegendRegions,
} from '../../core/descriptive-keywords.js';
import { REL_DISPATCH_RE } from './class-relationship-parser.js';
import { getEmbeddedType } from '../../core/EmbeddedDiagram.js';

/**
 * The subset of {@link CLASS_ACCEPTS_PATTERNS} that ONLY a class diagram can
 * carry — used to claim a block before the descriptive decline, mirroring
 * upstream's factory order. `interface`/`entity`/`circle` are excluded because
 * they belong to both grammars; a class-only relationship arrow is excluded
 * because it can appear inside an embedded `{{ }}` sub-diagram.
 *
 * T6 inherited-scope delta (`plans/routing-heuristic-repair/batch-5/
 * T6-class-dispatch.md`'s "ADDED SCOPE — inherited from T4" section):
 * `CommandCreateClassMultilines.java:102-103`'s TYPE alternation --
 * `(interface|enum|annotation|abstract[%s]+class|static[%s]+class|abstract|
 * class|entity|protocol|struct|exception|metaclass|stereotype|dataclass|
 * record)` -- has SEVEN more class-only siblings this list never carried
 * (`component/gutute-00-gaki684`'s `protocol X as "INOUT" {` is the fixture
 * that surfaced the gap; the rest is covered on the same TYPE-alternation
 * evidence, not left for one fixture per keyword). Grepped the whole corpus
 * (`test-results/dot-cache/`, `oracle/goldens/`) for a leading-line use of
 * each candidate: `static class`/`protocol`/`struct`/`exception`/
 * `metaclass`/`dataclass`/`record` have ZERO hits outside `class`/`object`
 * fixtures, so they join this list (and bare `abstract`, verified safe by
 * three `object/` fixtures literally declaring `abstract abstract` — TYPE
 * keyword then a class named "abstract"). `stereotype` does NOT join it,
 * despite being in the same Java alternation: it collides with plain note
 * prose (`component/jegure-48-cesi766`: `stereotype not working`, inside a
 * `note … end note` body) and with `<style>` block CSS selectors
 * (`sequence/dudeku-78-naju581`, `usecase/lunexo-59-fupo775`: `stereotype {`
 * / `Stereotype {` opening a style rule, unrelated to
 * `CommandCreateClassMultilines`). This port's `classAccepts` is a per-line
 * text heuristic, not upstream's real parser, so it cannot tell those uses
 * apart from a genuine TYPE keyword the way `CommandCreateClassMultilines`
 * can; `stereotype` is excluded here for the identical reason
 * `interface`/`entity` already are above -- ambiguous with a grammar this
 * heuristic cannot see past.
 *
 * These siblings are NOT duplicated into {@link CLASS_ACCEPTS_PATTERNS}
 * (the class-doc-comment's "subset" framing notwithstanding): this array is
 * tested FIRST and returns unconditionally on a match
 * ({@link classAccepts}'s own body), so a copy in `CLASS_ACCEPTS_PATTERNS`
 * would be unreachable dead code for every one of them.
 */
const UNAMBIGUOUS_CLASS_DECL: readonly RegExp[] = [
  /^class\s/i,
  /^abstract\s+class\s/i,
  /^enum\s/i,
  /^annotation\s/i,
  /^static\s+class\s/i,
  /^abstract\s/i,
  /^protocol\s/i,
  /^struct\s/i,
  /^exception\s/i,
  /^metaclass\s/i,
  /^dataclass\s/i,
  /^record\s/i,
];

/**
 * Patterns that appear in class diagrams. Tested against the first
 * {@link SCAN_LINE_LIMIT} lines of a block (the block extractor's probe window).
 */
const CLASS_ACCEPTS_PATTERNS: readonly RegExp[] = [
  /^class\s/i,
  /^abstract\s+class\s/i,
  /^interface\s/i,
  /^enum\s/i,
  /^annotation\s/i,
  // T6 (`tuxido-23-xide677`, sequence's `Alice <<--o Bob : ok`) — the `--o`
  // alternative is a raw substring test with no grammar context, so it also
  // matched sequence's OWN `<<--o` arrow dressing (`CommandArrow.java:99-116`'s
  // ARROW_DRESSING1 `<<?_?` alternative followed by ARROW_DRESSING2 `[ox][%s]`).
  // A genuine class aggregation arrow never doubles the navigability glyph —
  // `<--o`/`o-->` (single `<`/`>`) are real class syntax (verified against
  // `class/givoli-70-rade072` et al.: `Potential "0..*" <--o "1"
  // CompositePotential`), but `<<`/`>>` never appear in
  // `class-relationship-parser.ts`'s own arrow grammar at all — so excluding
  // ONLY the doubled glyph (`(?<!<<)`) removes the sequence collision without
  // narrowing the real class token. No fixture pairs `--o`/`o--` with a doubled
  // glyph on the OTHER side (`o-->>`/`<<o--`), so that mirror case is left
  // unguarded rather than fitted to a token nothing in the corpus exercises.
  /<\|--|<\|\.\.|--\|>|\.\.\|>|\*--|o--|--\*|(?<!<<)--o/,
  // `object` must be followed by a token that can start nameAndCode()
  // (CODE = [^%s{}%g<>]+, or a quoted DISPLAY) — CommandCreateEntityObject
  // (objectdiagram/command/CommandCreateEntityObject.java:71-80,
  // command/NameAndCodeParser.java:46-49). Without the name-start guard, a
  // class-diagram relationship line like `Object <|-- Foo` (class named
  // Object) false-triggers object dispatch. Keyword stays case-insensitive
  // (upstream compiles commands with Pattern.CASE_INSENSITIVE,
  // regex/Pattern2.java:114).
  /^object\s+[^\s{}<>]/i,
  /^object\s*$/i,
  // `map` (CommandCreateMap) moved to {@link hasMapDeclaration}, T6
  // (`decisions.md#d3` exception 2): that check runs BEFORE legend/embed
  // narrowing so `object/zuvila-56-nuda425`'s map declaration — nested
  // inside a `legend … endlegend` body — still claims the block, which a
  // copy of this pattern here (tested against the narrowed `scoped` array)
  // could never do. See that function's doc comment for the full reasoning.
  // `json` (CommandCreateJson / CommandCreateJsonSingleLine) — same
  // name-start guard as `object` above (and `map`'s own, in
  // {@link hasMapDeclaration}), and same reasoning: loose on purpose (routes
  // the block; class-json-commands.ts's own two patterns do the real header
  // validation). A class named "json" as a relationship endpoint is already
  // stripped by REL_DISPATCH_RE before this scan runs, same as `map`.
  /^json\s+[^\s{}<>]/i,
];

/** Leading-line probe window, matching the block extractor and `hasDescriptiveSignal`. */
const SCAN_LINE_LIMIT = 20;

/**
 * Δ3 — a class member line, e.g. `Person : guid OID`. Excluded from the
 * descriptive scan so a class *named* after a descriptive keyword is not mistaken
 * for a `person`/`entity`/… descriptive element declaration.
 */
const MEMBER_LINE_RE = /^\w[\w".]*\s*:\s+\S/;

/**
 * Δ3b — a `[[url]] ...` member/note line: the DOUBLE-bracket hyperlink marker
 * (any member line, note line, or classifier decoration may open with one),
 * categorically distinct from the description engine's SINGLE-bracket
 * `[Component]` shorthand ({@link ELEMENT_SHORTHAND_PATTERNS} in
 * `descriptive-keywords.ts`, `/^\[.+\]/` — matches greedily through the LAST
 * `]` on the line, so it also swallows `[[url]]`). A `[[` opener can never be
 * a component shorthand (that grammar's own bracket is single), so excluding
 * it from the descriptive scan is unconditionally safe. Verified against
 * cokeje-99-gede231 (`class foo { [[http://...]] for information }`, three
 * link-only member lines): without this exclusion, EVERY line inside the
 * class body reads as a component declaration, `hasDescriptiveSignal` fires,
 * and the whole block is misrouted to the description engine.
 */
const LINK_ONLY_LINE_RE = /^\[\[/;

/**
 * Δ4 (scoped) — an `entity`/`circle` declaration. These are native class-factory
 * keywords (upstream `CommandCreateClass` / `CommandCreateEntityObjectMultilines`)
 * that the class engine now renders, so they are excluded from the descriptive
 * *decline* signal. They are deliberately NOT added to the *accept* signal: a
 * block routes to class on entity/circle only when it ALSO carries a class-forcing
 * keyword (`class`/`interface`/`enum`/`annotation`/`abstract` or a class-only
 * relationship — {@link CLASS_ACCEPTS_PATTERNS}). This lands the class+entity
 * fixtures (lilura/tepazu/xidura/niduni) without stealing a pure `entity`-as-
 * sequence-participant diagram (`entity Alice` + `Alice -> Bob`, no class keyword),
 * mirroring upstream's Sequence→Class factory order for that ambiguous case.
 */
const ENTITY_CIRCLE_DECL_RE = /^(?:entity|circle)\s+\S/i;

/** `allowmixing` / `allow_mixing` — a class-only directive. */
const ALLOW_MIXING_RE = /^allow_?mixing\b/i;

/**
 * Descriptive leaf keywords the class engine renders as a rect but which upstream
 * gates on `allowmixing` (`CommandCreateElementFull2`). Excluded from the decline
 * signal ONLY when `allowmixing` is present, so a `class`+`database` block under
 * allowmixing (givofi/popesa) routes to class via its class keyword, while a
 * plain `class C` + `database X` (no allowmixing) still stays with description —
 * matching upstream, which errors on the descriptive leaf without allowmixing.
 * `usecase`/`actor` are intentionally absent (their shapes are not yet rendered),
 * so `allowmixing`+`usecase` blocks (cacoma) stay in description until Tier 4.
 */
const DESCRIPTIVE_LEAF_DECL_RE = /^database\s+\S/i;

/**
 * Δ4b — a descriptive keyword opening a container (`rectangle X {`, `stack a {`,
 * `component b {`). These are native class-factory containers
 * (CommandPackageWithUSymbol, no allowmixing), so they are excluded from the
 * decline signal: a container block with an inner `class` (rakuci/xenere/lojiga)
 * routes to class via its class keyword. A pure descriptive container tree with
 * no class content still has no accept signal and stays with description.
 */
const CONTAINER_OPEN_RE =
  /^(?:package|rectangle|node|component|folder|frame|cloud|database|storage|artifact|file|card|queue|stack|hexagon|agent)\b.*\{\s*$/i;

/**
 * Mission A4 Phase L final iteration (maruju-55-soko478) — `state X` /
 * `state "A" as B` declarations and `[*]` pseudostate transitions are
 * exclusively `StateDiagramFactory` constructs
 * (statediagram/command/CommandCreateState.java,
 * statediagram/command/CommandLinkStateCommon.java) — upstream never routes
 * them through `ClassDiagramFactory`. Declined alongside `hasDescriptiveSignal`
 * below, BEFORE `CLASS_ACCEPTS_PATTERNS` is tested: a state-diagram block that
 * also happens to contain an embedded `json foo1 { ... }` element (mission A3's
 * `^json\s+[^\s{}<>]/i` accept pattern above) would otherwise misroute to the
 * class engine on the strength of that ONE line, even though every OTHER line
 * in the block is state-diagram-only syntax the class factory would never
 * parse (classPlugin is registered before statePlugin, src/index.ts, so the
 * false accept wins the race). Mirrors upstream's `PSystemBuilder`
 * factory-order semantics — each factory attempts the WHOLE document, first
 * clean parse wins — which this port's per-line `accepts()` heuristics only
 * approximate; a state-only signal must disqualify class the same way an
 * existing descriptive signal already does. Deliberately narrow (just the two
 * signals this bug needs, mirrors `statePlugin`'s own `STATE_ACCEPTS_PATTERNS`,
 * src/diagrams/state/index.ts, without importing that module — cross-engine
 * accept-signal coupling is worse than a small, independently-scoped local
 * duplicate).
 */
const STATE_SIGNAL_RE = /^state\s+\S|^\[\*\]/i;

const NOTE_BLOCK_START_RE = /^note\s+(?:left|right|top|bottom|over)\b/i;
/** ` : ` (spaces both sides) marks an *inline* single-line note, which has no body. */
const NOTE_INLINE_SEP_RE = /\s:\s/;
const NOTE_BLOCK_END_RE = /^end\s*note\b/i;

/**
 * Δ2 — drop the bodies of block notes (`note left of X` … `end note`) so
 * shorthand tokens inside a note body are not mistaken for a descriptive
 * element. An inline single-line note (`note left of X : text`) has no body and
 * is kept. A `::member` qualifier on the target does not defeat the start match
 * (only a spaced ` : ` inline separator does).
 */
function stripNoteBodies(lines: readonly string[]): string[] {
  const out: string[] = [];
  let inNote = false;
  for (const line of lines) {
    const t = line.trim();
    if (inNote) {
      if (NOTE_BLOCK_END_RE.test(t)) inNote = false;
      continue;
    }
    if (NOTE_BLOCK_START_RE.test(t) && !NOTE_INLINE_SEP_RE.test(t)) {
      inNote = true;
      continue;
    }
    out.push(line);
  }
  return out;
}

/**
 * T6 (D3 widening exception 2, `plans/routing-heuristic-repair/
 * decisions.md#d3`): `map "…" as x { … }` — `CommandCreateMap`
 * (~/git/plantuml/.../objectdiagram/command/CommandCreateMap.java),
 * registered directly on `ClassDiagramFactory` alongside the object
 * commands — there is no separate map/object diagram engine upstream (see
 * this module's own "object declarations" doc-comment section above).
 * `object/zuvila-56-nuda425`'s only top-level content is a `legend …
 * endlegend` body wrapping a `{{ }}` sub-diagram that itself contains the
 * map declaration — a creole rendering detail the jar still parses as real
 * `ClassDiagramFactory` content (`TextBlockExporter` stamps the WHOLE
 * document `data-diagram-type="CLASS"`).
 *
 * Checked against `lines` BEFORE legend/embed narrowing for exactly that
 * reason: routing this signal through `stripLegendRegions` or
 * {@link scopeToEnclosingDiagram} (both applied inside {@link classAccepts}
 * below) would strip the very declaration D3 authorises `classAccepts` to
 * widen on. Bounded to `map` alone, matching D3's two-exception cap —
 * `object`/`class` keep the narrower, scoped treatment those two functions
 * apply.
 */
const MAP_DECL_RE = /^map\s+[^\s{}<>]/i;

function hasMapDeclaration(lines: readonly string[]): boolean {
  return lines.slice(0, SCAN_LINE_LIMIT).some((l) => MAP_DECL_RE.test(l.trim()));
}

/**
 * T6 over-claim fix (`dasutu-58-saje713`, `rizove-01-move566`): an embedded
 * `{{ … }}` sub-diagram body declares a DIFFERENT diagram than the one
 * enclosing it, and a `!procedure`/`!function` … `!endprocedure`/
 * `!endfunction` macro body is never itself diagram content — it is only
 * substituted at CALL sites (`tim/EaterDeclareProcedure.java:66`; the
 * declare/end pair is `text/TLineType.java:100-103`
 * `PATTERN_DECLARE_PROCEDURE` / :95-98 `PATTERN_DECLARE_RETURN_FUNCTION`,
 * closed by the SAME `!end(function|definelong|procedure)` pattern at
 * java:119-122). A `class`/`object` declaration appearing ONLY inside one
 * of these regions must not make the ENCLOSING block's `classAccepts` claim
 * it — `dasutu-58-saje713`'s `object o1 { … }` sits inside a `{{ }}` inside
 * a `note left … end note`, and `rizove-01-move566`'s `class Object { … }`
 * sits inside a `{{ }}` inside a `!unquoted procedure … !endprocedure`; both
 * read as SEQUENCE once this scoping applies.
 *
 * Embedded-diagram nesting reuses {@link getEmbeddedType}
 * (`src/core/EmbeddedDiagram.ts`) rather than a second boundary notion, per
 * this task's own boundary note: a nested embed opener (any line
 * `getEmbeddedType` recognises) increments depth, a bare `}}`
 * (`EmbeddedDiagram.EMBEDDED_END`, inlined below rather than importing the
 * whole rendering-seam class for one string literal) decrements it, and
 * only the OUTERMOST close ends the strip — `EmbeddedDiagram
 * .createAndSkip`'s own nesting algorithm (java:97-115), reused here for
 * the identical reason it exists there. `!procedure`/`!function` bodies are
 * scanned to their own `!end…` unconditionally, with no depth-tracking:
 * upstream does not permit declaring one macro inside another's body, and
 * this port has no fixture in scope that would need it.
 *
 * NOT applied to the D3 `map` widening — see {@link hasMapDeclaration}'s own
 * doc comment for why that check must see `lines` unscoped.
 */
const PROCEDURE_START_RE =
  /^!(?:unquoted\s+|final\s+)*(?:procedure|function)\s+\$?\S/i;
const PROCEDURE_END_RE = /^!end(?:procedure|function|definelong)\b/i;
/** `EmbeddedDiagram.EMBEDDED_END` (`src/core/EmbeddedDiagram.ts`) — literal,
 *  to avoid importing that class's renderer-seam surface for one constant. */
const EMBEDDED_END = '}}';

function scopeToEnclosingDiagram(lines: readonly string[]): string[] {
  const out: string[] = [];
  let region: 'none' | 'embedded' | 'procedure' = 'none';
  let embedDepth = 0;
  for (const line of lines) {
    const t = line.trim();
    if (region === 'procedure') {
      if (PROCEDURE_END_RE.test(t)) region = 'none';
      continue;
    }
    if (region === 'embedded') {
      if (getEmbeddedType(t) !== null) {
        embedDepth++;
      } else if (t === EMBEDDED_END) {
        embedDepth--;
        if (embedDepth === 0) region = 'none';
      }
      continue;
    }
    if (PROCEDURE_START_RE.test(t)) {
      region = 'procedure';
      continue;
    }
    if (getEmbeddedType(t) !== null) {
      region = 'embedded';
      embedDepth = 1;
      continue;
    }
    out.push(line);
  }
  return out;
}

/**
 * True when the class engine should own this block.
 *
 * Decline any block carrying a descriptive signal the class factory would not
 * parse (pure descriptive → description). Relationship lines and block-note
 * bodies are removed first: a class NAMED like a descriptive keyword used as a
 * relationship endpoint, and a shorthand inside a note body, are not descriptive
 * element declarations. `legend` … `endlegend` bodies are stripped too (a
 * salt-widget or shorthand token inside a legend is display-only, upstream
 * `CommonCommand`s available to every diagram type — see
 * `descriptive-keywords.ts`'s `stripLegendRegions`): without this, a lone
 * `class foo` diagram whose trailing legend happens to contain `()`/`[...]`
 * text is misrouted to the description engine (bixogo-47-xulu385,
 * roxosu-00-pini153). Embedded `{{ }}` sub-diagram and `!procedure`/
 * `!function` macro bodies are scoped out too, by
 * {@link scopeToEnclosingDiagram} — see its own doc comment.
 */
export function classAccepts(lines: readonly string[]): boolean {
  // D3 widening exception 2 — checked first and unscoped; see
  // hasMapDeclaration's own doc comment for why it must bypass the
  // narrowing below.
  if (hasMapDeclaration(lines)) return true;
  const allowMixing = lines.some((l) => ALLOW_MIXING_RE.test(l.trim()));
  // Δ1 — `allowmixing` is a class-only command: the block IS a class diagram
  // permitting descriptive elements (upstream CommandAllowMixing → ClassDiagram).
  if (allowMixing) return true;
  const noLegend = stripLegendRegions(lines);
  const scoped = scopeToEnclosingDiagram(noLegend);
  const declLines = stripNoteBodies(
    scoped.filter((l) => !REL_DISPATCH_RE.test(l.trim())),
  ).filter((l) => {
    const t = l.trim();
    if (MEMBER_LINE_RE.test(t) || ENTITY_CIRCLE_DECL_RE.test(t)) return false;
    if (LINK_ONLY_LINE_RE.test(t)) return false;
    if (CONTAINER_OPEN_RE.test(t)) return false;
    if (allowMixing && DESCRIPTIVE_LEAF_DECL_RE.test(t)) return false;
    return true;
  });
  // Upstream tries `ClassDiagramFactory` BEFORE `DescriptionDiagramFactory`,
  // so a block carrying an UNAMBIGUOUS class construct is a class diagram even
  // when it also names descriptive elements. The descriptive leaf is then
  // refused by the `allowmixing` gate
  // (`class-descriptive-leaf-command.ts#adjudicateAllowMixing`) rather than the
  // whole block being re-routed to a factory upstream never reached — which is
  // how `class Foo` + `usecase U1` used to render here while the jar refuses it.
  //
  // Deliberately narrower than {@link CLASS_ACCEPTS_PATTERNS}: `interface`,
  // `entity` and `circle` are in BOTH grammars (see the descriptive-leaf
  // keyword table's own note), so `interface I` inside a `component { }` is a
  // component diagram and must keep declining to description.
  if (
    scoped
      .slice(0, SCAN_LINE_LIMIT)
      .some((l) => UNAMBIGUOUS_CLASS_DECL.some((p) => p.test(l.trim())))
  ) {
    return true;
  }
  if (hasDescriptiveSignal(declLines)) return false;
  if (declLines.some((l) => STATE_SIGNAL_RE.test(l.trim()))) return false;
  // Trimmed before testing (mirrors the rest of classAccepts, above): an
  // indented `class`/`abstract class`/… inside a namespace block is
  // otherwise invisible to CLASS_ACCEPTS_PATTERNS, which anchor on `^`.
  return scoped
    .slice(0, SCAN_LINE_LIMIT)
    .some((l) => CLASS_ACCEPTS_PATTERNS.some((p) => p.test(l.trim())));
}
