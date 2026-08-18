# T0 — Harness attribution + baselines

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `fix/state-declared-size`.
The declared-size harness `scripts/measure-composite-declared-size.ts` pairs
nodes within a scope by SORTED value per axis (doc at `:20-40`). SI28's
METRIC-AUDIT (`plans/state-declared-size-diagnosis/findings/METRIC-AUDIT.md`
§2-§3) proved sorted pairing is already the error-minimising bijection on all
205 scope-instances (no reported Δ can change) and proposed **Candidate B**:
pair by DECLARATION order after filtering `shape === 'point'` nodes on BOTH
sides (real-node counts align 1:1 everywhere). Read that file, the harness
(whole), `tests/oracle/svek-dot.ts#parseSvekDot`, and
`.agent-notes/si28-state-declared-size-observations.md` (why an id-pattern
filter is wrong: jar's `[*]` is `shape=circle`, anchors are bare `zaent0003`).

## Task
1. Implement Candidate B in the harness: per scope, take both node lists in
   declaration order, drop `shape==='point'` on both sides, pair by index;
   `idx` in the row becomes that declared position. Keep `--mismatched-only`
   and the summary line shape unchanged. If real-node counts differ for a
   scope, report the fixture `unmatched` (as today for node-count mismatch).
2. Prove counters identical: run before/after and show
   `fixtures 272, declarations 2654, exact 2481, mismatched 144, lastDigitOnly 29,
   unmatched 4, dirty 79`, and that the multiset of `(fixture, scope, axis, ours,
   jar)` per row is unchanged (only `idx` may differ). Report both.
3. Write `plans/state-declared-size-fix/scripts/harness-diff.py <baseline> <now>`
   (stdlib): rows keyed by `(fixture, scope, axis, idx)`; prints
   `OK: N rows went exact, 0 rows appeared or grew` and exits 0 when every
   row in `now` exists in `baseline` with |Δ| ≤ baseline |Δ|; otherwise lists
   offenders and exits 1. Also print per-fixture counts.
4. FIRST copy SI28's original baseline aside for T20:
   `cp test-results/state-declared-size-baseline.jsonl test-results/state-declared-size-baseline.si28.jsonl`
   (sha must be `b790fabc…505e0`; if the file is missing, regenerate it at
   the branch point BEFORE your harness change and verify the sha). Then pin
   `test-results/state-declared-size-baseline.jsonl` (two runs, `cmp`
   silent) and `npx jiti scripts/render-manifest.ts --out
   test-results/render-manifest-baseline.json`. Report both sha256s.

## Write-set
`scripts/measure-composite-declared-size.ts`,
`plans/state-declared-size-fix/scripts/harness-diff.py`, the two gitignored
baselines + the `.si28.jsonl` copy and `test-results/render-manifest-baseline.si28.json` (also copy the manifest baseline aside). Nothing else.

## Read-set
Harness (whole); `tests/oracle/svek-dot.ts:1-120`; METRIC-AUDIT §2-§3, §6;
`src/core/graph-layout.ts` `DotInputGraph`/`DotInputNode` types.

## Acceptance
- Given the corpus, when the harness runs after the change, then the summary counters and the per-row `(ours, jar, Δ)` multiset are byte-for-byte those of SI28's baseline; only `idx` semantics change.
- Given a scope, when nodes pair, then pairing is declaration order after a `shape==='point'` filter applied to both sides.
- Given two consecutive runs, then outputs are byte-identical and both baselines are pinned.
- Given `harness-diff.py baseline baseline`, then it prints `OK: 0 rows went exact, 0 rows appeared or grew`; given a synthetic row with a larger |Δ|, then it exits 1 naming it.

## Observability / Rollback
The harness IS the SLI. Reversible (script + gitignored files).

## Report (≤600 tokens)
Before/after counters; proof of unchanged (ours,jar) multiset; sha256s; any
scope where real-node counts differ under Candidate B (expected: none).
