# Batch 2 — the seam

Needs Batch 1. Executed SERIALIZED (journal B1 row 1): T3b → T3a → T3c.
T3a is gated by T1's `tooltip-gt` oracle (stop 4; jar `title="a>b"`, D3
stands). T3c is the D8 amendment and shares the probe test file with T3a,
hence strictly after it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3a | `formatAttrValue` escapes; `linkWrap` pre-escape removed; `escapeXml` → 3-char re-export; `svg.ts` sinks via `attrs()`; font-family probe on | typescript-pro | `src/core/svg.ts`, `tests/unit/svg-primitives.test.ts`, `tests/unit/core/attribute-injection.test.ts` | T1, T2 | [ ] |
| T3c | D8: `escapeComment` in `svg-format.ts`; `xml-writer.ts` and the four comment sinks call it; turn on T1's four comment todos | typescript-pro | `src/core/svg-format.ts`, `src/core/klimt/drawing/svg/xml-writer.ts`, `src/diagrams/class/renderer-group.ts`, `src/diagrams/state/renderer-group.ts`, `tests/unit/core/svg-format.test.ts`, `tests/unit/core/attribute-injection.test.ts`, existing renderer-group tests | T3a | [ ] |
| T3b | `paint.ts` local `escapeAttr` removed; document-shell `style` via the shared escaper | typescript-pro | `src/core/paint.ts`, `src/core/klimt/document-shell.ts`, `tests/unit/core/paint.test.ts`, `tests/unit/core/klimt/document-shell.test.ts` | T2 | [ ] |

Batch exit: font-family probe and the four comment probes green; zero comparator diffs; gates green.
