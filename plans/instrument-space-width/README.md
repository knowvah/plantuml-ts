# instrument-space-width (isw)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

The deterministic-text instrument both sides measure with — the oracle jar
under `-DPLANTUML_DETERMINISTIC_TEXT` and our `DeterministicMeasurer` — gives
U+0020 width 0 (upstream `UnicodeFontWidthSansSerif` block 0, index 32), so
every space in every oracle text is zero-wide and space-dependent geometry has
never been verified against what the stock jar draws (538/538 sampled oracle
`textLength`s; production `jarMeasurer` is unaffected). Give U+0020 the table's
own width for that advance (44, D1) on both sides at once, re-capture the whole
oracle, and fix EVERY port behaviour the new instrument reveals (D8, user
override: no hand-off). User ruling 2026-10-08 (lgm journal row 20).

Exit bar (D10): instrument exact (stop 4 never fired at the end);
`measurements/owed.json` empty; every b0-conformant fixture conformant at
final; 0 elements away from the jar b0→final; production render manifest
unchanged; the four lgm crash fixtures render as real diagrams and their
exclusion is removed; four gates green.

## Branch

`feat/instrument-space-width` off main at the brief commit. Merge commit at
close. **Never push.** `plans/` is tracked — commit the brief.

## Quality gates (all before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
npx prettier --check .
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`.
Gate merges at `--maxWorkers=4` while agents survey; grep a red ratchet for
"timed out" first. Pass = exit 0 and 0 failed; on_fail = fix_and_rerun (2-fix cap).

Measurement (`$M` = `plans/instrument-space-width/measurements/`):
- All engines: `$M/survey-all.sh <dir>`; `python3 $M/engdiff.py <prev> <next>`.
- Sequence: `npx jiti $M/seq-scores.mts <out.json>` (ratchet scoring).
- Elements (D5 of lgm, kept): `npx jiti $M/elements.mts <out.json> <engines>`;
  `python3 $M/elements-diff.py <prev> <next>`.
- Production manifest: `$M/production-manifest.mts` (written by T0a).
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` (one JVM per
  fixture); bulk re-capture only via T0b's `scripts/recapture-oracles.ts`.
- Task worktrees: `$M/mkwt.sh <ID>` (links `.husky/_`). Batch close:
  [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. Same gate fails on 2 consecutive fix attempts, or one location changes 3 times.
3. A finding contradicts D1–D10: amend `decisions.md`, then halt.
4. Instrument mismatch: after T1a, any space-bearing string whose new-jar
   `textLength` differs from `DeterministicMeasurer`.
5. A b1-conformant fixture loses conformance without a family mechanism, or any
   row moves away from the jar outside `owed.json`.
6. The production render manifest changes (b0 vs b1, or at any merge).
7. Collected ≠ on-disk, or a survey timeout at load < 8.
8. Any edit to `@knowvah/dot-engine`; any fork edit other than seam #4 (T1a's,
   authorized here); any push.
9. Any change to cached oracle bytes outside T1b's re-capture or a journaled
   single-fixture re-capture.
10. Signing a NEW entry in `oracle/accepted-divergences.json` (retiring or
    refreshing one is allowed).
11. A public API change.
12. A fitted constant or tolerance: a numeric change without upstream `file:line`.
13. Scale: > 25 reveal families at b1, or 3 fix batches without the owed count
    halving — re-scope with the user.
14. A library-forced claim without a controlled experiment isolating the library.
15. Dirty main checkout or non-empty stash at a merge: restore, journal, merge.
16. A worktree without `.husky/_`, or `prettier --check .` failing at a merge.

## Push-forward (decide, journal, continue)

Helper splits forced by the 500-line hook; splitting/merging reveal families
when the census shows a shared/distinct mechanism; creating fix tasks from the
census; re-pinning fallen rows; unpinning a b1 loss into `owed.json` with its
family; authoring jar fixtures; extending a finished task's write-set to a file
no running task owns; spawning a fix task for a regression found at a merge;
regenerating catalog/dashboard; updating a pre-change test with a Java quote;
resuming a stalled agent after inspecting its worktree; correcting a brief claim
that measurement disproves; re-capturing one contaminated fixture.

## Execution rules

Every agent prompt starts with [common-rules.md](common-rules.md). Orchestrator
gates every merge on stops 15/16 and runs the element check after it. T1b and
every all-engine survey run with NO agents active (load).

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | baseline, re-capture tool, harness rename | T0a, T0b, T0c | T0b ∥ T0a; T0c after T0b | [ ] |
| [1](batch-1/overview.md) | atomic instrument change + re-capture + classify | T1a, T1b | sequential | [ ] |
| [2](batch-2/overview.md) | fix every reveal family (template; repeats) | from census | per batch | [ ] |
| [final](batch-final/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

[decisions.md](decisions.md) · [common-rules.md](common-rules.md) ·
[close-procedure.md](close-procedure.md) · [fixtures.md](fixtures.md) ·
[decision-journal.md](decision-journal.md) ·
[diagrams/data-flow.md](diagrams/data-flow.md) ·
[diagrams/component-map.md](diagrams/component-map.md)

## Prior context (read only what a task points at)

`.agent-notes/oracle-svg-seam.md` (the crash characterization, the batching
defect, Batik/REPO trap); `planning/adr/ADR-001-text-measurement.md`;
`src/core/measurer-deterministic.ts` (dual-measurer rationale);
`plans/class-divergence-drive-5/` batch 0 (precedent: corpus-wide oracle re-pin,
D1 unpinning); `plans/large-group-mirror/decision-journal.md` rows 13–20.
Memories: instrument-space-width-zero, worktrees-skip-git-hooks,
always-mirror-the-jar, census-away-from-jar-catches-hidden-regressions,
repin-script-raises-preexisting-red-pin, agents-write-main-via-serena,
conformance-harness-mirrors-index-ts.

## Status

Not started.
