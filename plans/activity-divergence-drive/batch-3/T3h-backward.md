# T3h — backward: in repeat/while

Agent: typescript-pro, worktree `add1-T3h`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
Rows 24, 34: `backward:` is unported (`gtile-repeat.ts`'s doc says 0 fixtures — false: levuma, niviji, mezuce, geremo, todufa, debofa, kenizo use it). Port `FtileRepeat`'s `backward` tile and connectors (`FtileRepeat.java` constructor/`getTranslateBackward`, `drawU` draws it last) and the while equivalent (`FtileWhile`). Measure every backward fixture, cohort or not.

## Rows (b2)
- **backward: box + connectors unported (activity-loop-backward)**: `debofa-60-mude568`, `kenizo-43-siro273`

## Write-set
`src/diagrams/activity/tiles/{gtile-repeat,gtile-while}.ts`, `src/diagrams/activity/layout/{walk-repeat,walk-while-branch}.ts`, `src/diagrams/activity/list-backward-dispatch.ts`, the tests exercising them, new tests (names unique to T3h).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.
