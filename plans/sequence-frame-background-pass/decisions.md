# Architecture decisions — locked

Confirmed by the user 2026-08-28 during planning. Treat every one as locked.
If the Java contradicts one, **stop and amend it here in the journal first**
(stop condition 3); never silently override.

## D1 — Two-pass structure: one shared walk, run twice with a flag

**Context.** The port has no `UGraphic`, so `UGraphicInterceptorTile` has no
direct counterpart.

**Decision.** `renderEvent(event, theme, isBackground)` — one ordered walk over
the same `events` array, invoked twice. Every event kind returns `''` when
`isBackground` is true except `frame`.

**Consequences.** Mirrors upstream exactly: `PlayingSpace#drawUInternal` **is**
shared between `drawBackground` and `drawForeground`, and the empty default
`AbstractComponent#drawBackgroundInternalU` is what makes messages silent. A
future background-drawing tile cannot be silently dropped. Rejected: a
background-only walk over a filtered frame list (structurally divergent);
restructuring `events` into a tree (changes every consumer).

## D2 — Tile order: reserve the slot, then fill it in place

**Context.** `handleFrameEvent` pushes its `FrameGeo` after recursing, because
`y`/`height`/`branchSeparators` are unknown until the branches resolve.

**Decision.** Push the `FrameGeo` **before** recursing into branches, then
mutate it in place once they resolve.

**Consequences.** Produces upstream's depth-first pre-order for free, nested
groups included, and mirrors upstream's own construct-then-resolve-gauge two
phases. `CLAUDE.md` licenses in-place mutation where upstream mutates; document
the contract on the field. Rejected: push-last-then-reorder (no stable sort key
exists).

## D3 — Style constants: correct one theme default, cite the rest

**Context.** `theme.colors.frame = '#999999'` (`src/core/theme.ts:272`) is
uncited and contradicts `plantuml.skin:117`. The sequence engine has no SName
style cascade.

**Decision.** Repoint `colors.frame` to black citing `plantuml.skin:117`. Put
thickness, tab fill, font sizes and weights in
`src/diagrams/sequence/frame-style.ts`, each constant carrying its
`plantuml.skin:NNN`.

**Consequences.** No fitted values. `colors.frame` is never written by
skinparam, so the change is contained at runtime; the dark-theme value at
`:347` is this port's own construct and moves with it.

> **AMENDED 2026-08-28 (T1, stop condition 3).** The parenthetical above read
> "verified: it appears only at `theme.ts:212,272,347`". That is **false**.
> Measured with `grep -rn "colors\.frame" src tests scripts`: **7** sites —
> the three in `theme.ts`, four consumer reads in
> `sequence/renderer.ts:243,244,314,332`, a relative assertion in
> `tests/unit/theme.test.ts:405` that holds either way, and **two stale
> regression assertions**, `tests/unit/measurer.test.ts:61` and `:136`, which
> pin the exact `#999999` / `#666666` this decision corrects. The original
> census was run over `theme.ts` only and was reported as if repo-wide.
> `tests/unit/measurer.test.ts` is therefore **added to T1's write-set**, and
> both assertions become `#000000` citing `plantuml.skin:117`.
> Confirmed by the user 2026-08-28. D3's substance is unchanged. Building the real
`sequenceDiagram.group`/`groupHeader` cascade stays a separate mission, so
`skinparam` cannot yet override these.

## D4 — Port `ComponentRoseGroupingHeader` in both halves

**Decision.** Background half: the full-frame stroked rect with
`background.bg()` — and under teoz `background = HColors.transparent()`, so
`fill="none"`. Foreground half: `getCorner()` path, the same rect, the tab
text, then the optional `[comment]` text. The Display rule is
`GroupingTile:126-127`: `title.equals("group") ? Display.create(comment) :
Display.create(title, comment)`.

**Consequences.** `group foo` gets tab text **"foo"** and no bracket text —
which is what closes `pixopo` to 20/20 and `kejoke` to 102. The
`roundCorner != 0` branch is ported although no corpus fixture reaches it (the
long tail is the deliverable). Shadowing (`rect.setDeltaShadow`) is NOT ported
and gets a `DIVERGENCES.md` line.

## D5 — Port `Blotter` whole

**Decision.** All 137 lines of `teoz/Blotter.java`: `addChange`/`closeChanges`,
the `isTransparent()` skip in `drawU`, and all three `getRectangleBackground`
corner variants. Bands split at each `ElseTile`'s gauge min **+1**
(`GroupingTile:326`) with `getBackColorGeneral()` falling back to the group
colour (`GroupingTile:328-331`).

**Consequences.** An uncoloured group correctly emits nothing — `group
BackGroundColor` is `transparent` at `plantuml.skin:103` — so the pass is a
no-op on most of the corpus, and only coloured groups grow the child count.

## D6 — Non-goals

Frame geometry numbers; `luzapi-49-rati107`'s delay line; the `partition`
keyword; `PartitionTile`; the style cascade. **Structure only.** All are filed
by T8, not fixed here.

## D7 — Branch

`feat/sequence-frame-background-pass`, cut from
`feat/sequence-participant-g-wrapper`. Merge commit back into it, then that
branch to `main`. Never squash.

## D8 — Landing gate

The final step runs `scripts/sequence-ratchet-adjudicate.ts`.
`scripts/repin-sequence-baselines.ts` runs **only** on zero `regression` AND
zero unadjudicated rise, exactly as the predecessor's own D5 requires.

**Consequences.** If rises remain, the mission stops and reports rather than
baking them in. Re-pinning the 557 while 10 stand would bake 5 measured
regressions into the baseline — precisely the failure that correctly halted
`sequence-participant-g-wrapper`. The re-pin is **orchestrator-only**: task
agents never write a baseline JSON.

## D9 — Batch 1's typecheck gate is deferred to Batch 2

**AMENDED 2026-08-28 (T1, stop conditions 1 and 3). Confirmed by the user.**

**Context.** T1's locked contract makes `tabText` / `tabTextWidth` /
`tabWidth` / `tabHeight` **required** on `FrameGeo` and forbids making them
optional. Every existing construction site therefore fails `tsc`:
`sequence-layout-events.ts:176` (T5's file) and
`tests/unit/sequence/renderer.test.ts:716,734,751` (T6's). No fix exists
inside T1's own write-set, so the README's per-task
`npm run typecheck / pass: exit 0` gate is unsatisfiable for T1 until Batch 3.
The contract-first split — types in B1, producers in B2, consumers in B3 — is
incompatible with a per-task typecheck gate when the added fields are required.

**Decision.** Two changes, minimal:

1. The three `FrameGeo` literals in `tests/unit/sequence/renderer.test.ts`
   move from **T6 to T5**. Updating the literals that construct a `FrameGeo`
   belongs with the task that changes `FrameGeo` construction. T6 keeps that
   file in its write-set for its own new tests.
2. **`npm run typecheck` is a per-BATCH gate for Batch 1, not a per-task one.**
   T1 commits with exactly four `TS2739` errors, all of them the construction
   sites above, and Batch 2's gate must return it to exit 0. `lint`, `build`
   and `npx vitest run tests/unit` stay per-task and must be green at T1.
   No batch ends red.

**Consequences.** The locked interface contract survives intact — the fields
stay required — and T2–T5 stay parallel. The cost is one commit on the branch
that does not typecheck in isolation; `git bisect` over that single commit
would see it. Rejected: merging T1 into T5 (loses T2/T3/T4's clean dependency
on a landed T1); optional fields with a fallback (forbidden by T1's brief, and
it weakens the contract T4 and T6 rely on).

## D10 — `FrameEvent.branchColors`: completing D5's contract

**AMENDED 2026-08-28 (T5 surfaced the gap). Orchestrator judgement, logged.**

**Context.** T5 reported that T1's locked interface declares only a
frame-level `backColorElement?` / `backColorGeneral?` pair on `FrameEvent`,
with no per-branch colour array — while `T2-group-colours.md` requires the
`else` colour "stored index-aligned with `branchLabels`", and **D5 depends on
it**: bands split at each `ElseTile`'s gauge min +1 with
`getBackColorGeneral()` falling back to the group colour
(`GroupingTile.java:326-332`). With no per-branch field there is no path from
parser to Blotter, so a coloured `else` silently paints the group's colour.

**Measured, not assumed.** `grep -lEi '^\s*(else|also)\s+#' tests/corpus/
sequence/*.puml` → **8 fixtures** of 1427, e.g. `else #olive sinon`,
`else #yellow cas1`, `else #0000ff80 Another type of failure`. This is
in-corpus behaviour, not speculative long tail, so CLAUDE.md's "the corpus is
the work queue" puts it in scope.

**Decision.** Add `branchColors?: (string | undefined)[]` to `FrameEvent`,
index-aligned with `branchLabels` (so index 0 is the frame's own colour and
1..n are the `else` colours), and **widen T2's write-set** to the whole
vertical slice: `ast.ts` (the field), `command-grouping.ts` (populate it),
`sequence-layout-events.ts` (read it onto `branchSeparators[i]`).

**Why T2 and not a new task.** `rules/parallelism.md`: an interface change
plus all its call sites is ONE agent's logical unit. T1 and T5 own two of
those files but are **complete and committed** (`8a13a6bc`, `6d66987c`), so
there is no concurrent writer and no write conflict. T2 is the only live task
of the three and its own task doc already demands the behaviour.

**This is not an override of a locked decision.** D5 already requires the
per-else fallback; T1's field list merely omitted a field needed to satisfy
it. Adding it COMPLETES the contract rather than contradicting it, which is
why this is logged as orchestrator judgement rather than escalated.

**Consequences.** The `branchSeparators` loop in
`sequence-layout-events.ts:265-271` already indexes `branchLabels` by the same
`i`, so the read is `event.branchColors?.[i]` — one line. Reversible.
