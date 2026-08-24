# Batch 2 — wire the contract

One task. Widens the plugin contract and replaces the guessed single type with
the candidate set, while the dispatcher still routes by `accepts()`. No plugin
refuses anything yet, so **this batch must move nothing**.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | widen `parse()`, `UmlSource.types`, delete `detectUmlType` | typescript-pro | `src/core/dispatcher.ts`, `src/core/block-extractor.ts`, `src/core/error/error-diagrams.ts`, `src/index.ts`, affected tests | T1, T2 | [x] |

**Gate at close:** all four, plus the routing gate and T0's refusal gate both
**unchanged**. A moved number here is a defect, not progress.

**Closed 2026-08-24.** All four gates green. Both conformance gates verified
**unchanged** — routing 2 of 2 pinned misroutes, refusal coverage 1 — which is
this batch's entire evidence.

**T3 landed two of its three parts.** `detectUmlType`'s deletion moved to T12
by maintainer ruling: `resolve()`'s tier-3 fallback returns the plugin for
`source.type`, that tier fires for 31 measured fixtures, and all 31 agree with
the jar today. Deleting the guess before refusal exists newly misroutes 26 of
them. D5 is unchanged — only its timing. **T12's write-set must now also cover
`block-extractor.ts` (delete `detectUmlType`, make `types` required) and
`error/error-diagrams.ts` (its `source.type` read at the empty-`@startuml`
path).** See `decision-journal.md`.
