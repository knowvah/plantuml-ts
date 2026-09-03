# Batch 4 — re-pin and census

One task, alone. Merged from the planned T6/T7 at the user's direction:
both measure the same post-chrome population and both write under
`oracle/goldens/svg-activity/`, so splitting them would cost a second full
measurement pass.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | Re-pin post-chrome, name every riser, census the residual | sonnet | `oracle/goldens/svg-activity/{diff-baseline.json,diff-census.json,README.md}`, `test-results/render-manifest-baseline.json` | T5 | [ ] |

**The riser rule is the point of this task.** A re-pin in this repo has
adopted a regression before by silently raising a pre-existing pin. Every
fixture whose `weightedScore` rose gets named with a mechanism, or the
mission stops.
