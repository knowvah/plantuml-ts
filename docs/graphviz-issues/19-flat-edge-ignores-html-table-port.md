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
