# Batch 2 — notes, creole/embed, small items (re-cut 2026-10-06, journal row 14)

Re-cut from the T0c/T0d census. Wave A runs during T1d (write-sets disjoint
from T1d's); wave B after T1d merges. All merge at the b2 close. T2c dissolved:
KLIMT-FLOOR -> T2b (same `gtile-action.ts` line-height site), PCTN -> T2a
(`node-dispatch.ts`), GLYPH -> T2b report-only (accepted-divergence candidate;
signing is stop 10).

| ID | Wave | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|---|
| [T2b](T2b-embedded.md) | A | action/diamond text via core creole Sheet (CREOLE-INLINE, CREOLE-ACT, STRIPE, EMBED), KLIMT-FLOOR, GLYPH report | typescript-pro | `activity-renderer-text.ts`, `tiles/gtile-action.ts`, `tiles/gtile-diamond*.ts`, text calls in `activity-renderer-shapes.ts`, `ast.ts` (new fields), named `src/core/klimt/creole/**` files (survey-guarded) | b0 | [ ] |
| [T2d-a](T2d-small.md) | A | HARNESS-SEED, DOCGRAD, DARK-CIRCLE (levuma) | typescript-pro | `tests/oracle/svg-conformance/render-fixture-activity.ts`, `activity-renderer-terminals.ts`, `src/core/{theme*,skinparam-*}.ts`, svg root background path in `src/core/` (survey-guarded) | b0 | [ ] |
| [T2a](T2a-notes.md) | B | notes: NOTEW/NOTE-SIZE, NOTELEFT (after NOTEW), NOTE-MULTI, NOTE-SWIMLANE, IFNOTE, BACKNOTE, GROUPNOTE; PCTN | typescript-pro | `tiles/gtile-note.ts`, `layout/tile-layout*.ts`, `activity-layout-constants.ts`, note branches of `layout/tile-coordinates.ts`, `node-dispatch.ts`, `if-dispatch.ts`, `layout/conditional-builder*.ts` | T1d | [ ] |
| [T2d-b](T2d-small.md) | B | ruzazu BIG_DIAMOND, CSTYLE-EMPTY / CONDSTYLE-EMPTY (reluvi, vamazo, tepivu, xefalo) | typescript-pro | `tiles/gtile-switch.ts`, `layout/walk-switch.ts`, `tiles/gtile-repeat.ts`, `tiles/gtile-while.ts`, `layout/walk-repeat.ts`, `layout/walk-while-branch.ts` | T1d; diamond file after T2b | [ ] |
