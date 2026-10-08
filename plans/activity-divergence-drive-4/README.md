# activity-divergence-drive-4 (add4)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Continue the activity conformance drive from add3's close (main `1651cf200`):
**301 pinned, Σ 4413 over 48 baseline rows, 23 jar-error**. Capture the **80
`tests/corpus/activity` fixtures with no oracle capture** (T0b), re-census every
row, then lead with add3's measurement debts (switch `getYdelta1a`, lane widths,
NOTE-MULTI ink/colour, spot letters) in batch 1, census-driven families in
batches 2-3, and retire every staging gate (D9). Exit bar (D7): every ledger row
final, **>= 340 pinned, old-48 Σ <= 2200**, the 80 captured/routed/pinned/censused,
0 conformant losses, 0 unexplained rises.

## Branch

`feat/activity-divergence-drive-4` off main `1651cf200`. Merge commit at close.
**Never push.** `plans/` is tracked — commit the brief.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`.

Measurement (carried from add3):
- Probe `npx tsx scripts/activity-probe.ts --json <path>` (`--slugs`, `--dump`, `--align`);
  `scripts/activity-probe-classify.ts`; `scripts/activity-probe-elements.ts`.
- All engines: `measurements/survey-all.sh <dir>` (sequential); `python3 measurements/engdiff.py <prev> <next>`.
- Re-pin `npx tsx scripts/repin-activity-baselines.ts --write [--accept-rises a,b]`, then
  **D6** `python3 measurements/census-away.py <pre-pin-dir> <prev-elements> <next-elements>`
  — at every task merge, not only at closes.
- Pin `npx jiti plans/activity-divergence-drive/tools/pin-goldens.mts <tag> <close> <slug...>`,
  then routing/refusal count assertions by derivation.
- Capture `scripts/capture-oracle-cache.ts` (T0b only); oracle renders `scripts/oracle-render.sh`.
- Batch close: [close-procedure.md](close-procedure.md). Task worktrees: `measurements/mkwt.sh <ID>`.

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. Same gate fails on 2 consecutive fix attempts, or one location changes 3 times.
3. A finding contradicts D1–D9: amend `decisions.md`, then halt.
4. A conformant fixture in any engine leaves conformant without a mechanism.
5. An un-pinned row's `weightedScore` rises without a mechanism, or a row loses drawn elements (D6).
6. A pinned golden stops being byte-equal.
7. Collected ≠ on-disk, or a survey timeout at load < 8.
8. A klimt/core edit not in the task's write-set; any edit to dot-engine or the plantuml fork; any push.
9. Any change to the oracle jar or EXISTING cached oracle bytes (T0b's new captures are allowed).
10. Signing an entry in `oracle/accepted-divergences.json`.
11. A public API change.
12. A capture yields an unusable `in.svg` that is not a jar error (empty/truncated): report, do not pin.
13. A fitted constant or tolerance: a numeric change without upstream `file:line`.
14. More than 30 non-activity movers at a close.
15. The harness-parity test goes red.
16. T1b finds `swimlaneWidth` behaviour measurable only with a fork-side oracle change: ask, no fallback.
17. Dirty main checkout or non-empty stash at a merge: restore, journal, merge.

## Push-forward (decide, journal, continue)

Helper splits forced by the 500-line hook; re-pins with a Java-quoted mechanism
(journal every riser); pinning zero-diff rows at any close or interim round;
adding/dropping/re-slotting a family between batches; extending a finished task's
write-set to a file no running task owns; spawning a fix task for a regression
found at a merge (D6); fixing harness drift; regenerating catalog/dashboard;
updating a pre-fix test with a Java quote; resuming a stalled agent after
inspecting its worktree; correcting a census claim measurement disproves.

## Execution rules (D8)

Every agent prompt starts with [common-rules.md](common-rules.md) (no Serena MCP
tools — they write the MAIN checkout; no `git stash`; foreground surveys one engine
per command; worktree-absolute paths; report to `<worktree>/.agent-notes/add4-<ID>.md`).
Orchestrator gates every merge on stop 17 and runs D6 after it.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch, b0, capture the 80, census | T0a, T0b, T0c, T0d | T0c∥T0d after T0b | [x] |
| [1](batch-1/overview.md) | switch Ydelta, lane widths, NOTE-MULTI, spot letters | T1a–T1d | ∥ | [x] |
| [2](batch-2/overview.md) | census families (written at b1 close) | — | ∥ waves | [x] |
| [3](batch-3/overview.md) | drive round + D9 gate-retirement sweep (written at b2 close) | — | ∥ waves | [x] |
| [4](batch-4/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

[decisions.md](decisions.md) · [common-rules.md](common-rules.md) ·
[close-procedure.md](close-procedure.md) · [fixtures.md](fixtures.md) ·
[decision-journal.md](decision-journal.md) · [diagrams/data-flow.md](diagrams/data-flow.md) ·
[diagrams/component-map.md](diagrams/component-map.md)

## Prior context (read only what a task points at)

`plans/activity-divergence-drive-3/` (`fixtures.md` final column = each open row's
mechanism; journal rows 1-51), `planning/next-missions.md` § add3 Open -> add4,
`.agent-notes/add3-T3b.md`, `add3-T3c.md`, `add3-T3e.md`, `add3-T3h.md`, `add3-T3i.md`,
`add3-T3j.md`. Memories: census-away-from-jar-catches-hidden-regressions,
agents-write-main-via-serena, new-corpus-tree-trips-two-gates,
oracle-seam-embedded-42x42, verify-agent-claims-si31.

## Status

**Executed and closed 2026-10-08** (T-exit). Batches 0-3 done; T-close-out merges to main.

| D7 clause | b0 | final | met |
|---|---|---|---|
| activity fixtures pinned (>= 340) | 301 | **409** | yes |
| Σ over add3's 48 rows (<= 2200) | 4413 | **217** | yes |
| baseline rows / Σ (all) | 48 / 4413 (b0'; 100 / 12056 with the new captures) | 7 / 221 | — |
| conformant losses, any engine, b0 -> final | — | **0** (111 movers, all improvements: 99 activity, 12 unknown) | yes |
| unexplained rises | — | **0** (every riser journaled with a mechanism; D5 reveals rows 13, 29) | yes |
| the 80 uncaptured fixtures | 0 captured | 79 captured + tmp1 retired; routed, pinned in routing/refusal, census family each | yes |
| every ledger row `final` | — | 127 rows: 108 `pinned (<tag>)`, 19 `open -> add5 (<mechanism>)` | yes |
| D9 staging gates | isActionSheetEligible + legacy text path | retired: isActionSheetEligible, every action/note/label fallback, `activity-renderer-text.ts` deleted | yes |
| four gates, collected = on-disk | — | see journal row 64 | yes |

**Open -> add5** (7 baseline rows, Σ 221): EMBED D4 seam (fikuki 14, mufixi 34,
gufuma 29, pufuzi 29), bozido 80 (nested wbs/salt/gantt engines unported),
**jucidi 31 (needs a user ruling: the jar omits ConnectionLastElseIn across
lanes, journal row 20)**, tidoda 4 (group style not keyed on the USymbol).
Plus 3 misfiled non-activity captures, 1 refusal-parity row (tajiri), 8
jar-error captures.

**Decisions flagged for review:** journal rows 4 (kept 3 misfiled captures per
D1), 20 (jucidi connector kept), 41/54 (load-induced vitest timeouts; nereka
one-off probably the same, not proven), 58 (rolled back an unpushed merge with
`git reset --hard`), 61 (walk-if-down 1-ULP patch parked).
