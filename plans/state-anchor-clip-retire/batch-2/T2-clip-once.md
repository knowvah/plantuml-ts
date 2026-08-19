# T2 — Clip once, where upstream clips

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-anchor-clip-retire`. Faithful TypeScript port of PlantUML; the Java
at `~/git/plantuml` is the **canonical spec** — read the METHOD BODY, never a
summary or a remembered mechanism. vitest, tests under `tests/unit/state/`.

**Read T1's report first** (`.agent-notes/si32-T1.md`). It proves — per site —
where node geos are final and same-frame, which is what makes this task's
placement legal. If T1 returned STOP, this task does not run.

## Task

### Step 1 — port the pass
Add a named function mirroring `DotStringFactory.solve`'s edge loop
(`svek/DotStringFactory.java:441-467`): iterate every transition and apply
`DotPath#simulateCompound` via `src/core/spline-clip.ts`'s `clipSplineStart` /
`clipSplineEnd`, tail branch then head, matching `SvekEdge.java:671-672`.

Run it **once**, after node geometry is final and before any consumer, at the
site T1 identified. Give it upstream's identity in its doc comment — it is
`solve`'s edge loop, not a generic post-pass — and note the two sibling passes
it brackets upstream (`alignEdgesAtLabelNodes`, ORTHO-gated and unported;
`manageCollision`, ported for class only) so a future port has an obvious home.

**There is exactly ONE port of `simulateCompound` in this repo**
(`src/core/spline-clip.ts`, moved to core by SI31's D9). Consume it. Writing a
second is **stop 13**.

### Step 2 — delete the ink-only clip
Remove `clipTransitionPoints` from `layout-ink-transition.ts` and the
`anchorRects` plumbing that exists only to feed it (`layout-ink-extent.ts`'s
`ClipRect` import included, if it becomes unused). The ink walk must now read
already-clipped points. Grep afterwards: the clip must appear at exactly one
call site.

### Step 3 — correct the consumers
`renderer-arrowhead.ts` reads `transition.points` at four sites (`:105`,
`:148`, `:179`, `:200`). After Step 1 those are the clipped points, which is
what upstream does — cite `SvekEdge.java:679-684`. **Correct the doc comments
that explain the old asymmetry**; leaving them describing an ink-only clip is
how the next reader inherits a false premise. Do not add compensating logic.

### Step 4 — account for every mover
Append each moved fixture to `expected-moves.txt` under
`# Batch 2 (T2 — clip once, in solve()'s edge pass)`, one bare slug per line,
each with a one-line jar-side account. For each mover, state the DIRECTION
against the jar's own `test-results/dot-cache/state/<slug>/in.svg`. A fixture
moving AWAY from the jar is D6: diagnose it to a `file:line`, journal it,
continue — do not tune, and do not halt.

## Write-set
- `src/diagrams/state/layout.ts`
- the composite-pass file(s) T1 identifies as the correct pass site
- `src/diagrams/state/layout-ink-transition.ts` — delete `clipTransitionPoints`
- `src/diagrams/state/layout-ink-extent.ts` — drop now-unused threading only
- `src/diagrams/state/renderer-arrowhead.ts` — doc comments (+ tests)
- the corresponding unit tests
- `plans/state-anchor-clip-retire/expected-moves.txt`, `.agent-notes/si32-T2.md`

## Read-set
- `.agent-notes/si32-T1.md` — the per-site proof
- `decisions.md#d1` … `#d6`
- `src/core/spline-clip.ts` — the ONE port; its exports and `ClipRect`
- `src/diagrams/description/layout-geo-post.ts:42-70` — description's
  `clipEdgePoints`, for how the same seam is consumed elsewhere. **Note it is
  NOT the structure to copy** (see D1); read it for the call shape only.
- `~/git/plantuml/.../svek/DotStringFactory.java:441-467` and
  `.../svek/SvekEdge.java:618-700`. **Method bodies.**

## Architecture decisions (locked)
D1 (pass placement and identity), D2 (rect provenance unchanged), D3
(arrowheads take the clipped path), D4 (no unclipped copy retained).

## Acceptance
- Given a composite-anchor transition, when geometry is assembled, then its
  points are clipped exactly ONCE, before both the ink walk and the renderer —
  assert the single call site in a unit test.
- Given `clipTransitionPoints`, then it no longer exists.
- Given `fovafu-44-mifu394`, then its scope2 **width stays exact** and its
  scope2 height row does not grow.
- Given an arrowhead on a clipped head end, then it is derived from the clipped
  path (unit test, citing `SvekEdge.java:679-684`).
- Given `render-manifest`, then every mover is on `expected-moves.txt` with a
  jar-side account and a stated direction against the jar.
- Given the harness, then `0 rows appeared or grew`.
- Given `layering.test.ts`, then it passes with `KNOWN_DEBT` still `[]` and no
  new ALLOWLIST entry.

## Interface contracts
`TransitionGeo` gains no field; its `points` change MEANING (clipped), not
shape. No signature changes to `spline-clip.ts`'s exports — if you are editing
their arithmetic you have exceeded this task.

## Observability
N/A — no new observable operations. Note for the close-out that this task
changes **emitted SVG**, which is the mission's consumer-visible change.

## Rollback
Reversible: one commit. Reverting restores the ink-only clip and the divergence
entry stays true until T3 deletes it.

## Quality bar
All four gates green, coverage >= 90/90/90, `npm test` under 60.3 s. TDD. The
complexity hook blocks >500 lines/file, >30 NLOC/function, CCN >10, >5 params —
extract a NAMED helper; never widen or add a `#lizard forgives` exemption
(stop 12). `layout-ink-extent.ts` is at 482 lines and `layout-ink-transition.ts`
at 169.

## Boundaries
- **Always:** consume the single core port; cite `file:line` for every upstream
  claim; state each mover's direction against the jar.
- **Never:** write a second `simulateCompound`; keep an unclipped copy "just in
  case" (D4); add compensating logic to arrowheads; tune to recover a fixture
  (D6); run git.

## Report (<=600 tokens)
The single clip call site; `fovafu-44` both rows before/after; the full mover
list with accounts AND directions; any away-from-jar mover with its diagnosed
mechanism; harness-diff and manifest-diff output; four gates, five ratchets,
`npm test` wall-clock.
