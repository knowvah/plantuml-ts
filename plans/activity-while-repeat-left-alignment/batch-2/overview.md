# Batch 2 — repeat

Sequential after Batch 1, measured against `measurements/t1.json`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | `GtileRepeat` `getLeft`/`getRight` + per-child x offsets + hooks; the `'gtile-repeat'` walker case places body/condition/backward at the offsets | typescript-pro | `src/diagrams/activity/tiles/gtile-repeat.ts`, `src/diagrams/activity/layout/tile-coordinates.ts` (repeat case only); `tests/diagrams/activity/tiles/gtile-repeat.test.ts`, `tests/diagrams/activity/layout/tile-coordinates.test.ts`, `tile-layout.test.ts`, `compress/invariant.test.ts`, `tests/unit/activity/layout.test.ts` ONLY where the geometry breaks them; `measurements/t2.json` | T1 | [ ] |

Spec: [`T2-repeat-left.md`](T2-repeat-left.md). Expected movers: the 14
`repeat` diagonal fixtures (`bizono-61-sasa740`, `bozuro-33-celo170`,
`bulasi-17-vafa634`, `camavo-50-kaku123`, `cixave-47-milo698`,
`dacuga-41-popo038`, `dixiku-28-guzo497`, `doziki-93-rosi997`,
`gacaja-15-keko600`, `gelono-70-zuce760`, `judatu-15-xize591`,
`jupoxe-15-sugo110`, `manata-12-rido730`, `tobajo-64-mipi810`) plus any
`repeat` with an asymmetric body/backward without a visible diagonal.
