# T1d: `PSystemListArchimateSprites`

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (sonnet).

## Task (TDD)
Port `klimt/sprite/PSystemListArchimateSpritesFactory.java` (`startsWith("listsprite")`, java:50) and
`klimt/sprite/PSystemListArchimateSprites.java` (rows `<$archimate/name> name (fmt)` java:57-79, 4
columns via T0c's `getCols(lines, 4, 0)`) over T0e's `ARCHIMATE_SPRITE_NAMES` (the runtime
classpath walk `ResourcesUtils.java:63-85` is replaced by that list) and the vendored sprites
(`packages/sprites-archimate/`, `src/core/internal-sprite-store.ts`). Jar values: `unknown/xucoma-93-jeko861`.

## Write-set
`src/core/klimt/sprite/{PSystemListArchimateSprites,PSystemListArchimateSpritesFactory}.ts`, their unit tests under `tests/unit/` (mirror the source path), `docs/catalog.md`,
`.agent-notes/ufp-T1d.md`. Any OTHER file is a stop — in particular NOT `src/index.ts` (T2a
registers every plugin) and not `oracle/goldens/**`.

## Interface contract (→ T2a)
Export `listArchimateSpritesPlugin` (a `singleLinePlugin`, or the base-class plugin shape T0c landed) and the
factory's accept function; record the exact export names in the report.

## Acceptance
- Given `xucoma-93`, then compareSvg has zero diffs (or residuals named).
- Given a line the factory does not accept (and a 4-line source), then it refuses.
- Given each corpus row rendered three times, then the outputs are identical.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
