# Batch 5 — record the outcome

One task. Nothing in `src/` changes.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T8](T8-record-outcome.md) | Supersede the offset-groups note, tick the tracker, correct a stale doc | technical-writer | `.agent-notes/class-ink-shared-offset-groups.md`, `docs/graphviz-issues/TRACKER.md`, `docs/architecture/overview.md`, `DIVERGENCES.md` if needed | T7 | [ ] |

## Why this is a task and not an afterthought

`.agent-notes/class-ink-shared-offset-groups.md` is what made this mission
findable: it collapsed five apparently-separate offset groups into one
mechanism and named the 11 fixtures. Leaving it describing a solved problem
would send the next reader after a ghost — the same failure the note itself
was written to prevent.

The `technical-writer` agent has no Edit or Bash tool and rewrites whole
files. Diff its output with `git diff --numstat` afterwards and run the
gates yourself.

## Batch exit criteria

- The note's group (a) is marked superseded, with measured before/after.
- `TRACKER.md`'s box for issue 14 is ticked ONLY if the pinned engine moved
  and the fixtures re-measured clean — that is the folder's own rule.
- All four gates green (docs-only, but run them).
