# T6a — parity probe: plain sequence labels through core creole

Agent: `typescript-pro` (opus), worktree `sdd2-T6a` (scratch; no commit to
`src/`). The orchestrator commits the report:
`docs(sdd2-T6a): core creole parity probe for sequence labels`.
Read [../task-contract.md](../task-contract.md) first.

## Question
If every sequence label were measured and drawn through core
`DisplayCreole` / SheetBlock (as `activity-creole-sheet.ts` does), would
the 419 + B1–B5 pinned fixtures stay byte-identical? Pinned fixtures use
plain text, so any delta is a mismatch between the two paths that T6b would
introduce.

## Method
1. In a scratch copy of `src/` (as research C did — see
   `prototypes/measure.mts`), build the narrowest seam that routes the
   label text of messages, notes, participants, groups, refs, dividers,
   delays and box titles through core, mirroring `AbstractTextualComponent
   .java:84-90` and `activity-creole-sheet.ts`.
2. Render every pinned fixture on the ratchet path; diff against
   `in.svg`. Then all 1141 rows: list falls and rises per research D
   cluster.
3. For every pinned delta: diagnosis artifact (which primitive, which
   path, the Java that decides it).
4. Record sequence render wall-clock vs the current branch (stop 17
   reference).

## Write-set
`plans/sequence-divergence-drive-2/measurements/b6a-probe.md` (+ a scratch
directory outside the repo).

## Acceptance
- Given the probe, then the report states: pinned rows identical (N/N), or
  each delta with its diagnosis artifact — undiagnosed delta = stop 7.
- Given all rows, then falls/rises per cluster are listed (expected-results
  list for T6b).
- Given the report, then it names the seam shape T6b should build
  (functions, where it plugs in) and every call site.
