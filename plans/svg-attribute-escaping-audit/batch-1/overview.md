# Batch 1 — evidence and the shared escaper

No dependencies. All three run in parallel; write-sets are disjoint.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Audit table, oracle fixtures, green probe matrix with xmldom helper | general-purpose | `plans/svg-attribute-escaping-audit/findings/audit-table.md`, `…/findings/oracles/**`, `tests/unit/core/attribute-injection.test.ts` | — | [ ] |
| T2 | Move `escapeAttribute`/`escapeText` into `svg-format.ts`; `xml-writer.ts` imports them | typescript-pro | `src/core/svg-format.ts`, `src/core/klimt/drawing/svg/xml-writer.ts`, `tests/unit/core/svg-format.test.ts` | — | [ ] |
| T6 | `sanitizeSvg` disposition (D6): two doc comments | typescript-pro | `src/core/svg-sanitize.ts`, `src/core/klimt/drawing/svg/svg-graphics.ts` | — | [ ] |

Batch exit: T1's table has a row for every path in its list; T2 is
byte-identical (zero diff); gates green.
