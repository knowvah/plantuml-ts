# T8a — diagnose the handwritten apply chain; design the sequence seam

Agent: `debugger` (sonnet), worktree `sdd3-T8a`. Commit:
`docs(sequence): diagnose handwritten apply chain and UGraphic seam`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (verified by opening the Java)
`core/TextBlockExporter.java:173-177` translates by the margin, then
`if (isHandwritten) ug = new UGraphicHandwritten(ug)` (`:174-175`), then
`textBlock.drawU(ug)`. `klimt/drawing/hand/UGraphicHandwritten.java:54`
`new Random(424242L)` per instance; `:114-116` `apply` returns a NEW
decorator, so the sequence restarts at every `apply` and continues only
across `draw` calls on one instance. Which jiggle each shape gets therefore
depends on the exact apply/draw topology of teoz (`PlayingSpace.java:119-133`
tiles self-translate; `CommunicationTile.java:324-389`; `LiveBoxes.java:400`;
`LivingSpace.java:201-211`; `ComponentAdapter.java:55-59`) and rose
(`skin/rose/Component*.java`). `draw(UShape)` only jiggles ULine, URectangle,
UPolygon, UEllipse, DotPath, UPath (`:67-87`); text and images pass through.
Ours already has `UGraphicHandwritten.ts` (core/klimt/drawing/hand) and
`UgDiagram.ts:139-141` wraps it; json/salt reach it differently
(`json/renderer-pen.ts` is a PEN, one layer below a UGraphic — not a
UGraphic pattern to copy). `renderer-participant-symbol.ts:87-104` already
draws through `UGraphic`/`UGraphicSvg`: read it first.

## Targets
The four handwritten rows. Output is a document, not code.

## Write-set
`plans/sequence-divergence-drive-3/diagnosis/handwritten.md` only.

## Read-set
`TextBlockExporter.java:150-180`; `UGraphicHandwritten.java:50-120`;
`teoz/PlayingSpace.java:100-160`, `CommunicationTile.java:320-395`,
`LiveBoxes.java:380-420`, `LivingSpace.java:190-215`; the `skin/rose/` drawU
of each component type the 4 `in.puml` use; ours:
`src/core/UgDiagram.ts:120-145`, `src/core/klimt/drawing/hand/
UGraphicHandwritten.ts`, `src/diagrams/sequence/renderer.ts:322-406`.
Read batch 3's result first (it re-mirrors the export path).

## Interface contracts (T8a -> T8b..T8e)
Deliver the seam API: a `SequencePen`/UGraphic factory in `renderer.ts` that
backs a `UGraphic` with the core SVG driver; each module exports
`draw<X>(ug: UGraphic, geo, theme): void` that applies translate / colour /
stroke in the jar's order; non-handwritten output must stay byte-identical.
Per module: the ordered apply() calls per element, and its write-set.

## Acceptance
- Given the artifact, then it states mechanism, origin `file:line` (Java and
  ours), causal chain, and what was ruled out with evidence.
- Given the 4 targets, then it lists the per-element apply/draw sequence for
  one lifeline, one participant, one message, one note.
- Given T8b-T8e, then each has a module list, write-set and seam signature.
- Given each target's source with `handwritten true` removed, rendered by the
  jar (`scripts/oracle-render.sh`, into `diagnosis/`) and by us, compared
  with `compareSvg`, then every remaining
  non-handwritten diff is listed with its mechanism and an owner task; sdd2's
  ledger cites spot glyph, stereotype title, base64 sprite (jefoke) and
  document chrome (gepuce) — confirm whether earlier batches cleared them.
  Unowned residuals become spawned fix tasks before T8f (push-forward).
- Given an incomplete artifact, then stop 16 — do not start T8b.

Observability: N/A — diagnosis only, no new observable operations. Rollback:
Reversible (revert the task commit; it writes only `diagnosis/handwritten.md`).
