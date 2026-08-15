# Mission: a composite's size is its inner INK, not the engine's canvas

> ## HALTED at T2, 2026-08-15 — the premise below is FALSE
>
> A state composite's declared size is **already** a faithful port of
> `SvekResult#calculateDimension` + `InnerStateAutonom#calculateDimensionSlow`
> (`state-composite-autonom.ts:196-205`, measured exact: ink `+15`, wrapper
> `+20`, `dx`/`dy` = 6). `BOX_PAD` is a fallback for CLUSTER composites and
> the named fixtures never reach it — `Configuring` is an `autonom` spec,
> probe-verified.
>
> The real 0.527 is a transition LABEL's placed `x`, folded into the
> composite's ink max-X at `layout-ink-extent.ts:391`. Full diagnosis, with
> the measurements, in [decision-journal.md](decision-journal.md).
>
> **T1 stands and is committed** (`456d83e5`) — the declared-size harness is
> real, its baseline is pinned, and it is what disproved the rest of the
> brief. Batches 2 and 3 are void as written. The successor mission belongs
> to the label-placement family, not composite sizing.

## Objective

A state composite reaches the outer scope as a plain node, and we declare
its size wrong. Ours is a bounding box over the inner CHILD RECTS plus an
invented `BOX_PAD * 2` (`state-composite-geo.ts:47,108-125`). Upstream does
not do that: `SvekResult#calculateDimension` walks the DRAWN inner content
with `LimitFinder`, shifts it so the ink starts at 6, and returns the ink
extent plus `delta(15, 15)`:

```java
minMax = TextBlockUtils.getMinMax(this, stringBounder, false);
clusterManager.moveDelta(6 - minMax.getMinX(), 6 - minMax.getMinY());
return minMax.getDimension().delta(15, 15);
```
`svek/SvekResult.java#calculateDimension`

`InnerStateAutonom#calculateDimensionSlow` then merges that with the title
and attributes and adds `MARGIN * 2 + 2 * MARGIN_LINE + marginForFields`
(20, or 25 when attributes are present).

Two divergences stack: we measure BOXES where jar measures INK, and our
constant is 24 where upstream's is 15 plus a 20/25 outer layer. This is the
same shape as `namespace-cluster-box`: an invented padding constant standing
in for a real upstream computation. `BOX_PAD` carries no `file:line`.

**The constants already exist, shared.** `INK_DELTA = 15` and
`JAR_INK_MARGIN = 6` live in `src/core/svek/SvekResult.ts` (single owner as
of `522873ef`) and are already imported by the class, description AND state
engines. State applies them to its DOCUMENT ink walk
(`state/layout-ink-extent.ts`) — it is only the COMPOSITE path that takes
the unrelated `BOX_PAD` route. So this mission wires an existing, cited
mechanism into one more call site; it does not introduce numbers.
Re-declaring either constant locally is a stop condition (decision D6).

## Branch

`feat/state-composite-inner-canvas` off `main`. Merge with a **merge commit,
never squash** — per-task ids get cited in the journal. Agents share this
worktree: **no agent runs any git command**; the orchestrator commits after
each batch.

## The measurement that matters

**The oracle is exhaustive and exact, and it is not the SVG.** Jar's cached
`svek-N.dot` declares every composite's size in inches:

```
sh0012 [shape=rect,style=rounded,label="",width=5.449097,height=3.555556,...]
```
`test-results/dot-cache/state/bemena-23-zebu249/svek-2.dot`

5.449097in × 72 = 392.335px against our 392.862 — **the 0.527 exactly**. So
every composite in all 141 composite-carrying fixtures can be compared
declared-width-to-declared-width, with no tolerance and no SVG in the loop.
T1 builds that harness before anything changes.

The standing gates are all partly blind to this and must not be used as the
primary signal:

- the state **DOT-parity** gate compares structure, not declared sizes;
- **`measure-state-size-deltas.ts`** measures node sizes but is backlog-
  gated and tighten-only, and already exits 2 on a pre-existing
  `tumaba-64-tosu281` 1e-6 wobble (`.agent-notes/g7-followup-pin-
  eligibility.md`) — that exit is NOT a regression to chase;
- the **SVG census** stops recursing at a `childCount` mismatch, which most
  composite fixtures have (same note), so it under-reports movement.

| Signal | Baseline | Direction |
|---|---|---|
| Composites whose declared w/h match jar exactly (T1 harness) | T1 pins it | must RISE |
| `bemena-23-zebu249` / `pajefo-95-neri955` / `xepafa-33-lazi826` | 0.527 wide, 0.261 offset right | **0.000** |
| state DOT-parity | 268/268 | unmoved |
| svg-state ratchet | 59 pins | all hold |
| state size backlog | widened 0 (modulo tumaba) | no NEW widening |

## Scope

141 of 271 state fixtures carry a composite. All are in scope — the change
is to the one derivation they all share. Object/class/description are NOT
in scope and must not move; a shape-level check that they do not is T1's.

## Batches

| # | What | Depends on | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Declared-size harness + expose the inner ink walk | — | [ ] |
| [2](batch-2/overview.md) | Port the dimension: ink + `delta(15,15)` + the outer margin layer | B1 | [ ] |
| [3](batch-3/overview.md) | Port `moveDelta(6 - min)`; sweep and close | B2 | [ ] |

## Quality gates

Run all four between every batch. **Never pipe `npm test`** — `tail`'s exit
code masks vitest failures.

```
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx tsx scripts/dot-sync-report.ts state
  pass: 268/268, unmoved
  on_fail: stop
- command: npx vitest run tests/oracle/svg-conformance/state.golden.ratchet.test.ts
  pass: all 59 pins hold
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: matches the declared write-set only
  on_fail: stop
```

## Stop conditions

- A task needs a file outside its write-set that is in no other task's
  write-set either.
- Two consecutive gate failures on the same check. The 2-try cap bounds
  **edits, not investigation** — keep diagnosing until you can state the
  mechanism, then STOP and log the full artifact from
  `~/.claude/rules/diagnosis.md`. "Two attempts failed" is not a diagnosis.
- The same location changed 3 times consecutively without resolving the
  same failing check.
- A svg-state pin breaks, or state DOT-parity leaves 268/268.
- Any NON-state diagram type moves at all. The change is confined to the
  state composite derivation; if class or object moves, the edit landed in
  a shared seam and the blast radius is wrong.
- The T1 harness cannot reproduce the 0.527 on the three named fixtures —
  that would mean the premise is wrong, and the mission stops before code.
- A constant would have to be introduced without an upstream `file:line`.
  This mission exists to retire one such constant; adding another is a
  contradiction, not a tradeoff.

## Push forward without asking when

- The choice is purely stylistic and does not change behaviour.
- A task is simpler than estimated (log why in the journal).
- A test expectation moves and the ORACLE demonstrably decided it — record
  the jar's own declared value in the commit message.
- A fixture improves in a way the brief did not predict (record it).

## Index

- [decisions.md](decisions.md) — the confirmed architecture decisions
- [diagrams/data-flow.md](diagrams/data-flow.md) — how the size is derived
- [diagrams/component-map.md](diagrams/component-map.md) — what is touched
- [decision-journal.md](decision-journal.md) — appended during execution
- `.agent-notes/class-ink-shared-offset-groups.md` item (c) — the measured
  evidence this mission is built on. **Read it before Batch 1.**
- `.agent-notes/g7-followup-pin-eligibility.md` — why the census and the
  size harness under-report here.
