# T2a — draw order (text()/font-size swaps)

Agent: typescript-pro, worktree `add1-T2a`. Commit: `fix(activity): <mechanism>`.

## Context
144 fixtures show `text()` content swapped pairwise (`"no" => "yes"` and
`"yes" => "no"` in the same fixture, `bareka`) and 72 show `font-size`
12↔11 / 13↔12 swaps — elements present on both sides in a different
order, so the comparator charges every attribute of the misaligned pair.
Known filed mechanisms: `activity-repeat-connector-draw-order`
(`FtileRepeat.java:172-204`: `ConnectionIn`, backward family, `ConnectionOut`
last; ours pushes the body→condition edge before walking the condition,
`tile-coordinates.ts:252-262`); branch-label order in `FtileIfLongHorizontal.
java:203-257` / `FtileIfDown.java:135-157` (the if's entry connector AFTER
every branch connector). `edge-draw-order.ts` is the ordering seam
(`activity-edge-draw-order` mission).

## Task
For each cohort row the close assigned here: `--align <slug>` first (per-
tag positional agreement), then read the jar's `conns` list for the construct,
then reorder ours to the Java's — no sorting heuristics. One commit per
mechanism, each with a `tests/diagrams/activity/layout/` pin quoting the
Java order. Rows whose swap is NOT an ordering mechanism (a different
element drawn) go `open -> T2b/T2c` by re-slot.

## Write-set
`src/diagrams/activity/layout/{tile-coordinates,walk-repeat,edge-draw-order}.ts`,
`tests/diagrams/activity/layout/**`.

## Read-set
`decisions.md#D6`, `#D7`; assigned rows in `fixtures.md`; `.agent-notes/aedo-
T1.md` (Q3/Q4); `layout/edge-draw-order.ts` (whole, 124); `tile-coordinates.ts
:150-270`; Java `FtileRepeat.java:160-210`, `FtileIfLongHorizontal.java:200-
260`, `FtileWithConnection.java:60-80`.

## Acceptance
- Given each assigned row, when fixed, then its `text()`/`font-size` diffs are
  0 and the journal row quotes the Java order.
- Given the 311 rows, then 0 unexplained rises.

Quality bar: targeted vitest + typecheck + eslint. Boundaries: tiles/,
renderer files read-only. Observability: N/A. Rollback: Reversible.
