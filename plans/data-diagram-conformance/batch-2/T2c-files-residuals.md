# T2c — files residuals: every row not byte-exact after T1b

Agent: `typescript-pro` (sonnet, effort high), worktree `ddc-T2c`. Commit:
`fix(files): <families closed> (T2c)`. Read [../task-contract.md](../task-contract.md),
[../decisions.md#d3](../decisions.md) and `fixtures.md`'s b1 residual list
first. Diagnosis mode per row family: mechanism + `file:line` before the edit.

## Task
For every files row (8 corpus, `files-directory-tree-with-note`, the 4
`lengthadjust/files-*`, every T1f authored row) with diffs at the b1 close:
`npx tsx $T/diff-one.mts files <slug>`, group by firstDiff family, trace each
family to the Java (`FEntry.java`, `FilesListing.java`, `FilesDiagram.java`,
`Opale.java`, `SheetBlock1.java`, `AtomEmoji.java`, `plantuml.skin`) and fix
at the origin. Expected families (from the T1b hand-back): note sheet
padding/margins, emoji baseline (`AtomEmoji.java:62-64` `-3 * factor`),
`textLength` on emoji-prefixed text, title/caption chrome, `<style>`
colours. A family whose origin is `src/core/` is reported (stop 1), not
patched in `src/diagrams/files/`.

## Write-set
`src/diagrams/files/*`, `tests/unit/files/*`.

## Acceptance
- Given every files row named in the b1 residual list, when `diff-one.mts files <slug>` runs, then 0 diffs — or the hand-back names the row, its mechanism, origin and why it is outside the write-set.
- Given each fixed family, then a unit test cites the Java line and asserts the specific value.
- `npx vitest run tests/unit/files tests/oracle/svg-conformance/files.*.ratchet.test.ts tests/oracle/svg-conformance/extensions.ratchet.test.ts --maxWorkers=2 --coverage.enabled=false` green.

Observability: N/A. Rollback: Reversible.
