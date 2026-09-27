# T8 — leaf ink

**Agent:** typescript-pro (sonnet) · **Depends on:** T7 (reads its reservation model) · wave 2.
Prompt = [`fix-task.md`](../fix-task.md) + this file.

## Fixtures

cacoma-43-poxu615, daxeno-00-kasu166

## Mechanisms

**R-LEAF** (probe-verified by cdd2 T17: attaching a walk-measured
`symbolInk` closed cacoma, daxeno 92→1). Read cdd2 `.agent-notes/cdd2-T17.md`
(artifact 3). `tryMeasureDescriptionLeaf`
(`class-layout-generic-classifier.ts:73-105`) sets no `symbolInk`, so
description leaves (`component`, `<<Database>>` empty package) get the
class-box ink rule. Upstream `USymbolComponent2` draws one `URectangle`
(comp3 walk `{-1,-1,81,43}` → right edge 244.61, canvas 259). Export
`measureEntityLeafInk(node, font, {opts, sprites, measurer})` from
`core/svek/image/leaf-sizing-entity.ts` walking with the element's OWN
options (the probe without them raised gujigi 576→578 — it must not rise).
Then diagnose daxeno's last diff (styled namespace title `text/@y` Δ0.889,
`"<size:18>styled</size>\nshould be styled"`) and fix it if its origin is
reachable.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/svek/image/leaf-sizing-entity.ts`, `src/diagrams/class/class-layout-generic-classifier.ts`, `class-ink-box.ts`; tests beside each; `.agent-notes/cdd3-T8.md`.

## Interface contracts

- Interface in: T7's reservation model (`class-classifier-ink-reservation.ts`).

## Acceptance criteria

- Given cacoma, when rendered, then canvas width is 259 (jar)
- Given gujigi-63-roki030, when rendered, then its diff count does not rise
- Given every engine rendering description leaves (component, usecase, deployment via class), when surveyed vs the T0 baseline, then movers are explained

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
