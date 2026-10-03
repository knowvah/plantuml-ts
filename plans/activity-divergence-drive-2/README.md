# activity-divergence-drive-2 (add2)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Port the jar's connector-merge model and drive the activity corpus toward
**≥ 100 byte-frozen goldens and Σ weightedScore ≤ 20000** (D10). add1 left 67
pins and Σ 31366 over 245 un-pinned rows; **157 of them (89.5% of Σ) draw the
wrong number of elements**, and **99 (60% of Σ) draw an extra line + arrowhead**
where the jar fuses touching connectors (`UGraphicForSnake` + `Snake.merge`,
`MergeStrategy`). Batch 1 ports that model 1:1 (D1–D3). Batch 2 lands six
families from add1's 67 `open -> add2` rows plus the 38 parse `error` rows (D6)
and two klimt fixes (D8). Batch 3 is a drive round on the b2 cohort (ws ≤ 150).

Starting state (main `8532ce8ba`, 2026-10-02; `measurements/plan-*.json`):
- 245 `baseline` / 67 `pinned` / 38 `error` / 23 `jar-error`; Σ **31366**;
- survey 67 / 56 / 250; cohort ws ≤ 150: **164 rows** (≤ 100: 122; ≤ 20: 58);
- element census (`plan-elements.json`): 99 extra line+arrow, 22 extra arrow,
  12 extra line, 5 missing line+arrow, 19 text/mixed, 88 count-exact.

Batch 0's b0 (`measurements/b0.json`, `b0-eng/`) is the reference for every
"loss" and "rise". `measurements/plan-*.json` are planning-time only.

## Branch

`feat/activity-divergence-drive-2` off main. Merge commit at close (never
squash). **Never push** (main, the plantuml fork, dot-engine). `plans/` is
tracked — commit the brief.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`.
Check load first (`uptime`); above ~10 wait. New src module ⇒ `npm run catalog`.

Measurement (no DOT gate for activity):
- Probe `npx tsx scripts/activity-probe.ts --json <path>` (`--dump`, `--align`);
  classify `npx tsx scripts/activity-probe-classify.ts --json <path>`;
  elements `npx tsx scripts/activity-probe-elements.ts --json <path>` (T0a).
- Survey `npm run svg:survey -- <engine> --out <path>` (never positional).
- Pin `npx jiti plans/activity-divergence-drive/tools/pin-goldens.mts <tag> <close> <slug...>`
  (add1's tool; it also clones routing/refusal rows).
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check.
3. A finding contradicts D1–D11: amend `decisions.md`, then halt.
4. A conformant fixture in **any** engine leaves conformant without a mechanism.
5. A `weightedScore` rise on an un-pinned activity row with no mechanism.
6. A pinned activity golden stops being byte-equal.
7. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a survey timeout at
   load below 8.
8. Any edit under `src/core/klimt/**` other than D8's two; any edit to
   `~/git/knowvah/dot-engine` or the plantuml fork; any push.
9. Any change to the oracle jar or cached oracle bytes.
10. Signing any entry in `oracle/accepted-divergences.json`.
11. A public API change (`renderSync`/`render`/`renderAll`, exported option types).
12. T1a finds a Java connection with no counterpart in our walkers (D3).
13. A fitted constant: a numeric change without an upstream `file:line`.
14. More than 30 non-activity movers at a close.
15. The harness-parity test (D4, T0b) goes red.
16. The snake merge fuses or drops an edge where the jar draws two (T1a's
    oracle cases) and the 2-fix budget does not resolve it.

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook (journal the new file).
- Re-pins explained by a measured, Java-quoted mechanism (diff the JSON; every
  row that ROSE gets its own journal line).
- Pinning any zero-diff slug at a close; promoting an `error` row that renders.
- Adding/dropping a batch-3 family; re-slotting a row between batches.
- Extending a finished task's write-set to a file no running task owns.
- Fixing harness drift in `render-fixture-activity.ts` (it must mirror `src/index.ts`).
- Regenerating the catalog, dashboard, or another engine's census JSON when a
  shared change moves it with a stated mechanism.

## Execution rules (D11)

Parallel tasks run in `git worktree`s made by `measurements/mkwt.sh <Tn>`.
Agents: **no Serena MCP tools at all**, no `git stash`, scratch files carry the
task ID, targeted tests + typecheck + eslint only. Orchestrator: `git status` on
main is clean before every merge; merges, then runs the four gates.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch, b0, ledger, element census tool; harness-parity gate | T0a, T0b | both ∥ | [x] |
| [1p](batch-1p/overview.md) | missing builders before the merge port (D3 amendment, D12) | T1p-a,c,d,e,f,g → T1p-b | wave ∥ | [x] |
| [1](batch-1/overview.md) | connector-merge port (D1–D3) | T1a → T1b | serial | [ ] |
| [2a](batch-2a/overview.md) · [2b](batch-2b/overview.md) | six families (ConditionStyle, Opale/compress, style core, klimt, parser, geometry) | T2a–T2f, T2-close | all ∥ | [ ] |
| [3](batch-3/overview.md) | drive round on the b2 cohort (ws ≤ 150) | written at b2 close | ∥ | [ ] |
| [4](batch-4/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

- [decisions.md](decisions.md) — D1–D11, locked
- [close-procedure.md](close-procedure.md) — standard batch close
- [fixtures.md](fixtures.md) — row ledger (written by T0a)
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- [decision-journal.md](decision-journal.md) — one row per decision, mover, halt
- `measurements/` — probe/classify/elements/survey JSON per checkpoint; `mkwt.sh`

## Prior context (read only what a task points at)

- `plans/activity-divergence-drive/` — add1: `decision-journal.md` rows 28-53,
  `fixtures.md` (67 `open -> add2` rows with mechanisms)
- `planning/next-missions.md` § `activity-divergence-drive` — Open -> add2 by family
- `.agent-notes/T3b-walker-edges.md` (add1's reverted Snake.merge attempt)
- Memories: activity-divergence-drive-status, conformance-harness-mirrors-index-ts,
  weightedscore-can-rise-on-a-correct-fix, verify-agent-claims-si31,
  batch-parallelism-needs-worktrees, oracle-seam-embedded-42x42

## Status

(filled by T-exit)
