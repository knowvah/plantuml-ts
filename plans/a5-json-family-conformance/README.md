# A5 — json / yaml / hcl SVG conformance

**Status:** ready to execute · **Branch:** `feature/a5-json-family`
**Mission-index rows:** A5 (depth) — unblocked by S2, resolved 2026-08-08.

## Objective

Take the json family from `shallow` to **100% SVG-conformant minus named
divergences**, the bar every other DOT-routed type has already met (G1
description, G2 class, G3 object, G4 state, D14 dot).

> **Bar amended 2026-08-09 (ADR-2b).** This family is laid out by Smetana
> upstream, and Smetana is not a porting target — where upstream calls it, this
> port calls `@knowvah/dot-engine` and accepts the geometry delta. So the bar
> here is structure, node sizing, and everything this port controls, with the
> layout delta carried as a named entry. **Byte-exact geometry is explicitly
> NOT the target for json/yaml/hcl**, unlike every sibling type. These three are the last
ones left. Today their only depth assertion is
`tests/integration/json-corpus.test.ts`, which checks that the output contains
`<svg` and is longer than 100 characters.

**Count three types, not one.** yaml and hcl have no layout of their own — both
render through `src/diagrams/json/layout.ts#layoutJson`. Every layout change in
this mission is transitively theirs, so all three carry goldens and ratchets
from the start rather than being verified at the end.

## The two findings this mission is built on

**1. There is no DOT gate to pass first, and there cannot be one.** Every prior
Phase-G mission was gated on its type reaching 100% DOT parity. This one is
not, and that is settled rather than assumed: the pinned jar run with
`-DPLANTUML_DUMP_DOT=<dir>` over an `@startjson` diagram writes the SVG and **no
`.dot` file at all**, because upstream lays json out through
`jsondiagram/SmetanaForJson.java` — in-process Smetana, never an external dot
process. The exit bar is SVG conformance directly. (Mission-index row S2.)

**2. Our layout is built on a different graph than upstream's, and that is the
mission's central problem.** Upstream does NOT lay json out left-to-right. It
lays it out in graphviz's default **TB with each node's width and height
deliberately swapped** (`SmetanaForJson.java:236-244` — `height` is set from
`dim.getWidth()`, `width` from `dim.getHeight()`), then transposes every
resulting coordinate back through `Mirror#invAndXYSwitch` (`x = max - pt.y;
y = pt.x`). It also uses **real record ports** — `shape=record` nodes whose
labels are built from `<P0>|<P1>|…` cells, with edges pinned by
`tailport="P<n>"`.

This port instead sets `rankDir: 'LR'` (`json/layout.ts:303`) and approximates
ports with a fractional `tailportY` attribute. Per CLAUDE.md — *"upstream
architecture is authoritative… that structural divergence is itself the bug"* —
re-mirroring it is ADR-1, not a detail. See [decisions.md](decisions.md).

## Quality gates

Run all four after every batch. **Never pipe a gate** — `tail`'s exit code
masks vitest's failures; capture the exit code directly.

```sh
npm test          # pass: exit 0        on_fail: fix_and_rerun
npm run typecheck # pass: exit 0        on_fail: fix_and_rerun
npm run lint      # pass: exit 0        on_fail: fix_and_rerun
npm run build     # pass: exit 0        on_fail: fix_and_rerun
```

Before the final merge, run the suite **twice on a cold tree**
(`rm -rf packages/*/assets && npm test`) — warm gitignored assets hide worker
races.

Plus, per batch: `git diff --name-only` must match the batch's declared
write-set (`on_fail: stop`).

## Batches

- [x] **[Batch 1 — harness and corpus](batch-1/overview.md)** — build the
      svg-json harness and widen the oracle cache to all 92 fixtures. No
      production code changes. T1 ∥ T2.
      **DONE 2026-08-08** (`58aafc6a`, `67e21d29`). Corpus captured 92/92
      (50/39/3, exactly as scoped), no `.dot` from any fixture (ADR-3 confirmed
      by measurement). Census runs clean over all three types.
      **Baseline preview: 0/92 conformant — 91 in the 11–30 bucket, 1 in 4–10,
      zero errors.** Gates: 569 files / 12,568 tests, all four green.
- [x] **[Batch 2 — true baseline and the document shell](batch-2/overview.md)** —
      measure a real baseline through the harness, attribute it, and close the
      shell gap json shares with dot's old one.
- [ ] **[Batch 3 — the layout re-mirror](batch-3/overview.md)** — ADR-1. Port
      `Mirror`, swap node dims, drive TB, and replace `tailportY` with real
      record ports. The largest batch; strictly sequential.
      **T5 GO (weak)** and **T6 DONE** (`31137d2c`): dimension error
      111.88 → 101.83, closer on 68 fixtures / worse on 2. **T6b ADDED
      mid-mission** — T5 proved node SIZING, not topology, is the dimension
      lever (zero fixtures exact after T6; `{}` rendered 76×31 against the jar's
      32×40). T7/T8 target edge geometry and cannot close it.
      **T6b DONE**: `TextBlockJson` ported from the Java, every constant now
      carrying its upstream `file:line`; the array-index-keys divergence
      retired on the maintainer's call. **Mean document-dimension error
      111.88 → 22.36 across Batch 3**, and `{}` now renders a 10×18 node rect
      byte-identical to the jar. Still ZERO fixtures exact: the remaining
      mechanism is named, not fitted — `JsonDiagram#calculateDimension` is the
      INK-extent walk (`TextBlockUtils.getMinMax`), i.e. mission-index **F4**,
      which G0 solved for description via `LimitFinder`/`UGraphicNo`.
- [ ] **[Batch 4 — close-out](batch-4/overview.md)** — yaml/hcl ratchets,
      per-fixture attribution of every remaining miss, divergence records,
      mission-index flip.

## Stop conditions

Stop and wait for the maintainer when:

- A task needs to modify a file outside its declared write-set, and that file
  is in no other task's write-set either.
- Two consecutive quality-gate failures on the same check.
- The implementation would contradict an ADR in `decisions.md`.
- **ADR-1 is falsified** — i.e. Batch 3 measurement shows the mirrored graph
  produces geometry no closer to the jar than `rankDir: 'LR'` did. That is a
  real possible outcome and inverts the mission's plan; do not push through it.
- A change would alter `src/core/graph-layout.ts`. It carries three pre-existing
  complexity-hook violations (`parseNodeRenderCenters`,
  `extractPortLabelPositions`, `shiftToOrigin`), so **any** edit to it is
  blocked by the hook until those are refactored. That refactor is out of scope.
- Ratchet regression in ANY other type. The json layout is shared; class/object
  are not, but the census and shell are.

## Push forward with judgment when

- A fixture's miss is diagnosed to a `file:line` mechanism and the fix is inside
  the batch's write-set.
- A golden needs re-capturing from the pinned jar for a reason you can state.
- Task granularity turns out finer than planned — split freely, log it.

## Constraints carried from CLAUDE.md

- **The long tail IS the deliverable.** Never propose skipping an edge case or
  simplifying away a special case. "Hard" and "out of scope" are triggers to
  measure the real work, not to descope it.
- **Diagnose before fixing.** On any observed discrepancy, state the mechanism,
  origin (`file:line`), causal chain, and what you ruled out — before the fix.
  Never ship a fitted constant.
- **Preserve upstream names.** `Mirror`, `SmetanaForJson`, `TextBlockJson`,
  `JsonCurve` port under their own names.
- **No agent runs git.** Parallel agents share this worktree; the orchestrator
  commits after each batch.

## Index

- [decisions.md](decisions.md) — ADR-1…ADR-5
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md) — what this touches
- [diagrams/data-flow.md](diagrams/data-flow.md) — the layout pipeline, both ways
