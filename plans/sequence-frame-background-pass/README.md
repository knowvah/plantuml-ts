# Mission: sequence-frame-background-pass

**Branch**: `feat/sequence-frame-background-pass`, cut from
**`feat/sequence-participant-g-wrapper`** — NOT from `main`. Merge commit back
into that branch, then that branch to `main`. Never squash: both decision
journals reference per-task commit IDs.

## Objective

Port the sequence **background pass**, and unblock the merge it is holding up.

`teoz/PlayingSpaceWithParticipants#drawU:218-227` runs five passes. This port
implements four. The missing one is the first —
`playingSpace.drawBackground(ugBody)` — and its absence puts every grouping
frame in the wrong place in the child sequence. **10 fixtures rise because of
it, 5 of them measured structural regressions**, which is why
`sequence-participant-g-wrapper` is sitting unmerged with 567 ratchet failures
it cannot re-pin.

This is a **structural** repair. Frame *geometry* numbers are not a target
here — our participant heads are 80 wide against the jar's 38.9, a pre-existing
sizing gap. Falling scores are the instrument, not the goal.

## The mechanism, verified this session against two goldens

`PlayingSpace#drawBackground:109-112` wraps `ug` in
`UGraphicInterceptorTile(ug, true)` and runs the **same** `drawUInternal` the
foreground uses. The interceptor suppresses nothing — it only carries a flag.
The discriminator is per-COMPONENT: `skin/AbstractComponent#drawU:140-147`
dispatches `drawBackgroundInternalU` in the background pass and
`drawInternalU` in the foreground, **never both**, and the default
`drawBackgroundInternalU` is empty. That is why messages, notes and arrows are
silent in the background pass without anyone checking a flag.

> **Correction to the filing in `planning/next-missions.md`.** It says the
> outline duplicates because `comp.drawU` at `GroupingTile:267` sits outside
> the `isBackground()` guard. That is not the mechanism. It duplicates because
> `ComponentRoseGroupingHeader` draws the same `URectangle` in **both** of its
> halves — `drawBackgroundInternalU:127-134` and `drawInternalU:137-157`. The
> distinction decides the port's shape: a two-half component, not one call
> made twice.

**The pass has a closed, small scope.** Exhaustively: only three classes
override `drawBackgroundInternalU` and only two tiles consult `isBackground()`.
`ComponentRoseGroupingElse` is transparent under teoz and returns immediately;
`NewpageTile:81` returns early; `ComponentRoseEnglober` is never referenced
under `sequencediagram/`. **`GroupingTile` is the only emitter.**

## The measurement that sets the scope

`kejoke-76-curu931` top-level tag sequence, measured, not inferred:

| | count | shape |
|---|---|---|
| golden | **102** | 12 `rect` (6 groups × band+outline), 16 `g`, 8 head/foot, then per group `path,rect,text` **before** its messages |
| ours | **96** | 16 `g`, 8 head/foot, then per group `rect,rect,text,text` **after** its messages |

The arithmetic closes exactly: **96 − 6 + 12 = 102** — drop the surplus
`[cond]` text per group, add the background pass.

`pixopo-04-zitu732` already matches at 20/20 children, so its comparison
descends and dies at `svg/g[1]/g[1] "g" vs "rect"` — the missing background
rect at index 0. **Adding the background pass alone would make it 21/20**,
introducing a top-level short-circuit that does not exist today and leaving it
`inconclusive`, i.e. still blocking. This is why the header component's
FOREGROUND half is in scope: tab as `<path>`, and one `<text>` not two.

## No fitted constants

Every value reconciles against `resources/skin/plantuml.skin`:

| Value | Source |
|---|---|
| group `BackGroundColor transparent` (⇒ uncoloured groups emit NO band) | `:102-103` |
| `sequenceDiagram.group` LineColor black, LineThickness 1.5 | `:117-118` |
| `sequenceDiagram.group` FontSize 11, FontStyle bold (the `[cond]` text) | `:119-120` |
| `sequenceDiagram.groupHeader` BackGroundColor `#e` → `#EEE` (tab fill) | `:125` |
| `sequenceDiagram.groupHeader` LineColor black, LineThickness 1.5 | `:124,126` |
| `sequenceDiagram.groupHeader` FontSize 13, FontStyle bold (tab text) | `:127-128` |

**Never fit a value.** If a number is needed that is not in the table above,
find its `file:line` upstream or stop.

## Start here

1. Read this file.
2. Read [`decisions.md`](./decisions.md) — every decision there is **locked**.
3. Read [`prior-observations.md`](./prior-observations.md) — measurement
   hazards that have already cost two missions real time.
4. Read [`decision-journal.md`](./decision-journal.md) — it may carry entries
   from earlier in the session, before compaction.
5. Find the first unchecked batch below; read its `overview.md`.
6. Announce the batch and its tasks, then begin.

## Batches

- [x] **Batch 1** — [the contract](./batch-1/overview.md) (T1) — `8a13a6bc`
- [x] **Batch 2** — [parser, Blotter, header, tile order](./batch-2/overview.md) (T2–T5, parallel) — `0d4afc3b` `21fed60a` `6cf7b8ba` `6d66987c`; gate: regression=0, improved=34, artefact=1, Sigma score -1118
- [x] **Batch 3** — [wire the background pass](./batch-3/overview.md) (T6) — `0c7abcb7`; both pinned fixtures exact, SC6 not triggered
- [x] **Batch 4** — [adjudicate](./batch-4/overview.md) (T7) — `f67b7a91` + `7fbf0bef`; regression 10 -> 2, Sigma -21789
- [x] **Batch 5** — [close out](./batch-5/overview.md) (T8) — `5e399239`
- [~] **Landing** — T9: re-pin DONE `16f3881d` (1121 entries, 3 excluded). Merges PENDING user confirmation.

## Quality gates

**`npm test` is NOT a gate for this mission.** It is red at baseline: 567 of
1151 sequence-ratchet assertions fail on this branch, and they stay red until
T9's re-pin. Gating on it would gate nothing and would tempt a re-pin that D8
forbids.

Per task:

```
- command: npm run typecheck          pass: exit 0   on_fail: fix_and_rerun
- command: npm run lint               pass: exit 0   on_fail: fix_and_rerun
- command: npx vitest run tests/unit  pass: exit 0   on_fail: fix_and_rerun
- command: npm run build              pass: exit 0   on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: output matches the task's declared write-set only
  on_fail: stop
```

Baseline measured 2026-08-28 on `feat/sequence-participant-g-wrapper`:
typecheck ✓, lint ✓, build ✓, `tests/unit/sequence` ✓ (858 passed),
sequence ratchet **567 failed / 584 passed**.

Per batch, instead of the ratchet: run
`npx jiti scripts/sequence-ratchet-adjudicate.ts` against the batch's parent
commit. **Invariant: zero `regression` verdicts.** Never read a raw diff count
as fidelity — see `prior-observations.md`.

## Stop conditions

1. Any task needs to write a file outside its declared write-set that no other
   task in the mission owns.
2. Two consecutive quality-gate failures on the same check.
3. An architecture decision in `decisions.md` is contradicted by what the Java
   actually says. Amend the decision in the journal first; never silently
   override it.
4. The adjudicator reports a `regression` that survives diagnosis — stop with
   the full artefact (mechanism, `file:line`, causal chain, ruled out), not
   with "two attempts failed".
5. A constant is needed that has no upstream `file:line`.
6. `pixopo-04-zitu732` does not reach 20/20 or `kejoke-76-curu931` does not
   reach 102 after T6 — the scope measurement was wrong and the plan needs
   re-deriving, not patching.
7. The background pass turns out to need an emitter other than `GroupingTile`.

## Push forward without asking

- Naming, file layout within the declared write-set, test structure.
- Porting an upstream branch no corpus fixture reaches (the long tail is the
  deliverable — `roundCorner != 0` is the known example).
- A task that turns out simpler than estimated — log why, then proceed.
- Obvious, self-explanatory error fixes inside the write-set.

## Non-goals — do not attempt

Frame geometry numbers; `luzapi-49-rati107`'s dashed delay line (lifeline pass,
and it also uses `newpage`); the `partition` keyword; `PartitionTile`'s
context-ignoring component; building the `sequenceDiagram.group` style cascade.
All are filed by T8.
