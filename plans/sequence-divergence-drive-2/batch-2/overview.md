# Batch 2 — vertical tile model (D3); LinkAnchor

The highest-risk batch: it replaces the port's cursor-based vertical model
with upstream's teoz structures. Mechanisms: `research/research-c-
vertical.md`. Expected results: `prototypes/expected-zero.json`
(`zeroAfterTask`: 35 after T2a, 17 after T2b, 2 after T2c, 5 after T2d =
the 59 rows the prototype took to zero, 0 pinned lost).

Sub-batches run in order; tasks inside one run in parallel worktrees. Merge
each sub-batch, run the golden ratchet + classify, then start the next.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-notemsg-parallel.md) | 2a · notes beside their message + `&` parallel via YGauge | typescript-pro (opus) | `sequence-layout-events.ts`, `sequence-layout-note.ts`, `sequence-layout-message.ts`, `sequence-layout-exo.ts`, new `sequence-y-gauge.ts`, `ast*.ts` + tests | B1 | [x] |
| [T2b](T2b-livebox-stairs.md) | 2b · activation stairs via LiveBoxes + self-message x | typescript-pro (opus) | new `sequence-live-boxes.ts`, `sequence-layout-life-event.ts`, `sequence-layout-activation.ts`, `sequence-layout-message-self.ts`, `renderer-message.ts`, `sequence-layout-message.ts` (activation hand-off only) + tests | T2a | [x] |
| [T2c](T2c-note-tiles.md) | 2b · `/ note` merge, top/bottom note line, note order | typescript-pro (sonnet) | `sequence-note-tile.ts`, `renderer-note.ts`, vmerge section of `sequence-layout-note.ts` + tests | T2a | [x] |
| [T2d](T2d-inclination-response.md) | 2c · `->(N)` inclination, response-below | typescript-pro (sonnet) | `sequence-layout-message.ts` + tests | T2b | [x] |
| [T2e](T2e-link-anchor.md) | 2c · `{a} <-> {b}` LinkAnchor | typescript-pro (sonnet) | new `command-link-anchor.ts`, new `renderer-link-anchor.ts`, `sequence-command-registry.ts`, `renderer.ts`, `ast.ts` + tests | T2a | [x] |
| close | standard close **with the all-engine survey**, pin round 2 | orchestrator | per close-procedure | T2a–T2e | [x] |

Paths under `src/diagrams/sequence/`. T2b and T2c share no file; T2c edits
only the vmerge section of `sequence-layout-note.ts`, which T2a owned and
merged before 2b starts. T2d and T2e share no file.

## Interface contract (T2a → T2c, T2e, T4c)
```ts
/** Upstream: a tile's gauge — teoz/YGauge.java; contact = getContactPointRelative. */
export interface MessageTileGauge {
  readonly top: number;      // tile top (YGauge min)
  readonly height: number;   // tile height
  readonly contactY: number; // absolute y of the arrow line
}
```
Published per message / exo event (name the lookup in T2a's hand-back).

## Interface contract (T2b → T3a, T7b)
`sequence-live-boxes.ts` exports a `LiveBoxes` mirroring
`teoz/LiveBoxes.java`: `addStep(y, kind)` (`:79-86`), `getStairs(…)`
(`:284-336`), `getMaxPosition()` / max level (`:367-372`). Names follow
upstream.
