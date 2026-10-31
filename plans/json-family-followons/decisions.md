# Decisions (user-approved 2026-10-30)

| ID | Decision | One line |
|---|---|---|
| D1 | json/yaml/hcl join the TitledDiagram export tail | Renderer emits a 1x block + `scaleSpec` + `exportMargin`; core finalize = back colour, then `exportTo`. |
| D2 | Labelless empty record closed, no code | Smetana sizes text (0,16) with no glyph width; the explicit `''` label reproduces that outcome. |
| D3 | dot-engine re-render: probe + contract + native comparison | File only if reuse is allowed AND native graphviz is idempotent. |
| D4 | Authored rows gated twice | Structural manifest AND the shrink-only positional ceiling. |
| D5 | json dpi stays 96 (locked) | `StyleExtractor` discards `skinparam dpi`; never set `RenderFragment.dpi`. |
| D6 | Standing conventions | Worktrees, unsigned commits, squash per batch, user signs, 0-loss all engines, d.ts identical. |

Item 2 of the jfp follow-ons (core `inches()` 6-dp, `src/core/svek-dot-emit-clusters.ts:33`) is out of scope: user ruling 2026-10-30, Q3 "leave it".

## D1 — where `scale` is applied (option A of A/B)

**Context.** `src/diagrams/json/renderer.ts:474-477` resolves `k` over the
title-less `finalDimension`, draws at 1x, and multiplies the body
(`scale-at-emit.ts` → `TextBlockExporter.ts#scaleActivityBody`) BEFORE
`applyExportedChrome` (`src/index.ts:193`) adds the title. Upstream:
`JsonDiagram extends TitledDiagram implements TextBlock` (`JsonDiagram.java:68`),
`getTextBlock` returns `this` (`:140-142`), and `UgDiagram#getExporter`
(`UgDiagram.java:123-131`) wraps it in chrome (`addChrome`) and the back colour
(`TextBlockUtils.addBackcolor`) before `TextBlockExporter.builder(...)`.
`exportTo` (`TextBlockExporter.java:159-177`) computes
`calculateFinalDimension()` over that chromed block plus the margin
(`:198-203`), resolves `computeScaleFactor(dim)` (`:205-209`), and draws
everything — title included — through one scaled `UGraphic`.

**Decision.** Mirror it with the existing TitledDiagram seam: the json
renderer hands over its raw 1x block with `exportMargin` (the
`TextBlockExporter.java:510-516` margin: style `Margin`, else
`TitledDiagram.java:275-277` `same(10)`) and `scaleSpec`, exactly as
`src/diagrams/mindmap/index.ts:208-226` does. `finalizeJsonFragment`
(`src/core/assemble-svg.ts:246`) splices the background rect (its existing
`maybeJsonBackgroundRect` rules) as `addBackcolor` does, then runs
`exportTo` (`src/core/TextBlockExporter.ts:363`) — the shape
`finalizeDescriptionFragment` (`assemble-svg.ts`) already has. A fragment
without `exportMargin` passes through as today (T2a lands byte-identical).
`scale-at-emit.ts` is deleted in T2b.

**Consequences.** Every json-family document passes through `exportTo`, title or
not, so the no-title scale rows (json/timafu-94-bixe774, yaml/nuzaje-74-kenu009,
`tests/fixtures/{json,yaml}/scale-factor`, `json/scale-max-width`) are the
regression proof. Handwritten stays json's own pass: `JsonDiagram.java:113-115`
wraps `drawU` on the `StyleExtractor` flag (`:79`), while `UgDiagram`'s
`isHandwritten()` reads the `-handwritten` OPTION, not the skinparam — so
`exportTo` must not wrap it again.

Rejected (B): keep json-local scaling and teach the renderer about chrome —
chrome is composed outside the renderer, so B is a structural divergence.

## D2 — labelless empty record (`SmetanaForJson.java:253-254`)

**Context.** jfp T4b (journal row 21) measured mirroring "no label on an empty
record" through `src/core/graph-layout-build.ts:147-149,164-167`: dot-engine
sizes the default `\N` as the node name plus record PAD (29.5 × 25.5 for `n1`);
Smetana's `storeline` gives any non-`_dim_` text (0,16) with no PAD
(`labels__c.java:119-122`) — it measures no glyph width. 4 rows rose, 6
unaligned.

**Decision.** Close without code. The explicit `''` label reproduces Smetana's
outcome (no text extent); the labelless call would import a node-name width
Smetana never computes. The exit adds one sentence to DIVERGENCES
"Smetana-backed diagram types" naming this.

## D3 — dot-engine re-render non-idempotence (`.agent-notes/jfp-b1.md`)

**Decision.** T1a reproduces `digraph{a->b}` rendered twice on one dot-engine
`Graph`, reads dot-engine's documented `render` contract
(`node_modules/@knowvah/dot-engine/README.md`, its d.ts), and compares with
native graphviz's layout → `gvFreeLayout` → layout cycle (cgraph via a tiny C
or Python binding if available; else the documented libgvc contract). File
`docs/graphviz-issues/<n>-*.md` + `TRACKER.md` only when reuse is permitted AND
native is idempotent; otherwise record the contract and close in
`.agent-notes/jff-T1a.md`. Production is unaffected (`layoutGraph` renders once).

## D4 — gating the new authored rows

**Decision.** T0b adds each new `tests/fixtures/<type>/<slug>.{puml,svg}` to
the structural manifest (ddc D7, `json-family-structural.ts:62-63`) AND
extends the positional ceiling to authored rows, keyed `authored:<type>/<slug>`,
seeded at their measured PRE-fix values. T2c lowers them. Reason: the fix is
positional, and positional values bypass the structural gate (jfp T1c).

## D5 — dpi (locked)

`JsonDiagram`'s `SkinParam` comes from `StyleExtractor`, which discards
`skinparam dpi` (`StyleExtractor.java:82-89`; jar-verified on
`json/kicati-76-guvi771`, `renderer.ts:456-473`). The json fragment never
sets `RenderFragment.dpi`, so `exportTo` resolves `scale × 96/96`.

## D6 — conventions

As jfp: per-task worktrees, unsigned commits, `--no-ff` merges, squash per
batch at the end (memory `squash-per-batch-at-end`), the user signs and pushes,
no dot-engine/fork/jar edits, exit bar = 0 conformant losses in 28 engines +
d.ts byte-identical to b0.
