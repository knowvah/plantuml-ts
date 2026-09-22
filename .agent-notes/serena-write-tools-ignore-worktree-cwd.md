# Serena write tools resolve against the project root, not a worktree cwd

## Observation: `replace_symbol_body` (and likely `insert_after/before_symbol`, `safe_delete_symbol`, `rename_symbol`) wrote to the MAIN checkout while running inside a worktree

- **Context**: T25 (`class-divergence-drive`), running inside
  `.claude/worktrees/cdd-t25` per its own mission constraint ("never edit
  files in the main checkout"). Called `mcp__serena__replace_symbol_body`
  with a `relative_path` (e.g. `src/diagrams/class/class-layout-header-creole.ts`)
  as every other Serena call in the session had been doing successfully for
  reads.
- **Finding**: the edit silently landed in the MAIN checkout
  (`/Users/scottseely/git/knowvah/plantuml-ts/...`), not the worktree —
  caught only because the orchestrator was independently watching the main
  tree's `git status` and saw an unexpected modification appear there. The
  worktree's own copy of the file was untouched (confirmed by re-reading it
  immediately after the tool reported success: the OLD body was still on
  disk). Serena's project root is fixed at the server's activation point
  (this project), and a `relative_path` argument resolves against THAT
  root — it does not follow the calling shell's `cwd`, which is the only
  thing that differs between "the main checkout" and "a worktree of it".
  Read-only Serena tools (`find_symbol`, `get_symbols_overview`,
  `search_for_pattern`) exhibited the SAME root resolution but caused no
  harm since they only reported content, never wrote it.
- **Impact**: any task instructed to work inside a worktree must not use
  Serena's WRITE tools (`replace_symbol_body`, `insert_after_symbol`,
  `insert_before_symbol`, `safe_delete_symbol`, `rename_symbol`) at all —
  they will target the main checkout regardless of the calling shell's
  directory. Use `Edit`/`Write` with an absolute worktree path instead;
  Serena's read tools remain safe and useful for navigation. This matches
  (but is a distinct mechanism from) `batch-parallelism-needs-worktrees.md`'s
  "the index is shared state no write-set declaration governs" finding —
  that note is about `git add -A` racing a live agent; this one is about a
  single tool resolving the wrong root entirely, with no race required.
- **Confidence**: High (reproduced twice in one session, both caught by
  the orchestrator's independent `git status` watch on the main tree).
