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
