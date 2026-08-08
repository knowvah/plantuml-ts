# Batch 2b — Remove class-engine pre-rounding (ADR-1)

⚠️ **Gate deferred (ADR-5).** SVG-comparing tests stay red until batch-2d.
`npm run typecheck` and `npm run lint` must still pass.

T5 moved numeric formatting to emission. These five tasks delete the now
double-rounding `javaRound4`/`javaFixed4` pre-rounding from the class
engine's 19 files / 66 call sites. **All five are fully parallel** — no
file is shared between them, and none is shared with T7.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6a | Classifier box, header, members, rows (7 files, 14 calls) | typescript-pro | see task file | T5 | [x] |
| T6b | Edges and stereotypes (3 files, 10 calls) | typescript-pro | see task file | T5 | [x] |
| T6c | Notes (4 files, 10 calls) | typescript-pro | see task file | T5 | [x] |
| T6d | JSON / map / object sizing (4 files, 17 calls) | typescript-pro | see task file | T5 | [x] |
| T6e | Namespace shape (1 file, 15 calls) | typescript-pro | see task file | T5 | [x] |

## The shared rule

Every task here does the same thing in its own files:

1. Delete the `javaRound4(...)` / `javaFixed4(...)` wrapper, keeping the
   inner expression. Emission rounds now (T5).
2. Remove the import if it becomes unused.
3. Where a comment justifies the pre-rounding — most explicitly
   `class-edge-geo.ts:212-219`'s G2 N35 note — **delete or rewrite it with
   the call.** An orphaned comment explaining a call that no longer exists
   is worse than no comment.
4. Update tests that assert 4-decimal pre-rounded geometry.

## Why five tasks and not one

19 files in one commit exceeds this repo's 5–15-minute task target and
makes the diff hard to review. The split is by sub-area so each commit has
a single subject and its own acceptance criteria, and so the five can run
concurrently.

## The failure signal to watch

If, after batch-2d, a *handful* of goldens fail with single last-digit
differences, pre-rounding survived somewhere in this batch. That is stop
condition "any last-digit mismatch pattern after T6/T7" — find the call
site, do not adjust a golden.
