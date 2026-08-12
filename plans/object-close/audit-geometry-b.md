# T5b — large-delta, purely-geometric object fixtures (13)

Read-only audit. No production file was modified.

## Method and one correction to the read-set

Every claim below rests on four measurements per fixture:

1. `npx tsx …/diff-fixture.mts <slug>` — the ratchet metric
   (`DeterministicMeasurer` → `renderFixtureClass` → `compareSvg`).
2. The **DOT we actually feed the engine**, captured through
   `setLayoutInputObserver` (`src/core/graph-layout.ts:57-61`) and serialised
   with `toSvekDot` (`src/core/svek-dot-emit.ts:449`).
3. The oracle DOT, `oracle/goldens/object/<slug>/svek-1.dot`.
4. Real graphviz (`dot -Tplain`, 15.1.1) run **on the oracle DOT**, to
   separate "what graphviz does with the jar's input" from "what our engine
   does with ours".

> **Correction to the brief's read-set.** `test-results/dot-cache/object/<slug>/svek-1.dot`
> is a **copy of the oracle**, not our emission. It is byte-identical to
> `oracle/goldens/object/<slug>/svek-1.dot` for every one of the 13, including
> `beleso-08-ruca459`, whose real emitted DOT has the edge **reversed**.
> Diffing the dot-cache file against the golden proves nothing. Every
> "identical DOT" claim in this report is against re-emitted output, not the
> cache.

**Headline: none of the 13 is `gvts-blocked`.** In every case the DOT we hand
the engine differs from the oracle's — in edge direction, node label form,
port attachment, or label-table size. The engine was never given identical
input, so it cannot be charged with the divergence.

---

## The two shared causes, established first

### C1 — decor-driven endpoint swap reverses the DOT edge (the 94.0 triple)

`beleso-08-ruca459` is `object "Kannada : bambu" as ಬಬ` / `object bamboo` /
`bamboo <-- ಬಬ`. Node sizes are exact (the oracle's `width=1.621181` /
`0.896875` are our 116.725 / 64.575 px to the last digit, and the unit test at
`tests/unit/class/class-object-map-sizing.test.ts` already pins them), yet the
two boxes are at each other's y.

Emitted DOT, ours vs oracle:

```
oracle: sh0007->sh0006     (bamboo → ಬಬ, i.e. source order cl1→cl2)
ours:   sh0006->sh0007     (ಬಬ → bamboo)
```

Upstream swaps a link's endpoints in exactly one place:
`CommandLinkClass.java:363-364` — `if (dir == Direction.LEFT || dir ==
Direction.UP) link = link.getInv();` — and `getDirection` strips every
non-`[-.=\w]` char before asking `StringUtils.getQueueDirection`
(`CommandLinkClass.java:517-527`), so `<--` reduces to `--` and falls through
to `DOWN` (`StringUtils.java:281-310`). No inversion. `SvekEdge` then takes the
endpoints verbatim: `this.startUid = link.getEntityPort1(…); this.endUid =
link.getEntityPort2(…)` (`SvekEdge.java:249-250`). There is **no decor-driven
swap anywhere upstream** — the left-hand arrowhead is carried by
`LinkType.decor1`, not by reordering the graph edge.

Our port swaps on decor:
`class-arrow-grammar.ts:248-249` computes
`decorSwap = isDirectionKind(kind1) && !isDirectionKind(kind2)` and
`swapDirection = decorSwap !== upOrLeft`;
`class-relationship-parser.ts:380` turns that into `rel.from`/`rel.to`;
`class-dot-graph.ts:216-218` restores source order **only** for
`extension`/`implementation` (`ranksParentFirst`). Every other type — plain
`<--`, `<..`, `<-` — keeps the swap and reaches graphviz reversed.

Not object-only: `class/baneru-00-kuro607` (`class1 [Qualifier] <-- class2`)
has oracle `sh0006:h->sh0007` and ours `sh0007->sh0006:h`.

`fikojo-87-tine499` and `sarepa-89-cevi460` are the same three lines with a
different (never-displayed) alias, hence identical 23 diffs / 94.0 px.

### C2 — `shape=plaintext` HTML-label nodes lose graphviz's label padding (the 16.0 pair, and every map fixture)

Upstream emits map / port-bearing nodes as `shape=plaintext` with an HTML
`<TABLE>` label and **no** `width`/`height`
(`SvekNode.appendLabelHtmlSpecialForLink`, `SvekNode.java:269-297`; rows via
`appendTr`, `:298-311`). Graphviz then sizes the node from the label plus its
default padding: `PAD(dimen)` in `poly_init`
(`~/git/graphviz/lib/common/shapes.c:1993-2009`), where
`XPAD(d) ((d).x += 4*GAP)` / `YPAD(d) ((d).y += 2*GAP)`
(`~/git/graphviz/lib/common/macros.h:27-29`) and `GAP 4`
(`~/git/graphviz/lib/common/const.h:251`) — **+16 px wide, +8 px tall**, then
floored at the `width`/`height` defaults (0.75 in / 0.5 in = 54 / 36 px).

Measured on the oracle DOT with real graphviz:

| fixture | label box | graphviz node box |
|---|---|---|
| gatefi `sh0006` | 49 × 18 | 65 × 36 (+16, +8 then floored to 36) |
| lafemo `sh0006` | 65.94 × 36 | 81 × 44 |
| rozuxo `sh0006` | 69.49 × 68 | 85 × 76 |
| rocepa `sh0006` | 151.4 × 72 | 167 × 80 |

Our adapter never lets that happen: `addOneNode`
(`src/core/graph-layout-build.ts:160-169`) emits `shape=box, fixedsize=true,
label="", width=<measured>/72, height=<measured>/72` for every non-point,
non-record node — `layoutShape` (`:47-49`) folds `plaintext` into `box`. With
`fixedsize=true` and an empty label there is no label to pad, so the node is
exactly the measured size and every downstream x/y is 16 px (horizontally) or
8 px (vertically) tight.

`gatefi-65-curu360` is the clean isolate: two maps, zero edges, `dot -Tplain`
puts the oracle centres 100 px apart (65 + 35 nodesep); our engine puts them
84 apart (49 + 35). Delta 16.0.

### C3 — the row-port table is unported

The same `appendLabelHtmlSpecialForLink` routine emits one `<TR>` per
`PortGeometry`, each carrying `PORT="p<md5(key)>"`, so a `Map::key` /
`obj::field` edge attaches at that **row's** y inside the node. Ports come from
`WithPorts` implementors — `cucadiagram/TextBlockMap.java:66` and
`cucadiagram/MethodsOrFieldsArea.java:81` — and reach the DOT via
`Link.getEntityPort1/2` → `EntityPort.create(uid, port)`
(`abel/Link.java:219-231`).

We emit `shieldTable` (`src/core/svek-dot-emit.ts:88-104`) with a single
`PORT="h"` covering the whole box, and the layout adapter passes **no port at
all** — the captured `DotInputEdge`s carry only `{minLen}`. Observed:

```
ruloso oracle: sh0008:pf75d91cdd…->sh0006      ours: sh0008:h->sh0006
sivime oracle: sh0009:p76423d83…->sh0006 (+2)  ours: sh0009:h->sh0006 (+2)
sigado oracle: sh0010:pf75d91cdd…, sh0009->…   ours: all :h
rocepa oracle: sh0006:pf75d91cdd…->sh0007:pc4ca…  ours: sh0006:h->sh0007:h
```

`pf75d91cdd36b85cc4a8dfeca4f24fa14` is md5("USA"), `peccbc87e4b5ce2fe28308fd9f2a7baf3`
md5("3") — the port ids are keyed by the row's text, confirming the mapping.

This is the dominant term in every map/field-port fixture's max delta: it moves
where the spline leaves and enters the node, which changes the whole route.

---

## Per-fixture rows

### beleso-08-ruca459
- Mechanism: the decor-driven endpoint swap reverses the DOT edge for `<--`, so graphviz ranks ಬಬ above bamboo where the jar ranks bamboo above ಬಬ.
- Origin side: upstream-of-layout
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/command/CommandLinkClass.java:363-364` (the only endpoint swap; guarded on LEFT/UP only), with `svek/SvekEdge.java:249-250` taking `getEntityPort1/2` verbatim.
- Ours: `src/diagrams/class/class-arrow-grammar.ts:248-249`; applied at `src/diagrams/class/class-relationship-parser.ts:380`; un-swapped only for hierarchical types at `src/diagrams/class/class-dot-graph.ts:216-218`.
- Causal chain: `swapDirection=true` for head1=`<`, head2=∅ → `rel.from`/`rel.to` reversed → emitted edge `sh0006->sh0007` instead of `sh0007->sh0006` → tail/head ranks exchange → `g[1]/rect@y`, `text@y`, `line@y1/@y2` and `g[2]`'s all move by the rank pitch 94.0, and the edge `path@d` / `polygon@points` are re-routed end-for-end (49.2 / 59.2).
- Ruled out: node sizing — the emitted node lines are byte-identical to the oracle (`width=1.621181,height=0.472222` and `width=0.896875,height=0.472222`), and the sizing unit test already pins them; engine placement — `dot -Tplain` on the oracle DOT reproduces the jar's y exactly (sh0007 top, sh0006 bottom), so graphviz and dot-engine agree given the same edge; identity mis-mapping — the box **widths** and x are correct in both, only y swaps.
- Residual: `@width`/`@height`/`@viewBox` differ by 1.0 (138×150 vs 137×149), unattributed here; ≤1 px and not the subject of this band.
- Verdict: fixable
- Shared with: fikojo-87-tine499, sarepa-89-cevi460 (and `class/baneru-00-kuro607`, `class/mopesi-01-gapo101` outside this band)

### fikojo-87-tine499
- Mechanism: identical to beleso-08-ruca459 — the fixture differs only in the alias glyphs (`概要` vs `ಬಬ`), which are never displayed.
- Origin side: upstream-of-layout
- Java origin: `CommandLinkClass.java:363-364`
- Ours: `src/diagrams/class/class-arrow-grammar.ts:248-249`
- Causal chain: as beleso — reversed DOT edge → rank exchange → 94.0 on both entities' y and the re-routed spline.
- Ruled out: an alias/text-encoding cause — the baseline records zero non-numeric diffs, and the diff sets of the three fixtures are element-for-element identical (23 diffs, max 94.0); node sizes byte-identical to the oracle.
- Verdict: fixable
- Shared with: beleso-08-ruca459, sarepa-89-cevi460

### sarepa-89-cevi460
- Mechanism: identical to beleso-08-ruca459 (alias `ಬಮ`).
- Origin side: upstream-of-layout
- Java origin: `CommandLinkClass.java:363-364`
- Ours: `src/diagrams/class/class-arrow-grammar.ts:248-249`
- Causal chain: as beleso.
- Ruled out: same evidence as fikojo — three independent fixtures, one diff set.
- Verdict: fixable
- Shared with: beleso-08-ruca459, fikojo-87-tine499

### gatefi-65-curu360
- Mechanism: our `shape=plaintext` map nodes are handed to the engine as `shape=box, fixedsize=true, width=49/72, height=18/72`, so graphviz's HTML-label padding (+4·GAP = 16 px wide, +2·GAP = 8 px tall) is never applied; the second map sits 16 px too far left.
- Origin side: upstream-of-layout
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java:269-297` (emits `shape=plaintext` + `<TABLE>` label, **no** width/height); padding applied by graphviz at `~/git/graphviz/lib/common/shapes.c:1993-2009` via `PAD` (`lib/common/macros.h:27-29`, `GAP` = `lib/common/const.h:251`).
- Ours: `src/core/graph-layout-build.ts:160-169` (`addOneNode` default branch) and `:47-49` (`layoutShape` folds `plaintext` → `box`).
- Causal chain: node box 49×18 instead of 65×36 → same-rank centre spacing 84 instead of 100 → `g[2]/rect@x` 91 vs 107 and `g[2]/text@x` 98 vs 114 (16.0), doc `@width`/`@viewBox[2]` 155 vs 170 (15.0 after margin rounding).
- Ruled out: edge routing — this fixture has zero edges, so the entire delta is node placement; measurement — `dot -Tplain` on the oracle DOT reports `w=65.00 h=36.00` for a 49×18 label, exactly label + 16 / floor 36; row ports — both maps are empty, the oracle table has a single portless `<TR>`.
- Verdict: fixable
- Shared with: lafemo-98-ruri220, rozuxo-44-fudi093, ruloso-59-nato909, sivime-00-gudo607, sigado-12-rina240, rocepa-35-gepo708

### lafemo-98-ruri220
- Mechanism: same missing plaintext label padding (C2) — the second map is 15.925 px left of the jar's; a second, smaller term is the row-port attachment (C3), which puts the flat edge at the node's vertical centre instead of the `abc`/`def` row.
- Origin side: upstream-of-layout
- Java origin: `svek/SvekNode.java:269-297` + `appendTr` `:298-311`; padding at `~/git/graphviz/lib/common/shapes.c:1993-2009`.
- Ours: `src/core/graph-layout-build.ts:160-169`; port table absent from `src/core/svek-dot-emit.ts:88-104` (`shieldTable`, single `PORT="h"`).
- Causal chain: node boxes 65.94×36 / 62.79×36 instead of graphviz's 81×44 / 78×44 → the Bar node and every glyph inside it move 15.925, doc `@width` 185 vs 201 (16.0, the max) → separately, the oracle edge runs `sh0006:p900150…->sh0007:p4ed940…` (row 2 of each table, drawn y 25–43, centre 34) while ours runs `sh0006:h->sh0007:h` (box centre, y 25), giving the flat edge's 9.0 px y delta.
- Ruled out: node **height** ranking — all rect `@y` match (single rank); text measurement — the row widths in the oracle table (65.9375, 62.7875) are our measured values to 4 dp; engine — the 16.0 is reproduced by real graphviz on the oracle DOT (`w=81.00`, `w=78.00`).
- Verdict: fixable
- Shared with: gatefi-65-curu360 (C2); rozuxo, ruloso, sivime, sigado, rocepa (C2 + C3)

### vocute-12-suxa445
- Mechanism: `skinparam classAttributeIconSize 16` is parsed but never reaches the visibility-modifier glyph — our icon size is the hardcoded default 10, so each icon draws 6×6 and each member row advances 14 px, where the jar draws 12×12 and advances 17 px.
- Origin side: upstream-of-layout (in fact renderer-only — it never reaches the layout at all)
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/cucadiagram/MethodsOrFieldsArea.java:366` passes `skinParam.classAttributeIconSize()` into `skin/VisibilityModifier.java#getUBlock`, whose square is `URectangle.build(size - 4, size - 4)` at `+2,+2` (`VisibilityModifier.java:178-180`) and whose block dimension is `size + 1` (`:100-102`); the default 10 is `skin/SkinParam.java:554-556`.
- Ours: `src/diagrams/class/class-visibility-icon.ts:67-71` — `VISIBILITY_ICON_SIZE = 10` with the standing comment *"skinparam override not wired"*, and `ICON_BLOCK_HEIGHT = VISIBILITY_ICON_SIZE + 1`.
- Causal chain: icon size 10 instead of 16 → `g[1]/g[1]/rect@width`/`@height` 6 vs 12, the `-`/`#`/`~` polygons and the `+` ellipse (`rx`/`ry` 3 vs 6) shrink and shift → row pitch `max(14, size+1)` = 14 instead of 17 → member text baselines drift 1.5/4.5/7.5/10.5 and the icon polygons up to 11.056 (the max).
- Ruled out: layout — the emitted node lines are byte-identical to the oracle (`width=1.857118,height=1.138889` = 133.7125×82 and `width=1.080382,height=0.472222`), i.e. upstream's own DOT box is *also* 82 tall even though its drawn rows overflow to y≈92, so the box size is not in question; `classAttributeFontSize 16` — both SVGs use `font-size="14"` for every member, so that skinparam is inert here and the pitch change comes from the icon block, not the font.
- Residual (not the max, and not isolated): a uniform +2 px x origin and −1.5 px y on the layout. The right-hand slack is identical in both files (14.29 px past the box), so it is purely a left-margin/x-origin difference, not a content-width one; the 1.5 px y tracks the edge-label table under-measure (ours `WIDTH="21" HEIGHT="13"` vs oracle `WIDTH="22" HEIGHT="15"`).
- Verdict: fixable
- Shared with: nulixu-97-nofi684

### nulixu-97-nofi684
- Mechanism: identical to vocute-12-suxa445 with `classAttributeIconSize 20` — icons 6×6 instead of 16×16, row pitch 14 instead of 21.
- Origin side: upstream-of-layout (renderer-only)
- Java origin: `cucadiagram/MethodsOrFieldsArea.java:366` → `skin/VisibilityModifier.java:178-180` (`size - 4`) and `:100-102` (`size + 1`).
- Ours: `src/diagrams/class/class-visibility-icon.ts:68`
- Causal chain: as vocute, scaled — `rect@width/@height` 6 vs 16, ellipse `rx`/`ry` 3 vs 8, member baselines 3.5/10.5/17.5/24.5 apart, ellipse `@cy` 26.167 (the max).
- Ruled out: the difference from vocute being a *layout* difference — the two fixtures' oracle DOTs are byte-identical to each other and to ours in the node lines, so the entire vocute↔nulixu spread (11.056 → 26.167) is intra-node drawing; font size (both `font-size="14"`).
- Verdict: fixable
- Shared with: vocute-12-suxa445

### rozuxo-44-fudi093
- Mechanism: the `CC::USA --> users::3` edge attaches to the whole node (`:h`) instead of the `USA` / `3` row ports, so the spline leaves and enters at the wrong height and takes a completely different route; the node y offset is C2.
- Origin side: unbuilt-subsystem (`SvekNode#appendLabelHtmlSpecialForLink` row-port tables / `WithPorts.getPorts`)
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekNode.java:269-297` (+`appendTr` `:298-311`); ports supplied by `cucadiagram/MethodsOrFieldsArea.java:81` (`implements WithPorts`) and threaded by `abel/Link.java:219-231`.
- Ours: `src/core/svek-dot-emit.ts:88-104` (`shieldTable`, one `PORT="h"`); the layout adapter carries no port at all — the captured `DotInputEdge` is `CC -> users attrs={"minLen":1}`.
- Causal chain: oracle `sh0006:pf75d91cdd…(USA row, height 14)->sh0007:peccbc87…(row "3")`, ours `sh0006:h->sh0007:h` → the jar's spline exits CC's right flank at y≈50 and swings out to x≈110 before entering users, ours runs straight down the centre at x≈41.7 → `g[3]/path@d` and `polygon@points` diverge up to 88.482, and doc `@width` 91 vs 125 (34.0) because the jar's route needs the extra width. Separately C2 adds +8 to every y below CC (rect `@y` 135 vs 143).
- Ruled out: node sizing — the oracle's row widths (69.4875, 48.2125) are our measured values to 4 dp, and the rank offset is exactly the 8 px `YPAD`; engine — the jar's route is a consequence of port attachment, which our engine was never told about, so no engine comparison on identical input is even possible here.
- Verdict: needs-maintainer-scoping (the row-port table is a named unported routine, not a local fix)
- Shared with: ruloso-59-nato909, sivime-00-gudo607, sigado-12-rina240, rocepa-35-gepo708, lafemo-98-ruri220 (secondary)

### ruloso-59-nato909
- Mechanism: same row-port omission — the map's internal `USA *--> Washington` and the incoming `NewYork --> CapitalCity::USA` both attach at `:h` instead of the `USA` row; C2 adds the 4/8 px node offsets.
- Origin side: unbuilt-subsystem
- Java origin: `svek/SvekNode.java:269-297`; `cucadiagram/TextBlockMap.java:66` supplies the map's ports; `abel/Link.java:219-231`.
- Ours: `src/core/svek-dot-emit.ts:88-104`; `src/core/graph-layout-build.ts:160-169` (C2).
- Causal chain: oracle `sh0008:pf75d91cdd…->sh0006` and `sh0007->sh0008:pf75d91cdd…`, ours `sh0008:h->…` and `…->sh0008:h` → `g[5]/path@d` diverges up to 84.951 and `polygon@points` up to 54.5; doc `@width` 109 vs 150 (41.0) for the jar's wider route. C2 contributes rect `@y` 197 vs 205 (8.0) on Washington and 101 vs 105 (4.0) on the map node itself (half, because it is centred in the padded box).
- Ruled out: rank order — both put NewYork top, CapitalCity middle, Washington bottom; node sizing — CapitalCity's oracle table rows are 81.8125 wide, our measured value, and `dot -Tplain` gives it 97×44 = 81.94+16 / 36+8.
- Verdict: needs-maintainer-scoping
- Shared with: rozuxo, sivime, sigado, rocepa

### sivime-00-gudo607
- Mechanism: same row-port omission across three map rows (`UK`, `USA`, `Germany`), each of which should anchor its edge at its own row y.
- Origin side: unbuilt-subsystem
- Java origin: `svek/SvekNode.java:269-297`; `cucadiagram/TextBlockMap.java:66`.
- Ours: `src/core/svek-dot-emit.ts:88-104`.
- Causal chain: oracle `sh0009:p76423d83…->sh0006`, `sh0009:pf75d91cdd…->sh0007`, `sh0009:pd8b00929…->sh0008` (md5 of "UK"/"USA"/"Germany"), ours all `sh0009:h->…` → all three splines leave the map from the same point → `g[6]/path` 53.484 and `g[7]/path` 55.609 (the max). C2 adds `g[1]/rect@x` 8.004 (half of 16) and `g[2]`/`g[3]` `@y` 4.0 (half of 8).
- Ruled out: ranking — London/Washington/Berlin land on the same ranks in both (the `minLen` 0/1/2 ladder is identical in ours and the oracle); node sizes — the leaf boxes' `@width` never differs.
- Verdict: needs-maintainer-scoping
- Shared with: rozuxo, ruloso, sigado, rocepa

### sigado-12-rina240
- Mechanism: sivime plus a fourth edge (`NewYork --> CapitalCity::USA`) that must enter at the `USA` row; all four attach at `:h`.
- Origin side: unbuilt-subsystem
- Java origin: `svek/SvekNode.java:269-297`; `cucadiagram/TextBlockMap.java:66`; `abel/Link.java:219-231`.
- Ours: `src/core/svek-dot-emit.ts:88-104`.
- Causal chain: oracle emits the three outgoing row ports plus `sh0009->sh0010:pf75d91cdd…`; ours emits `:h` for all four → the incoming NewYork edge is the worst affected, `g[9]/path@d` 91.771 (the max) and `polygon@points` 62.269. C2 gives `g[1]/rect@x` 8.004 and `g[2]`/`g[3]` `@y` 8.0.
- Ruled out: this being a different cause from sivime — the three shared edges reproduce sivime's diffs to the digit (`g[7]` max 53.484, `g[8]` max 55.609 here; `g[6]`/`g[7]` there), so the only new term is the fourth edge.
- Verdict: needs-maintainer-scoping
- Shared with: sivime-00-gudo607, rozuxo, ruloso, rocepa

### rocepa-35-gepo708
- Mechanism: `CC::USA --> users::1` between two 3-row maps; both endpoints should be row ports, both are `:h`.
- Origin side: unbuilt-subsystem
- Java origin: `svek/SvekNode.java:269-297`; `cucadiagram/TextBlockMap.java:66`.
- Ours: `src/core/svek-dot-emit.ts:88-104`; C2 at `src/core/graph-layout-build.ts:160-169`.
- Causal chain: oracle `sh0006:pf75d91cdd…(USA)->sh0007:pc4ca4238…("1")`, ours `sh0006:h->sh0007:h` → the jar's spline leaves CC's flank at the USA row and enters users at row 1, ours runs centre-to-centre → `g[3]/path@d[0]` 82.713 vs 159 and a max of 133.277, `polygon@points` 49.787, doc `@width` 163 vs 220 (57.0). C2 adds the 8.0 y offsets on the lower map.
- Ruled out: node sizing — the oracle rows are 151.425 / 72.2375 wide, our measured values to 4 dp, and `dot -Tplain` gives 167×80 / 88×80 = +16/+8 exactly; text/ordering — zero non-numeric diffs.
- Verdict: needs-maintainer-scoping
- Shared with: rozuxo, ruloso, sivime, sigado

### tujasu-04-nota700
- Mechanism: on the **flat** (same-rank) labelled edge `y - h`, the `taillabel`/`headlabel` quantifiers ("0,n") are not recovered from the engine's render, so both collapse onto the edge-label centre instead of sitting beside their own endpoints.
- Origin side: upstream-of-layout
- Java origin: `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:249-250` builds the edge from `getEntityPort1/2`; the tail/head label tables are emitted alongside `label=` in the same edge line (present in both DOTs).
- Ours: `src/core/graph-layout.ts:388-399` — `extractPortLabelPositions(renderedSvg, …)` only fills `tailLabelX/Y`/`headLabelX/Y` when it finds them in dot-engine's rendered SVG; when it does not, the renderer falls back to the edge-label position.
- Causal chain: for the flat edge, ours emits both quantifiers at `x=168.043` (y 75.55 and 59.05) while the jar puts them at `x=63.166` (beside `Yop`) and `x=263.798` (beside `Hello`), y≈97.1 — `text[4]@x` 104.877 (the max) and `text[5]@x` 95.755. The **vertical** edge `y -> z` in the same file *does* get distinct positions (`g[6]` deltas only 3.7 / 9.25), which localises the failure to the flat-edge path rather than to tail/head labels in general.
- Ruled out: node sizing and ranking — the emitted node lines are identical to the oracle and `dot -Tplain` on the oracle reproduces our engine's ranks and x for `y` and `z` (y at x 9.36 in both, z at x 0 in both); the title — the title text baseline is `y="20.889"` in both files, so the 7.25 px body offset is not a title-height difference.
- Residual (not the max, not isolated): a uniform +7.25 px body offset and a 9.0 px x on `Hello`. Partially explained by the flat edge's label table being under-measured — oracle `WIDTH="200" HEIGHT="41"` vs ours `WIDTH="199" HEIGHT="39"` — but 2 px of label height does not account for 7.25 px of band, so the remainder is unresolved and should not be attributed without further instrumentation of the flat-edge label band.
- Verdict: needs-maintainer-scoping (the max is a flat-edge port-label gap; the 7.25 px residual is undiagnosed)
- Shared with: — (the edge-label table under-measure is shared with vocute/nulixu; the port-label collapse is unique in this band)

---

## Shared mechanisms, ordered by reach

**C2 — missing graphviz HTML-label padding on `shape=plaintext` nodes
(+4·GAP = 16 px wide, +2·GAP = 8 px tall, floors 54 × 36).**
Origin `src/core/graph-layout-build.ts:160-169` / `:47-49`; upstream
`svek/SvekNode.java:269-297` emits no width/height, graphviz pads at
`shapes.c:1993-2009` / `macros.h:27-29` / `const.h:251`.
Fixtures in this band: **gatefi, lafemo, rozuxo, ruloso, sivime, sigado,
rocepa (7)**. It is the *sole* cause on gatefi and the *max* on gatefi and
lafemo — the "16.0 pair" is one cause, confirmed. Reach beyond this band:
every object fixture containing a `map` or a `::` port reference (28 of 80
object fixtures grep-positive), plus the same node class in class/description.

**C3 — row-port DOT tables unported (`appendLabelHtmlSpecialForLink` /
`WithPorts.getPorts`).** Origin: absent from `src/core/svek-dot-emit.ts`
(which has `shieldTable` `:88-104` and `portTable` but no row table) and from
the layout adapter, which carries no port on any edge; upstream
`svek/SvekNode.java:269-311`, `cucadiagram/TextBlockMap.java:66`,
`cucadiagram/MethodsOrFieldsArea.java:81`, `abel/Link.java:219-231`.
Fixtures: **rozuxo, ruloso, sivime, sigado, rocepa (5 as the max), lafemo (as
a 9 px secondary)**. This is the single largest remaining object mechanism by
delta magnitude and is not a local fix.

**C1 — decor-driven endpoint swap reverses the DOT edge for left-headed,
non-hierarchical arrows.** Origin `src/diagrams/class/class-arrow-grammar.ts:248-249`
→ `class-relationship-parser.ts:380`, un-swapped only for
extension/implementation at `class-dot-graph.ts:216-218`; upstream swaps only
on a `-left-`/`-up-` direction word (`CommandLinkClass.java:363-364`).
Fixtures: **beleso, fikojo, sarepa (3)** — the "94.0 triple" is one cause,
confirmed. Reach: 8 object fixtures have a left-headed arrow at line start,
and the defect is not object-specific (`class/baneru-00-kuro607`,
`class/mopesi-01-gapo101` both show the reversal). Cheapest of the three to
fix and the only one whose fix is a single predicate.

**C4 — `classAttributeIconSize` not wired to the visibility glyph.**
Origin `src/diagrams/class/class-visibility-icon.ts:67-71`
(`VISIBILITY_ICON_SIZE = 10`, marked "skinparam override not wired");
upstream `cucadiagram/MethodsOrFieldsArea.java:366` →
`skin/VisibilityModifier.java:178-180`/`:100-102`, default at
`skin/SkinParam.java:554-556`.
Fixtures: **vocute, nulixu (2)**. Renderer-only — it never touches the DOT.

**C5 — edge-label table under-measured by ~1 px wide / 2 px tall.**
Ours `WIDTH="21" HEIGHT="13"` vs oracle `22`/`15` (vocute, nulixu);
`199`/`39` vs `200`/`41` (tujasu). Fixtures: **vocute, nulixu, tujasu (3)**,
worth 1.5–2 px of rank separation each. Sub-mechanism, listed for completeness.

**C6 — flat-edge tail/head label positions not recovered.**
Ours `src/core/graph-layout.ts:388-399`. Fixtures: **tujasu (1)**, but it owns
that fixture's max (104.877).

## Not found

No fixture in this band qualifies as `gvts-blocked`. For all 13 the DOT we
hand the engine differs from the oracle's in at least one of: edge direction
(C1), node label form and effective box (C2), port attachment (C3), or label
table size (C5). The engine was never given identical input, so no
engine-attributable coordinate delta could be measured, and none is claimed.
