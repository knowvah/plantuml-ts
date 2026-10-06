# Batch 0 — branch, b0, housekeeping, cohort census

All four in parallel (T0c/T0d are read-only, one output file each).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T0a](T0a-branch-baseline.md) | branch, brief commit, b0 (all engines), tmp1 retirement, ledger | orchestrator | `plans/activity-divergence-drive-3/**`, `oracle/goldens/svg-activity/{diff,style,text,swimlane}-baseline.json`, `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`, the routing/refusal/style/text/swimlane count tests | — | [ ] |
| [T0b](T0b-url-seam.md) | move `resolveInlineLinks` to `src/core/url/` | typescript-pro | `src/core/url/**` (new), `src/diagrams/description/parse-helpers*.ts`, the two activity callers, `tests/architecture/layering.test.ts` | — | [ ] |
| [T0c](T0c-census.md) | census rows ws <= 100 | general-purpose | `measurements/census-a.md` | — | [ ] |
| [T0d](T0c-census.md) | census rows ws > 100 | general-purpose | `measurements/census-b.md` | — | [ ] |

Close: merge T0b; four gates; `chore(add3-b0): branch, b0, tmp1 retired, census`.
T0c/T0d must measure the branch head AFTER tmp1 retirement (orchestrator
launches them after T0a step 3).
