# Mission: arrow-label-font-colour

**Colour class/description/state edge-label ink — main label, magic-arrow
glyph and cardinality — from the arrow style's `FontColor`, exactly as the
jar's `labelFont`/`cardinalityFont` `FontConfiguration`s carry it.** Today
`class/renderer-edge.ts` hard-codes `fill="#000000"` for text and glyph,
description's `arrowLabelFontConfig` uses `JAR_DEFAULT_TEXT_COLOR`, and state
draws `theme.colors.text`; SI24's `resolveArrowLabelFont` (D3) carries
family/size/style only. `camuna` (`arrow { FontColor Blue }`), `ticuxa`
(`skinparam ClassArrowFontColor #FF0000`) and ten more corpus fixtures draw
the wrong colour. Named in `planning/next-missions.md §1` follow-on #2 (SI24)
and SI25's close-out. Register row **SI26** at T6.

**Branch:** `feat/arrow-label-font-colour` · **Merge:** merge commit.

## Starting state (measured 2026-08-17 at `13350fee`; verify)

DOT EQUAL class **705/711** · state 266/268 · component 259/263 · usecase
92/93 · object 78/80. `shape-match-report` **785** doc-size-exact / **26,256**
matched-shapes. Ratchets: class 315 pins, state 59, skin (`skin.golden.ratchet
.test.ts`), description. 595 files / 14,508 tests, coverage
95.37/90.35/96.93/96.46. Corpus fixtures with an arrow FontColor (the ONLY
ones allowed to move, plus jar-verified skin fixtures): class `camuna-58-
veca254`, `nafiki-56-jixu680`, `picija-82-jebu272`, `ticuxa-26-tixo262`;
component `cudazo-20-silo903`, `minulo-12-bare186`, `pemifo-35-kute324`,
`vaseda-71-suje167`, `xenusu-76-sabi405`, `zosuje-43-zebi775`, `figika-36-
sola271`; usecase `xozabi-42-pixa842`; state none.

## Exit bar

1. Every one of the 12 fixtures draws its main-label `<text>` `fill` equal
   to the jar's (`test-results/dot-cache/<type>/<slug>/in.svg`); class
   fixtures also their glyph `fill`/`stroke` and cardinality `fill`.
2. Every other fixture of every engine **byte-identical** in SVG (full
   per-engine dump vs the start baseline), except skin fixtures that move
   **toward jar** once `skins-builtin.ts:361`'s `arrowFontColor` applies —
   each verified against an oracle render and journalled.
3. DOT EQUAL **unchanged** for all five types (colour never enters a DOT
   box); `shape-match-report` no fixture rises; every ratchet pin holds
   (class 315, state 59, skin, description) or is re-pinned toward jar with
   the measurement journalled.
4. All four quality gates green.

Score clause by clause with a measurement; do not reword a clause.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [1](batch-1/overview.md) | Theme fields, skinparam path, resolver (zero movement) | T1 | [x] |
| [2](batch-2/overview.md) | `<style>` cascade ∥ class / description / state renderers | T2 T3 T4 T5 | [x] |
| [3](batch-3/overview.md) | Close-out | T6 | [ ] |

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
- command: for t in class state component usecase object; do npx jiti scripts/dot-sync-report.ts $t; done
  pass: EQUAL 705 / 266 / 259 / 92 / 78 — unchanged
  on_fail: stop
- command: npx jiti scripts/shape-match-report.ts
  pass: no fixture rises vs the start baseline (per fixture)
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: matches the task's declared write-set only
  on_fail: stop
```

Census discipline: clean tree only — detached worktree at the commit, the six
gitignored dirs symlinked (`.agent-notes/si24-census-worktree-needs-ignored-
assets.md`). Byte-identity is scored by a full per-engine SVG dump diffed
against the start baseline (`.agent-notes/si25-class-svg-byte-identity-dump
.md`); capture the baseline in the worktree BEFORE T1 lands. Oracle renders
only via `scripts/oracle-render.sh <out-dir> <puml>`.

## Stop conditions

1. Files outside the task's write-set need changes and are in no other
   task's (`src/core/measurer.ts`/`FontSpec`, `class-edge-geo.ts`,
   `class-magic-arrow.ts`, `class-monochrome.ts`, `state-render-colors.ts`,
   any parser).
2. Two consecutive gate failures on the same check; fix attempts cap at 2,
   investigation continues to the mechanism (`rules/diagnosis.md`).
3. Any of D1–D7 would be contradicted.
4. A colour or fixture value can only be matched by fitting it — no
   upstream `file:line` or oracle render behind it.
5. A fixture NOT in the named set differs in a per-engine SVG dump, or a
   ratchet pin fails, and the cause is not understood.
6. Any DOT EQUAL count changes for any type.
7. A named fixture moves **away** from jar (its `fill` differs from the jar
   SVG's).
8. `theme.colors.text` proves load-bearing for a state fixture such that
   D3's `#000000` fallback moves a state pin away from jar.
9. `style-cascade-class.ts` cannot get under 500 lines without removing a
   `file:line` citation.
10. Skinparam `<<tag>>` support (`xenusu`) would need parser changes — name
    it, do not build it.

## Push forward (journal the call)

- `cascadeHex` instead of `cascadeFontColorHex` for the arrow colour when
  the line budget or `#?dark:light` semantics get in the way — say which.
- Trimming doc prose (never a citation) to fit the hook; ≤ 3 lines of dead
  code in a write-set file; extra test cases; extra oracle experiments.
- A skin fixture moving toward jar once `arrowFontColor` applies — re-pin.
- Whether `componentDiagram { arrow { FontColor } }` reaches `ARROW_SNAMES`
  (`classdiagram`) — if not, name it as the size cascade's own gap; widen
  only if a corpus fixture depends on it (measure first).
- Note-on-link text colour, classifier text under `defaultFontColor`,
  sequence/activity arrow colours — name in the close-out, do not widen.

## Index

- [decisions.md](decisions.md) — D1–D7 + the oracle experiments behind them
- [decision-journal.md](decision-journal.md) — appended during execution
- [diagrams/component-map.md](diagrams/component-map.md) ·
  [diagrams/data-flow.md](diagrams/data-flow.md)
- Predecessors: `plans/class-guide-line-glyphs/` (SI25, D2 font threading),
  `plans/edge-label-box-followups/` (SI24, D3 `resolveArrowLabelFont`)
