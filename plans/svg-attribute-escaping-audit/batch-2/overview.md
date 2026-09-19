# Batch 2 — the seam

Needs Batch 1. T3a and T3b run in parallel; both consume T2's exports.
T3a is gated by T1's `tooltip-gt` oracle (stop 4).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3a | `formatAttrValue` escapes; `linkWrap` pre-escape removed; `escapeXml` → 3-char re-export; `svg.ts` sinks via `attrs()`; font-family probe on | typescript-pro | `src/core/svg.ts`, `tests/unit/svg-primitives.test.ts`, `tests/unit/core/attribute-injection.test.ts` | T1, T2 | [ ] |
| T3b | `paint.ts` local `escapeAttr` removed; document-shell `style` via the shared escaper | typescript-pro | `src/core/paint.ts`, `src/core/klimt/document-shell.ts`, `tests/unit/core/paint.test.ts`, `tests/unit/core/klimt/document-shell.test.ts` | T2 | [ ] |

Batch exit: font-family probe green; zero comparator diffs; gates green.
