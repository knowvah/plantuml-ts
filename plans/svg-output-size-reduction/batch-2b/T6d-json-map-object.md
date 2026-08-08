# T6d — JSON / map / object sizing

**Agent:** typescript-pro · **Depends on:** T5 · **Commit:** `refactor(T6d): drop json/map/object sizing pre-rounding`

## Write-set (4 files, 17 calls — the densest sub-area)

- `src/diagrams/class/class-json-sizing.ts` (4)
- `src/diagrams/class/class-map-sizing.ts` (5)
- `src/diagrams/class/class-object-map-header.ts` (5)
- `src/diagrams/class/class-object-map-sizing.ts` (3)
- plus their tests

## Read-set

- `plans/svg-output-size-reduction/decisions.md#adr-1`
- `plans/svg-output-size-reduction/batch-2a/T5-core-svg-format.md`

## Note on reach

Object diagrams route through the class engine, so this sub-area owns the
22 `svg-object` goldens as well as the json/map class fixtures.

## Acceptance criteria

1. Given a json/map/object cell or header measured width, then it is not
   pre-rounded.
2. Given the 22 `svg-object` fixtures, when rendered after batch-2d, then
   zero-diff against their regenerated goldens.
3. Given `grep -r "javaRound4\|javaFixed4"` over the write-set, then no match.

## Context

ADR-1: `core/svg.ts` now formats every numeric attribute at emission (T5),
so the class engine's `javaRound4`/`javaFixed4` pre-rounding is redundant
AND harmful — rounding to 4 and then to 3 is not the same as rounding once
to 3 (`1.2345 → 1.2345 → 1.235`, but direct-to-3 is `1.234`), producing
sporadic last-digit divergences that look random.

Those calls were not wrong when written: `core/svg.ts` had no formatter, so
pre-rounding was the only way to match the jar's `%.4f` output (mission
G2 N35). T5 removed the reason they existed.

⚠️ **Gate deferred (ADR-5).** SVG-comparing tests are red until batch-2d;
that is expected, not a stop condition. `npm run typecheck` and
`npm run lint` must still pass.

## The change, in every file

1. Delete the `javaRound4(...)` / `javaFixed4(...)` wrapper, keep the inner
   expression.
2. Drop the import once unused.
3. Delete or rewrite any comment that justifies the pre-rounding — do not
   leave it orphaned.
4. Update tests asserting 4-decimal pre-rounded geometry.

Change nothing else. Porting discipline: do not refactor adjacent code.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible**, but only together with T5 (ADR-5) — reverting this alone
while T5 stands leaves values rounded once at emission (harmless);
reverting T5 alone while this stands leaves them unrounded entirely.

## Quality bar

- `npm run typecheck` and `npm run lint` pass. Cold-tree `npm test`
  expected red until batch-2d.
- No `javaRound4`/`javaFixed4` reference survives in this task's files.

## Boundaries

- **Always:** stay strictly inside the write-set — the other four T6 tasks
  and T7 are running concurrently on sibling files.
- **Never:** touch `src/core/**` (T5/T8 own it); regenerate goldens; run
  any `git` command.
