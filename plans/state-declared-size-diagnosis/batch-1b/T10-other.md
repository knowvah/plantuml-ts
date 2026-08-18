# T10 — other

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `docs/state-declared-size-diagnosis`.
Diagnosis-only mission (`decisions.md` ADR-2: `src/`, `tests/`, `oracle/`,
`scripts/` read-only; probes in `scripts_scratch/`, deleted before commit).
Read first: `README.md`, `decisions.md`, `findings/SCHEMA.md`,
`findings/PARTITION.md#other` (your slice — authoritative over the preview),
`~/.claude/rules/diagnosis.md`, CLAUDE.md "READ THE JAVA FIRST".

## Slice (preview at d9f0ddda; T0's PARTITION.md wins)
`bunade-42-fudu910`, `fovafu-44-mifu394`, `nimise-04-jove070`, `tubojo-49-tudu915`

## Hints (verify, never inherit — ADR-4)
no label matched: bunade-42 (−0.16 px), fovafu-44 (11), nimise-04 (4), tubojo-49 (6). Read each `in.puml` first and re-label in `bucketLabel` if a real category emerges.

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
`plans/state-declared-size-diagnosis/findings/other.md` ONLY.

## Acceptance
- Given the slice, then every fixture has exactly one record (or #a/#b) with real `originFileLine` + `javaRef` and non-empty `ruledOut`.
- Given a repeated |Δpx| in the slice, then the records name each other or state why not.
- Given `git status`, then only `findings/other.md` is new; `scripts_scratch/` is gone.
- Given `python3 findings/check-schema.py`, then your file contributes 0 violations.

## Observability / Rollback
N/A — docs only. Reversible.

## Report (≤1k tokens, no preamble)
Per fixture: status · mechanism (one line) · originFileLine · javaRef · Δ arithmetic;
cross-bucket `sharedCauseWith` claims; unresolved list with nextStep; judgment calls.
