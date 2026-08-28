# Batch 5 — close out

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | Divergences and filings | `technical-writer` | `DIVERGENCES.md`, `planning/next-missions.md` | T7 | [x] |

After T8, the orchestrator performs **T9 — the landing** (D8): run the
adjudicator once more, and only on zero `regression` and zero unadjudicated
rise run `npx jiti scripts/repin-sequence-baselines.ts <snapshot.json>`, then
merge-commit into `feat/sequence-participant-g-wrapper` and that branch to
`main`. Never squash.
