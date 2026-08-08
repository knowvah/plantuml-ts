# T8 — Retire `number-format.ts`'s 4-decimal API

**Agent:** typescript-pro · **Depends on:** T6a, T6b, T6c, T6d, T6e, T7 · **Commit:** `refactor(T8): retire javaFixed4/javaRound4 in favour of svg-format`

## Context

ADR-3 says one shared rules module, no duplicate rounding implementation.
After T6a–T6e and T7, `javaFixed4`/`javaRound4` should have no callers left
in the diagram engines. This task removes the duplication and moves the
last remaining consumer — `openiconic-glyphs.ts` — onto the shared module.

**This task must run last in batch-2c**: it cannot delete an API while a
caller survives.

⚠️ Gate deferred (ADR-5).

## Write-set

- `src/core/number-format.ts`
- `src/core/openiconic-glyphs.ts`
- their tests

## Read-set

- `src/core/svg-format.ts` — T1's module (the generalized `formatDecimal`)
- `src/core/number-format.ts` — the whole file; `javaFixed4`'s doc comment
  is the authoritative explanation of the HALF_UP-on-shortest-decimal
  algorithm and must survive somewhere
- `src/core/openiconic-glyphs.ts:407` — `trimTrailingZeros(javaFixed4(n))`
- `plans/svg-output-size-reduction/decisions.md#adr-3`

## Task

1. **Verify no callers remain.** `grep -rn "javaFixed4\|javaRound4" src/
   tests/`. If any survive outside this write-set, that is a stop
   condition — a T6/T7 task missed a site. Report it; do not fix it here
   (another agent owns that file).
2. Point `openiconic-glyphs.ts` at `formatDecimal(n, DEFAULT_SVG_DECIMALS)`.
   Path data is emitted geometry and takes the same 3 decimals.
3. Collapse `number-format.ts`: either delete it (if nothing remains) or
   reduce it to re-exports over `svg-format.ts`. **Do not leave two
   implementations of the same rounding** — that is the drift ADR-3 forbids.
4. Preserve the `javaFixed4` doc comment's reasoning (why `toFixed` is
   wrong for Java parity) by moving it to `svg-format.ts#formatDecimal` if
   it is not already there. It is the most expensive piece of knowledge in
   either file.

## Acceptance criteria

1. Given `grep -rn "javaFixed4\|javaRound4" src/ tests/`, then no match, or
   only re-export shims with no independent implementation.
2. Given an openiconic glyph path, when emitted, then 3-decimal formatted.
3. Given the HALF_UP-on-shortest-decimal reasoning, then it survives in the
   codebase (moved, not deleted) with its jar-verified example.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible**, together with batch-2a–2d (ADR-5).

## Quality bar

`npm run typecheck` and `npm run lint` pass; cold-tree `npm test` expected
red until batch-2d. Coverage thresholds still apply to the surviving module.

## Boundaries

- **Ask first / stop:** a surviving `javaRound4` caller outside the
  write-set — log it, do not reach into another task's file.
- **Never:** regenerate goldens; run any `git` command.
