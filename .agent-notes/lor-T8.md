# lor-T8 — the post-change measurement, every mover named

Orchestrator, 2026-09-03. Converts T0's floor pin into a result. Pin lives in
`oracle/goldens/svg-conformance/splines-baseline.json` (superseded in place;
`deltaVsT0` carries the before-values).

## Headline

`pavuzo-79-zodu430` scope 2 width idx 2: **`-1.579968 px` → `0`**, 12/12
declarations exact, `dirtyFixtures: 0`. `kejabo-83-vinu490`: `+0.749952 px`
→ `0` (11 exact + 1 pre-existing last-digit the harness itself classes as
noise). The `~0.002 px` the brief predicted was never real — see the
correction appended to `.agent-notes/gvi17-splines-never-emitted.md`.

**All 8 fixtures, all 10 layout passes, emit the splines line their own
cached jar DOT carries.** At T0, `oursSplines` was `null` on every one.

## Every mover, with a mechanism

| fixture | metric | T0 → now | mechanism |
|---|---|---|---|
| `bujedi-30-cize673` | verdict | diverged → **conformant** | ortho routing lands every edge on the jar's own path; nothing left to diverge |
| `dimisi-54-dula946` | verdict | structural-match → **conformant** | as above; its residual 0.084 was the curved-vs-ortho path delta |
| `kuxato-79-muno809` | verdict | diverged → **conformant** | polyline routing; residual 36.632 was the spline bow |
| `gamevo-26-runo973` | maxDelta | 514.848 → 454.788 | polyline; large residual is unrelated renderer gap, not routing |
| `pavuzo-79-zodu430` | maxDelta | 71.626 → **1.007** | ortho; the mission's target fixture |
| `jakapi-64-tine258` | maxDelta | 17 → 108.007 | **the instrument sees more, the render is not worse** — see below |
| `kejabo-83-vinu490` | maxDelta | 37 → 44 | canvas was ALREADY 37px narrower than the jar's; polyline removes a further 7px of bow we were wrongly drawing |
| `zosaxo-93-nici652` | maxDelta | 219.425 → 313.35 | DOT is structurally equal incl. splines; the residual is renderer-side — see below |

`dotEqual` is `true` on all 8 both before and after — but it now **means**
it. At T0 the harness had zero splines tokens; T7 put `splinesOk` into
`structurallyEqual` and proved it goes **0/10 with the emitter reverted,
10/10 restored**.

### `jakapi-64-tine258` — a rise that is not a regression

Its viewBox is **unchanged**: ours `492`, jar `475`, delta `17` — exactly
the old `maxDelta`, and the old `maxDeltaPath` was `svg/@viewBox[2]`.

What changed is where comparison stops. `firstDiff` moved DEEPER,
`svg/g[1][childCount]` → `svg/g[1]/g[11][childCount]`. Read
`tests/oracle/svg-conformance/compare.ts:530-539`: on a `[childCount]`
mismatch the comparator charges unmatched subtrees by weight and **returns**
— their numeric attribute deltas never reach `maxDelta`. Top-level structure
now matches, so the walk descends further and surfaces a path delta that was
previously invisible.

This is the `compareSvg` non-monotonicity hazard already on file, in a new
guise: **a structural improvement can raise the reported number.** Never
read a `maxDelta` rise as a regression without checking whether `firstDiff`
moved deeper first.

### `zosaxo-93-nici652` — the residual is renderer-side, not layout-side

`dotEqual` true and `structurallyEqual` true including `splinesOk`, so the
DOT we hand the engine matches the jar's. `firstDiff` is
`.../text[1]/@textLength` and `maxDeltaPath` is a text `@x` — text metrics,
not routing. The description/component corpus is broadly diverged from the
jar (**2 conformant of 358** in this same survey), so SVG-level distances
there are dominated by renderer gaps this mission does not touch. Correct
ortho routing moves nodes to their true DOT positions; a text element that
sat accidentally nearer the jar under wrong curved routing now sits further.
The metric this mission targets — DOT-level — went exact.

## `size-backlog.json` TIGHTENED, never loosened

Both state entries measured essentially zero and were **removed**
(absent = 0 allowed):

| fixture | pinned | measured now |
|---|---|---|
| `pavuzo-79-zodu430` | `0.034167` | `0` on both passes |
| `kejabo-83-vinu490` | `0.013062` | `0`, `1e-6` (one 6dp quantization unit, inside the band the test documents) |

`tests/oracle/state-dot-parity.test.ts` re-run green with both gone.
`pavuzo`'s pin was already known-stale pre-mission (the pre-issue-16 value,
never tightened) — this closes that too.

## Containment held, measured on all three corpora

Stop condition 1 never fired. Nothing outside the 8 moved **because of this
mission**, and that is a mechanism rather than an absence of evidence:
`dotSplinesAttrs(undefined)` returns `[]`, so a fixture without
`skinparam linetype` emits a byte-identical DOT.

Across all three parity corpora, of every outside-the-8 fixture whose row
differs from its committed pin, the count with an **uncommented**
`skinparam linetype` is **zero** — state 0/172, class 0/295, component
0/286. Separately, `grep -rl "splines=" oracle/goldens/` returns exactly the
8 of 1,865 golden dirs.

One near-miss worth recording: `gekope-01-ricu859` (class) does contain
`skinparam linetype ortho` — with a leading apostrophe, i.e. a PlantUML
**comment**. Verified directly that we ignore it exactly as the jar does
(`linetype: null`, `oursSplines: null`, jar `null`). Had our parser honoured
a commented skinparam, this mission would have introduced a real regression
there; it does not.

## What was NOT re-pinned, and why

The committed `parity-*.json` files are all dated **2026-08-12** and carry
weeks of unrelated drift. A whole-file regeneration would have adopted
**174 / 300 / 287** changed rows respectively — including two `dotEqual`
regressions of unknown origin — under a commit about splines. Only the 8
rows were merged. Full artifact and owner hand-off:
`.agent-notes/lor-parity-pins-are-stale.md`.
