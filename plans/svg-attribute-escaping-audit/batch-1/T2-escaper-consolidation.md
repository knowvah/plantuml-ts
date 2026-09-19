# T2 — One escaper implementation in `svg-format.ts`

## Context
`src/core/klimt/drawing/svg/xml-writer.ts` is the faithful port of jar
`XmlWriter.java`; its private `escapeText` (`:218`) and `escapeAttribute`
(`:229`) mirror `XmlWriter.java:244-275` ("Text content: only '&' and '<'
are mandatory"; "Attribute value (always double-quoted): escape '&', '<'
and '"'"). `svg.ts` carries a second pair (`:139-165`). D1 makes the
`xml-writer.ts` pair the single implementation, hosted in `svg-format.ts`,
the module already named as the formatting point (`fmt`, `shortenColor`).

## Task
1. Move `escapeText` and `escapeAttribute` bodies into
   `src/core/svg-format.ts` as exported functions with the SAME character
   sets, JSDoc citing `XmlWriter.java:244-275` and the `@see` line the
   repo uses for ported symbols.
2. `xml-writer.ts` imports and calls them; delete its private copies. No
   other change in that file.
3. `tests/unit/core/svg-format.test.ts`: table-driven tests for both
   (`&`, `<`, `>`, `"`, `'`, mixed, empty, already-escaped `&amp;` stays
   `&amp;amp;`).
Do NOT touch `svg.ts` (T3a owns the re-export and the `>` change).

## Write-set
- `src/core/svg-format.ts`
- `src/core/klimt/drawing/svg/xml-writer.ts`
- `tests/unit/core/svg-format.test.ts` (create)

## Read-set
- `src/core/klimt/drawing/svg/xml-writer.ts:30-110, 210-245`
- `src/core/svg-format.ts:100-140`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/XmlWriter.java:240-280`
- `tests/architecture/layering.test.ts:160-200` (no `core → diagrams` edge is created; confirm)
- `decisions.md#d1`

## Architecture decisions
D1 (locked). Character sets unchanged in this task.

## Interface contracts
```ts
export function escapeAttribute(input: string): string; // & < "  →  &amp; &lt; &quot;
export function escapeText(input: string): string;      // & <    →  &amp; &lt;
```
Consumed by T3a (`svg.ts` re-export) and T3b (`paint.ts`, `document-shell.ts`).

## Acceptance criteria
- Given `xml-writer.ts`, when grepped, then no `private escape` remains and
  both call sites use the `svg-format.ts` exports
- Given the full suite and `npx vitest run svg-conformance`, when run, then
  zero diffs (byte-identical output)
- Given the new unit test, when run, then every table row passes and
  `escapeAttribute('a>b')` is `'a>b'` (no `&gt;`)

## Quality bar
All four gates; `npm run catalog` (new exports on `svg-format.ts` → regenerate
and include `docs/catalog.md` in the commit; that file is pre-authorised for
this task).

## Boundaries
- Never: change a character set; touch `svg.ts`

## Observability
N/A — no new observable operations.

## Rollback
Reversible.

## Commit
`refactor(saea-T2): host the XmlWriter escapers in svg-format.ts`
