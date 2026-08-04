# Mission SI15 — `UImage` raster-pixel dims for footprint measurement

**Objective.** Close GH **#26**: the usecase ellipse fit measures an inline
raster image by its declared/scaled placement dims, where upstream
(`UImage.java:87-92`) measures the rasterized image's **native pixel count
minus one**. Root cause fully diagnosed by SI14 T6 (`.agent-notes/
si14-ry-delta.md` — mechanism reproduced to 5 decimals on two fixtures,
9 hypotheses ruled out). This mission lands the fix, the sibling `<image>`
emission-rounding residual, the SI14 T5 dead-code sweep, and the T2
ink-offset investigation, then re-measures the whole
cx/rx/ry/image-x/text-x diff family — measured, never assumed.

**Branch.** `feature/si15-uimage-raster-dims` from `main` (`c2bbc530`).
Merge back with a **merge commit** (`--no-ff`) — journal cites per-task IDs.
Final fix commit closing the issue says `Closes #26`.

## Batches

| Batch | Tasks | Status |
|-------|-------|--------|
| [batch-1](batch-1/overview.md) | [ ] T1 raster-dims core fix · [ ] T2 atomsWidth/fallback sweep | pending |
| [batch-2](batch-2/overview.md) | [ ] T3 `<image>` emission rounding · [ ] T4 ink-offset diagnosis | pending |
| [batch-3](batch-3/overview.md) | [ ] T5 re-measure, re-pin, backlog, close-out | pending |

## Docs

- [decisions.md](decisions.md) — ADR-1..4 (locked)
- [diagrams/data-flow.md](diagrams/data-flow.md) — measurement vs emission flow
- [diagrams/component-map.md](diagrams/component-map.md) — touched components
- [decision-journal.md](decision-journal.md) — append during execution

## Quality Gates (run between every batch)

```
- command: npm test
  pass: exit 0 (baseline 476 files / 11,428 tests; goldens byte-identical
        except pins a task's spec explicitly re-pins)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx jiti scripts/measure-description-size-deltas.ts
  pass: widened 0; conformant >= 320/351 (improvement allowed and expected)
  on_fail: stop
- command: git diff --name-only <batch base>
  pass: only files in the batch's declared write-sets
  on_fail: stop
```

`npx jiti scripts/vendor-stdlib.ts --verify` (34,587 verbatim) + cold-tree
double test run (`rm -rf packages/*/assets && npm test`, twice) before the
final batch closes. IDE diagnostics are noise; `npm run typecheck` is the
authority.

## Constraints

**Stop conditions (escalate, never self-approve):**
1. A file outside every task's declared write-set needs changes.
2. Two consecutive failures on the same quality gate.
3. An implementation step contradicts an ADR in `decisions.md`.
4. `measure-description-size-deltas` reports `widened > 0`.
5. The oracle jar behaves unexpectedly when generating new fixture goldens
   (welcome page, error output, nondeterminism).
6. Same location/approach changed 3× consecutively without resolving the
   same failing check.
7. T3's jar verification shows `<img>`-atom emission rounding differs from
   sprite rounding in a way ADR-2's gate cannot express.

**Push-forward (decide and journal):**
- Re-pinned diff values/counts follow measurement, not the brief's estimates.
- Updating hand-built test fixture expectations where the new value is
  jar-aligned.
- Doc-comment corrections adjacent to edited code.
- A task turning out simpler than specced.

**Orchestration:** agents NEVER run git mutations (read-only `git show` ok);
orchestrator commits per task after the batch settles; agents keep scratch
tests in the session scratchpad, never `tests/`; gate runs taken while a
sibling agent is live are provisional. Subagents use Serena MCP tools.
