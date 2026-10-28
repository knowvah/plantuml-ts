# gantt-divergence-drive (gdd)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
[decisions.md](decisions.md), then the current batch's `overview.md`. Tail
[decision-journal.md](decision-journal.md) for where you stopped.

## Status — DONE 2026-10-28: batches 0–2 + exit closed; gantt 263 → 265/265 conformant, 0 losses in 27 engines; squashed branch awaits the user's signing (tag `gdd/pre-squash` holds the working history)

## Objective

Close the four gantt families `gantt-engine-port` (gep) filed and take gantt
from 263/265 to **265/265 conformant**, losing nothing in any of the other 27
engines. Planning re-read the Java and rendered every row, so three of the
four filed mechanisms are corrected here (see [decisions.md](decisions.md)):

| family | rows | state after planning |
|---|---:|---|
| transparent link `path/@stroke` | xureco-57-lene839 | mechanism confirmed: string `'none'` vs the transparent `HColorSimple` singleton; one-file equality seam (D1) |
| hidden footer under top chrome (`svg/@height` 8 px) | xikovo-87-rosu902 | reproduced: title or header + `hide footbox` loses exactly the footer height in the chrome seam; diagnose, then fix at the origin (D2) |
| emoji in separator names / note bodies | 0 corpus rows | two sites still build an empty sprite container without the injected emoji store; author fixtures, then thread `getEmojiStore()` (D3) |
| nakude "cannot last more than 20 years" / mogafu "8 px width" | nakude-77, mogafu-27 | both are error pages on both sides, differing only in ruled classes; no code, close with Java quotes (D4) |

Starting state (origin/main `01fe0c79b`, 2026-10-27): gantt survey 263
conformant / 1 structural-match / 1 diverged / 0 errored; 252 goldens in
`oracle/goldens/svg-gantt/`, 13 diff-baseline rows, 51 authored baselines.
Target (D8): 265/265, 254 goldens, five new authored fixtures jar-equal, 0
conformant losses anywhere, 0 unexplained rises.

## Branch

`feat/gantt-divergence-drive` off origin/main `01fe0c79b` (T0a fast-forwards
local main, runs `npm ci`, creates the branch and commits this brief). One
unsigned commit per task, `--no-ff` merges of task branches, a close commit per
batch. **Do not merge main into the branch mid-drive.** The squash batch
rebuilds one commit per batch and tags the working history `gdd/pre-squash`.
The user signs (`git rebase --force-rebase -S 01fe0c79b`), pushes, opens the
PR. **Never push.**

## Quality gates (all four before any close commit)

```sh
bash plans/gantt-divergence-drive/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. `uptime` first; above ~10 wait.
New src module ⇒ `npm run catalog` (drift-gated).

- `$T` = `plans/gantt-divergence-drive/tools/`, `$M` = `plans/gantt-divergence-drive/measurements/`.
- Survey: `npm run svg:survey -- gantt --out <path>` (never positional). All
  engines: `LOAD_MAX=8 SVG_PARITY_TIMEOUT_MS=900000 SVG_PARITY_CONCURRENCY=3
  bash $M/chain.sh <bN-eng>`; diff with `node $T/verdict-diff.mjs <prev> <next>`.
- One row: `npx tsx $T/diff-one.mts <slug>` (T0a writes it from the probe in
  the brief; renders through `renderFixtureGantt` + `ganttRenderOptions`).
- Oracle renders: `scripts/oracle-render.sh <ABSOLUTE out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file outside its write-set or one another same-batch task owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check — halt with the diagnosis
   artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts D1–D9: amend `decisions.md` (dated), then halt.
4. A conformant fixture in any of the 27 other engines leaves conformant
   without a stated mechanism (all-engine chain at every close and after
   every core commit: T1a, and T2a when its origin is core).
5. A pinned golden or diff-baseline row in any other engine stops being
   byte-equal or rises.
6. Any public API change: `render`/`renderSync` signatures, exported types, a
   `Theme`/`RenderOptions` field, any diff against `$M/b0-plantuml-ts.d.ts`.
   **Amendment 2026-10-27 (user ruling, journal rows 12 and 14).** The plugin
   seam is exempt: a d.ts diff confined to the `RenderFragment` /
   `AssembledSvg` declarations (the fragment contract between an engine's
   `index.ts` and `TextBlockExporter`, carried in the d.ts only because
   `AssembledSvg` references it; the repo has no consumers) is not a stop. The
   commit that makes it quotes the diff in the journal. `render`/`renderSync`,
   every other exported type and `Theme`/`RenderOptions` stay covered.
7. A fitted constant or new behaviour without an upstream `file:line` in the
   same commit; any oracle rendered by a hand-typed `java -jar`.
8. Any edit to dot-engine, the plantuml fork, the oracle jar or cached oracle
   bytes under `test-results/`; any push.
9. Proposing an `oracle/accepted-divergences.json` entry (the user signs).
10. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout at
    load below 8.
11. A new runtime dependency; DOM/async/Node built-ins, `Date`, `Date.now()`
    or `Math.random()` in `src/`.
12. A clock-dependent row compares without its recorded capture clock, or
    capture and compare disagree twice on one row.
13. A jar oracle for an authored fixture is an error page: fix the fixture
    once; a second error on the same construct halts.
14. T2a's artifact names an origin outside `src/core/annotations/`,
    `src/core/TextBlockExporter.ts`, `src/core/document-margin.ts` or
    `src/diagrams/gantt/index.ts`, or proposes a gantt-only branch in core.
15. The D1 seam moves a row in any other engine AWAY from the jar (a move
    toward the jar is journaled, not a stop).

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook (journal the new file); a test
  file added beside an existing one when the hook or coverage needs it.
- Re-pinning `parity-gantt.json`, the gantt goldens, the diff/authored
  baselines and the routing/refusal/freshness clones at closes (orchestrator
  only, counts journaled) when every changed row moved toward the jar.
- Spawning T2a from a complete T1b artifact (write-set journaled first).
- Dropping one authored fixture variant the jar cannot express (Java reason)
  and replacing it with the nearest construct it can.
- Closing a row as conformant by the 2026-10-10 error-page rule when both
  sides error, with the Java quote in `fixtures.md`.
- Moving a file between same-batch tasks when the dependency analysis missed
  an edge, before either task starts.
- Rerunning a timed-out vitest or survey at lower load before calling it a finding.

## Execution rules

- Tasks run in worktrees (`bash $M/mkwt.sh <Tn>`); agents commit unsigned,
  never push, never use Serena edit tools or `git stash`, never leave a
  background process running. Hand-backs can be empty: read each worktree's
  `git log`/diff and rerun its tests at merge.
- Before every merge: `git diff HEAD` empty. After: `bash $M/merge-one.sh`.
- Every task prompt = its `TN-*.md` + [task-contract.md](task-contract.md).
- Journal every decision, mover and halt with its commit.

## Batches

| Batch | Scope | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | branch + tooling, b0, five authored fixtures | T0a, T0b, T0c, close | [x] |
| [1](batch-1/overview.md) | D1 seam, xikovo diagnosis, emoji threading, pin tooling (parallel) | T1a–T1d, close | [x] |
| [2](batch-2/overview.md) | xikovo fix from the T1b artifact | T2a, close | [x] |
| [exit](batch-exit/overview.md) | final measurement vs b0, docs, memory, PR prep | T-exit | [ ] |
| [squash](batch-squash/overview.md) | one commit per batch; tag the history | T-squash | [ ] |

## Documents

- [decisions.md](decisions.md) — D1–D9, locked (user-approved 2026-10-27)
- [task-contract.md](task-contract.md) — shared by every task prompt
- [close-procedure.md](close-procedure.md) — standard batch close
- [fixtures.md](fixtures.md) — gantt family + fixture ledger (seeded)
- [decision-journal.md](decision-journal.md)
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- `diagnosis/` — T1b writes `xikovo.md` here
- `settings.autonomous.json` → copied to `.claude/settings.autonomous.json`

## Prior context (read only what a task points at)

- `plans/gantt-engine-port/` — the port this drive closes out: `README.md`
  final status, `fixtures.md` (ledger this one supersedes), journal rows 81,
  88, 90 (the filed artifacts, partly corrected here), batch-8 specs.
- `plans/sequence-divergence-drive-3/` — the drive pattern (D6 chain after
  core commits, D8 core driver fixes, D11 squash).
- `.agent-notes/gep-execution.md` — "a survey's conformant set is not a golden
  pin list" (the D5 tooling fix).

## Final status (exit batch, 2026-10-28)

| batch | tasks | gantt (conformant / structural / diverged / errored) | goldens | chain vs b0 |
|---|---|---|---|---|
| 0 | T0a, T0b, T0c, close — 3/3 | 263 / 1 / 1 / 0 | 252 | b0-eng = reference (28 engines) |
| 1 | T1a, T1b, T1c, T1d, close — 4/4 | 264 / 1 / 0 / 0 | 253 | 0 losses, 1 mover (xureco → conformant) |
| 2 | T2a, close — 1/1 | **265 / 0 / 0 / 0** | 254 | 0 losses, 1 mover vs b1 (xikovo → conformant); 2 vs b0 |
| exit | T-exit | 265 / 0 / 0 / 0 | 254 | = b2-eng (no `src/` change after `0bedc6aa4`; journal row 21) |

- **Tasks:** 8 of 8 planned tasks executed (T0a–T0c, T1a–T1d, T2a) plus three
  closes and the exit; no task re-scoped or dropped. The squash batch follows.
- **Decisions:** D1–D9 held. Two dated amendments, both journaled: D2's
  evidence narrative (row 9 — the 8 px is day-separator ink, not the footer
  height; the decision was unchanged) and stop 6 / D6 (rows 12, 14 — user
  ruling exempting the `RenderFragment` / `AssembledSvg` plugin seam from d.ts
  byte-equality; used once, row 18, 13 lines inside `RenderFragment.drawBodyAt`).
  One halt (row 12), resolved the same day. Flag for review: none beyond the
  two amendments.
- **Quality gates:** b0, b1 (+ b1close), b2, final — every run 1868 test files
  collected = 1868 on disk, 0 failed, typecheck / lint / build exit 0
  (`measurements/*-gates-run.log`, `*-npm-test.log`).
- **D8 exit bar:** gantt 265/265, `errored` 0, goldens 254, five authored
  fixtures jar-equal (`authored-baseline.json`: emoji-separator, emoji-note,
  title-/header-/caption-hide-footbox all 0), diff baseline 13 → 11 rows with
  0 rises, every `fixtures.md` family row CLOSED with its commit and Java quote.
- **Known issues / follow-ups** (`planning/next-missions.md`, gdd section):
  D1 option A `NONE_PAINT` representation mirror (10 files); D9 `data-*`
  comparator blind spot; margin-baked-arm canvas measurement (T1b open
  question). Observations in `.agent-notes/gdd-execution.md`; memory
  `gdd-status`.
- **Incident:** the session was lost to an out-of-memory kill mid-chain on
  2026-10-27 (load 209 from a concurrent session) and resumed 2026-10-28 by
  finishing the chain per engine (row 16); no work was lost.
