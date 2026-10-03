# Batch 1 — connector-merge port (D1–D3)

Serial: T1a (diagnosis, no src edits) → T1b (implementation). Close per
[close-procedure.md](../close-procedure.md) (`b1`): expect the
"extra line+arrow" shape (99 rows) and "extra arrow only" (22) to fall sharply;
risers from element counts becoming equal are a reveal class (D7) — audit each.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-connection-census.md) | map every Java connection → strategy/text/our push site; oracle merge cases | typescript-pro | `plans/activity-divergence-drive-2/measurements/connection-census.md`, `…/measurements/merge-cases/**` | T0a, T0b | [x] |
| [T1b](T1b-snake-merge.md) | port `UGraphicForSnake`/`Snake.merge`/`Worm.merge`/`removeEndDecorationIfTouches`; `mergeable` on edges | typescript-pro | see spec | T1a | [x] |
