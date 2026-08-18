# T1 — composite-a

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `docs/state-declared-size-diagnosis`.
Diagnosis-only mission (`decisions.md` ADR-2: `src/`, `tests/`, `oracle/`,
`scripts/` read-only; probes in `scripts_scratch/`, deleted before commit).
Read first: `README.md`, `decisions.md`, `findings/SCHEMA.md`,
`findings/PARTITION.md#composite-a` (your slice — authoritative over the preview),
`~/.claude/rules/diagnosis.md`, CLAUDE.md "READ THE JAVA FIRST".

## Slice (preview at d9f0ddda; T0's PARTITION.md wins)
`bajelo-54-dixe684`, `cupesu-59-sajo991`, `dapunu-39-kava045`, `decede-10-buvu414`, `duzazu-41-telu529`, `fotuje-06-fifa085`, `kinuca-03-nice683`, `lojeju-04-fadu517`, `nimana-36-veco708`, `nuvura-69-mafe604`

## Hints (verify, never inherit — ADR-4)
`state X { … }` composites — mostly ≤1 px singles plus −21/−28/−39/−41 px rows. ADR-4: re-verify `state-composite-autonom.ts:196-205` (faithful `SvekResult#calculateDimension` + `InnerStateAutonom#calculateDimensionSlow`, +15/+20/25) and the halted brief's `layout-ink-extent.ts:391` finding (a transition label's x folded into composite ink max-X) before citing either. Java: `svek/SvekResult.java#calculateDimension`, `svek/image/EntityImageState*.java`, `statediagram/`. duzazu-41/vixobo-14 also carry SI27 T1's `\t` fix + unported trailing-backslash line continuation (`.agent-notes/si27-t1-display-newlines-one-port.md`).

## Task
For every fixture in your slice: (1) read `test-results/dot-cache/state/<slug>/in.puml`
and the jar's `svek-N.dot` row(s) the harness paired; (2) reproduce ours with
a `scripts_scratch/` probe through the real pipeline (harness pattern:
`renderSync` + `WidthTableMeasurer` + `setLayoutInputObserver`); (3) open the
Java that produces the jar's number and OUR `file:line`; (4) write one SCHEMA
record (split `#a/#b` on distinct causes), reconciling every repeated |Δpx|
with `sharedCauseWith` across ALL buckets (SCHEMA rule 3); (5) set
`pairingRisk` honestly — if two nodes in the scope are close in size, say so.
`unresolved` + `nextStep` beats a guess.

## Write-set
`plans/state-declared-size-diagnosis/findings/composite-a.md` ONLY.

## Acceptance
- Given the slice, then every fixture has exactly one record (or #a/#b) with real `originFileLine` + `javaRef` and non-empty `ruledOut`.
- Given a repeated |Δpx| in the slice, then the records name each other or state why not.
- Given `git status`, then only `findings/composite-a.md` is new; `scripts_scratch/` is gone.
- Given `python3 findings/check-schema.py`, then your file contributes 0 violations.

## Observability / Rollback
N/A — docs only. Reversible.

## Report (≤1k tokens, no preamble)
Per fixture: status · mechanism (one line) · originFileLine · javaRef · Δ arithmetic;
cross-bucket `sharedCauseWith` claims; unresolved list with nextStep; judgment calls.
