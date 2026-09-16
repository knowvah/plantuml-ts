# Batch 5c — the if tiles carry each branch's OWN `left`

Added 2026-09-16 after T6b's diagonal scan: 13 fixtures still draw a
diagonal INSIDE an if (bucket C of the journal row "T6b | Diagonal-sibling-
segment scan"). Verified on `sutura-08-zeme419`: a nested `if` sits with its
`left` at x=93.2 under a parent hexagon centred at x=127.2, so `ConnectionIn`
and `ConnectionOut` slant. Mechanism: all three if tiles take a branch's
padded `left` as `outer / 2` (`gtile-if-with-links.ts:26-40,92-95`,
`gtile-if-down.ts:110-112`, `gtile-if-long-horizontal.ts:75-83`), which
equalled the branch's real `left` only while `GtileTopDown` reported
`width/2` (fixed by T6b). The jar shifts the branch's OWN `left`:
`FtileMinWidthCentered#getPoint2` returns `left + (30 - w)/2` when `w < 30`
(`FtileMinWidthCentered.java:99-106`) and `FtileMarged` adds `margin1` to it
(`FtileMarged.java:93-97`). Fix commits inside T3/T4/T5's write-sets —
sequential after Batch 5b, measured against `measurements/t6b.json`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6c | Each if tile's branch `left` = `branch.getCoord(NORTH_HOOK).x + contentDx`; placements and hooks follow | typescript-pro | `src/diagrams/activity/tiles/gtile-if-with-links.ts`, `gtile-if-down.ts`, `gtile-if-long-horizontal.ts`; their three test files; `layout/compress/invariant.test.ts` and `tests/unit/activity/layout.test.ts` only where the geometry breaks them; `measurements/t6c.json` | T6b | [x] |

Spec: [`T6c-branch-left.md`](T6c-branch-left.md).
