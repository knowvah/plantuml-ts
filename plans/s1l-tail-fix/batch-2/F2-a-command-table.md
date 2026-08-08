# F2-a — G6 command-table gaps

## Context

`plantuml-ts` is a TypeScript port of PlantUML's descriptive-diagram engine.
The description-diagram command dispatch table
(`src/diagrams/description/element-grammar.ts` +
`command-table-containers.ts` + `command-table-shorthand.ts`) is a
first-match-wins list mirroring upstream's `CommandCreateElementFull`
(`~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/
CommandCreateElementFull.java`). Two of its declaration-line alternatives
have no port, dropping two fixtures' declaration lines to a silent no-match —
the entity is auto-created later at first link reference, with no
stereotype and display = code. This task ports both alternatives.

Read `~/.claude/rules/diagnosis.md` before touching anything — this is a
diagnosed defect, not greenfield work, and the mechanism below is
already verified against jar probes. Do not re-diagnose. Read
`~/.claude/rules/testing.md` and `~/.claude/rules/testability.md` before
writing tests (TDD: red test first, from the shapes in Acceptance Criteria).

**Required reading before touching anything:** `planning/usymbol-composition.md`
and `planning/sizer-renderer-parity.md` — `CLAUDE.md` marks both mandatory
for any sizing bug in any engine. `~/.claude/rules/diagnosis.md`,
`~/.claude/rules/testing.md`, `~/.claude/rules/testability.md`.

## Task

Port two unported `CommandCreateElementFull` alternatives into the
description command table:

**(1) No-SYMBOL / unquoted-CODE branch.** `element-grammar.ts:170`'s
`RE_BARE_QUOTED_DECL` is anchored `^"[^"]+"` — it requires a QUOTED code, so
`User << Human >>` (no leading keyword, no quotes, a trailing stereotype)
matches no command in the table and the whole line is silently dropped.
Upstream's `SYMBOL` group is optional
(`CommandCreateElementFull.java:84`) and `CODE1`/`CODE_WITH_QUOTE` admits a
bare `[%pLN_.]+` alternative (`:126,:128`); `isForbidden`
(`FORBIDDEN_PATTERN = ^[\p{L}0-9_.]+$`, `:134-138`) tests the WHOLE line, so
a pure `User` line is correctly refused while `User << Human >>` is accepted
and yields a `STILL_UNKNOWN` leaf carrying the stereotype, muted to
actor-or-interface at diagram end.

Port a new command that:
- Matches a bare unquoted identifier (no leading keyword) followed by
  decorations (`<<stereotype>>` / `#color` / `$tag` / `[[url]]`), mirroring
  `isForbidden`'s whole-line test so a pure `User` (no decorations) is still
  correctly refused by this rule and falls through as before.
- Emits a `STILL_UNKNOWN` leaf via the parse-state contract below — carrying
  the stereotype — rather than hardcoding a symbol.
- Add this as a new rule in `command-table-containers.ts`, ordered so it does
  not shadow any existing rule (verify against rules 10, 11, 11b, and rule
  15's `RE_BARE_QUOTED_DECL` fallback — this rule fires only where those do
  not).

**(2) `CODE as "quoted DISPLAY"`.** `command-table-containers.ts:45`'s rule
11 alias alternation (`(?:\([^)]+\)|:[^:]+:|\S+)`) cannot take a
space-bearing quoted RHS — `\S+` stops at the first space, so
`(Use) as "Use the application"` matches nothing (probed: NO MATCH, index
−1). Upstream's third alternative,
`CODE3 as DISPLAY3` (`CommandCreateElementFull.java:95-100`), lets `DISPLAY`
admit a double-quoted string (`DISPLAY_CORE`, `:130`) while `CODE` does not
(`CODE_CORE`, `:126`) — **a quoted RHS FLIPS the code/display roles**: the
LHS token becomes the id, the quoted RHS becomes the display.

**CRITICAL — do not naively widen the existing alternation.** Rule 11's
existing alternation treats its LHS as the DISPLAY and the alias as the CODE
(upstream's alternative 2, `DISPLAY2 as CODE2`, `java:89-94` — verified:
`(Use) as UC1` currently yields id `UC1`, display `Use`). Simply admitting a
quoted RHS into the same alternation would produce id `Use the application`,
display `Use` — backwards. This needs a **separate rule with role-flipping
logic**, not a widened pattern on the existing one.

Add the new rule in `command-table-containers.ts`, ordered AFTER rule 11b
(so a quoted LHS stays `DISPLAY2 as CODE2` — do not let the new rule
intercept it), plus its mirror form in `command-table-shorthand.ts` for the
bare-CODE-shorthand case. Add the regex + a role-flipping helper beside
`RE_BARE_AS_DECORATED` in `element-grammar.ts`.

**Author fixtures for the three further NO-MATCH/mis-parse shapes** found
during diagnosis and fixed by the same branch (ADR-7 — new fixture + jar
oracle, in this task, not a synthetic-only check):
- `Admin as "Main Admin"` (bare CODE, currently NO MATCH)
- `:A: as "Actor name"` (colon CODE, currently NO MATCH)
- `[Comp] as "Big component"` (currently MIS-parses: rule 10's `(.*)`
  trailer yields id `"Big`, display `Comp`, plus a spurious node — verify
  this is actually fixed, not just newly not-crashing)

Generate their jar oracles with the pinned oracle jar:
```sh
java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> \
  -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <fixture>.puml
```
(`scripts/oracle-corpus.ts#runOracle`.)

> **`-DPLANTUML_DETERMINISTIC_TEXT=true` is MANDATORY and must never be
> omitted.** Without it the jar measures with real AWT font metrics, which
> poisons every width in the dumped DOT — the ratchets compare against
> `WidthTableMeasurer` output. This is not theoretical: it is precisely the
> defect behind `kokebo-27-vafi688` (G13/F5-a), and the class goldens once
> captured without the flag carried **489 phantom size deltas** (A2s ADR-5).
> An oracle generated without it looks plausible and is silently wrong.

## Write-set

- `src/diagrams/description/element-grammar.ts`
- `src/diagrams/description/command-table-containers.ts`
- `src/diagrams/description/command-table-shorthand.ts`
- `src/diagrams/description/parse-state.ts`

## Read-set

- `src/diagrams/description/element-grammar.ts:140-190` (existing
  `RE_BARE_QUOTED_DECL`, `DECORATIONS`, `PLAIN_ALIAS`, `RE_BARE_AS_DECORATED`
  and its doc comment on alias-decoration precedence)
- `src/diagrams/description/command-table-containers.ts:1-70` (rules
  10/11/11b — the alias alternation and role assignment to mirror/avoid;
  note rule 11's execute calls `shorthandNode(state, ..., 'usecase', ...)`)
- `src/diagrams/description/command-table-shorthand.ts:1-40` (rule
  ordering/pattern shape for the shorthand mirror form)
- `src/diagrams/description/parse-state.ts:130-222` (`emitNode`,
  `ensureEndpoint`, `resolveStillUnknown`, `startNewPage` — the
  `STILL_UNKNOWN` emission contract; see Interface Contracts below)
- `src/diagrams/description/link-grammar.ts:210-230` (`EndpointShape` —
  the existing `stillUnknown` field shape used by the link-endpoint path)
- `src/diagrams/description/ast.ts:21-65` (`DescriptiveNode` — `stillUnknown`
  and `stereotype` field docs)
- `../s1l-tail-diagnosis/findings/element-font.md` — `gogamo-72-pibo470`
  record (full mechanism, causal chain, ruled-out list)
- `../s1l-tail-diagnosis/findings/other.md` — `dopova-50-digo290` record
  (full mechanism, causal chain, ruled-out list, the three further shapes)
- `../s1l-tail-fix/findings/METRIC-AUDIT.md` §"The 8 understated fixtures" —
  `gogamo-72` true target 0.4604, `dopova-50` true target 0.9371

## Architecture decisions binding this task

- **ADR-6 precedent (one function, one owner):** this task is F2-a's own
  version of that principle — the two alternatives both touch the same
  first-match dispatch table; do not scatter partial fixes across files
  outside the declared write-set.
- No ADR directly governs F2-a's regex design, but the **interface
  contract with F1-b is load-bearing** (see below) — F1-b lands
  `parse-state.ts` first in Batch 1; this task edits the post-F1-b file.

## Interface contract with F1-b (`parse-state.ts`)

F1-b (Batch 1, G1/G8/G9-E1) is expected to land `parser.ts`/`parse-helpers.ts`
changes plus a `pushElementBody`/common-base-indent change to
`parse-state.ts`. **This task must read `parse-state.ts` AFTER F1-b's commit
lands**, not before — the file is a shared hub (SYNTHESIS §8).

The `STILL_UNKNOWN` emission contract this task consumes already exists in
`parse-state.ts` as of the current `main` (verified in source, not assumed):

```ts
// parse-state.ts:155-167 (ensureEndpoint) — the pattern to mirror for a
// direct declaration-line node, not a link endpoint:
export function ensureEndpoint(state: ParseState, ep: EndpointShape): void {
  if (state.nodesById.has(ep.id) || state.qualifiedNodesById.has(ep.id)) return;
  const node = makeNode(ep.id, resolveNewlineEscapes(ep.id), ep.symbol);
  if (ep.stillUnknown === true) node.stillUnknown = true;
  emitNode(state, node);
}

// parse-state.ts:200-222 (resolveStillUnknown) — runs at diagram/page end,
// mutes every stillUnknown===true leaf to 'actor' or 'interface' based on
// whether the diagram contains any OTHER usecase/actor leaf. Already wired
// into startNewPage; verify it is also wired into the final (non-newpage)
// diagram-close path before relying on it for a document with no `newpage`.
export function resolveStillUnknown(nodes: DescriptiveNode[]): void { ... }
```

**Contract for this task's new rule:** build the node with `makeNode(id,
display, /* no symbol yet */)`, set `node.stillUnknown = true`, set
`node.stereotype` from the extracted `<<...>>` run, then `emitNode(state,
node)` — do NOT hardcode `'actor'` as `gogamo-72`'s current auto-create path
does. If `makeNode`'s signature requires a `USymbol` positionally, thread a
placeholder symbol value through the same code path `ensureEndpoint` uses
(read `parse-helpers.ts:124` `makeNode`'s exact signature — this is a
read-set item, not a guess) and confirm `resolveStillUnknown` overwrites it
regardless of the placeholder, since the mute step replaces `n.symbol`
unconditionally when `stillUnknown === true`.

If F1-b's landed `parse-state.ts` does NOT yet expose a way to reach
`resolveStillUnknown` from a diagram close with no `newpage` command, that
is a conflicting constraint — STOP and log to `decision-journal.md` per
`~/.claude/rules/autonomous-execution.md`; do not silently add your own
diagram-close hook outside this task's write-set without flagging it.

## Acceptance criteria

1. **Given** `actor User << Human >>` is replaced by the bare form
   `User << Human >>` with no leading keyword, **when** parsed, **then** the
   resulting node has `stereotype: ['Human']` and, after
   `resolveStillUnknown`, `symbol === 'actor'` (matching the diagram's other
   usecase/actor leaves) — reproducing the jar's `62.725 × 88.000` box.
2. **Given** a diagram with `User << Human >>` and NO other usecase/actor
   leaf, **when** parsed, **then** `resolveStillUnknown` mutes it to
   `'interface'`, not `'actor'` — this is the branch a hardcoded `'actor'`
   default would get wrong and the reason this task must NOT hardcode it.
3. **Given** `(Use) as "Use the application"`, **when** parsed, **then** the
   node's `id === 'Use'` and `display === 'Use the application'` (role
   FLIPPED from the plain-alias form) — reproducing the jar's
   `1.910510 × 0.448769` in ellipse.
4. **Given** `(Use) as UC1` (existing, unquoted-RHS form), **when** parsed
   after this change, **then** `id === 'UC1'`, `display === 'Use'` —
   UNCHANGED from current behavior (this is the regression guard for the
   "do not naively widen" trap).
5. **Given** the three authored fixtures (`Admin as "Main Admin"`,
   `:A: as "Actor name"`, `[Comp] as "Big component"`), **when** parsed and
   rendered, **then** each produces exactly one node (no spurious node) with
   the correct id/display split, matching its generated jar oracle to
   within the 0.01in size-conformance bar.

## Quality bar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts   # widened 0; count RISES to at least 332
npx tsx scripts/audit-size-metric-identity.ts
```
Never pipe a gate — capture `$?` directly. **`widened > 0` on the
description ratchet is a STOP condition, not a warning** — rule 15 is the
last-resort line in a first-match table, and this task's highest risk is a
new rule swallowing lines other rules should own. Verify against the full
description corpus (351 fixtures), not just the two target fixtures.
This task is description-only — no cross-engine ratchet re-run required.

## Observability

N/A — no new observable operations. This is a parser-internal change with
no new logging, metrics, or external interface.

## Rollback

Reversible. Both new rules are additive entries in a dispatch table; revert
by removing the added rules and the `parse-state.ts` emission call. No data
migration, no schema change.

## Boundaries

- **Always do:** verify rule ordering against ALL of rules 10/11/11b/15
  before adding either new rule; generate jar oracles for all three authored
  fixtures; run the full 351-fixture description ratchet, not a subset.
- **Ask first:** any change to `parse-state.ts` beyond the `STILL_UNKNOWN`
  emission call this task needs — if the interface contract above doesn't
  match what F1-b actually landed, stop and ask rather than patching around
  it.
- **Never do:** write `oracle/goldens/description/size-backlog.json`;
  run any state-mutating git command; declare a divergence; regenerate an
  existing golden (only NEW fixtures' oracles, per ADR-7, are in scope).

## Commit

`fix(F2-a): port unquoted-CODE and quoted-DISPLAY alias grammar`

Body (required — touches 4+ files): explain the role-flip trap from
mechanism (2) above in one sentence, and name the two closed fixtures plus
the three authored ones.

## Reporting

Report to the orchestrator, do not edit `size-backlog.json` yourself:
- Pins closed: `gogamo-72-pibo470`, `dopova-50-digo290`
- Corrected targets hit: `gogamo-72` 0.4604→0, `dopova-50` 0.9371→0 (not the
  stale pinned 0.2148/0.8827)
- New fixtures authored + oracle paths for the three additional shapes
- Confirmation that rule-ordering regression tests exist in
  `parser.test.ts` for rules 10/11/11b/15 plus the two new rules

Use Serena MCP tools (`find_symbol`, `find_referencing_symbols`,
`search_for_pattern`) for all symbol navigation, not a raw LSP tool — agents
do not have the LSP tool in their frontmatter.
