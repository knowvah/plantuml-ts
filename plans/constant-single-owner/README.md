# Mission: one upstream constant, one declaration

## Objective

`INK_DELTA` and `JAR_INK_MARGIN` — both from one upstream method — were
declared four times across three engines, and the drift that predicts had
already started: state's comment cross-referenced a class file that does not
exist. Fixed in `f576dfa3` by giving them a single owner at
`src/core/svek/SvekResult.ts`.

They are not the only pair. Measured on the current tree:

```
duplicated constant names:        67
redundant declarations:          117
  same value everywhere:          61 names / 100 redundant decls
  same NAME, different VALUES:     6 names
of the 61, carrying an upstream citation on at least one declaration: 18
```

## The rule this mission runs on

**Mirror upstream's declaration COUNT, not its values.**

- Upstream has ONE field that N of our modules read ⇒ **one owner, N
  imports.** `SvekResult`'s pair is the worked example.
- Upstream has N fields that happen to hold the same number ⇒ **keep N
  declarations.** Merging them couples engines upstream deliberately keeps
  apart, and the next time upstream parameterises one of them the divergence
  becomes inexpressible. That is a porting-discipline violation, not a style
  preference.

Equal values are therefore **evidence to investigate, never grounds to
merge**. Every consolidation in this mission is justified by a Java
`file:line` showing one upstream field, or it does not happen.

This is why the work is a mission and not a sweep: the per-constant question
can only be answered by reading the Java, and the coincidence case is already
proven real here — six names carry different values under the same name
(below).

## This mission moves NO fixture

Its exit bar is "the corpus is byte-identical and the duplication count
falls". A rendered-output change means a consolidation merged two constants
that were not the same constant — that is the mission's central failure mode,
and it is a stop, not a finding to accept.

## The six same-name-different-value collisions

These must NOT be merged. They are RENAME candidates — they read as
duplication to anyone running the inventory, which is how a future reader
gets misled into merging them:

```
ACTOR_HEIGHT          70 leaf-sizing-consts.ts      90 sequence-layout-participants.ts
MARGIN                 5 error-renderer.ts          12 graph-layout.ts
                      10 board/renderer.ts          20 chart-layout-core.ts
                       5 state/renderer-box.ts       5 state/renderer-composite-box.ts
                       5 state/state-composite-sizing.ts
MIN_WIDTH            120 gtile-action.ts           200 chart/renderer.ts
                      30 TextBlockJson.ts
NOTE_FOLD              8 activity ×3               10 renderer-note.ts ×2
RADIUS                 6 abel/EntityPosition.ts      8 gtile-spot.ts
                      10 gtile-start.ts              6 state/renderer-border-point.ts
STEREO_MARGIN          1 class-stereotype.ts         2 leaf-sizing-consts.ts
```

Note `MARGIN` and `RADIUS` are BOTH cases at once: the three state `MARGIN`
5s are very likely one upstream `IEntityImage.MARGIN`, while `graph-layout`'s
12 is unrelated canvas padding. Splitting a name that is simultaneously a
share candidate and a collision is the trickiest work here.

`ROOT_LINE_THICKNESS` looks like a collision (`1` vs `1.0`) and is NOT — same
number, different literal. Any inventory comparing value STRINGS will
misclassify it; T1's compares numerically.

## Scope

In scope: module-level `const NAME = <number>;` declarations under `src/`.

Out of scope, and deliberately:

- **`HACK_X_FOR_POLYGON` (4 copies).** One upstream constant, but
  `LimitFinder.ts` keeps it private and the ink modules observe a stated
  klimt-free-module convention — verified real, `class-ink-shapes.ts` imports
  nothing from klimt. Retiring this duplicate means changing that convention,
  which is a larger architectural call than this mission should make on its
  own. Each copy is cited to upstream. **Leave it; do not "fix" it.**
- String and object constants. Numbers only — the inventory, the risk and the
  test are all different for the others.
- Anything under `scripts/`, `tests/`, `demo/`.

## Batches

| # | What | Depends on | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Inventory harness + classification pass | — | [ ] |
| [2](batch-2/overview.md) | The cited cross-engine svek/CucaDiagram family | B1 | [ ] |
| [3](batch-3/overview.md) | Intra-engine clusters (activity/tiles) | B1 | [ ] |
| [4](batch-4/overview.md) | Rename the collisions; sweep and close | B2, B3 | [ ] |

Batches 2 and 3 are independent (disjoint write-sets, different engines) and
may run in either order or together.

## Branch

`feat/constant-single-owner` off `main`. Merge with a **merge commit, never
squash**. Agents share this worktree: **no agent runs any git command**; the
orchestrator commits after each batch.

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
- command: npx tsx scripts/shape-match-report.ts
  pass: 776 doc-size-exact / 25695 matched-shapes, EXACTLY — this mission
        moves nothing
  on_fail: stop
- command: npx tsx scripts/constant-inventory.ts
  pass: redundant-declaration count strictly LOWER than the batch's start
  on_fail: stop
```

## Stop conditions

- **Any rendered output changes at all.** See "This mission moves NO fixture".
  A moved fixture means two different constants were merged.
- A consolidation cannot be justified by a Java `file:line` showing one
  upstream field. Leave it declared where it is and record why.
- A task needs a file outside its write-set that is in no other task's
  write-set either.
- Two consecutive gate failures on the same check. The cap bounds **edits,
  not investigation** — diagnose until you can state the mechanism, then STOP
  and log the full `~/.claude/rules/diagnosis.md` artifact.
- The klimt-free-module convention would have to be changed (see Scope).
- A consolidation would require an import that crosses an engine boundary the
  wrong way — a diagram engine importing from another DIAGRAM engine. Shared
  constants belong in `src/core/`, mirroring the upstream package that owns
  them; engine-to-engine imports are a different (worse) coupling than the
  duplication being removed.

## Push forward without asking when

- The choice is purely stylistic and does not change behaviour.
- A constant turns out to be genuinely unshared and stays put (log why —
  a NO is as valuable an outcome here as a yes).
- A task is simpler than estimated (log why).

## Index

- [decisions.md](decisions.md) — the confirmed architecture decisions
- [diagrams/component-map.md](diagrams/component-map.md) — where owners live
- [decision-journal.md](decision-journal.md) — appended during execution
- `src/core/svek/SvekResult.ts` — the worked example. **Read it first**; its
  doc comment states the share-vs-coincidence distinction this whole mission
  turns on.
