# T2 — Clip once per layout result, where upstream clips

> **Rewritten 2026-08-19 after T1's stop 9.** The original version of this file
> placed the clip in a single post-assembly pass over `StateGeometry`. That
> placement is impossible in this port and is not what upstream does — see
> `decisions.md` amendments D1', D1'a, D2'. Those supersede D1/D2; where this
> file and the originals disagree, the amendments win.

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-anchor-clip-retire`. Faithful TypeScript port of PlantUML; the Java
at `~/git/plantuml` is the **canonical spec** — read the METHOD BODY, never a
summary or a remembered mechanism. vitest, tests under `tests/unit/state/`.

**Read `.agent-notes/si32-T1.md` first.** It carries the per-site proof of
what is available where, and it is why this task's placement is what it is.

## Task

### Step 1 — clip at construction, per layout result
`buildLevelTransitionGeos` (`state-composite-pass.ts:328`) is this port's
analogue of `DotStringFactory.solve`'s edge loop
(`svek/DotStringFactory.java:456-457`): it builds every `TransitionGeo` for one
`DotLayoutResult`. Clip there, so a transition is clipped by the time anything
holds it. Do the same for the flat path (`layout.ts:183-188`'s
`buildFlatTransitionGeos`).

Apply `DotPath#simulateCompound` via `src/core/spline-clip.ts`'s
`clipSplineStart` / `clipSplineEnd`, **tail branch then head**, matching
`SvekEdge.java:671-672`.

**There is exactly ONE port of `simulateCompound` in this repo**
(`src/core/spline-clip.ts`, moved to core by SI31's D9). Consume it. Writing a
second is **stop 13**.

Give the clip upstream's identity in its doc comment — it is `solve`'s edge
loop, scoped to one layout result — and note the two sibling passes it brackets
upstream (`alignEdgesAtLabelNodes`, ORTHO-gated and unported; `manageCollision`,
ported for class only) so a future port has an obvious home.

### Step 2 — rects from the layout's own cluster boxes (D2')
Key the clip rectangles off `result.clusters`
(`graph-layout-result.types.ts:90-97`), joined to an endpoint's `__zaent_<id>`
anchor through the pass's own cluster membership (`acc.clusters[].nodeIds`
contains the anchor). `clusterPosMapOf` (`state-composite-geo.ts:49-51`)
already reads `result.clusters` — reuse the seam, do not add a parallel one.

This is upstream's provenance: `SvekEdge.java:671` passes
`lhead.getRectangleArea()` / `ltail.getRectangleArea()`, which are `Cluster`
rectangles from the layout, not measured image boxes.

**Verify the id join rather than assuming it.** A probe on
`fovafu-44-mifu394` shows input `cluster0` → `nodeIds ["X","Y","__zaent_A"]`
and `result.clusters` keyed by the same `DotInputCluster.id`. Confirm this
holds on a nested and a concurrent fixture too before relying on it; if the
join fails anywhere, that is a finding to journal, not to paper over.

### Step 3 — labels stay on pre-clip points (D1'a)
`attachTransitionLabel` is called inside `buildLevelTransitionGeos` (`:347`).
Call it on the **unclipped** points, exactly as today; clip only the points
stored on the returned `TransitionGeo`. `state-transition-label.ts:386-394`
falls back to `perpendicularOffsetLabel(points)` when no measurer is present,
so feeding it clipped points WOULD move labels on that path.

Upstream's label is `getXY(fullSvg, noteLabelColor)` (`SvekEdge.java:742-746`)
— never derived from `dotPath`. A path-independent label is the faithful
outcome, not a concession.

### Step 4 — delete the ink-only clip
Remove `clipTransitionPoints` from `layout-ink-transition.ts` and the
`anchorRects` plumbing that exists only to feed it (`layout-ink-extent.ts`'s
`ClipRect` import and `buildCompositeAnchorRects` included, if they become
unused). The ink walk must now read already-clipped points. Grep afterwards:
the clip must appear at exactly one call site per construction path, and
`clipTransitionPoints` must not exist.

### Step 5 — correct the consumers
`renderer-arrowhead.ts` reads `transition.points` at four sites (`:105`,
`:148`, `:179`, `:200`). After Step 1 those are the clipped points, which is
what upstream does — cite `SvekEdge.java:679-684`. **Correct the doc comments
that explain the old ink-only asymmetry**; leaving them describing a world that
no longer exists is how the next reader inherits a false premise. Do not add
compensating logic.

### Step 6 — account for every mover
Append each moved fixture to `expected-moves.txt` under
`# Batch 2 (T2 — clip once, per layout result)`, one bare slug per line, each
with a one-line jar-side account and the DIRECTION against the jar's own
`test-results/dot-cache/state/<slug>/in.svg`.

**D2' spends this mission's attribution isolation** — provenance and timing now
move together, so "it moved" no longer tells you which change moved it.
Diagnose each mover to a mechanism; do not infer one from the fact of movement.
A fixture moving AWAY from the jar is D6: diagnose to a `file:line`, journal,
continue — do not tune, do not halt.

**These four fixtures have NO headroom.** `fovafu-44-mifu394` (232×230),
`tubojo-49-tudu915` (261×256), `fajegu-17-joba577` (561×846) and
`mefici-97-tudu030` (816×673) are all canvas-EXACT against the jar today
(orchestrator-verified; SI31's `expected-moves.txt:101-102` claims 6 px and
38 px residuals on the last two and is simply wrong). Any canvas movement on
these four is movement AWAY from the jar.

## Write-set
- `src/diagrams/state/state-composite-pass.ts` — the clip, at construction
- `src/diagrams/state/layout.ts` — the flat path's equivalent
- `src/diagrams/state/layout-ink-transition.ts` — delete `clipTransitionPoints`
- `src/diagrams/state/layout-ink-extent.ts` — drop now-unused threading only
- `src/diagrams/state/renderer-arrowhead.ts` — doc comments
- a new helper module under `src/diagrams/state/` if the complexity hook needs
  one (push-forward: filename and shape are yours)
- the corresponding unit tests under `tests/unit/state/`
- `plans/state-anchor-clip-retire/expected-moves.txt`, `.agent-notes/si32-T2.md`

If you must write anything else, STOP and report instead.

## Read-set
- `.agent-notes/si32-T1.md` — the per-site proof
- `plans/state-anchor-clip-retire/decisions.md` — **the Amendments section
  first**, then D3…D6
- `src/core/spline-clip.ts` — the ONE port; its exports and `ClipRect`
- `src/diagrams/description/layout-geo-post.ts:42-70` — description's
  `clipEdgePoints`, for the call shape only
- `~/git/plantuml/.../svek/DotStringFactory.java:441-467`,
  `.../svek/SvekEdge.java:618-700,:742-746`,
  `.../dot/CucaDiagramSimplifierState.java:57-71`,
  `.../svek/GraphvizImageBuilder.java:275-296`. **Method bodies.**

## Architecture decisions (locked, as amended)
D1' (per-layout-result placement), D1'a (labels from pre-clip points), D2'
(rects from `result.clusters`), D3 (arrowheads take the clipped path), D4 (no
unclipped copy retained), D6 (a mover away from the jar is a finding).

## Acceptance
- Given a composite-anchor transition, when its `TransitionGeo` is built, then
  its points are clipped exactly ONCE and before both the ink walk and the
  renderer — assert the single call site in a unit test.
- Given `clipTransitionPoints`, then it no longer exists.
- Given a transition label on the measurer-less path, then its position is
  byte-identical to before this task (D1'a) — assert it.
- Given `fovafu-44-mifu394`, then its scope2 **width stays exact** and its
  scope2 height row does not grow.
- Given an arrowhead on a clipped head end, then it is derived from the clipped
  path (unit test, citing `SvekEdge.java:679-684`).
- Given `render-manifest`, then every mover is on `expected-moves.txt` with a
  diagnosed mechanism and a stated direction against the jar.
- Given the harness, then `0 rows appeared or grew`.
- Given `layering.test.ts`, then it passes with `KNOWN_DEBT` still `[]` and no
  new ALLOWLIST entry.

## Interface contracts
`TransitionGeo` gains no field; its `points` change MEANING (clipped), not
shape. No signature changes to `spline-clip.ts`'s exports — if you are editing
their arithmetic you have exceeded this task.

## Observability
N/A — no new observable operations. Note for the close-out that this task
changes **emitted SVG**, the mission's consumer-visible change.

## Rollback
Reversible: one commit. Reverting restores the ink-only clip, and the
`DIVERGENCES.md` entry stays true until T3 deletes it.

## Quality bar
All four gates green, coverage >= 90/90/90, `npm test` under 60.3 s — **it is
at 60 s on an unchanged tree, so the margin is already thin; if your tests push
it over, say so rather than trimming coverage.** TDD. The complexity hook
blocks >500 lines/file, >30 NLOC/function, CCN >10, >5 params — extract a NAMED
helper; never widen or add a `#lizard forgives` exemption (stop 12).
`layout-ink-extent.ts` is at 482 lines, `layout-ink-transition.ts` at 169,
`state-composite-pass.ts` at ~500 — check it before adding to it.

## Boundaries
- **Always:** consume the single core port; cite `file:line` for every upstream
  claim; diagnose each mover to a mechanism.
- **Never:** write a second `simulateCompound`; keep an unclipped copy "just in
  case" (D4); add compensating logic to arrowheads; tune to recover a fixture
  (D6); feed clipped points to label attachment (D1'a); run git.

## Report (<=600 tokens)
The clip call sites (one per construction path); how the `__zaent_` → cluster
rect join is keyed and where you verified it; `fovafu-44` both rows
before/after; the full mover list with mechanisms AND directions; any
away-from-jar mover with its diagnosis; harness-diff and manifest-diff output;
four gates, five ratchets, `npm test` wall-clock.
