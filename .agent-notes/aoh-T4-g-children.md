# aoh-T4 — the two extra activity root-`<g>` children

Diagnosis artifact per `~/.claude/rules/diagnosis.md`. Mission
`plans/activity-oracle-harness/`, decision D7. **No `src/` was changed.**

## Observation, restated precisely

`svg/g[1][childCount]`: ours > jar's. The mission README's "+2 on every
fixture" is **not** population-wide — measured over the 283 comparable
fixtures (373 cached, minus 90 that error on one side or the other), the
delta histogram is `{+2: 55, 0: 20, +1: 8, ..., -5: 13, -10: 12, ...}`,
mostly NEGATIVE. The two extra rects are a **constant +2**, superimposed
on a per-fixture content-count difference (unported activity features).
The +2 is exact only where content already aligns — which is what
`numalo-91-pole243` (7 v 5) and `darote-51-kuta407` (64 v 62) are.

## Instrumented child lists — `numalo-91-pole243` (`start` / `stop`)

Normalized through `tests/oracle/svg-conformance/normalize.ts` (which
drops PIs and comments, so the golden's trailing `<?plantuml-src?>` is
not counted). Both sides agree on the `svg` root's own two children
(`<defs>`, `<g font-family="sans-serif" lengthAdjust="spacing">`).

JAR (5):
```
0: <ellipse>  cx=29 cy=25 fill=#222 rx=10 ry=10 stroke=#222
1: <ellipse>  cx=29 cy=66 fill=none rx=11 ry=11 stroke=#222
2: <ellipse>  cx=29 cy=66 fill=#222 rx=6 ry=6 stroke=#222
3: <line>     x1=29 y1=35 x2=29 y2=55 stroke=#181818
4: <polygon>  points=25,45,29,55,33,45,29,49 fill=#181818
```
OURS (7):
```
0: <rect>     fill=#FFF width=52 height=92            <-- EXTRA A
1: <rect>     fill=#FFF width=52 height=92 x=0 y=0    <-- EXTRA B
2: <circle>   cx=26 cy=22 fill=#181818 r=10
3: <circle>   cx=26 cy=66 fill=none r=14 stroke=#181818
4: <circle>   cx=26 cy=66 fill=#181818 r=7.7
5: <polyline> points=26,32,26,52 fill=none stroke=#181818
6: <polygon>  points=26,52,22.8,44,29.2,44 fill=#181818
```
The two are distinguishable by shape: **A carries no `x`/`y`**, **B
carries `x="0" y="0"`**.

Same pair confirmed on `darote-51-kuta407` (64 v 62, `!$data`/JSON-driven,
large), `movexa-27-rexe388` (two swimlanes + if/then/else),
`poraji-17-goke817` (`#808080` background), `labala-74-juki864`
(`#0B58A8` background).

## Population evidence

| Measurement | Result |
|---|---|
| ours[0] is a rect with no x/y AND ours[1] is a rect at 0,0 | **263 / 283** |
| jar's `g[0]` is a `0,0 stroke=none` rect | **3 / 283** |
| jar root `style` carries `background:` | 370 / 373 |

The 20 that are not `A,B` adjacent are not counterexamples — 19 are
chrome-present fixtures where `applyChrome` (`core/annotations/chrome.ts:283`,
`body: group(block.body)`) wraps the body, so A stays at `[0]` and B
moves one level down into that wrapper; the 20th, `kodiji-34-mofe202`,
resolves `background:#00000000`, so A is suppressed by `svgRoot`'s
`isSolid` guard and B alone remains at `[0]`. Both exceptions confirm
that A and B come from two independent code paths with different guards.

Jar root-`style` background census over all 373: `#FFFFFF` x362,
`#000000` x5, `#808080` x1, `#1B1B1B` x1, `#0B58A8` x1, absent x3.
The 3 that DO get a content rect are exactly the 3 that are neither
white, black, nor transparent.

## The upstream mechanism (both children share one Java origin)

`SvgGraphics`'s constructor, `~/git/plantuml/src/main/java/net/
sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:186-192`:

```java
} else {
    this.backcolorString = backcolor.toSvg(option.getColorMapper());
    final String color = backcolor.toSvg(option.getColorMapper());
    if (color.equals("#00000000") == false && color.equals("#000000") == false
            && color.equals("#FFFFFF") == false)
        this.paintBackcolor(color);
}
```

`paintBackcolor` (`:207-212`) appends ONE rect to the root `<g>`:

```java
private void paintBackcolor(String back) {
    setFillColor(back);
    setStrokeColor(null);
    pendingBackground = createRectangleInternal(0, 0, 0, 0);
    getG().appendChild(pendingBackground);
}
```

resized to the final canvas in `finalizeRootAttributes` (`:819-822`).
The SAME field feeds the root `style` — unconditionally, at `:805-806`:

```java
if (backcolorString != null && "#00000000".equals(backcolorString) == false)
    style += "background:" + backcolorString + ";";
```

**Two independent outputs from one field.** The root `style` is the
primary channel (every non-transparent background); the content rect is
the narrow secondary one (solid, and not white/black). We emit the
content channel TWICE and the root channel ZERO times.

`ActivityDiagram3 extends TitledDiagram`
(`net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:66`)
and declares no `backcolor`, `exportDiagramInternal` or
`TextBlockExporter` member of its own (grepped) — so activity inherits
the shared `TextBlockExporter#createUGraphicSVG` path
(`net/sourceforge/plantuml/core/TextBlockExporter.java:250,281,293`)
verbatim. There is no activity-specific background mechanism.

---

## EXTRA A — `svgRoot`'s unconditional background rect

- **Mechanism.** `renderActivity` returns a `RenderFragment` with no
  `diagramType`, so `assembleSvg` falls through to the generic
  `svgRoot`, which synthesizes its OWN full-canvas background rect from
  `fragment.background` whenever the colour is solid.
- **Origin.** `src/core/svg.ts:521-524` (emitted into the body at `:530`);
  reached because `src/core/assemble-svg.ts:` final line takes the
  `svgRoot` fallback for a `diagramType`-less fragment, which
  `src/diagrams/activity/renderer.ts:221-226` is.
- **Causal chain.** `svgRoot(width, height, [body], background)` →
  `isSolid` is true for `#FFFFFF` → `bgRect` is a non-empty string →
  concatenated as `ROOT_GROUP_OPEN + bgRect + lifted.body`, making it the
  root `<g>`'s child `[0]`. The jar's `paintBackcolor` guard **excludes**
  `#FFFFFF`, so the jar emits nothing here → +1 child. Where the jar DOES
  emit a rect (the 3 non-white/black fixtures), A is a coincident
  duplicate of B, so it is still +1.
- **Chrome, not layout-bearing.** Full-canvas fill at the already-final
  `width`/`height`; contributes no geometry.
- **Ruled out:**
  - *That A is the port of `paintBackcolor`.* It is emitted for
    `#FFFFFF`, where `SvgGraphics.java:189-191` explicitly does not
    emit; and it lacks the `x="0" y="0"` the jar's rect carries
    (`poraji-17-goke817` jar `g[0]`: `x="0" y="0" ... style="stroke:none;"`).
    B is the shape-matching candidate, not A.
  - *That A is layout-bearing.* `svgRoot` receives `width`/`height` as
    parameters already computed by `layoutActivity`; the rect is derived
    FROM them and never fed back. `renderActivity`'s only production
    consumer is `src/diagrams/activity/index.ts:29`, which returns the
    fragment straight to the dispatcher.
  - *That A participates in gradient lifting.*
    `extractGradientDefs(children.join(''))` runs at `svg.ts:519`, BEFORE
    `bgRect` is constructed at `:522`, and `bgRect` is concatenated to
    `lifted.body` at `:530` — outside the scan. Deleting it cannot change
    `<defs>`.
  - *That A is needed to show the background at all.* `document-shell.ts:
    132-145` already computes `background:${background};` behind the same
    `isSolid` test — a faithful port of `SvgGraphics.java:805-806`. Once
    D6 routes activity through `assembleDocumentShell`, the root `style`
    carries it, exactly as the jar's 362 white + 5 black rect-less
    goldens prove it does there.

## EXTRA B — `renderActivity`'s unconditional background rect

- **Mechanism.** `renderActivity` pushes a full-canvas background rect as
  `children[0]` **unconditionally**, where the jar draws one only when the
  resolved colour is solid AND not `#FFFFFF`, `#000000`, or `#00000000`.
  B is not a spurious element — it is the *right* element with a
  *missing guard*.
- **Origin.** `src/diagrams/activity/renderer.ts:199-205`.
- **Causal chain.** `theme.colors.background` defaults to `#FFFFFF`
  (`core/theme.ts`), so the push fires for all 362 white-background
  fixtures and for the 5 black ones — precisely the two colours
  `SvgGraphics.java:189-191` excludes → +1 child on 367 of 373. On the 3
  genuinely-coloured fixtures the jar draws it too, so B is **correct
  there** and the delta is only +1 (`labala-74-juki864`: jar 26, ours 27).
- **Chrome, not layout-bearing.** Same argument as A: full-canvas fill
  at `geo.totalWidth`/`geo.totalHeight`, pushed into a string array that
  nothing reads back. Its *position* is not relied on either —
  `applyChrome` wraps with `group(block.body)` (`chrome.ts:283`) rather
  than splicing relative to a first child.
- **CONDITIONALITY — the load-bearing caveat for T5.** B must be
  **relocated behind the jar's guard, not simply deleted.** An
  unconditional deletion drops the content rect the jar DOES draw on
  `labala-74-juki864` (`#0B58A8`), `poraji-17-goke817` (`#808080`) and
  `levuma-67-cego489` (`#1B1B1B`). The mechanism already exists in this
  repo, jar-verified for the identical Java: `assemble-svg.ts`'s
  `SEQUENCE_UNPAINTED_BACKGROUNDS` / `maybeSequenceBackgroundRect` /
  `finalizeSequenceBody`. T5 adds an `ACTIVITY` case to
  `finalizeShellFragment` reusing that shape.
- **Ruled out:**
  - *That B is unconditionally extra (the naive reading of D7).*
    Disproved by three cached goldens whose `g[0]` IS this rect —
    e.g. `poraji-17-goke817`: `<rect x="0" y="0" width="64" height="127"
    fill="#808080" style="stroke:none;"/>`.
  - *That the state precedent (`state/renderer.ts:301-307`, "jar draws NO
    explicit background rect") settles activity.* That comment is scoped
    to the manual UNCONDITIONAL rect and to a default-white sample; state
    itself keeps the conditional rect in
    `assemble-svg.ts#maybeStateBackgroundRect`. The activity corpus
    contains the non-default-background case state's sample did not.
  - *That black behaves like other colours.* It does not —
    `SvgGraphics.java:190` excludes `#000000` alongside white, and all 5
    black activity goldens (`jokaxi-40-toko207`, `nakavu-98-pela661`,
    `pejima-95-nuxu520`, `velodu-59-sada437`, `xoreni-54-xoro817`) open
    their `<g>` with a `<text>`, not a rect. A naive `!== '#FFFFFF'`
    guard would regress all 5.
  - *That B is layout-bearing.* `geo.totalWidth`/`totalHeight` are
    inputs to the rect, never outputs of it; no `tile-layout.ts` code
    reads the rendered string.
  - *That B and A are the same emission counted twice by the
    normalizer.* They differ structurally (`x`/`y` presence) and are
    independently guarded — `kodiji-34-mofe202` (`#00000000`) has B but
    not A; every chrome-present fixture has them at different depths.

## Also observed (out of scope, for whoever owns it)

`poraji-17-goke817`: A renders `fill="grey"` while B renders
`fill="#808080"`. `svgRoot` passes the raw theme string through
`shortenColor` only; `rect()` resolves it to hex. Once A is removed the
discrepancy disappears from the output, but the underlying asymmetry in
`svgRoot` remains for any other engine on the fallback path.

`tests/oracle/svg-conformance/routing-conformance.test.ts:586-597`
already documents this exact fragment shape and predicts that T5's shell
routing flips 350 fixtures from `known-misroute` to `agree` — that gate
will need its pins moved in the same task.
