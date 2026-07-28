# USymbol composition audit (description leaves)

**Mission:** `description-leaf-sizing-audit`, task T2. **Status:** complete,
audit only — nothing here is fixed (ADR-4: findings are filed, `MISMATCH`
rows become the Batch-4 task list).

## Why this document exists

Four separate defects last session had the same shape: the symbol
**composes** differently upstream, and we had modelled it as "text in a
bordered box with a margin". Each was found the expensive way — one failing
fixture at a time (interface/circle, folder/package, usecase, and the
control/entity/boundary trio). `USymbols.java` declares **36** symbols;
`SYMBOL_BOX_MARGIN` had ~21 entries. This table reads all 36 out of the Java
in one pass so no fifth one has to be discovered from a fixture.

**Every composition cell below cites a Java `file:line`.** No cell was filled
in from our own source. Java paths are relative to
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/`, abbreviated `J/`.

## How a description leaf gets its size, upstream

`EntityImageDescription.calculateDimensionSlow` returns
`asSmall.calculateDimension(stringBounder)`
(`J/svek/image/EntityImageDescription.java:234-235`), where `asSmall` is built
in the constructor at `:209-213`:

```java
if (hideText)                                   // :209   hideText = symbol == USymbols.INTERFACE  (:137)
    asSmall = symbol.asSmall(empty, empty, empty, ctx, stereoAlign);   // :210-211
else
    asSmall = symbol.asSmall(name, desc, stereo, ctx, stereoAlign);    // :213
```

Three text blocks are threaded in, and **which of them a symbol reads is part
of its composition**:

| arg | built at | who reads it |
| --- | --- | --- |
| `name` (= the CODE display) | `:206-207`, `BodyFactory.create2` → `BodyEnhanced1` | **only** `USymbolFolder` (as the tab title). Every other `asSmall` ignores it. |
| `desc` (= the label) | `:184-190`, `BodyFactory.create3` → `BodyEnhanced2` | every symbol |
| `stereo` (`«…»`, `withMargin(…,1,0)`) | `:198-201` | every symbol |

Load-bearing consequence, previously untraced (see "Retired residual" below):
`BodyEnhanced1.getMarginX() = 6` (`J/cucadiagram/BodyEnhanced1.java:113-115`)
and `BodyEnhancedAbstract.decorate` applies `withMargin(block, marginX, 0)`
(`J/cucadiagram/BodyEnhancedAbstract.java:106-109`) → the `name` block is
**+12px wide, +0px tall** vs its raw text. `BodyEnhanced2.getMarginX() = 0`
(`J/cucadiagram/BodyEnhanced2.java:73-75`), so `desc` gets no such allowance.

## The composition kinds

Six distinct kinds across the 36 symbols. (ADR-2's Batch-5 gate wants ≥4.)

| # | kind | expression | symbols |
| --- | --- | --- | --- |
| K1 | **margin box** | `getMargin().addDimension(dimStereo.mergeTB(dimLabel))` — `mergeTB` = max-width / sum-height (`J/klimt/geom/XDimension2D.java:94-99`) | 20 symbols |
| K2 | **stacked drawing** | `XDimension2D.mergeLayoutT12B3(dimStereo, dimDrawing, dimLabel)` — max-width / sum-height (`J/klimt/geom/XDimension2D.java:134-140`), `J/decoration/symbol/USymbolSimpleAbstract.java:87` | actor ×4, boundary, control, entity, interface |
| K3 | **folder** | `getMargin().addDimension(dimName.mergeTB(dimStereo, dimLabel))` (`J/decoration/symbol/USymbolFolder.java:181`) — the tab is a mergeTB BLOCK, so it FLOORS width as well as adding height | folder, package |
| K4 | **ellipse fit** | `new TextBlockInEllipse(desc, stringBounder).calculateDimension(...)` (`J/decoration/symbol/USymbolUsecase.java:119`); alpha from the declared dim, ellipse fit to `Footprint` POINTS, then `.bigger(6)` (`J/klimt/shape/TextBlockInEllipse.java:52-62, :29-31`) | usecase, usecase/ |
| K5 | **width-doubling** | `new XDimension2D(full.getWidth() * 2, full.getHeight() + 2 * marginY)`, `marginY = 5` — **no margin table at all** (`J/decoration/symbol/USymbolHexagon.java:79`, `:57`) | hexagon |
| K6 | **derived-head box** | `body.delta(0, headSize(body))` where `body` is a K1 box and `headSize = sqrt(w*h) * .42` (`J/decoration/symbol/USymbolPerson.java:101`, `:70-73`) | person |

Note K5 and K6 cannot be expressed by *any* `(marginH, marginV)` pair: K5's
width is a multiple of the content, K6's height depends on the content's
**area**. A margin table is structurally the wrong model for both — the same
failure mode as folder's width floor.

## Not part of leaf sizing

`suppWidthBecauseOfShape` / `suppHeightBecauseOfShape` (`USymbolNode.java:192,
:197` = 5/60; `USymbolDatabase.java:173` = 15) are read **only** by
`J/svek/ClusterHeader.java:88-93` and `J/sdot/CucaDiagramFileMakerSmetana.java:668`
— i.e. when the symbol is a GROUP/cluster, never a leaf. Correctly absent
from `leaf-sizing.ts`; do not add them there.

---

## The table

`our dispatch` = the branch of `measureLeafNode`
(`src/diagrams/description/leaf-sizing.ts:93-128`) that the symbol reaches.
`verdict` ∈ `match` | `MISMATCH` | `untested`.

| symbol | upstream class | asSmall composition | drawing calculateDimension | our dispatch | verdict |
| --- | --- | --- | --- | --- | --- |
| ACTION | `USymbolAction` (`USymbols.java:60`) | K1, `Margin(10,20,10,10)` → `[30,20]` (`USymbolAction.java:76,:100`) | — | `measureBox`, `SYMBOL_BOX_MARGIN.action = [30,20]` | match |
| ACTOR_AWESOME | `USymbolActor(AWESOME)` (`:61`) | K2 (`USymbolSimpleAbstract.java:87`), drawing via `USymbolActor.java:62` → `ActorStyle.getTextBlock` (`J/skin/ActorStyle.java:57-66`) | `ActorAwesome` = `bodyWidth 54 + 2t` × `headDiam 32 + bodyHeight 28 + 2t` (`J/skin/ActorAwesome.java:98-104`) | `measureActor` — hardcoded stickman `27×60` | **MISMATCH** |
| ACTOR_HOLLOW | `USymbolActor(HOLLOW)` (`:62`) | K2, same | `ActorHollow` = `bodyWidth 25 + 2t` × `9 + neck 2 + 21 + 2t + shadow` (`J/skin/ActorHollow.java:105-111`) | `measureActor` — hardcoded stickman `27×60` | **MISMATCH** |
| ACTOR_STICKMAN | `USymbolActor(STICKMAN)` (`:63`) | K2, same | `ActorStickMan` = `max(13,13)*2 + 2t` × `16+27+15 + 2t + shadow + 1` (`J/skin/ActorStickMan.java:116-122`) | `measureActor`, `ACTOR_STICKMAN_{WIDTH,HEIGHT}` = 27/60 | match |
| ACTOR_STICKMAN_BUSINESS | `USymbolActorBusiness` (`:64`) | K2 (`USymbolActorBusiness.java:54`) | same `ActorStickMan`; the `actorBusiness` flag changes drawing only, not `getPreferred*` | `measureActor` (`'actor-business'`) | match |
| AGENT | `USymbolRectangle(agent)` (`:65`) | K1, `Margin(10,10,10,10)` → `[20,20]` (`USymbolRectangle.java:74,:98`) | — | `measureBox`, `.agent = [20,20]` | match |
| ARCHIMATE | `USymbolRectangle(archimate)` (`:66`) | K1, `[20,20]` (same lines) | — | **none** — `archimate` is absent from `KEYWORD_SYMBOL_ENTRIES` (`src/core/descriptive-keywords.ts:71-103`), so `CommandArchimate` has no port | **MISMATCH** |
| ARTIFACT | `USymbolArtifact` (`:67`) | K1, `Margin(10,20,13,10)` → `[30,23]` (`USymbolArtifact.java:92,:116`) | — | `measureBox`, `.artifact = [30,23]` | match |
| BOUNDARY | `USymbolBoundary` (`:68`) | K2 (`USymbolBoundary.java:52`) | `Boundary` = `radius*2 + left 17 + 2*margin` × `radius*2 + 2*margin` = `49×32`, radius 12 margin 4 (`J/svek/Boundary.java:52-55,:97-98`) | `measureSimpleSymbol`, `SIMPLE_SYMBOL_DRAWING.boundary = [49,32]` | match |
| CARD | `USymbolCard` (`:69`) | K1, `Margin(10,10,3,3)` → `[20,6]` (`USymbolCard.java:70,:94`) | — | `measureBox`, `.card = [20,6]` | match |
| CLOUD | `USymbolCloud` (`:70`) | K1, `Margin(15,15,15,15)` → `[30,30]` (`USymbolCloud.java:216-219,:242`; `NEW == true`, so `:219`'s `(10,10,10,10)` is dead) | — | `measureBox`, `.cloud = [20,20]` **+** `SYMBOL_ICON_ALLOWANCE.cloud = [10,10]` | match (see M-note 1) |
| COLLECTIONS | `USymbolCollections` (`:71`) | K1, `Margin(10,10,10,10)` → `[20,20]` (`USymbolCollections.java:69,:98`) | — | `measureBox`, `.collections = [20,20]` | match |
| COMPONENT_RECTANGLE | `USymbolRectangle(component)` (`:72`); reached by `componentStyle rectangle` (`J/skin/ComponentStyle.java:52`) | K1, `[20,20]` (`USymbolRectangle.java:74,:98`) | — | `measureBox`, `.component = [20,20]`; `boxIcon` returns `[0,0]` for non-`uml2` | match |
| COMPONENT1 | `USymbolComponent1` (`:73`); `componentStyle uml1` (`ComponentStyle.java:48`) | K1, `Margin(10,10,10,10)` → `[20,20]` (`USymbolComponent1.java:75,:100`) | — | `measureBox`, `[20,20]` + icon `[0,0]` | match |
| COMPONENT2 | `USymbolComponent2` (`:74`); **the default** (`componentStyle uml2`, `ComponentStyle.java:50`) | K1, `Margin(15,25,20,10)` → `[40,30]` (`USymbolComponent2.java:78,:104`) | — | `measureBox`, `.component = [20,20]` **+** `SYMBOL_ICON_ALLOWANCE.component = [20,10]` | match (see M-note 1) |
| CONTROL | `USymbolControl` (`:75`) | K2 (`USymbolControl.java:52`) | `Control` = `radius*2 + 2*margin` = `32×32`, radius 12 margin 4 (`J/svek/Control.java:51-53,:87-88`) | `measureSimpleSymbol`, `.control = [32,32]` | match |
| DATABASE | `USymbolDatabase` (`:76`) | K1, `Margin(10,10,24,5)` → `[20,29]` (`USymbolDatabase.java:117,:140`) | — | `measureBox`, `.database = [20,29]` | match |
| ENTITY_DOMAIN | `USymbolEntityDomain` (`:77`) | K2 (`USymbolEntityDomain.java:53`) | `EntityDomain` = `radius*2 + 2*margin` = `32×32` (`J/svek/EntityDomain.java:50-53,:74-75`); note `suppY = 2` affects the drawn underline only, not the dimension | `measureSimpleSymbol`, `.entity = [32,32]` | match |
| FILE | `USymbolFile` (`:78`) | K1, `Margin(10,10,10,10)` → `[20,20]` (`USymbolFile.java:105,:129`) | — | `measureBox`, `.file = [20,20]` | match |
| FOLDER | `USymbolFolder(folder, showTitle=false)` (`:79`) | K3; `getDimTitle` returns a FIXED `XDimension2D(40,15)` when `!showTitle` (`USymbolFolder.java:171-173`), `Margin(10,20,13,10)` → `[30,23]` (`:147,:181`) | — | `measureFolderLeaf` via `FOLDER_FAMILY_SHOW_TITLE.folder = false` | match |
| FRAME | `USymbolFrame(frame)` (`:80`) | K1, `Margin(15,25,20,10)` → `[40,30]` (`USymbolFrame.java:107,:131`) | — | `measureBox`, `.frame = [40,30]` | match |
| GROUP | `USymbolFrame(group)` (`:81`) | K1, `[40,30]` (same lines) | — | **unreachable as a description leaf** — only `J/activitydiagram3/command/CommandPartition3.java:103` constructs it, and as a GROUP, not a leaf | untested |
| HEXAGON | `USymbolHexagon` (`:82`) | **K5** — `new XDimension2D(full.getWidth() * 2, full.getHeight() + 2 * marginY)`, `marginY = 5` (`USymbolHexagon.java:79,:57`). Its `getMargin()` at `:104` is dead in `asSmall`. | — | `measureBox`, `.hexagon = [20,20]` | **MISMATCH** |
| INTERFACE | `USymbolInterface` (`:83`) | K2, but `hideText` passes THREE EMPTY blocks (`EntityImageDescription.java:137,:209-211`), so the result is the bare drawing | `CircleInterface2` = `radius*2 + 2*margin` = `18×18`, radius 8 margin 1 (`J/svek/CircleInterface2.java:50-52,:77-78`) | early return `INTERFACE_CIRCLE_SIZE = 18` | match |
| LABEL | `USymbolLabel` (`:84`) | K1, `Margin(10,10,10,10)` → `[20,20]` (`USymbolLabel.java:58,:80`) — no border is drawn, but the margin still applies | — | `measureBox`, `.label = [20,20]` | match |
| NODE | `USymbolNode` (`:85`) | K1, `Margin(15,25,20,10)` → `[40,30]` (`USymbolNode.java:127,:150`) | — | `measureBox`, `.node = [40,30]` | match |
| PACKAGE | `USymbolFolder(package_, showTitle=true)` (`:86`) | K3; `getDimTitle` = the `name` block's own dim when `showTitle` (`USymbolFolder.java:171-173`), which carries `BodyEnhanced1`'s +12 width (`J/cucadiagram/BodyEnhanced1.java:113-115` + `BodyEnhancedAbstract.java:106-109`); `Margin(10,20,13,10)` → `[30,23]` (`:147,:181`). `desc` is `empty(MinimumWidth, 0)` when display == code (`EntityImageDescription.java:184-186`). | — | `measureFolderLeaf` via `FOLDER_FAMILY_SHOW_TITLE.package = true` | match |
| PARTITION | `USymbolFrame(partition)` (`:87`) | K1, `[40,30]` (`USymbolFrame.java:107,:131`) | — | **unreachable as a description leaf** — only `J/activitydiagram3/command/CommandPartition3.java:91` | untested |
| PERSON | `USymbolPerson` (`:88`) | **K6** — `body.delta(0, headSize(body))` where `body = getMargin().addDimension(dimStereo.mergeTB(dimLabel))` with `Margin(10,10,10,10)` and `headSize = sqrt(w*h) * .42` (`USymbolPerson.java:101,:105-108,:77,:70-73`) | — | `measureBox`, `.person = [20,20]` — the head is never added | **MISMATCH** |
| PROCESS | `USymbolProcess(process)` (`:89`) | K1, `Margin(20,20,10,10)` → `[40,20]` (`USymbolProcess.java:77,:101`) | — | `measureBox`, `.process = [40,20]` | match |
| QUEUE | `USymbolQueue` (`:90`) | K1, `Margin(5,15,5,5)` → `[20,10]` (`USymbolQueue.java:131,:155`) | — | `measureBox`, `.queue = [20,10]` | match |
| RECTANGLE | `USymbolRectangle(rectangle)` (`:91`) | K1, `[20,20]` (`USymbolRectangle.java:74,:98`) | — | `measureBox`, `.rectangle = [20,20]` | match |
| STACK | `USymbolStack` (`:92`) | K1, `Margin(25,25,10,10)` → `[50,20]` (`USymbolStack.java:92,:116`) | — | `measureBox`, `.stack = [50,20]` | match |
| STORAGE | `USymbolStorage` (`:93`) | K1, `Margin(10,10,10,10)` → `[20,20]` (`USymbolStorage.java:66,:89`) | — | `measureBox`, `.storage = [20,20]` | match |
| USECASE | `USymbolUsecase(false)` (`:94`) | K4 over `desc = mergeTB(stereo, label)` (`USymbolUsecase.java:99-100,:119`) | `TextBlockInEllipse` → `getUEllipse().getDimension()`, `.bigger(6)` (`J/klimt/shape/TextBlockInEllipse.java:29-31,:83-84`) | `measureUsecase` | match |
| USECASE_BUSINESS | `USymbolUsecase(true)` (`:95`) | K4, but `desc = TextBlockUtils.withMargin(tmp, 7, 0)` — **+7px left AND right, +0 vertical** before the ellipse is fit (`USymbolUsecase.java:100`; `withMargin(tb,x,y)` → `TextBlockMarged(tb,y,x,y,x)`, `J/klimt/shape/TextBlockUtils.java:64-69`) | same | `measureUsecase` — identical branch to `usecase`, the 7px is not applied | **MISMATCH** |

**Counts: 36 rows — 28 `match`, 6 `MISMATCH`, 2 `untested`.**

### M-note 1 — two `match` rows whose MECHANISM is wrong

`component` and `cloud` measure correctly today but for the wrong reason.
Upstream has no "icon allowance" concept at all: the whole delta is the
symbol's own `getMargin()`.

- `cloud`: upstream `Margin(15,15,15,15)` = `[30,30]`. We spell it
  `[20,20] margin + [10,10] icon`. The `SYMBOL_BOX_MARGIN.cloud` comment
  quotes `Margin(10,10,10,10)` — that is `USymbolCloud.java:219`, the **dead**
  `NEW == false` branch.
- `component`: upstream picks a different CLASS per `componentStyle`
  (`ComponentStyle.java:44-54`): `uml2` → `USymbolComponent2` `[40,30]`,
  `uml1` → `USymbolComponent1` `[20,20]`, `rectangle` → `USymbolRectangle`
  `[20,20]`. We use one margin `[20,20]` plus a style-gated icon `[20,10]`.
  All three totals happen to agree.

Not filed as `MISMATCH` (no output differs), but both are the exact pattern
this mission exists to end: a fitted constant standing in for an upstream
expression. Fold them into whatever Batch 4/5 does with the table.

---

## MISMATCH detail — evidence

All probes: pinned oracle jar, deterministic text, `"Hello"` label
(text width 32.025, line height 14 — calibrated from `rectangle "zz"`
= 34×34 in the same run, i.e. `zz` = 14 + `[20,20]`). DOT widths are inches;
×72 for px.

Probe form (one symbol of interest + one throwaway `rectangle`, see "Two
traps" below):

```sh
java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> \
     -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <file.puml>
```

### 1. HEXAGON — K5, width doubling

```
@startuml
hexagon "Hello" as N1
rectangle "zz" as Z9
N1 --> Z9
@enduml
```
→ `sh0006 [shape=hexagon,...,width=0.889583,height=0.333333]` = **64.05 × 24.0**

- upstream: `32.025 * 2 = 64.05` ✓, `14 + 2*5 = 24` ✓
  (`USymbolHexagon.java:79`)
- ours: `32.025 + 20 = 52.025` × `14 + 20 = 34` → **−12.03 w, +10 h**, and the
  width error GROWS linearly with label width (at `WWWWWWWW` it is ~×2 vs +20).

Fix write-set: `leaf-sizing.ts` (new dispatch branch), `leaf-sizing-consts.ts`
(remove `hexagon` from `SYMBOL_BOX_MARGIN`, add `HEXAGON_MARGIN_Y = 5`).

### 2. PERSON — K6, area-derived head

```
person "Hello" as N1   (+ throwaway rectangle)
```
→ `width=0.722569,height=0.717559` = **52.025 × 51.664**

- upstream: body = `[20,20]` + text = `52.025 × 34`;
  `headSize = sqrt(52.025 * 34) * .42 = 17.664`; total height `34 + 17.664 =
  51.664` ✓ exact (`USymbolPerson.java:101,:70-73`)
- ours: `52.025 × 34` → **height short by 17.66**; the shortfall scales with
  `sqrt(area)`, so it is worst on large labels.

Fix write-set: `leaf-sizing.ts` (new branch), `leaf-sizing-consts.ts`
(`PERSON_HEAD_FACTOR = 0.42`).

### 3. USECASE_BUSINESS — K4 with a 7px desc margin

```
usecase/ "Hello" as N1   vs   usecase "Hello" as N1
```
→ business `width=0.987350,height=0.358319` = **71.09 × 25.80**
→ plain `width=0.712364,height=0.358319` = **51.29 × 25.80**

Reproduced from the Java by hand, confirming the mechanism (not a fitted
delta): with `W = 32.025 + 14 = 46.025`, `H = 14`,
`alpha = clamp(H/W) = 0.3042`, `diag = sqrt(W² + (H/alpha)²) = 65.09`,
`+6` → `71.09`; height `alpha*diag + 6 = 25.80`. Both exact.
The `+14` is `withMargin(tmp, 7, 0)` = 7 left + 7 right, 0 vertical
(`USymbolUsecase.java:100`, `TextBlockUtils.java:64-69`).

Note the error is NOT `+14`: it is `+19.8` here, because widening the text
block changes `alpha` and refits the ellipse. Any fix must widen the
FOOTPRINT input, not patch the output.

Fix write-set: `leaf-sizing.ts` (`measureUsecase` needs the business flag),
`leaf-sizing-consts.ts` (`USECASE_BUSINESS_MARGIN_X = 7`).

### 4 & 5. ACTOR_AWESOME / ACTOR_HOLLOW — wrong drawing

```
@startuml
skinparam actorStyle awesome     (then: hollow, stickman)
actor "Hello" as N1
rectangle "zz" as Z9
N1 --> Z9
@enduml
```

| style | DOT | px | drawing implied | Java |
| --- | --- | --- | --- | --- |
| awesome | `0.763889 × 1.041667` | 55.0 × 75.0 | `55 × 61` = `54+2t` × `32+28+2t`, t=0.5 | `J/skin/ActorAwesome.java:98-104` |
| hollow | `0.444792 × 0.652778` | 32.025 × 47.0 | `26 × 33` = `25+2t` × `9+2+21+2t` | `J/skin/ActorHollow.java:105-111` |
| stickman | `0.444792 × 1.027778` | 32.025 × 74.0 | `27 × 60` | `J/skin/ActorStickMan.java:116-122` |

Ours returns the stickman `27×60` unconditionally
(`leaf-sizing.ts` `measureActor`), so awesome measures `32.025×74` (should be
`55×75`) and hollow `32.025×74` (should be `32.025×47`).

This one is not sizer-local: `skinparam actorStyle` has no accessor in this
port at all, and `src/core/skin/ActorStyle.ts#actorStyleGetTextBlock` throws
for `AWESOME`/`HOLLOW` by deliberate deferral. Fix write-set: `skinparam.ts`
(add `actorStyle()`), `src/core/skin/ActorAwesome.ts` + `ActorHollow.ts` (new
ports), `leaf-sizing.ts` + `leaf-sizing-consts.ts`. Sized as its own task, not
a constant change.

### 6. ARCHIMATE — keyword not ported

```
archimate #Business "Hello" as N1   (+ throwaway rectangle)
```
→ `width=0.722569,height=0.472222` = **52.025 × 34** — i.e. plain
`USymbolRectangle` `[20,20]`, exactly as `USymbols.java:66` says.

The colour token is **mandatory**: `archimate "Hello" as N1` is a syntax error
in the jar too (`CommandArchimate.java:70-97` — `archimate <color> <display>
as <code>`).

We have no `archimate` keyword in `KEYWORD_SYMBOL_ENTRIES`
(`src/core/descriptive-keywords.ts:71-103`), so the line never becomes a
description leaf. The *sizing* is already right for free once the keyword
exists (it is a rectangle). Fix write-set: `descriptive-keywords.ts` + a
`CommandArchimate` port; `leaf-sizing*.ts` needs nothing.

---

## Structural finding — a faithful port already exists and is unused

`src/core/decoration/symbol/` contains a class-per-class port of all 30
upstream `USymbol*.java` files plus `USymbols.ts` (36 `record(...)` entries),
and each implements `asSmall(...).calculateDimension` faithfully. Spot-checked
against the three MISMATCHes above:

- `USymbolHexagon.ts` — `new XDimension2D(full.getWidth() * 2, full.getHeight() + 2 * HEXAGON_MARGIN_Y)` ✓
- `USymbolPerson.ts` — `headSize = Math.sqrt(surface) * 0.42` ✓
- `USymbolUsecase.ts` — `isBusiness ? TextBlockUtils.withMargin(tmp, 7, 7, 0, 0) : tmp` ✓ (with a doc comment
  explaining the 3-arg → 4-arg argument-order translation)

**The RENDERER imports these classes; the leaf SIZER imports none of them.**
(Corrected by the orchestrator 2026-07-28 — the first draft of this section
said "nothing outside `src/core/decoration/symbol/` imports any of it,"
which is false and understates the finding.) Verified by
`grep -rn "^import.*decoration/symbol" src`:

- **Renderer side imports the ported classes** — `EntityImageDescription.ts:90-93`,
  `EntityImageDescriptionSupport.ts:49-51`, `EntityImageDescriptionDelegates.ts:23`,
  `PackageStyle.ts:25-32` (eight concrete symbols), `ClusterDecoration.ts:29-30`,
  `Cluster.ts:115`, `renderer-symbol.ts:14,16`, plus the svek shape classes
  (`Control.ts`, `Boundary.ts`, `EntityDomain.ts`, `ActorStickMan.ts`).
- **`leaf-sizing.ts`, `leaf-sizing-consts.ts`, `leaf-sizing-text.ts` and
  `leaf-sizing-folder.ts` import ZERO of it.** They cite the classes in
  JSDoc comments and then re-derive the same geometry as five flat tables.

That is the same lock-step gap `sizer-renderer-parity.md` documents for
individual settings — but at the scale of the entire symbol model, which is
why it produced six MISMATCHes at once instead of one.

So all six MISMATCHes are, at root, one divergence: **we have two parallel
USymbol models, the renderer uses the faithful one, and the leaf sizer
consults the lossy one.** Batch 4 should
consider routing `measureLeafNode` through the ported classes rather than
patching three more table entries — that is upstream's own boundary
(`EntityImageDescription` → `symbol.asSmall(...)`), and it is the structural
fix CLAUDE.md's "upstream architecture is authoritative" calls for. The
blocker to check first is the measurer seam: the ported classes take a
`StringBounder`, the sizer takes a `StringMeasurer`.

## Retired residual — the folder `+12` is now traced

`FOLDER_SHOWN_TITLE_EXTRA_WIDTH = 12` (`leaf-sizing-consts.ts:208`) was
recorded as "measured, NOT attributed to a single upstream expression". It is:

> `BodyEnhanced1.getMarginX()` returns `6`
> (`J/cucadiagram/BodyEnhanced1.java:113-115`), and
> `BodyEnhancedAbstract.decorate` applies `TextBlockUtils.withMargin(block,
> marginX, 0)` for `separator == 0`
> (`J/cucadiagram/BodyEnhancedAbstract.java:106-109`) → **+6 left, +6 right,
> +0 vertical = +12 width**.

It applies to the `name` block only because `name` is the only one built by
`BodyFactory.create2` → `BodyEnhanced1`
(`J/cucadiagram/BodyFactory.java:74-77`); `desc` goes through `create3` →
`BodyEnhanced2`, whose `getMarginX()` returns `0`
(`J/cucadiagram/BodyEnhanced2.java:73-75`). That is exactly why a `folder`'s
label takes no such allowance while a `package`'s shown title does — the
behaviour the old comment could only report empirically.

Batch-4 chore (not a `MISMATCH`, no output changes): update the constant's
comment to cite these lines, and note that the constant belongs to
`BodyEnhanced1`, not to `USymbolFolder` — it will apply to any future symbol
that reads the `name` block.

---

## Reusing this procedure for another engine (ADR-5)

This bug class is not description-specific: `class`, `state`, and `object`
leaves are sized by the same `asSmall` contract through different
`EntityImage*` classes. The procedure below is engine-agnostic — nothing in it
assumes description diagrams or these particular symbols.

1. **Find the engine's dimension entry point.** Locate the `EntityImage*`
   whose `calculateDimensionSlow` the engine calls, and read what it delegates
   to. If it delegates to `symbol.asSmall(...)`, this whole table applies
   unchanged and you only need step 6. If it computes its own layout (class
   bodies, state composites), enumerate ITS composition kinds the same way.
2. **Enumerate the registry, not the code you already have.** Start from the
   upstream registry (`USymbols.java`, `LeafType`, or the engine's command
   `ALL_TYPES`) and give every entry a row. Starting from our own table
   guarantees you only re-check what you already thought about — that is how
   the last four defects survived.
3. **Classify by COMPOSITION, not by constant.** For each row, write down the
   dimension *expression* verbatim from the Java. Then ask the question that
   catches this bug class: *can a `(marginH, marginV)` pair express this?*
   Anything with a `max`, a multiplication by content, a `sqrt`, a fit, or a
   block that enters a `mergeTB` is a No, and a margin table will silently
   approximate it for one label width and diverge for every other.
4. **Grep `src/main/java/net/`, never just `net/sourceforge/plantuml/`.**
   Load-bearing code lives in `net/atmp/` and elsewhere.
5. **Every cell cites a Java `file:line`.** Filling a cell from our own source
   is the inversion that produces confidently-wrong audits. If you cannot find
   the Java line, the verdict is `untested`, not `match`.
6. **Probe what has no fixture.** A `MISMATCH` with no failing fixture needs a
   jar probe recorded with its command and numbers. Prefer deriving the
   expected value from the Java expression BY HAND and checking it against the
   probe — agreement to <0.01px proves you found the mechanism; a fitted delta
   proves only that you found a number.
7. **Check for an existing faithful port before proposing constants.** As the
   structural finding above shows, the correct model may already be in the
   tree and simply unwired.

### The two traps (both cost time last session)

- **DOT node order ≠ declaration order.** Put exactly ONE element of interest
  in each probe diagram, so there is nothing to mispair.
- **A single-entity diagram emits no DOT at all**
  (`isDegeneratedWithFewEntities`). Always include a second throwaway element
  and an edge. A `rectangle "zz"` doubles as a scale calibrator: it must
  measure `textWidth + 20` × `lineHeight + 20`.

Scratch files belong in the session scratchpad, never in the repo.
