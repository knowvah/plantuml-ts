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
| [3](batch-3/overview.md) | Close-out | T6 | [x] |

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

## Close-out (2026-08-17)

Every number below was measured on a clean tree at **`756ae57c`** (the last
code commit, `fix(T1)`; the pin commit after it adds goldens only) — the
per-engine SVG dumps, `dot-sync-report` ×5 and `shape-match-report` first in
a detached worktree at `5a7c8b5a` (`.agent-notes/si24-census-worktree-needs-
ignored-assets.md` recipe) and again on the clean working tree at `756ae57c`
(byte-identical dumps, so `fix(T1)` moved nothing on the corpus); the four
gates in the repo. The start baseline was captured the same way at `fae8ec9c`
and matched this README's starting state exactly (785 / 26,256; DOT
705/266/259/92/78).

### Exit bar, scored clause by clause

| # | Clause | | Measurement |
|---|---|---|---|
| 1 | Every one of the 12 fixtures draws its main-label `<text>` `fill` equal to the jar's; class fixtures also glyph `fill`/`stroke` and cardinality `fill` | **✓** (with one carve-out stated) | Per-label scoring of every moved link `<text>` against the jar SVG (`test-results/dot-cache/<type>/<slug>/in.svg`, jar shortens via `SvgGraphics.java:543,884`): `camuna` `foo1`/`foo2` **#00F**, `value`/`customer`/`1` **#F00** = jar · `nafiki` **#F00** = jar · `picija` **#FFA500** = jar · `ticuxa` **#F00** = jar · `xozabi` **#0F0** = jar · `zosuje` **#191970** ×4 = jar · `xenusu` **#008000** ×3 = jar · `cudazo`,`minulo`,`pemifo`,`vaseda` every label without a per-tag/positional override = jar (`#FFC0CB`/`#008000`) · `figika` **#F00**: its cached oracle is an older jar generation (`fill="#000000"`, per-text font-family — 236 of 266 component oracles are), so it was re-rendered with the pinned jar via `oracle-render.sh` → **#F00** = ours. **Glyph:** no corpus class fixture with an arrow FontColor carries a magic-arrow glyph, so D6 is proven by oracle experiments **a** (`defaultFontColor red`) and **glyph** (`<style> arrow { FontColor #0000FF }`): our `<polygon>` `fill`+`stroke` **#F00 / #00F**, label, `card`, `1`, `*` all equal the jar's render byte-for-byte on those attributes. **Carve-out (flagged):** in `cudazo`(1 label), `minulo`(3), `pemifo`(1), `vaseda`(2) the jar colours specific labels through a per-tag skinparam (`Color<<v1.1>> text:Red`), a description-engine `<style> arrow { .va { FontColor } }` cascade, or a positional mid-document `<style>` block — none ported; those labels now draw the diagram-level arrow colour, not jar's per-label one (were `#000`, also ≠ jar). See "Named gaps". |
| 2 | Every other fixture of every engine byte-identical in SVG, except skin fixtures moving toward jar | **✗ literally / ✓ in substance** | Full per-engine dump (722 class · 80 object · 272 state · 266 component · 93 usecase) vs the start baseline: **97 fixtures differ, all in `<text fill>` only** (token-wise diff; no structural change, no `<polygon>`). Beyond the 12 named: **`class/lurevi`** (`<style>` FontColor white → **#FFF** = jar), **`component/banatu`** (`<style> arrow { FontColor red }` → **#F00** = pinned-jar oracle render), **`component/golati`/`kokodo`/`koxeca`** (`skinparam Arrow { FontColor #Green }` → **#008000** = jar on every non-stereotyped label) — the brief's census of "12" was incomplete, and **80 state fixtures**: transition labels **`#181818` → `#000`**, the jar's `#000` in **325/325** state link-label `<text>`s across them (no jar state `<text>` is `#181818` anywhere; 3 of the 80 — `sagica`, `susena`, `xetase` — have no jar link text at all, a pre-existing structural divergence). D3's premise that state was byte-identical today was wrong: `theme.colors.text` was never faithful for state labels; the 59 pinned state fixtures are label-free, which is why the ratchet held. Object byte-identical (80/80). No skin fixture moved (`skin.golden.ratchet` holds; no corpus fixture uses `reddress`, the only builtin skin with `arrowFontColor`; its `!define` macros reach the accumulator unexpanded — pre-existing, see `fix(T1)`). |
| 3 | DOT EQUAL unchanged ×5; `shape-match-report` no fixture rises; every ratchet pin holds or is re-pinned toward jar | **✓** | DOT EQUAL **705 / 266 / 259 / 92 / 78** at baseline, after Batch 2, and at `756ae57c`. `shape-match-report` **785 / 26,256**, per-fixture diff vs baseline: **0 rows changed**. Ratchets: class 313/313 hold → **314** (`lurevi-57-reku842` newly zero-diff vs jar, `dotEqual: true`, its parity `firstDiff` was exactly `text[1]/@fill` — pinned), state 59/59 hold → **60** (`jomazi-30-fupe393`, same shape — pinned), object 34/34, description 51/51, skin 1/1 hold. Class census zero-diff 410 (many pre-existing unpinned), state 60, description 26+2. |
| 4 | All four quality gates green | **✓** | `npm test` 595 files / **14,533** passed / 1 todo (before the two pins; the pin commit adds two ratchet cases), coverage **95.37 / 90.36 / 96.93 / 96.47** · `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0 (its output carries three pre-existing `include-resolver-node.ts` vite-dts lines, untouched file). |

**Scored 3 of 4 met as written; clause 2 not met literally and left so** —
every non-named move is understood, jar-verified and toward/equal jar except
the seven labels in the clause-1 carve-out, which moved laterally
(wrong → differently wrong) and are named below rather than special-cased.
No clause reworded.

### Fixtures moved (97; every `fill` value vs jar)

| engine | slugs | before → after | jar |
|---|---|---|---|
| class | `camuna` | labels #000 → **#00F**, cardinality → **#F00** | #00F / #F00 |
| class | `nafiki`, `ticuxa` | #000 → **#F00** | #F00 |
| class | `picija` | #000 → **#FFA500** | #FFA500 |
| class | `lurevi` (unnamed) | #000 → **#FFF** | #FFF |
| usecase | `xozabi` | #000 → **#0F0** ×2 | #0F0 |
| component | `zosuje` | #000 → **#191970** ×4 | #191970 |
| component | `xenusu` | #000 → **#008000** ×3 (both plain `arrow {}` blocks, last wins) | #008000 |
| component | `figika`, `banatu` (unnamed) | #000 → **#F00** | #F00 (pinned-jar re-render; cached oracle is old-format `#FF0000`) |
| component | `golati`, `kokodo`, `koxeca` (unnamed), `minulo`, `pemifo`, `vaseda`, `cudazo` | #000 → **#008000** (`cudazo` **#FFC0CB**) on every label | = jar on every label WITHOUT a per-tag/positional override; jar **#FF0000** on the 3+3+2+1+1+2+1 overridden ones (lateral — see gaps) |
| state | 80 fixtures (`bajelo` … `zumuje`, plus authored `style-stereotype-on-arrow-5`) | transition labels **#181818 → #000** | #000 (325/325 jar link-label texts) |

### Decisions and readings beyond D1–D7 (all journalled)

- **`fix(T1)` `756ae57c` (flagged for review)** — the skinparam handler
  stored `resolveColorToSvgHex(color)` verbatim, so an unresolvable token
  (`reddress`'s unexpanded `ARROWFONTCOLOR` macro, a typo) landed raw in
  `<text fill>`. Now the same guard `style-cascade-class.ts#cascadeHex`
  applies (token that is not a colour → field unset → `#000000`). **Named
  divergence:** the jar draws unresolvable tokens **white**
  (`HColorSet#getColorOrWhite`; oracle experiment `bad`: `skinparam
  arrowFontColor FOOBAR` → `fill="#FFF"`, and the arrow itself white).
- **`arrowFontColor` is stored pre-resolved** in the accumulator (unlike its
  raw-valued neighbours) so the skinparam and `<style>` paths land the same
  shape in one field and renderers draw it verbatim.
- **T2 seam:** `computeArrowFontOverride`/`computeCardinalityFontOverride`
  take an optional `backgroundHex`; `style-map-theme.ts` threads
  `base.colors.background` (the canvas the label paints on) so `#?light:dark`
  resolves through `cascadeFontColorHex`; the one-arg form keeps `cascadeHex`.
- **The T3 pre-loaded observation was wrong** ("`core/svg.ts` passes colours
  through verbatim") — `svg-shapes.ts#text()`/`svg.ts#attrs()` route every
  fill/stroke through `shortenColor` (`svg-format.ts:128`, jar
  `SvgGraphics.java:543,884`); both agents followed the code, correctly.
- **`xenusu` (stop 10)** does not need stereotype support for its FONT colour
  — its `arrow<<bluebold>>` blocks set only `Color`/`line.Bold()`.
- **`FromSkinparamToStyle.java` registers no `cardinalityFontColor`**; only
  `<style> arrow { cardinality { FontColor } }` sets `theme.cardinalityFontColor`.
- **`componentDiagram { arrow { FontColor } }`** — zero corpus fixtures use the
  `componentDiagram` selector; `ARROW_SNAMES` left at `classdiagram`.

### Tasks: 6 planned → 6 executed (+ one `fix(T1)` commit)

T1 and T2 by the orchestrator; T3/T4/T5 by three parallel `typescript-pro`
(sonnet) agents with disjoint write-sets, committed by the orchestrator one
per task. Commits: `437727db` T1 · `8204d7d9` T2 · `bbef1b5d` T4 · `a5e6093e`
T5 · `13383da6` T3 · `756ae57c` fix(T1) · pins + T6 docs after.

### Named gaps and follow-ons (not widened)

1. **Per-tag arrow FontColor, three unported forms** (the clause-1 carve-out):
   (a) skinparam `Color<<tag>> text:Red` inside `skinparam Arrow {}` —
   stereotype-qualified arrow skinparam WITH the `text:` colour sub-spec, both
   halves unported (`skinparam-stereo-keys.ts` ignores `arrow<<X>>`) —
   `golati`, `kokodo`, `koxeca`, `minulo`; (b) `<style> arrow { .va { FontColor
   } }` in the DESCRIPTION engine — description reads no `arrowTagCascade` at
   all (its `.vb { LineColor }` lines draw `#181818` today, jar red/blue): a
   whole per-tag arrow-style mechanism, class-only so far — `pemifo`,
   `vaseda`; (c) positional mid-document `<style>` blocks in description
   (class has `stylePositions`; description merges all blocks, last wins) —
   `cudazo`.
2. **State label colour was `theme.colors.text`** — closed here for transition
   labels; audit the other `theme.colors.text` draws (`renderer-classifier-
   rows.ts:45-50` hard-codes `#000000` for the same reason) — classifier text
   under `defaultFontColor` is the natural next.
3. **Note-on-link text colour; sequence/activity arrow colours** — named by the
   brief, untouched.
4. **`skin-loader.ts` does not expand `!define`/`!ifdef`** — `reddress` reaches
   the accumulator with `ARROWCOLOR`/`ARROWFONTCOLOR`/`FONTNAME` raw
   (arrowheads already draw `fill="ARROWCOLOR"`); the pinned jar cannot render
   `skin reddress` at all (no `reddress.skin` upstream), so no oracle.
5. **Description quantifier labels are never drawn** (`SvekEdgeInput` has no
   tail/head label; `renderer-edge.ts#buildInput` reads no
   `firstLabel`/`secondLabel`) — sized for DOT, dropped at ink (T4 audit).
6. **236/266 component oracle SVGs are an older jar generation**
   (`fill="#000000"`, per-text `font-family`/`lengthAdjust`) — every text
   `fill` in them mismatches `shortenColor` output; the description census
   under-reads. Recapture candidates (`oracle-freshness.test.ts`).
7. **`!theme` arrow FontColor** (`puml-theme-aws-orange.puml:281-286`,
   `arrow { FontColor $FGCOLOR }`) — unverified; no corpus theme fixture has
   an arrow label.
8. **Skinparam accumulator is a `Map` keyed by normalised key** — `defaultFontColor
   red; arrowFontColor green; defaultFontColor blue` keeps `defaultfontcolor`
   at its first slot (value blue) → arrow green where the jar gives blue;
   two-key orders (experiments b/g) are exact.
9. `svg-dump-all` census harness (session-local script) intermittently
   rendered 265/266 component fixtures (`kofovu-01-niti223` skipped) — a
   harness quirk, the fixture is byte-identical whenever present.
