# T1b: `PSystemColors` (full grid + hexagon palette)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus).

## Task (TDD)
Port `eggs/PSystemColorsFactory.java` (`^colors?\s*(#?\w+)?\s*$`, java:48-54) and `eggs/PSystemColors.java`
(297 lines): the full named-colour grid (`rectangleWidth=175`, `rectangleHeight=28` java:77-78,
`drawFull`/`getTextName` sansSerif 14 bold java:263-291) and, with an argument, the 11-hexagon palette
(`size=60` java:81, `drawPalette` java:128-157, `centerHexa`, `getWidth` = sqrt(3)*size,
`getColorsCloseTo`/`closeComparator`/`findShortest` java:189-260) over T0d's `HColorSet.names()`,
`ColorUtils.distance`, `HColorSimple.distanceTo`. Note `PSystemColorsFactory` registers BEFORE the
sequence factory (java:134) — T2a places it. Jar values: `unknown/jigemu-90-titu666` (`colors`),
`unknown/kenari-17-dajo806` (`colors chocolate`).

## Write-set
`src/diagrams/eggs/{PSystemColors,PSystemColorsFactory}.ts`, their unit tests under `tests/unit/` (mirror the source path), `docs/catalog.md`,
`.agent-notes/ufp-T1b.md`. Any OTHER file is a stop — in particular NOT `src/index.ts` (T2a
registers every plugin) and not `oracle/goldens/**`.

## Interface contract (→ T2a)
Export `colorsPlugin` (a `singleLinePlugin`, or the base-class plugin shape T0c landed) and the
factory's accept function; record the exact export names in the report.

## Acceptance
- Given `jigemu-90` and `kenari-17`, then compareSvg has zero diffs (or residuals named).
- Given a colour argument that is not a colour, then the Java's branch (full grid or refusal — quote it).
- Given a line the factory does not accept (and a 4-line source), then it refuses.
- Given each corpus row rendered three times, then the outputs are identical.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
