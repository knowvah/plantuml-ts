# Mission: edge-label-box-followups

**Work the residue `edge-label-box-backlog` (SI23) left with a named mechanism
but no task.** SI23 closed 2026-08-16 at 22 backlog slugs against a ≤ 12 bar
because its four-mechanism premise did not cover the 50; the residue is fully
specified in `plans/edge-label-box-backlog/README.md#residue`. This mission
takes the ten slugs whose mechanism is cheap and independently shippable, plus
the two SI23 called "undiagnosed" — both diagnosed during planning
(`decisions.md#the-two-formerly-undiagnosed-slugs`).

**Authorization.** Follow-on to SI23 (`planning/mission-index.md`; PR #29,
`406fc9ce`). Register row **SI24** at close-out (T8).

**Branch:** `feat/edge-label-box-followups` · **Merge:** merge commit, not
squash (per-task commit IDs are referenced from the journal).

## Starting state (measured 2026-08-16 on `main` at `406fc9ce`; verify)

| Backlog | Slugs |
|---|---|
| `oracle/goldens/class/label-size-backlog.json` | 11 |
| `oracle/goldens/description/label-size-backlog.json` | 9 |
| `oracle/goldens/state/label-size-backlog.json` | 2 |
| `oracle/goldens/object/label-size-backlog.json` | 0 |

DOT EQUAL class 699/711 · state 266/268 · component 257/263 · usecase 89/93 ·
object 78/80. `shape-match-report` 783 doc-size-exact / 26,206 matched-shapes.
14,426 tests / 594 files, coverage 95.35/90.33/96.92/96.45.

## The targets — ten slugs, five mechanisms

| Mechanism | Slugs | Task |
|---|---|---|
| Quantifier takes the visibility strip, never the icon | `focaci-80-suzu938` | T1 |
| Arrow main-label font ignores `<style> arrow {Font*}` / `skinparam *ArrowFont*` | `camuna-58-veca254`, `ticuxa-26-tixo262` (class), `zosuje-43-zebi775` (description) | T2 → T5, T6 |
| Note-on-link merged box unwired for the description engine | `dikexa-30-jobu917`, `fogiku-22-gone205`, `jafuke-47-xepe403`, `zavitu-69-cemu013` | T3 |
| Inline creole tag measured literally in the class multi-line branch | `vuresa-33-kumu160` | T4 |
| Magic-arrow token per line (`hasSeveralGuideLines`) | `gobuco-16-ruke239`, `lapoma-04-vaga142` | T4 |

Evidence per mechanism: [decisions.md](decisions.md#mechanisms).

## Exit bar

1. Backlogs go from **22 to ≤ 13** (eleven slugs targeted; two of slack for
   `dikexa`/`zavitu` residual edges).
2. Every remaining slug carries a named mechanism or an explicit "undiagnosed".
3. DOT EQUAL **non-decreasing** for every type.
4. **No fixture rises** in `shape-match-report` (per-fixture, not totals).
5. All four quality gates green.

Do not redefine the bar to make it look met — score it clause by clause with a
measurement, as SI22/SI23 did.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Core building blocks (2 parallel) | T1 T2 | [x] |
| [2](batch-2/overview.md) | Description M2 + class multi-line branch (2 parallel) | T3 T4 | [ ] |
| [3](batch-3/overview.md) | Arrow-font engine wiring (3 parallel; T7 optional) | T5 T6 T7 | [ ] |
| [4](batch-4/overview.md) | Close-out | T8 | [ ] |

## Quality gates

Run all before any commit lands; log results to the journal.

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
  pass: no fixture rises vs the pre-task census (per fixture)
  on_fail: stop
- command: npx jiti scripts/dot-sync-report.ts <type>
  pass: DOT EQUAL non-decreasing for the touched type(s)
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: output matches the task's declared write-set only
  on_fail: stop
```

Per-slug drill-down: `npx jiti scripts/dot-sync-report.ts --slug <slug> <type>`
and `npx jiti scripts/label-box-triage.ts`. Oracles only via
`scripts/oracle-render.sh <out-dir> <puml>` (sets
`-DPLANTUML_DETERMINISTIC_TEXT=true`).

**Census discipline (SI23 method note):** the census is invalid while any
parallel agent has uncommitted work in the shared tree. Measure in a detached
worktree at the task's own commit, or after the batch is fully committed.

## Stop conditions

1. **A number can only be made to match by fitting it** — no upstream
   `file:line` for a constant ⇒ stop.
2. Files outside the write-set need changes and are in no other task's.
3. Two consecutive gate failures on the same check; fix attempts cap at 2,
   investigation does not — continue to the mechanism, then stop with the
   `rules/diagnosis.md` artifact.
4. Any of D1–D6 would be contradicted.
5. A fixture rises in `shape-match-report` and the cause is not understood.
6. A ratchet pin breaks and the movement is not demonstrably toward jar.
7. A slug would need to be **added** to a backlog (shrink-only).
8. **T2 or T7 moves any fixture** — their bar is zero movement.
9. **T3:** D2 (note text stays visible) cannot be met without a fixture
   rising ⇒ stop with the measurement; do not choose between them.
10. **T4/T5:** the deterministic width table treats bold/italic differently
    from upstream's `StringBounderFromWidthTable` ⇒ stop, do not tune.
11. A slug's residual mechanism is one of the named out-of-scope items ⇒
    record and leave it; do not widen.

## Push forward (journal the call)

- A slug clears as a side effect of another task — remove it, journal it.
- Task simpler than estimated (e.g. `theme.ts` needs no key added).
- Stale comment or ≤ 3 lines of dead code in a file already in the write-set.
- Extra test cases beyond the acceptance criteria.
- T3: `dikexa`/`zavitu` clear only partially — journal the per-edge residual
  mechanism, keep the slug, do not chase.
- T7 skipped for time — journal it; name the state sites in the close-out.

## Out of scope, each owned elsewhere

`berelu-46-namo819` (`**x**` creole; deltas do not fit a literal-`**` story),
`xamule-03-jeda376` / `lurage-50-kobo763` (creole `TextBlock`, Phase 4h),
`xetase-70-zaza808` (`EmbeddedDiagram`), `nagega-30-poso418` (`!define`),
`nuvake-96-gofe203` (`NOTE_COLOR` regex), `tunelu-64-xica833` /
`vonago-16-zime449` (`AssociationClass` label route), `gevozu-46-sasu860` /
`sunuju-01-pote718` (`<latex>`), `kafexo-72-xupa679` (`maxMessageSize`); the
note-on-link **SVG note shape** in any engine (D2); collapsing the three
Rose-note copies (`shared-seam-extraction`).

## Index

- [decisions.md](decisions.md) — D1–D6, mechanism evidence, the two formerly
  undiagnosed slugs
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)
- Predecessor: `plans/edge-label-box-backlog/` (README close-out + residue,
  `decision-journal.md`, T7/T9/T10/T12c specs as templates)
