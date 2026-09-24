# T3 — diagnose group R (canvas 1 px)

**Agent:** debugger · **Depends on:** T0 · parallel with T1, T2, T4, T5.
Prompt = [`diagnosis-task.md`](diagnosis-task.md) + this file.

## Fixtures (11)

Canvas only (2 numerics = width+viewBox or height+viewBox, Δ1):
bejeli-39-sina124, cacoma-43-poxu615, gatula-10-bifu561,
jixamu-89-ribo225, jubobo-22-fapu993, julixi-10-jide878,
rulite-35-muno361, xosiza-60-sobu480.
Canvas plus content: daxeno-00-kasu166 (92 numerics, 91 at Δ1.0 — a
whole-document 1 px shift), lojiga-09-meka859 (diverged: 158 at Δ1.0 plus
a `path`/`line` structural diff), sijisi-94-ripu606 (diverged: 127 at
Δ1.0; `allow_mixing` nested `rectangle` clusters per next-missions).

## History (read before hypothesising)

Prior mission T35 (`plans/class-divergence-drive/batch-10/T35-canvas-mindim.md`,
its journal rows ~226-232, `.agent-notes/cdd-T35.md`) established:

- the canvas chain (`SvekResult#calculateDimension` → `LimitFinder` ink
  walk `.delta(15,15)` → `TextBlockExporter` `+5/+5` → `SvgGraphics
  #ensureVisible` `(int)(v + 1)`) is ported and jar-verified in
  `src/diagrams/class/layout-ink-extent.ts` (module doc `:1-105`);
- 13 pure-canvas fixtures closed there; gatula, jixamu, jubobo, xosiza
  did NOT — next-missions attributes them to "~0.005 px position rounding
  tipping `ensureVisible`". That attribution is UNVERIFIED: measure it.
- a canvas-margin hypothesis was refuted (row 232).

For each fixture: compute our pre-truncation extent and the jar's implied
extent (from `in.svg` element coordinates), and say which ink term
differs and by how much. If the difference is ≤ 0.01 px and originates in
a dot-engine coordinate, the owner is dot-engine (D6, stop 8), with the
DOT coordinate cited from `svek-N.dot` vs our layout.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible — see [`diagnosis-task.md`](diagnosis-task.md).
