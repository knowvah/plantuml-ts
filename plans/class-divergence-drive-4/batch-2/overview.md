# Batch 2 — theme routing + P-row fixes

T5 writes T8–T10 and may collapse or drop rows. T7b needs T7a. T7b can run
in parallel (worktree) with T8–T10 only if their primaries are disjoint.
Then run the close procedure (N=2).

| ID | Description | Agent | Primaries | Depends On | Done |
|---|---|---|---|---|---|
| [T7b](T7b-theme-routing.md) | Route executed theme state, retire summary | typescript-pro (opus) | `core/theme.ts`, `core/build-theme.ts`, `core/themes-builtin*.ts`, `scripts/compile-themes.py`, `core/tim/TContext.ts` | T7a | [ ] |
| T8 | jakapi fix (spec from T5) | per T5 | per T5 | T5 | [ ] |
| T9 | lecelo fix (spec from T5) | per T5 | per T5 | T5 | [ ] |
| T10 | gujigi fix (spec from T5) | per T5 | per T5 | T5, T6 | [ ] |
