# T2 — F3: EXPANSION_* rankdir sizes (G7) + `hide empty description` (G9)

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
SI28 records: `plans/state-declared-size-diagnosis/findings/pseudo-state.md`
(bujuta-44, mimaga-15, nijugi-19, rinisi-79 = G7; bitaxo-18 = G9). Read them,
`decisions.md`, `SYNTHESIS.md` §1 G7/G9, and CLAUDE.md.

## Task
1. G7: `buildLeafNode` (`src/diagrams/state/state-leaf-node.ts:44`) declares
   EXPANSION_INPUT/OUTPUT at 12×12 via `BORDER_POINT_SIZE`; the jar's
   `EntityPosition.getDimension(Rankdir)` (`EntityPosition.java:120-128`)
   swaps 12×48 / 48×12 by rankdir. Port that read; fix the falsified comment
   at `state-entity-position.ts:110-112`.
2. G9: `hide empty description` is not threaded to the composite-pipeline
   leaf (`state-leaf-node.ts:65`) — jar sizes such a leaf as
   `EntityImageStateEmptyDescription` (50×40, `GeneralImageBuilder.java:135-136`,
   `EntityImageStateEmptyDescription.java:45-58`) not 50×50. Thread the flag.
3. Tighten `oracle/goldens/state/size-backlog.json` /
   `tests/oracle/dot-parity-backlog-data.ts` for the five fixtures; run the
   harness on them (`npx jiti scripts/measure-composite-declared-size.ts <slugs>`).
TDD: unit tests first (`tests/unit/state/state-leaf-node.test.ts`), using the
five fixtures' `in.puml` from `test-results/dot-cache/state/<slug>/`.

## Write-set
`src/diagrams/state/state-leaf-node.ts`, `state-composite-pass.ts`,
`state-entity-position.ts`, `tests/unit/state/state-leaf-node.test.ts`,
ratchet entries for the five fixtures.

## Read-set
`findings/pseudo-state.md` (all records); `state-leaf-node.ts` (whole);
`state-entity-position.ts:90-130`; `state-composite-pass.ts` (leaf build
path); Java `EntityPosition.java:100-135`, `EntityImageStateBorder.java`,
`GeneralImageBuilder.java:120-150`, `EntityImageStateEmptyDescription.java`.

## Acceptance
- Given `<<expansionInput>>` under rankdir TB, then declared 48×12 (LR: 12×48) — cite `EntityPosition.java:120-128`.
- Given `hide empty description` and a composite-pipeline leaf, then it declares 50×40.
- Given the five fixtures, when the harness runs, then their rows are exact and `harness-diff.py` reports 0 rows appeared or grew.
- Given `render-manifest --diff`, then only those five fixtures move.

## Observability / Rollback
Harness rows; DOT-parity ratchet. Reversible.

## Report (≤500 tokens)
Rows exact per fixture; ratchet entries removed; any residual.
