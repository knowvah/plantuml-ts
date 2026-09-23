# T25 — header/name and edge-label creole

**Agent:** debugger for the instrument pass, then typescript-pro (sonnet)
for the fix · **Depends on:** — · Worktree.

## Context

Three mechanisms, MEDIUM/LOW confidence per `diagnosis/A4-text.md` §5/§6 —
none traced to a Java `file:line` yet, so this task starts in diagnosis
mode (per `~/.claude/rules/diagnosis.md`: instrument before hypothesizing).
(5) `diseka-11-gozu390` (`<color:#888888><plain>Enumeration</plain></color>
\nBookCategory` alias) and `daxeno-00-kasu166` (package name
`<size:18>styled</size>`) render the tags literally instead of applying
them; the header/name creole path is `src/diagrams/class/
class-layout-header-creole.ts`, which already routes classifier NAME lines
through `buildLineAtoms`/`resolveMemberAtoms`
(`class-layout-header-creole.ts:29-40`'s own doc comment: "the SAME
`Display`/creole machinery member rows use") — daxeno is a PACKAGE name,
which may not reach this path at all; trace both against
`klimt/creole/legacy/CommandCreole*.java` before assuming one mechanism
covers both. (xamule) `xamule-03-jeda376`'s edge label
`<size:30>to Foo >` is measured at font-size 30 (verified correct since
2026-09-08) but rendered at the default size, with the tag printed
literally — `src/diagrams/class/class-edge-geo.ts:118-165` renders edge
labels via `applyGuillemet`/`splitDisplayLines`/`resolveTextEscapes`, none
of which resolve `<size:>`. (6) `lecelo-92-loma110`'s `<:name:>` icon
shorthand (`<:label:>`, `<:wrench:>`, `<:hammer_and_wrench:>` in a class
NAME string) draws 11 jar children vs our 4 — LOW confidence, mechanism
unresolved; this is distinct from T26's emoji/sprite/openiconic scope (A2b
E12) — do not conflate the two atom families. The report is a lead:
re-read the cited bodies before editing.

## Task

1. Instrument first (MEDIUM/LOW confidence): dump the jar SVG vs ours for
   `diseka-11-gozu390`, `daxeno-00-kasu166`, `xamule-03-jeda376`,
   `lecelo-92-loma110`. For each, name the origin `file:line` on BOTH
   sides. Journal the artifact (mechanism, origin, causal chain, ruled
   out) in `plans/class-divergence-drive/decision-journal.md` before any
   fix — do not skip to a patch on a guess.
2. TDD: write failing tests for all four fixtures against
   `test-results/dot-cache/class/<slug>/in.svg`.
3. Fix diseka/daxeno in `class-layout-header-creole.ts` — apply `<plain>`
   (drop bold/italic override) and `<size:>`/`<color:>` per the traced
   Java. If daxeno's package-name text does not reach this file, name the
   actual call site and fix there ONLY if it is still inside `src/diagrams/
   class/`; anything under `src/core/` outside this write-set is a stop-1
   halt with a journal row.
4. Fix xamule in `class-edge-geo.ts`/`renderer-edge.ts`/
   `class-edge-label-lines.ts`: resolve `<size:N>` into the rendered
   `<text font-size>` for the run it wraps, reusing the SAME per-run atom
   model member text already has, rather than a label-wide override.
5. lecelo (LOW): instrument only. If a confident mechanism emerges, fix it;
   otherwise journal the artifact and leave it named-but-open — do not
   force a fix on an unresolved LOW-confidence lead.
6. `npx tsx tools/render-diff.mts` on all four fixtures; record
   before/after in `.agent-notes/cdd-T25.md`.

## Read-set

`klimt/creole/legacy/CommandCreole*.java` (grep for `<plain>`/`<size:`
handling); `svek/SvekEdge.java:299-373` (edge label draw); `src/diagrams/
class/class-layout-header-creole.ts` (whole file, 123 lines); `src/
diagrams/class/class-edge-geo.ts:100-165`; `src/diagrams/class/
class-member-creole.ts:240-270` (the per-run atom model to reuse);
`diagnosis/A4-text.md` §5, §6; `fixtures.md` rows for the four slugs.

## Write-set

`src/diagrams/class/class-layout-header-creole.ts`, `class-edge-geo.ts`,
`renderer-edge.ts`, `class-edge-label-lines.ts`, their test files,
`.agent-notes/cdd-T25.md`, `plans/class-divergence-drive/
decision-journal.md` (append-only).

## Acceptance criteria

- Given `daxeno-00-kasu166`, when rendered, then `<size:18>` is applied to
  "styled" and not printed literally
- Given `diseka-11-gozu390`, when rendered, then `<plain>` is honoured and
  `#888888` is applied to "Enumeration"
- Given `xamule-03-jeda376`, when rendered, then the "to Foo" edge label
  has `font-size="30"` and the text reads "to Foo", not the literal tag
- Given `lecelo-92-loma110`, when diagnosed, then the journal names a
  mechanism artifact (fixed or explicitly left open)

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; `npx tsx
tools/render-diff.mts` on all four named fixtures before/after; hooks:
≤500-line files, ≤30 NLOC functions, CCN ≤10, ≤5 params.

## Boundaries

Always: instrument before hypothesizing on the MEDIUM/LOW items; cite
`file:line` on both sides before any patch. Ask first: any README stop
condition; editing a file outside `src/diagrams/class/`. Never: rebuild
the oracle cache (D12); fit a constant without a citation; conflate
lecelo's `<:name:>` shorthand with T26's emoji/sprite/openiconic atoms.

## Commit

`fix(cdd-T25): header/edge-label creole — plain, size, xamule`

Body: cites the traced `file:line` for diseka/daxeno/xamule; states
lecelo's disposition (fixed or journaled-open).
