# Flat labelled `minlen=0` edge spline diverges from real graphviz on a larger graph (not a label-side mirror)

**Impact:** `class/givoli-70-rade072`, `class/tekena-28-fobe713` (byte-identical
source to givoli), `class/nadepi-13-mufu566` (drops `skinparam svek true`).
Filed by plantuml-ts mission `class-divergence-drive-3`, task T6 (diagnosed
as C-12 in `plans/class-divergence-drive-3/diagnosis/C.md`).

**Finding.** The flat (`minlen=0`) labelled edge
`sh0030->sh0014` (`ClassicalWavePropagator -> Potential : has`) routes with a
visibly different spline in dot-engine than in real graphviz, while both
engines place every node identically and agree on the label position
(`lp="1063,902.5"` on both). Same feature area as issue 23 (flat labelled
edge routing, `make_flat_labeled_edge`), but **not the same mirror
mechanism** — checked explicitly (see below) and ruled out.

## Repro

`test-results/dot-cache/class/givoli-70-rade072/svek-1.dot`. The relevant
declarations:

```dot
sh0030->sh0014[arrowtail=none,arrowhead=none,minlen=0,color="#00008D",
  label=<<TABLE BGCOLOR="#00008E" FIXEDSIZE="TRUE" WIDTH="22" HEIGHT="15"><TR><TD></TD></TR></TABLE>>];
sh0014 [shape=rect,label="",width=3.750521,height=1.055556,color="#00000E"];
sh0030 [shape=rect,label="",width=4.519792,height=1.638889,color="#00001E"];
```

Re-verified 2026-09-25, `dot -Tdot svek-1.dot` (real graphviz 16.1.0) vs
dot-engine 1.6.0 `render(parse(dot), 'dot', {engine:'dot'})` on the SAME
cached DOT file:

```
real:   lp="1063,902.5" pos="1169.7,850.43 1141.2,864.71 1109.2,877.94 1078,885.25 930.09,919.93 755.7,868.88 652.81,829.44"
engine: lp="1063,902.5" pos="1179.7,850.39 1153.8,864.66 1124.7,877.9 1096,885.25 941.79,924.74 758.19,870.42 651.99,829.33"
```

`lp` (label position) is identical. Node positions `sh0030 x=1268.04` and
`sh0014 x=564.04` are within 0.04px of real on both sides. But the spline
itself diverges by up to +18px on the interior control points, and — unlike
issue 23 — it is **not a mirror**: mirroring dot-engine's points about the
label centre (`lp.x=1063`) does not reproduce real's list (mirrored/reversed
dot-engine x: `1474.0, 1367.8, 1184.2, 1030.0, 1001.3, 972.2, 946.3` against
real's `1169.7, 1141.2, 1109.2, 1078, 930.09, 755.7, 652.81` — no
correspondence), and the two engines' own y-values differ point-for-point
(`850.39` vs `850.43`, `924.74` vs `919.93`, etc.), where issue 23's mirror
pairs always matched y exactly. See
`plans/class-divergence-drive-3/diagnosis/scratch/T6-c12-mirror-check.mts`
for the check.

**Ruled out (falsified — don't chase):** the E2-7/issue-23 mirror mechanism
(checked directly above — not a match); our DOT emission (differs from the
cached `svek-1.dot` only in cluster naming/formatting; real `dot -Tdot` on
our own emitted DOT reproduces the identical `pos` string, confirming the
divergence is inside the engine, not our DOT builder); node placement (both
nodes agree with real to <0.1px).

**Suspected graphviz C source area:** same as issue 23 —
`lib/dotgen/dotsplines.c#make_flat_labeled_edge` and the `routesplines` box
search it calls — but this fixture's local subgraph is materially more
complex than issue 23's 3-node repro (the label node `sh0030` also has a
same-rank `sh0030->sh0031` edge and a ranked `sh0030->sh0029` edge with its
own tail/head labels immediately adjacent), so the divergence here may come
from a different box-corridor construction than the plain tie-break in
issue 23, not narrowed further.

**Workaround in plantuml-ts:** none applied; the residual is a spline-shape
delta only (both engines agree on node placement and label position), and
any compensation here would be fitting a number the engine should produce.
