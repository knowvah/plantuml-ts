# Flat (same-rank) labelled edge picks the mirrored label-box side for some label widths

**Impact:** `class/nugecu-04-tona107`. Filed by plantuml-ts mission
`class-divergence-drive-3`, task T6 (diagnosed as E2-7 in
`plans/class-divergence-drive-3/diagnosis/E2.md`).

**Finding.** A labelled flat (`minlen=0`, same-rank) edge `A->B` with a label
node between them routes through the corridor graphviz's
`make_flat_labeled_edge` builds around the label box. For **some** label
widths dot-engine's spline is the exact left-right mirror image of real
graphviz's about the label's own centre x — real routes the middle waypoint
through the label box's RIGHT side, dot-engine through the LEFT (or vice
versa), while every other geometry input (node positions, label box, `lp`)
is identical. For other widths the two engines agree exactly. This is a
tie-break divergence in the box-corridor shortest-path search, not a
constant offset.

## Repro (width sweep, `TABLE WIDTH` varied, DOT otherwise fixed)

```dot
digraph unix {
nodesep=0.486111; ranksep=0.833333; remincross=true; searchsize=500;
sh0006->sh0007[arrowtail=none,arrowhead=none,minlen=0,color="#000009",
  label=<<TABLE BGCOLOR="#00000A" FIXEDSIZE="TRUE" WIDTH="<N>" HEIGHT="15"><TR><TD></TD></TR></TABLE>>];
sh0008->sh0007[arrowtail=none,arrowhead=none,minlen=0,color="#00000D"];
sh0006 [shape=rect,label="",width=0.574479,height=0.666667,color="#000006"];
sh0007 [shape=rect,label="",width=0.574479,height=0.666667,color="#000007"];
sh0008 [shape=rect,label="",width=0.585417,height=0.666667,color="#000008"];
}
```

Re-verified 2026-09-25, real graphviz 16.1.0 vs dot-engine 1.6.0, both
`-Tdot`, `sh0006->sh0007` `pos=`:

| WIDTH | real graphviz | dot-engine | agree? |
|---|---|---|---|
| 5 | `41.727,46.983 55.474,60.228 74.639,75.625 95.181,82.75 120.31,91.467 144.16,68.091 159.06,48.289` | identical | yes |
| 9 | `36.829,48.435 52.196,68.337 76.698,91.779 102.18,82.75 122.03,75.716 140.42,60.676 153.71,47.575` | `41.655,47.575 54.944,60.676 73.33,75.716 93.181,82.75 118.66,91.779 143.17,68.337 158.53,48.435` | **NO — mirrored** |
| 12 | `41.73,48.171 54.663,61.124 72.413,75.812 91.681,82.75 117.59,92.081 142.75,68.223 158.44,48.161` | identical | yes |
| 20 | `37.954,48.474 54.586,68.758 81.071,92.764 107.68,82.75 126.07,75.83 142.7,61.317 154.8,48.448` | `40.566,48.448 52.66,61.317 69.293,75.83 87.681,82.75 114.29,92.764 140.78,68.758 157.41,48.474` | **NO — mirrored** |
| 30 | `38.718,48.408 49.791,61.264 65.187,75.778 82.681,82.75 95.067,87.686 100.3,87.686 112.68,82.75 130.18,75.778 145.57,61.264 156.64,48.408` | identical | yes |

For WIDTH=9 and WIDTH=20, reversing dot-engine's point list and mirroring
each x about the label centre (`lp.x` = 97.681 for WIDTH=9) reproduces
real's list to the printed digit — e.g. dot-engine's last point
`158.53,48.435` mirrors to `2*97.681-158.53=36.832 ≈ 36.829` (real's first
point), with y unchanged. `lp=` itself, node positions, and the label box
are identical on both engines and across all five widths; only the routed
side flips, and only for WIDTH 9/20.

**Ruled out (falsified — don't chase):** our DOT emission (`diff` against
the cached oracle `svek-1.dot` for `nugecu-04-tona107` prints nothing);
`remincross`/`searchsize` (removing them: still mirrors); arrowheads (adding
them: still mirrors); label kind (a plain `label="u"` string, not an HTML
table, agrees within 0.4px — the mirror is specific to the HTML-table label
path).

**Suspected graphviz C source area:**
`lib/dotgen/dotsplines.c#make_flat_labeled_edge` (read 2026-09-25, lines
~1314-1401 in the checked-out source). For the non-`EDGETYPE_LINE` case it
builds a 3-box corridor around the label box `lb` — one box from the tail
side up to `lb`'s bottom, one spanning both sides at the label's own y-band,
one from `lb`'s top down to the head side — and routes through it with
`routesplines`/`routepolylines`. That corridor is close to symmetric about
the label box for a small/plain label; the shortest-path box search inside
`routesplines` (not itself read) is the likely site of the tie-break that
flips sides for specific label widths. Not traced past `make_flat_labeled_edge`
into `routesplines`'s own box-to-box search.

**Workaround in plantuml-ts:** none applied; the mirrored route is still a
geometrically valid path around the label, and any compensation here would
be fitting a tie-break the engine should resolve the same way real graphviz
does.
