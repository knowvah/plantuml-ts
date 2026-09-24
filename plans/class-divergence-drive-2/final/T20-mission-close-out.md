# T20 — mission close-out

**Agent:** orchestrator · **Depends on:** T18 (and batch 5's close if run)

## Task

1. `measurements/final.json` = the last close's render-all; state the
   start → end survey counts and the D8 clauses in README `## Status`.
2. Every `fixtures.md` row has a `final`. Every `open -> <owner>` owner
   exists: a `planning/next-missions.md` entry under a new
   `## class-divergence-drive-2 — DONE <date>` heading (mechanism + files
   + why deferred), or a `docs/graphviz-issues/` file + `TRACKER.md` line.
3. Update `planning/next-missions.md`'s prior `class-divergence-drive`
   owner list: strike items this mission closed, with commit ids.
4. `DIVERGENCES.md`: add an entry only for a deliberate, documented
   divergence decided in this mission (none expected).
5. `planning/mission-index.md`: add the mission row.
6. Write the auto-memory status file
   (`~/.claude/projects/-Users-scottseely-git-knowvah-plantuml-ts/memory/
   class-divergence-drive-2-status.md`) + its `MEMORY.md` line.
7. Four gates; commit `docs(cdd2-T20): close class-divergence-drive-2 — <counts>`.
   The maintainer merges (merge commit, D10); do not push unless told.

## Acceptance criteria

- Given `fixtures.md`, when T20 commits, then no row has an empty `final`
- Given each `open ->` owner, when followed, then the target exists and
  names the mechanism
- Given README, when read, then it states start/end counts and each D8
  clause as met or not

## Observability · Rollback

N/A. Reversible.
