# T6b — the creole seam; migrate every label; delete `sequence-creole.ts`

Agent: `typescript-pro` (opus), worktree `sdd2-T6b`. Commit:
`refactor(sequence): size and draw labels through core creole`.
Read [../task-contract.md](../task-contract.md) and `$M/b6a-probe.md`
first. This is one agent because the interface change and all its call
sites must stay consistent (parallelism rule).

## Task
1. New `sequence-creole-sheet.ts` mirroring `activity-creole-sheet.ts`:
   label `Display` → core `DisplayCreole` → SheetBlock1/2 → `LabelBlock`
   (batch overview contract). `@see` `AbstractTextualComponent.java:84-90`,
   `Display.java:644-701`.
2. Migrate every label call site to it. Today's importers of
   `sequence-creole.ts`: `layout.ts`, `ref-body-geo.ts`, `sequence-delay
   .ts`, `sequence-block-align.ts`, `sequence-layout-divider.ts`,
   `sequence-creole-text-atom.ts`, `sequence-layout-note.ts`,
   `sequence-layout-frame.ts`, `sequence-layout-box.ts`,
   `sequence-layout-ref.ts`, `sequence-layout-message.ts`,
   `sequence-layout-participant-label.ts`, `sequence-layout-exo.ts`,
   `text-block-geo.ts` (re-grep at start; the probe report lists them).
   `sequence-text.ts` draws the primitives.
3. Delete `sequence-creole.ts` and `sequence-creole-text-atom.ts` once
   nothing imports them (memory `delete-archived-code`).
4. Core creole edits: additive only (stop 8). If core lacks something the
   jar does, port it additively under `src/core/klimt/creole/` and cite it.

## Targets
Research D clusters A (vector atoms: sprites/OpenIconic/emoji, 56), M
(`==` line, 5), R (table, 2), S (tree, 2), T (decoration lines, 2), V
(`<back:>` filter, 1), W (`<code>`, 1), X (list header, 1); the T6a probe's
expected-results list. Activity's ratchet must stay green.

## Write-set
New `src/diagrams/sequence/sequence-creole-sheet.ts`; `text-block-geo.ts`,
`sequence-text.ts`, `sequence-creole.ts` + `sequence-creole-text-atom.ts`
(delete), and each call site listed above; additive files under
`src/core/klimt/creole/` if needed; tests (move or rewrite the deleted
modules' tests against the seam).

## Read-set
`$M/b6a-probe.md`; `research/research-d-structure.md` §1 and the
cross-cutting note; `activity-creole-sheet.ts` (whole);
`core/klimt/creole/DisplayCreole.ts`; `sequence-creole.ts`;
`text-block-geo.ts`.

## Acceptance
- Given the migration, then no file imports `sequence-creole.ts` and it is
  deleted.
- Given every pinned fixture (all engines), then none changes.
- Given clusters A, M, R, S, T, V, W, X, then their structural sites are
  gone (each row zero-diff or its remainder journaled to a family).
- Given the sequence survey wall-clock, then ≤ 1.5× b0 (stop 17).

## Added at T6a hand-back (journal row 76)
Seam shape and call sites: `measurements/b6a-probe.md` §6. Use a FontSpec-aware `sequenceStringBounder` — core `MeasurerStringBounder` drops BOLD for weight-aware measurers (`src/core/measurer-bounder.ts:27-30`); do not change the core one. Probe patches (reference, never apply — D2 spirit): `/private/tmp/claude-501/-Users-scottseely-git-knowvah-plantuml-ts/303eb6e3-f3cf-4737-80a1-e4f9d9cbec55/scratchpad/t6a/seam-src.patch`.

## Added at T5d hand-back (journal row 77)
`sequence-note-width.ts` duplicates `sequence-layout-note.ts#noteBodyRuns` block-width computation; when notes move to the creole seam, make both read one measurement.
