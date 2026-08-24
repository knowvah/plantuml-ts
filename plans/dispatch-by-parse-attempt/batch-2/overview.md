# Batch 2 — wire the contract

One task. Widens the plugin contract and replaces the guessed single type with
the candidate set, while the dispatcher still routes by `accepts()`. No plugin
refuses anything yet, so **this batch must move nothing**.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | widen `parse()`, `UmlSource.types`, delete `detectUmlType` | typescript-pro | `src/core/dispatcher.ts`, `src/core/block-extractor.ts`, `src/core/error/error-diagrams.ts`, `src/index.ts`, affected tests | T1, T2 | [ ] |

**Gate at close:** all four, plus the routing gate and T0's refusal gate both
**unchanged**. A moved number here is a defect, not progress.
