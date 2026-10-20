# T-close-out — filing, docs, hand-off

1. `planning/next-missions.md`: a `## sequence-divergence-drive (sdd1) —
   DONE <date>` section at the top in the add1/cdd7 shape: branch, counts
   (pins, Σ, survey, cohorts b0 → final), mechanisms fixed with Java cites,
   `### Open -> sdd2` by family with fixture counts (the geometry and
   structural cohorts from `final-classify.json` grouped by diff key —
   text x/y, Y extents, `polygon@points`, `path@d`, `childCount`, tag
   substitutions), `### Error rows -> command mission` (the 13 rows and
   their unported commands, D8), `### Flags` (every D amendment, every halt).
2. `planning/sequence-next-missions.md`: replace the 2026-09-01 headline with
   the final numbers; keep the findings that still hold, mark the rest
   superseded with the date.
3. `planning/mission-guide.md`: fix the stale G-1 line (sequence HAS jar
   oracle coverage since 2026-08-20; it now also has a style seam).
4. `oracle/goldens/svg-sequence/README.md` "Current state": pins, the
   `pinned` status (T0b), the pin tool.
5. Memory: `sdd1-status.md` + its `MEMORY.md` line; update any memory this
   mission disproved.
6. Final gates on the branch (`bash $M/gates.sh close`). **Do not merge to
   main and do not push**: main requires signed commits and a PR (memory
   `signed-commits-need-user-rebase`). Hand the user, for their own
   terminal (it needs the YubiKey PIN — never enter it):
   `git rebase -r --force-rebase -S main` on `feat/sequence-divergence-drive`
   (`-r` keeps the per-batch merge commits the journal cites). After they
   confirm: verify every commit's `gpgsig` header, re-run the gates, `git
   config --worktree --unset commit.gpgsign`, and open the PR only on their
   go-ahead (outward-facing action).
7. Remove worktrees and task branches; delete `.plan-mission-progress.md`
   if present.

Write-set: `planning/{next-missions,sequence-next-missions,mission-guide}.md`,
`oracle/goldens/svg-sequence/README.md`, `plans/sequence-divergence-drive/**`,
`~/.claude/projects/-Users-scottseely-git-knowvah-plantuml-ts/memory/`.

Acceptance:
- Given `next-missions.md`, then every open paint-only row and every sdd2
  family has a count and a mechanism or "unexplored".
- Given the branch, then all four gates pass and `git log main..` contains
  only sdd1 commits.

Observability: N/A. Rollback: Reversible (the branch is unmerged).
