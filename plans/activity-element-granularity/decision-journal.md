# Decision journal — `activity-element-granularity`

Append one row per non-trivial judgment call made during execution.
"Non-trivial" means: a reasonable developer might have chosen differently.

Two rows from the previous mission's journal are worth reading first: a task
agent refused an orchestrator instruction twice and was right both times.
Brief the measurement, not the conclusion, and say "report if you disagree".

| Date | Task | Decision | Rationale | Flagged for review |
|---|---|---|---|---|
| 2026-09-03 | T0 | Ran the census as an orchestrator SCRATCH script, not a committed `scripts/` entry | T0's write-set is the pin + the note; `scripts/` is in no task's write-set, and adding one would trip the write-set gate. `element-baseline.json`'s own `$comment` plus `.agent-notes/aeg-T0.md`'s "How to re-measure" fully specify the algorithm, and T4 re-runs the same file. | no |
| 2026-09-03 | T0 | Censused `tspan` even though the README's element table omits it | T0's spec lists eleven tags; `tspan` is one. It is not decoration: we emit 249 and the jar 0, which is the `text` −522 seen from the other side, and it gives T3 a second counter. Recorded that `tspan == 0` is NOT T3's bar — D3 keeps creole `<tspan>` within a line. | no |
| 2026-09-03 | T0 | Committed the mission brief in its own commit ahead of T0 | `plans/` is in no task's write-set, so folding it into T0's commit would fail the `git diff --name-only HEAD~1` gate. Kept `.agent-notes/coverage-audit-2026-09-02.md` (previous mission's artefact, untracked at branch cut) out of this branch entirely rather than accumulating unrelated files. | no |
| 2026-09-03 | T1 | Executed T1 in the orchestrator rather than dispatching the `opus` agent the batch table names | Batch 1 is explicitly SEQUENCED, so there is no parallel bottleneck for an agent to relieve (`~/.claude/rules/parallelism.md`), and the orchestrator already held T1's entire read-set from T0 — a dispatch would re-pay the full prompt cost for one call site. Same reasoning applied to T2 before the halt. | no |
| 2026-09-03 | T1 | HALTED instead of proceeding to T2/T3 and letting T4 adjudicate | The brief expects T4 to "name every riser"; 207 of 268 rising with the aggregate up 7.0% is categorically different from a riser list. The mission's instrument is anti-monotone for the whole CLASS of change all three swaps make, so T2 and T3 would add work that cannot pass the exit bar and cannot be committed under a red gate. The instrument question must be settled before more is layered on. | **YES** |
| 2026-09-03 | T1 | Preserved T1 on `wip/aeg-T1-measured-halt` rather than leaving a dirty tree or discarding it | The brief requires all four gates green before any commit lands, so T1 cannot land on the mission branch; but it is a faithful port with a verified `Worm.java:134-183` citation and must not be lost. The wip branch keeps the mission branch gate-green and the work recoverable. | no |
| 2026-09-03 | T1 | Amended `decisions.md` with D10 even though `plans/` is in no task's write-set | Stop condition 3 instructs exactly this: "amend the decision here and halt for review — do not silently override". Committed separately from any source change. | no |
