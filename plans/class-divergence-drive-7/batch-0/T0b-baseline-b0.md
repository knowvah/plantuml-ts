# T0b: baseline b0 and the D10 target

Agent: orchestrator. Needs T0a.

**Task.**
1. Four gates on the branch (README). Load < 8.
2. Survey all 28 engines into `measurements/b0-eng/parity-<e>.json` (the class and
   unknown files also to `tests/oracle/svg-conformance/parity-{class,unknown}.json`),
   census class, `render-all --tree all` → `measurements/b0.json`. 0 timeouts.
3. Diff against cdd6's `plans/class-divergence-drive-6/measurements/final-eng/` and
   the committed parity files: expect 0 verdict/`dotEqual` movers (nothing has
   changed but records). Journal any mover with its mechanism; an unexplained one
   is stop 4/5 before any code is touched.
4. Fill `fixtures.md`'s `verdict (b0)` / `dotEqual` columns from b0.
5. Journal the D10 target: b0 CLASS conformant (both trees, CLASS-routed) + the 9
   scheduled fix rows + rojida = 984 expected; state the derivation.
6. Commit `chore(cdd7-b0): baseline — <CLASS conformant>, target <n>`.

**Write-set:** `measurements/b0*`, `fixtures.md`, `decision-journal.md`,
`tests/oracle/svg-conformance/parity-{class,unknown}.json`, `README.md` (starting
counts if they moved).

**Acceptance.**
- Given b0, then survey, census and render-all agree on every CLASS row.
- Given b0-eng vs cdd6 final-eng, then 0 verdict movers in any engine.
- Given the journal, then it holds the target and its derivation.

**Observability:** N/A. **Rollback:** Reversible.
