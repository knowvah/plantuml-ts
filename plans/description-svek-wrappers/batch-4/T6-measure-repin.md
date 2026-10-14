# T6 — measure b4 and re-pin

**Agent:** orchestrator. Runs after the batch-3 close (whose survey is `b3-eng`).

## Write-set
- `oracle/goldens/svg-description/{ratchet.json,diff-baseline.json,component/**,usecase/**}`
- `tests/oracle/svg-conformance/census-component.json`, `census-usecase.json`
- the unknown-bucket ratchet/pins that hold DESCRIPTION rows (find with
  `grep -rl '"unknown"' oracle/goldens/*/ratchet.json`)
- `oracle/goldens/svg-conformance/layout-parity-baseline.json` (grow only)
- `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json` and the gate tests' count
  constants, **only** if a pin needs routing/refusal twin rows
- `oracle/accepted-divergences.json` (**retirements only**, stop 10)
- `measurements/**` (including a `pin-description.mts` tool if none exists; `plans/class-divergence-drive/tools/pin-goldens.mts`
  is class-only, so copy its shape)
- `decision-journal.md`, `fixtures.md` (b4 column), `docs/parity-report.md`, `docs/catalog.md`

## Steps (D7)
1. Use `measurements/b3-eng/` as b4 (no code changed since). Diff every engine against `b0-eng`:
   conformant losses = 0 (stop 4); every mover journaled.
2. **Pin** every description-family row that is survey-conformant AND render-diff 0/0.
   - Find how the existing 51 pins were made (`git log --format=%h\ %s -- oracle/goldens/svg-description/ratchet.json | head`)
     and reuse that path.
   - Grow `layout-parity-baseline.json` with every newly layout-equal row in the D3 population.
3. **Census.** Re-run census for component/usecase. List every attr that moved **away** from the jar and
   every element-count growth ([[census-away-from-jar-catches-hidden-regressions]]). Each needs a
   mechanism or it is stop 6.
4. **Diff-baseline.** Re-measure. `git diff` the baseline JSON: any pin that **rose** needs a mechanism
   ([[repin-script-raises-preexisting-red-pin]], [[weightedscore-can-rise-on-a-correct-fix]]).
5. Retire any accepted-divergence entry that is now conformant.
6. Run all four gates; then `npm run parity:dashboard` and commit.
7. Commit `chore(dsw-b4): re-pin description family — <pins before> -> <after>`. The body gives the
   survey counts b0 → b4, pin counts, census away-from-jar list (empty or explained) and diff-baseline
   rises (explained).

## Acceptance
- Given the b4 survey vs b0, then conformant losses = 0 in every engine.
- Given the description ratchet after re-pin, then it holds only byte-identical rows, and it grew
  (or the journal says why not).
- Given the census and diff-baseline diffs, then every away-from-jar move and every rise carries a
  journal mechanism.

**Observability:** the re-pin is the SLI checkpoint. **Rollback:** Reversible (goldens revert with the merge).
