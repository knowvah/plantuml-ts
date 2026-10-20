# Batch 3b — retire the theme path; pin round 2

After batch 3 merges. T3c, then the orchestrator runs
[close-procedure.md](../close-procedure.md) as `b3` (covers batches 3 + 3b),
including step 11: write `batch-4/overview.md`'s T4x families.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3c](T3c-retire-theme-fields.md) | delete dead sequence theme fields + `sequence-shadowing.ts`; straggler audit | typescript-pro | `src/core/theme-sequence-fields.ts`, `src/core/sequence-shadowing.ts`, `src/core/build-theme.ts`, `src/core/theme-graph-colors-c.ts`, other theme/skinparam files a deletion reaches, `sequence-layout-shared.ts`, `text-block-geo.ts`, `layout.ts` + tests | T3a, T3b | [ ] |
| close | re-pin, all-engine survey, pin round 2, seed batch 4 | orchestrator | per close-procedure | T3c | [ ] |
