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
| `skinparam guillemet` | `theme.colors.graph.guillemetStart/End` | `renderer-entity.ts:219-222`, `renderer-entity.ts:296-297`; applied `EntityImageDescriptionSupport.ts:410` (`manageGuillemet`) | `layout.ts:434-437` → `layout-dot-tree.ts:177` → `BoxSizingOpts.guillemet` → `leaf-sizing.ts:314` — **`measureBox` ONLY** | `GAP` — partially threaded; same 5 sizing paths as `wrapWidth`, same mechanism (`maxLineWidth`'s `guillemet` param at `leaf-sizing-text.ts:197` is left `undefined` by every non-`measureBox` caller). **T4: no longer inferred — jar- AND port-probed, both sides measured** (see Proofs). `entity` is invariant at 0.843403in across `guillemet` on/off while the jar moves 0.843403 → 1.084028 (+17.325px); `component` tracks the jar exactly in both states. |
| `skinparam componentStyle` | `theme.componentStyle` — `theme.ts:32` | `renderer-entity.ts:192` (`mapComponentStyle`), `renderer-symbol.ts:80` | `layout.ts:430` → `layout-dot-tree.ts:174` → `BoxSizingOpts.componentStyle` → `leaf-sizing.ts:309` (`boxIcon`) | `threaded` |
| sprite registry (declared dims) | `ast.sprites` → `spriteDimsLookupFor`, `layout.ts:439` | `renderer-entity.ts:226` (`makeAtomImageResolverFor`) | `layout-dot-tree.ts:181` → `measureLeafNode`'s 5th param → `maxLineWidth` / `atomHeightBonus` / `footprintBoxes` | `threaded` |
| sprite registry (INK extents) | `spriteInkDimsLookupFor`, `layout.ts:440` | none (renderer draws the declared box) | `layout-dot-tree.ts:178` → `BoxSizingOpts.inkSprites` — **declared and assigned, never read** | **`size-neutral` (dead DUPLICATE channel — verdict CHANGED by T4, was `GAP`).** The field is genuinely unread, but the FEATURE it was meant to deliver is already delivered through the other channel: `spriteDimsLookupFor` (`sprite-commands.ts:99-106`) returns `inkX/inkY/inkWidth/inkHeight` alongside the declared box for every `SpriteSvg`, and `inlineFootprintBox` (`leaf-sizing-text.ts:355-370`) reads exactly those. So `measureUsecase`'s footprint IS ink-fit. Port-measured identical to the jar on an ink≠declared sprite (see Proofs). Batch-4 disposition is a **delete-the-dead-thread chore**, not a sizing fix. |
| `skinparam tabSize` | `theme.tabSize` — `theme.ts:117` | none in this engine (class engine only: `src/diagrams/class/class-object-map-sizing.ts:153`) | none | `size-neutral (jar-probed on this engine: a real TAB in a component display measures identically at tabSize default/4/1 — the description leaf path does not expand tabs at all. It IS size-affecting in the CLASS engine, so this reason is scoped to the description engine and must not be generalized.)` |

### Additional settings surveyed (not required by the contract, same schema)

| setting | resolver / source | renderer call site | sizer call site | verdict |
|---|---|---|---|---|
| diagram-wide `Shadowing` (`root`/`element`) | `theme.shadowing` — `theme.ts:83`, second tier of `resolveElementShadowing` | same as `resolveElementShadowing` | none | `GAP` — same mechanism and same Batch-4 fix as the per-element tier; jar-proven via bare `root { Shadowing 6 }` |
| `skinparam fixCircleLabelOverlapping` | `theme.fixCircleLabelOverlapping` | `renderer-entity.ts:225` | `layout.ts:473` (into `runLayout`, not `BoxSizingOpts`) | `threaded` (via a second channel — worth knowing that `BoxSizingOpts` is not the only route) |
| `skinparam actorStyle` | no `Theme` field exists | hardcoded `ActorStyle.STICKMAN`, `renderer-symbol.ts:26` | hardcoded stickman constants, `leaf-sizing-consts.ts:55,58` | **`GAP` (FIDELITY, not parity — verdict CHANGED by T4, was `size-neutral`).** The parity reasoning still holds — both paths hardcode STICKMAN identically and cannot drift — but the premise that made it `size-neutral` (that nothing observable depends on the setting) is false: **the jar honours `skinparam actorStyle` and its node dimensions change.** Measured awesome `0.763889×1.041667`, hollow `0.444792×0.652778`, stickman `0.444792×1.027778`; our port returns the stickman value for all three (see Proofs). Recording this as `size-neutral` would have allow-listed a 22.98px width / 27px height error. |
| `skinparam roundCorner` | parsed into the accumulator (`skinparam-accumulator.ts:102`) but no `Theme` field | hardcoded `ENTITY_ROUND_CORNER = 5.0`, `renderer-entity.ts:63`; `NON_FOLDER_ROUND_CORNER`, `renderer-cluster.ts:129` | none | `size-neutral (corner radius is drawn INSIDE the rect's own bounds — a rounded corner never changes the bounding box. Unreachable anyway: parsed but never surfaced on Theme.)` |

**Counts:** 20 rows — 5 `threaded`, 6 `GAP`, 9 `size-neutral`.
Contract-required subset (16 rows): 4 `threaded`, 4 `GAP`, 8 `size-neutral`.

**T4 amended the MEMBERSHIP without changing the totals.** Two verdicts swapped
places: `inkSprites` `GAP` → `size-neutral`, `skinparam actorStyle`
`size-neutral` → `GAP`. The totals are coincidentally unchanged; the required-16
subset moved 5/7 → 4/8 because `inkSprites` is required and `actorStyle` is not.
Read the membership, not the totals. The current `GAP` set is: per-element
`Shadowing`, per-element `LineThickness`, diagram-wide `Shadowing`,
`skinparam wrapWidth`, `skinparam guillemet`, `skinparam actorStyle`.

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
same five call sites. T3 recorded this as inferred; T4 probed it — see below.

### `guillemet` — GAP, proven (T4; was inferred)

`skinparam guillemet` rewrites `<<x>>` → `«x»` in DISPLAY TEXT, not only in
stereotypes (`CreoleParser.java:175`; ported at `src/core/text/Guillemet.ts`),
so it is a plain text-width lever. Probe: display `"aa <<zz>> bb"` on one
gapped leaf (`entity` → `measureSimpleSymbol`) and one threaded leaf
(`component` → `measureBox`), each with a throwaway `rectangle "qq"`.

```sh
java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<d> \
     -jar oracle/dist/plantuml-oracle.jar -tsvg -o <d> g-ent-{on,off}.puml
# "off" adds `skinparam guillemet false` as the first line.
```

Port side measured through the same deterministic metrics
(`WidthTableMeasurer` + `setLayoutInputObserver`, the harness
`scripts/visual-qa-dot.ts:26-30` uses), so the two columns are comparable.

| leaf | sizer path | jar, guillemet on | jar, off | ours, on | ours, off |
|---|---|---|---|---|---|
| `entity` | `measureSimpleSymbol` | 0.843403 | **1.084028** | 0.843403 | **0.843403** |
| `component` | `measureBox` | 1.398958 | 1.639583 | 1.398958 | 1.639583 |

Widths in DOT inches; heights were unchanged everywhere (`entity` 0.638889,
`component` 0.611111). The jar moves **+0.240625in = +17.325px** (`«zz»` 4
chars → `<<zz>>` 6 chars) on BOTH leaves. `component` tracks it exactly.
`entity` does not move at all — it measures the guillemet form unconditionally,
so it is correct only at the default and wrong by 17.325px whenever a user sets
`guillemet false`. **Verdict `GAP` upheld, and the same 5 paths as `wrapWidth`
are implicated by the same one-caller mechanism.**

### `inkSprites` — verdict CHANGED to size-neutral (T4)

T3's grep finding stands — `grep -rn inkSprites src/` is four hits (declaration
`layout.ts:127`, construction `layout.ts:440`, `BoxSizingOpts` declaration
`leaf-sizing-consts.ts:38`, assignment `layout-dot-tree.ts:178`) and **no
read**. T3's *consequence* does not: "S1L-k's stated intent is not realized" is
false. The ink reaches the footprint through the OTHER lookup.

`measureUsecase` passes `measureLeafNode`'s 5th parameter — `ctx.sprites`, the
`spriteDimsLookupFor` view — into `footprintBoxes` (`leaf-sizing.ts:262`), and
that view already carries the ink fields for an SVG sprite
(`sprite-commands.ts:99-106`: `inkX`, `inkY`, `inkWidth`, `inkHeight` beside
`width`/`height`). `inlineFootprintBox` (`leaf-sizing-text.ts:355-370`) reads
them and falls back to the declared box only when they are absent.
`spriteInkDimsLookupFor` / `ctx.inkSprites` is therefore a superseded parallel
channel, not a missing feature.

Measured, on two SVG sprites with IDENTICAL declared boxes and deliberately
different ink (`bar` inks 40×10 of its 40×40 declaration; `full` inks the whole
40×40):

```
sprite $bar  <svg width="40" height="40"><path d="M0 0 L40 0 L40 10 L0 10 Z"/></svg>
sprite $full <svg width="40" height="40"><path d="M0 0 L40 0 L40 40 L0 40 Z"/></svg>
usecase "<$bar>" as N1     (then: full; then the same two as `rectangle`)
rectangle "qq" as Z9
N1 --> Z9
```

| leaf | sprite | jar w×h | ours w×h |
|---|---|---|---|
| `usecase` | bar (ink 40×10) | 0.710157 × 0.584792 | **0.710157 × 0.584792** |
| `usecase` | full (ink 40×40) | 1.041066 × 0.849519 | **1.041066 × 0.849519** |
| `rectangle` | bar | 0.876068 × 0.876068 | 0.876068 × 0.876068 |
| `rectangle` | full | 0.876068 × 0.876068 | 0.876068 × 0.876068 |

Two facts at once. (1) The ink distinction is REAL and large: the same declared
box yields use-case dims 0.330909in (23.83px) apart in width and 0.264727in
(19.06px) in height, while the `rectangle` path — which correctly uses the
declared box — cannot tell the sprites apart. (2) **Our port reproduces every
one of the four jar numbers exactly.** There is nothing for Batch 4 to fix here
beyond deleting the unread field.

### `skinparam actorStyle` — verdict CHANGED to GAP (T4)

T3 assigned `size-neutral` on the reasoning that both paths hardcode STICKMAN
and so cannot drift. The parity half of that is right; the size half is wrong,
because the jar honours the setting:

```sh
# a-{stickman,awesome,hollow}.puml: `skinparam actorStyle <s>` + actor "Hello"
#   + throwaway `rectangle "qq"` + one edge. a-none.puml omits the skinparam.
java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<d> \
     -jar oracle/dist/plantuml-oracle.jar -tsvg -o <d> a-awesome.puml
```

| `actorStyle` | jar w×h (in) | jar w×h (px) | ours w×h (in) | our error |
|---|---|---|---|---|
| *(unset)* | 0.444792 × 1.027778 | 32.025 × 74.0 | 0.444792 × 1.027778 | — |
| `stickman` | 0.444792 × 1.027778 | 32.025 × 74.0 | 0.444792 × 1.027778 | — |
| `awesome` | 0.763889 × 1.041667 | 55.0 × 75.0 | 0.444792 × 1.027778 | **−22.975 w, −1.0 h** |
| `hollow` | 0.444792 × 0.652778 | 32.025 × 47.0 | 0.444792 × 1.027778 | **+27.0 h** |

These reproduce T2's independently-obtained numbers exactly (`ACTOR_AWESOME`
55×61 and `ACTOR_HOLLOW` 26×33 drawings under K2 composition,
`J/skin/ActorAwesome.java:98-104`, `J/skin/ActorHollow.java:105-111`) — the two
Batch-1 findings are the same defect seen from the resolver side and the symbol
side. Note `hollow`'s width is unchanged only because the 32.025px label is
wider than its 26px drawing; a shorter label would expose a width error too.

**Batch 4: this is TWO pieces of work, not one wire-up.** "Wire `actorStyle` →
the existing ported classes" is not available, because the classes do not
exist: `src/core/skin/` holds only `ActorStickMan.ts` and `ActorStyle.ts`, and
`actorStyleGetTextBlock` throws for `AWESOME`/`HOLLOW` by deliberate deferral
(`ActorStyle.ts:21-24` says so in its own doc comment). So (a) port
`ActorAwesome.ts` + `ActorHollow.ts` with their `getPreferredWidth/Height`
geometry, then (b) add the `skinparam actorStyle` accessor + `Theme` field
(none exists today — `grep -rni actorstyle src/` finds only doc comments) and
consume it from BOTH `renderer-symbol.ts:26` and `leaf-sizing-consts.ts:55,58`.
Doing (b) alone changes nothing; doing (a) alone is unreachable.

### `Footprint` and the USECASE_BUSINESS pad — T2's open question, answered

T2 asked whether the closed form it verified by hand (`+19.8`, not `+14`, from
`withMargin(tmp, 7, 0)` refitting `alpha`) transfers to our port, which fits
REAL points via `footprintBoxes` rather than a bounding box.

**It transfers, but NOT for the reason the question assumed, and not for free.**
The pad is not "collected as ink" — no glyph or path is drawn in it. It reaches
the point set as a **`UEmpty` shape**: `TextBlockMarged.drawU`
(`J/klimt/shape/TextBlockMarged.java:80-88`) draws `UEmpty.create(dim)` at the
FULL marged dimension before translating the inner block, and
`Footprint$MyUGraphic.drawEmpty` (`J/svek/image/Footprint.java:163-166`)
collects its two opposite corners like any other shape. `drawText`
(`Footprint.java:131-139`) contributes only the UText's own string width, so
without the `UEmpty` the pad would be invisible to the fit.

Our `footprintBoxes` (`leaf-sizing-text.ts:308-345`) emits a box for text runs
and inline atoms only. **It has no `UEmpty` concept at all.** Measured by
driving our own `footprintBoxes` + `containingEllipse` directly:

| point set fed to `containingEllipse` | result w×h (px) | vs jar |
|---|---|---|
| A — today (`textW` 32.025, α 0.437) | 51.290 × 25.799 | = jar PLAIN (0.712364 × 0.358319) ✓ |
| B — widen `textW` to 46.025 only (α 0.304) | **62.071 × 23.056** | jar BUSINESS is 71.089 × 25.799 ✗ |
| C — widen `textW` **and** push the block box `(0,0,46.025×14)` | **71.089 × 25.799** | = jar BUSINESS (0.987350 × 0.358319) ✓ |

Jar confirmation of the two targets, same probe form (`usecase "Hello"` vs
`usecase/ "Hello"` + throwaway rectangle): plain `0.712364 × 0.358319`,
business `0.987350 × 0.358319`; our port returns the plain value for both, i.e.
business is short by 0.274986in = 19.80px.

**Consequence for Batch 4:** a fix that only widens the business use-case's
`textW` by `2 × 7` lands on row B — wrong by 9.0px in width and 2.7px in height,
and wrong in a way that would look like a fitted-constant problem rather than a
missing shape. The fix must also make `footprintBoxes` emit the marged block's
own box. That is the general `UEmpty` rule, not a use-case special case, so it
will also matter for the `withMargin(…,1,0)` stereotype block
(`EntityImageDescription.java:198-201`) — check that case before closing.

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
