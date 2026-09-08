# Batch 1 — the shared seam

One task, in `src/core/`. Serial: T2 consumes what this produces.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Extend the element bucket for activity's exclusive SNames | typescript-pro | `src/core/skinparam-element-buckets.ts`, `src/core/theme-graph-colors.ts`, `tests/unit/core/skinparam-element-buckets.test.ts`, `tests/unit/core/theme-graph-colors.test.ts` | T0 | [ ] |

This is the only batch touching `src/core/`. Its blast radius is every
engine, which is why [D3] narrows the SName list to four and why the task's
acceptance criteria demand a proof that no other engine's theme moves.
