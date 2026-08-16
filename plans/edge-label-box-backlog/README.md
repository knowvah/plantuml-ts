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
| [3](batch-3/overview.md) | Engine wiring for M1 (2 parallel) | T6 T7 | [x] |
| [4](batch-4/overview.md) | Note-merge arm + D3 completion (2 parallel) | T8 T14 | [x] |
| [5](batch-5/overview.md) | Engine wiring for M2 (2 parallel) | T9 T10 | [x] |
| [6](batch-6/overview.md) | Gated fixes for M3 / M4 | T11 T12a T12b T12c | [x] |
| [7](batch-7/overview.md) | Close-out | T13 | [x] |

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

---

# Close-out (T13) — 2026-08-16

Every number below comes from a command run during close-out on a clean tree,
not from an earlier task's journal entry.

## Exit bar, scored clause by clause

| # | Clause | | Measurement |
|---|---|---|---|
| 1 | The four backlogs go from 50 slugs to ≤ 12 | **✗** | **22** — class 11, description 9, state 2, object 0. Missed by 10. |
| 2 | Every remaining slug carries a named mechanism, or an explicit "undiagnosed" | **✓** | 20 of 22 carry a named mechanism; `vuresa-33-kumu160` and `ticuxa-26-tixo262` are labelled **undiagnosed** explicitly, each with its ruled-out observation. |
| 3 | DOT EQUAL rises toward class 710 / state 268 / component 263 / usecase 93 / object 78 | **✗ partial** | class 680→**699** (target 710), state 259→**266** (268), component 257→**257** (263), usecase 88→**89** (93), object 76→**78** (**78 ✓ met**). Every type rose or held; only object reached target. |
| 4 | No fixture rises in `shape-match-report` | **✓** | **Zero fixtures regressed**; 24 improved. Verified per-fixture against the mission baseline, not by totals. Census 779→**783** doc-size-exact, 25975→**26206** matched-shapes. |
| 5 | All four quality gates green | **✓** | `npm test` 594 files / 14426 passed / 1 todo · `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0. |

**Scored 3 of 5.** Clause 1 is missed by 10 slugs and clause 3 is met only for
object. Neither is reworded and neither is softened; see the residue table for
where the 22 actually are.

## Why clause 1 was missed

The bar assumed four mechanisms covered the 50 slugs. **They do not.** The
mission delivered all four — M1 (quantifier font + `\n` split), M2 (note-on-link
merge), M3 (tail/head swap), M4 (all three sub-mechanisms) — and the residue is
dominated by mechanisms the brief never named:

- **9 slugs** belong to mechanisms outside M1–M4 entirely (`<latex>` sizing,
  `skinparam maxMessageSize` word-wrap, `<style> arrow { FontSize }` on the main
  label, a `!define` macro, an `AssociationClass` text route, a `NOTE_COLOR`
  regex ambiguity, an embedded `{{ }}` sub-diagram, and two undiagnosed).
- **4 slugs** are M2 in the **description** engine, which the brief's Batch 5
  never scoped a task for (T9 was state, T10 was class).
- **3 slugs** are documented residue requiring a real creole `TextBlock` (the
  Phase 4h track) or a per-line extension of cause D.
- **6 slugs** are follow-on work newly specified during this mission.

So the ≤ 12 target was unreachable from the plan as written, not from the work
done. M4 alone grew from 4 slugs to ~13 once diagnosed.

## Residue — all 22, each with its mechanism

### class (11)

| slug | mechanism |
|---|---|
| `camuna-58-veca254` | `<style> arrow { FontSize }` not applied to **main-label** measurement (head labels fixed by T14) |
| `focaci-80-suzu938` | quantifier labels take cause A's visibility strip but **not** cause B's icon — confirmed: `61.1` → strip `~` → `53.46` → **53** = oracle |
| `gobuco-16-ruke239` | magic-arrow tokens on individual lines of a multi-line label (cause D is per-label, not per-line) |
| `lapoma-04-vaga142` | same as `gobuco` |
| `nagega-30-poso418` | `!define` macro label never expanded |
| `nuvake-96-gofe203` | `NOTE_COLOR` regex backtracks past a `;`-colour spec's embedded colons |
| `ticuxa-26-tixo262` | **undiagnosed** — our 23 correctly measures `toto`; the oracle's 98x60 comes from something in the file we are not reading |
| `tunelu-64-xica833` | `AssociationClass` routes note text via `class-assoc-couple.ts`'s `.label` substitution, never `.linkNote` |
| `vonago-16-zime449` | same as `tunelu` |
| `vuresa-33-kumu160` | **undiagnosed** — 14px too wide on a multi-line label with inline `<b>`; failing to strip `<b>` would make us *narrower*, so that hypothesis is ruled out by the sign of the error |
| `xamule-03-jeda376` | per-run `<size:30>` font change inside a label — needs a real creole `TextBlock` (Phase 4h) |

### description (9)

| slug | mechanism |
|---|---|
| `berelu-46-namo819` | inline creole (`**missing**`) measured literally; only such slug corpus-wide |
| `dikexa-30-jobu917` | **M2 unwired for the description engine** |
| `fogiku-22-gone205` | M2, description |
| `jafuke-47-xepe403` | M2, description |
| `zavitu-69-cemu013` | M2, description |
| `gevozu-46-sasu860` | `<latex>` block sizing |
| `sunuju-01-pote718` | `<latex>` block sizing |
| `kafexo-72-xupa679` | `skinparam maxMessageSize` word-wrap unported |
| `zosuje-43-zebi775` | `<style> arrow { FontSize 10 }` not applied to main-label measurement |

### state (2)

| slug | mechanism |
|---|---|
| `lurage-50-kobo763` | multi-line label measured as one line (472x15 vs 125x54) |
| `xetase-70-zaza808` | `{{ }}` embedded sub-diagram in an edge label — `EmbeddedDiagram.ts#NestedDiagramRenderer` unbuilt |

### object (0) — backlog fully cleared

## Corrections this mission owed, and paid

- **The 2026-08-15 shape survey was wrong twice.** `lozego-15-coci435` was read
  as "multi-line measured as one line"; it is a **note-on-link merged box (M2)**,
  now exact at 137x135. The `givoli` family was read as a tail-box size delta;
  it is a **tail/head swap (M3)**, an assignment defect, now fixed.
- **`class-layout-edge-labels.ts:34`'s "theme.fontSize = 14" claim was stale** —
  the path measures at 13. Corrected in T6 with both proofs.
- **`class-layout-edge-labels.ts:25`'s "no diagram overrides `cardinality`"** —
  `camuna-58-veca254` does. Corrected in T6.
- **The brief's own starting census figure ("25952 rigid-aligned") matches no
  metric the report emits.** `doc-size-exact` matched exactly at 779; the
  mission adopted its own captured per-fixture baseline as the D4 comparison.

## Tasks: 14 planned → 16 executed

T1–T11 and T13 as planned; **T12 split into T12a/T12b/T12c** (maintainer-approved,
after T4 found three sub-mechanisms where the brief scoped one); **T14 added**
(maintainer-approved, to complete D3 after T6 and T7 both hit the same write-set
escape and left the cardinality cascade with zero callers).

## Known issues and follow-ups

1. **M2 for the description engine** — 4 slugs, the cheapest remaining win; the
   shared arm exists and two engines are already wired. Note the trap T9 hit:
   the correct note sizer is `ComponentRoseNote` (`pureText + 31`), **not** the
   `Opale`-based `measureNote` (`+21`).
2. **Cause A for quantifier labels** — strip only, no icon. `focaci`, confirmed
   arithmetically above.
3. **Cause D per-line inside multi-line labels** — `gobuco`, `lapoma`.
4. **`<style> arrow { FontSize }` on main-label measurement** — `camuna`,
   `zosuje`. Cheap now that T1's arrow cascade exists.
5. **Two undiagnosed slugs** — `vuresa`, `ticuxa`, with ruled-out notes attached.
6. **`.claude/catalog.md` does not exist**, though `CLAUDE.md` directs every
   agent to check it before implementing. `.claude/` is gitignored, so anything
   written there would not be committed. **Unowned.** A rule pointing at a
   nonexistent file is exactly the stale premise this mission line keeps paying
   for. New public surface this mission added, recorded here instead:
   `computeQuantifierBox`, `computeMergedLabelBox`, `applyVisibilityIcon`,
   `applyGuillemet`, `parseMagicArrowLabel` (all `src/core/edge-label-box.ts`),
   `computeCardinalityFontOverride` (`src/core/style-cascade-class.ts`),
   `class-edge-label-lines.ts` (split), `scripts/label-box-triage.ts`.
7. **`hasMiddleDecor` is dead code, categorically** — this port has no
   `LinkMiddleDecor` concept (`CommandLinkClass.java:490-509`'s `INSIDE` group
   is unported), so T8's shield term can never fire. Kept as faithful upstream
   arithmetic; belongs in `DIVERGENCES.md`.
8. **`theme.ts` has no line budget left** under the complexity hook.
