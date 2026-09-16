# Batch 5b — align siblings on `left`; notes are transparent to `hasPointOut`

Added 2026-09-16 under README stop 1: T7's rise attribution found two defects
in `tiles/gtile-top-down.ts`, outside every task's write-set, and the
maintainer authorised this batch before the re-pin (journal, "T7 | HALT").
Sequential after Batch 5, measured alone against `measurements/final.json`
(= `t6.json`, identical). Like T6 this is a generic assembly rule: its
movers may be outside `fixtures.md` (stop 6 exempts it for the list it
journals). Blast radius measured before dispatch: **101 baseline fixtures
draw a diagonal sibling segment today** — 88 `if` rows and 13 non-if ones
(`while` tiles, whose hook is the content centre, e.g. `cemagu-66-vazo965`,
`bulasi-17-vafa634`, `kodaku-19-moni161`).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6b | `GtileTopDown` aligns children on their in/out x (`left`) per `FtileAssemblySimple`; trailing note tiles do not decide `hasPointOut` | typescript-pro | `src/diagrams/activity/tiles/gtile-top-down.ts`, `layout/tile-coordinates.ts` (top-down case only); `tests/diagrams/activity/tiles/gtile-top-down.test.ts`, `layout/tile-coordinates.test.ts`, `layout/tile-layout.test.ts`, `tests/unit/activity/layout.test.ts`, `compress/invariant.test.ts` ONLY where the geometry breaks them; `measurements/t6b.json` | T6 | [ ] |

Spec: [`T6b-topdown-left-alignment.md`](T6b-topdown-left-alignment.md).
