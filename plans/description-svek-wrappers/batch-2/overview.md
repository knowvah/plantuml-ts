# Batch 2 — survey column + ratchet; description wrappers (plain family)

T2 and T3 have disjoint write-sets and run in parallel (`dsw/T2`, `dsw/T3`) after batch 1 merges.
At the close, merge T2 first, then T3. The layout-parity ratchet T2 seeded must stay green with T3
merged; a row T3 makes unequal is stop 4 unless the journal states its mechanism.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Survey `layoutEqual` column + layout-parity ratchet, seeded | typescript-pro (sonnet) | `scripts/svg-parity-survey.ts`, `scripts/lib/survey-layout-equal.ts`, `tests/unit/scripts/survey-layout-equal.test.ts`, `tests/oracle/svg-conformance/layout-parity.ratchet.test.ts`, `oracle/goldens/svg-conformance/layout-parity-baseline.json` | T1a | [ ] |
| T3 | Description wrappers, plain family (D5, D6) | typescript-pro (sonnet), **named `dsw-wrappers`** (resumed for T4) | `src/diagrams/description/layout-dot-tree.ts`, `src/diagrams/description/layout.ts`, `tests/unit/description/description-svek-wrappers.test.ts` | T1a, T1c | [ ] |

Close: [../close-procedure.md](../close-procedure.md). This is the first close where the description
surveys move. Expect component/usecase/unknown verdict movers and dotEqual flips (now that T1b is
tightened, rows can go **to** true). Journal the movers by family.
