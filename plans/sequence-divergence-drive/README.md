# sequence-divergence-drive (sdd1)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Put the first sequence fixtures into the byte-frozen golden ratchet. Sequence
is **0 of 1143** conformant today, and one mechanism floors almost every
fixture: the sequence engine imports nothing from `src/core/style/`, so the
jar's `plantuml.skin` values never reach it — lifelines miss
`stroke-width:0.5` (1122 fixtures), participant boxes miss `rx/ry=2.5` and
`stroke-width:0.5` (~1090), from `element { LineThickness 0.5 }` and
`participant { RoundCorner 5 }` (`plantuml.skin:91-93,193-195`). Upstream
gives every event the current `StyleBuilder` (`SequenceDiagram.java:130,172,
248,270,289,372,428`) and every component a `Style` (`ComponentType.java:
75-105`). sdd1 ports that seam, moves every component's style onto it, builds
the pin tool, and pins every fixture that reaches zero-diff.
Target: **≥ 250 sequence pins** (D10).

sdd1 is drive 1 of a program: sdd2..N take the geometry and structural
cohorts; a separate mission takes the 13 error rows (unported commands).

Starting state (main `9e3a27dee`, clean, 2026-10-19; `measurements/plan-*`):
- survey 0 conformant / 0 structural-match / 1143 diverged (`renderSync`);
- diff-baseline 1128 `baseline` + 13 `error`; Σ weightedScore 150933
  committed, **150864** re-rendered at HEAD (69 of main drift since 10-08);
- ratchet-path cohorts (`plan-classify.json`): paint-only **338** (every diff
  is paint/font), geometry 513, structural 277, error 13;
- `ratchet.json` empty; `sequence.golden.ratchet.test.ts` exists, skips.

Batch 0's b0 (`measurements/b0*.json`, `b0-eng/`) is the reference for every
"loss" and "rise". `measurements/plan-*` are planning-time only.

## Branch

`feat/sequence-divergence-drive` off main. Merge commit at close (never
squash; the journal cites per-task commits). Commits are unsigned; the user
runs one `rebase -S` before the PR (memory `signed-commits-need-user-rebase`).
**Never push** anything: not main, not the plantuml fork, not dot-engine.
`plans/` is tracked in this repo — commit the brief.

## Quality gates (all four before any commit lands on the branch)

```sh
bash plans/sequence-divergence-drive/measurements/gates.sh <tag>
# = npm test -- --maxWorkers=4 (JSON reporter) · typecheck · lint · build
```
Collected (JSON reporter) must equal on-disk (`gates.sh` prints both). Check
`uptime` first; above ~10 wait. New src module ⇒ `npm run catalog`.

Measurement (sequence has NO DOT gate — it never emits `svek-N.dot`):
- Survey: `npm run svg:survey -- sequence --out <path>` (never positional).
- Classify: `npx tsx $T/classify.mts <out.json>` (T0a; planning source
  `$T/classify-scratch.mts`). Ratchet path + `fixtureIncludeStore()`.
- Baseline re-pin: `npx tsx scripts/repin-sequence-baselines.ts`.
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- `$T` = `plans/sequence-divergence-drive/tools/`, `$M` = `.../measurements/`.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check.
3. A finding contradicts D1–D10: amend `decisions.md`, then halt.
4. A conformant fixture in **any** engine leaves conformant without a stated
   mechanism (all-engine survey at every close).
5. A `weightedScore` rise on any sequence row with no mechanism (a structural
   fall beside a numeric rise is a reveal, not a stop).
6. A pinned golden stops being byte-equal.
7. Batch 1b's no-op seam is not byte-identical to b0 on every fixture.
8. Any edit under `src/core/style/**` (D4), `src/core/klimt/**`,
   `~/git/knowvah/dot-engine`, or the plantuml fork; any push.
9. Any change to the oracle jar or cached oracle bytes.
10. Signing any entry in `oracle/accepted-divergences.json` (D8).
11. A public API change: `renderSync`/`render`/`renderAll` signatures,
    exported option types, or deleting a `Theme` field an exported type
    reaches.
12. A fitted constant: any numeric change without an upstream `file:line` in
    the same commit.
13. Survey (`renderSync`) and ratchet (`renderFixtureSequence`) disagree on a
    fixture and the mechanism is not isolated inside the 2-fix budget.
14. More than 30 non-sequence movers at a close.
15. Collected ≠ on-disk after a `--maxWorkers=4` rerun, or a survey timeout
    at load below 8.
16. An `error` row that starts rendering counted as a silent win (report and
    promote it; the transition itself is not a stop).

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook that extend a write-set — journal
  the new file.
- Baseline re-pins explained by a measured mechanism with a Java quote (diff
  the JSON before/after; any row that ROSE gets its own line).
- Pinning any slug that is zero-diff at a close (orchestrator-only,
  `$T/pin-goldens.mts`).
- Adding/dropping a batch-4 T4x family when the classify names a mechanism no
  planned family owns, or a planned family has no cohort row.
- Re-slotting a row between batches; `final = open -> sdd2` when the
  mechanism is found but not fixable in the write-set.
- Collapsing two tasks that turn out to share a file.
- Moving a theme field's deletion from T3c into the family task that removes
  its last reader.
- Adding test callers to T1b's sweep that grep missed.
- Regenerating the catalog or parity dashboard.

## Execution rules (D9)

- Parallel tasks run in `git worktree`s made by `$M/mkwt.sh <Tn>` (links the
  gitignored dependencies and the `test-results` children).
- Agents run targeted tests + typecheck + eslint only; the orchestrator merges
  and runs the four gates plus the full conformance set.
- Agents: **no Serena edit tools** (they write the MAIN checkout — memory
  `agents-write-main-via-serena`), no `git stash`. Orchestrator: `git diff
  HEAD` on the mission branch is empty before every merge.
- Every task spec in `batch-*/T*.md` is a self-contained agent prompt.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch, b0, classifier, ledger; pin tool | T0a, T0b | both ∥ | [x] |
| [1](batch-1/overview.md) | style seam module (D1/D2/D4) | T1a | — | [ ] |
| [1b](batch-1b/overview.md) | parser capture + `UmlSource` (D3); geo paint fields — no-op seam | T1b, T1c | both ∥ | [ ] |
| [2](batch-2/overview.md) | families: participant, lifeline, arrow, divider, note+box; pin round 1 | T2a–T2e, close | all ∥ | [ ] |
| [3](batch-3/overview.md) | groups/ref/newpage/delay; shadowing | T3a, T3b | both ∥ | [ ] |
| [3b](batch-3b/overview.md) | retire dead theme fields (D5); pin round 2 | T3c, close | — | [ ] |
| [4](batch-4/overview.md) | drive round on the paint residue; pin round 3 | T4x, close | all ∥ | [ ] |
| [5](batch-5/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

- [decisions.md](decisions.md): D1–D10, locked
- [close-procedure.md](close-procedure.md): standard batch close
- [fixtures.md](fixtures.md): cohort ledger (seeded by T0a, settled by closes)
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- [decision-journal.md](decision-journal.md): one row per decision, mover, halt
- `measurements/`: survey/classify JSON per checkpoint; `mkwt.sh`, `gates.sh`
- `settings.autonomous.json`: copy of `.claude/settings.autonomous.json`
- `tools/`: `classify-scratch.mts` (planning source), T0a's `classify.mts`,
  T0b's `pin-goldens.mts`; own `vitest.config.mts` + `tsconfig.json`

## Prior context (read only what a task points at)

- `oracle/goldens/svg-sequence/README.md` — the ratchet, the diff-baseline,
  the Add rule
- `planning/sequence-next-missions.md` — 2026-09-01 refresh (numbers stale;
  findings on text units and the instrument still hold)
- `plans/activity-divergence-drive/` — add1, the template this brief follows
- `src/diagrams/wbs/WBSDiagramFactory.ts:160-200` — the per-command style
  dispatch template (D2)
