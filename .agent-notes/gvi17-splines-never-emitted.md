# graphviz-issue 17 — `splines=ortho`/`polyline` is never emitted, at all

Diagnosis artifact per `~/.claude/rules/diagnosis.md`. Written 2026-09-03 while
reviewing `docs/reclassify-graphviz-issue-17` against `TRACKER.md`.
**No `src/` changed** — this is the mechanism statement, not the fix.

## Observed discrepancy

`pavuzo-79-zodu430` scope 2 width idx 2: `deltaPx: -1.579968`, live today
(`npx jiti scripts/measure-composite-declared-size.ts pavuzo-79-zodu430`).
Unchanged since its 2026-08-19 filing.

Two prior attributions, both wrong:
1. **Original filing (2026-08-19):** `@knowvah/dot-engine` reserves ~1.58pt
   less ortho xlabel canvas than native, in `label/xlabels.ts`.
2. **Reclassification (2026-09-03, `bd2559bf`):** correctly withdrew (1), but
   guessed the cause was "some attribute that moves the ortho port offset off
   `width/6`", naming node `width`/`height` and the xlabel box as candidates.

## Mechanism

`skinparam linetype ortho|polyline` is parsed and plumbed to the **per-edge
label→xlabel switch** only. It is never forwarded to the **graph-level**
`splines=`/`forcelabels=` attributes, so every layout runs with graphviz's
**default curved spline routing** where the jar runs ortho.

- **Origin (layout side):** `src/core/graph-layout-build.ts:34-43`
  `applyGraphAttrs` sets `rankdir`, `nodesep`, `ranksep`, `aspect` — nothing else.
- **Origin (emitter side):** `src/core/svek-dot-emit.ts:66-77` `graphAttrLines`
  pushes `nodesep`/`ranksep`/`remincross=true`/`searchsize=500`/`rankdir=LR` —
  nothing else.
- **Why neither can:** `DotInputGraph` (`src/core/graph-layout.types.ts:334+`)
  has no field for it. Grepped: zero `splines`/`forcelabels` emission anywhere
  in `src/`.
- **What IS plumbed:** `theme.linetype` (`skinparam-key-handlers.ts:183-185`)
  reaches `state-dot-graph.ts:238`, `state-composite-edge-label.ts:98` and
  `link-edge-attrs.ts:361` — all three the `moveLabelToXlabel` switch. Half a
  feature: issue 16 wired the label half, the routing half was never wired.

**Upstream, read not remembered** —
`~/git/plantuml/.../svek/DotStringFactory.java:161-169`:

```java
final DotSplines dotSplines = skinParam.getDotSplines();
if (dotSplines == DotSplines.POLYLINE) {
    sb.append("splines=polyline;");
    SvekUtils.println(sb);
} else if (dotSplines == DotSplines.ORTHO) {
    sb.append("splines=ortho;");
    sb.append("forcelabels=true;");
    SvekUtils.println(sb);
}
```

It sits immediately after `searchsize=500;` (`:154`) and immediately before
`rankdir=LR;` (`:171`) — exactly the gap in our own `graphAttrLines`, which
goes straight from `searchsize=500;` to the `rankDir === 'LR'` check. The
`ortho` arm appends both attrs before one `println`, which is why the jar's
cached DOT carries them on one line: `splines=ortho;forcelabels=true;`.

## Causal chain

No `splines=ortho` → engine uses default spline routing → the two
`Idle`↔`Configuring` edges route as **curves** with endpoints ~±6.18 about the
rank centre instead of dead-straight verticals at ±8.333 → the rank's own
centring shifts `62.333 → 60.75` → the leftmost xlabel box (flush at
`centre − reservedWidth/2`, `state-transition-label.ts:134-150`) moves right
by 1.583 while `Configuring`'s right edge moves left by the same → ink extent
`108.164568 → 106.581238` (`layout-ink-extent.ts#computeSvekResultGeometry`)
→ composite declared width = ink + 15 + 20 = `141.5825` vs jar's `143.1625`
→ the measured **−1.579968 px**.

## Proof — one toggle, both columns reproduced exactly

Captured the real `DotInputGraph` for pavuzo's inner scope via
`setLayoutInputObserver`, then replayed it through the identical build path
(`applyGraphAttrs` + `addNodes` + `addClusters` + `addEdges` + `render` +
`getLayout`), changing **only** the two graph attrs:

| quantity | ours today (no `splines`) | + `splines=ortho`,`forcelabels` | native `dot -Tdot` 15.1.1 |
|---|---|---|---|
| bb width | **106.581238** | **108.164568** | **108.16** |
| node centre x | **60.7500** | **62.3333** | **62.333** |
| edge 2 `xlabel.x` | **40.5000** | **43.6667** | **43.667** |
| edge 1 `xlabel.x` | 27.0000 | 27.0000 | 27 |

The left column reproduces the original filing's three "engine" numbers
(106.581 / 60.75 / 40.5) **to the digit**. Those measurements were always
real — they were measurements of *our own graph*, misattributed to the engine.
The middle column reproduces native exactly. `108.164568 − 106.581238 =
1.58333`, the whole residual.

Expected on fix: ink `108.164568` + 35 = `143.164568 px` = `1.988397 in`
against jar's `1.988368 in` → **~0.002 px**, inside the band this suite
already admits.

## Ruled out

1. **dot-engine.** Independently re-verified, not taken on trust: `-Tdot` on
   the fixture's own cached `svek-1.dot` is byte-identical to native's, and
   `getLayout()` on the same input gives bb 108.164568 / centre 62.333328 /
   xlabels 27 and 43.666656 — exact on all four. The engine honours
   `splines=ortho` correctly.
2. **What we feed the engine.** Node widths (20 / 50 / 91.6625) and xlabel
   boxes (54 × 15) match the jar's cached DOT exactly — so the
   reclassification's own named candidates are all clean.
3. **The reclassification's derived `±6.75` straight-port geometry.** Its
   conclusion is right, its intermediate is not: the actual failing spline
   dump (now captured, which that document explicitly asked for) shows the
   edges are **curved** at ~±6.18 — `39.645 → 38.892 → 38.893 → 39.649` —
   not straight at ±6.75. It flagged this itself as arithmetic-not-dumped.
   Its "one mechanism, not two" finding **is** confirmed: 3.1667 = 2 × 1.5833.
4. **A stale measurement.** Re-measured live today; still −1.579968.
   Separately, `size-backlog.json` pins this fixture at `0.034167 in`
   (2.46 px) — the **pre-issue-16** value, never tightened after that fix
   landed. That pin is stale and shrink-only, so it does not fail, but it
   does not reflect the tree.

## This is issue 03's un-consumed fix, not a new defect

`TRACKER.md` carries `- [x] 03-splines-attr-unsupported.md` — "No way to set
the `splines` graph attribute", filed because the engine could not express
`splines` at all. The upstream half landed (proven above: it now honours it
exactly). **The plantuml-ts consumption never happened** — no field, no
emission, either side.

That file's own checkbox rule is: *"Check the box only when the fix has landed
in the pinned dot-engine `.tgz` **AND** the affected plantuml-ts fixtures
re-measure clean."* `pavuzo-79-zodu430` demonstrably does not. Issue 17 is the
downstream symptom of 03's unfinished consumption, and both of 17's prior
analyses looked past it.

## Why it went unnoticed for six weeks

`tests/oracle/svek-dot.ts` — the DOT-parity harness — tracks `remincross` and
`searchsize` but contains **zero** `splines`/`linetype` tokens (grepped). It
structurally cannot see this gap, which is why the state suite reads
"DOT EQUAL 266/268" while the routing is materially different: our inner-scope
layout is 106.581 × 192 curved where the jar's is 108.164 × 192 ortho.

## Blast radius (measured)

8 cached oracle fixtures carry `splines=` in their jar DOT:

- **class (5):** `bujedi-30-cize673`, `dimisi-54-dula946`, `gamevo-26-runo973`,
  `jakapi-64-tine258`, `kuxato-79-muno809`
- **component (1):** `zosaxo-93-nici652`
- **state (2):** `kejabo-83-vinu490`, `pavuzo-79-zodu430`

Plus 21 unclassified corpus fixtures (`class` 18, `sequence` 3) using
`skinparam linetype`. Mechanism verified end-to-end on `pavuzo-79-zodu430`
only; the other 7 share the identical missing code path (a structural
certainty — there is no per-engine splines path to differ) but their net
numeric effect is **unmeasured**, and ortho routing changes every edge on a
fixture, so some will move a long way before they land. Not a one-liner's
worth of risk: this wants its own mission, with its own before/after pins.
