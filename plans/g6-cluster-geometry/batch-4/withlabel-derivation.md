# T8 — WithLabel / portRanksLabelOnEe border-point path: jar derivation

**Verdict: ISOLATED.** Full mechanism found with `file:line` citations,
verified against jar's real cached DOT + oracle SVG on three fixtures
(one byte-exact on both dimensions with a 3rd independent confirmation
of the `insides`-nonempty branch; one exact on width, height within
0.36px explained by a probe-tool graphviz-version artifact, not the
formula). No approximation was needed or used.

## 0. TL;DR for T9

Two things are missing, and they are **not** where the batch-4
`overview.md`/T9 task file assumed:

1. **`titleTableEligible`'s title-table reservation already has the
   right formula** (`computeTitleTableHeight`,
   `state-composite-cluster.ts:97-99`) — the WithLabel branch reuses
   it **verbatim**, unchanged. No new sizing formula needs to be
   written for the title/attribute table itself.
2. **The real gap is cluster-level geometry**, in two files T9's task
   spec does not list:
   - `src/core/graph-layout-build.ts#addClusters` needs a new nested-
     subgraph branch (the `${id}ee` wrapper) for `hasBorderPointChildren`
     clusters — **not** `state-dot-graph.ts` (grepped: zero
     `EntityPosition`/`portRanks`/`isPort` references there today).
   - `src/diagrams/state/state-composite-geo.ts#materializeCluster`
     needs a new post-layout box-correction pass — a direct port of
     `FrontierCalculator.java` — applied only when
     `hasBorderPointChildren`. This is new code with no existing
     upstream analog in this port; it does **not** belong in
     `state-composite-sizing.ts` (that file is the `InnerStateAutonom`
     autonom-shape formula, unrelated — confirmed by reading its
     exports: `measureAutonomWrapper`, `stackConcurrentRegions`, no
     `EntityPosition`/cluster involvement).

   Per T9's own boundary ("If T8's symbol map names a different/new
   file, stop and journal — write-set change needs orchestrator
   approval"): **this is exactly that case.** T9's write-set as
   written (`state-composite-cluster.ts`, `state-composite-sizing.ts`,
   `state-dot-graph.ts`) does not include the two files that actually
   need to change. Flagging here per instruction; T9 must not proceed
   silently on the stated write-set.

3. **The border-point NODE's own DOT sizing/emission is already fully
   ported** (`state-leaf-node.ts:38-61`, `state-entity-position.ts`'s
   `BORDER_POINT_SIZE=12`/`PORT_LABEL_WIDE_THRESHOLD=40`/
   `PORT_TABLE_PAD_FLOOR=10`) — this is a faithful, already-verified
   port of `EntityPosition.getDimension`/`SvekNode
   #getMaxWidthFromLabelForEntryExit`/`appendLabelHtmlSpecialForPort`.
   Nothing to do here. Do not re-derive or re-touch it.

4. **The DOT-parity text emitter (`svek-dot-emit.ts`) already emits
   the correct WithLabel/no-chain shape** structurally (confirmed
   byte-for-byte against jar's cached `svek-3.dot` for pesita — see
   §3). This is why the DOT gate is already 267/267 for state. Nothing
   to do here either, for the *comparator-visible* structure. The gap
   is exclusively in the **real graphviz-ts layout path**
   (`graph-layout-build.ts`), which is a separate code path from the
   text emitter and currently has no equivalent nesting for this
   family.

## 1. Call graph (jar), with citations

```
Cluster.drawU()                                    Cluster.java:343-345
  └─ if entityPositionsExceptNormal().size() > 0
       └─ manageEntryExitPoint(stringBounder)        Cluster.java:410-436
            ├─ insides  = direct NORMAL-position SvekNode boxes
            │             + direct child Cluster boxes
            ├─ points   = direct border-point SvekNode CENTER points
            ├─ new FrontierCalculator(initial, insides, points, rankdir)
            │                                          FrontierCalculator.java (all)
            ├─ frontierCalculator.ensureMinWidth(
            │      getTitleAndAttributeWidth() + 10)   Cluster.java:427-428
            └─ this.rectangleArea = suggested position Cluster.java:430

ClusterDotString.printInternal()                    ClusterDotString.java:74-204
  ├─ label = <TABLE FIXEDSIZE WIDTH=getTitleAndAttributeWidth()
  │           HEIGHT=getTitleAndAttributeHeight()-5>  ClusterDotString.java:121-133
  ├─ if entityPositionsExceptNormal.size() > 0:
  │     printRanks(SOURCE, inputs); printRanks(SINK, outputs)
  │                                                    ClusterDotString.java:135-137,254-287
  │     if hasPort() (PORTIN/PORTOUT only)
  │         subgraph ${id}ee { label=""; ... }         ClusterDotString.java:138-139
  │     else (ENTRY_POINT/EXIT_POINT — WithLabel)
  │         subgraph ${id}ee { label=<SAME TABLE>; }   ClusterDotString.java:140-141
  └─ (no thereALinkFromOrToGroup1 "i"/"p1" wrap when
       entityPositionsExceptNormal.size() > 0 — FORCED
       protection0=protection1=false)                  ClusterDotString.java:107-112

ClusterHeader(Entity, PortionShower, StringBounder)  ClusterHeader.java:73-96
  ├─ title  = getTitleBlock()                          ClusterHeader.java:114-141
  ├─ stereo = getStereoBlockWithoutLegend(portionShower)
  │             → portionShower.getVisibleStereotypeLabels(g)
  │               null/empty ⇒ empty block             ClusterHeader.java:182-199,
  │                                                     CucaDiagram.java:573-598
  ├─ dimLabel = mergeTB(stereo, title)                  ClusterHeader.java:80-81
  ├─ titleAndAttributeWidth  = max(dimLabel.w, attrW) + suppW
  └─ titleAndAttributeHeight = dimLabel.h + attrH + marginForFields + suppH
                                                        ClusterHeader.java:82-93

EntityImagePosition-family node sizing (already ported, unchanged):
  EntityPosition.getDimension(rankdir)                 EntityPosition.java:127-134
  AbstractEntityImageBorder.calculateDimensionSlow      AbstractEntityImageBorder.java:85-88
  EntityImageStateBorder.getMaxWidthFromLabelForEntryExit
                                                        EntityImageStateBorder.java:110-114
  SvekNode.appendLabelHtmlSpecialForPort(Html/Basic)    SvekNode.java:168-220
```

## 2. Sizing formula, term by term

### 2a. Title/attribute table — REUSE the existing plain-branch formula

`ClusterDotString.java:121-133` computes `label` **once**, using
`cluster.getTitleAndAttributeWidth()`/`getTitleAndAttributeHeight()-5`
— the exact same values as the plain (non-port) branch. It is then
placed on the outer cluster's `label=` attr for a plain cluster, or
moved onto the `${id}ee` subgraph's `label=` attr for the WithLabel
(entry/exit-point, non-`hasPort()`) branch (`ClusterDotString.java:140-141`).
**There is no separate WithLabel-specific width/height formula.** This
port's existing, already-jar-verified functions apply unchanged:

```
titleAndAttributeHeight(titleLines, stereoLines, attrLines, fontSize)
  = (stereoLines + titleLines) * fontSize + attrLines * fontSize + marginForFields
  marginForFields = attrLines > 0 ? CLUSTER_HEADER_MARGIN(5) : 0
computeTitleTableHeight(...) = titleAndAttributeHeight(...) - 5
```
(`state-composite-cluster.ts:82-99`, already implemented, G6 T6/T7).

Verified exact against `pesita-10-dene726`'s `AA` (see §4): `AA` has
title="AA" (1 line), stereotype `<<O-O>>`, attribute "entry /
set_timeout()" (1 line):

- **`<<O-O>>` is not a text stereotype.** `Stereotype.isWithOOSymbol()`
  (`Stereotype.java:119-121`) is a sentinel checked by
  `Cluster.drawUState` (`Cluster.java:504-507`) to draw a small
  ball-and-socket decoration at the box's bottom-right corner — it is
  **not** rendered as header text and (empirically, confirmed by the
  exact-match below) contributes **0** to `stereoLines`. This resolves
  the "stereotype term unverified" open item left by G6 T6's own doc
  comment (`state-composite-cluster.ts:72-80`) for this specific
  stereotype value — general stereotype-visibility rules for
  *ordinary* (non-sentinel) stereotypes on state clusters remain
  unverified and are out of T8's scope; do not extrapolate this single
  data point to the general case.
- `titleAndAttributeHeight = (0+1)*14 + 1*14 + 5 = 33`; DOT
  `HEIGHT = 33-5 = 28`. Jar's cached `svek-3.dot`:
  `subgraph cluster15ee {label=<<TABLE ... HEIGHT="28">`. **Exact.**
- `titleAndAttributeWidth = max(measure("AA",14), measure("entry /
  set_timeout()",14)) = max(18.725, 116.4625) = 116.4625 → (int) 116`.
  Jar's cached DOT: `WIDTH="116"`. **Exact.**

Also re-confirmed on `bitaxo-18-tamo974`'s `C` (title="C", no
stereo/attr): `(0+1)*14 = 14`, DOT `HEIGHT=14-5=9` — matches cached
`WIDTH="10" HEIGHT="9"` exactly (width 10 is jar's own int-truncated
`measure("C",14)`, not independently re-derived here — this port's
`WidthTableMeasurer` is already established jar-exact, G5 C0).

### 2b. Header-to-divider gap and title baseline — REUSE, not new

Both already-implemented, already-jar-calibrated constants in
`state-composite-cluster.ts` hold **unchanged** for the WithLabel
family — re-confirmed on all 3 fixtures below (not merely assumed from
C3's own doc comment):

- `CLUSTER_HEADER_HEIGHT = 19` (`state-composite-cluster.ts:169`): AA
  divider at y=167, box top y=148 → gap=19. CompositeState (kotagu):
  divider y=26, top y=7 → gap=19. **Exact, both.**
- `CLUSTER_TITLE_BASELINE_MARGIN`: the WithLabel family uses **5**, not
  the plain branch's **4** — this was already found by C3's corpus
  sweep (`state-composite-cluster.ts:145-159`, "BIMODAL... 15.8889 for
  36 [samples]... every 15.8889-offset sample belongs to [the]
  20-fixture entrypoint/exitpoint family") but never wired into
  `titleTableEligible`. Re-confirmed independently here: AA title y=
  163.8889, box top=148 → offset 15.8889 = 5 + textAscent(14)(10.8889).
  CompositeState: title y=22.8889, top=7 → offset 15.8889. **Exact,
  both.** T9 needs a second constant
  (`CLUSTER_TITLE_BASELINE_MARGIN_EE = 5`) selected when
  `hasBorderPointChildren`, not a new derivation.

### 2c. Outer cluster geometry — NEW: `FrontierCalculator` (not yet ported)

This is the actual missing mechanism. Jar does **not** use graphviz's
raw cluster polygon as a border-point cluster's final box. It uses it
only as a **fallback/starting frame** (`initial`), then recomputes a
tighter, content-aware box via `FrontierCalculator`
(`FrontierCalculator.java`, full file, 169 lines — small, no
approximation possible/needed, port it whole):

```
RADIUS = 6                          // EntityPosition.RADIUS = this port's BORDER_POINT_SIZE/2
DELTA  = 3 * RADIUS = 18

frontierCalculator(initial, insides, points, rankdir):
  # 1. seed `core`
  core = bbox-union(insides)                     # or, if insides is empty:
  if insides is empty:
    c = initial.center
    core = RectangleArea(c.x-1, c.y-1, c.x+1, c.y+1)   # degenerate 2x2 seed

  # 2. extend to cover every border-point center
  for p in points: core = core.merge(p)

  # 3. touch/fallback: an axis-extreme boundary keeps its `core` value
  #    ONLY if some point sits exactly ON it; otherwise it resets to
  #    `initial`'s corresponding boundary
  for each of {minX, maxX, minY, maxY}:
    if no point in `points` has that exact coordinate on `core`:
      core.<bound> = initial.<bound>

  # 4. push detection (DELTA-radius corner test)
  for p in points:
    if p.y == core.minY or p.y == core.maxY:
      if |p.x - core.maxX| < DELTA: pushMaxX = true
      if |p.x - core.minX| < DELTA: pushMinX = true
    if p.x == core.minX or p.x == core.maxX:
      if |p.y - core.maxY| < DELTA: pushMaxY = true
      if |p.y - core.minY| < DELTA: pushMinY = true

  # 5. corner exclusion (rankdir-dependent — state diagrams: TOP_TO_BOTTOM,
  #    the `else` branch; only ever verified against TB fixtures here)
  for p in points:
    if rankdir == LEFT_TO_RIGHT:
      if p.x==core.minX and (p.y==core.minY or p.y==core.maxY): pushMinX=false
      if p.x==core.maxX and (p.y==core.minY or p.y==core.maxY): pushMaxX=false
    else:
      if p.y==core.minY and (p.x==core.minX or p.x==core.maxX): pushMinY=false
      if p.y==core.maxY and (p.x==core.minX or p.x==core.maxX): pushMaxY=false

  # 6. apply pushes
  if pushMaxX: core.maxX += DELTA
  if pushMinX: core.minX -= DELTA
  if pushMaxY: core.maxY += DELTA
  if pushMinY: core.minY -= DELTA

  return core

ensureMinWidth(core, minWidth, initial):          # Cluster.java:427-428, FrontierCalculator.java:154-167
  delta = (core.maxX - core.minX) - minWidth
  if delta < 0:
    newMinX = core.minX + delta/2
    newMaxX = core.maxX - delta/2
    error = newMinX - initial.minX
    if error < 0: newMinX -= error; newMaxX -= error
    core.minX, core.maxX = newMinX, newMaxX
```

**Term meanings, mapped to this port's data model:**

| jar term | this port |
|---|---|
| `initial` | `DotLayoutResult.clusters[cluster.id]` (the OUTER `cluster<N>` subgraph's real post-layout bbox — G5 C2's existing seam). **Precondition: `titleTableEligible`/`setHtmlAttr` must be wired for this family first (§3), or this field is absent/wrong-shaped for border-point clusters as of today.** |
| `insides` | direct non-border `directMembers`' post-layout boxes (`DotLayoutResult.nodes`) **+** direct child clusters' own (already-corrected, if they are themselves border-point clusters) boxes |
| `points` | direct border-point `directMembers`' post-layout box **centers** (`DotLayoutResult.nodes[id]`, center = `x+width/2, y+height/2`) — works uniformly for both the 12×12 basic-rect form and the wide-HTML-table form (§2d), since the 12×12 port cell sits horizontally centered inside the wider table |
| `rankdir` | `ctx.theme`'s rankdir (state diagrams: TOP_TO_BOTTOM in every fixture checked this iteration — the `else`/non-LTR branch) |
| `ensureMinWidth` minWidth | `computeTitleTableHeight`'s sibling, `titleAndAttributeWidth + 10` (already computed as `title.width` in `measureClusterTitle`, §2a) |

Not a re-derivation from scratch — `FrontierCalculator.java` is small,
closed-form, and has no upstream ambiguity; the term mapping above is
the only translation work.

### 2d. Border-point node's own width (already ported — cross-reference only)

`SvekNode#getMaxWidthFromLabelForEntryExit` (`SvekNode.java:168-178`) →
`EntityImageStateBorder#getMaxWidthFromLabelForEntryExit`
(`EntityImageStateBorder.java:110-114`, returns the border point's own
label-text width) feeds `appendLabelHtmlSpecialForPort`
(`SvekNode.java:180-186`): if that text width exceeds 40px, the node
becomes a `shape=plaintext` HTML table with 12×12 `PORT="P"` cell
flanked by `max(10, width2-40)`-wide padding cells (`SvekNode.java:189-205`);
otherwise a plain `shape=rect,width=12,height=12` (`SvekNode.java:207-220`).
**This port already has this exact mechanism**:
`state-leaf-node.ts:38-61` (`BORDER_POINT_SIZE=12`,
`PORT_LABEL_WIDE_THRESHOLD=40`, `PORT_TABLE_PAD_FLOOR=10`,
`node.portPad = Math.max(PORT_TABLE_PAD_FLOOR, labelWidth -
PORT_LABEL_WIDE_THRESHOLD)`) and `svek-dot-emit.ts:119-131`
(`portTable`, wired via `node.isPort`). Confirmed exercised in the real
corpus: `jucori-40-cevo136`'s `Aentry1`/`Aexit1` (longer labels) emit
the wide HTML form in jar's cached `svek-1.dot`; `pesita`'s `aa_ok_ex`
and `bitaxo`'s `d` (short labels) emit the basic form. **No change
needed here.** `points` (§2c) only ever needs the node's post-layout
*center*, which is identical under either form (the port cell is
horizontally centered), so `FrontierCalculator`'s port does not need
to special-case which form a given border point took.

## 3. DOT/graphviz-builder shape

### 3a. Text emitter (`svek-dot-emit.ts`) — already correct, verify only

Diffed jar's cached `svek-3.dot` (pesita) against this port's
`portClusterBlock`/`portChainLines` (`svek-dot-emit.ts:229-305`)
line-shape by line-shape. Structurally identical:

```
subgraph cluster# {style=solid;color=...;labeljust="c";{rank=sink;<port ids>;}
<port node lines (basic or wide-HTML per §2d)>
subgraph cluster#ee {label=<TABLE ...>;<anchor point>;<non-port members>;
  <nested child clusters, if any>
}}
```

matches `ClusterDotString.java:135-141` (rank groups first, `hasPort()`
false ⇒ `subgraphClusterWithLabel(ee, label)`) + `printRanks`
(`ClusterDotString.java:254-287`, no chain when `hasPort()` is false —
this port's own `if (!labelOnEe) out.push(...portChainLines(...))`,
`svek-dot-emit.ts:288`, already encodes exactly this). **No emitter
change required** — this is why the state DOT gate is already
267/267.

### 3b. Real layout builder (`graph-layout-build.ts#addClusters`) — MISSING

This is the actual gap for the **layout** path (distinct from the
text-emitter path above, which the DOT-parity gate exercises but the
real render pipeline does not consume — `svek-dot-emit.ts:1-6`'s own
header comment: "NOT on the layout path"). Today `addClusters`
(`graph-layout-build.ts:129-193`) builds exactly one of:

- a flat subgraph (`sg.addNode(id)` for every `nodeIds` member), or
- (when `innerMarginLevels` is set) a **fixed two-level** `p1`/`i`
  nesting for the C7 margin mechanism.

Neither shape matches what §2a-§2c need: an OUTER subgraph holding
**only the rank-group + border-point node lines**, wrapping an INNER
`${id}ee` subgraph that carries **the title-table `setHtmlAttr`** and
**the non-port members** (anchor + any nested normal content). T9 must
add a third branch, gated on `hasBorderPointChildren` (a new
`DotInputCluster` field the emitter side already treats as
`portRanksLabelOnEe`, but `addClusters` does not read at all today —
confirmed: `grep portRanksLabelOnEe src/core/graph-layout-build.ts` →
zero matches):

```
sg = parent.addSubgraph(nameFor(c), {})       // OUTER — no label here
for (id of portMemberIds) sg.addNode(id)      // border-point nodes only
ee = sg.addSubgraph(`${outerName}ee`, {})
ee.setHtmlAttr('label', <TABLE FIXEDSIZE WIDTH=titleTableWidth HEIGHT=titleTableHeight>)
for (id of nonPortMemberIds) ee.addNode(id)   // anchor + normal members + nested clusters
```

`DotLayoutResult.clusters[c.id]` (G5 C2 seam) will then report the
OUTER subgraph's bbox — which is exactly `initial` in §2c, confirmed
by construction: jar's `DotStringFactory.java:429` looks up a
cluster's raw bbox by `cluster.getColor()`, which is the SAME outer
subgraph jar's own `ClusterDotString.java:117-119` colors — never the
inner `ee` one.

## 4. Predictions (jar-verified, ground truth from cached oracle)

All three verified by: (1) extracting jar's real oracle `<rect>` for
the composite (`in.svg`, `data-qualified-name`-tagged), (2) running
real `dot -Tsvg` (graphviz 15.1.0, this machine) directly on jar's own
cached `svek-N.dot` text for the *initial* raw cluster bbox and every
member's post-layout position, (3) hand-applying §2c's algorithm to
those inputs, (4) comparing to (1). This is an independent
re-derivation, not a readback of the oracle.

| Fixture / composite | jar real bbox (w×h) | `insides` | `points` | FrontierCalculator predicted (w×h) | Match |
|---|---|---|---|---|---|
| `pesita-10-dene726` / `AA` | **126 × 104.72** | `[]` (no normal direct member) | `[aa_ok_ex center]` | **126 × 104.72** (push: `pushMinX` fires, `DELTA=18`; then `ensureMinWidth(126)` re-centers) | **Exact, both dims** |
| `bitaxo-18-tamo974` / `C` | **42 × 101.72** | `[]` | `[d center]` | **42 × 101.36** (no pushes fire) | Width exact; height off 0.36px — attributed to local-`dot` (15.1.0) vs jar's pinned graphviz version HTML-table/point-node rounding, not the formula (see §5 ruled-out #4; `pesita`/`kotagu` both landed exact using the same probe method, so this is fixture-specific tool noise, not systematic) |
| `kotagu-43-miza629` / `CompositeState` | **289 × 358** | `[SubComposite bbox: 191×277, itself exact via the existing C3/C7 plain-cluster path]` | `[entry1 center]` | **289 × 358** (no pushes fire — `touchMaxX` true, both Y-bounds fall back to `initial`) | **Exact, both dims — validates the `insides`-nonempty / nested-cluster branch** |

`jucori-40-cevo136` (`A`/`B`, both entry+exit, source **and** sink
ranks populated) was read for the DOT-shape check (§3a, wide-HTML-table
confirmation) but **not** used as a numeric FrontierCalculator
prediction: this port's local `dot` binary mis-renders jar's own wide
HTML port table (`table size too small for content` /
`port P unrecognized` warnings; the reproduced node collapsed to the
inner 12×12 cell instead of the padded outer table), an independently-
confirmed probe-tool limitation unrelated to the formula (§5 #4). Do
not treat `jucori`/`fukexa`/`kotagu`'s zaent-node interactions as
needing separate modeling: `zaent<N>` is never a `Cluster.nodes` member
(it's added as raw DOT text, not an `Entity`-backed `SvekNode` —
`Cluster.java:178-181`'s `addNode`, called only from the real
entity-materialization path, never for the special point) and
therefore contributes to neither `insides` nor `points` in any fixture
checked.

## 5. Ruled out

1. **A WithLabel-specific title-table width/height formula distinct
   from the plain-cluster one.** Ruled out by exact match (§2a) on two
   fixtures (`AA`: 116×28, jar-exact; `C`: HEIGHT=9, jar-exact) using
   the plain branch's existing, unmodified
   `computeTitleTableHeight`/`title.width` — `ClusterDotString.java:121-141`
   confirms both branches share the identical `label` string, only its
   subgraph placement differs.
2. **The border-point node's own DOT width/shape as an unported gap.**
   Ruled out by direct read of `state-leaf-node.ts:38-61` +
   `state-entity-position.ts` + `svek-dot-emit.ts:119-131` — this exact
   mechanism (`getMaxWidthFromLabelForEntryExit`/
   `appendLabelHtmlSpecialForPort`) is already faithfully ported,
   correct constants (`BORDER_POINT_SIZE=12`, threshold=40, pad
   floor=10), and already exercised correctly in the corpus (jucori's
   wide form vs. pesita/bitaxo's basic form).
3. **A classification-level (`isAutarkic`/`kindOf`) divergence for the
   border-point family.** Ruled out by C8's own prior direct-probe
   finding (`ledger.md` §C8, `pesita-10-dene726`): `classify.kindOf.get
   ('nasreq_auth') === 'cluster'` already matches jar; the
   `class="entity"` vs `class="cluster"` gap is a separate, pre-existing,
   unrelated, already-named cosmetic divergence (renderer never emits
   `class="cluster"` for any composite kind), invisible to
   `maxSizeDeltaIn`.
4. **A formula defect explaining `bitaxo`'s 0.36px height residual.**
   Ruled out as evidence against the derivation: the SAME probe method
   (independent `dot -Tsvg` re-run + hand-applied FrontierCalculator)
   landed **exact** on both dimensions for `pesita` and **both**
   dimensions for `kotagu` — a formula-level error would not
   selectively miss by a sub-pixel amount on exactly one of three
   fixtures while landing exact on the other two, including one
   (`kotagu`) that exercises a strictly more complex code path
   (`insides` nonempty + nested cluster). The residual's magnitude
   (0.36px) exactly matches graphviz's own minimum-point-node radius
   (the `zaent`/anchor ellipse's `rx=ry=0.36` in every cached SVG this
   iteration touched) — consistent with a rounding/version difference
   between this machine's `dot` 15.1.0 and jar's pinned graphviz build,
   not the ported algorithm.
5. **`innerMarginLevels`/C7's "p0"/"p1"/"i" protection-wrapper margin
   mechanism applying to the WithLabel family.** Ruled out by direct
   source read: `ClusterDotString.java:107-112` force-sets
   `protection0 = protection1 = false` whenever
   `entityPositionsExceptNormal.size() > 0` — i.e., exactly
   `hasBorderPointChildren`. Confirmed structurally against jar's own
   cached DOT for `AA` (`cluster15` has no `cluster15p0`/`cluster15p1`
   sibling, only the (unrelated, unaffected) ancestor `cluster15a` "a"
   wrapper). `innerMarginLevels` must stay **absent** (not `1`/`2`) for
   border-point clusters — this is already the current (accidentally
   correct, since the field is gated on `titleTableEligible` which is
   currently false for this family) behavior; T9 must not extend
   `innerMarginLevels` assignment to the relaxed gate.
6. **The `Cluster.java:98-99` "a" wrapper (`thereALinkFromOrToGroup1`)
   as a geometry contributor needing separate modeling.** Ruled out:
   it is an ancestor subgraph, outside the cluster whose bbox
   `manageEntryExitPoint` reads (`cluster.getColor()`, which is the
   `cluster15`-equivalent inner subgraph, not `cluster15a`) — confirmed
   by using `AA`'s (`cluster15`'s) own polygon directly as `initial`
   and landing an exact match; had the "a" wrapper's own margin leaked
   into `AA`'s reported bbox, the byte-exact match would not have
   occurred. No "a"-equivalent subgraph needs to be built by
   `addClusters`.

## 6. Open items — named, not chased (out of T8's authorized scope)

1. **Nested border-point-cluster-within-border-point-cluster
   correction order.** `manageEntryExitPoint` runs during `Cluster
   .drawU` (`Cluster.java:343-345`), and reads a **direct child**
   cluster's `getRectangleArea()` (`Cluster.java:419-423`) for
   `insides`. Whether jar's traversal guarantees a child border-point
   cluster's own `manageEntryExitPoint`-corrected box is available
   before the parent's runs was not verified — no fixture in the
   20-fixture family checked this iteration nests one WithLabel
   cluster directly inside another. T9 should implement
   `materializeCluster`'s correction bottom-up (children corrected
   before the parent reads their box) as the reasonable default, but
   this is unverified against a real fixture; flag rather than guess
   if the family sweep (T10) turns up such a case.
2. **General stereotype-visibility rule for non-sentinel stereotypes**
   on state cluster headers (`CucaDiagram.java:573-598`'s
   `isStereotypeLabelShown`/`getVisibleStereotypeLabels`) — only the
   `<<O-O>>` sentinel case was resolved (§2a); an ordinary visible
   stereotype's contribution to `stereoLines` remains the SAME
   "unverified, not found to fail" state G6 T6 already left it in.
   Out of scope for the border-point family specifically.
3. **`rankdir=LEFT_TO_RIGHT` corner-exclusion branch** (§2c step 5,
   the `if` side never taken by any fixture in this corpus) is ported
   faithfully from source but has zero fixture coverage this
   iteration — every checked fixture is TOP_TO_BOTTOM.

## 7. Symbol map (jar → this port)

| jar symbol | this port | Status |
|---|---|---|
| `ClusterHeader` (title/attr width+height) | `measureClusterTitle` + `titleAndAttributeHeight` + `computeTitleTableHeight` (`state-composite-cluster.ts:37-99`) | **Reuse as-is** — no change |
| `ClusterDotString.printInternal`'s WithLabel branch | `svek-dot-emit.ts#portClusterBlock` | **Already correct** — no change |
| `EntityPosition.getDimension`/`SvekNode #getMaxWidthFromLabelForEntryExit` | `state-leaf-node.ts` + `state-entity-position.ts` | **Already correct** — no change |
| `Cluster#manageEntryExitPoint` | *(none — new)* | **NEW**: `state-composite-geo.ts#materializeCluster`, gated on `hasBorderPointChildren`, invoked after `DotLayoutResult` is available |
| `FrontierCalculator` (whole class) | *(none — new)* | **NEW**: a small pure function, e.g. `state-composite-frontier.ts` or inline in `state-composite-geo.ts` — T9's call, name per D5's upstream-naming convention (suggest `frontierCalculator`/`FrontierCalculator` to keep the jar grep-map) |
| `DotStringFactory`'s `cluster.setPosition(min,max)` (raw graphviz bbox capture) | `DotLayoutResult.clusters[c.id]` (G5 C2 seam) | **Already exists** — reused as `initial`, contingent on §3b |
| `ClusterDotString`'s outer/`${id}ee` two-level subgraph nesting (real layout, not just text) | *(none — new)* | **NEW**: `graph-layout-build.ts#addClusters`, third branch alongside the existing flat/`innerMarginLevels` branches |
| `resolveClusterComposite`'s `titleTableEligible` | `state-composite-cluster.ts:377-380` | **Change**: drop the `!hasBorderPointChildren` conjunct (exact gate change below) — `insideAutonomPass` and `ctx.theme.fontSize === 14` stay untouched per T9's own boundary |

### Exact gate change

```diff
- const titleTableEligible =
-   ctx.theme.fontSize === 14 &&
-   !hasBorderPointChildren &&
-   ctx.insideAutonomPass !== true;
+ const titleTableEligible =
+   ctx.theme.fontSize === 14 &&
+   ctx.insideAutonomPass !== true;
```

`hasBorderPointChildren` remains a **live, needed** local (it still
gates `applyBorderPointRanks`'s call site and must additionally gate:
(a) which `CLUSTER_TITLE_BASELINE_MARGIN` constant is selected — 4
plain / 5 WithLabel, §2b; (b) `addClusters`'s new outer/`ee` nesting
branch, §3b; (c) whether `materializeCluster` runs the new
`FrontierCalculator` correction pass, §2c; (d) `innerMarginLevels`
must NOT be set when `hasBorderPointChildren` — §5 item 5). It is only
the `titleTableEligible` boolean itself whose conjunct list shrinks.

## 8. Fixtures/paths used

- `test-results/dot-cache/state/pesita-10-dene726/{in.puml,in.svg,svek-3.dot}`
- `test-results/dot-cache/state/bitaxo-18-tamo974/{in.puml,in.svg,svek-1.dot}`
- `test-results/dot-cache/state/kotagu-43-miza629/{in.puml,in.svg,svek-1.dot}`
- `test-results/dot-cache/state/jucori-40-cevo136/{in.puml,in.svg,svek-1.dot}` (DOT-shape/wide-table cross-check only, §3a/§4)
- jar: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/{Cluster,ClusterDotString,ClusterHeader,FrontierCalculator,SvekNode}.java`, `svek/image/{AbstractEntityImageBorder,EntityImageStateBorder}.java`, `abel/EntityPosition.java`, `stereo/Stereotype.java`, `net/atmp/CucaDiagram.java`
- No production files modified; no probe scripts left behind (`dot -Tsvg`/inline `python3` only, outputs written to the session scratchpad, not the repo).

---

# Round 2 (orchestrator-authorized continuation)

**Verdict: ISOLATED.** Both missing pieces T9 diagnosed are now fully
specified with citations and empirically confirmed against graphviz-ts's
real layout engine (not just the DOT-parity text emitter). Round 1's
FrontierCalculator predictions (§4) are **unchanged** — they were
computed from `initial`/`insides`/`points` values read off jar's own
real cached DOT, which already has the correct rank/`i`-wrapper shape
baked in. What was missing is purely *how T9's `addClusters` must
build the graphviz-ts input* to reproduce that same `initial`. Round 1
under-specified this; this round closes it.

## Round 2 method note

Everything below was verified with disposable probes
(`scripts/_tmp-g6-t8-round2-*.ts`, `npx tsx`, deleted before finishing)
that call graphviz-ts's **real programmatic builder + layout engine**
directly (`createGraph`/`addSubgraph`/`render`/`getLayout` — the exact
functions `graph-layout.ts`/`graph-layout-build.ts` use), not the DOT
text emitter. This is the "run the builder-emitted equivalent"
differential the task asked for, done directly against the layout
engine rather than by parsing jar's DOT text through it (jar's DOT
already includes both mechanisms, so parsing it would only re-confirm
Round 1, not test the builder path T9 actually writes to).

## rankSpec

**Semantics.** `ClusterDotString.java:135-137` — for a `hasBorderPointChildren`
cluster, `printRanks(RANK_SOURCE="source", inputs)` then
`printRanks(RANK_SINK="sink", outputs)` (`Cluster.java:102-103`) each
emit, when their node list is non-empty
(`ClusterDotString.java:254-287`): an anonymous `{rank=<source|sink>;
<port ids>;}` block, **followed immediately by** each port node's own
shape line, both **direct children of the OUTER cluster subgraph** —
siblings of `${id}ee`, not nested inside it (confirmed structurally:
`ClusterDotString.java:136-141` — both `printRanks` calls execute
*before* `${id}ee` opens). Re-confirmed on all three fixtures' cached
DOT: `pesita`'s `AA` (`{rank=sink;sh0019;}` then `sh0019[...]`, both
inside `cluster15{}`, before `cluster15ee{` opens); `jucori`'s `A`
(**both** `{rank=source;sh0010;}` **and** `{rank=sink;sh0011;}` present,
one per populated rank, same cluster, same sibling position);
`bitaxo`/`kotagu` (single rank each, `source` for `kotagu`'s `entry1`,
`sink` for `bitaxo`'s `d`).

**Firing condition.** One rank group per non-empty
`{isInputPosition, isOutputPosition}` partition of the cluster's DIRECT
border-point members — this port already computes exactly this
partition in `applyBorderPointRanks` (`state-composite-cluster.ts:466-480`)
and stores it as `DotInputCluster.portRanks` (`{rank:'source'|'sink',
nodeIds}[]`). **No new data is needed** — `portRanks` already has the
right shape; it is simply never read by the real-layout builder
(`graph-layout-build.ts#addClusters`) today, only by the DOT-parity
text emitter (`svek-dot-emit.ts:249-258`, confirmed by grep — zero
`portRanks` references in `graph-layout-build.ts`).

**Builder-API verdict: the graphviz-ts programmatic builder CAN express
this — with one non-obvious placement requirement, confirmed by a
minimal repro that reproduces T9's own failure mode.**

`GvGraphBuilder.addSubgraph(name, attrs?)` accepts an arbitrary
`Record<string,string>` attrs bag (`node_modules/graphviz-ts/dist/api/builder.d.ts:57`).
graphviz-ts's real rank-assignment code (not the emitter) reads a
subgraph's `rank` attribute directly:
`csRanksetKind(g)` (`node_modules/graphviz-ts/dist/index.js`, the
function immediately preceding `csSetupCluster`/`csProcessRankset`) —
`g.attrs.get("rank")` mapped `"source"→SOURCERANK`, `"sink"→SINKRANK`
etc., the direct port of `dotgen/rank.c`'s cluster-local ranking pass.
So `sg.addSubgraph(name, {rank: 'source'})` **is** the correct builder
call — **but only when `sg` is the border-point cluster's own handle**,
not the root graph builder.

**Minimal repro, confirms the failure mode.** Built a 2-node graph
(one `shape=rect` port node, one `shape=point` anchor) inside one
cluster with a jar-shaped title table, twice:

1. Rank subgraph as a child of the **root** builder (mirroring this
   port's existing, already-working `addNodes`-level rank mechanism,
   `graph-layout-build.ts:83-98`, used today for TOP-level
   `{rank=...}` groups — e.g. state pseudo-node ranks). Result:
   `Warning: port1 was already in a rankset, deleted from cluster unix`
   printed by graphviz-ts (`node_modules/graphviz-ts/dist/index.js`,
   `markClusterNode`: `if ((n.info.ranktype ?? 0) !== 0) { console.error(...);
   agDeleteFromCluster(clust, n); return; }` — a faithful port of real
   graphviz's `dotgen/rank.c` cluster/rankset conflict rule: a node
   whose rank was already claimed by a **shallower**-scope rankset gets
   forcibly evicted from any cluster that tries to claim it afterward).
   The node's Y position DID move (rank was honored), but the CLUSTER's
   own reported bbox from `getLayout().clusters` did **not** grow to
   include it (stayed identical to the no-rank-constraint case) — this
   is the mechanism, precisely, behind T9's narrow/wrong `initial`.
2. Rank subgraph as a child of the **cluster's own builder handle**
   (`sg.addSubgraph(...)`, `sg` = what `addClusters#builderFor` already
   returns) — sibling of the `${id}ee` subgraph, matching jar's own
   nesting exactly. No warning. The cluster's reported bbox **correctly
   grew** to include the rank-forced node position (height 68.72→108.72
   in the repro's exact numbers — a real, load-bearing difference, not
   noise).

**Conclusion: `addClusters` (not `addNodes`) must build the rank
subgraph(s), as children of each `hasBorderPointChildren` cluster's own
`sg` handle, one `sg.addSubgraph(<synthetic name>, {rank})` per entry
in `cluster.portRanks`, each populated via `.addNode(id)` for every id
in that rank group — plus the SAME id also added directly to `sg`
(`sg.addNode(id)`, matching jar's separately-emitted node shape line,
`ClusterDotString.java:263-264`).** This is the exact fix; the builder
API needed no workaround, only correct **placement** (this port's
EXISTING root-level rank mechanism, reused unmodified, is the wrong
tool for a cluster-scoped rank constraint — it is not a bug in that
mechanism, it's simply not the right call site for this family).
Synthetic subgraph names must avoid both `addNodes`'s own `__rank_N`
counter and the DOT-parity comparator's `^cluster\d+$` regex (mirroring
C7's `${outerName}i`/`${outerName}p1` naming precedent) — suggest
`${outerName}rank_source` / `${outerName}rank_sink`.

## iWrapperSpec

**Full DOT shape.** `ClusterDotString.java:151-152`:
`subgraphClusterNoLabel(sb, "i")` → `subgraph ${clusterId}i {label="";`
— a plain, unlabeled, otherwise-attributeless graphviz subgraph
(`style`/`color` are NOT set on it, unlike the outer cluster — confirmed
by reading `subgraphClusterNoLabel`/`subgraphClusterWithLabel`,
`ClusterDotString.java:245-252`, which only ever writes `label=`).
It opens **inside** the already-open `${id}ee` subgraph (textually
between `${id}ee`'s open at line 141 and the anchor/member content at
174-184) and wraps: the fallback anchor-point declaration when
`added==null` (`ClusterDotString.java:182-184`), and — when present —
any other non-port direct content `printCluster1`/`printCluster2`
place there (real members, nested child clusters). It contributes its
own graphviz default `CL_OFFSET`(8pt) cluster margin around whatever it
wraps, exactly like C7's already-ported "i"/"p1" mechanism for the
plain-cluster case (`graph-layout.types.ts:206-231`) — **same
mechanism, different position** (inside `${id}ee` for this family,
instead of directly inside the outer cluster for the plain-cluster
family). Confirmed non-trivial by probe (§ below): a border-point
cluster's outer bbox height changed by a measurable amount (not
noise-level) with vs. without this wrapper, holding the rank mechanism
fixed correct in both runs.

**Exact firing condition.** `thereALinkFromOrToGroup1`
(`ClusterDotString.java:91-96`) — which for every fixture in this
corpus (`useProtectionWhenThereALinkFromOrToGroup` true, per G5 C3's
own already-recorded corpus-wide finding, `state-composite-cluster.ts:126-131`'s
doc comment) is **identically** `thereALinkFromOrToGroup2` =
`isThereALinkFromOrToGroup(lines)` (`ClusterDotString.java:317-323`) =
"some link's `entity1` or `entity2` **is** (identity, not descendant)
this composite's own group entity" (`SvekEdge.java:1270-1272`,
`isLinkFromOrTo`).

**How this port already computes it.** This is **exactly**
`isGroupTouched(s.id, allTransitions)`
(`state-composite-detect.ts:221-223`: `allTransitions.some(t => t.from
=== id || t.to === id)`), already exported and already used inside
`state-composite-classify.ts:187` (`const touched =
isGroupTouched(s.id, allTransitions)`) to compute the **broader**
`needsAnchor`/`needsZaentPoint` sets. **Do not reuse
`needsZaentPoint.has(s.id)` for the `i`-wrapper condition** —
`needsZaentPoint` is a wider OR (`touched || (hasDirectBorderPointChild
&& !hasNonBorderEeContent)`, `state-composite-classify.ts:199-201`) that
conflates jar's TWO independent triggers for "a zaent point node exists
at all" (line 148-149's unconditional declare vs. line 182-184's
`added==null` fallback) — only the narrower `touched` half (=
`thereALinkFromOrToGroup1`/`2`) gates the `i`-**wrapper structure**
itself. Confirmed by the fixture walkthroughs below: `bitaxo`'s `C` has
`needsZaentPoint`=true (zaent0003 exists, via the fallback path) but
`isGroupTouched('C')`=false (zero transitions in the whole diagram) —
**no `i` wrapper** — while `pesita`'s `AA` has `isGroupTouched('AA')`=true
(`[*] --> AA`, `AA --> Closing`) — **`i` wrapper present**. Reusing
`needsZaentPoint` for the wrapper condition would have wrongly opened
an `i` wrapper for `bitaxo`, contradicting its own cached DOT.

`ctx.classify.allTransitions` is already on `ClassifyResult`
(`state-composite-classify.ts:70`), so `resolveClusterComposite` can
call `isGroupTouched(s.id, ctx.classify.allTransitions)` directly — no
new `ClassifyResult` field, no new computation, just a direct call to
an already-exported, already-correct function at the point the
`hasBorderPointChildren` branch needs it.

**Builder-side placement (parallel to `rankSpec`).** `i` = `ee.addSubgraph(<name>,
{})` (child of the `ee` handle, sibling position to whatever member
nodes/nested clusters go there); every id that would go directly into
`ee` when `i` is absent goes into `i` instead when
`isGroupTouched(s.id, ...)` is true. Confirmed via probe: **not**
placing the anchor node inside a genuine nested subgraph (i.e., just
adding it to `ee` directly regardless) undercounts the outer cluster's
margin and produces a smaller bbox than jar's real one.

## Minimal-repro evidence (probe results, both mechanisms)

Two disposable probes (`scripts/_tmp-g6-t8-round2-rank-probe(2).ts`,
`scripts/_tmp-g6-t8-round2-iwrapper-probe.ts`, all deleted before
finishing), calling `createGraph`/`addSubgraph`/`render`/`getLayout`
directly (the real layout engine, not DOT text):

| Variant | port node Y | outer cluster bbox (w×h) | Note |
|---|---|---|---|
| No rank constraint | same rank as anchor | 132×68.72 | baseline |
| Rank constraint, **root**-level subgraph | moved (rank honored) | **132×68.72 — unchanged** | graphviz-ts evicts the node from the cluster (`markClusterNode` conflict path) before computing the cluster bbox — this is T9's exact failure mode |
| Rank constraint, **cluster**-level (nested) subgraph | moved (rank honored) | **132×108.72 — correctly grew** | matches jar's real nesting |
| `i` wrapper absent (anchor added directly to `ee`), rank correct | — | 132×80.00 | |
| `i` wrapper present (anchor added to a nested `${id}i` inside `ee`), rank correct | — | 132×84.72 | +4.72 — real, not noise |

Both differentials are measured with the *other* mechanism already
correct, isolating each one's own contribution — neither result is
confounded by the other.

## Updated per-fixture DOT-shape walkthroughs

### `pesita-10-dene726` / `AA` — both mechanisms fire

```
subgraph cluster15a {label="";                      # "a" — thereALinkFromOrToGroup1, layout-irrelevant (Round 1 §5-6)
 subgraph cluster15p0 {label="";                     # NOT present — protection0 forced false (hasBorderPointChildren)
  subgraph cluster15 {style=solid;color=#00000f;labeljust="c";
   {rank=sink;sh0019;}                                # rankSpec: EXIT_POINT → sink; sh0019 = aa_ok_ex
   sh0019 [shape=rect,width=12,height=12,...];
   subgraph cluster15ee {
     label=<TABLE FIXEDSIZE WIDTH=116 HEIGHT=28>;      # SAME formula as plain branch (Round 1 §2a) — unchanged
     zaent0002 [shape=point,...];                      # thereALinkFromOrToGroup2 unconditional declare (line 148-149)
     subgraph cluster15i {label="";                    # iWrapperSpec: isGroupTouched('AA')==true → PRESENT
       zaent0002 [shape=point,...];                    # "added==null" fallback re-declare (line 182-184; same id)
     }
   }
  }
 }
}
```
(no `cluster15p0`/`cluster15p1` — `protection0`/`protection1` forced
false by `entityPositionsExceptNormal.size()>0`, Round 1 §5 item 5,
unaffected by this round.)

**Builder translation** (`addClusters`, new branch): `sg = parent.addSubgraph('cluster15', {})`
→ `sg.addSubgraph('cluster15rank_sink', {rank:'sink'}).addNode('sh0019')`
+ `sg.addNode('sh0019')` → `ee = sg.addSubgraph('cluster15ee', {}); ee.setHtmlAttr('label', <TABLE...>)`
→ (since `isGroupTouched('AA')`) `i = ee.addSubgraph('cluster15i', {}); i.addNode('zaent-anchor-id')`.

**Predicted bbox: unchanged from Round 1 — 126 × 104.72** (computed
from jar's own real `initial`, which already reflects both mechanisms
correctly; Round 1's FrontierCalculator arithmetic itself does not
change).

### `bitaxo-18-tamo974` / `C` — rank only, no `i` wrapper

```
subgraph cluster6 {style=solid;color=#000006;labeljust="c";
 {rank=source;sh0010;}                                 # rankSpec: ENTRY_POINT → source; sh0010 = d
 sh0010 [shape=rect,width=12,height=12,...];
 subgraph cluster6ee {
   label=<TABLE FIXEDSIZE WIDTH=10 HEIGHT=9>;
   zaent0003 [shape=point,...];                         # "added==null" fallback ONLY — isGroupTouched('C')==false,
 }                                                       # so line 148-149's unconditional declare never fires either;
}                                                        # this is the SAME id, SAME shape, just via the other trigger
```
No `cluster6a`/`cluster6i` — `isGroupTouched('C', allTransitions)` is
**false** (bitaxo has zero transitions anywhere in the diagram).

**Predicted bbox: unchanged from Round 1 — 42 × ~101.72** (width exact;
height's 0.36px residual already attributed in Round 1 §5 item 4 to a
local-`dot`-version artifact, re-affirmed here since that residual
predates and is orthogonal to both Round 2 mechanisms — the rank/`i`
fixes do not touch bitaxo's height formula at all, they only matter to
`initial`, which for bitaxo was already correctly single-rank/no-`i`).

### `kotagu-43-miza629` / `CompositeState` — rank only, no `i` wrapper, PLUS a nested normal cluster

```
subgraph cluster6 {style=solid;color=#000006;labeljust="c";
 {rank=source;sh0010;}                                  # entry1 → source
 sh0010 [shape=rect,width=12,height=12,...];
 subgraph cluster6ee {
   label=<TABLE FIXEDSIZE WIDTH=99 HEIGHT=9>;
   sh0011 [shape=circle,...];                            # [*] pseudo-node — REAL, non-border content (isNormalPosition)
   subgraph cluster12a { ... SubComposite (its own independent cluster, own "a"/"p0"/"i"/"p1") ... }
 }
}
```
No `cluster6i` — `isGroupTouched('CompositeState', allTransitions)` is
**false** (`[*] -up-> SubComposite` and `entry1 --> B` both connect
*descendants*, never the `CompositeState` group entity itself).
`sh0011`/`SubComposite` sit **directly** inside `cluster6ee` (no
intervening wrapper) — this is the `insides`-nonempty case Round 1 §4
already exercised; nothing about it changes here.

**Predicted bbox: unchanged from Round 1 — 289 × 358** (both exact).
`SubComposite`'s own bbox (191×277, exact) is unaffected — it is a
plain (non-border-point) cluster, entirely on the pre-existing
C3/C7 path, outside both Round 2 mechanisms.

## Anything else the repro path revealed

- **The existing root-level `addNodes` rank mechanism is not reusable,
  and is not itself a bug** — it is correct for what it already does
  (this port's other, non-cluster-scoped `{rank=...}` groups); the
  border-point family simply needs its OWN, cluster-nested instance of
  the same underlying graphviz-ts feature (`{rank=...}` subgraph +
  `attrs`), built at a different call site (`addClusters`, not
  `addNodes`). T9 should **not** modify `addNodes`'s existing behavior
  or its `DotInputNode.attributes.rank` field/contract — that field/
  path stays exactly as-is for its current (non-cluster) callers. The
  border-point family needs a **cluster-scoped** analog, sourced from
  `DotInputCluster.portRanks` (already the right shape), not from
  `DotInputNode.attributes.rank`.
- **`markClusterNode`'s conflict-eviction is silent-ish** (a
  `console.error`, not a thrown exception) — if T9's fix is later
  regressed back toward the root-level placement, it will NOT fail
  loudly; the DOT gate (structural-only) and typecheck/lint will stay
  green while `maxSizeDeltaIn` silently regresses. Recommend T9 add a
  unit-test assertion on the actual `DotLayoutResult.clusters[...]`
  bbox value (not just DOT-shape presence) for at least one
  rank-bearing fixture, so a future accidental root-level placement is
  caught by the numeric regression, not just eyeballed.
- **No new graphviz-ts API gap was found.** Both mechanisms are fully
  expressible via the EXISTING public `GvGraphBuilder` surface
  (`addSubgraph`, `.addNode`, `.setHtmlAttr`) already imported by
  `graph-layout-build.ts` — no `docs/graphviz-issues/` filing needed
  for this round (contrast issue 07, the HTML-label-mark gap Round 1's
  own predecessor mission hit and had to file).

## Round 2 predictions summary

| Fixture / composite | jar real bbox (w×h) | Round 1 prediction | Round 2 prediction | Changed? |
|---|---|---|---|---|
| `pesita-10-dene726` / `AA` | 126 × 104.72 | 126 × 104.72 | **126 × 104.72** | No — mechanism gap was in the builder call site, not the formula |
| `bitaxo-18-tamo974` / `C` | 42 × 101.72 | 42 × 101.36 | **42 × 101.36** | No |
| `kotagu-43-miza629` / `CompositeState` | 289 × 358 | 289 × 358 | **289 × 358** | No |

## Round 2 files/paths used

- `node_modules/graphviz-ts/dist/api/builder.d.ts`,
  `node_modules/graphviz-ts/dist/index.js` (`csRanksetKind`,
  `markClusterNode`, `agDeleteFromCluster`)
- `src/core/graph-layout-build.ts` (`addNodes`'s existing rank
  mechanism, read for contrast — not modified)
- `src/diagrams/state/state-composite-detect.ts` (`isGroupTouched`,
  already exported)
- `src/diagrams/state/state-composite-classify.ts` (`needsZaentPoint`
  vs. `touched`, confirmed distinct)
- jar: `ClusterDotString.java:91-204`, `Cluster.java:102-103`,
  `SvekEdge.java:1270-1272`
- Cached DOT re-examined: `pesita-10-dene726/svek-3.dot`,
  `bitaxo-18-tamo974/svek-1.dot`, `kotagu-43-miza629/svek-1.dot`,
  `jucori-40-cevo136/svek-1.dot` (source+sink rank co-occurrence check)
- No production files modified; both probe scripts deleted
  (`scripts/_tmp-g6-t8-round2-rank-probe.ts`,
  `scripts/_tmp-g6-t8-round2-rank-probe2.ts`,
  `scripts/_tmp-g6-t8-round2-iwrapper-probe.ts`); `git status` clean
  of `src/`/`tests/`/`scripts/` changes.
