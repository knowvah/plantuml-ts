# T3a — The attribute seam in `svg.ts`

## Context
`svg.ts#formatAttrValue` (`:171`) is documented as "the single point where
an attribute value becomes text" but does not escape. `attrs` (`:183`) and
`attrsFromRecord` (`:201`) both route through it (26 call sites, 9 files).
`linkWrap` (`:396`, pre-escape at `:401-402`) is the one caller that
escapes first. `escapeXml` (`:145`, `XML_RE` at `:139`) escapes `>` where
the jar does not (D3). Three template sinks remain in this file:
`:257` (stop-color rewrite), `:545` (canvas rect), `:554` (root `<svg>`).
T2 exported `escapeAttribute`/`escapeText` from `svg-format.ts`. T1 wrote
the oracle at `findings/oracles/tooltip-gt/jar.svg` and left the
font-family probe as `it.todo`.

## Task
0. READ `findings/oracles/tooltip-gt/jar.svg` first. If its `title=`
   contains `&gt;`, STOP (stop 4): D3 is contradicted; log to the journal.
1. `escapeXml`/`escapeXmlText` become re-exports of `svg-format.ts`'s
   `escapeAttribute`/`escapeText`; delete `XML_ENTITIES`, `XML_RE`,
   `XML_TEXT_RE`. Keep the JSDoc, updated to cite `XmlWriter.java:264-275`.
2. `formatAttrValue`: string values return `escapeAttribute(...)` after the
   existing color shortening. Numbers unchanged.
3. `linkWrap`: pass `url.url` / `url.tooltip` raw; `attrs` now escapes.
4. Route `:257`, `:545`, `:554` through `attrs()` (numeric included).
   `svgRoot`'s `bg = escapeXml(bgColor)` becomes unnecessary once the rect
   goes through `attrs()`; the markers receive the RAW `bgColor` and T4
   makes them escape (until T4 lands they still template it — that is
   Batch 3's job, not a regression: the value was already escaped-once
   before; keep `bg` for the markers only until T4).
5. Tests: `svg-primitives.test.ts` — `attrs([['title','a"b<c&d>e']])`
   yields `title="a&quot;b&lt;c&amp;d>e"`; `linkWrap` with `"` in url and
   tooltip yields exactly one `&quot;` each and never `&amp;quot;`;
   `group('a"b', [])` still `&quot;`. Turn on T1's font-family todo: render
   `skinparam defaultFontName a&b<c`, assert parse OK and
   `font-family="a&amp;b&lt;c"` (or the jar's swapped form per T1's
   `font-name-chars` oracle — match the jar, quote it).

## Write-set
- `src/core/svg.ts`
- `tests/unit/svg-primitives.test.ts`
- `tests/unit/core/attribute-injection.test.ts`

## Read-set
- `src/core/svg.ts:130-215, 240-260, 365-420, 525-560`
- `src/core/svg-format.ts` (T2's exports)
- `findings/oracles/tooltip-gt/jar.svg`, `findings/oracles/font-name-chars/jar.svg`
- `findings/audit-table.md` rows `swapped` (the quote-swap site)
- `decisions.md#d2`, `#d3`, `#d4`

## Architecture decisions
D2, D3, D4 (locked; D3 gated by step 0).

## Interface contracts
After this task: `attrs()`/`attrsFromRecord()` escape every string value
once. Callers MUST pass raw values. Consumed by T3b, T4, T5a, T5b.

## Acceptance criteria
- Given `attrs([['title', 'a"b']])`, when formatted, then `title="a&quot;b"`
- Given `linkWrap` with `"` in the URL, when rendered, then exactly one
  `&quot;`, never `&amp;quot;`
- Given `skinparam defaultFontName a&b<c`, when rendered, then the SVG
  parses with xmldom and the attribute matches the jar's oracle form
- Given the `tooltip-gt` oracle, when the port renders `in.puml`, then the
  `title=` bytes match the jar
- Given `npx vitest run svg-conformance`, when run, then zero diffs

## Quality bar
All four gates; conformance unmoved; catalog no drift.

## Boundaries
- Always: step 0 before any edit
- Never: keep a pre-escape "just in case"; touch files in T3b's write-set

## Observability
N/A — note `npm test` wall-clock in the journal only if it moves.

## Rollback
Reversible.

## Commit
`fix(saea-T3a): escape attribute values once at formatAttrValue`
Body: the jar's writer escapes `& < "` at serialization; `linkWrap` and
`>` changes explained; font-family defect closed.
