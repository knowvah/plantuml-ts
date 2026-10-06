# activity-divergence-drive-3 (add3)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Continue the activity conformance drive from add2's close (main `6eef9c769`):
**224 pinned, Σ 16937 over 126 baseline rows, survey 225/29/119, 0 error rows**.
Lead with cross-lane connectors (XLANE) and Snake text-block label placement
(batch 1), then notes, embedded `{{ }}`, klimt items and the small items
(batch 2), then a drive round on the re-censused cohort (batch 3). Exit bar
(D7): every ledger row final, **>= 280 pinned, Σ <= 10000**, 0 conformant losses.

## Branch

`feat/activity-divergence-drive-3` off main `6eef9c769`. Merge commit at close.
**Never push.** `plans/` is tracked — commit the brief.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`.

Measurement (carried from add2, D6):
- Probe `npx tsx scripts/activity-probe.ts --json <path>` (`--dump`, `--align`);
  classify `scripts/activity-probe-classify.ts`; elements `scripts/activity-probe-elements.ts`.
- All engines: `measurements/survey-all.sh <dir>` (sequential), diff with
  `python3 measurements/engdiff.py <prev> <next> [--skip activity]`.
- Re-pin `npx tsx scripts/repin-activity-baselines.ts [--write --accept-rises a,b]`
  (diff the JSON; every row that rose gets a journal line).
- Pin `npx jiti plans/activity-divergence-drive/tools/pin-goldens.mts <tag> <close> <slug...>`
  (one slug per argument), then update routing/refusal count assertions by derivation.
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. Same gate fails on 2 consecutive fix attempts, or one location changes 3 times.
3. A finding contradicts D1–D9: amend `decisions.md`, then halt.
4. A conformant fixture in any engine leaves conformant without a mechanism.
5. An un-pinned activity row's `weightedScore` rises without a mechanism.
6. A pinned golden stops being byte-equal.
7. Collected ≠ on-disk, or a survey timeout at load < 8.
8. A klimt/core edit not in the task's write-set; any edit to dot-engine or the
   plantuml fork; any push.
9. Any change to the oracle jar or cached oracle bytes.
10. Signing an entry in `oracle/accepted-divergences.json`.
11. A public API change.
12. T1a finds a live Java `drawTranslate`/`withLabel` site with no counterpart
    T1b/T1c can absorb.
13. A fitted constant or tolerance: a numeric change without upstream `file:line`.
14. More than 30 non-activity movers at a close.
15. The harness-parity test goes red.
16. T2b's spike cannot keep every pinned golden byte-equal (D5: ask, no fallback).
17. Dirty main checkout or non-empty stash at a merge: restore, journal, merge.

## Push-forward (decide, journal, continue)

Helper splits forced by the 500-line hook; re-pins with a Java-quoted mechanism
(journal every riser); pinning zero-diff rows at any close; retiring allowlist
entries that no longer overlap; adding/dropping/re-slotting a family between
batches; extending a finished task's write-set to a file no running task owns;
fixing harness drift; regenerating catalog/dashboard; interim pin rounds.

## Execution rules (D8)

Every agent prompt starts with: **no Serena MCP tools (read or write) — they
write the MAIN checkout**; no `git stash`; no raw `&` jobs; worktree-absolute
paths; report to `.agent-notes/<ID>.md`. Parallel tasks run in worktrees from
`measurements/mkwt.sh <ID>`. Orchestrator gates every merge on stop 17.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch, b0, tmp1 retire, url seam, cohort census | T0a, T0b, T0c, T0d | ∥ | [x] |
| [1](batch-1/overview.md) | label/translate census, Snake labels, XLANE | T1a → T1b → T1c | serial | [ ] |
| [2](batch-2/overview.md) | notes, embedded `{{ }}`, klimt, small items | T2a–T2d | ∥ | [ ] |
| [3](batch-3/overview.md) | drive round (written at b2 close) | — | waves | [ ] |
| [4](batch-4/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

[decisions.md](decisions.md) · [close-procedure.md](close-procedure.md) ·
[fixtures.md](fixtures.md) · [decision-journal.md](decision-journal.md) ·
[diagrams/data-flow.md](diagrams/data-flow.md) · [diagrams/component-map.md](diagrams/component-map.md)

## Prior context (read only what a task points at)

`plans/activity-divergence-drive-2/` (journal rows 14-50, `fixtures.md`),
`planning/next-missions.md` § add2 Open -> add3, `.agent-notes/T1b-snake-merge.md`,
`T3f.md`, `T3g.md`, `T3i.md`, `T2g-spot-label-goto.md`. Memories:
agents-write-main-via-serena, weightedscore-can-rise-on-a-correct-fix,
verify-agent-claims-si31, conformance-harness-mirrors-index-ts.

## Status

(filled by T-exit)
