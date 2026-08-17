# Mission: class-guide-line-glyphs

**Draw one magic-arrow triangle glyph per guide line of a multi-line class
edge label, and position class edge-label ink at the resolved arrow font.**
Follow-on to `edge-label-box-followups` (SI24, `813207b1`), whose T4 made the
DOT box for `class/gobuco-16-ruke239` / `lapoma-04-vaga142`
(`A -> B : ab >\ncd <\n< ef\n> gh`) exact at 29x54 but stopped before the SVG:
`class-edge-geo.ts` takes the multi-line early return and draws no glyph, while
the jar draws four `<polygon>`s (`test-results/dot-cache/class/gobuco-16-ruke239
/in.svg`). SI24 T5 also left the class geo/anchor layer positioning ink at the
constant `CARDINALITY_FONT_SIZE` (13) while the DOT reservation follows
`resolveArrowLabelFont(theme)` — a box/ink drift on any arrow-font override.
Both are fixed here; class engine only.

**Authorization.** Named in `planning/next-missions.md §1` follow-on #1 and
SI24's close-out ("T4 step 3 stopped, unfixed"). Register row **SI25** at T4.

**Branch:** `feat/class-guide-line-glyphs` · **Merge:** merge commit.

## Starting state (measured 2026-08-16 at `cb4de5c7`/`813207b1`; verify)

DOT EQUAL class **705/711** · state 266/268 · component 259/263 · usecase
92/93 · object 78/80. `shape-match-report` **785** doc-size-exact / **26,255**
matched-shapes (`gobuco` 14/22 168x102 vs jar 168x102; `lapoma` 14/22 68x232 vs
72x232). Class SVG ratchet 315 pins. 595 files / 14,492 tests, coverage
95.37/90.35/96.93/96.46. Backlogs 5/4/2/0 (untouched by this mission).

## Exit bar

1. `gobuco` and `lapoma` class SVG each carry **four** glyph `<polygon>`s, one
   per line, directions right/left/left/right, glyph shape byte-exact to jar's
   (position within the accepted N25/N62 gvts residual, not chased).
2. Every other class fixture **byte-identical** in DOT and SVG, except
   arrow-font-override fixtures (`camuna-58-veca254`, `ticuxa-26-tixo262`,
   `nafiki-56-jixu680`) which may move **toward jar** under D2, journalled.
3. Class DOT EQUAL **≥ 705/711**; class SVG ratchet pins hold or move toward
   jar with the measurement journalled; `shape-match-report` no fixture rises
   (per fixture, vs a baseline captured in a detached worktree at the start).
4. All four quality gates green.

Score clause by clause with a measurement; do not reword a clause.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Shared per-line walk (zero movement) | T1 | [x] |
| [2](batch-2/overview.md) | Geometry: per-line glyph + FontSpec threading | T2 | [x] |
| [3](batch-3/overview.md) | Renderer: draw the glyphs | T3 | [x] |
| [4](batch-4/overview.md) | Close-out | T4 | [x] |

## Quality gates

```
- command: npm test            # vitest + 90/90/90
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx jiti scripts/dot-sync-report.ts class
  pass: EQUAL >= 705/711
  on_fail: stop
- command: npx jiti scripts/shape-match-report.ts
  pass: no fixture rises vs the start baseline (per fixture)
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: matches the task's declared write-set only
  on_fail: stop
```

Census discipline: run the census only on a clean tree — detached worktree at
the commit, gitignored dirs symlinked (`.agent-notes/si24-census-worktree-
needs-ignored-assets.md`). Per-slug: `npx jiti scripts/dot-sync-report.ts
--slug <slug> class`. Oracle SVG cached at `test-results/dot-cache/class/<slug>/
in.svg`; new oracles only via `scripts/oracle-render.sh`.

## Stop conditions

1. Files outside the task's write-set need changes and are in no other
   task's (`class-geo-builders.ts`, `class-layout-edge-labels.ts`, anything
   under `src/core/`, description/state engines).
2. Two consecutive gate failures on the same check; fix attempts cap at 2,
   investigation continues to the mechanism (`rules/diagnosis.md` artifact).
3. Any of D1–D6 would be contradicted.
4. A number can only be matched by fitting it — no upstream `file:line`.
5. A fixture rises in `shape-match-report` or a ratchet pin drops and the
   cause is not understood.
6. `camuna`/`ticuxa`/`nafiki` moves **away** from jar under D2.
7. `.80` / `ARROW_GLYPH_SIZE` would enter a measurement or a block position.
8. `class-geo-types.ts` cannot get under 500 lines without removing a
   `file:line` citation.
9. Class DOT EQUAL drops below 705 (T1/T2 are zero-movement on the DOT side).

## Push forward (journal the call)

- Glyph absolute position differs from jar by the accepted N25/N62 residual.
- Trimming doc prose in a write-set file to fit the hook; ≤ 3 lines of dead
  code in a write-set file; extra test cases.
- Description/state would benefit from the same per-line glyph — name it in
  the close-out, do not widen.
- Whether the per-line direction is muted by the edge guide (`LinkArrow#mute`,
  `abel/LinkArrow.java:55`) — read it, mirror the whole-label path, journal.

## Index

- [decisions.md](decisions.md) — D1–D6
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md) ·
  [diagrams/data-flow.md](diagrams/data-flow.md)
- Predecessor: `plans/edge-label-box-followups/` (D6, corrections, T4 spec and
  journal row), `plans/edge-label-box-backlog/batch-6/T12c-magic-arrow.md`

## Close-out (2026-08-17)

Every number below was measured on a clean tree at **`3fe4aca4`** (the last
code commit; the commits after it are planning docs) — `shape-match-report`
and `dot-sync-report` in a detached worktree (`.agent-notes/si24-census-
worktree-needs-ignored-assets.md` recipe), the four gates in the repo. The
start baseline was captured the same way at `7ba67fcd` and matched this
README's starting state exactly (785 / 26,255; class 705/711).

### Exit bar, scored clause by clause

| # | Clause | | Measurement |
|---|---|---|---|
| 1 | `gobuco`/`lapoma` class SVG each carry **four** glyph `<polygon>`s, one per line, right/left/left/right, shape byte-exact to jar's | **✓** | Both SVGs: 4 glyph polygons, interleaved `<polygon>`,`<text>` per line as jar's. Directions forward/backward/backward/forward. Shape: tip-to-back deltas 9.045 / ±2.939 identical to jar; every glyph and text sits **0.23 px** right of jar — the same offset jar's own arrowhead shows (`111.722` vs `111.72`), the accepted N25/N62 residual, not chased. |
| 2 | Every other class fixture byte-identical in DOT and SVG, except `camuna`/`ticuxa`/`nafiki` moving toward jar under D2 | **✓** | Full 722-fixture class SVG dump at `7ba67fcd` vs `3fe4aca4`: **exactly 4 differ** — `gobuco`, `lapoma`, `camuna`, `ticuxa`. `camuna`: `foo1`/`foo2` `textLength` 25.269 → **27.213** (= jar), baseline fraction `.611` → **`.889`** (= jar). `ticuxa`: `toto` x/y/textLength **39.969/131.111/96.425** vs jar 39.97/131.111/96.425, doc 114 → **151** vs jar 152. `nafiki` has no main label — unmoved, correctly. DOT: class 705/711 unchanged (T1/T2 zero-movement on the DOT side, by construction — same walk). |
| 3 | Class DOT EQUAL ≥ 705/711; ratchet pins hold or move toward jar; `shape-match-report` no fixture rises (per fixture, vs the start baseline) | **✓** | Class DOT **705/711**; state 266 · component 259 · usecase 92 · object 78 (all unchanged). Class SVG ratchet **315/315** hold (none of the four moved fixtures is a zero-diff pin). Census 785 doc-size-exact (unchanged) / 26,255 → **26,256** matched-shapes; per-fixture diff: **2 rows changed, both upward** (`ticuxa` 13/14 → **14/14**, `lapoma` doc 68 → **70** vs jar 72), zero fell. `gobuco` stays 14/22 because its texts and new polygons all carry the 0.23 px residual against `POSITION_TOL` 0.05. |
| 4 | All four quality gates green | **✓** | `npm test` 595 files / **14,508** passed / 1 todo, coverage **95.37 / 90.35 / 96.93 / 96.46** · `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0. |

**Scored 4 of 4.** No clause reworded.

### Fixtures moved (each toward jar)

| slug | before → after | jar | what moved |
|---|---|---|---|
| `class/gobuco-16-ruke239` | 0 → **4** glyph polygons; text `ab >` → `ab` (stripped, textLength 22.1 → 14.463); doc 168x102 | 4 polygons; 168x102 | per-line glyphs + stripped text |
| `class/lapoma-04-vaga142` | 0 → **4** glyph polygons; doc 68x232 → **70x232** | 72x232 | as `gobuco`; doc +2 |
| `class/camuna-58-veca254` | `foo1`/`foo2` textLength 25.269 → **27.213**, baseline `.611` → `.889` | 27.213 / `.889` | main-label ink at 14 bold (D2) |
| `class/ticuxa-26-tixo262` | `toto` at 13/sans → **58/Courier/italic** at jar's x/y; doc 114 → **151**; matched 13/14 → **14/14** | 152 | main-label ink at 58 (D2) |

### Decisions and reading, beyond D1–D6 (all journalled)

- **`LinkArrow#mute` (`abel/LinkArrow.java:55-71`)** — DIRECT_NORMAL returns
  the guide unchanged, BACKWARD wraps it with `Math.PI +`; a multi-guide-line
  link's own `LinkArrow` is `NONE_OR_SEVERAL` (`StringWithArrow.java:63-65`
  via `Labels.java:64`), so the guide carries the un-reversed internal angle
  and the per-line direction reduces to `magicArrowAngle(fromToPoints, dir)`
  — the whole-label path, byte-for-byte.
- **Text baseline in the guide-line block** — `mergeLR`'s `(H - textHeight)/2`
  centring is identically 0 under this port's `height === font.size`
  measurers, so the baseline is the existing `size - descent` from the line
  top; the arrow slot's `(blockHeight - size)/2` IS mirrored.
- **D2 seam shape** — `buildEdgeGeos`/`attachEdgeLabel` take one
  `EdgeGeoTextContext { measurer, labelFont, fontFamily }` (8 → 7 params)
  because tail/head must keep `theme.fontFamily`, which differs from
  `labelFont.family` under `ArrowFontName`; `portLabelAnchor` takes a
  `FontSpec` (tail/head pass `{fontFamily, 13}` — unchanged behaviour).
- **`fix(T1)` `722c2bee`, flagged for review** — `magicArrowGlyphPoints` used
  the 13-based `ARROW_GLYPH_SIZE` (10) as its ink radius for every font size;
  `TextBlockArrow2.java:64-65` derives `triSize = (int)(size * .80)` from the
  resolved font (`:57`). New `magicArrowTriSize(size)`; byte-identical at 13
  (proven by the full SVG dump). Committed separately in T1's write-set so
  each commit's diff matches its own task's files.

### Tasks: 4 planned → 4 executed (+ one `fix(T1)` commit)

All four executed directly by the orchestrator (single-task batches, no
parallel sibling; the Java reading stays in one context). Commits: `a9e40bc6`
T1 · `722c2bee` fix(T1) · `ca590920` T2 · `3fe4aca4` T3.

### Follow-ons (named, not widened)

1. **Description/state per-line glyphs** — description's `link-edge-attrs.ts`
   already shares `parseMagicArrowLabel` (SI23 T12c D1); neither engine draws
   the whole-label glyph, let alone per-line. Corpus reach unmeasured.
2. **Tail/head cardinality ink font** — anchored at `theme.fontFamily` +
   `CARDINALITY_FONT_SIZE` while the DOT box uses
   `theme.cardinalityFontFamily/Size` (`class-dot-graph.ts:390`): an ink/box
   drift under `arrow.cardinality { FontSize }` (`camuna`, `nafiki`). D2
   scoped this mission to the main label.
3. **`class-ink-box.ts#addEdgeTextInk`** uses the constant 13 as the text
   ascent for every edge label regardless of its font (`ticuxa` doc 151 vs
   152 is the likely residue).
4. **`lapoma` doc width 70 vs 72** — a text-ink extent rule for the guide-line
   block, not the glyph (every element differs by exactly the 0.23 residual;
   only the document width differs by 2). Mechanism not established.
5. **Arrow-label font colour** — still `fill="#000000"` for both text and glyph
   (`camuna` Blue, `ticuxa` `#FF0000`); carried from SI24.
6. **A bare-token guide line** (`<` alone inside a multi-guide-line label) is
   handled (glyph, no `<text>`) but has zero corpus reach — author a fixture
   and oracle when a mission next touches this seam.

### Landing state

Branch `feat/class-guide-line-glyphs`, all four gates green at head. Merge
with a **merge commit** (per-task ids above are cited throughout the journal).
No PR was opened by the executor.
