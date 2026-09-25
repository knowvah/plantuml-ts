# T0 — pre-flight

**Agent:** orchestrator · **Depends on:** —

## Task

1. `git fetch origin && git switch -c feat/class-divergence-drive-2 origin/main`.
   The brief directory is untracked on the planning branch; carry it over
   (it is not in `.gitignore`).
2. Four gates on the fresh branch (baseline must be green; if not, stop —
   the mission does not start on a red tree).
3. `npx jiti plans/class-divergence-drive/tools/render-all.mts
   plans/class-divergence-drive-2/measurements/b0.json`, then `pin-diff`
   `b-plan.json` → `b0.json`. Expected 560/86/77. Journal every mover
   between the planning commit `353176512` and `origin/main` with its
   mechanism (main added `506fdb4e6`, a `applySeededDefIds` url(#) scan
   change — a def-id mover is expected there if any).
4. Refresh `fixtures.md`'s `plan verdict`/`S`/`N` columns from `b0.json`
   (keep the column names; note the source in the preamble).
5. Record `readlink oracle/dist/plantuml-oracle.jar`, the jar's version
   stamp, and `oracle/pin.json`'s version in the journal (D5).
6. Commit `docs(cdd2-T0): add class-divergence-drive-2 brief and baseline`.

## Acceptance criteria

- Given `origin/main`, when the branch is cut, then all four gates pass
- Given `b0.json`, when diffed against `b-plan.json`, then every mover has
  a journal row, or there are none
- Given `fixtures.md`, when committed, then its S/N columns match `b0.json`

## Observability · Rollback

N/A. Reversible (delete the branch).
