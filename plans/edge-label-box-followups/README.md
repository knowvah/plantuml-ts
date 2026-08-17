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
| [2](batch-2/overview.md) | Description M2 + class multi-line branch (2 parallel) | T3 T4 | [x] |
| [3](batch-3/overview.md) | Arrow-font engine wiring (3 parallel; T7 optional) | T5 T6 T7 | [x] |
| [4](batch-4/overview.md) | Close-out | T8 | [x] |

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

## Close-out (2026-08-16)

Every number below was measured on a clean tree at **`cb4de5c7`** (the last
code commit; the commits after it are planning docs) — `shape-match-report`
and `dot-sync-report` in a detached worktree, the four gates in the repo.

### Exit bar, scored clause by clause

| # | Clause | | Measurement |
|---|---|---|---|
| 1 | Backlogs go from **22 to ≤ 13** | **✓** | **11** — class 5, description 4, state 2, object 0. Eleven slugs targeted, eleven cleared; the two slack slots for `dikexa`/`zavitu` were not needed (both cleared whole). |
| 2 | Every remaining slug carries a named mechanism or an explicit "undiagnosed" | **✓** | 11 of 11 carry a named mechanism; **zero undiagnosed** — SI23's two (`vuresa`, `ticuxa`) were diagnosed in planning and cleared in T4/T5. |
| 3 | DOT EQUAL non-decreasing for every type | **✓** | class 699 → **705** · state 266 → **266** · component 257 → **259** · usecase 89 → **92** · object 78 → **78**. Nothing decreased. |
| 4 | No fixture rises in `shape-match-report` (per fixture) | **✓** | **Zero fixtures regressed; 6 improved** (`focaci`, `gobuco`, `lapoma`, `vuresa`, `camuna`, `ticuxa` — all toward jar), verified by per-fixture diff against the mission's own baseline captured at `9c4ed349`. Census 783 → **785** doc-size-exact, 26,206 → **26,255** matched-shapes. |
| 5 | All four quality gates green | **✓** | `npm test` 595 files / **14,492** passed / 1 todo, coverage 95.37 / 90.35 / 96.93 / 96.46 · `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0. |

**Scored 5 of 5.** No clause reworded.

### Residue — all 11, each with its mechanism (SI23's out-of-scope entries carried forward verbatim)

| backlog | slug | mechanism | owner |
|---|---|---|---|
| class | `nagega-30-poso418` | `!define` macro label never expanded | separate |
| class | `nuvake-96-gofe203` | `NOTE_COLOR` regex backtracks past a `;`-colour spec's embedded colons | separate |
| class | `tunelu-64-xica833` | `AssociationClass` routes note text via `class-assoc-couple.ts`'s `.label` substitution, never `.linkNote` | separate |
| class | `vonago-16-zime449` | same as `tunelu` | separate |
| class | `xamule-03-jeda376` | per-run `<size:30>` font change inside a label — needs a real creole `TextBlock` | Phase 4h |
| description | `berelu-46-namo819` | inline creole (`**missing**`) measured literally; the deltas do not fit a literal-`**` story | separate |
| description | `gevozu-46-sasu860` | `<latex>` block sizing | separate |
| description | `sunuju-01-pote718` | `<latex>` block sizing | separate |
| description | `kafexo-72-xupa679` | `skinparam maxMessageSize` word-wrap unported | separate |
| state | `lurage-50-kobo763` | multi-line label measured as one line (472x15 vs 125x54) — creole `TextBlock` | Phase 4h |
| state | `xetase-70-zaza808` | `{{ }}` embedded sub-diagram in an edge label — `EmbeddedDiagram.ts#NestedDiagramRenderer` unbuilt | separate |

**Not in any backlog but failing `labelSizeOk`:** `component/ruciga-77-ruja233`
(found by T6; fails at the pre-mission baseline too; no arrow-font override).
The shrink-only rule forbids adding it; recorded here so it is not lost.

### Corrections this mission owed, and paid

- **`decisions.md#quantifier-visibility-strip-focaci` named the wrong mechanism.**
  The strip is `CharHidder`'s creole escape (`utils/CharHidder.java:59-90`, run
  on every creole line by `StripeSimple.java:150`), not `Display`'s visibility
  strip — `Display#manageGuillemet(true)` has exactly one caller,
  `abel/LinkArg.java:71`, the main label. Same 53 for `focaci`; different for
  `+`/`-`/`#`-prefixed quantifiers, which the port now correctly leaves alone.
  T1's agent read the call path, disproved the brief with solo oracle renders,
  and was right to disobey. Recorded in `decisions.md`'s corrections section.
- **`decisions.md#d6` under-stated `hasSeveralGuideLines`:** four conditions
  (`startsWith("< ")`, `startsWith("> ")`, `endsWith(" <")`, `endsWith(" >")`,
  `Display.java:729-747`), not two. All four ported.
- **SI23's README `vuresa` line reasoned the sign backwards** — corrected there
  (one line) per T8 step 5.

### Tasks: 8 planned → 8 executed (T7, optional, executed)

Plan amendments, all journalled: T3's `roseNoteDim` landed in a new
`src/core/rose-note-dim.ts` (`edge-label-box.ts` at 500/500 lines) and T3
lowered the description backlog count pin in
`tests/unit/scripts/measure-description-size-deltas.test.ts`; T2 withheld the
`<style> arrow { FontSize }` cascade from the live theme merge (stop 8), so
Batch 3 ran **T6 first** with `style-map-theme.ts` added to its write-set to
lift it, then T5 ∥ T7. **One sub-step stopped, unfixed:** T4 step 3 (per-line
magic-arrow SVG glyph) needs `EdgeGeo` in `src/diagrams/class/class-geo-types.ts`
extended — in no task's write-set (stop 2). `gobuco`/`lapoma` DOT boxes are
exact; their SVG draws no per-line glyph. Human write-set decision required.

### Known issues and follow-ups

1. **Note-on-link SVG note shape** (`EntityImageNoteLink` draw) for class,
   state and description — D2's other mission; description now draws the note
   *text* inside the merged box, class/state still drop it.
2. **`shared-seam-extraction` now has four Rose-note copies** —
   `src/core/rose-note-dim.ts` (T3) plus `state-dot-graph.ts:178`,
   `state-composite-edge-label.ts:49`, `class-note-link-box.ts:70`.
3. **T4 step 3** — per-line magic-arrow glyphs in class SVG (`class-geo-types.ts`
   `EdgeGeo` extension + `class/renderer-edge.ts`); DOT/SVG agree on the box,
   not on the ink.
4. **Arrow-label font colour** — `camuna` (`FontColor Blue`) and `ticuxa`
   (`ClassArrowFontColor`) still draw `fill="#000000"`; D3's cascade carries
   family/size/style only. New mechanism, no backlog (size-only backlog).
5. **Description `computeLinkDzeta` flat-measures the main label** where
   upstream eats the merged block (`SvekEdge.java:1169-1171,1193-1194`) —
   inert on the corpus (all four fixtures at the nodesep/ranksep floors).
6. **`component/ruciga-77-ruja233`** — unbacklogged `labelSizeOk` failure.
7. **`.claude/catalog.md` still does not exist** (re-verified 2026-08-16);
   new public surface this mission: `stripLeadingEscapedChar` (internal),
   `roseNoteDim` (`src/core/rose-note-dim.ts`), `resolveArrowLabelFont`
   (`src/core/arrow-label-font.ts`), `computeArrowFontOverride`
   (`style-cascade-class.ts`), `hasSeveralGuideLines`/`computeGuideLinesBox`
   (`class-magic-arrow.ts`), `measureLinkNoteDim` (`description/link-note-box.ts`),
   `DescriptiveLink.linkNote/linkNotePosition`, skinparam `arrowfontname`/
   `arrowfontstyle`, `colors.graph.arrowFontFamily/arrowFontStyle`.
8. **`src/core/edge-label-box.ts` and `style-cascade-class.ts` have no line
   budget left** under the complexity hook (500/500 and ~500).

### Landing state

Branch `feat/edge-label-box-followups`, all four gates green at head. Merge
with a **merge commit** (per-task commit ids `151b5317` T1, `48c572b3` T2,
`608a0c32` T3, `d24fd288` T4, `cb4de5c7` T5, `a5eff6c6` T6, `1a17ab96` T7 are
cited throughout the journal). No PR was opened by the executor.
