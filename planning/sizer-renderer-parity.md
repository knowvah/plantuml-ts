# Sizer ↔ renderer parity — description engine

**Mission:** `description-leaf-sizing-audit`, task T3. **Status:** audit only —
no `src/` change. Every `GAP` row below is a Batch-4 work item, not something
fixed here (ADR-4).

## Why this document exists

The description engine has two paths that must agree on geometry but are wired
independently:

- **SIZER** — `measureLeafNode` (`src/diagrams/description/leaf-sizing.ts:83`)
  decides how big a node's DOT box is. It can only see settings threaded to it
  through `ClassifyCtx` (`layout.ts:89`, built at `layout.ts:427`) →
  `BoxSizingOpts` (`leaf-sizing-consts.ts:21`, populated at
  `layout-dot-tree.ts:171-182`).
- **RENDERER** — `renderer-entity.ts` / `renderer-cluster.ts` /
  `EntityImageDescription*.ts` draws the ink inside that box. It reads `Theme`
  **directly**.

That asymmetry is the bug factory: a feature lands on the renderer (one line,
`theme` is already in scope) and the sizer never learns about it. See
`plans/description-leaf-sizing-audit/diagrams/component-map.md`.

## The table

`verdict` ∈ `threaded` | `GAP` | `size-neutral (<reason>)`. The `size-neutral`
reasons are copied verbatim into T5's allow-list — they are written as the
justification a future reader needs, not as a label.

### Per-element resolvers (all 10 `resolveElement*`)

| setting | resolver / source | renderer call site | sizer call site | verdict |
|---|---|---|---|---|
| element `BackgroundColor` / `LineColor` / `FontColor` (Paint) | `resolveElementPaint` — `src/core/theme-element-resolve.ts:21` | `renderer-entity.ts:196`, `renderer-entity.ts:198`, `renderer-entity.ts:345`, `renderer-entity.ts:346`; `src/core/usymbol-shapes.ts:73,74,81,94,95,108,123,124,155,156` | none | `size-neutral (colour only — returns a Paint consumed as an SVG fill/stroke; no caller multiplies it into a width or height, and it never enters calculateDimension. Fill and stroke COLOUR cannot move a DOT box; stroke WIDTH can, and that is resolveElementLineThickness's row, not this one.)` |
| element `FontSize` / stereotype `FontSize` | `resolveElementFontSize` — `theme-element-resolve.ts:54` | `renderer-symbol.ts:141` (via `textFont`, called `renderer-entity.ts:185,186`) | `layout.ts:432` (`ClassifyCtx.fontSizeFor`) → `layout-dot-tree.ts:179` → `BoxSizingOpts.fontSize` → `leaf-sizing.ts:92` | `threaded` |
| element `Shadowing` | `resolveElementShadowing` — `theme-element-resolve.ts:73` | `renderer-entity.ts:212` (`deltaShadow`), `renderer-cluster.ts:119` (`shadowing`) | none | `GAP` — jar-proven size-affecting on the actor family (see Proofs) |
| element `LineThickness` | `resolveElementLineThickness` — `theme-element-resolve.ts:89` | `renderer-entity.ts:213` (via `overrideStroke`, `renderer-entity.ts:164`) | none | `GAP` — jar-proven size-affecting on the actor family (see Proofs) |
| element `MinimumWidth` / `skinparam minClassWidth` | `resolveElementMinimumWidth` — `theme-element-resolve.ts:104` | none | `layout.ts:431` (`ClassifyCtx.minimumWidthFor`) + `layout.ts:462` (degenerate path) → `layout-dot-tree.ts:175` → `leaf-sizing.ts:334`, `leaf-sizing-folder.ts:77` | `threaded` (sizer-only **by design** — the renderer draws into the box DOT already assigned, so it has nothing to floor; the absent renderer call site is correct, not a reverse gap) |
| class-family element `BackgroundColor` | `resolveElementBackground` — `src/diagrams/class/renderer-classifier-colors.ts:49` | `renderer-classifier-colors.ts:124` (`classifierFill`) | none | `size-neutral (colour only — returns an SVG hex fill string for the classifier body rect; the class engine's own sizing never reads it. Also a DIFFERENT engine: no description-diagram path reaches it.)` |
| class-family element `FontColor` | `resolveElementFont` — `renderer-classifier-colors.ts:62` | `src/diagrams/class/renderer-classifier-rows.ts:150` | none | `size-neutral (colour only — this is font COLOUR, not font SIZE; the size override is resolveElementFontSize's separate row. A text fill cannot change a glyph advance.)` |
| class-family element `header { BackgroundColor }` | `resolveElementHeaderBackground` — `renderer-classifier-colors.ts:74` | `src/diagrams/class/renderer-classifier-box.ts:257` | none | `size-neutral (colour only — fills the already-laid-out header band rect; the band's height comes from the header text block, not from whether it is tinted.)` |
| class-family element `header { FontColor }` | `resolveElementHeaderFont` — `renderer-classifier-colors.ts:83` | `renderer-classifier-rows.ts:149` | none | `size-neutral (colour only — name-row text fill; same reasoning as resolveElementFont.)` |
| `<style>` bucket-selector normalization | `resolveElementBucketSelector` — `src/core/style-map-element.ts:69` | none (called at `style-map-element.ts:96`) | none | `size-neutral (parse-time selector normalization — maps a bare/qualified <style> selector onto an SName bucket while the Theme is being BUILT, upstream of both paths. It produces no geometry itself; whatever it routes into a bucket is then audited by that bucket's own row above.)` |

### Non-resolver per-diagram settings

| setting | resolver / source | renderer call site | sizer call site | verdict |
|---|---|---|---|---|
| `skinparam wrapWidth` | `theme.wrapWidth` — `src/core/theme.ts:112` | `renderer-entity.ts:218` (all symbols) → `EntityImageDescriptionDelegates.ts:51` → `buildWrappedLines`; note path `renderer-entity.ts:295` | `layout.ts:433` → `layout-dot-tree.ts:176` → `BoxSizingOpts.wrapWidth` → `leaf-sizing.ts:313` — **`measureBox` ONLY** | `GAP` — partially threaded; jar-proven size-affecting on the 5 sizing paths that never receive it (see Proofs) |
| `skinparam guillemet` | `theme.colors.graph.guillemetStart/End` | `renderer-entity.ts:219-222`, `renderer-entity.ts:296-297`; applied `EntityImageDescriptionSupport.ts:410` (`manageGuillemet`) | `layout.ts:434-437` → `layout-dot-tree.ts:177` → `BoxSizingOpts.guillemet` → `leaf-sizing.ts:314` — **`measureBox` ONLY** | `GAP` — partially threaded; same 5 sizing paths as `wrapWidth`, same mechanism (`maxLineWidth`'s `guillemet` param at `leaf-sizing-text.ts:197` is left `undefined` by every non-`measureBox` caller). Inferred from the shared code path, not separately probed. |
| `skinparam componentStyle` | `theme.componentStyle` — `theme.ts:32` | `renderer-entity.ts:192` (`mapComponentStyle`), `renderer-symbol.ts:80` | `layout.ts:430` → `layout-dot-tree.ts:174` → `BoxSizingOpts.componentStyle` → `leaf-sizing.ts:309` (`boxIcon`) | `threaded` |
| sprite registry (declared dims) | `ast.sprites` → `spriteDimsLookupFor`, `layout.ts:439` | `renderer-entity.ts:226` (`makeAtomImageResolverFor`) | `layout-dot-tree.ts:181` → `measureLeafNode`'s 5th param → `maxLineWidth` / `atomHeightBonus` / `footprintBoxes` | `threaded` |
| sprite registry (INK extents) | `spriteInkDimsLookupFor`, `layout.ts:440` | none (renderer draws the declared box) | `layout-dot-tree.ts:178` → `BoxSizingOpts.inkSprites` — **declared and assigned, never read** | `GAP` — dead thread; `measureUsecase` (`leaf-sizing.ts:262`) fits its footprint with the DECLARED-dims `sprites`, so S1L-k's stated intent ("fit to drawn-path bounds, not declared sprite boxes") is not realized |
| `skinparam tabSize` | `theme.tabSize` — `theme.ts:117` | none in this engine (class engine only: `src/diagrams/class/class-object-map-sizing.ts:153`) | none | `size-neutral (jar-probed on this engine: a real TAB in a component display measures identically at tabSize default/4/1 — the description leaf path does not expand tabs at all. It IS size-affecting in the CLASS engine, so this reason is scoped to the description engine and must not be generalized.)` |

### Additional settings surveyed (not required by the contract, same schema)

| setting | resolver / source | renderer call site | sizer call site | verdict |
|---|---|---|---|---|
| diagram-wide `Shadowing` (`root`/`element`) | `theme.shadowing` — `theme.ts:83`, second tier of `resolveElementShadowing` | same as `resolveElementShadowing` | none | `GAP` — same mechanism and same Batch-4 fix as the per-element tier; jar-proven via bare `root { Shadowing 6 }` |
| `skinparam fixCircleLabelOverlapping` | `theme.fixCircleLabelOverlapping` | `renderer-entity.ts:225` | `layout.ts:473` (into `runLayout`, not `BoxSizingOpts`) | `threaded` (via a second channel — worth knowing that `BoxSizingOpts` is not the only route) |
| `skinparam actorStyle` | no `Theme` field exists | hardcoded `ActorStyle.STICKMAN`, `renderer-symbol.ts:26` | hardcoded stickman constants, `leaf-sizing-consts.ts:55,58` | `size-neutral (both paths hardcode STICKMAN identically, so they cannot drift. This is an unimplemented FEATURE — hollow/awesome would change the drawing's size on both sides — not a parity defect. Do not allow-list it as "settled".)` |
| `skinparam roundCorner` | parsed into the accumulator (`skinparam-accumulator.ts:102`) but no `Theme` field | hardcoded `ENTITY_ROUND_CORNER = 5.0`, `renderer-entity.ts:63`; `NON_FOLDER_ROUND_CORNER`, `renderer-cluster.ts:129` | none | `size-neutral (corner radius is drawn INSIDE the rect's own bounds — a rounded corner never changes the bounding box. Unreachable anyway: parsed but never surfaced on Theme.)` |

**Counts:** 20 rows — 5 `threaded`, 6 `GAP`, 9 `size-neutral`.
Contract-required subset (16 rows): 4 `threaded`, 5 `GAP`, 7 `size-neutral`.

## Proofs

Jar probes with the pinned oracle
(`java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> -jar
oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <f.puml>`). Every probe used TWO
elements (a single-entity diagram emits no DOT at all —
`isDegeneratedWithFewEntities`) and isolated ONE styled element (DOT node order
≠ declaration order). Dimensions below are DOT inches; ×72 for px.

### `Shadowing` — GAP, proven

`actor A` + `component Beta`, one edge:

| diagram | width | height |
|---|---|---|
| baseline | 0.375000 (27px) | 1.027778 (74px) |
| `<style> actor { Shadowing 6 }` | 0.375000 | **1.111111 (80px)** |
| `<style> root { Shadowing 6 }` | 0.375000 | **1.111111 (80px)** |

Height grows by exactly the shadow delta; width does not. Mechanism:
`ActorStickMan.getPreferredHeight` folds `deltaShadow` in — which
`leaf-sizing-consts.ts:56-58` already documents ("59 + 1 (default thickness 0.5,
**no shadow**)") without ever wiring the non-default case. Confirmed
size-neutral on `component`, `usecase`, `control`, `entity` (identical dims at
`Shadowing 4`/`6`), so the fix is scoped to the actor family, not global.

### `LineThickness` — GAP, proven

Same shape:

| diagram | width | height |
|---|---|---|
| baseline | 0.375000 (27px) | 1.027778 (74px) |
| `<style> actor { LineThickness 6 }` | **0.527778 (38px)** | **1.180556 (85px)** |

38 = 26 + 2×6 and 85 = 59 + 2×6 + 14(label) — i.e. `ActorStickMan`'s
`+ 2×thickness` term, again already documented at `leaf-sizing-consts.ts:53-58`
for the 0.5 default only. Confirmed size-neutral on `component`, `usecase`,
`control`, `entity`, `interface`.

### `wrapWidth` — GAP, proven

`skinparam wrapWidth 60`, display `"Alpha Beta Gamma Delta Epsilon"`:

| leaf kind | baseline w×h | wrapped w×h | sizer path | receives `wrapWidth`? |
|---|---|---|---|---|
| `component` | 3.237674 × 0.611111 | 1.245833 × 1.388889 | `measureBox` | yes |
| `folder` | 3.098785 × 0.722222 | 1.106944 × 1.500000 | `measureFolderLeaf` | **no** |
| `package` | 3.098785 × 0.708333 | 1.106944 × 1.486111 | `measureFolderLeaf` | **no** |
| `note` | 2.782205 × 0.319444 | 0.932639 × 1.041667 | `measureNote` | **no** |
| `actor` | 2.682118 × 1.027778 | 0.690278 × 1.805556 | `measureActor` | **no** |
| `entity` | 2.682118 × 0.638889 | 0.690278 × 1.416667 | `measureSimpleSymbol` | **no** |
| `usecase` | 2.936222 × 0.653911 | 1.427369 × 1.158562 | `measureUsecase` | **no** |

The renderer applies `wrapWidth` to **every** symbol (`buildEntityParams`,
`renderer-entity.ts:218`, is symbol-agnostic). The sizer applies it in
`measureBox` alone, because `measureTextBlock` — the only function that calls
`getSplitted` — has exactly one caller (`leaf-sizing.ts:311`). Six of the seven
leaf shapes measure unwrapped and render wrapped.

`guillemet` rides the identical seam: `maxLineWidth`'s `guillemet` parameter
(`leaf-sizing-text.ts:197`) is supplied only from `measureTextBlock`. Same fix,
same five call sites; recorded as inferred rather than probed.

### `inkSprites` — GAP, by inspection

`grep -rn inkSprites src/` returns exactly four hits: the `ClassifyCtx` field
declaration (`layout.ts:127`), its construction (`layout.ts:440`), the
`BoxSizingOpts` field declaration (`leaf-sizing-consts.ts:38`), and the
assignment (`layout-dot-tree.ts:178`). **No read.** `measureUsecase` passes
`measureLeafNode`'s 5th parameter — the declared-dims `sprites` — into
`footprintBoxes` (`leaf-sizing.ts:262`). Whatever S1L-k intended, the ink lookup
is currently inert.

## What the ADR-3 fitness function cannot catch

ADR-3 enforces parity with a fitness function (task T5). Its scope must be
stated honestly in its own failure message, because of this:

> **Of the four historical instances of this bug, only ONE was
> resolver-shaped.**

| instance | resolver-shaped? | would a `resolveElement*` grep guard have caught it? |
|---|---|---|
| per-element `FontSize` | yes (`resolveElementFontSize`) | **yes** |
| `skinparam wrapWidth` | no — a plain `theme.wrapWidth` field read | no |
| creole lexer (`parseCreole` vs `buildLineAtoms`) | no — a shared-component divergence, no setting involved at all | no |
| use-case ellipse fit (closed form vs `Footprint` + SEC) | no — an algorithm divergence, no setting involved at all | no |

A guard that greps renderer modules for `resolveElement*` and demands a matching
sizer call therefore covers **1 of 4** known instances — 25% of the historical
evidence. Three of the four gaps this mission exists to prevent would have
sailed past it green.

Two of this audit's own six `GAP` findings confirm the limit from the other
direction: `wrapWidth`-on-the-folder-path and the dead `inkSprites` thread are
both cases where the resolver/field **is** threaded into `BoxSizingOpts` — the
grep is satisfied — and the value is still not used by five of seven sizing
paths. A resolver-presence test is a *reachability* check, not a *use* check.

**Consequence for T5:** ship the guard, but do not let its green state be read
as proof of parity. Concretely — name it for what it measures (e.g.
"resolver-reachability", not "sizer-renderer-parity"), and put the 1-of-4 figure
in the assertion message so the next reader sizes their trust correctly.
Presenting the guard as proof of parity would be worse than not having it: it
converts an unknown risk into a falsely-retired one.

The complementary check that WOULD have caught the other three is behavioural,
not structural: render a fixture twice (setting on / setting off) and assert
that the sizer's box delta matches the renderer's ink delta. That is a
measurement harness (T4's `scripts/measure-description-size-deltas.ts`
territory), not a grep.

## Reusing this for another engine

The split audited above is not specific to the description engine. Any engine
with an independently-wired measure path and draw path has it. To repeat this
audit elsewhere:

1. **Find the two entry points.** One function that returns a `Dim` for a node,
   one that emits its ink. In this engine: `measureLeafNode` and
   `buildEntityParams` → `EntityImageDescription`.
2. **Find the sizer's ONLY channel.** Whatever struct carries settings into the
   measure path (`ClassifyCtx` → `BoxSizingOpts` here). Anything not in that
   struct is invisible to the sizer *by construction* — that is the candidate
   list before you read a single line of the renderer.
3. **Diff the theme reads.** `grep` the renderer modules for `theme.` /
   `resolve*` and subtract what the channel carries. The remainder is the
   suspect set.
4. **Probe, don't reason.** For each suspect, render the same two-element
   diagram with and without the setting and compare DOT node dims. Two traps:
   DOT node order ≠ declaration order (isolate ONE element per diagram), and a
   single-entity diagram emits no DOT at all.
5. **Check per-shape coverage, not just presence.** The `wrapWidth` finding
   above is the reason: the setting reached the struct and was still ignored by
   six of seven shapes. Enumerate the sizing paths and test each.

### Known open instance in another engine

The **files diagram** carries the same bug class, still unfixed:

> `src/diagrams/files/layout.ts:28-35` measures note text at **14pt** while
> `src/diagrams/files/renderer.ts:9` renders it at **12pt**. Note boxes come out
> ~17% wider than necessary.
> — `planning/mission-guide.md:43`

That is exactly the description engine's per-element-`FontSize` instance in
another engine: the draw path picked a font, the measure path did not follow.
It is a smaller version of the same fix and a natural first target when this
procedure is next applied.
