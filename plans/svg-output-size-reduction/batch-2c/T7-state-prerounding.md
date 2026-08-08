# T7 — Remove state-engine pre-rounding

**Agent:** typescript-pro · **Depends on:** T5 · **Commit:** `refactor(T7): drop state-engine pre-rounding`

## Context

Same change as batch-2b, in the state engine. ADR-1: `core/svg.ts` now
formats numerics at emission (T5), so `javaRound4`/`javaFixed4`
pre-rounding is redundant and causes double-rounding (`1.2345 → 1.2345 →
1.235`, but direct-to-3 is `1.234`).

Runs in **parallel with all of batch-2b** — disjoint files.

⚠️ Gate deferred (ADR-5): SVG-comparing tests red until batch-2d.
`npm run typecheck` and `npm run lint` must still pass.

## Write-set (4 files)

The `src/diagrams/state/**` files importing `javaRound4`/`javaFixed4` —
locate with `grep -rl "javaRound4\|javaFixed4" src/diagrams/state/` — plus
their tests.

## Read-set

- `plans/svg-output-size-reduction/decisions.md#adr-1`
- `plans/svg-output-size-reduction/batch-2a/T5-core-svg-format.md` — interface contract
- `plans/svg-output-size-reduction/batch-2b/overview.md` — the shared rule

## Task

1. Delete the `javaRound4(...)`/`javaFixed4(...)` wrapper, keep the inner
   expression.
2. Drop the import once unused.
3. Delete or rewrite any comment justifying the pre-rounding.
4. Update tests asserting 4-decimal pre-rounded geometry.

Change nothing else.

## Acceptance criteria

1. Given a state-engine measured width, when geometry is built, then it is
   not pre-rounded.
2. Given the 58 `svg-state` fixtures, when rendered after batch-2d, then
   zero-diff against their regenerated goldens.
3. Given `grep -r "javaRound4\|javaFixed4" src/diagrams/state/`, then no match.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible**, together with T5 (ADR-5).

## Quality bar

`npm run typecheck` and `npm run lint` pass; cold-tree `npm test` expected
red until batch-2d.

## Boundaries

- **Always:** stay inside `src/diagrams/state/**` — batch-2b runs concurrently.
- **Never:** touch `src/core/**` (T8 owns the retirement); regenerate
  goldens; run any `git` command.
