# T1a: `PSystemOpenIconic` + `PSystemListOpenIconic`

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus).

## Task (TDD)
Port `openiconic/PSystemOpenIconicFactory.java` (accept `startsWith("openiconic ")`, factor 1.0,
java:50-53), `PSystemOpenIconic.java`, `PSystemListOpenIconicFactory.java` (`startsWith("listopeniconic")`,
java:50) and `PSystemListOpenIconic.java` (header/credit lines java:60-64, one `<&name> name` row
per icon from T0e's `OPENICONIC_ALL`, 7 columns via T0c's `getCols(lines, 7, 0)` java:70, drawn
as creole). Reuse the glyph path builder (`src/core/openiconic-glyphs.ts`: `buildOpenIconicPathD`,
`openIconicDims`, factor) — do not re-implement it. Jar values: `unknown/fotete-48-viga126`,
`unknown/bamudi-49-caxo996`.

## Write-set
`src/diagrams/openiconic/{PSystemOpenIconic,PSystemOpenIconicFactory,PSystemListOpenIconic,PSystemListOpenIconicFactory}.ts`, their unit tests under `tests/unit/` (mirror the source path), `docs/catalog.md`,
`.agent-notes/ufp-T1a.md`. Any OTHER file is a stop — in particular NOT `src/index.ts` (T2a
registers every plugin) and not `oracle/goldens/**`.

## Interface contract (→ T2a)
Export `openIconicPlugin`, `listOpenIconicPlugin` (a `singleLinePlugin`, or the base-class plugin shape T0c landed) and the
factory's accept function; record the exact export names in the report.

## Acceptance
- Given `bamudi-49` and `fotete-48`, then compareSvg against the cached jar SVG has zero diffs (or each residual is named with Java + port `file:line`).
- Given a line the factory does not accept (and a 4-line source), then it refuses.
- Given each corpus row rendered three times, then the outputs are identical.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
