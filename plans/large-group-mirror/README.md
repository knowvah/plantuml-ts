# large-group-mirror (lgm)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Mirror the jar on the three bounded entries left in `DIVERGENCES.md` after
unwind2 (main `b46435b10`), by the 2026-10-08 ruling "a divergence exists only
where a library forces it":

1. **A1 — edge geometry at graphviz's text precision.** The entry ("Edge
   geometry carries more precision than the jar's", filed "accepted,
   permanent") predates cdd3-T-D3, which ported the jar's `dot -Tsvg` read
   (`src/core/graph-layout-svek-read.ts`, default `read: 'svek'` in
   `graph-layout.ts:368`). Audit every dot-engine consumer against the jar's
   read path, close any gap, retire the entry with evidence.
2. **A2 — `mainframe` sizing on the non-class engines.** Class is byte-exact;
   five sequence fixtures still diverge on the frame; the three unknown-bucket
   fixtures the entry names are now conformant. Port the jar's chrome order so
   every engine sizes the frame from the same box the jar does.
3. **A3 — composite-anchor clip rect.** Port `Cluster#manageEntryExitPoint`'s
   projection-cluster mutation before the `SvekEdge.java:671-672` clip, in the
   jar's per-line order, for state AND the description family.

Exit bar (D6): every `fixtures.md` row final; the three entries retired (or a
library-forced remainder named with evidence); 0 conformant losses in any
engine; 0 unexplained rises; four gates green.

## Branch

`feat/large-group-mirror` off main at the brief commit (on `b46435b10`). Merge commit at close.
**Never push.** `plans/` is tracked — commit the brief.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`.
Gate merges at `--maxWorkers=4` while agents survey (memory
vitest-timeouts-under-agent-load); grep a red ratchet for "timed out" first.

Measurement:
- All engines: `measurements/survey-all.sh <dir>` (sequential);
  `python3 measurements/engdiff.py <prev> <next>`.
- Sequence: `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts`
  (weightedScore, gated); census `npx jiti
  tests/oracle/svg-conformance/sequence-diff-census.ts`. Re-pin ONLY rows whose
  score fell, by `measurements/seq-scores.mts` (never a broad re-pin; memory
  repin-script-raises-preexisting-red-pin).
- State/description: `parity-state.json`, `census-state.json`,
  `parity-<description engines>.json`; DOT parity via the cached `svek-N.dot`
  (memory dot-engine-blame-needs-real-dot).
- Oracle renders `scripts/oracle-render.sh <out-dir> <puml>` only.
- Task worktrees: `measurements/mkwt.sh <ID>`. Batch close:
  [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. Same gate fails on 2 consecutive fix attempts, or one location changes 3 times.
3. A finding contradicts D1–D7: amend `decisions.md`, then halt.
4. A conformant fixture in any engine leaves conformant without a mechanism.
5. A pinned row's score rises without a mechanism, or any row's element count
   moves away from the jar (D5).
6. A pinned golden stops being byte-equal.
7. Collected ≠ on-disk, or a survey timeout at load < 8.
8. Any edit to `@knowvah/dot-engine`, the plantuml fork or the oracle jar; any push.
9. Any change to EXISTING cached oracle bytes (new authored fixtures are fine).
10. Signing an entry in `oracle/accepted-divergences.json`.
11. A public API change.
12. A fitted constant or tolerance: a numeric change without upstream `file:line`.
13. More than 40 movers in any one engine at a close (re-scope before pinning).
14. A claim that something is library-forced without a controlled experiment
    isolating the library (D2).
15. Dirty main checkout or non-empty stash at a merge: restore, journal, merge.

## Push-forward (decide, journal, continue)

Helper splits forced by the 500-line hook; re-pins of fallen rows; a riser
with a Java-quoted mechanism (a reveal per D5 of `comparesvg-count-not-
monotonic`); authoring new jar fixtures; extending a finished task's write-set
to a file no running task owns; spawning a fix task for a regression found at
a merge; regenerating catalog/dashboard; updating a pre-fix test with a Java
quote; resuming a stalled agent after inspecting its worktree; correcting a
brief claim that measurement disproves (journal it — memory
agents-correct-the-orchestrator).

## Execution rules (D7)

Every agent prompt starts with [common-rules.md](common-rules.md). Orchestrator
gates every merge on stop 15 and runs the D5 element check after it.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch, b0 survey, A1 audit | T0a, T0b (+T0c) | T0b after T0a | [x] |
| [1](batch-1/overview.md) | A2 mainframe, A3 projection cluster | T1a, T1b | ∥ | [ ] |
| [2](batch-2/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

[decisions.md](decisions.md) · [common-rules.md](common-rules.md) ·
[close-procedure.md](close-procedure.md) · [fixtures.md](fixtures.md) ·
[decision-journal.md](decision-journal.md) ·
[diagrams/data-flow.md](diagrams/data-flow.md)

## Prior context (read only what a task points at)

`DIVERGENCES.md` entries: "Edge geometry carries more precision…",
"`mainframe <label>` — rendered via a ported `BigFrame`…", "Composite-anchor
transitions: clip-rect family unported…". `plans/class-divergence-drive-3/`
(cdd3-T-D3, the svek read), `plans/class-divergence-drive/decision-journal.md`
rows 202-206 (mainframe background), `plans/state-anchor-clip-retire/` (SI32
T2, the clip). Memories: always-mirror-the-jar, census-away-from-jar-catches-
hidden-regressions, agents-write-main-via-serena, dot-engine-blame-needs-real-
dot, comparesvg-count-not-monotonic, weightedscore-antimonotone-under-growth.

## Status

Not started.
