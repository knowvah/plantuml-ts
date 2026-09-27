# Batch 3 — paint / text / glyph

Written by T6 from the batch-0 diagnoses (`diagnosis/*.md`). Every task
re-runs its diagnosis probe first (T6's HIGH-claim spot-check is carried
by each fix task's step 1; journal row 14).

Wave A: T21 ∥ T22 ∥ T24 (worktrees). Wave B: T26 ∥ T27 ∥ T29 (worktrees). Wave C serial in main: T23 (needs T22's `class-member-atom-resolve.ts`), T25 (needs T21's skinparam table), T28.

| ID | Description | Agent | Primaries | Depends On | Done |
|---|---|---|---|---|---|
| [T21](T21-package-skinparams.md) | Package skinparams + empty-package leaf | typescript-pro (opus) | `src/core/skinparam-stereo-keys.ts`… | T20 | [x] |
| [T22](T22-openiconic-member-rows.md) | OpenIconic atoms in member rows | typescript-pro (opus) | `src/diagrams/class/class-member-creole.ts`… | T20 | [x] |
| [T24](T24-font-family-line-thickness.md) | SVG font-family stack + style LineThickness | typescript-pro (opus) | `src/core/svg-text-font.ts`… | T20 | [x] |
| [T26](T26-note-creole-lists.md) | Note creole bullets and numbered lists | typescript-pro (sonnet) | `src/diagrams/class/note-layout-measure.ts` (+ a split file if the 500-line cap bites)… | T20 | [x] |
| [T27](T27-defs-order-seed.md) | Gradient def order + def-id seed | typescript-pro (opus) | `src/core/svg-defs.ts`… | T20 | [x] |
| [T29](T29-error-page.md) | Error page metrics | typescript-pro (sonnet) | `src/core/error/error-renderer.ts`… | T20 | [x] |
| [T23](T23-member-row-sprites.md) | Member-row sprites, badge glyph, lecelo | typescript-pro (sonnet) | `src/diagrams/class/index.ts`… | T22 | [x] |
| [T25](T25-generic-display-old.md) | `genericDisplay old` | typescript-pro (sonnet) | `src/core/theme.ts`… | T21 | [x] |
| [T28](T28-description-in-class.md) | Description diagrams in the class corpus | typescript-pro (opus) | `src/diagrams/description/index.ts`… | T19 | [x] |
| [T30](T30-close.md) | Residual round + close | orchestrator | close-procedure | T21, T22, T24, T26, T27, T29, T23, T25, T28 | [x] |
