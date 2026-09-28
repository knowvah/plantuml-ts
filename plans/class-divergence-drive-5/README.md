# class-divergence-drive-5 (cdd5)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Close the remaining class divergences on the production path, in two parts.

1. **Re-pin the oracle (batch 0).** Move it from 1.2026.7beta11 to 1.2026.8beta1
   (upstream `97a5992`, the jar the symlink already names and the Java the port
   has been read against), recapturing every engine's cache. This settles besepi
   and makes the oracle homogeneous again (the cdd4 journal 7 ruling).
2. **Drive the unknown-bucket CLASS rows (batches 1–5).** The unknown bucket holds
   **284 fixtures that both the jar and the port type as CLASS**, and only 51 of
   them are conformant: 196 diverged, 35 structural-match, 2 errored, plus 3
   NONE→CLASS. No earlier cdd counted them, because the class ledger covers only the
   class bucket. Batch 1 makes them censusable and pinnable. Batch 2 diagnoses
   them into mechanism families. Batches 3–5 fix the largest families.

Starting state (main `f49cbad13`, pre-re-pin):
- class bucket 707 / 3 / 13 (conformant / structural-match / diverged);
  15 of its 16 non-conformant rows are accepted, and besepi is open;
- ratchet 706.
The post-re-pin baseline (T5 `measurements/b1.json`) is the reference for every
"loss" after batch 0.

## Branch

`feat/class-divergence-drive-5` off main. Merge commit at close (never squash;
the journal cites per-task commits). **Never push** anything: not main, not the
fork, not dot-engine.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test            # full suite, never a filter; collected files = find tests -name '*.test.ts' | wc -l
npm run typecheck
npm run lint
npm run build
```
Check load first (`uptime`). Above ~20, re-run a red `npm test` before believing
it (memory: confounded-wall-clock-readings).

Measurement commands:
- Survey: `npm run svg:survey -- <engine> --out <path>`. Never use the positional
  form, which writes `parity.json`.
- Census: `npx jiti scripts/svg-conformance-census.ts class --json <path>`.
- Tools: `$T` = `plans/class-divergence-drive/tools/` (`render-all`,
  `render-diff`, `pin-diff`, `pin-goldens`).
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file that a concurrently running task owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location changes
   3 times without resolving the same check.
3. A finding contradicts D1–D9: amend `decisions.md`, then halt.
4. **After T0e:** a conformant fixture in any engine leaves conformant, or
   `dotEqual` flips true→false, without a stated mechanism. During batch 0,
   oracle-effect movers are expected and are journaled, not stopped on.
5. A diff-count rise with no mechanism. A structural fall with a numeric rise is a
   reveal, not a stop.
6. Class DOT parity goes red after T0e.
7. A survey timeout at load below 8, or JSON-reporter collected ≠ on-disk.
8. The rebuilt jar does not `cmp` equal to `plantuml-1.2026.8beta1.jar`, or the
   recapture leaves any 7beta11-form file (D8).
9. Any oracle change after T0c, other than a journaled re-capture of a single
   fixture's jar failure.
10. More than 20 new non-class verdict movers at a batch 3–5 close. Every mover
    still needs a mechanism.
11. Any edit under `~/git/knowvah/dot-engine`, any push of the fork or dot-engine,
    or any change to the fork's `master`.
12. Writing an acceptance as maintainer-signed (D7).

## Push-forward (decide, journal, continue)

- A pure type or file-cap move that extends a write-set.
- Unit-pin updates explained by a measured mechanism.
- Pinning goldens that are survey-conformant AND census 0-diff (either tree).
- Unpinning a fixture the re-pin broke (D1), with its journal and `fixtures.md` row.
- A TRACKER line plus a `docs/graphviz-issues/` file for any new dot-engine finding.
- Collapsing two fix tasks that turn out to share a file.
- `final = open -> cdd6` when diagnosis finds no mechanism, or when a family
  missed the fix batches.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | oracle re-pin to 8beta1 | T0a–T0f | sequential | [x] |
| [1](batch-1/overview.md) | census via renderSync, `tree` ratchet, tooling, post-re-pin baseline | T1–T5 | T1–T4 ∥ | [x] |
| [2](batch-2/overview.md) | diagnosis of every non-conformant CLASS row | T6–T10 | T6–T9 ∥ | [x] |
| [3](batch-3/overview.md) | empty diagram, desc-leaf dispatch, note qualification, json shield, badges (78 rows) | T3a–T3e | all ∥ (worktrees) | [x] |
| [4](batch-4/overview.md) | degenerate layout, classifier declaration, multiline, desc-label embed, leaf/legend singles (38 rows) | T4a–T4e | all ∥ (worktrees) | [x] |
| [5](batch-5/overview.md) | creole, member parsing, cluster style + namespace title, relationship/directive singles, class ink/layout residuals (26 + 21 reassigned rows) | T5a–T5e | all ∥ (worktrees) | [ ] |
| [6](batch-6/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

- [decisions.md](decisions.md): D1–D9, locked
- [close-procedure.md](close-procedure.md): standard batch close
- [fixtures.md](fixtures.md): row ledger, one row per CLASS fixture not conformant
  at b1 (created by T5, filled by T6–T9, settled by closes)
- [diagnosis/](diagnosis/): shard files (T6–T9), then `families.md` (T10)
- [batch-3/TEMPLATE.md](batch-3/TEMPLATE.md): fix-task template T10 fills
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- [decision-journal.md](decision-journal.md): append one row per decision,
  mover, halt
- `measurements/`: survey/census/render-all JSON per checkpoint

## Prior context (read only what a task points at)

- `planning/next-missions.md`, section `class-divergence-drive-4`: the follow-ons this
  mission picks up
- `plans/class-divergence-drive-4/decision-journal.md` rows 6–7 (besepi ruling),
  15–17 and 22–23 (census dispatch, sokevu)
- Memories that apply: verify-agent-claims-si31, agents-correct-the-orchestrator,
  comparesvg-count-not-monotonic, conformant-is-not-divergence-gone,
  batch-parallelism-needs-worktrees, subagent-handback-single-shot,
  dot-engine-blame-needs-real-dot, svg-survey-positional-arg-writes-parity-json,
  coverage-tmp-silent-undercollect, vitest-filter-can-collect-nothing
