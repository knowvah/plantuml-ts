# Batch 4 — Sprite resolution returns primitives

One task. This is the batch where rendered output changes for the first time.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T9 | `resolveSpriteAtom` returns `drawable` primitives for SVG sprites | typescript-pro | `render-atoms.ts`, `creole-atoms.ts`, `EntityImageDescriptionDelegates.ts`, `EntityImageDescriptionSupport.ts`, `EntityImageDescriptionTextBlock.ts` (new) | T4, T6, T8 | [x] |

## Batch exit criteria

- All four quality gates green
- SVG goldens 310 / 22 / 57 **byte-identical** — none contains a sprite, so
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

## Outcome (2026-07-30)

Landed as `075c2da7`. Gates green: 455 files / **11,148 tests**,
typecheck/lint/build 0, 389 SVG goldens byte-identical, size-deltas
**320/351 widened 0** — the 0.029321in widening correctly did NOT close
here, exactly as this overview predicted.

**Structure now matches the jar exactly** on all three authored fixtures:

| fixture | before T9 | after T9 | jar |
|---|---|---|---|
| bootstrap | 0 path / 4 image | **6 path / 0 image** | 6 path / 0 image |
| archimate | 0 path / 2 image | **2 path / 0 image** | 2 path / 0 image |
| multiline | 0 path / 3 image | **4 path / 0 image** | 4 path / 0 image |

`bootstrap-0`: 8459 bytes / 6 `<image>` → 11115 / 9 `<path>`. The overview
predicted output size would DROP; it rose, because a base64 SVG sprite is
more compact than its decomposed paths at these sizes. Prediction wrong,
mechanism understood.

### Write-set grew twice, both maintainer-approved

1. **A regression the gates could not see.** Emitting `drawable` made
   sprites render as NOTHING, because only one of the two draw sites knew
   the variant. Tests, all 389 goldens and the size-delta script stayed
   green throughout — sizing is unaffected and no ratcheted golden contains
   a sprite. It was caught only by measuring the three diagnostic fixtures.
   **The brief's blast radius was wrong**: class/object/state never reach
   `EntityImageDescriptionDelegates`; the real path is the description
   engine's own main entity label (`buildDesc` → `BodyFactory.create3` →
   `descAtomOps.drawU`).
2. **ADR-2's `primitives: UPath[]` discarded T8's work.** Widened to carry
   any `UShape`. Only `UPath` has `translate`, so a primitive now records
   its shape beside its own `UTranslate` and both draw sites re-apply it.

## For T12: none of the three will ratchet in

Element structure matches the jar exactly, but **none is byte-identical**,
so under the maintainer's "ratchet in whatever passes" they all stay out.
Three independent, non-sprite causes:

- **`data-source-line` is absent from our output.** The jar emits
  `data-source-line="21"` / `="22"` on the entity `<g>`. We emit the
  attribute normally — all 51 ratcheted svg-description goldens contain it
  and pass — so this is specific to these fixtures, whose long inlined
  multi-line `sprite … <svg …>` preamble appears to lose the entity's
  source line. **A real defect, unrelated to this mission**; needs its own
  investigation.
- **Ellipse centres differ in the 4th decimal** (`cx=40.729` vs `40.7316`).
- **archimate's total width is 148 vs the jar's 145.**
