# sequence-divergence-drive-2 (sdd2)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Take sequence from 419 to every reachable fixture conformant with the jar.
sdd1 put the style seam in and pinned 419; what is left is **layout and
structure**: 539 geometry rows (Σ 42472), 166 structural (Σ 30797), 13
error rows. Four planning research passes explained them by mechanism
(`research/`): the vertical tile model (notes beside messages, `&`
parallel, activation stairs, inclination, vmerge — prototyped: 419 → 478
zero-diff, 0 pinned lost), horizontal extents (self reservation, frame
extents, reverse self), text placement (stick labels, exo labels,
`SequenceMessageAlign`), structure (creole through core `DisplayCreole`,
unclosed groups, banner, self dressing, multicast, …) and the error rows
(seven unported commands / regexes, three core preprocessor bugs). The jar
is always teoz (`SequenceDiagram.java:311-312`, `GlobalConfig.java:47`), so
every cite is a `teoz/` or `skin/rose/` path. Target (D9): **every zero-diff
row pinned, floor 560**, 0 conformant losses in any engine.

Starting state (main `b34120ea9`, 2026-10-21; `../sequence-divergence-drive/
measurements/final-classify.json`): 1141 rows — zero 419 · paint-only 4 ·
geometry 539 · structural 166 · error 13; pins 419; Σ 73273. Batch 0's b0
(`measurements/b0*`) is the reference for every "loss" and "rise".

## Branch

`feat/sequence-divergence-drive-2` off main. While the drive runs: one
unsigned commit per task, `--no-ff` merges of task branches, a close commit
per batch — the journal cites these. **Do not merge main into the branch
mid-drive.** At the end, the squash batch rebuilds the branch as one
commit per batch from the close trees (tree-identical), tagging the
working history `sdd2/pre-squash` (D11); the user then signs
(`rebase -S`), pushes and opens the PR. **Never push** anything (not main,
not the plantuml fork, not dot-engine). `plans/` is tracked — commit the
brief.

## Quality gates (all four before any commit lands on the branch)

```sh
bash plans/sequence-divergence-drive-2/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk. Check `uptime` first; above
~10 wait. New src module ⇒ `npm run catalog`.

- `$T` = `plans/sequence-divergence-drive-2/tools/` (T0e copies sdd1's),
  `$M` = `plans/sequence-divergence-drive-2/measurements/`.
- Classify: `npx tsx $T/classify.mts <out.json>`; one fixture:
  `npx tsx $T/diff-one.mts <slug> [filter]`; hashes: `$T/svg-hashes.mts`.
- Survey: `npm run svg:survey -- sequence --out <path>` (never positional).
- All engines: `bash $M/chain.sh <bN-eng>`; diff with `$T/verdict-diff.mjs`.
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check. The halt carries the
   diagnosis artifact (mechanism, origin `file:line`, causal chain, ruled out).
3. A finding contradicts D1–D11: amend `decisions.md`, then halt.
4. A conformant fixture in **any** engine leaves conformant without a stated
   mechanism (all-engine survey at every close, after the B2 close, and
   after every core commit — D6).
5. A `weightedScore` rise on any sequence row with no mechanism (a
   structural fall beside a numeric rise is a reveal, not a stop).
6. A pinned golden stops being byte-equal.
7. Batch 0's splits are not hash-identical on all 1141 rows (both paths), or
   T6a's parity probe shows a delta it cannot diagnose (halt before 6b).
8. A non-additive edit under `src/core/style/**` or `src/core/klimt/**`; any
   edit to dot-engine or the plantuml fork; any push. (Core preprocessor and
   core creole edits are allowed — D6.)
9. Any change to the oracle jar or cached oracle bytes.
10. Proposing an entry in `oracle/accepted-divergences.json` (the user signs).
11. A public API change: `render`/`renderSync`/`renderAll` signatures,
    exported option types, or deleting a `Theme` field.
12. A fitted constant: any numeric change without an upstream `file:line` in
    the same commit.
13. Survey and ratchet disagree on a fixture and the mechanism is not
    isolated inside the 2-fix budget.
14. More than 30 non-sequence movers at a close (B8: unless each mover is
    explained row by row by its core change).
15. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout
    at load below 8.
16. An `error` row that starts rendering counted as a silent win (report and
    promote it; the transition itself is not a stop).
17. Sequence survey wall-clock > 1.5× b0 on a quiet box with no named cause.
18. A Batch 5 diagnosis cannot produce the artifact: halt with the partial
    artifact, never with a guessed fix.

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook — journal the new file.
- Baseline re-pins explained by a measured mechanism with a Java quote (diff
  the JSON before/after; any row that ROSE gets its own line).
- Pinning any slug that is zero-diff at a close (orchestrator only).
- Spawning Batch 5 fix tasks from a complete diagnosis artifact, write-set
  journaled before work starts.
- Adding a fixture to a task's target list when its diffs match the task's
  mechanism; dropping one whose remainder belongs to another family
  (journal the owner).
- Re-slotting a row between batches; `final = open -> next drive` when the
  mechanism is found but falls outside every write-set.
- Collapsing two tasks that share a file; moving a structural cluster
  between Batch 7 tasks when write-sets collide.
- fifasu stays out (its image needs an http fetch; sync rendering cannot).
- A mismatch with Research C's prototype numbers is data, not a stop: the
  jar is the spec, the prototype is not.
- Regenerating the catalog or the parity dashboard.

## Execution rules (D1)

- Parallel tasks run in worktrees made by `$M/mkwt.sh <Tn>`.
- Agents: targeted tests + typecheck + eslint; **no Serena edit tools**
  (they write the MAIN checkout), no `git stash`. Orchestrator: `git diff
  HEAD` empty before every merge; four gates + full conformance set at
  `--maxWorkers=4`; golden ratchet + classify after **every** merge (memory
  `parallel-merges-break-pins`).
- Every task spec is a self-contained agent prompt together with
  [task-contract.md](task-contract.md).

## Batches

| Batch | Scope | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | branch, tools, b0; pure-move splits | T0a–T0e | [x] |
| [1](batch-1/overview.md) | note gaps, unported commands, unclosed group | T1a–T1c, close | [x] |
| [2](batch-2/overview.md) | vertical tile model; LinkAnchor | T2a–T2e, close | [x] |
| [3](batch-3/overview.md) | horizontal extents; reverse self | T3a–T3c, close | [x] |
| [4](batch-4/overview.md) | text placement | T4a–T4c, close | [x] |
| [5](batch-5/overview.md) | remainder: diagnose, then fix | T5a, T5b, T5c…, close | [x] |
| [6](batch-6/overview.md) | creole through core | T6a–T6e, close | [x] |
| [7](batch-7/overview.md) | remaining structural families | T7a–T7g, close | [ ] |
| [8](batch-8/overview.md) | core preprocessor errors | T8a–T8c, close | [ ] |
| [exit](batch-exit/overview.md) | final re-pin, survey, ledger, PR prep | T-exit | [ ] |
| [squash](batch-squash/overview.md) | one commit per batch from the close trees; tag the working history | T-squash | [ ] |

## Documents

- [decisions.md](decisions.md): D1–D11, locked
- [task-contract.md](task-contract.md): shared by every task prompt
- [close-procedure.md](close-procedure.md): standard batch close
- [fixtures.md](fixtures.md): cohort ledger (seeded by T0e)
- [decision-journal.md](decision-journal.md): one row per decision, mover, halt
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- `research/`: the four planning reports (A text, B width, C vertical, D
  structure) — the mechanism source every task cites
- `prototypes/`: Research C's patches (`m_*.patch`, reference only — D2),
  leave-one-out sets (`loo_*.json`), its harness; Research B's width
  predictor (`width-predictor.mts`)
- `diagnosis/`: Batch 5 artifacts
- The research reports cite `/private/tmp/.../scratchpad/research-*` paths
  from the planning session; those are gone. Their reusable parts are in
  `prototypes/` (`predict2.mts` → `width-predictor.mts`; research C's
  `m_*.patch`, `proto-stairs.ts.txt` (renamed: lint-staged type-lints `.ts`), `measure.mts`, `cmp.py`, `base.json`;
  `expected-zero.json` derives the per-task zero sets from the LOO runs).

## Prior context (read only what a task points at)

- `plans/sequence-divergence-drive/` — sdd1: the style seam, tools, journal
- `oracle/goldens/svg-sequence/README.md` — the ratchet and the Add rule
- `planning/next-missions.md` — the sdd2 families as filed at sdd1 close
