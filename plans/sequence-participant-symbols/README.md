# Mission: sequence-participant-symbols

**Branch**: `feat/sequence-participant-symbols`, cut from `main`
(`62d5debe` or later). Merge commit back to `main`. Never squash — the
decision journal references per-task commit IDs.

## Objective

The sequence engine hand-rolls its participant head/tail glyphs instead of
using the faithful symbol drawing this repo **already ports**. Re-mirror it.

`renderDatabaseShape` (`src/diagrams/sequence/renderer-participant-shapes.ts
:209-212`) emits `rect + line + line + ellipse` — four primitives — where
`ComponentRoseDatabase.java:70` builds the glyph from
`USymbols.DATABASE.asSmall(...)` and `USymbolDatabase.java:62-79` draws it as
two `UPath`s. **A structural divergence IS the bug** (`CLAUDE.md`): re-mirror
rather than patch.

Three deliverables, in dependency order:

1. **database** — closes `junaxa-14-biko373`, one of exactly three sequence
   ratchet failures left red on `main`. 34 corpus fixtures.
2. **the five missing types** — `collections`, `queue`, `entity`, `boundary`,
   `control` have **no sequence shape at all** and fall through to the default
   participant box. 43 fixtures. All five are already ported under
   `src/core/decoration/symbol/`.
3. **actor** — a different family (see D4), and the sequence engine ignores
   `skinparam actorStyle` entirely. 179 fixtures; isolated in its own batch so
   it can be reverted alone.

## The measurement this mission starts from

`junaxa-14-biko373`, measured 2026-08-28 with an XML parser against the golden:

| | children | histogram |
|---|---|---|
| ours | 47 | `g 7, rect 8, ellipse 4, path 5, text 13, line 7, polygon 3` |
| golden | 41 | `g 7, rect 6, ellipse 2, path 7, text 13, line 3, polygon 3` |

Delta: **+2 rect, +4 line, +2 ellipse, −2 path** = two head glyphs × (our four
primitives vs the jar's one path each). **`text` is 13 on both sides** — see
the correction in D4; the diagram title is NOT a count difference.

## This mission has TWO halves, and shipping one is the known failure

`sequence-layout-participants.ts:44` carries `const DB_MIN_WIDTH = 40;
// cylinders are narrower than plain boxes` — an **uncited, fitted** constant,
used at `:155`. Upstream's rule is `ComponentRoseDatabase.java:102-105`:
`max(stickman.getWidth(), getTextWidth())`, with height `:96-99`
`stickman.getHeight() + getTextHeight()`.

Fixing only the renderer leaves widths wrong. That is exactly the recurring
defect `planning/sizer-renderer-parity.md` exists to name — read it.

## Start here

1. Read this file.
2. Read [`decisions.md`](./decisions.md) — every decision there is **locked**.
3. Read [`decision-journal.md`](./decision-journal.md) — it may carry entries
   from earlier in the session, before compaction.
4. Read `planning/sizer-renderer-parity.md` and
   `planning/usymbol-composition.md` (the latter audits description-leaf
   SIZING, so it is prior art, not the answer).
5. Find the first unchecked batch below; read its `overview.md`.
6. Announce the batch and its tasks, then begin.

## Batches

- [x] **Batch 1** — [the seam](./batch-1/overview.md) (T1)
- [x] **Batch 2** — [database: draw + size](./batch-2/overview.md) (T2, T3)
- [x] **Batch 3** — [the five missing types](./batch-3/overview.md) (T4, T5)
- [x] **Batch 4** — [actor, then close out](./batch-4/overview.md) (T6, T7)

## Quality gates

Per task:

```
- command: npm run typecheck   pass: exit 0   on_fail: fix_and_rerun
- command: npm run lint        pass: exit 0   on_fail: fix_and_rerun
- command: npx vitest run tests/unit  pass: exit 0  on_fail: fix_and_rerun
- command: npm run build       pass: exit 0   on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: output matches the task's declared write-set only
  on_fail: stop
```

**`npm test` is RED at baseline — exactly three sequence-ratchet failures**,
and that is the known state on `main`:

```
fobube-11-nifo424 (375)   junaxa-14-biko373 (673)   rugeco-70-muro754 (433)
```

This mission must **close `junaxa`** and **must not disturb the other two**.
`fobube` is the unported `newpage` pagination gap and `rugeco` is a separate
activation defect; both are filed in `planning/next-missions.md`.

Per batch, instead of the ratchet: run
`npx jiti scripts/sequence-ratchet-adjudicate.ts --base <batch parent>`.
**Invariant: zero `regression` verdicts.** `--base` and `--snapshot` are
mutually exclusive modes — passing both silently adjudicates nothing and
still exits 0. Never read a raw `diffCount` as fidelity; `weightedScore` is
the gated quantity.

## Stop conditions

1. A file outside the write-set needs changing and no task in the mission
   owns it.
2. Two consecutive quality-gate failures on the same check.
3. A decision in `decisions.md` is contradicted by what the Java says. Amend
   it in the journal first; never silently override.
4. Any `regression` verdict that survives diagnosis — stop with the full
   artefact (mechanism, `file:line`, causal chain, ruled out), not with "two
   attempts failed".
5. A constant is needed that has no upstream `file:line`.
6. `junaxa-14-biko373` does not close after Batch 2 — the mechanism was
   wrong; re-derive the plan, do not patch until the number appears.
7. `fobube-11-nifo424` or `rugeco-70-muro754` rises at any batch gate.

## Push forward without asking

- Naming and file layout within the declared write-set; test structure.
- Porting an upstream branch no corpus fixture reaches.
- A task simpler than estimated — log why, then proceed.
- Obvious, self-explanatory error fixes inside the write-set.

## Non-goals

`newpage` pagination (`fobube`); the activation double-box (`rugeco`); frame
geometry; the `sequenceDiagram.group` style cascade. All filed separately in
`planning/next-missions.md`.

---

## Close-out — 2026-08-29

**7 of 7 tasks, plus one `fix(T4)` a gate required. All four quality gates
green at head** (`npm run typecheck`, `npm run lint`, `npm run build`,
`npx vitest run tests/unit` — 584 files / 11719 tests). `npm test` overall:
656 files pass, 14 failures, all of them sequence-ratchet rows accounted for
below.

| commit | task |
|---|---|
| `a885f9da` | `feat(T1)` the participant-symbol seam |
| `58745fe3` | `feat(T2)` database drawn through `USymbolDatabase` |
| `4ed7ef4c` | `feat(T3)` database sized from `ComponentRoseDatabase` |
| `a0c37e50` | `docs(T3)` batch-2 gate |
| `edee8cca` | `feat(T4)` collections/queue/entity/boundary/control drawn |
| `8dd9aa23` | `feat(T5)` …and sized |
| `74bc5c93` | `docs(T5)` batch-3 gate |
| `6a2bf472` | `feat(T6)` actors through `ActorStyle` |
| `bce135dc` | `fix(T4)` label before glyph |
| `be3c1653` | `docs(T7)` adjudication |

**Merge with a merge commit, never squash** — the journal cites these ids.

### Results

- **`junaxa-14-biko373` CLOSED**: 725 → **333**, body-group child count 41
  with the golden's histogram and its tag sequence at all 41 positions.
- `fobube-11-nifo424` (402) and `rugeco-70-muro754` (543) **untouched**.
- Adjudicated vs `main`, 1141 fixtures, **skipped 0**: **regression 0**,
  artefact 10, improved **80**, inconclusive 19, unchanged 1032.
- Structural census: body-group child tag sequences matching the golden
  exactly **506 → 576**; matched positions **48159 → 49014** of ~105.9k.
- `skinparam actorStyle awesome|hollow` now works in sequence diagrams. It
  was silently ignored.
- Four uncited constants retired: `DB_MIN_WIDTH = 40`, `DB_HEIGHT = 80`,
  `SEQUENCE_ACTOR_HEIGHT = 90`, and the actor's local head radius / stroke
  width (10 / 1.5, both now the golden's 8 / 0.5).

### Decisions amended mid-mission (all journaled, none silent)

1. **D1/D2** — only TWO of the six contracted kinds are USymbol-backed.
   `boundary`/`control`/`entity` use the `svek/` drawing classes directly and
   `collections` has no symbol at all. Read from `Rose.java:137-190` and all
   five `ComponentRose*` bodies.
2. **A defect the brief did not know about** — this port drew every
   participant's glyph BEFORE its label; upstream draws the label first
   (`ComponentRoseDatabase.java:81-88`). `fix(T4)`.

### Open, and why

- **`tukobo-89-zebi935` stays red.** Its rise is the sequence `==` divider
  gap — `ComponentRoseDivider#drawInternalU` draws five elements to our two —
  which this mission neither caused nor fixed. Filed as
  `sequence-divider-separator` in `planning/next-missions.md`.
- **Re-pinning not done, decision required.** 10 `artefact` rows plus
  `gucare-93-petu502` qualify; `tukobo` does not. No baseline JSON was edited.
- The three write-set expansions (`docs/catalog.md`, the seam's actor branch
  and `COLLECTIONS_DELTA` export, and a new
  `sequence-layout-participant-sizing.ts`) are journaled with their reasons.
