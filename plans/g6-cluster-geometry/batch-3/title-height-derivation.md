# T6 — Cluster title-table height: derived jar formula

Status: MECHANISM FOUND. Formula reproduces jar's real DOT-emitted
`HEIGHT="..."` exactly on every ground-truth fixture available this
iteration (4 fixture instances, 2 read as literal cached-DOT ground
truth, 2 cross-checked via independent SVG box extraction). No
fixture-specific terms.

## 1. The formula

```
titleAndAttributeHeight(titleLines, stereoLines, attrLines, fontSize)
  = (stereoLines + titleLines) * fontSize      // stereo+title, stacked
  + attrLines * fontSize                        // action-zone text
  + (attrLines > 0 ? 5 : 0)                     // IEntityImage.MARGIN
  + suppHeightBecauseOfShape                    // USymbol override; 0 for
                                                 // every plain state cluster

titleTableHeight = titleAndAttributeHeight - 5   // the DOT HTML
                                                  // <TABLE HEIGHT="..."> jar
                                                  // actually emits
```

`fontSize` is the composite's own resolved font size (14 = jar's root
default, `plantuml.skin:10`, inherited by both `state.name` — the title
style — and `state.description` — the attribute/action-zone style — since
neither overrides `FontSize` in `plantuml.skin`).

### Jar citations, one per term

| Term | Jar source |
|---|---|
| `getTitleAndAttributeHeight()` (Cluster→ClusterHeader delegation) | `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java:266-267` |
| Core formula: `titleAndAttributeHeight = dimLabel.getHeight() + attributeHeight + marginForFields + suppHeightBecauseOfShape` | `.../svek/ClusterHeader.java:73-96` (constructor) |
| `dimLabel` = `TextBlockUtils.mergeTB(stereo, title, alignment)` — vertical stack; shortcuts to the non-empty operand when the other is `EMPTY_TEXT_BLOCK` (no stereo ⇒ `dimLabel == title` exactly, no padding) | `.../klimt/shape/TextBlockUtils.java:122-129` |
| `mergeTB` height math: `height = this.height + bottom.height` (sum, not max — width is `max`) | `.../klimt/geom/XDimension2D.java:94-98` |
| `attributeHeight` = `g.getStateDescription(skinParam).calculateDimension(...)` — the raw `State : text` body lines (`entry/exit/internal` lines), NOT nested children's own bodies | `.../abel/Entity.java:610-633` (`getStateDescription`) |
| `marginForFields = attributeHeight > 0 ? IEntityImage.MARGIN : 0` | `.../svek/ClusterHeader.java:86`; `MARGIN = 5` at `.../svek/IEntityImage.java:45` |
| `suppHeightBecauseOfShape = uSymbol == null ? 0 : uSymbol.suppHeightBecauseOfShape()` — 0 for every plain (non-USymbol) state composite in this port's state-diagram corpus | `.../svek/ClusterHeader.java:87-93` |
| DOT emission: `HEIGHT = cluster.getTitleAndAttributeHeight() - 5` | `.../svek/ClusterDotString.java:124` |
| Attribute/description style signature (`state.description`, inherits root `FontSize 14` — no override in `plantuml.skin`) | `.../svek/image/EntityImageStateCommon.java:96-97`; `~/git/plantuml/src/main/resources/skin/plantuml.skin:1-19` (root default), `:266-287` (`stateDiagram { state { ... } }` — no `FontSize` override for `name`/`description`) |
| Title style signature (`state.name`) | `EntityImageStateCommon.java:91-94` |

### Port-side confirmation (independent of jar, corroborating evidence)

`fontSize` per line of text = the height jar's own deterministic
`StringBounderFromWidthTable` reports for a text line under
`FileFormat.SVG_DETERMINISTIC` — this port's `WidthTableMeasurer.measure`
(`src/core/measurer.ts:186-193`, `height: font.size`) is a faithful port
of that exact class, already used (and jar-verified) for unrelated width
computations throughout this port. `measureClusterTitle`
(`state-composite-cluster.ts:37-48`) already sums per-line heights
(`height += m.height`) for the multi-line title case — i.e. it already
implements the `titleLines * fontSize` term of the formula above; T6 adds
nothing new to that half, only the `attrLines`/`stereoLines`/`-5` wrapper
around it.

`buildActionZone` (`renderer-composite-box.ts:245`,
`actionZoneHeight = bodyLines.length * theme.fontSize + MARGIN`) is the
*autonom*-shape analog of the same jar mechanism (`InnerStateAutonom`
reads the identical `getStateDescription`/`IEntityImage.MARGIN` inputs,
`Cluster.java:473`, `InnerStateAutonom.java:99`) — it independently
derives the SAME `attrLines*fontSize + MARGIN` term this port already
ships for the *other* composite shape. This is strong prior
corroboration, not circular: it is a second, already-jar-verified port
site reading the same upstream formula for a sibling code path.

## 2. Paper reproductions (no code, no fixture-specific terms)

All three use fontSize = 14 (root default), the single shared formula:

**(a) Plain single-line title** (e.g. `state B { }`, no stereotype, no body):
titleLines=1, stereoLines=0, attrLines=0.
```
titleAndAttributeHeight = (0+1)*14 + 0 + 0 + 0 = 14
titleTableHeight        = 14 - 5 = 9
```
Reduces to the currently-pinned `CLUSTER_TITLE_TABLE_HEIGHT = 9`
(`state-composite-cluster.ts:110`). ✓

**(b) `Track_FSM.Run`** (`bajelo-54-dixe684.puml`): title "Run" (1 line, no
stereotype), body `entry / enter_run();` + `exit / exit_run();` (2 attribute
lines). titleLines=1, stereoLines=0, attrLines=2.
```
titleAndAttributeHeight = (0+1)*14 + 2*14 + 5 + 0 = 14 + 28 + 5 = 47
titleTableHeight        = 47 - 5 = 42
```
Matches the brief's stated jar ground truth (`HEIGHT=42`) exactly. ✓

**(c) Multi-line title, no attribute** (state `A as "A on several lines\nwith\na lot of text"`, `sosoxe-55-demi451.puml` / `teseci-80-sivi292.puml`): titleLines=3, stereoLines=0, attrLines=0.
```
titleAndAttributeHeight = (0+3)*14 + 0 + 0 + 0 = 42
titleTableHeight        = 42 - 5 = 37
```
The G5 C5 "gap=47" SVG measurement is the *render-side* header-to-divider
gap, a structurally separate jar/port quantity from `titleTableHeight`
(see §4 note) — it equals `titleAndAttributeHeight + 5 = 42 + 5 = 47`,
matching C5's finding exactly. `titleTableHeight` itself (37) is verified
directly against the cached DOT (§3).

All three numbers (9, 42, 37/47) fall out of one formula with zero
per-fixture constants — only `titleLines`/`stereoLines`/`attrLines`/
`fontSize`, all read off the source `.puml`.

## 3. Oracle verification table

Ground truth in priority order: (1) literal `HEIGHT="..."` read from a
cached `svek-N.dot` — this *is* the value `titleTableHeight` must equal,
no interpretation needed; (2) SVG box extraction of the render-side
header-to-divider gap (`titleAndAttributeHeight + 5`), used to
cross-check the same `titleAndAttributeHeight` term through an
independent jar code path (the renderer, not the DOT emitter).

| Fixture | Cluster | titleLines | attrLines | Predicted `titleTableHeight` | Ground truth | Source | Match |
|---|---|---|---|---|---|---|---|
| `bajelo-54-dixe684` | `Track_FSM.Run` | 1 | 2 | 42 | `HEIGHT="42"` | `test-results/dot-cache/state/bajelo-54-dixe684/svek-2.dot:5` (literal DOT) | ✓ exact |
| `sosoxe-55-demi451` | `A` | 3 | 0 | 37 | `HEIGHT="37"` | `.../sosoxe-55-demi451/svek-1.dot:8` (literal DOT) | ✓ exact |
| `sosoxe-55-demi451` | `A` (same) | 3 | 0 | predicted render gap 47 | header y=7→divider y=54, gap=47 | `.../sosoxe-55-demi451/in.svg` `<g class="cluster">A</g>` path/line box extraction | ✓ exact (also = G5 C5's own "gap=47" finding, independently reproduced) |
| `teseci-80-sivi292` | `A` (same source text, `!pragma layout smetana`) | 3 | 0 | 37 | `HEIGHT="37"` | `.../teseci-80-sivi292/svek-1.dot:8` (literal DOT) | ✓ exact — confirms the formula is layout-engine-independent (dot vs smetana), as expected since `ClusterHeader` runs before engine dispatch |
| `sosoxe-55-demi451` / `teseci-80-sivi292` | `B` (nested, plain 1-line) | 1 | 0 | 9 | `HEIGHT="9"` | `.../sosoxe-55-demi451/svek-1.dot:13` and `.../teseci-80-sivi292/svek-1.dot:13` (literal DOT) | ✓ exact |
| `sosoxe-55-demi451` | `B` (same) | 1 | 0 | predicted render gap 19 | header y=35→divider y=54, gap=19 | `.../sosoxe-55-demi451/in.svg` `<g class="cluster">B</g>` box extraction | ✓ exact (= `CLUSTER_HEADER_HEIGHT=19`, corroborates the already-pinned constant is `titleAndAttributeHeight(14) + 5`, not an independent value) |

6/6 checks exact — 4 direct-DOT `HEIGHT` ground-truth reads (strongest:
literal jar output, not a derived render-side gap) plus 2 independent SVG
box-extraction cross-checks. Zero mismatches; nothing tuned.

## 4. Two DISTINCT jar quantities — do not conflate

`titleAndAttributeHeight` feeds two structurally separate consumers with
different offsets:

- **DOT-layout reservation** (what `titleTableHeight` must carry):
  `HEIGHT = titleAndAttributeHeight - 5` (`ClusterDotString.java:124`).
- **SVG render-side header gap** (already-pinned `CLUSTER_HEADER_HEIGHT`
  constant, `state-composite-cluster.ts:111`, a *different* code path —
  `renderer-composite-box.ts`'s own header/divider drawing, not the DOT
  emitter): empirically `titleAndAttributeHeight + 5` — this iteration's
  own oracle data (`14+5=19`, `42+5=47`) is consistent with the existing
  pinned `19`, but T6's write-set is `titleTableHeight` only; the
  render-side constant is untouched (T7's write-set excludes the renderer
  per its own task file) and this doc does not authorize touching it.
  Flagging the relationship (both derive from the same
  `titleAndAttributeHeight`, offset by `+5` vs `-5`) is informational for
  whoever eventually generalizes `CLUSTER_HEADER_HEIGHT` past the
  single-line case — NOT a T7 action item.

Separately: `bajelo-54-dixe684`'s rendered SVG shows Run's action-zone
text (`entry/exit` lines) drawn as its own second divider + fill rect
(header gap 19, then a *separate* 33px action-zone block,
`260→293` = `2*14+5`) — i.e. the CURRENT renderer already draws title and
action-zone as two independently-sized visual bands, whose total (52)
does not equal `titleAndAttributeHeight` (47). This is expected: the
renderer's split (`buildActionZone`, already shipped) and the DOT
emitter's single combined reservation (`titleAndAttributeHeight`, target
of this task) are different jar mechanisms measuring overlapping but not
identical things. T6/T7 concern only the DOT reservation value; the
renderer split is unaffected and out of scope.

## 5. Eligibility conditions T7 may relax

Current gate (`state-composite-cluster.ts:303-307`):
```
titleTableEligible =
  title.lineCount === 1 &&
  ctx.theme.fontSize === 14 &&
  !hasBorderPointChildren &&
  ctx.insideAutonomPass !== true;
```

| Conjunct | Verdict | Basis |
|---|---|---|
| `title.lineCount === 1` | **RELAX — remove entirely.** | Formula is `titleLines`-parametric; jar-verified exact at `titleLines=1` (9, 42) AND `titleLines=3` (37) — no lineCount-dependent special case exists in `ClusterHeader.java`. |
| (new) attribute lines | **ADD as a formula input**, sourced from `s.description` (`ast.ts:102`, the same field `state-composite-sizing.ts:71`'s `bodyLines = (state.description ?? []).flatMap(splitCreoleLines)` already reads for the autonom shape). Currently `resolveClusterComposite` never reads `s.description` at all — this is new plumbing, not a relaxation of an existing gate. | jar-verified exact on `bajelo-54-dixe684`'s `Run` (attrLines=2 → HEIGHT=42). |
| `ctx.theme.fontSize === 14` | **DO NOT relax without a dedicated check.** Formula is algebraically `fontSize`-parametric (every term scales with it), but this iteration verified ONLY `fontSize=14` fixtures — no oracle fixture with a non-default cluster font size was available in `test-results/dot-cache/state`. Ruled out: nothing (never tested), not "found to fail." | No counter-evidence found; simply unverified — do not extrapolate past evidence per diagnosis discipline. |
| `!hasBorderPointChildren` | **DO NOT relax.** Unrelated code path (`portRanksLabelOnEe`, title moves onto the `${id}ee` subgraph's own `label=`) — a different jar mechanism with its own (separately jar-verified, unimplemented) baseline offset, per `state-composite-cluster.ts:290-307`'s own doc comment. This formula does not address it. | Pre-existing doc comment + this iteration found no new evidence bearing on it. |
| `ctx.insideAutonomPass !== true` | **DO NOT relax.** Unrelated mechanism — parked `buildPlainAutonomSpec#Math.max` floor regression, per the same doc comment (`state-composite-cluster.ts:296-300`). | Pre-existing, out of this task's scope. |

**Stereotype term** (`stereoLines` in the formula): derived directly from
jar source (`ClusterHeader.java:78-81` builds `stereo` via
`getStereoBlock`, merges via the SAME `mergeTB`/`XDimension2D.mergeTB`
math already cited) — algebraically sound and consistent with every
verified fixture (all of which have `stereoLines=0`, so the term is
present in the formula but never yet exercised at `stereoLines>0`). No
fixture with a titled+stereotyped, non-concurrent-region cluster was
found in the cached `dot-cache/state` corpus this iteration
(`semala-31-joji042`/`mozeju-90-sepi247` have stereotyped clusters but
either no cached `svek-*.dot` cluster table or a concurrent-region shape
that isn't `titleTableEligible` at all, independent of T6). T7 may ship
the `stereoLines` term (it is source-derived, not curve-fit — consistent
with D2), but per this task's own acceptance criteria ("newly-eligible
fixtures box-measured vs oracle — heights must match; mismatch → stop"),
T7's own re-measurement sweep is the actual verification gate for that
term, not this document.

## 6. Predicted heights, every fixture measured this iteration

| Fixture | Cluster | titleLines | stereoLines | attrLines | Predicted `titleTableHeight` |
|---|---|---|---|---|---|
| `bajelo-54-dixe684` | `Track_FSM.Run` | 1 | 0 | 2 | 42 |
| `sosoxe-55-demi451` | `A` | 3 | 0 | 0 | 37 |
| `teseci-80-sivi292` | `A` | 3 | 0 | 0 | 37 |
| `sosoxe-55-demi451` | `B` | 1 | 0 | 0 | 9 |
| `teseci-80-sivi292` | `B` | 1 | 0 | 0 | 9 |

## Ruled out

- **`titleAndAttributeHeight` reproducing this port's OLD `height=font.size`
  text convention "does not work bit-for-bit"** (G5 C2/C3's stated
  concern, `state-composite-cluster.ts:54-61`): superseded — that
  concern predates G6 T1's correction of the ground-truth `HEIGHT` value
  itself (T1 found real jar `HEIGHT=9`, not the C2-era `3`). Once
  reconciled against the CORRECT ground truth, the port's own per-line
  `height=fontSize` convention (`measurer.ts:186-193`,
  `WidthTableMeasurer`) reproduces jar's `dimLabel.getHeight()` term
  exactly — confirmed via 6/6 oracle checks in §3, not assumed.
- **`CLUSTER_HEADER_HEIGHT` (render-side 19px) as a candidate formula for
  `titleTableHeight` itself**: ruled out — they are different jar
  quantities (`titleAndAttributeHeight - 5` vs `+ 5`, two separate jar
  code paths per §4), confirmed by the `A` fixture where they diverge
  numerically (37 vs 47) while both trace to the same
  `titleAndAttributeHeight=42`.
- **Non-default font size term**: not ruled out, not confirmed — no
  contradicting evidence, simply no oracle fixture available. Left as an
  explicit gap in §5, not silently assumed correct.

## Next instrumentation (only if T7 needs it)

- A dedicated non-14 `stateFontSize` cluster fixture (skinparam-driven),
  to verify the `fontSize` conjunct is safe to relax.
- A titled + stereotyped, non-concurrent-region composite cluster fixture
  with a cached `svek-*.dot`, to directly verify the `stereoLines` term
  the same way §3 verified `attrLines`.
