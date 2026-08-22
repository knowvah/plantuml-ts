# test-budget-invariant T5 — verify, correct the published claim, close out

Write-set honored: this note, `plans/test-budget-invariant/README.md`,
`plans/stdlib-lock-sharing/README.md` (correction only), and
`planning/next-missions.md`. No `src/`, no test file, no
`vitest.config.ts` touched. No git write command run (orchestrator
commits).

## Observation: SI36's close-out and `next-missions.md` both omitted hold time

- **Context**: Reviewing the "provably over-provisioned" claim about the
  120,000 ms `LOCK_PRESSURE_BUDGET_MS` value before correcting it.
- **Finding**: SI36's close-out (`plans/stdlib-lock-sharing/README.md`)
  computed "~9x slack" from max **wait** alone (12,818 ms) against the
  120,000 ms ceiling. It never added hold time. That same mission's own
  T4 measured a max **hold** of 20,029 ms
  (`.agent-notes/lsh-T4.md`, concurrent-pair "after" row, `maxHoldMs`).
  A lock-using test's budget must cover wait + hold: 30,000 + 20,029 ≈
  50,000 ms legitimate worst case, so 120,000 ms is ~2.4x margin, not
  ~9x. `planning/next-missions.md` item (b) repeated the same
  uncorrected framing.
- **Impact**: Both documents corrected in place, dated 2026-08-22,
  attributed to `test-budget-invariant`, original text left visible
  (not deleted) per the task's explicit boundary. This matches D3's own
  locked reasoning, which was already correct — the two prior missions'
  documents were the ones lagging.
- **Confidence**: High — the arithmetic and the source figures
  (`.agent-notes/lsh-T4.md`) are directly quoted, not re-derived.

## Observation: 4 real concurrent pairs, mission's target defect: 0/8

- **Context**: Verifying T1's fix under real concurrency, per the task's
  §1c requirement (>=3 pairs, `COVERAGE_ISOLATE=1` on both members).
- **Finding**: Ran 4 pairs (8 processes) sequentially, settling load
  before each launch. Neither the `stdlib-packages.test.ts:428`/`:429`
  "Test timed out in 5000ms" signature nor
  `Timed out after 30000ms waiting for the stdlib build lock` appeared
  in any of the 8 logs, even in the two trials that reached the highest
  load this mission measured (post-run load1 70.70 and 91.27). Full
  trial table and quoted signatures are in the mission README's
  Close-out section.
- **Impact**: The mission's target defect did not recur under the
  heaviest concurrency this session produced. Not proof it cannot recur
  — see the README's "Limits of this evidence" — but the strongest
  evidence this session could produce.
- **Confidence**: High for "did not occur in this sample" (grep-verified
  across all 8 raw logs); explicitly not claimed as proof of absence.

## Observation: a third, previously undocumented 5,000ms-timeout signature

- **Context**: Reading trial 3 and trial 4's FAIL output in full rather
  than only grepping for the two known signatures.
- **Finding**: `tests/oracle/svg-conformance/sequence.diff-baseline.
  ratchet.test.ts:226` (fixture `sequence/zudize-61-vomi445`) failed with
  `Error: Test timed out in 5000ms` in 3 of 8 processes (trial3-B,
  trial4-A, trial4-B), always the same fixture. Confirmed by reading the
  file: no lock import, no `acquireBuildLock`/`withStdlibBuildLock`
  reference, and no per-test timeout override — it inherits vitest's
  unconfigured 5,000 ms default across 1,141 per-fixture `it()` blocks.
  This is the same general D5-class shape (CPU-bound, unlocked test
  racing an unconfigured default under load) as `catalog.test.ts`, but at
  a file this mission's D1–D5 never named.
- **Impact**: Genuine new finding, out of this mission's write-set (T5
  writes no test files) and outside D1's scope (D1 binds only
  lock-acquiring tests). Recorded in the mission README's Close-out and
  Residuals sections as a follow-on candidate for a future mission —
  deliberately not investigated further or fixed here.
- **Confidence**: High that the signature and file:line are correct
  (grep-verified, file read directly). Medium on "same mechanism as
  D5" — plausible from the structural similarity (unlocked, CPU-bound,
  unconfigured default, per-fixture `it()` loop) but not independently
  measured the way T2 measured `buildCatalog()`'s standalone cost.

## Quality gates (this session, settled-machine readings)

- `npm test` (measurement run, separate from the 4 concurrent trials) —
  load before: 7.99/24.64/26.18, `mds_stores` 0.5%, other four daemon
  families 0.0%. Exit 0, 630 passed | 1 skipped (631 files), 16,089
  passed | 2 skipped | 1 todo, coverage 95.44/90.47/96.95/96.53. Vitest
  `Duration 63.51s`, wrapped `time` real 1:04.54 (64.54s).
- `npm run typecheck` — exit 0 (both tsconfigs).
- `npm run lint` — exit 0.
- `npm run build` — exit 0; `grep -c "error TS"` = 0; exactly the 3
  pre-existing TS2591/TS2503 notes in
  `src/core/include-resolver-node.ts`.
- `git diff --name-only main..HEAD -- src/` → empty.
- render-manifest vs baseline → "OK: 0 expected moves, 0 unexpected"
  over 3,158 fixtures.

## Scope confirmation

- Write-set: `plans/test-budget-invariant/README.md` (Close-out section
  + Batch 3 ticked), `plans/stdlib-lock-sharing/README.md` (inline
  correction only, original text preserved), `planning/next-missions.md`
  (item (b) status corrected), this note.
- `git status --short` before commit shows only those files modified
  plus this note (untracked).
- No git write command run.
