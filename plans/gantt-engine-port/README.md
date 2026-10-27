# gantt-engine-port (gep)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Status — HALTED 2026-10-24 after batch 1 (stop 3: Amendment 1, ubrex — awaiting ruling)

## Objective

Port upstream's gantt engine (`net/sourceforge/plantuml/gantt/`, 167 files,
20,082 lines, MIT edition) so `@startgantt` and `{{gantt}}` render as the jar
does. Today the port draws a 300×60 "Error: unknown diagram type" box. Port
file-for-file with upstream names (D1) over a new integer `java.time` subset
(D2) and one injected clock (D3), drawing through klimt `UGraphicSvg` and the
document shell like salt/wbs/mindmap (D4). Measure the 265 corpus rows plus
upstream's `vega/xgantt` and authored fixtures; run one bounded conformance
pass (batch 8); file every remaining divergence family for the gantt
divergence drives. Exit bar is measured, not guessed (D9).

Starting state (main `1be33f054`, 2026-10-24): gantt survey 1 conformant /
254 diverged / 10 jar error pages; `DiagramType.GANTT`, block extraction,
`{{gantt}}` key and `ganttDiagram` styles exist; `src/core/gantt/Failable.ts`
is already ported; no date module.

## Branch

`feat/gantt-engine-port` off main `1be33f054` (T0a creates it and commits this
brief). One unsigned commit per task, `--no-ff` merges of task branches, a
close commit per batch. **Do not merge main into the branch mid-drive.** The
squash batch rebuilds one commit per batch and tags the working history
`gep/pre-squash`. The user signs (`git rebase --force-rebase -S 1be33f054`),
pushes, opens the PR. **Never push.**

## Quality gates (all four before any close commit)

```sh
bash plans/gantt-engine-port/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. `uptime` first; above ~10 wait.
New src module ⇒ `npm run catalog` (drift-gated).

- `$T` = `plans/gantt-engine-port/tools/`, `$M` = `plans/gantt-engine-port/measurements/`.
- Survey: `npm run svg:survey -- gantt --out <path>` (never positional). All
  engines: `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000 SVG_PARITY_CONCURRENCY=3
  bash $M/chain.sh <bN-eng>`; diff with `node $T/verdict-diff.mjs <prev> <next>`.
- Oracle renders: `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>` only
  (a relative out-dir resolves against the puml's dir).
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set or one another same-batch task
   owns (batch 5's serial chain shares one worktree by design).
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check — halt with the diagnosis
   artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts D1–D10: amend `decisions.md` (dated), then halt.
4. A conformant fixture in any of the 27 other engines leaves conformant
   without a stated mechanism (all-engine chain at every close).
5. A pinned golden or diff-baseline row in any other engine stops being
   byte-equal or rises.
6. Any public API change: `render`/`renderSync` signatures, exported types, a
   `Theme`/`RenderOptions` field, any `dist/*.d.ts` diff.
7. A fitted constant or new behaviour without an upstream `file:line` in the
   same commit; any oracle rendered by a hand-typed `java -jar`.
8. Any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle
   bytes under `test-results/`; any push.
9. Proposing an `oracle/accepted-divergences.json` entry (the user signs).
10. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout at
    load below 8.
11. A new runtime dependency; DOM/async/Node built-ins, `Date`, `Date.now()`
    or `Math.random()` in `src/` (date maths is integer arithmetic, D2).
12. A clock-dependent row compares without a recorded capture clock, or
    capture and compare disagree twice on one row — raise the D3 fork-seam
    fallback with the user.
13. An upstream file carries a `::remove`/`::comment` marker for `__MIT__`.
14. The batch-5 chain is not typecheck-clean at its end, or needs a file
    outside the 25-file cycle (`diagnosis/upstream-batch-groups.txt` B5).
15. A jar oracle is an error page for syntax we render: fix the fixture once;
    a second error on the same construct halts.
16. Batch 8 would touch more than 4 families, or a file outside
    `src/diagrams/gantt/`, `src/core/time/`, `src/core/clock.ts`, without a
    diagnosis artifact.

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook (journal the new file).
- A private Java helper/inner class ported as its own module beside its owner
  (upstream name in `@see`).
- Adding a `java.time` method a later batch needs to `src/core/time` (with test
  + Java citation).
- From batch 7: re-pinning `parity-gantt.json`, the gantt ratchets and the
  routing/refusal/freshness pins at closes (orchestrator only, counts journaled).
- Rebuilding gantt baselines when every changed row moved toward the jar.
- Dropping one authored fixture variant the jar cannot express (Java reason).
- Spawning a fix task from a complete diagnosis artifact (write-set journaled
  before work starts).
- Moving a file between same-batch tasks when the dependency analysis missed
  an edge, before either task starts.

## Execution rules (D6, D7)

- Tasks run in worktrees (`bash $M/mkwt.sh <Tn>`); agents commit unsigned,
  never push, never use Serena edit tools or `git stash`, never leave a
  background process running. Hand-backs can be empty ("placeholder", lad
  rows 9/19/20): read each worktree's `git log`/diff and rerun its tests at
  merge.
- Before every merge: `git diff HEAD` empty. After: `bash $M/merge-one.sh`.
- Every task prompt = its `TN-*.md` + [task-contract.md](task-contract.md).
- Journal every decision, mover and halt with its commit.

## Batches

| Batch | Scope | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | branch, b0, fixtures + oracles, gantt harness, capture clock | T0a–T0c, close | [x] |
| [1](batch-1/overview.md) | `src/core/time`, clock seam, `I18nTimeData` | T1a–T1c, close | [x] |
| [2](batch-2/overview.md) | upstream layers L00–L01 (3,563 lines) | T2a–T2d, close | [ ] |
| [3](batch-3/overview.md) | L02–L05 (2,779) | T3a–T3c, close | [ ] |
| [4](batch-4/overview.md) | L06–L09 (2,606) | T4a–T4c, close | [ ] |
| [5](batch-5/overview.md) | the 25-file cycle (5,670), serial chain | T5a–T5e, close | [ ] |
| [6](batch-6/overview.md) | L11 grammar + commands (2,824) | T6a–T6d, close | [ ] |
| [7](batch-7/overview.md) | grammar top, factory, plugin, turn-on + capture (serial) | T7a–T7c, close | [ ] |
| [8](batch-8/overview.md) | first conformance pass (2–4 families) | T8x, close | [ ] |
| [exit](batch-exit/overview.md) | final measurement vs b0, docs, memory, PR prep | T-exit | [ ] |
| [squash](batch-squash/overview.md) | one commit per batch; tag the history | T-squash | [ ] |

## Documents

- [decisions.md](decisions.md) — D1–D10, locked (user-approved 2026-10-24)
- [task-contract.md](task-contract.md) — shared by every task prompt
- [close-procedure.md](close-procedure.md) — standard batch close
- [fixtures.md](fixtures.md) — gantt fixture + corpus ledger
- [decision-journal.md](decision-journal.md)
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- `diagnosis/upstream-scc-layers.txt` (file-level dependency layers L00–L16),
  `diagnosis/upstream-batch-groups.txt` (the batch grouping derived from it)
- `settings.autonomous.json` → copied to `.claude/settings.autonomous.json`

## Prior context (read only what a task points at)

- `plans/wbs-engine-port/`, `plans/salt-engine-port/` — engine-port harness
  pattern (`render-fixture-<engine>.ts`, golden + diff-baseline ratchets).
- `plans/lengthadjust-document-wide/decisions.md` Amendment 1 — the
  `InternalRenderOptions` seam pattern D3 reuses.
- `planning/gantt-deepdive.md`, `planning/mission-guide.md` Phase 4d — STALE
  (cite `project/`, ~75 files); hints only; the exit corrects them.
