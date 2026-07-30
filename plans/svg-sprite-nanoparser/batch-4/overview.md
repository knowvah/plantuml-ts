# Batch 4 — Sprite resolution returns primitives

One task. This is the batch where rendered output changes for the first time.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T9 | `resolveSpriteAtom` returns `drawable` primitives for SVG sprites | typescript-pro | `src/diagrams/description/render-atoms.ts` | T4, T6, T8 | [ ] |

## Batch exit criteria

- All four quality gates green
- SVG goldens 310 / 23 / 57 **byte-identical** — none contains a sprite, so
  any diff here is collateral damage in the shared renderer, never expected
  churn. **A diff is a STOP.**
- `npx tsx scripts/measure-description-size-deltas.ts` exits 0

## What changes visibly

SVG sprites stop emitting as
`<image href="data:image/svg+xml;base64,…">` and start emitting as `<path>`
elements — roughly 1.47 paths per sprite instance (measured: `bootstrap.puml`
carries 2,078 sprites across 3,053 `<path>` elements). Output size likely
DROPS, since the current path base64-embeds the whole sprite source per
instance.

This is a user-visible rendering change. It needs no `DIVERGENCES.md` entry —
it removes a divergence rather than creating one. Record it in the commit
message. Measure the before/after output size on `bootstrap-0` and note it in
the journal.

## Expected non-change

The 0.029321in widening does NOT close in this batch — `fitToInk`
(`leaf-sizing.ts:360-376`) still substitutes ink for the resolved dimension on
the SIZING side. T10 closes it. If the size-delta script shows the widening
already gone here, that is a surprise worth journaling, not celebrating:
verify the mechanism before assuming it.
