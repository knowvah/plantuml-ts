# T4 report -- canvas, margins and dpi

Branch codd/T4 (base 9e2744253). Worktree: /Users/scottseely/git/knowvah/plantuml-ts/.claude/worktrees/codd-T4

## Commits (4 fixes + notes)

| sha | subject |
|---|---|
| 5294e0354 | fix(description): count removed entities in the degenerate-leaf predicate |
| 18cd2d44b | fix(description): draw the chrome background rect over the final canvas |
| 5b2bb83f2 | fix(description): read the document style Margin like the exporter |
| 08c9a9e08 | fix(description): scale the chrome-composed block and its degenerate size |
| 8d6f5f065 | docs(codd): T4 observations (.agent-notes/codd-T4.md) |

Files: src/diagrams/description/{renderer,renderer-ink-extent,index,layout-helpers,layout-helpers-types}.ts;
src/core/{assemble-svg,assemble-svg-activity,dispatcher,document-margin,TextBlockExporter}.ts; docs/catalog.md;
tests: tests/unit/description/codd-t4-{degenerate-removed,background-rect-first,document-margin,chrome-scale}.test.ts (new),
tests/unit/core/{TextBlockExporter,unwind2-s5-theme-order}.test.ts (edited; unwind2-S5 usecase pins 53 -> 17, a tightening).

Write-set extensions used (all additive, journal-worthy): `layout-helpers.ts` + `layout-helpers-types.ts` (the `degenerate`
flag; the flag is set where the raw AST is visible), `assemble-svg-activity.ts` (export of the existing scaler),
`TextBlockExporter.ts` (dash scaling inside `style`), `dispatcher.ts` (3 optional RenderFragment fields),
`tests/unit/core/unwind2-s5-theme-order.test.ts` (pin tighten).

## Render-diff (structural/numeric) before -> after

Before = b2merge base (9e2744253) (first column from this run's measurement); after = HEAD 8d6f5f065.

| row | before | after | state |
|---|---|---|---|
| basetu | 0/0 | 0/0 | already conformant |
| dozudi | 0/0 | 0/0 | already conformant |
| dugovi | 0/0 | 0/0 | already conformant |
| cenoja | 0/4 | 0/0 | fixed (M1) |
| gogosu | 0/4 | 0/0 | fixed (M1) |
| sobobi | 0/4 | 0/0 | fixed (M1) |
| sodoza | 0/4 | 0/0 | fixed (M1) |
| sugaca | 2/0 | 0/0 | fixed (M2) |
| zosuje | 19/180 | 17/11 | M3; rest is colour (see residuals) |
| unknown/rufopi | 4/13 | 2/9 | M3 + M2; rest = labels + cluster fill colour |
| unknown/bamami, bobixe, pugodi | 0/9 | 0/9 | canvas already equal; rest = edge labels + cluster text x |
| unknown/deroxu | 712/2517 (census 743/2505) | 722/1286 | M4: dpi 60 + title at scale; see residuals |
| figika | 0/4 | 0/4 | R1 (edge label) |
| fogexa | 0/4 | 0/4 | R1 |
| radiga, zodare | 0/4 | 0/4 | R1 |
| rekisu | 4/4 | 4/4 | R1 + link colour |
| revusu | 1/4 | 1/4 | R1 + style FontStyle |
| nevuzi | 1/2 | 1/2 | R1 (URL label) |
| kuciku, mavicu | 0/4 | 0/4 | R2 (layout.ts; proven by experiment) |
| kezodo, vimulo | 0/4 | 0/4 | R3 (core leaf-sizing; proven by experiment) |
| cumofi | 7/7 | 7/7 | R4 |
| perapa | 0/13 | 0/13 | R5 (not canvas) |
| banatu | 14/19 | 14/19 | colour + R5 (not canvas) |

layoutParity: EQUAL and dotEqual true on every row probed with `probe2.ts` (fogexa, figika, nevuzi, rekisu, revusu, radiga,
perapa, banatu); native `dot -Tdot` IDENTICAL to dot-engine on the same (D8: no engine blame anywhere in T4). No layout moved.

deroxu structural +10: the 59 `path/@stroke-dasharray` pairs were fixed (TextBlockExporter dash scaling); the +10 is
`text/@textLength` re-pairing against the jar's different text order (95 -> 106), pre-existing pairing; numeric 2517 -> 1286.

## Surveys (npm run svg:survey -- <tree> --out ...; before = base worktree, after = HEAD)

| tree | conformant before -> after | movers |
|---|---|---|
| component | 125 -> 130 | cenoja, gogosu, sobobi, sodoza (structural-match -> conformant, M1); sugaca (diverged -> conformant, M2); zosuje maxDelta 55 -> 15.5 |
| usecase | 38 -> 39 | nipapu-74-roro938 (structural-match -> conformant; M1 `remove`-style single leaf or M3 -- degenerate predicate) |
| unknown | 450 -> 452 | kikudo-03-voto032 (structural-match -> conformant), zakaca-67-paxe321 (diverged -> conformant); maxDelta drops: fimiku 555 -> 0, nunexe 185 -> 0, delagi/gipeda 6 -> 0, dunila 6 -> 5, toxeto/xapuji 25.5 -> 22.5, rufopi unchanged 20 |
| c4 | 2 -> 2 | maxDelta josimu 6 -> 0, vakasu 28 -> 3.6 |
| class 723, object 63, state 78, sequence 0 (survey metric), activity 448 | unchanged | zero movers, zero maxDelta changes |

Zero conformant losses in all 9 engines; zero rises in any maxDelta. Files: /private/tmp/claude-501/codd-T4/<tree>-{before,after}.json.
Mechanism for the unknown/usecase/c4 movers: M3 (style Margin / root Margin) and M2/M4 (chrome); the survey does not name which per row.

## Tests

Final targeted run (`npx vitest run --maxWorkers=4 tests/unit/description tests/unit/core tests/architecture` + oracle:
lgm-t1c-svek-chrome, description.{diff-baseline,golden}.ratchet, {class,object,state,mindmap,salt,wbs,activity,sequence}
.golden.ratchet, layout-parity.ratchet, {class,object,state}-dot-parity, wrapper-parity): **466 test files collected and
passed, 11854 tests passed, 7 expected-fail, 2 skipped**. typecheck clean; eslint + prettier clean on every changed file;
`npm run catalog` regenerated twice (catalog.test green). New tests are end-to-end renderSync pins with jar values from
`scripts/oracle-render.sh` probes (/private/tmp/claude-501/codd-T4/{m,dpi}/).

## Diagnosis artifacts (fixed)

### M1 degenerate predicate counts removed entities (cenoja, gogosu, sobobi, sodoza, usecase/nipapu)
- Mechanism: the jar takes `EntityImageDegenerated` only when the raw diagram has 0 groups, 0 links and exactly 1 leaf;
  `remove` does not reduce those counts. A lone survivor beside removed entities goes through `SvekResult` (+1 px each way).
- Origin: Java `dot/DotData.java:69-71` (`entityFactory.groups().size() == 0 && getLinks().size() == 0 && getLeafs().size() == nb`),
  `svek/GraphvizImageBuilder.java:211-222`, `SvekResult.java:130-135`. Port: `description/renderer.ts` `isDegenerateGeo` re-derived it
  from the surviving geometry (was `renderer.ts:146`); the layout already used the raw AST (`layout.ts:406` -> `degenerateSingleLeaf`).
- Chain: `component foo2` = 87x64 (jar probe); with a removed sibling the jar is 88x65 (jar probe, `/private/tmp/.../v1`).
- Ruled out: sizer (entity rects byte-equal in jar and ours), DOT (single node, layoutParity EQUAL), ceil/trunc rounding.

### M2 background rect belongs to the final canvas (sugaca; rufopi/zosuje structural g/rect swap)
- Mechanism: `UgDiagram.getExporter` runs `addChrome` and only then `TextBlockUtils.addBackcolor`, so the jar's rect covers the
  chrome-composed canvas and is the content group's first child; ours kept the klimt body's own rect (body-sized, after the title).
- Origin: Java `UgDiagram.java:123-135`. Port: `description/renderer.ts` `unwrapKlimtSvg` + `core/assemble-svg.ts` (no DESCRIPTION case).
- Chain: jar `<rect x=0 y=0 width=241 height=232 .../>` before `<g class="title">`; ours `<rect y="63" height="169">` after it.
- Fix reuses the class engine's N48 `documentBackgroundRect`. Ruled out: klimt rect size (correct for the body), draw order inside chrome.

### M3 exporter margin from the style (zosuje, rufopi; usecase/unknown/c4 movers)
- Mechanism: `Builder#calculateMargin` takes the merged `{root, document}` Margin if present, else `getDefaultMargins()` (0,5,5,0).
  exportTo translates by (left, top); `calculateFinalDimension` adds both sides. The description engine hard-wired (0,5,5,0).
- Origin: Java `core/TextBlockExporter.java:510-516,159-176,198-203`, `CucaDiagram.java:741-745`. Port: `renderer-ink-extent.ts` constants,
  `renderer.ts` draw, `document-margin.ts` static table. `Theme.diagramMargin` already existed (build-theme.ts withDocumentStyle).
- Chain: zosuje `document { Margin 10 20 30 40 }` -> jar canvas +55 wide (L40+R20 minus default R5) and +35 tall (T10+B30 minus B5), exactly ours' deltas;
  rufopi `root { Margin 0 }` -> -5/-5.
- Ruled out: chrome Margin (title/caption style Margin is separate), padding.

### M4 chrome-time scale and degenerate chrome block (deroxu)
- Mechanism: the jar draws the chrome-composed block through one scaled UGraphic; ours composed chrome outside klimt
  (unscaled title, canvas unscaled) so `skinparam dpi 60` + title never reached the canvas. A degenerate leaf under chrome also
  handed chrome the margined canvas instead of `EntityImageDegenerated` (leaf + 14), centring the title 2.6 px off.
- Origin: Java `core/TextBlockExporter.java:159-177,204-208`, `svek/EntityImageDegenerated.java:73-75`, `SvgGraphics.java:557-562` (dash).
  Port: `renderer.ts:234-237` scale (cdd-T30) ran only for unchromed geometry; chrome path = `index.ts` render -> `applyExportedChrome`.
- Why deroxu missed `theme.dpi`: it is chromed (title + legend), so `plugin.render` returns a RenderFragment built from an
  already-rendered klimt doc; the scale was applied (or not) inside that doc and dropped by `unwrapKlimtSvg`'s viewBox read.
  It is NOT an unknown-routing or embedded pipeline question: unknown/deroxu routes to DESCRIPTION.
- Chain/jar probes: `title T`+`skinparam dpi 60` = 42.5x127.5 viewBox 42x127, title font-size 8.75; `scale 2`+title = 136x408.
- Fix: chromed geometry renders at factor 1; `assemble-svg.ts#finalizeDescriptionFragment` scales body+canvas (activity scaler),
  against `exportedDimension` (pre-ensureVisible, recorded by `applyDocumentMargin`).

## Residuals with mechanism (not fixed here)

### R1 edge label drawn at the engine centre as raw text (re-slot to T7; core, outside T4's write-set)
Rows: fogexa, figika, radiga, zodare, rekisu, revusu, nevuzi + the g[5..8] label diffs of bamami/bobixe/pugodi/rufopi (+30 more component rows by T0b).
- Mechanism: `core/svek/SvekEdge.ts:294-297` draws `UText.build(text, font)` at `(lp.x+dx, lp.y+dy)` (measured: lp+7), no
  creole (nevuzi: `[[url]]` is drawn literally, 145.7 wide, vs the jar's link text 131.4), no top-left conversion.
  Jar: DOT label table `w=(int)labelText.width` (`SvekEdge.java:504-508`, labelText is creole text + 1px margin each side, so (int)(textW+2));
  draws at the table's minimum corner (`SvekEdge.java:744-746,951-954`, `labelShield` 0).
- Measured jar x - ours x (ours = lp+7): access (textW 40.463) -20, w -4.5, rw (13.731) -6.5, r -2, use (20.962) -10 = -floor(textW+2)/2 + ... i.e. jar x = lp.x - tableW/2 + 7 + 1 (margin). y: jar baseline = (lp.y_flipped - tableH/2) + 7 + 1 + ascent-ish; fogexa 92.111 vs ours 88.5 (3.611 on every 13px label).
- Canvas link: the label's right edge sets the ink maximum, so fogexa 147 vs 142, radiga/zodare 127 vs 119, rekisu 126 vs 103, revusu 90 vs 77,
  nevuzi 272 vs 193, figika 315 vs 269 (font size 58) are all this one defect; fogexa's layout/DOT are equal. DOT table sizes already equal the jar's (nevuzi 133).
- Not a canvas-arithmetic bug; no canvas term needs a change once the label is placed.

### R2 degenerate sizing omits the element font options (kuciku, mavicu) -- file outside write-set: `src/diagrams/description/layout.ts:406`
- Mechanism: the `degenerateSingleLeaf` call passes only componentStyle/actorStyle/minimumWidth; the normal path (`layout-dot-tree.ts:190-206`)
  also passes fontSize, stereotypeFontSize, lineThickness, wrapWidth, guillemet. `<style> node { stereotype { FontSize 20 } }` sizes the
  guillemet block at 14 in layout but the renderer draws it at 20: polygon 7..99 drawn, 81 sized. Jar 112x84 = int(92+19)+1.
- Proof (reverted): adding those five options at the call site makes kuciku and mavicu 0/0 (patch: /private/tmp/claude-501/codd-T4/layout-degenerate-sizing.patch).
- Owner: whoever owns layout.ts next (T5 this batch). Not canvas arithmetic.

### R3 `<latex>` box guard in the sizer (kezodo, vimulo; improves gevozu, sunuju) -- `src/core/svek/image/leaf-sizing.ts:182` (core, outside write-set)
- Mechanism: the default branch routes a `<latex>` display through `measureLegacyBoxFallback` (40x44), while the renderer draws the real
  KaTeX image box (211x58 at dpi 192 -> 422x116, image 342x56, byte-identical dims to the jar's Batik image). Sizer/renderer split.
- Proof (reverted): disabling the guard: kezodo 0/4 -> 0/0, vimulo 0/4 -> 0/0, gevozu 1/164 -> 2/68, sunuju 1/164 -> 2/68, sapofa unchanged (0/0).
  Consequence if applied: `leaf-sizing-legacy-fallback.ts` and its tests in `leaf-sizing-widen-routing.test.ts:162-215` become dead and are to be deleted in that commit.
- The latex image content is the permanent KaTeX divergence; the BOX size is not (jar and ours agree). Needs D5 guards.

### R4 cumofi (`skinparam handwritten true` + `scale 3`)
- Not canvas arithmetic: (a) the jar draws a warning block ("Please use '!option handwritten true' to enable handwritten", font-size 30 monospace) at the top
  (`CommandSkinParam.java:92-93` `diagram.addWarning`), the description engine has no warning plumbing (activity/mindmap/salt/wbs have it); this is the
  +32x+20 px; (b) the jar wraps the drawing in `UGraphicHandwritten` (`TextBlockExporter.java:169-170`), polygons/paths with wobble; ours is plain rects.
  `core/klimt/drawing/hand/UGraphicHandwritten.ts` exists.

### R5 perapa / banatu (port clusters) -- not a canvas term
- Canvas equal. perapa: both cluster rects have equal width/y and x shifted (+5.793, +8.75) with the same shift on their titles; layoutParity EQUAL,
  dotEqual true. Port-cluster frontier x (T2/T5 territory: `frontier-cluster-bbox.ts`, `renderer-cluster.ts`); mechanism unexplained: ruled out canvas, DOT, native vs engine.
  banatu: 14 structural are colour (`#808080/#00F/#F00` stereotype/inline colours dropped) + the same family; unexplained beyond colours.

### R6 deroxu remainder
- `skinparam component { Shadowing<<package>> true }` (stereotype-scoped shadowing) is not mapped: jar has 17 `filter=` shadows and a `<filter>` def, ours 0
  (`skinparam shadowing true` and `component { Shadowing true }` work: probe, 2 filters). Shadow ink adds the 6px width/height (jar canvas 3775x2153.3
  unscaled vs ours 3769x2147) and halves the title x offset. Java `EntityImageDescription.java:170` `styleTitle.getShadowing()`.
  Port: skinparam-to-style for the stereotype-qualified key (core skinparam handlers) -- colour/style track.
- The other deroxu diffs (`@id`, rect fill 117, childCount 73, link colours) are the colour/childCount tracks.

### Other residuals on named rows
- zosuje (after M3): cluster `group { BackgroundColor bisque ... }` style fill (`path @fill #FFE4C4 vs none`), `#00BFFF` link colours, italic: colour/style track.
- rufopi: cluster fill `#DFD` (root BackgroundColor reaching a cluster), g[2]/text[2] x +7.044 (cluster 2nd title line "file\n", bamami/bobixe/pugodi identical): unexplained, not canvas.
- rekisu: link `#red;text:blue` inline colours and `actor #77F;text:red` -- colour track. revusu: `FontStyle italic` through `<style> actor`.
- The task's (a) residual "x Δ3, caption y Δ5.9" is no longer present after T2/T4 (canvas equal; only labels and the cluster-title x above remain).

## Boundaries honoured
No edits to layout.ts, renderer-cluster.ts, SvekEdge.ts, leaf-sizing.ts (experiments only, restored byte-for-byte; `git status` clean). No push, no stash, no
Serena edit tools, no acceptance signed, no ratchet/baseline/oracle/engine edits. The temporary base worktree (codd-T4-base) was removed with `git worktree remove`.
