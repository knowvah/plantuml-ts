# Decision journal — test-budget-invariant

| When | Task | Decision | Why | Evidence |
|---|---|---|---|---|
| 2026-08-22 | — | Both PlantUML blocks in `diagrams/budget-invariant.md` verified to parse and render through this repo's own `renderSync()` before briefing | CLAUDE.md requires generated diagrams to actually parse, not merely look right; no viewer renders them in-repo | `d0.puml` ok 7048 bytes, `d1.puml` ok 6071 bytes |
| 2026-08-22 | — | Brief committed under `plans/` rather than gitignored, contrary to the plan-mission skill's template | `.gitignore` ignores `.claude/` only; SI35/SI36 briefs are tracked in git. Repo practice outranks the skill template. | `grep -n '^plans/' .gitignore` → no match |
