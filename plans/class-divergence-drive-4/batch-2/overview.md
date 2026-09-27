# Batch 2 — theme routing + P-row fixes

T5 wrote T8–T10 (T12 collapsed into T10, see `../diagnosis/`). T7b needs T7a. T7b can run
in parallel (worktree) with T8–T10 only if their primaries are disjoint.
Then run the close procedure (N=2).

| ID | Description | Agent | Primaries | Depends On | Done |
|---|---|---|---|---|---|
| [T7b](T7b-theme-routing.md) | Route executed theme state, retire summary | typescript-pro (opus) | `core/theme.ts`, `core/build-theme.ts`, `core/themes-builtin*.ts`, `scripts/compile-themes.py`, `core/tim/TContext.ts` | T7a | [x] |
| [T8](T8-jakapi.md) | jakapi: glyph ink `HACK_X_FOR_POLYGON` + trimmed-path glyph angle | typescript-pro (sonnet) | `class/class-ink-box.ts`, `class/class-edge-label-attach.ts`, `class/class-magic-arrow.ts` | T5 | [x] |
| [T9](T9-lecelo.md) | lecelo: class `<:name:>` draws Twemoji artwork; emoji store in the class harnesses | typescript-pro (sonnet) | `class/class-member-atom-resolve.ts`, `class/class-member-creole.ts` (+ `class-member-render-atom.ts`/`class-member-sprite-render.ts` if needed), `scripts/svg-parity-survey.ts`, `plans/class-divergence-drive/tools/render-diff.mts`, `scripts/svg-conformance-census.ts`, `tests/oracle/class.golden.ratchet.test.ts` | T5, T4 | [x] |
| [T10](T10-gujigi.md) | gujigi + ririlu: svek two-pass draw state (constraint on links; Kal re-solve) | typescript-pro (opus) | `class/class-edge-geo.ts`, `class/class-edge-constraint.ts`, `class/class-kal-overlap.ts`, `class/class-svek-pass0.ts` (new), `class/layout.ts`, `class/layout-ink-extent.ts`, `core/graph-layout.ts`, `core/graph-layout-result.types.ts` | T5, T11 | [x] |
| T12 | ririlu (collapsed into T10: same `SvekResult#drawU` two-pass origin, shared `m`/`S`/`D`) | — | — | — | n/a |

All primaries are pairwise disjoint and disjoint from T7b. T8, T9 and T10 run in
parallel worktrees after batch 1 merges (T4 and T11 must have merged). T10 does
not depend on T6: it touches no description file and not
`svek-dot-emit-clusters.ts`.

| T6b | sokevu residual: port corner + frontier seed | typescript-pro (opus) | description layout files | T6 | [x] |
| T12 | lecelo header multi-line stacking (residual round) | typescript-pro (opus) | `class-stereotype-layout.ts`, `class-header-line-stacking.ts` | T9 | [x] |
| T13 | class harness builds theme like production (residual round) | typescript-pro (sonnet) | `render-fixture-class.ts` | T7b | [x] |
