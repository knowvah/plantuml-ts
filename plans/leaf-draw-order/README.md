# Mission: draw class leaves in jar's document order

## Objective

Jar draws every leaf node — classifiers, notes, member-tip (TIPS) leaves —
in `bibliotekon` insertion order: `GraphvizImageBuilder#buildImage` runs
`printGroups(root)` (each package's leaves in creation order, then its
subgroups, recursively) and THEN `printEntities(getUnpackagedEntities())`
(`GraphvizImageBuilder.java:225-227, 348-363, 397-435`); `SvekResult#drawU`
iterates `bibliotekon.allNodes()` (`SvekResult.java:82`). This port draws
classifiers in declaration order and interleaves each note after its host
(`renderer.ts`, G2 N52) — a proxy that is right on 678/802 class/object
fixtures and wrong on **47** (`scripts/note-order-report.ts --vs-jar`,
ORDER-ONLY: identical uid set, different document order).

This mission folds `NoteGeo[]` and `ClassifierGeo[]` into ONE
`ClassGeometry.leaves` collection built at layout in jar's order, and makes
the renderer a single loop over it — the state engine's shape
(`state/layout.ts#buildFlatStateGeos`), and the Batch 3 that mission
`note-leaf-model` stopped short of because it could not be byte-identical
(its journal, Batch 3 rows). Here movement is the point: **47 → 0**, every
move toward jar, measured per fixture.

Predecessor context: `plans/note-leaf-model/decision-journal.md` (Batch 3
STOP rows), `.agent-notes/note-leaf-model-b1.md`.

## Branch

`feat/leaf-draw-order` off `main` **after** `feat/note-leaf-model` is merged
into `main` with a merge commit (pre-flight step; its Batches 1–2 met their
bars byte-identically and this mission builds on T3's draw-time TIPS
resolution). Merge this branch with a **merge commit, never squash**. Agents
share this worktree: **no agent runs any git command.**

## What moves and what must not

| Signal | Baseline (`baseline/`) | Bar |
|---|---|---|
| `note-order-report --vs-jar` (all 802) | same=678 order-only=47 other=77 | **same=725 order-only=0 other=77** |
| `note-order-report --check-order` vs `baseline/note-order.txt` | — | every changed sha has a changed uid sequence, and vice versa |
| `shape-match-report` | as captured | diff-empty |
| `dot-sync-report class` | as captured | diff-empty |
| svg-class / svg-object pins | all hold | all hold; never re-baseline one |
| `npm test` | green | green, 90/90/90; only N52 order pins move, each citing its fixture |

## Batches

| # | What | Depends on | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Widen the gate; leaf order over the AST; fold the collection byte-identically | — | [x] |
| [2](batch-2/overview.md) | Draw in leaf order; triage the remainder | B1 | [x] |
| [3](batch-3/overview.md) | Sweep, re-baseline, close (retire note-leaf-model Batch 3) | B2 | [ ] |

## Quality gates

Run all between every batch. **Never pipe `npm test`.**

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
- command: npx tsx scripts/shape-match-report.ts > /tmp/shape.txt; diff plans/leaf-draw-order/baseline/shape-match.txt /tmp/shape.txt
  pass: empty diff
  on_fail: stop
- command: npx tsx scripts/dot-sync-report.ts class > /tmp/dot.txt; diff <(grep -v '^\s*$' plans/leaf-draw-order/baseline/dot-sync-class.txt) <(grep -v '^\s*$' /tmp/dot.txt)
  pass: empty diff
  on_fail: stop
- command: npx tsx scripts/note-order-report.ts --vs-jar
  pass: TOTAL other=77 and same >= 678 (B1: exactly 678/47/77; B2+: 725/0/77)
  on_fail: stop
- command: npx tsx scripts/note-order-report.ts --check-order plans/leaf-draw-order/baseline/note-order.txt
  pass: exit 0 (B1: 0 moved; B2+: moved set == the ORDER-ONLY set that cleared)
  on_fail: stop
```

## Stop conditions

- `--vs-jar` `same` < 678 or `other` ≠ 77 — a fixture moved AWAY from jar or a
  uid set changed.
- `--check-order` names an offender (sha changed without a uid-sequence
  change, or the reverse).
- Shape-match / DOT-sync diff non-empty, or any pin breaks. Never re-baseline
  a pin.
- `order-only` > 0 after T5's diagnosis shows D1's key cannot express jar's
  order for that fixture — a ruling on D1, not a fit.
- Files outside a task's write-set that no task owns: the state engine,
  `class-dot-graph.ts`, any layout arithmetic, the uid NUMBERING rules in
  `renderer-uid.ts` (its fallback iteration order is in scope; the rules are
  not).
- T3 is not byte-identical (`--check` not identical) — the fold must not move
  anything; order lands only in T4.
- Two consecutive gate failures on the same check. The cap bounds edits, not
  investigation: halt only with the full `~/.claude/rules/diagnosis.md`
  artifact in the journal.
- An implementation would contradict D1–D6 (`decisions.md`).

## Push forward without asking when

- Purely stylistic / naming, no output change.
- A task is simpler than estimated (log why).
- A stale comment or cross-reference (`NoteGeo.hostId`, N52 references) —
  fix in place.
- A test pinning N52's order needs its expectation rewritten to jar's order —
  do it, citing the fixture that proves jar's order in the assertion (D6).
- A fixture in `other=77` incidentally gains correct order — note it.
- Unit-test literals need `kind`/`leaves` migration — mechanical.

## Index

- [decisions.md](decisions.md) — D1–D6, locked
- [diagrams/component-map.md](diagrams/component-map.md) — what touches what
- [diagrams/data-flow.md](diagrams/data-flow.md) — jar's `printGroups`
  order vs the port, before and after
- [decision-journal.md](decision-journal.md) — appended during execution
- `baseline/` — T1 captures the four reports here on the base commit
- Reference implementation: `src/diagrams/state/layout.ts#buildFlatStateGeos`
  + `state/renderer-note.ts` (one array, `sortSpecsByCreationIndex`).
