# T12 — two-sided and multiple qualifiers

**Agent:** typescript-pro (opus, effort high) · **Depends on:** T10 · parallel with T11 (disjoint write-sets)


## Fixtures

rilali-81-gifu188, xoxega-30-vuju324, goloxu-09-nero458,
vuzoro-99-kizi978, ririlu-13-zipi740; plus the Q-2 term of every T11/T13
fixture. mucoti/sefazi are Q-8 (dot-engine issue 19, already filed; final
set by T6); coxose moved to T11.

## Mechanisms · Write-set

Diagnosis sections are quoted from `diagnosis/Q.md` into the agent prompt.

- **Q-2** (HIGH, T6 re-read the Java) — `attachKalBoxes`
  (`class-edge-geo.ts:160-180`) shifts only the endpoint by
  `kalTranslateForDecoration`, never the adjacent control point, and does
  it even when the end has no decor. Upstream: `SvekEdge.java:539-562`
  `getExtremitySimplier` returns early `if (extremityFactory == null)`;
  otherwise `dotPath.moveStartPoint/moveEndPoint(translateForKal.compose(...))`,
  and `DotPath.java:206-216 moveStartPoint` moves `x1,y1` AND `ctrlx1,ctrly1`
  — including its first branch that DROPS the first bezier when the move
  is longer than it. Port both whole; reconcile with `applyDecorTrim`
  (`renderer-arrowhead.ts`) so the decor translate is applied once.
  Evidence: baneru ctrl point 82.511 vs 98.51 (Δ16); tikovu start 70.818
  vs 54.82 (no decor, Δ16).
- **Q-7** (HIGH identity, MEDIUM magnitude) — `Kal#overlapx`/`moveX` and
  `SvekNode#fixOverlap`/`fixHoverlap` (`SvekNode.java:445-463`) are
  unported (`class-kal.ts:30` says so): same-direction Kal boxes on one
  entity are not spread apart, nor are their edges moved. Port them as an
  ADDITION to `class-kal.ts` (new functions; D7 forbids restructuring the
  existing ones — stop 11). Confirm ririlu's `MoreComplex` links by probe.

Write-set: `src/diagrams/class/class-edge-geo.ts` (`attachKalBoxes`
region; T9 already landed its clip change), `renderer-arrowhead.ts`,
`class-kal.ts`, a new `class-kal-overlap.ts` if `class-kal.ts` would pass
500 lines, tests beside each.

## Read-set

`diagnosis/Q.md` (T12 sections), `decisions.md` D4, D7; T11's report if
T11 ran first (shared terms must not be re-derived).

## Acceptance criteria

- Given each fixture, when it renders, then its diff is 0 or its residual
  has a diagnosis artifact
- Given several qualifiers on one node, when laid out, then node margins
  match the jar's `svek-N.dot` node sizes
- Given `class-kal.ts`, when edited, then D7 holds (cited, non-structural)

## Observability · Rollback

N/A. Reversible.
