# Rendering one Graph object twice: the second layout reads stale edge records

**Impact:** no plantuml-ts fixture. `layoutGraph`
(`src/core/graph-layout.ts`) calls `render` once per builder graph, so
production output does not change. It affects any caller (harness, probe,
interactive tool) that calls `render`/`renderAsync`/`getDrawOps` more than once
on the same `Graph`. From the second call on, the output is wrong without any
warning. Engine: `@knowvah/dot-engine` 2.4.0 vs native libgvc 16.1.0 (homebrew).
Found by plantuml-ts mission `json-family-followons`, task T1a, following up
an unfiled observation from jfp B1 (two agents, independently).

**Finding.** `render(g, …)` runs the full native cycle on every call:
layout, then render, then free (`render/public.d.ts:48`). Native libgvc
running that same cycle on one graph object is idempotent. dot-engine is not.
The second call flattens `a->b` onto one rank and keeps the first pass's
spline, shifted. The third call flips back to two ranks and shifts the stale
spline again. dot-engine's second render matches what native produces when
`gvFreeLayout` is left out: identical `graph` and `node` lines, and an
identical first bezier.

## Repro

```js
import { createGraph, render, getLayout, parse } from '@knowvah/dot-engine';
const b = createGraph({ directed: true });
b.addEdge(b.addNode('a'), b.addNode('b'));
render(b.graph, 'plain'); // 1
render(b.graph, 'plain'); // 2
render(b.graph, 'plain'); // 3
// same result with g = parse('digraph{a->b}') rendered twice
```

dot-engine 2.4.0, `plain` (graph/node/edge lines), then `getLayout(g, {yAxis:'up'})`:

```
render 1  graph 1 0.75 1.5
          node a 0.375 1.25 0.75 0.5 a solid ellipse black lightgrey
          node b 0.375 0.25 0.75 0.5 b solid ellipse black lightgrey
          edge a b 4 0.375 0.99579 0.375 0.89454 0.375 0.77398 0.375 0.66022 solid black
          getLayout: a 27,90 / b 27,18; bounds 54x108; edge x=27, y 71.697..47.536
render 2  graph 1 1.75 0.5
          node a 0.375 0.25 0.75 0.5 a solid ellipse black lightgrey
          node b 1.375 0.25 0.75 0.5 b solid ellipse black lightgrey
          edge a b 4 0.75 0.99579 0.75 0.89454 0.75 0.77398 0.75 0.66022 solid black
          getLayout: a 27,18 / b 99,18; bounds 126x36; edge x=54, y 71.697..47.536
render 3  graph 1 0.75 1.5
          node a 0.375 1.25 0.75 0.5 a solid ellipse black lightgrey
          node b 0.375 0.25 0.75 0.5 b solid ellipse black lightgrey
          edge a b 4 1.125 0.99579 1.125 0.89454 1.125 0.77398 1.125 0.66022 solid black
          getLayout: a 27,90 / b 27,18; bounds 54x108; edge x=81, y 71.697..47.536
```

Control: `render(parse('digraph{a->b}'), 'plain')` on a fresh parse is
byte-identical to render 1, and so is `dot -Tplain`.

## Native comparison (libgvc 16.1.0)

```c
#include <graphviz/gvc.h>
#include <stdio.h>
#include <string.h>
static void show(GVC_t *gvc, Agraph_t *g, const char *tag) {
    char *buf = NULL; size_t len = 0;
    if (gvRenderData(gvc, g, "plain", &buf, &len) != 0) { printf("%s: render failed\n", tag); return; }
    printf("== %s\n%.*s", tag, (int)len, buf);
    gvFreeRenderData(buf);
}
int main(int argc, char **argv) {
    int nofree = argc > 1 && strcmp(argv[1], "nofree") == 0;
    GVC_t *gvc = gvContext();
    Agraph_t *g = agmemread("digraph{a->b}");
    for (int i = 1; i <= 3; i++) {
        int rc = gvLayout(gvc, g, "dot");
        char tag[64]; snprintf(tag, sizeof tag, "layout %d rc=%d (%s)", i, rc, nofree ? "no gvFreeLayout" : "gvFreeLayout between");
        show(gvc, g, tag);
        if (!nofree) gvFreeLayout(gvc, g);
    }
    if (nofree) gvFreeLayout(gvc, g);
    agclose(g);
    Agraph_t *c = agmemread("digraph{a->b}");
    gvLayout(gvc, c, "dot"); show(gvc, c, "control: fresh agmemread, layout once");
    gvFreeLayout(gvc, c); agclose(c);
    return gvFreeContext(gvc);
}
```

`cc -o twice twice.c -I/opt/homebrew/include -L/opt/homebrew/lib -lgvc -lcgraph`

With `gvFreeLayout` between layouts, which is what dot-engine's `render`
does, all three layouts and the control are byte-identical:

```
graph 1 0.75 1.5
node a 0.375 1.25 0.75 0.5 a solid ellipse black lightgrey
node b 0.375 0.25 0.75 0.5 b solid ellipse black lightgrey
edge a b 4 0.375 0.99579 0.375 0.89454 0.375 0.77398 0.375 0.66022 solid black
```

Without `gvFreeLayout` (`./twice nofree`), native reproduces dot-engine's
stale-state output:

```
layout 1  (= above)
layout 2  graph 1 1.75 0.5
          node a 0.375 0.25 0.75 0.5 a solid ellipse black lightgrey
          node b 1.375 0.25 0.75 0.5 b solid ellipse black lightgrey
          edge a b 8 0.75 0.99579 0.75 0.89454 0.75 0.77398 0.75 0.66022 0.75391 0.25 0.78171 0.25 0.80951 0.25 0.83731 0.25 solid black
layout 3  graph 1 0.75 1.5
          node a 0.375 1.25 0.75 0.5 a solid ellipse black lightgrey
          node b 0.375 0.25 0.75 0.5 b solid ellipse black lightgrey
          edge a b 12 1.125 0.99579 1.125 0.89454 1.125 0.77398 1.125 0.66022 1.1289 0.25 1.1567 0.25 1.1845 0.25 1.2123 0.25 0.375 0.99579 0.375 0.89454 0.375 0.77398 0.375 0.66022 solid black
```

The node and graph lines are identical to dot-engine renders 2 and 3, and so
is the first bezier. Native also appends the newly routed bezier
(`new_spline`, `lib/common/splines.c:216-220`). dot-engine keeps one bezier and
translates it.

## Contract

- `render/public.d.ts:48` says "Lifecycle: createDefaultContext → layout →
  deviceRender → freeLayout." The bundled `render` body (`src/render/public.ts`)
  runs `ctx.layout`, `render`, then `ctx.freeLayout` on every call.
- `gvc/context.d.ts:185-188` says "Engine cleanup is deferred to freeLayout,
  matching C's gvLayoutJobs / gvFreeLayout split". At `:201` and `:205` it
  says "Release engine layout state after rendering. … @see
  lib/gvc/gvlayout.c:gvFreeLayout".
- `api/geometry.d.ts:237` says `getLayout` "Must be called **after**
  `ctx.layout(g, engine)` (or `render`) has run". So a `Graph` is expected to
  stay usable after `render`.
- `README.md:447`, the `render(g: Graph, …)` signature, and `README.md:463-468`
  ("driving layout and rendering as separate steps") say nothing about calling
  `render` twice or about single-use graphs.

Reuse is therefore implied by an API that mirrors native's free cycle, and
native's free cycle is idempotent.

## Mechanism (traced into dot-engine 2.4.0 `dist/index.js`)

- Native frees per-object layout state by deleting the records:
  - `gv_cleanup_edge` → `agdelrec(e, "Agedgeinfo_t")` (`lib/common/utils.c:1522`)
  - `dot_cleanup_node` → `agdelrec(n, "Agnodeinfo_t")` (`lib/dotgen/dotinit.c:114`)
  - `graph_cleanup` → `agclean(g, AGRAPH, "Agraphinfo_t")`
    (`lib/common/input.c:802`, called from `gvFreeLayout`, `lib/gvc/gvlayout.c:118`)

  The next `dot_init_edge` binds a zeroed record (`lib/dotgen/dotinit.c:62`).
- dot-engine's `dotCleanup` (`src/layout/dot/init.ts`, bundle line 24340)
  clears only the fast-graph lists (`in`/`out`/`flat_in`/`flat_out`/`other`/
  `next`/`prev`) on the `nlist` nodes. `e.info`, `n.info` and `g.info` survive,
  and `freeLayout` (`src/gvc/context.ts`) has no `graph_cleanup` analogue.
- The stale `e.info.to_virt` makes `class1Edge` (`src/layout/dot/classify.ts`,
  a faithful port of `lib/dotgen/class1.c:72-74`, "skip edges already
  processed") skip the edge. `a->b` therefore gets no rank constraint, and
  both nodes land on rank 0.
- The stale `e.info.spl` is still present at routing time, so the first pass's
  bezier is kept and translated instead of replaced.

Counterfactual: copy each `info` record before render 1, restore it between
the renders, then render again:

| restored before render 2 | idempotent? |
|---|---|
| graph record only | no |
| node records only | no |
| edge records only | yes |
| edge records except `to_virt` | no, nodes flattened, new flat route |
| edge records except `spl` | no, nodes correct, edge keeps the stale bezier |
| `to_virt` + `spl` only | yes |
| any single edge field alone | no |

## Note for a fix

`getLayout` after `render` is documented (`api/geometry.d.ts:237`), and
`render` frees at its end. A literal `agdelrec` in `dotCleanup` would
therefore remove the geometry that `getLayout` reads. The reset probably
belongs at layout entry (`dotInitEdge`/`dotInitNode`/`dotGraphInit`), or the
contract should state that a `Graph` is single-use. That choice is
dot-engine's to make.
