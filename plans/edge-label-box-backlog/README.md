# Mission: edge-label-box-backlog

**Shrink the edge-label reserved-box backlog D7 surfaced.** SI22's D7
(`d3ff29be`) taught the DOT gate to compare every edge label's reserved
`WIDTHxHEIGHT` instead of its mere presence. That surfaced **50 pinned goldens
that were scoring EQUAL with a wrong box** — carried since as four shrink-only
`label-size-backlog.json` files, and named in `planning/next-missions.md` as
SI22's follow-on queue. This mission works that queue: not 50 fixtures, but
**four mechanisms**, three of them already confirmed by drill-down.

**Authorization.** Follow-on to SI22 (`planning/mission-index.md` row 131,
closed 2026-08-15). Register a new row at close-out (T13).

**Branch:** `feat/edge-label-box-backlog` · **Merge:** merge commit, not squash
(per-task commit IDs are referenced from the journal).

## Starting state (verify before trusting)

| Backlog | Slugs |
|---|---|
| `oracle/goldens/class/label-size-backlog.json` | 29 |
| `oracle/goldens/description/label-size-backlog.json` | 10 |
| `oracle/goldens/state/label-size-backlog.json` | 9 |
| `oracle/goldens/object/label-size-backlog.json` | 2 |

DOT EQUAL at the SI22 re-baseline: class 680/710, state 259/268,
component 257/263, usecase 88/93, object 76/78 — every drop is `labelSizeOk`.
`shape-match-report`: 779 doc-size-exact / 25952 rigid-aligned.

## The four mechanisms

Full evidence in [decisions.md](decisions.md#the-four-mechanisms).

| | Mechanism | Confirmed by |
|---|---|---|
| **M1** | Quantifier/role boxes use the arrow label font and never split `\n`. Upstream uses a separate `cardinalityFont` (`GraphvizImageBuilder.java:237`) and `Display.getWithNewlines`. | `camuna-58-veca254` — oracle heads `23x10`/`41x20`, ours `31x13`/`71x13` |
| **M2** | Note-on-link merged box unmodelled (`mergeLR`/`mergeTB`, `labelShield`, `divideLabelWidthByTwo` — `SvekEdge.java:302-356`). | `lozego-15-coci435` — oracle `137x135`, ours `33x15` |
| **M3** | Tail and head **swapped** on some edges. Not a size defect. | `givoli-70-rade072` — oracle `taillabel=19x13,headlabel=7x13`, ours reversed |
| **M4** | Few-px single-line width deltas. **Undiagnosed.** | `berelu`, `canuti`, `gikipi`, `xopuku` |

> The journal's 2026-08-15 shape survey read `lozego` as "multi-line measured
> as one line" and `givoli` as a tail-box size delta. Both were first-pass
> reads and both are wrong — see decisions.md. Correct them at close-out.

## Exit bar

1. The four backlogs go from **50 slugs to ≤ 12**.
2. **Every remaining slug carries a named mechanism** — or an explicit
   "undiagnosed", never a fudge.
3. DOT EQUAL rises from the SI22 baseline toward class 710 / state 268 /
   component 263 / usecase 93 / object 78.
4. **No fixture rises** in `shape-match-report`.
5. All four quality gates green.

The bar is ≤ 12 rather than 0 because M4's floor is unknown at planning time.
**Do not redefine it to make it look met.** If a number cannot be reached, say
which one and why, with the measurement — SI22's own rule, and it scored itself
2-of-5 unmet under it.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Foundation + both diagnoses (4 parallel) | T1 T2 T3 T4 | [x] |
| [2](batch-2/overview.md) | Shared module: quantifier arm | T5 | [x] |
| [3](batch-3/overview.md) | Engine wiring for M1 (2 parallel) | T6 T7 | [ ] |
| [4](batch-4/overview.md) | Shared module: note-merge arm | T8 | [ ] |
| [5](batch-5/overview.md) | Engine wiring for M2 (2 parallel) | T9 T10 | [ ] |
| [6](batch-6/overview.md) | Gated fixes for M3 / M4 | T11 T12a T12b T12c | [ ] |
| [7](batch-7/overview.md) | Close-out | T13 | [ ] |

Diagnoses run in Batch 1 on purpose: they block nothing, and M4 is the
mission's one unknown floor. Learn it early, not at the exit bar.

## Quality gates

Run all four before any commit lands. Per
`~/.claude/rules/autonomous-execution.md`, log results to the journal.

```
- command: npm test           # vitest + 90/90/90 coverage
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run typecheck   # both tsconfigs
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx jiti scripts/shape-match-report.ts
  pass: no fixture rises vs the pre-task census
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: output matches the task's declared write-set only
  on_fail: stop
```

Per-slug drill-down: `npx jiti scripts/dot-sync-report.ts --slug <slug> <type>`.
Oracles: `scripts/oracle-render.sh <out-dir> <puml>` — **never** a hand-typed
`java -jar`; it sets `-DPLANTUML_DETERMINISTIC_TEXT=true`, without which every
text-derived number measures the flag rather than the port.

## Stop conditions

1. **A number can only be made to match by fitting it.** No upstream
   `file:line` for a constant ⇒ stop. First on the list because this mission is
   50 numeric targets in a row, the exact condition that breaks the rule.
2. Files outside the write-set need changes, and are in no other task's.
3. Two consecutive gate failures on the same check. Fix attempts cap at 2;
   **investigation does not** — continue until the mechanism is stated.
4. Any of D1–D5 would be contradicted.
5. **D5:** M3's root cause lands in edge *emission order* ⇒ stop, hand to the
   edge-draw-order mission, do not widen.
6. A fixture rises in `shape-match-report` and the cause is not understood.
7. A ratchet pin breaks and the movement is not demonstrably toward jar.
8. A slug would need to be **added** to a backlog — the contract is shrink-only.
9. A diagnosis task cannot establish a mechanism ⇒ record ruled-out + next
   instrumentation; do **not** run its fix task.

## Push forward (journal the call)

- A slug clears as a side effect of another fix — remove it, journal it.
- Task simpler than estimated.
- Stale comment or ≤3 lines of dead code in a file already in the write-set.
- Two behaviorally identical implementations — pick one, note it.
- Extra test cases beyond the acceptance criteria.

## Index

- [decisions.md](decisions.md) — D1–D5 and the mechanism evidence
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md) — what the box
  formula touches
- [diagrams/data-flow.md](diagrams/data-flow.md) — how a label becomes a
  reserved box
