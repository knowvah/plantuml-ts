# Batch 4: plugin wiring + the main pin close

One task, then the standard close with pins **and** the batch-4 extras (residual families →
batch-5 specs; dashboard families).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4a](T4a-plugin-wiring.md) | `wbsPlugin`, registration, `assemble-svg` WBS case; measure 204 + bozido; residual families | typescript-pro (opus) | `src/diagrams/wbs/index.ts`, `src/index.ts` (one line), `src/core/assemble-svg.ts` (one case), tests, `measurements/T4a/**` | T2a, T2b, T3c | [ ] |

Close: `close-procedure.md` steps 1–11 with step 8's pins (every byte-identical row),
`repin-wbs-routing`, `repin-wbs-baseline`, the activity bozido re-pin, the dashboard family
additions, then the batch-4 extras.
