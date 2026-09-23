# T24 — member/body creole: tree leading-space, guillemet, dividers, `~` strip

**Agent:** typescript-pro (sonnet) · **Depends on:** — · Worktree (batch-7
runs all five tasks in parallel).

## Context

Four independent gaps in the member-row/body text pipeline, all cited in
`diagnosis/A4-text.md` (HIGH confidence for 2a/4, MEDIUM for 7): (2a) a
tree-cell's leading space before a bold run is dropped — upstream
`klimt/creole/legacy/StripeTree.java:80-90` strips only `^\s*\|_`, leaving
`" **Bom(Model)**"`, and `DriverTextSvg.java:112-124` emits an NBSP
`<text>` for a whitespace-only run OR strips-and-advances-x for a
mixed-content run starting with a space; this port's
`class-body-enhanced.ts:156` (`buildTreeRun`) has a spurious `.trim()` with
no Java counterpart, and `class-member-creole.ts:351-367`
(`resolveOneAtom`) ports only the whitespace-only NBSP branch, not the
mixed-content one. (4) `klimt/creole/legacy/CreoleParser.java:175-176`
(`manageGuillemet`) runs on every creole line upstream; `src/core/text/
Guillemet.ts` exists and is used for stereotypes/edge labels but
`buildMemberAtoms` (`class-member-creole.ts:252-263`) never calls it. (7)
`focaci-80-suzu938`: a `~role` label loses its `~` in the jar
(`"~* initiators"` → `* initiators`, no icon) but keeps it here — the
strip site is unpinned (MEDIUM); if it turns out to live on the
`class-edge-geo.ts` render path (edge/role label, not member text), file a
`decision-journal.md` row and hand it to T25 rather than editing outside
this write-set. The report is a lead: re-read the cited bodies before
editing.

## Task

1. TDD: write failing tests for `foxiki-17-kosa114` (tree run, missing
   `<text>\xa0</text>`), `juxora-90-fisu720` (same family, ×2),
   `padapo-73-beke177` (guillemet), `sejuzo-42-fini523` (divider Y offsets),
   `focaci-80-suzu938` (`~` strip) against
   `test-results/dot-cache/class/<slug>/in.svg`.
2. Drop the spurious `.trim()` at `class-body-enhanced.ts:156`; add the
   mixed-content leading-space-to-x branch to `resolveOneAtom`
   (`class-member-creole.ts:351-367`), mirroring `DriverTextSvg.java:
   112-124`'s two branches. Land BOTH changes in the same commit — either
   alone regresses the other case (A4 2a fix-shape note).
3. Call `applyGuillemet` (`src/core/text/Guillemet.ts`) inside
   `buildMemberAtoms` (`class-member-creole.ts:252-263`) before
   classification, matching `manageGuillemet`'s every-line application.
4. Instrument `sejuzo-42-fini523`: dump `measureGenericClassifier`'s
   `dividerYs` against the leading inline `[[url]]` atom in
   `class-layout-generic-classifier*.ts` — the report names this a probable
   G2-ledger-N67 lead, not a proven mechanism. Journal the artifact
   (mechanism, origin, causal chain, ruled out) before fixing.
5. Instrument `focaci-80-suzu938`: locate where a role/cardinality label's
   `~` visibility-like prefix would be stripped (`CommandLinkClass`'s
   `Display` construction is the Java lead). If the strip site is inside
   this task's write-set, fix it; if it is on the edge-label render path
   (T25's files), journal the finding and hand off — do not edit outside
   the write-set (stop 1).
6. Re-run `npx tsx tools/render-diff.mts` on all five named fixtures;
   record before/after structural counts in `.agent-notes/cdd-T24.md`.

## Read-set

`klimt/creole/legacy/StripeTree.java:80-90`; `klimt/creole/legacy/
StripeSimple.java:272-293`; `klimt/drawing/svg/DriverTextSvg.java:112-124`;
`klimt/creole/legacy/CreoleParser.java:175-176`; `text/Guillemet.java:
78-88`; `src/diagrams/class/class-body-enhanced.ts:140-170`; `src/diagrams/
class/class-member-creole.ts:240-270,340-375`; `src/core/text/
Guillemet.ts`; `diagnosis/A4-text.md` §2a, §4, §7.

## Write-set

`src/diagrams/class/class-member-creole.ts`, `class-body-enhanced.ts`,
`class-layout-generic-classifier.ts`, `class-layout-generic-classifier-
sections.ts`, `class-layout-generic-classifier-types.ts`,
`class-layout-helpers.ts`, their test files, `.agent-notes/cdd-T24.md`,
`plans/class-divergence-drive/decision-journal.md` (append-only).

## Acceptance criteria

- Given `foxiki-17-kosa114`, when rendered, then the NBSP `<text>` is
  present and `" prop"` still has NO leading space (both branches land
  together)
- Given `juxora-90-fisu720`, when rendered, then it is survey-conformant
- Given `padapo-73-beke177`, when rendered, then `«NotNull»` appears
  (guillemet applied in member text)
- Given `sejuzo-42-fini523`, when rendered, then the two tree dividers sit
  at y=43 and y=65
- Given `focaci-80-suzu938`, when diagnosed, then either it is fixed with a
  named mechanism or a journal row hands it to T25

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; `npx tsx
tools/render-diff.mts` on all five named fixtures before/after; hooks:
≤500-line files, ≤30 NLOC functions, CCN ≤10, ≤5 params.

## Boundaries

Always: read the Java method body before stating why anything differs;
land the 2a pair together. Ask first: any README stop condition. Never:
rebuild the oracle cache (D12); edit outside the write-set (stop 1); fit a
constant without an upstream citation; run state-mutating git beyond this
task's own commits in the worktree.

## Commit

`fix(cdd-T24): member/body creole — tree space, guillemet, dividers`

Body: names the four sub-mechanisms and cites their `file:line`; states
whether focaci was fixed or handed off.
