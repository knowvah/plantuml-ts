# Decision journal — `linetype-ortho-routing`

Append one row per non-trivial judgment call made during execution.
"Non-trivial" means: a reasonable developer might have chosen differently.

Two lessons from the previous mission's journal are worth reading first.
(1) A task agent refused an orchestrator instruction twice and was right both
times — brief the measurement, not the conclusion, and say "report if you
disagree". (2) That mission's incremental re-pin scripts only wrote fixtures
whose score ROSE, leaving most pins stale between commits; T8 re-pins
unconditionally for exactly that reason.

| Date | Task | Decision | Rationale | Flagged for review |
|---|---|---|---|---|
| 2026-09-03 | T0 | Pin `bbW`/`bbH` as `layoutGraph()` canvas size, and add a `passes[]` array beyond the flat contract | The contract named one scalar pair per fixture, but the two state fixtures run two layout passes each and ortho routing moves both. A single scalar would have hidden a per-pass regression — the exact aggregate-blindness T0 exists to prevent. Contract extended additively, so T8 still reads `bbW`/`bbH`. | no |
| 2026-09-03 | T0 | Pin `kejabo-83-vinu490`'s composite declared-size delta (`+0.749952 px`) too, though the brief asked only for `pavuzo`'s | It is the other state fixture and the only other one with a `size-backlog` entry, so T8 needs a before-value for it. Its sign is OPPOSITE pavuzo's and it is the polyline fixture; there is no prediction on record for it. Pinned as an instrument, explicitly NOT as a target. | no |
| 2026-09-03 | orchestrator | Follow each task file's `Test Files` == 685, not README stop condition 10's 684 | The two disagree. 684 is the pre-Batch-1 count; T1 adds `tests/unit/core/dot-splines.test.ts`, so 685 is arithmetically required from T1 onward and every task file says 685. Halting on a bookkeeping conflict would be a false stop. The README figure is stale from planning, not a constraint that was violated. | yes — README §Exit bar and stop condition 10 both still say 684 and should be corrected to 685 at close |
| 2026-09-03 | T1 | Accept the agent's out-of-write-set edit to `docs/catalog.md` | It is generated and drift-gated (`npm run catalog`, `tests/architecture/catalog.test.ts`); adding a `src/core/` module necessarily changes it and `npm test` fails without it. CLAUDE.md designates it generated, never hand-edited. The agent flagged it rather than silently expanding scope, which is the correct behavior. Not stop condition 7: no other task owns it, and the alternative is an unpassable gate. | no |
| 2026-09-03 | orchestrator | Resolve the apparent T4/T5/T6 contradiction ("do not re-pin" vs "all four gates green") by measuring what the pins actually assert, rather than letting an agent discover it mid-task | The task files read as contradictory if Batch 2 moves geometry that pinned tests compare. Measured instead: the 8 have no full-SVG goldens, appear in no diff-baseline, `size-backlog` gates node SIZE (unmoved by routing), and `routing`/`refusal` baselines pin diagram-type/refusal, not geometry. So the gates genuinely cannot see the change until T7 — the contradiction is apparent, not real. Full artifact `.agent-notes/lor-containment.md`. | no |
| 2026-09-03 | orchestrator | Confirm the 8-fixture containment claim independently before Batch 2, not at T8 | The mission's whole risk profile is "verified one, inferred seven", and stop condition 1 is unfalsifiable without knowing the true set. `grep -rl "splines=" oracle/goldens/` returns exactly the 8 across 1,865 golden dirs. The inference is now a measured fact about the golden corpus. | no |
