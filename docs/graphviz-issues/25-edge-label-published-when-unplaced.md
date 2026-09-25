# `EdgeGeometry.label` is published even when graphviz leaves the label unplaced (`ED_label(e)->set` false)

**Impact:** `class/delasa-80-jusu462` (3 edges: `sh0166->sh0253`,
`sh0253->sh0168`, `sh0253->sh0185`). Filed by plantuml-ts mission
`class-divergence-drive-3`, task T6 (diagnosed as E3-12 in
`plans/class-divergence-drive-3/diagnosis/E3.md`).

**Finding.** Graphviz's force-search (`searchsize`) can fail to find a spot
for a centre edge label and leave it at the origin, unplaced — `ED_label(e)
->set` is `false` and `emit.c` (`emit_edge_label`, not re-read this pass; the
prior diagnosis cites `:2891`) skips drawing it entirely, so real `-Tsvg`
never emits a `<text>` for that label. `-Tjson`/`-Tdot` still print an
`lp="0,8"` sentinel and the label attribute text regardless — the presence
of the raw `label=` attribute in the JSON/dot output is not itself a signal
of placement; `set` is a separate internal flag not exposed on those
formats. dot-engine's typed `getLayout()` API already gates `tailLabel`,
`headLabel`, and `xlabel` on this "was it actually placed" condition
(`api/geometry.d.ts:86-99` returns them as absent when unset) but does
**not** apply the same gate to the plain centre `label` field — it always
publishes a `{x, y}` for `label`, even at the sentinel/origin position that
means "never placed."

## Repro

`test-results/dot-cache/class/delasa-80-jusu462/svek-1.dot`. Real
`dot -Tjson` on the 3 affected edges reports `lp: "0,8"` for all three
(the sentinel graphviz uses for "not placed" in this graph's frame), and
`-Tsvg` draws no `<text>` in any of the three labels' colours
(`#00023E`/`#000496`/`#00053E` — 0 matches in the rendered SVG, re-verified
2026-09-25).

dot-engine 1.6.0's `getLayout()` (`parse` + `render(g,'svg',{engine:'dot'})`
+ `getLayout(g,{yAxis:'down'})`) on the SAME cached DOT:

```
sh0166->sh0253 label= {"x":0,"y":2643.999...} tailLabel= undefined headLabel= undefined
sh0253->sh0168 label= {"x":0,"y":2643.999...} tailLabel= undefined headLabel= undefined
sh0253->sh0185 label= {"x":0,"y":2643.999...} tailLabel= undefined headLabel= undefined
```

(`x=0` here is the y-axis-flipped frame's own origin sentinel, corresponding
to real's `lp.x=0`.) `label` is present and non-null for all three, where a
consumer has no way to distinguish "really placed at x=0" from "never
placed." Probe:
`plans/class-divergence-drive-3/diagnosis/scratch/T6-e3-12-label-gate.mts`.

**Ruled out (falsified — don't chase):** the label text/attribute not
reaching the engine (it does — `label=` is present verbatim in both `-Tjson`
outputs); a plantuml-ts-side gap (this is `getLayout()`'s own typed output,
read directly, not routed through any plantuml-ts consumption code).

**Suspected graphviz C source area:** `emit.c#emit_edge_label` (cited by the
prior diagnosis pass at line ~2891, not re-read this pass) gates the SVG
`<text>` draw on `ED_label(e)->set`; dot-engine's own gating for
`tailLabel`/`headLabel`/`xlabel` in its `EdgeGeometry` type shows the `set`
flag is already tracked internally for those three fields — the fix is to
apply the identical `set` check to the plain `label` field before populating
`EdgeGeometry.label`.

**Consumer note (not this repo's fix to make until the gate lands):** once
gated, `class/class-edge-geo.ts` (plantuml-ts) should stop drawing a label
and reserving ink when `label` comes back absent, mirroring how it already
handles absent `tailLabel`/`headLabel`/`xlabel`.
