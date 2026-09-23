# Batch 1 — B1 ordering & uid (A1 SB1–SB5, SB8)

Fixes the parser/DOT-order/uid mechanisms behind 56 of A1's 79 fixtures
(SB1–SB5) plus the 8 render-only `path/@id` fixtures (SB8). This is the
first batch that moves layout (D2: structure before paint) — every
conformant/pinned fixture must be re-verified at close, not just the 60
named slugs, because `creationIndex` is also the rank source for draw
order and the exact/fallback uid gate (A1 SB1's Fix-shape risk note).

T1 (parser post-pass) and T2 (DOT/draw link order) touch disjoint files
and are both `—`-dependency, so they run in parallel worktrees. T3 (phantom
uid slots for couples/notes) reads T1's `parser.ts` chokepoint and must
land after it. T4 (path `@id` decor classification) is render-only but its
SB8 fixtures include association-couple edges that T3's phantom slots
touch, so it runs last.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Defer implicit-package uid ticks (SB1, 42 fixtures) | typescript-pro (opus) | `src/diagrams/class/parser.ts`, `class-namespace-resolve.ts`, tests | — | [x] |
| T2 | `getOrderedLinks`/`addLinkNew` before DOT emission (SB2, 7 fixtures) | typescript-pro | `src/diagrams/class/class-dot-graph.ts`, `class-dot-edge-order.ts`, tests | — | [x] |
| T3 | Phantom uid slots: assoc-couple names, package endpoints, notes (SB3/SB4/SB5, 8 fixtures) | typescript-pro | `src/diagrams/class/class-assoc-couple.ts`, `parser.ts`, `class-notes.ts`, `renderer-uid.ts`, tests | T1 | [x] |
| T4 | Fix `path/@id` decor-classification inversion for couple edges (SB8, 8 fixtures) | typescript-pro | `src/diagrams/class/renderer-edge.ts`, `class-assoc-couple.ts`, tests | T3 | [x] |

Specs: [`T1-implicit-package-ticks.md`](T1-implicit-package-ticks.md),
[`T2-ordered-links.md`](T2-ordered-links.md),
[`T3-phantom-ticks.md`](T3-phantom-ticks.md),
[`T4-path-id-forms.md`](T4-path-id-forms.md).
Batch close: [`close.md`](close.md) — full re-pin (D7, D11).
