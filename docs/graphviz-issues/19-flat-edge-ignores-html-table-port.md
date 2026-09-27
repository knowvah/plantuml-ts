# A flat (same-rank) edge ignores a `tailport`/`headport` on an HTML-table node

**Impact:** every `minlen=0` (same-rank) class-diagram edge whose endpoint
is a qualified association end — PlantUML's `Kal` shield, `svek/SvekNode
.java:245-267` + `Bibliotekon#getNodeUid`'s `:h` suffix. Concretely
`class/mucoti-34-seve858`, `class/sefazi-02-defe499` and the third link of
`class/camuna-58-veca254`. Filed by plantuml-ts mission
`class-divergence-drive`, task T15.

**Finding.** A node declared as `shape=plaintext` with an HTML `label=`
table that carries `PORT="h"` on one cell, and **no** `width`/`height`/
`fixedsize`, is laid out at the padded table size. An edge that targets
that port (`sh0007:h->sh0008`) must start at the **port cell's** boundary,
not at the node's bounding box.

dot-engine does that correctly for a RANKED edge and **not** for a flat
(`minlen=0`, same-rank) one:

| fixture | edge | port cell edge | dot-engine spline end | real graphviz |
|---|---|---|---|---|
| `baneru-00-kuro607` | `sh0006:h->sh0007`, `minlen=1` | y=55 | y=54.818 ✔ | y≈54.82 |
| `mucoti-34-seve858` | `sh0007:h->sh0008`, `minlen=0` | x=79.28 | x=142.879 ✘ | x=78.9 |
| `sefazi-02-defe499` | `sh0007->sh0008:h`, `minlen=0` | x=170.1 | x=101.453 ✘ | x=170.55 |

In both failing cases dot-engine's endpoint is the node's own BOUNDING BOX
edge (mucoti: the table's right edge at 142.875; sefazi: the table's left
edge), i.e. the port is dropped and the whole shield margin is treated as
solid node.

**Controlled experiment (isolates the variable).** The `real graphviz`
column above is `dot -Tplain` (graphviz 16.1.0) run on the **cached oracle
DOT itself** — `test-results/dot-cache/class/<slug>/svek-1.dot` — not on a
re-serialisation, so the input text is byte-identical for both engines:

```
$ dot -Tplain test-results/dot-cache/class/mucoti-34-seve858/svek-1.dot
node sh0007 0.99306 0.38889 1.9861 0.77778 <<TABLE …PORT="h"…>> …
edge sh0007 sh0008 4 1.0959 0.23844 1.4945 0.19638 2.0604 0.19599 2.4622 …
```

`1.0959in = 78.9px`, with `sh0007` spanning `0 .. 143px` — i.e. real
graphviz starts the flat edge 78.9px in, at the port cell, exactly as the
jar's own rendered SVG does (`<path d="M77.9,41.83 …">`, after its own
5px decoration trim).

The same graph through dot-engine starts the spline at 142.879px.

**What is NOT the cause (falsified — don't chase):**

- **The port name never reaching the engine.** It does: the ranked
  `baneru` case uses the identical `DotInputEdge.attributes.tailport = 'h'`
  seam (`core/graph-layout-build.ts#addEdges`) and lands on the cell.
- **The HTML table not being parsed.** The table's own sizing IS honoured —
  the node comes back at the padded table size on both engines
  (`mucoti` sh0007: 1.9861in on both), which is only possible if the
  table (and therefore its cells) was laid out.
- **Our shield-margin values.** All 19 qualifier fixtures' emitted DOT node
  sizes AND shield margins are byte-equal to the cached oracle
  `svek-N.dot` (T15 step 8).

**Workaround in plantuml-ts:** none applied. The residual is small
(`mucoti-34-seve858` +1 diff against the pre-T15 baseline; `sefazi` and
`camuna` still improve by 35 and 142 diffs respectively) and any
compensation here would be fitting a number the engine should produce.

## Re-verified 2026-09-25 (class-divergence-drive-3, T5), real graphviz 16.1.0 vs dot-engine 1.6.0

Still open, and it covers **7 class fixtures and 9 edges** (camuna and nafiki added 2026-09-26, see below). Each edge fails
in dot-engine with a `triangulation failed` diagnostic, exactly one per
failing edge; real `dot` prints none. The input is the byte-identical
cached `svek-1.dot`, run through real `dot -Tdot` and through dot-engine
`render(parse(src), 'dot')`. Every other node and edge in these graphs
matches to the printed digit, and `-Tsvg` (the 2-dp text the jar reads)
matches Δ=0.000:

| fixture | edge | real graphviz `pos` | dot-engine `pos` |
|---|---|---|---|
| `coxose-20-nifu136` | `sh0010:h->sh0006:h` | `56.983,176 78.33,176 110.68,176 138.69,176` | `e,111.02,176 76.315,176 83.644,176 91.496,176 99.545,176` |
| `coxose-20-nifu136` | `sh0006:h->sh0008:h` | `253.42,176 280.25,176 310.85,176 331.29,176` | `e,315.78,176 280.73,176 288.58,176 296.43,176 304.28,176` |
| `ririlu-13-zipi740` | same two edges | identical to coxose | `sh0010:h->sh0006:h` identical to coxose; `sh0006:h->sh0008:h` = `e,315.86,176 280.89,176 288.89,176 296.83,176 304.38,176` |
| `mucoti-34-seve858` | `sh0007:h->sh0008` | `78.903,17.168 107.61,14.139 148.35,14.111 177.28,17.082` | `e,177.38,28.788 143.44,28.588 150.95,28.632 158.46,28.676 165.98,28.72` |
| `sefazi-02-defe499` | `sh0007->sh0008:h` | `72.081,28 101.04,28 141.84,28 170.55,28` | `e,105.91,27.412 71.915,27.212 78.871,27.253 86.49,27.298 94.453,27.345` |
| `rifuzu-80-nixo780` | `sh0007:h->sh0009` | `184.94,15.164 216.21,14.424 250.19,15.104 276.49,17.205` | `e,276.45,28.794 242.49,28.645 250,28.678 257.52,28.711 265.04,28.744` (`head_lp` 260.99,23.705 → 260.95,35.294) |
| `camuna-58-veca254` | `sh0007:h->sh0009` | `184.84,46.954 207.12,49.517 231.02,50.285 253.09,47 258.58,46.183 264.25,44.983 269.84,43.576` | `e,270.03,28.789 207.36,28.504 224.5,28.582 241.63,28.66 258.77,28.738` |
| `nafiki-56-jixu680` | `sh0007:h->sh0009` | identical to rifuzu | identical to rifuzu |

The engine output is a straight 4-point stub. It starts at the node's
bounding box, not at the port cell, and carries an `e,` endpoint even
though the edge has `arrowhead=none`. That points to the
routespline/shortest-path fallback after `triangulation failed`, not to
port resolution. The plantuml-ts side of this is clean: the graph that
`layoutGraph()` builds lays out on dot-engine exactly like the cached DOT
(`B-api-vs-real.mts`, 0 node mismatches in all 5 fixtures). The full
artifact is in `plans/class-divergence-drive-3/diagnosis/B.md` (B-4).

## Added 2026-09-26 (class-divergence-drive-4 planning): camuna, nafiki

`camuna-58-veca254` and `nafiki-56-jixu680` were attributed to this issue in
the cdd3 ledger but were not in the T5 table. The same probe (cached
`svek-1.dot` -> real `dot -Tdot` 16.1.0 vs dot-engine 1.6.0
`render(parse(src), 'dot')`) reproduces the same signature on both. dot-engine
prints exactly one `triangulation failed` and real dot prints none. The one
diverging edge is the flat `sh0007:h->sh0009`, rendered as the 4-point `e,`
stub. Every other edge `pos` agrees within 0.01. These are the whole
remaining class residual of both fixtures (camuna 1/18, nafiki 0/24 after
cdd3 T11).
