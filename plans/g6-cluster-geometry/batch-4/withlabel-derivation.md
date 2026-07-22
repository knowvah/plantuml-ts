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

---

# Paper gate (G7 T4)

**Verdict: PASS — all three targets reproduce EXACTLY.** No code was
written; no probe scripts were left in the repo (all arithmetic below
was done with `dot -Txdot` on the fixtures' already-cached, ground-truth
`svek-N.dot` files plus a disposable Python cross-check in the session
scratchpad, never `scripts/`). This closes the paper-gate stop condition
from Round 3 §4 for the three named targets; it does not re-derive
anything Rounds 1-3 already isolated (`FrontierCalculator` itself,
`titleAndAttributeHeight`, the builder call sequences) — it only walks
those already-verified pieces through concrete numbers end-to-end,
which no prior round had done against a byte-exact `initial` on this
machine's pinned `dot` 15.1.0 for all three fixtures simultaneously.

## Method

For each fixture: ran `dot -Txdot` (graphviz 15.1.0, this machine)
directly on the fixture's real cached jar DOT
(`test-results/dot-cache/state/<fixture>/svek-*.dot`) to obtain the
border-point cluster's raw `initial` bbox and every relevant member's
post-layout box/center — this is the exact input Round 3 §1's
"end-anchor confirmation" table already proved byte-exact vs.
graphviz-ts's own `getLayout()` (both `parse`+`render` text-path and,
per Round 3's isolation matrix, the programmatic builder path once
wired per Round 3 §2's call sequences). Then hand-applied
`frontierCalculator`/`ensureMinWidth` exactly as committed in
`src/diagrams/state/state-composite-frontier.ts` (read, not modified;
cross-checked with a disposable Python transliteration of that exact
file to eliminate manual-arithmetic error — output below, script not
retained). `insides`/`points` were read directly off the same `dot`
run, per the term mapping in §2c/Round 2/Round 3 §2 (no fixture-specific
terms — the same four-input contract, `initial`/`insides`/`points`/
`rankdir`, drives all three).

## Walkthrough 1 — `bitaxo-18-tamo974` / `C` (control)

**Context variables (Round 3 vocabulary):** rank group only (`sink`... 
correction: `{rank=source;sh0010;}` — ENTRY_POINT `d` → `source`), no
`${id}i` wrapper (`isGroupTouched('C', allTransitions) === false` — zero
transitions in the whole diagram), no nested child cluster, no parent
cluster wrapping `cluster6`. This is Round 3's C0 cell shape exactly.

- Title table (plain formula, no stereotype on `C`): width=10, height=9
  (cached DOT `cluster6ee` label `WIDTH="10" HEIGHT="9"`, jar-exact,
  already re-confirmed Round 1 §2a) — D4 irrelevant here (no
  `<<O-O>>`/no stereotype at all on `C`).
- `initial` (real `dot -Txdot` on `svek-1.dot`, `cluster6`'s own `bb`):
  `155,8,197,123.72` → **42 × 115.72** (raw, pre-correction).
- `insides = []` (no direct NORMAL-position member; `cluster6ee`
  contains only the anchor point `zaent0003`, which is excluded from
  `insides` per the term mapping).
- `points = [{x:176, y:109.72}]` (`sh0010`'s post-layout center; node
  drawn at `x∈[170,182], y∈[103.72,115.72]`, center = pos = `176,109.72`).
- **Frontier arithmetic:**
  1. seed (insides empty): degenerate box centered on `initial`'s
     center `(176, 65.86)` → `{minX:175, minY:64.86, maxX:177,
     maxY:66.86}`.
  2. merge point `(176,109.72)` → `{minX:175, minY:64.86, maxX:177,
     maxY:109.72}`.
  3. touch/fallback: point's `x=176` touches neither `175` nor `177` →
     both X bounds fall back to `initial` (`155`, `197`). Point's
     `y=109.72` touches `maxY` (`109.72`, kept) but not `minY` → `minY`
     falls back to `initial.minY = 8`. Core: `{155, 8, 197, 109.72}` →
     **42 × 101.72** (pre-push).
  4. push detection: `p.y == core.maxY` → checks `|176-197|=21` (not
     `<18`) and `|176-155|=21` (not `<18`) — **no push fires**.
  5. corner exclusion: no push flags set, no-op.
  6. `ensureMinWidth(minWidth = 10+10 = 20)`: current width 42 ≥ 20 →
     no-op.
- **Final: 42 × 101.72 — EXACT MATCH to target (42 × 101.72).**

This reproduces the decision-journal's own "batch-4 retry-3" byte-exact
bitaxo result independently, using this session's own `dot -Txdot` run
(not a readback of that journal entry) — confirms Round 1's ~0.36px
residual was a probe-tool/graphviz-version artifact, as Round 1 §5 item
4 already attributed, not a formula gap.

## Walkthrough 2 — `pesita-10-dene726` / `AA`

**Context variables:** rank group (`{rank=sink;sh0019;}` —
EXIT_POINT `aa_ok_ex` → `sink`), `${id}i` wrapper PRESENT
(`isGroupTouched('AA', allTransitions) === true`: `[*] --> AA`,
`AA --> Closing`), no nested child cluster inside `ee`, cluster15
sits inside an "a" ancestor wrapper only (no "p0", forced-false
protection — ruled out as a geometry contributor, Round 1 §5 item 6).
This is Round 3's **C1** cell shape (i-wrapper only, no parent-cluster
variant needed since `cluster15a` is layout-irrelevant per Round 1).

- Title table: **D4 applies.** `AA` has title="AA" (1 line), stereotype
  `<<O-O>>` (the `isWithOOSymbol` sentinel — excluded from
  `stereoLines` per D4), attribute "entry / set_timeout()" (1 line).
  `titleAndAttributeHeight = (0+1)*14 + 1*14 + 5 = 33` → DOT
  `HEIGHT = 33-5 = 28`. **This is 28, NOT 42** — confirmed against the
  cached DOT itself: `cluster15ee` label `WIDTH="116" HEIGHT="28"`.
  Width: `max(measure("AA",14), measure("entry / set_timeout()",14)) =
  max(18.7, 116.46) → 116`. Both exact vs. cached DOT (jar ground
  truth, unaffected by whatever plantuml-ts's own current stereoLines
  bug computes — this walkthrough uses the JAR'S OWN emitted DOT as
  `initial`'s source, so it is not sensitive to D4 by construction; D4
  matters for what T5's OWN generated DOT must reproduce, see §edit-list).
- `initial` (real `dot -Txdot` on `svek-3.dot`, `cluster15`'s own `bb`):
  `610,823,758,941.72` → **148 × 118.72** (raw; matches Round 3 §1's
  own end-anchor confirmation number exactly).
- `insides = []` (no direct NORMAL-position member of `cluster15`;
  `cluster15ee` contains only the anchor `zaent0002`, itself excluded).
- `points = [{x:656, y:837}]` (`sh0019`/`aa_ok_ex` center; node drawn
  at `x∈[650,662], y∈[831,843]`).
- **Frontier arithmetic:**
  1. seed (insides empty): center of `initial` = `(684, 882.36)` →
     `{minX:683, minY:881.36, maxX:685, maxY:883.36}`.
  2. merge point `(656,837)` → `{minX:656, minY:837, maxX:685,
     maxY:883.36}`.
  3. touch/fallback: `x=656` touches `minX(656)` → kept; does not
     touch `maxX(685)` → falls back to `initial.maxX=758`. `y=837`
     touches `minY(837)` → kept; does not touch `maxY(883.36)` →
     falls back to `initial.maxY=941.72`. Core: `{656, 837, 758,
     941.72}` → 102 × 104.72 (pre-push).
  4. push detection: point sits exactly at `(core.minX, core.minY)` —
     `p.y==core.minY` → `|656-758|=102` (no) but `|656-656|=0 < 18` →
     `pushMinX=true`. `p.x==core.minX` → `|837-941.72|=104.72` (no) but
     `|837-837|=0 < 18` → `pushMinY=true`.
  5. corner exclusion (rankdir=TB, `else` branch): point has
     `y==core.minY` AND `x==core.minX` → **cancels `pushMinY`**
     (`pushMinX` is untouched by the TB branch, which only ever cancels
     a Y-push at an X-matching corner). Net: `pushMinX=true,
     pushMinY=false`.
  6. apply: `core.minX -= 18` → `638`. Core: `{638, 837, 758,
     941.72}` → **120 × 104.72**.
  - `ensureMinWidth(minWidth = 116+10 = 126)`: `delta = 120-126 = -6`.
    `newMinX = 638 + (-6)/2 = 635`; `newMaxX = 758 - (-3) = 761`.
    `error = 635 - initial.minX(610) = 25`, not `<0` → no further shift.
    Final X-bounds: `{635, 761}` → width **126**.
- **Final: 126 × 104.72 — EXACT MATCH to target (126 × 104.72).**
  Height fixed at step 3 (never touched by the push or
  `ensureMinWidth`, both X-only here); width is entirely determined by
  the `pushMinX` + `ensureMinWidth` interaction — this is the
  non-trivial cell the prior attempt-3 misses (55×293.61) most likely
  broke, since a wrong `initial`/`insides`/`points` triple or a missed
  `i`-wrapper/rank wiring changes which corner the anchor lands on,
  changing which push/fallback branch fires.

Independently verified with a disposable Python transliteration of
`state-composite-frontier.ts` (see script output below) — matches the
by-hand trace to the digit.

## Walkthrough 3 — `kotagu-43-miza629` / `CompositeState`

**Context variables:** rank group (`{rank=source;sh0010;}` — ENTRY_POINT
`entry1` → `source`), no `${id}i` wrapper
(`isGroupTouched('CompositeState', allTransitions) === false` — `[*]
-up-> SubComposite` and `entry1 --> B` both connect *descendants*, never
`CompositeState` itself), nested child cluster (`SubComposite`) PRESENT
directly inside `cluster6ee`, plus a non-border pseudo-node (`sh0011`,
`[*]`) sharing `ee`. This is Round 3's **C2+C4** compound cell.

- Title table: no stereotype on `CompositeState`, title 1 line → 
  `(0+1)*14 = 14` → DOT `HEIGHT=14-5=9`; matches cached DOT `WIDTH="99"
  HEIGHT="9"` exactly. D4 not applicable (no `<<O-O>>` here).
- `initial` (real `dot -Txdot` on `svek-1.dot`, `cluster6`'s own `bb`):
  `8,8,311,366` → **303 × 358** (raw; matches Round 3 §1's own
  end-anchor confirmation number exactly).
- `insides = [sh0011's box, cluster12(SubComposite)'s own raw box]`:
  - `sh0011` (`[*]`, non-border NORMAL member): drawn as `e 34 171 10
    10` (ellipse, center `(34,171)`, rx=ry=10) → box `{minX:24,
    minY:161, maxX:44, maxY:181}`.
  - `cluster12` (`SubComposite`'s own subgraph, NOT the `a`/`p0`
    ancestor wrappers — same "own box, not ancestor wrapper" rule
    Round 1 §5 item 6 already established for `AA`/`cluster15` itself):
    real `dot`'s `bb="68,40,259,317"` → **191 × 277**, which is itself
    already the jar-exact `SubComposite` target (Round 1 §4's own
    entry) with NO frontier correction needed (`SubComposite` is a
    plain, non-border-point cluster — the pre-existing C3/C7 path reads
    a cluster's own `DotLayoutResult.clusters[id]` box directly as its
    final box, the same "own box" seam `initial` itself uses for
    border-point clusters, Round 1 §2c's `initial` row).
  - Union: `{minX:24, minY:40, maxX:259, maxY:317}`.
- `points = [{x:297, y:266}]` (`sh0010`/`entry1` center; node drawn at
  `x∈[291,303], y∈[260,272]`).
- **Frontier arithmetic:**
  1. seed = insides union = `{24, 40, 259, 317}`.
  2. merge point `(297,266)` → `{24, 40, 297, 317}`.
  3. touch/fallback: `x=297` touches `maxX(297)` → kept; does not touch
     `minX(24)` → falls back to `initial.minX=8`. `y=266` touches
     neither `minY(40)` nor `maxY(317)` → BOTH Y-bounds fall back to
     `initial` (`8`, `366`). Core: `{8, 8, 297, 366}` → **289 × 358**
     (pre-push).
  4. push detection: `p.y==core.minY(8)`? no. `p.y==core.maxY(366)`?
     no → neither X-push check runs. `p.x==core.maxX(297)`? yes →
     `|266-366|=100` (no), `|266-8|=258` (no) → `pushMaxY` and
     `pushMinY` both stay false. **No pushes fire.**
  5. corner exclusion: no-op (no flags set).
  6. apply: no-op.
  - `ensureMinWidth(minWidth = 99+10 = 109)`: current width 289 ≥ 109
    → no-op.
- **Final: 289 × 358 — EXACT MATCH to target (289 × 358).**

Sanity check (not part of the load-bearing derivation, run to test
robustness of the `insides` definition): re-ran with `insides =
[cluster12 only]` (dropping `sh0011`) — identical final `{8,8,297,366}`,
because `sh0011`'s box is fully inside `cluster12`'s Y-range and its
smaller `minX=24` gets overwritten by the `initial`-fallback at step 3
regardless (the anchor point's `x=297` never touches the union's
`minX` either way, `24` or `68`). This fixture does not numerically
discriminate whether `sh0011` belongs in `insides`, so it is *not*
evidence that omitting non-border members from `insides` is safe in
general — T5 must still implement the full definition (member leaves +
child cluster boxes), since other family fixtures (T10 sweep) are
expected to be sensitive to it even though these three targets are not.

## Cross-check script (Python transliteration of `state-composite-frontier.ts`, disposable, not retained)

```
bitaxo core [155, 8, 197, 109.72] (42, 101.72)
bitaxo final [155, 8, 197, 109.72] (42, 101.72)

pesita core [638, 837, 758, 941.72] (120, 104.72)
pesita final [635.0, 837, 761.0, 941.72] (126.0, 104.72)

kotagu core [8, 8, 297, 366] (289, 358)
kotagu final [8, 8, 297, 366] (289, 358)
kotagu core (no sh0011) [8, 8, 297, 366] (289, 358)
```

All three: **exact digit-for-digit match** to target, both by hand and
by the independent script re-implementation.

## Summary table

| Fixture / composite | Target (w×h) | Predicted (w×h) | Match |
|---|---|---|---|
| `bitaxo-18-tamo974` / `C` | 42 × 101.72 | 42 × 101.72 | **Exact** |
| `pesita-10-dene726` / `AA` | 126 × 104.72 | 126 × 104.72 | **Exact** |
| `kotagu-43-miza629` / `CompositeState` | 289 × 358 | 289 × 358 | **Exact** |

## Exact edit list for T5 (attempt 4) — what must be DIFFERENT from attempt 3

Attempt 3 (reverted, not inspectable — Round 3 §3 item 7) got bitaxo
byte-exact but missed pesita and kotagu badly (55×293.61 vs 126×104.72;
248×398 vs 289×358), despite Round 3's isolation matrix proving
graphviz-ts's raw layout correct for every context variable and
compound that distinguishes those two fixtures from bitaxo. The defect
is therefore necessarily in plantuml-ts's own wiring, not the
algorithm. This derivation pins down precisely what that wiring must
produce; T5 must implement to these exact contracts, not attempt3's
(unknown, unrecoverable) approach:

1. **`state-composite-cluster.ts:377-380` — relax `titleTableEligible`**
   exactly per Round 1 §7's diff (drop the `!hasBorderPointChildren`
   conjunct only; `ctx.theme.fontSize === 14` and
   `ctx.insideAutonomPass !== true` stay). Confirmed still unrelaxed on
   the current tree (read, not modified, this session).
2. **`state-composite-cluster.ts:340` — apply D4.** `stereoLines` must
   exclude any stereotype for which `Stereotype.isWithOOSymbol()` holds
   (bracket-stripped value `"o-o"`, from `<<O-O>>`) — currently
   `splitCreoleLines(s.stereotype).length` unconditionally, with no
   sentinel check. Confirmed still unfixed on the current tree this
   session. Without this, `AA`'s own `${id}ee` label emits
   `HEIGHT="42"` instead of the jar-exact `"28"` this walkthrough
   verified, corrupting `initial` for pesita specifically (the only one
   of the three targets with an `<<O-O>>`-style stereotype) — a
   necessary, though not necessarily sufficient, explanation for
   attempt 3's much-larger pesita miss vs. its correct bitaxo/kotagu-
   shape handling elsewhere.
3. **`graph-layout-build.ts#addClusters` — build the exact shapes
   Round 3 §2 verified**, not a re-derivation:
   - rank-group subgraph: child of the border-point cluster's own
     handle, name must NOT start with `cluster` (issue 08) —
     `c.addSubgraph(nonClusterName, {rank: 'source'|'sink'})
     .addNode(portId)`, PLUS `c.addNode(portId, {...})` directly on `c`.
   - `${id}i` wrapper: child of `ee` (not of `c`), gated on
     `isGroupTouched(s.id, ctx.classify.allTransitions)` — **not**
     `needsZaentPoint`, per Round 2's explicit ruled-out distinction.
     Anchor node goes INTO `i` when it fires, not directly into `ee`.
   - nested child cluster inside `ee`: a genuine cluster subgraph (own
     `style`/`color`/`labeljust`/`label`, own members) — `ee`'s child,
     built as its own independent cluster.
   - parent-cluster-wraps-whole-composite case: not needed for these 3
     targets (none exercises it) but already verified safe (Round 3 C3)
     if the family sweep hits it later.
4. **`state-composite-geo.ts#materializeCluster` — wire the ALREADY-
   correct, already-tested `frontierCalculator`/`ensureMinWidth`**
   (`state-composite-frontier.ts`, unmodified, do not re-port) with:
   - `initial = DotLayoutResult.clusters[c.id]` (the OUTER `cluster<N>`
     subgraph's real post-layout box — the SAME id `addClusters` names
     its outer subgraph, not the `${id}ee`/`${id}i`/`a`/`p0` ids).
   - `insides` = direct NORMAL-position member leaf boxes (from
     `DotLayoutResult.nodes`) **UNION** direct child clusters' own
     boxes (`DotLayoutResult.clusters[childId]`, already-corrected if
     the child is itself a border-point cluster — bottom-up order,
     Round 1 §6 item 1, unverified against a real fixture but the
     reasonable default) — **excluding** the anchor `zaent`-equivalent
     point node from `insides` in all three walkthroughs above.
   - `points` = direct border-point member node CENTERS (`x +
     width/2`, `y + height/2`) from `DotLayoutResult.nodes`.
   - `ensureMinWidth`'s `minWidth` = `titleAndAttributeWidth + 10` (the
     same value already computed for the `${id}ee` label's `WIDTH`
     attr — do not recompute independently).
5. **Bottom-up correction order** (child border-point clusters
   corrected before a parent reads their box) remains an unverified-
   but-reasonable default (Round 1 §6 item 1) — not exercised by any of
   these 3 targets (`SubComposite` is a plain, non-border-point
   cluster; no fixture here nests one WithLabel cluster directly inside
   another). T5 should implement it as the default and flag rather than
   guess if T10's family sweep turns up a fixture that actually
   exercises it.
6. **Regression coverage for the failure mode named in Round 2's
   "Anything else" note:** add a unit assertion on the actual numeric
   `DotLayoutResult.clusters[...]` bbox (not just DOT-shape presence)
   for at least one rank-bearing fixture, since `markClusterNode`'s
   conflict-eviction is a silent `console.error`, not a thrown
   exception — a future accidental root-level (or `cluster`-prefixed)
   rank-subgraph placement regresses silently past the DOT-parity gate
   and typecheck/lint.

No other files are implicated by this derivation. All three formulas
(`frontierCalculator`, `ensureMinWidth`, the title-table height/width
functions) are used **exactly as already committed** — none needed a
change to reproduce the targets; only the wiring around them (items 1-4
above) was missing or wrong.

## Files/paths used (T4)

- `test-results/dot-cache/state/{pesita-10-dene726/svek-3.dot,
  kotagu-43-miza629/svek-1.dot, bitaxo-18-tamo974/svek-1.dot}` (real
  `dot -Txdot` run against each, this session, ground truth for
  `initial`/`insides`/`points`)
- `src/diagrams/state/state-composite-frontier.ts` (read only —
  `frontierCalculator`/`ensureMinWidth`, unmodified; cross-checked with
  a disposable Python transliteration, not retained)
- `src/diagrams/state/state-composite-cluster.ts:330-408` (read only —
  confirmed `titleTableEligible`'s `!hasBorderPointChildren` conjunct
  and the unguarded `stereoLines` computation are both still present,
  unfixed, on the current tree)
- `src/core/graph-layout-build.ts` (read only — confirmed zero
  `portRanks`/`hasBorderPointChildren` references, matching Round 3 §3
  item 7)
- `plans/g6-cluster-geometry/decision-journal.md` (2026-07-22 rows, for
  the target numbers and attempt-3's measured misses)
- No production files modified. No probe scripts created under
  `scripts/`; all cross-checks used `dot -Txdot` directly plus a
  disposable Python script run in the session scratchpad
  (`/private/tmp/.../scratchpad/g7t4/`, outside the repo, not
  committed). `git status` clean apart from this doc.
- Cached DOT re-examined: `pesita-10-dene726/svek-3.dot`,
  `bitaxo-18-tamo974/svek-1.dot`, `kotagu-43-miza629/svek-1.dot`,
  `jucori-40-cevo136/svek-1.dot` (source+sink rank co-occurrence check)
- No production files modified; both probe scripts deleted
  (`scripts/_tmp-g6-t8-round2-rank-probe.ts`,
  `scripts/_tmp-g6-t8-round2-rank-probe2.ts`,
  `scripts/_tmp-g6-t8-round2-iwrapper-probe.ts`); `git status` clean
  of `src/`/`tests/`/`scripts/` changes.

---

# Round 3 (G7 T1 — isolation-matrix adjudication of the suspected second bug)

**Verdict: USAGE DEFECT, NOT A LIBRARY DEFECT. No issue 09 exists.**
graphviz-ts's raw layout output (the `initial` bbox `FrontierCalculator`
consumes, `getLayout().clusters`) is byte-exact vs. real `dot` 15.1.0 for
every context variable that distinguishes pesita/kotagu from the already-
verified bitaxo control — individually and in the exact two-variable
combinations that mirror pesita's and kotagu's real shapes. batch-4
retry-3's misses (pesita 55×293.61 vs. target 126×104.72; kotagu
248×398 vs. target 289×358 — see the "batch-4 retry-3" decision-journal
row above) are therefore **not** explained by any graphviz-ts behavior
this round could reproduce a divergence for. The mechanism must lie in
plantuml-ts's own code (§4 below).

## 1. Isolation matrix — full results

Disposable probes (`scripts/_tmp-g7-t1-matrix.ts`,
`scripts/_tmp-g7-t1-endanchor.ts`, `npx tsx`, deleted before finishing;
DOT fixtures written only to the session scratchpad, never the repo),
calling graphviz-ts's real `parse`/`createGraph`/`render`/`getLayout`
directly — the same functions `graph-layout.ts` uses — plus real `dot
-Txdot` as ground truth. Cluster w×h in points (native y-up frame,
delta of the `bb=` corners); node y is the ranked port node's native-frame
y (native y-up: larger y = visually higher; the `sink` rank lands near
the cluster's minimum y).

| Cell | Shape | realDot (w×h, y) | text-path (w×h, y) | builder (w×h, y) | Agree? |
|---|---|---|---|---|---|
| C0 | control: rank + bare anchor in `ee` (bitaxo shape) | 66×149.72, y=40 | 66×149.72, y=40 | 66×149.72, y=40 | **yes** |
| C1 | C0 + `${id}i` wrapper around the anchor | 66×157.72, y=40 | 66×157.72, y=40 | 66×157.72, y=40 | **yes** |
| C2 | C0 + nested child cluster inside `ee` | 111×193, y=40 | 111×193, y=40 | 111×193, y=40 | **yes** |
| C3 | C0 wrapped in a parent cluster | 66×149.72, y=48 | 66×149.72, y=48 | 66×149.72, y=48 | **yes** |
| C4 | C0 + non-border pseudo-node sharing `ee` | 75×156.2, y=40 | 75×156.2, y=40 | 75×156.2, y=40 | **yes** |
| C1+C3 | i-wrapper + parent cluster (**pesita mirror**) | 66×157.72, y=48 | 66×157.72, y=48 | 66×157.72, y=48 | **yes** |
| C2+C4 | nested child cluster + pseudo-node (**kotagu mirror**) | 119×193, y=228 | 119×193, y=228 | 119×193, y=228 | **yes** |

End-anchor confirmation — text-path vs. real `dot` on the ACTUAL cached
production DOT (raw cluster bbox, before any `FrontierCalculator`
correction):

| Fixture | Cluster | realDot (w×h) | text-path (w×h) | Agree? |
|---|---|---|---|---|
| `pesita-10-dene726/svek-3.dot` | `cluster15` | 148 × 118.72 | 148 × 118.72 | **yes** |
| `kotagu-43-miza629/svek-1.dot` | `cluster6` | 303 × 358 | 303 × 358 | **yes** |

No cell, single-variable or compound, and no end-anchor fixture showed
any divergence. C0's three-way agreement validates the harness before
any other cell counts (acceptance bar); every subsequent cell then
carries equal evidentiary weight.

---

# Paper gate v2 (G7 T8)

**Verdict: PASS — all three targets reproduce EXACTLY, derived from what
the PORT will emit post-T7 (landed) + T9 (paper-simulated per the
edit list below), not from jar's cached DOT.** No code was written; no
probe scripts were created (`scripts/` unchanged, `git status` clean of
`src/`/`tests/`/`scripts/` this session — every check below used `Read`
on already-committed source plus `cat` on already-cached fixture DOT).
This closes the T5 stop condition's own diagnosis ("a future paper gate
must derive from the PORT's emitted DOT") for the three named targets.

## 0. Method

T7 landed the a/p0/i/p1 ancestor-protection mechanism and the
`parentInnermost` parent-resolution fix (`graph-layout-build.ts
#addClusters`/`handlesFor`, committed 647e43e). T9 (border-point wiring)
has **not** landed — `state-composite-cluster.ts`'s `titleTableEligible`
still excludes `hasBorderPointChildren`, `addClusters` still has zero
`portRanks`/`portRanksLabelOnEe` references (re-confirmed this session,
same greps as T4/Round 3). So "the port's emitted DOT" does not exist yet
for the border-point family; deriving it requires *simulating* T9's own
change on top of T7's *actual, now-landed* code — which is a materially
different exercise from T4's (T4 simulated T9 on top of *pre-T7* code,
which is why it missed the a/p0 gap entirely).

Method, in order:
1. Read `graph-layout-build.ts#addClusters`/`handlesFor` as landed by T7
   (full body, this session) to get the *exact* current shape T9 must
   extend, not the pre-T7 sketch T4's edit list item 3 described.
2. Read jar's `ClusterDotString.java` in full (not re-derive from the
   prior rounds' own citations) to re-confirm the a/i-on-border-point
   mechanism directly from source, independent of Round 1-3's summaries.
3. Read the three fixtures' cached `svek-*.dot` files directly (`cat`,
   this session — not the prior rounds' excerpts) to confirm the real
   jar structural shape byte-for-byte, including ancestor nesting
   (pesita's `AA` inside `nasreq_auth`) that prior rounds described but
   this round re-verifies independently.
4. Construct the exact `handlesFor`/`addClusters` call sequence T9 must
   produce, as a literal extension of the code read in step 1 (not a
   freestanding sketch) — this surfaces two integration bugs the
   pre-T7-era edit list could not have anticipated (§3 below).
5. Diff the resulting port-simulated builder shape against the cached
   jar DOT (step 3) for structural isomorphism, fixture by fixture (§4).
6. Since Round 3 T1's isolation matrix already proved graphviz-ts
   reproduces real `dot` byte-exact for every constituent sub-shape used
   here (rank group, `${id}i`-inside-`ee`, nested child cluster inside
   `ee`, ancestor cluster wrapping a border-point cluster [proven
   structurally identical to the new border-point "a" wrap, §2], non-border
   pseudo-node, and both fixture-matching compounds) — and step 5 confirms
   the port's construction is isomorphic to jar's own DOT for all three
   targets — the `initial`/`insides`/`points` triples the port would
   compute are the SAME values T4 already read off jar's cached DOT via a
   fresh `dot -Txdot` run this session's predecessor performed. No new
   `dot -Txdot`/graphviz-ts execution was needed to re-derive them; §5
   states this transfer explicitly per fixture rather than asserting it
   globally.

## 1. `addClusters`/`handlesFor` as T7 actually landed it (read, not modified)

```ts
const handlesFor = (c) => {
  const parentInnermost = c.parentId && byId.has(c.parentId)
    ? handlesFor(byId.get(c.parentId)).innermost : b;
  const outerName = nameFor(c);
  const levels = c.innerMarginLevels;
  let host = parentInnermost;
  if (levels === 2) host = host.addSubgraph(`${outerName}a`, {});
  if (levels !== undefined) host = host.addSubgraph(`${outerName}p0`, {});
  const hasTitleTable = c.titleTableWidth !== undefined && c.titleTableHeight !== undefined;
  const attrs = !hasTitleTable && c.label !== undefined ? { label: c.label } : {};
  const main = host.addSubgraph(outerName, attrs);
  if (hasTitleTable) main.setHtmlAttr('label', `<TABLE ...>`);
  let innermost = main;
  if (levels === 2) innermost = innermost.addSubgraph(`${outerName}i`, {});
  if (levels !== undefined) innermost = innermost.addSubgraph(`${outerName}p1`, {});
  return { main, innermost };
};
for (const c of clusters) {
  const { main, innermost } = handlesFor(c);
  if (c.innerMarginLevels === undefined) {
    for (const id of c.nodeIds) main.addNode(id);
    continue;
  }
  for (const id of c.nodeIds) (id === c.unwrappedNodeId ? main : innermost).addNode(id);
}
```

(`graph-layout-build.ts:164-265`, verbatim structure, read this session —
this is the code T9 must extend, superseding T4 edit item 3's
freestanding `sg = parent.addSubgraph(...)` sketch, which predates T7's
restructuring around `handlesFor`/`ClusterHandles`.)

Three properties of this landed code matter for what follows and were
**not** analyzable at T4 time (T7 didn't exist yet):

- `main`'s `attrs`/`setHtmlAttr('label', ...)` calls are **unconditional**
  whenever `hasTitleTable` — there is no `hasBorderPointChildren`
  exclusion. Once T9's edit item 1 (relax `titleTableEligible`) lands,
  `c.titleTableWidth`/`Height` become defined for border-point clusters
  too (correctly, per §2a — same formula) — but this landed code would
  then call `main.setHtmlAttr(...)`, putting the title table directly on
  the OUTER cluster subgraph. Jar never does this for a border-point
  cluster (`ClusterDotString.java:117-146`: `cluster15` gets no `label=`
  at all; only `cluster15ee` gets one, line 140-141). This is a **new**
  integration bug T9 must avoid — not previously named because the code
  it interacts with didn't exist at T4 time.
- `innerMarginLevels`/`unwrappedNodeId` gate the SOLE existing
  wrap/placement mechanism. `resolveClusterComposite`'s current object
  literal (`state-composite-cluster.ts:408-409`, read this session,
  confirmed still as T4 left it) sets both **unconditionally** whenever
  `titleTableEligible`/`needsZaentPoint`(local) are true — with NO
  `hasBorderPointChildren` exclusion on either line. Once
  `titleTableEligible` is relaxed (edit item 1), BOTH lines start firing
  for border-point clusters too (`ctx.classify.needsZaentPoint` is true
  for bitaxo's `C` and pesita's `AA` — confirmed, `state-composite-
  classify.ts`'s own `touched || (hasDirectBorderPointChild &&
  !hasNonBorderEeContent)` OR is exactly why), which would make the
  EXISTING `if (c.innerMarginLevels === undefined)` branch above be
  **skipped** for these clusters (since `innerMarginLevels` would now be
  `1` or `2`), routing ALL of `C`'s/`AA`'s member ids — **including the
  port node itself** — through the WRONG (plain-cluster) `main`/`innermost`
  split, entirely bypassing rank-group/`ee` construction. This is the
  single most dangerous integration bug: it reproduces the exact failure
  class ("wrong `initial` because the wrong graph shape was built") that
  broke attempt 4, and it is a NEW risk that only exists because T7 landed
  first. T9's edit list (§5) must explicitly guard both lines with
  `!hasBorderPointChildren`.
- The member-placement loop's own `if (c.innerMarginLevels === undefined)`
  branch has no `portRanksLabelOnEe`/`hasBorderPointChildren` awareness
  either — a border-point cluster must be intercepted by its OWN new
  branch **before** reaching either existing branch, or (per the point
  above) it silently falls into the wrong one.

## 2. a/i-on-border-point adjudication (resolves T7's carried risk)

**Adjudication: YES — a border-point cluster (own
`entityPositionsExceptNormal.size() > 0`) fires its own outer "a" wrap
(around `main`, from `parentInnermost`) whenever `thereALinkFromOrToGroup1`
is true FOR THAT CLUSTER's OWN group entity — independently of, but on the
exact SAME boolean as, the already-scoped `${id}i` inner wrap (Round 2's
`iWrapperSpec`). It never gets "p0"/"p1" (forced false unconditionally
whenever `entityPositionsExceptNormal.size() > 0`, regardless of
`thereALinkFromOrToGroup1`).**

Read directly from `ClusterDotString.java:91-204` (`~/git/plantuml/
src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java`, this
session, full method):

```java
final boolean thereALinkFromOrToGroup2 = isThereALinkFromOrToGroup(lines);   // :91
boolean thereALinkFromOrToGroup1 = thereALinkFromOrToGroup2;                  // :92
...
if (thereALinkFromOrToGroup1)
    subgraphClusterNoLabel(sb, "a");                                          // :98-99  <- "a" gated ONLY on this

final Set<EntityPosition> entityPositionsExceptNormal = entityPositionsExceptNormal();  // :101
...
boolean protection0 = protection0(type);
boolean protection1 = protection1(type);
if (entityPositionsExceptNormal.size() > 0 || useProtectionWhenThereALinkFromOrToGroup == false) {
    protection0 = false;                                                      // :109-111 <- p0/p1 forced off,
    protection1 = false;                                                      //            UNRELATED to thereALinkFromOrToGroup1
}
if (protection0)
    subgraphClusterNoLabel(sb, "p0");                                         // :114-115 <- never fires for border-point
...
if (thereALinkFromOrToGroup1)
    subgraphClusterNoLabel(sb, "i");                                          // :151-152 <- "i", SAME boolean as "a"
if (protection1)
    subgraphClusterNoLabel(sb, "p1");                                         // :154-155 <- never fires for border-point
```

`thereALinkFromOrToGroup1`/`2` are computed at lines 91-96, **before** the
`entityPositionsExceptNormal.size() > 0` check at line 109 — the two
mechanisms are entirely independent variables in the source; nothing
forces `thereALinkFromOrToGroup1` false when a cluster is border-point.
The brace-closing sequence (lines 189-201, hand-traced this session
against both a `thereALinkFromOrToGroup1=true` and a `=false` border-point
case) confirms the nesting is exactly `a{ main{ ee{ [i{} ] } } }` (i present
only when `thereALinkFromOrToGroup1`), never `a{p0{main{...}}}` for this
family.

**Direct fixture confirmation** (`cat`, this session, re-verifying Round
1's own citation independently):

- `pesita-10-dene726/svek-3.dot`: `subgraph cluster15a {label="";subgraph
  cluster15 {style=solid;...` — `cluster15a` present, **no**
  `cluster15p0`. `isGroupTouched('AA', allTransitions)` = true (`[*] -->
  AA`, `AA --> Closing` both reference `AA`'s own group entity) — matches.
- `bitaxo-18-tamo974/svek-1.dot`: `subgraph cluster6 {style=solid;...`
  — **no** `cluster6a` at all. `isGroupTouched('C', ...)` = false (zero
  transitions anywhere in the fixture) — matches.
- `kotagu-43-miza629/svek-1.dot`: `subgraph cluster6 {style=solid;...`
  — **no** `cluster6a` on `CompositeState` itself (`SubComposite`'s own
  `cluster12a{cluster12p0{...}}` is a *different*, already-T7-handled,
  plain-cluster instance one level down). `isGroupTouched('CompositeState',
  ...)` = false (`[*] -up-> SubComposite` and `entry1 --> B` both touch
  *descendants*, never `CompositeState` itself) — matches.

**Numeric consequence: none of the three targets' predicted widths/heights
change.** `manageEntryExitPoint` (`Cluster.java:410-436`) reads
`cluster.getRectangleArea()` — `main`'s own polygon, never the "a"
wrapper's (Round 1 §5 item 6, re-confirmed by this source read: "a" is
opened at line 98-99 and closed at line 193-196, strictly OUTSIDE `main`'s
own open/close at 117/194-195 — `main`'s reported bbox is unaffected by
how many ancestor layers enclose it, same argument already validated by
Round 3's C3 cell, which is structurally the identical shape — "a" wrapping
a border-point cluster's own `main` IS a parent-cluster-wraps-child-cluster
shape, already isolation-matrix-verified). **This still must be built** —
not for these three numeric targets, but because it's jar's real structure
(faithful-port discipline) and because a nested border-point cluster's
"a"/"i" placement could matter for cross-cluster edge routing or a future
fixture in T10's family sweep.

## 3. `borderPointAncestorWrap` — the new seam field T9 needs

No existing `DotInputCluster` field can carry "does `thereALinkFromOrToGroup1`
hold for THIS border-point cluster" — `innerMarginLevels` is the wrong
mechanism (drives a/p0/i/p1, all four, and must stay **absent** for
border-point clusters, §1) and `ctx.classify.needsZaentPoint` is the wrong
boolean (Round 2 already ruled this out for the "i" wrapper specifically;
same rule-out applies to "a", same underlying reason — it's a wider OR that
is true for `bitaxo`'s `C` even though `isGroupTouched('C')` is false).
T9 needs one new boolean field, e.g. `DotInputCluster.borderPointAncestorWrap
?: true`, set by `resolveClusterComposite` as
`hasBorderPointChildren && isGroupTouched(s.id, ctx.classify.allTransitions)`
(`isGroupTouched` already exported, `state-composite-detect.ts:221`;
`ctx.classify.allTransitions` already on `ClassifyResult`) — read by
`addClusters`'s new border-point branch to gate BOTH the outer "a" wrap
and the inner (`ee`-child) "i" wrap, since they are the exact same jar
boolean.

## 4. Per-fixture port-simulated DOT vs. jar cached DOT

Builder-call form below is what `handlesFor`'s new border-point branch
(§5 item 3) produces; jar DOT is the `cat`'d cached file (§0 step 3),
structure only (attrs/colors omitted — irrelevant to `graph-layout-
build.ts`, which the file's own header comment already establishes:
"layout ignores [label/labelWidth/labelHeight] for now").

### `bitaxo-18-tamo974` / `C`

```
port:  main = parentInnermost(=b).addSubgraph('clusterN', {})   // no "a" (untouched), no label attr
       rank = main.addSubgraph('rank_source', {rank:'source'}); rank.addNode('d'); main.addNode('d')
       ee = main.addSubgraph('clusterNee', {}); ee.setHtmlAttr('label', <TABLE W=10 H=9>)
       ee.addNode('zaent')             // innermost = ee (untouched, no "i")
jar:   cluster6 { {rank=source;sh0010;} sh0010[...];
         cluster6ee { label=<TABLE W=10 H=9>; zaent0003[...]; } }
```
**Isomorphic — no residual diff.** `initial`/`insides`/`points`: same
values T4's Walkthrough 1 already read off this exact cached file this
session's predecessor (`initial=155,8,197,123.72` → 42×115.72 raw;
`insides=[]`; `points=[{176,109.72}]`) — inherited unchanged since the
port's construction reproduces the identical structure Round 3's C0 cell
already proved graphviz-ts lays out byte-exact vs real `dot`.
**Final: 42 × 101.72 (frontier arithmetic unchanged from T4 §Walkthrough
1) — EXACT MATCH to target.**

### `pesita-10-dene726` / `AA`

```
port:  parentInnermost = handlesFor(nasreq_auth).innermost   // = nasreq_auth's own "p1" handle (T7, unchanged)
       host = parentInnermost.addSubgraph('clusterNa', {})   // borderPointAncestorWrap=true (isGroupTouched('AA'))
       main = host.addSubgraph('clusterN', {})                // NO label attr, NO setHtmlAttr on main
       rank = main.addSubgraph('rank_sink', {rank:'sink'}); rank.addNode('aa_ok_ex'); main.addNode('aa_ok_ex')
       ee = main.addSubgraph('clusterNee', {}); ee.setHtmlAttr('label', <TABLE W=116 H=28>)  // D4 (edit item 2) applied
       i = ee.addSubgraph('clusterNi', {}); i.addNode('zaent')   // innermost = i (touched)
jar:   cluster6a{cluster6p0{cluster6{ ...zaent0001... cluster6i{cluster6p1{
         ...
         cluster15a{cluster15{ {rank=sink;sh0019;} sh0019[...];
           cluster15ee{ label=<TABLE W=116 H=28>; zaent0002[...];
             cluster15i{ zaent0002[...]; } } }}
         ...
       }}}}}
```
**Isomorphic — no residual diff**, GIVEN edit items 1+2+3+4 (§5) all land
together (D4's stereotype exclusion is load-bearing here specifically —
without it `HEIGHT` would emit `42` not jar-exact `28`, corrupting
`initial`; re-confirmed this session by re-reading the still-unfixed
`stereoLines` line, `state-composite-cluster.ts:340`). `nasreq_auth`
(`cluster6`)'s own a/p0/i/p1 nesting is unchanged, already-T7-correct;
`AA` (`cluster15`) now nests inside `nasreq_auth`'s `p1` handle exactly as
the cached DOT shows (T7's `parentInnermost` mechanism, already verified
working for this exact parent/child pair by the cached DOT itself — `AA`'s
"a" sits between `cluster6p1`'s open and `cluster15`'s open, i.e. INSIDE
`cluster6i{cluster6p1{`, matching `parentInnermost = handlesFor(nasreq_auth
).innermost`). `initial`/`insides`/`points`: same as T4's Walkthrough 2
(`initial=610,823,758,941.72` → 148×118.72 raw; `insides=[]`;
`points=[{656,837}]`) — inherited unchanged, same isomorphism argument.
**Final: 126 × 104.72 (frontier arithmetic unchanged from T4
§Walkthrough 2, including the `pushMinX`/corner-exclusion/`ensureMinWidth`
interaction) — EXACT MATCH to target.**

### `kotagu-43-miza629` / `CompositeState`

```
port:  main = parentInnermost(=b).addSubgraph('clusterN', {})   // no "a" (untouched)
       rank = main.addSubgraph('rank_source', {rank:'source'}); rank.addNode('entry1'); main.addNode('entry1')
       ee = main.addSubgraph('clusterNee', {}); ee.setHtmlAttr('label', <TABLE W=99 H=9>)
       ee.addNode('sh0011')            // [*] pseudo-node, innermost=ee (untouched)
       // SubComposite: parentId=CompositeState -> parentInnermost = handlesFor(CompositeState).innermost = ee
       sub_host = ee                                        // SubComposite's own "a"/"p0"/main/"i"/"p1", T7-unchanged
       sub = sub_host.addSubgraph('clusterMa',{}).addSubgraph('clusterMp0',{}).addSubgraph('clusterM', {...})
jar:   cluster6 { {rank=source;sh0010;} sh0010[...];
         cluster6ee { label=<TABLE W=99 H=9>; sh0011[shape=circle,...];
           cluster12a{cluster12p0{cluster12{ ... cluster12i{cluster12p1{ ... }}}}} } }
```
**Isomorphic — no residual diff.** `SubComposite`'s own a/p0/i/p1 nesting
is entirely T7's existing (already-correct, already-verified) mechanism —
this walkthrough only newly confirms it lands in the right PARENT slot
(`CompositeState`'s `ee`, since `CompositeState` is untouched so
`innermost=ee`), matching the cached DOT's `cluster12a` sitting directly
inside `cluster6ee`. `initial`/`insides`/`points`: same as T4's Walkthrough
3 (`initial=8,8,311,366` → 303×358 raw; `insides=[sh0011's box,
cluster12's own 191×277 box]`; `points=[{297,266}]`) — inherited
unchanged. **Final: 289 × 358 (frontier arithmetic unchanged from T4
§Walkthrough 3) — EXACT MATCH to target.**

## 5. Updated edit list for T9 (supersedes T4's six items)

T4's six items are retained where still accurate; items 3 and 4 are
substantially rewritten to target the actual T7-landed code (not the
pre-T7 sketch); two new items (3a-html-label, new-field) are added that
did not exist as risks before T7 landed.

1. **`state-composite-cluster.ts:377-380` — relax `titleTableEligible`**,
   unchanged from T4 item 1: drop the `!hasBorderPointChildren` conjunct
   only.
2. **`state-composite-cluster.ts:340` — apply D4** (exclude
   `Stereotype.isWithOOSymbol()` sentinels from `stereoLines`), unchanged
   from T4 item 2. Confirmed still unfixed this session.
3. **`state-composite-cluster.ts:408-409` — guard the TWO existing lines
   that currently key off `titleTableEligible`/`needsZaentPoint`(local)
   alone.** This is NEW (did not exist as a risk at T4 time, since T7's
   `handlesFor`/member-loop that these fields drive did not exist yet):
   ```diff
   - ...(titleTableEligible ? { innerMarginLevels: needsZaentPoint ? 2 : 1 } : {}),
   - ...(needsZaentPoint ? { unwrappedNodeId: anchorId } : {}),
   + ...(titleTableEligible && !hasBorderPointChildren
   +   ? { innerMarginLevels: needsZaentPoint ? 2 : 1 } : {}),
   + ...(needsZaentPoint && !hasBorderPointChildren
   +   ? { unwrappedNodeId: anchorId } : {}),
   + ...(hasBorderPointChildren && isGroupTouched(s.id, ctx.classify.allTransitions)
   +   ? { borderPointAncestorWrap: true } : {}),
   ```
   Without this, edit item 1 alone makes `innerMarginLevels`
   incorrectly fire for `bitaxo`'s `C` and `pesita`'s `AA` (both have
   `ctx.classify.needsZaentPoint.has(id) === true`, which is broader than
   `isGroupTouched`), which — per §1's third bullet — routes those
   clusters through the WRONG existing member-placement branch entirely,
   silently reproducing attempt 4's failure class. New import needed:
   `isGroupTouched` from `./state-composite-detect.js`.
4. **`graph-layout.types.ts` — add `borderPointAncestorWrap?: true`** to
   `DotInputCluster` (§3), with a doc comment citing
   `ClusterDotString.java:91-99,151-152` (the shared boolean) and
   `:107-112` (why p0/p1 never accompany it for this family).
5. **`graph-layout-build.ts#handlesFor` — new border-point branch**,
   inserted as an alternate path selected by `c.portRanksLabelOnEe ===
   true` (already the correct, already-existing `hasBorderPointChildren`
   signal for this file — no new field needed for that specific test),
   mutually exclusive with the existing `levels`-based branch:
   - `host = parentInnermost` (unchanged — same generic parent-resolution
     T7 already built); `if (c.borderPointAncestorWrap) host =
     host.addSubgraph('${outerName}a', {})` — **"a" only, never "p0"**.
   - `main = host.addSubgraph(outerName, {})` — **empty attrs**, never a
     `label` (plain-text OR html) directly on `main` for this family (jar:
     `cluster15`/`cluster6` never carry `label=` — §1 first bullet).
   - for each `rg` of `c.portRanks ?? []`: `const rsub = main.addSubgraph(
     <non-cluster-prefixed name>, { rank: rg.rank }); for (id of
     rg.nodeIds) { rsub.addNode(id); main.addNode(id); }` — unchanged from
     Round 2/3's already-verified call sequence (issue 08's non-`cluster`
     naming still applies).
   - `ee = main.addSubgraph('${outerName}ee', {})`; `if (hasTitleTable)
     ee.setHtmlAttr('label', <TABLE...>)` — **on `ee`, not `main`** (the
     bug named in §1).
   - `innermost = c.borderPointAncestorWrap ? ee.addSubgraph(
     '${outerName}i', {}) : ee`.
   - return `{ main, innermost }` from this branch — same `ClusterHandles`
     shape, so nested child clusters (kotagu's `SubComposite`) resolve via
     the SAME unchanged `parentInnermost = handlesFor(parent).innermost`
     recursion already built by T7, landing in `ee`/`i` correctly with no
     further change needed there.
6. **`graph-layout-build.ts`'s member-placement loop — new early branch**,
   BEFORE the existing `if (c.innerMarginLevels === undefined)` check:
   ```ts
   if (c.portRanksLabelOnEe === true) {
     const { innermost } = handlesFor(c);   // memoized, already computed above
     const portIds = new Set((c.portRanks ?? []).flatMap((rg) => rg.nodeIds));
     for (const id of c.nodeIds) if (!portIds.has(id)) innermost.addNode(id);
     continue;
   }
   ```
   Port ids are already placed by item 5's rank-group loop (inside
   `handlesFor`); this loop places only the remainder (anchor + any other
   non-port direct members) into `ee`/`i` as appropriate. Must run BEFORE
   the `innerMarginLevels === undefined` check, not after — a border-point
   cluster has `innerMarginLevels === undefined` (item 3's new guard keeps
   it that way), so without this early branch it would silently fall into
   the OLD flat-`main.addNode` loop, losing rank/`ee`/`i` structure
   entirely.
7. **`state-composite-geo.ts#materializeCluster` — wire `frontierCalculator`
   /`ensureMinWidth`** (`state-composite-frontier.ts`, unmodified),
   unchanged from T4 item 4:
   - `initial = DotLayoutResult.clusters[c.id]` — unaffected by items 3-6
     above; `nameFor(c)`/`idByName` still key on `main`'s own subgraph
     name regardless of which branch built it.
   - `insides` = direct NORMAL-position member leaf boxes UNION direct
     child clusters' own (already-corrected if border-point) boxes,
     excluding the anchor.
   - `points` = direct border-point member node centers.
   - `ensureMinWidth`'s `minWidth` = `titleAndAttributeWidth + 10`
     (`c.titleTableWidth + 10`, already computed).
8. **Bottom-up correction order** — unchanged from T4 item 5, still
   unverified-but-reasonable-default, still not exercised by any of the
   3 targets.
9. **Regression coverage** — unchanged from T4 item 6: assert the actual
   numeric `DotLayoutResult.clusters[...]` bbox for at least one
   rank-bearing fixture, not just DOT-shape presence.
10. **Doc update (housekeeping, not behavior):** `ClusterHandles`'s own
    JSDoc (`graph-layout-build.ts:126`, "Equal to `main` when the cluster
    carries no wrapper (`innerMarginLevels` absent)") becomes incomplete
    once item 5 lands — `innermost` can differ from `main` via
    `portRanksLabelOnEe` too, with `innerMarginLevels` still absent. T9
    should update this comment in the same commit as item 5.

## 6. Residual port-vs-jar DOT diffs T9 must close

None found beyond what §5's edit list already covers — §4's three
walkthroughs each show full structural isomorphism once items 1-6 land
together. The two diffs that would exist if T9 implemented ONLY T4's
original (pre-T7-aware) six items, without this round's items 3/5/6
refinements, are:

1. Title-table HTML label attaching to `main` instead of `ee` (§1, first
   bullet) — corrupts `initial` directly (the reservation would apply
   around the whole border-point cluster, not just around `ee`'s content).
2. `innerMarginLevels`/`unwrappedNodeId` firing via the unguarded existing
   lines (§1, second bullet) — routes border-point clusters through the
   wrong existing branch, dropping rank/`ee`/`i` structure entirely for
   exactly the two clusters (`bitaxo`'s `C`, `pesita`'s `AA`) whose
   `ctx.classify.needsZaentPoint` happens to be true.

Both are closed by edit items 3, 5, and 6 together — no single item
closes either alone (item 3's guard prevents the wrong fields from being
set; item 5 builds the right shape when the right signal IS set; item 6
prevents the fallback loop from running for a border-point cluster even
if item 3's guard were somehow bypassed).

## 7. Summary table

| Fixture / composite | Target (w×h) | Predicted (w×h) | Match |
|---|---|---|---|
| `bitaxo-18-tamo974` / `C` | 42 × 101.72 | 42 × 101.72 | **Exact** |
| `pesita-10-dene726` / `AA` | 126 × 104.72 | 126 × 104.72 | **Exact** |
| `kotagu-43-miza629` / `CompositeState` | 289 × 358 | 289 × 358 | **Exact** |

## 8. Files/paths used (T8)

- `src/core/graph-layout-build.ts` (read, full `addClusters`/`handlesFor`
  body — T7-landed code, the actual extension target)
- `src/diagrams/state/state-composite-cluster.ts:330-480` (read —
  confirmed `titleTableEligible`, `stereoLines`, and the `innerMarginLevels`
  /`unwrappedNodeId` object-literal lines all still exactly as T4 left
  them; confirmed `applyBorderPointRanks`/`portRanks`/`portAnchorId`/
  `portRanksLabelOnEe` already correctly populated, emitter-only today)
- `src/diagrams/state/state-composite-classify.ts`,
  `state-composite-detect.ts` (read — `isGroupTouched` signature/export,
  `needsZaentPoint`'s OR-of-two-triggers definition, re-confirmed)
- `src/diagrams/state/state-composite-frontier.ts` (read — `frontierCalculator`
  /`ensureMinWidth` exports unchanged, still unwired)
- `src/core/graph-layout.types.ts:126-261` (read — full `DotInputCluster`
  shape, confirmed no existing field covers `borderPointAncestorWrap`'s
  semantics)
- jar: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/
  ClusterDotString.java` (full file, read this session, independent of
  prior rounds' citations)
- `test-results/dot-cache/state/{pesita-10-dene726/svek-3.dot,
  bitaxo-18-tamo974/svek-1.dot, kotagu-43-miza629/svek-1.dot}` (`cat`,
  this session, full files — re-confirms nesting/ancestor structure
  independently of prior rounds' excerpts)
- `test-results/dot-cache/state/{bitaxo-18-tamo974,pesita-10-dene726,
  kotagu-43-miza629}/in.puml` (`cat`, this session — confirms `AA`'s
  parent is `nasreq_auth`, `C`/`CompositeState` are top-level, and the
  exact transition set each `isGroupTouched` call depends on)
- Numeric frontier arithmetic itself inherited unchanged from the "Paper
  gate (G7 T4)" section above (§ Walkthroughs 1-3) — not re-run, since §0
  step 6/§4 establish the transfer argument (structural isomorphism +
  Round 3 T1's already-completed isolation matrix) rather than
  re-executing `dot -Txdot`/graphviz-ts this session.
- No production files modified. No probe scripts created under
  `scripts/` this session (`git status --short` clean, verified before
  and after this addendum was written).

## 2. Correct builder call sequence per context variable

All four verified against real `dot` + text-path + builder agreement
above. `c` = the border-point cluster's own handle
(`b.addSubgraph('cluster15', {...})`); `ee` = `c.addSubgraph('cluster15ee',
{label: ...})`. The rank-group subgraph name must never start with
`cluster` (issue 08); every OTHER wrapper/nested-cluster name below
deliberately DOES start with `cluster`, matching jar's own DOT emission,
because those ARE meant to be treated as real clusters by `isACluster`
(margin/bbox machinery), unlike the rank group.

- **rank group (baseline, C0 — already the issue-08 Resolution
  sequence, reconfirmed here):**
  `c.addSubgraph('sink_group_15', {rank: 'sink'}).addNode(id)` +
  `c.addNode(id, {shape: 'rect', ...})`. Child of `c`, NOT of the root
  builder or of `ee`.

- **`${id}i` wrapper (C1):** child of `ee`, not of `c` directly:
  `const i = ee.addSubgraph('cluster15i', {label: ''}); i.addNode(anchorId,
  {shape: 'point', ...})`. The anchor is added to `i`, not directly to
  `ee`, when the wrapper fires (gated on `isGroupTouched`, per Round 2).
  Verified: cluster height grows by exactly the wrapper's own margin
  (149.72→157.72, +8) in all three paths identically.

- **nested child cluster inside `ee` (C2):** child of `ee`, a genuine
  independent cluster subgraph (own `style`/`color`/`labeljust`/`label`
  attrs, its own members): `const child = ee.addSubgraph('cluster16',
  {style: 'solid', color: ..., labeljust: 'c', label: ...});
  child.addNode(innerId, {...})`. Verified: outer cluster's bbox grows to
  enclose the nested cluster's own box plus margin (149.72×66 →
  193×111) identically in all three paths — this is the
  `insides`-nonempty case (kotagu's `SubComposite`).

- **parent cluster wrapping the whole border-point cluster (C3):**
  `c` becomes a child of another cluster handle, not of the root
  builder: `const parent = b.addSubgraph('cluster14', {style: 'solid',
  color: ..., labeljust: 'c', label: ''}); const c =
  parent.addSubgraph('cluster15', {...})`. Verified: `cluster15`'s OWN
  bbox is unaffected (66×149.72 unchanged); only the ranked node's
  absolute y shifts by the parent's own top/side margin (40→48),
  identically in all three paths. No special-casing needed for a
  border-point cluster nested inside a plain parent cluster.

- **non-border pseudo-node sharing `ee` (C4):** added directly to `ee`
  alongside the anchor, like any other non-port member: `ee.addNode(
  pseudoId, {shape: 'circle', ...})`. No separate subgraph, no special
  attrs. Verified: cluster width grows to include it (66→75) identically
  in all three paths.

- **compounding (C1+C3, C2+C4):** every combination above composes with
  no additional interaction term — each variable's effect (verified in
  isolation) is present unchanged in the compound cell, and all three
  paths still agree exactly. A correct wiring therefore needs no extra
  logic for "i-wrapper AND parent nesting" or "nested cluster AND
  pseudo-node" beyond applying each rule above independently.

## 3. Ruled out

1. **Rank-subgraph `cluster`-prefix naming as the residual cause.**
   Ruled out: every cell used the non-`cluster`-prefixed
   `sink_group_15` name (issue 08's fix); all seven cells still agree
   three-way, so a naming regression is not present in any tested shape.
2. **`${id}i` wrapper mis-handling in graphviz-ts.** Ruled out (C1,
   C1+C3): isolated cell and the pesita-mirror compound cell agree
   exactly across all three paths; the +8pt height delta it introduces
   is identical real-dot/text/builder.
3. **Nested child cluster inside `ee` mis-handling in graphviz-ts.**
   Ruled out (C2, C2+C4): agrees exactly in isolation and combined with
   the pseudo-node.
4. **Parent-cluster nesting shifting the rank-forced node or the
   cluster's own bbox incorrectly.** Ruled out (C3, C1+C3): bbox and y
   both agree exactly; only the node's absolute y-offset shifts
   uniformly by the parent's own margin, identically in all three
   paths.
5. **Non-border pseudo-node co-membership in `ee` corrupting
   `points`/`insides` computation in graphviz-ts.** Ruled out (C4,
   C2+C4): agrees exactly in isolation and combined with a nested child
   cluster.
6. **graphviz-ts's raw layout diverging from real dot on the actual
   production fixtures (as opposed to minimal repros).** Ruled out
   directly: `parse`+`render`+`getLayout` on pesita's full `svek-3.dot`
   and kotagu's full `svek-1.dot` reproduce real dot's cluster bbox
   exactly (148×118.72 and 303×358 respectively).
7. **A previously-fixed defect still being present in the current
   tree.** Checked: `src/core/graph-layout-build.ts` has zero
   references to `portRanks`/`hasBorderPointChildren`/rank-subgraph
   construction on the current branch; `state-composite-frontier.ts:11`
   still documents "NOT WIRED into `materializeCluster`" as of the G6 T9
   stop. The wiring that produced retry-3's numbers was built on a
   separate branch and fully reverted (2026-07-22 "batch-4 retry-3"
   decision-journal row, "Full revert verified") — it is not
   inspectable in the current tree, which is why this round is a
   from-scratch isolation matrix rather than a code read.

## 4. Downstream-suspect statement (for the next implementation attempt)

Raw layout is proven correct for the full context set (§1). The defect
that produced retry-3's misses must therefore lie in one (or both) of:

- **plantuml-ts's `addClusters` border-point wiring** building a graph
  shape different from the cells verified in §2 — e.g. wrong nesting
  parent, wrong subgraph naming, wrong call order, or member-list
  wiring that doesn't route `portRanks`/non-port members/nested
  children the way §2 specifies; or
- **the `FrontierCalculator`/`materializeCluster` post-layout correction
  pass** (`src/diagrams/state/state-composite-frontier.ts` — confirmed
  **NOT wired** into `state-composite-geo.ts#materializeCluster` as of
  this round) misapplying `insides`/`points` once nesting/`i`-wrapper/
  pseudo-node content is present, even when the raw layout it consumes
  is correct.

**The reverted attempt-3 wiring is not inspectable** (fully reverted,
per §3 item 7) — attempt 4 must be derived from this document's §2 call
sequences and the existing `frontierCalculator` pure-function port
(already tested, already correct per T9's own hand-trace verification),
not from memory or assumption about what attempt 3 did differently.
No further measurement is needed before attempt 4 begins: this round's
matrix is the complete input a paper derivation needs.

## 5. Round 3 files/paths used

- `node_modules/graphviz-ts/dist/{api,render,parser}/*.d.ts` (`parse`,
  `createGraph`, `render`, `getLayout` signatures)
- `src/core/graph-layout.ts` (existing `layoutGraph` call pattern,
  read for the builder/text-path construction template — not modified)
- `src/core/graph-layout-build.ts` (confirmed zero `portRanks`/
  `hasBorderPointChildren` references on the current branch)
- `src/diagrams/state/state-composite-frontier.ts` (confirmed
  `frontierCalculator` exported but not wired into `materializeCluster`)
- `test-results/dot-cache/state/{pesita-10-dene726/svek-3.dot,
  kotagu-43-miza629/svek-1.dot}` (end-anchor confirmation)
- `plans/g6-cluster-geometry/decision-journal.md` (batch-4 retry-3 row,
  read for the target numbers being adjudicated)
- No production files, oracles, or goldens modified; both probe scripts
  deleted (`scripts/_tmp-g7-t1-matrix.ts`,
  `scripts/_tmp-g7-t1-endanchor.ts`); `git status` clean of
  `src/`/`tests/`/`scripts/` changes.
