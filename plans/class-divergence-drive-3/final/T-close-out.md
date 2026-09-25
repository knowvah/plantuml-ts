# T-close-out — mission close-out

**Agent:** orchestrator · **Depends on:** T-exit

1. `measurements/final.json` = `b5.json`; README `## Status` states start →
   end survey counts and each exit clause.
2. Every `fixtures.md` row has a `final`; every `open ->` owner exists — a
   `planning/next-missions.md` entry under a new
   `## class-divergence-drive-3 — DONE <date>` heading (mechanism + files +
   why deferred), a `docs/graphviz-issues/` file + `TRACKER.md` line, or a
   listed acceptance proposal awaiting maintainer signature.
3. Strike items this mission closed in the `class-divergence-drive-2` and
   `class-divergence-drive` sections of `next-missions.md`, with commit ids.
4. `DIVERGENCES.md`: an entry only for a deliberate divergence decided and
   signed in this mission.
5. `planning/mission-index.md`: add the mission row (next free SI id).
6. Auto-memory status file
   (`~/.claude/projects/-Users-scottseely-git-knowvah-plantuml-ts/memory/class-divergence-drive-3-status.md`)
   + its `MEMORY.md` line.
7. Four gates; commit `docs(cdd3-close): close class-divergence-drive-3 — <counts>`.
   The maintainer merges (merge commit); do not push unless told.

## Acceptance criteria

- Given `fixtures.md`, when committed, then no row has an empty `final`
- Given each `open ->` owner, when followed, then the target exists and names the mechanism
- Given the README, then it states start/end counts and every exit clause

## Observability · Rollback

N/A. Reversible.
