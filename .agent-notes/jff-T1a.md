# jff-T1a: dot-engine re-render idempotence (D3)

Closes the jfp-b1 observation "dot-engine re-render of the same graph object is
not idempotent". D3 outcome: **filed** as
`docs/graphviz-issues/37-rerender-not-idempotent.md` with one TRACKER line.
Reuse is implied: `render` runs native's layout, render, free cycle itself. Native
libgvc 16.1.0 is idempotent under that cycle.

## Observation: render() twice on one dot-engine Graph flattens the second layout

- **Context**: jff T1a. I reproduced the jfp-b1 note in a scratch script
  outside `src/`, using the API `layoutGraph` uses (`createGraph` →
  `addNode`/`addEdge` → `render(b.graph, …)` → `getLayout`,
  `src/core/graph-layout.ts:386-403`). dot-engine is 2.4.0.
- **Finding**: `digraph{a->b}`. Coordinates are from
  `getLayout(g, {yAxis:'up'})`; edge points are the cubic bezier control points.
  - Render 1: `a 27,90 / b 27,18`, bounds 54x108. Edge at x=27, y 71.697 / 64.407 / 55.726 / 47.536.
    Plain output: `graph 1 0.75 1.5`, `node a 0.375 1.25`, `node b 0.375 0.25`,
    `edge a b 4 0.375 0.99579 0.375 0.89454 0.375 0.77398 0.375 0.66022`.
  - Render 2, same object: `a 27,18 / b 99,18`, bounds 126x36. Edge at x=54,
    same y values (the first pass's bezier, translated +27).
    Plain output: `graph 1 1.75 0.5`, `node a 0.375 0.25`, `node b 1.375 0.25`,
    `edge a b 4 0.75 0.99579 0.75 0.89454 0.75 0.77398 0.75 0.66022`.
  - Render 3, same object: `a 27,90 / b 27,18` again, bounds 54x108. Edge at
    x=81, same y values. Plain edge x is 1.125. `spl.list.length` stays 1.
  - `parse('digraph{a->b}')` rendered twice gives the same plain output as the
    builder in renders 1 and 2.
  - Control (fresh `parse`, render once): byte-identical to render 1, at
    `a 27,90 / b 27,18` with the edge at x=27.
- **Impact**: any harness that calls `render`/`renderAsync`/`getDrawOps` more
  than once on one `Graph` gets wrong output from the second call on. Production
  is unaffected: `layoutGraph` renders each builder graph once
  (`src/core/graph-layout.ts:399`).
- **Confidence**: High. Three renders, two graph sources, a control, a native
  comparison and a field-level counterfactual.

## Observation: dot-engine's contract implies Graph reuse; README is silent on it

- **Context**: jff T1a, D3's "reuse permitted?" test.
- **Finding**: no text says a Graph is single-use. Three passages imply it can
  be reused:
  - `node_modules/@knowvah/dot-engine/dist/render/public.d.ts:48`: "Lifecycle:
    createDefaultContext → layout → deviceRender → freeLayout." The bundled
    body (`dist/index.js:55733-55745`, `src/render/public.ts`) runs
    `ctx.layout(g, engine); render(…); ctx.freeLayout(g, engine)` on every
    call.
  - `dist/gvc/context.d.ts:185-188`: "Engine cleanup is deferred to
    freeLayout, matching C's gvLayoutJobs / gvFreeLayout split". At `:201` and
    `:205`: "Release engine layout state after rendering. … @see
    lib/gvc/gvlayout.c:gvFreeLayout".
  - `dist/api/geometry.d.ts:237`: `getLayout` "Must be called **after**
    `ctx.layout(g, engine)` (or `render`) has run". So the Graph stays live
    after `render`.

  `README.md:447` (the `render(g: Graph, …)` signature) and `README.md:463-468`
  ("driving layout and rendering as separate steps") are silent on repeated
  render and on single-use.
- **Impact**: D3's "reuse permitted" condition holds, by implication from an
  API analogous to native's free cycle.
- **Confidence**: High

## Observation: native libgvc is idempotent across gvFreeLayout and reproduces dot-engine without it

- **Context**: jff T1a. Scratch C program
  `/private/tmp/claude-501/jff-T1a/twice.c` (not committed; the full source is
  in issue 37), built with
  `cc -o twice twice.c -I/opt/homebrew/include -L/opt/homebrew/lib -lgvc -lcgraph`
  against homebrew graphviz 16.1.0. It runs `agmemread("digraph{a->b}")`,
  then three rounds of `gvLayout(dot)` → `gvRenderData(plain)`, with
  `gvFreeLayout` between rounds (default) or not (`nofree`), then a fresh
  `agmemread` control.
- **Finding**:
  - With `gvFreeLayout`: all three layouts and the control are
    byte-identical: `graph 1 0.75 1.5 / node a 0.375 1.25 / node b 0.375 0.25 /
edge a b 4 0.375 0.99579 0.375 0.89454 0.375 0.77398 0.375 0.66022`. All
    return codes are 0.
  - Without `gvFreeLayout`, layout 2 is `graph 1 1.75 0.5 / node a 0.375 0.25 /
node b 1.375 0.25 / edge a b 8 0.75 0.99579 0.75 0.89454 0.75 0.77398 0.75
0.66022 0.75391 0.25 0.78171 0.25 0.80951 0.25 0.83731 0.25`.
  - Without `gvFreeLayout`, layout 3 is `graph 1 0.75 1.5 / node a 0.375 1.25 /
node b 0.375 0.25 / edge a b 12 1.125 0.99579 … 1.2123 0.25 0.375 0.99579 …
0.375 0.66022`.

  dot-engine's renders 2 and 3 match native-without-free exactly on the graph
  and node lines and on the first bezier. Native also appends the new route
  (`new_spline`, `lib/common/splines.c:216-220`). dot-engine keeps a single
  translated bezier.

- **Impact**: dot-engine's `freeLayout` behaves as if `gvFreeLayout` were not
  called. Under D3 this is the filing branch.
- **Confidence**: High

## Observation: mechanism: dotCleanup leaves e.info.to_virt and e.info.spl in place

- **Context**: jff T1a, tracing the departure from native.
- **Finding**: native deletes the per-object layout records:
  - `gv_cleanup_edge` → `agdelrec(e,"Agedgeinfo_t")`, `lib/common/utils.c:1522`
  - `dot_cleanup_node` → `agdelrec(n,"Agnodeinfo_t")`, `lib/dotgen/dotinit.c:114`
  - `graph_cleanup` → `agclean(g,AGRAPH,"Agraphinfo_t")`, `lib/common/input.c:802`,
    called from `gvFreeLayout`, `lib/gvc/gvlayout.c:118`

  `dot_init_edge` then binds a zeroed record (`lib/dotgen/dotinit.c:62`).

  dot-engine's `dotCleanup` (`src/layout/dot/init.ts`, `dist/index.js:24340`)
  only clears the fast-graph lists on `nlist` nodes. All `info` records
  survive. The stale `e.info.to_virt` makes `class1Edge`
  (`src/layout/dot/classify.ts`, `dist/index.js:22276`, a faithful port of
  `lib/dotgen/class1.c:72-74` "skip edges already processed") skip the edge. As
  a result `a->b` gets no rank constraint and both nodes are placed on rank 0.
  The stale `e.info.spl` keeps the old bezier, which gets translated.

  Counterfactual (scratch, info records copied before render 1 and restored
  before render 2):
  - graph-only or node-only restore: not idempotent
  - edge-only restore: idempotent
  - `to_virt` + `spl` together: idempotent
  - every edge field except `to_virt`: flattened nodes, new flat route
  - every edge field except `spl`: correct nodes, stale bezier
  - any single field: not idempotent

- **Impact**: the fix belongs in dot-engine. A literal `agdelrec` would break
  `getLayout`-after-`render` (`api/geometry.d.ts:237`), so the fix is either a
  reset at layout entry or a documented single-use rule. Recorded in issue 37;
  dot-engine decides. plantuml-ts needs no change.
- **Confidence**: High

## Ruled out

- **Builder-only artifact**: `parse()` graphs behave identically.
- **Native behaves the same way**: native with `gvFreeLayout` is idempotent
  over 3 rounds.
- **Graph or node records as the carrier**: restoring them alone does not
  restore idempotence. Only `to_virt` + `spl` do.
- **Measurer or label sizing**: node sizes are 54x36 on every pass, and the
  control matches render 1.
