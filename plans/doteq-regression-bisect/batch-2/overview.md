# Batch 2 — fix tasks (deliberately unwritten at planning time)

**There are no task files here yet, and that is the design.** Per
[D5](../decisions.md#d5), no write-set is knowable until each cause is found.
Inventing one now would be the exact error this mission exists to correct: a
fix proposed before a mechanism is stated.

## How to populate this batch

After Batch 1, for each artifact `.agent-notes/bisect-doteq-<slug>.md`:

1. Read its `proposedWriteSet` and `originFile`/`originLine`.
2. Write `T<n>-fix-<slug>.md` following the shape of a Batch 1 task, with
   the artifact's origin as the **declared write-set**, plus that file's
   test file.
3. Fill the task table below.

**If two artifacts name the same origin, collapse them into one task** — one
writer per file. Record in the journal that the shared cause was *found*, not
assumed (push-forward 2).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| — | populated after Batch 1 | | | | |

## Binding constraints

- **Stop condition 2**: a fix that must reach beyond the file its artifact
  names is a signal the mechanism was not found. Stop; do not widen.
- **TDD** (`~/.claude/rules/testing.md`): the failing behaviour gets a test
  before the fix.
- **Symptom gone is not done.** `dotEqual` flipping true without the artifact
  explaining why the culprit broke it is stop condition 4.
- Each fix task runs all four quality gates before its commit lands.
