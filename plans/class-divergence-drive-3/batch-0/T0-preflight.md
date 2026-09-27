# T0 — pre-flight

**Agent:** orchestrator · **Depends on:** —

## Task

1. `git fetch origin && git switch -c feat/class-divergence-drive-3 origin/main`.
2. Four gates on the fresh branch (must be green; else stop).
3. `npx jiti plans/class-divergence-drive/tools/render-all.mts plans/class-divergence-drive-3/measurements/b0.json`;
   pin-diff vs `b-plan.json` — expect 607/55/61, 0 movers; journal any.
4. **Engine baseline (D7):** survey every engine at the branch point:
   for each `tests/oracle/svg-conformance/parity-<e>.json` except class,
   `npm run svg:survey -- <e> --out /tmp/cdd3-b0-eng/parity-<e>.json`.
   This, not the committed pins, is every later close's comparison base.
   Copy the summary line per engine into the journal.
5. **Promote the pin script (D7):** add
   `plans/class-divergence-drive/tools/pin-goldens.mts` (port of cdd2's
   scratch `pin.mjs`: args `<source-tag> <close-label> <slug...>`; copy
   `in.svg`→`golden.svg` and `in.puml` with byte-equality checks; append
   to `ratchet.json` WITHOUT re-sorting; clone each slug's
   `dot-cache/class` twin row in `routing-baseline.json` and
   `refusal-baseline.json` as `tree: goldens, type: svg-class` with
   `measuredAt`/`measuredAgainstCommit`; extend each `$comment`) plus
   `pin-goldens.test.mts` beside it (the tools dir has its own vitest
   config — run it with `npx vitest run --config
   plans/class-divergence-drive/tools/vitest.config.mts`).
6. Record `readlink oracle/dist/plantuml-oracle.jar` and `oracle/pin.json`
   version in the journal.
7. Commit `docs(cdd3-T0): add class-divergence-drive-3 brief and baseline`.

## Acceptance criteria

- Given `origin/main`, when the branch is cut, then all four gates pass
- Given `b0.json`, when diffed against `b-plan.json`, then 0 movers or each journaled
- Given `pin-goldens.mts` on a temp copy, when run on one slug, then the
  golden is byte-identical, the ratchet's `fixtures[0]` is unchanged, and
  both baselines gain exactly one `goldens` row

## Observability · Rollback

N/A. Reversible (delete the branch).
