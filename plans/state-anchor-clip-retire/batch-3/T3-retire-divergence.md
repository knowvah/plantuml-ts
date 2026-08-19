# T3 — Delete the divergence, and file what the pass exposed

> **Amended 2026-08-19 after T2.** Step 1's "remove the empty parent heading"
> no longer applies, and a new **Step 4** is added: T2's clip reached a
> border-point family upstream treats differently, and that gap must be
> recorded as this file loses its old entry. See `decisions.md#d2a` and the
> decision journal's T2 rows.

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-anchor-clip-retire`. Docs only — you change no `src/`, no tests, no
baselines. T2 has landed and the state engine now clips once.

## Task

### Step 1 — delete the divergence entry
Remove the `DIVERGENCES.md` section "State diagrams — Composite-anchor
transitions: `simulateCompound` clip applied to ink, not to the drawn path"
**in full**, including its heading. Do not soften it, do not rewrite it as
"partially resolved". If the section's parent `## State diagrams` heading is
left with no entries, remove that too rather than leaving an empty heading.

**Before deleting, verify the claim is actually false now** — and verify it in
the CODE, not from T2's report. `clipTransitionPoints` must be gone from
`layout-ink-transition.ts`, the ink walk must read `transition.points`
directly, and `state-renderer-transitions.ts` must read the same already-
clipped array. Deleting a divergence that still exists is worse than never
having recorded it.

**Do NOT remove the `## State diagrams` parent heading.** Step 4 adds a new
entry under it. (The original instruction assumed the section would be left
empty; it will not be.)

### Step 2 — fix the stale pin
`docs/architecture/overview.md` states the dot-engine dependency as
`@knowvah/dot-engine@^1.5.0`. It has been `^1.6.0` since SI31's T1
(`c5cb7771`). Correct it, and check the surrounding paragraph for anything else
that went stale with it.

### Step 3 — file the two gaps the pass exposed
Porting `DotStringFactory.solve`'s edge loop brackets two sibling passes this
port does not have. **File both in `planning/next-missions.md`, do not fix
them** — each with `file:line` and an honest statement of what is and is not
known:

1. **`alignEdgesAtLabelNodes` is unported anywhere.**
   `svek/DotStringFactory.java:461-463` runs it between the clip loop and
   `manageCollision`, gated on `DotSplines.ORTHO`. It collects nodes whose
   entity name starts with `transition_` and aligns edges through them.
   Relevant because state's `linetype ortho`/`polyline` path is where SI31 left
   `pavuzo-79-zodu430` open — **but SI31 attributed that residual to a
   dot-engine canvas-reservation gap (`docs/graphviz-issues/17`), so do NOT
   assert these are the same mechanism.** Record it as an unported upstream
   pass on that path, and say plainly that the relationship is unexamined.
2. **`manageCollision` is ported for the class engine only.**
   `class-edge-label-anchor.ts:199`, from `SvekEdge.java:1205-1216`. State has
   no equivalent. Record it; do not assess whether state needs it.

### Step 4 — record the border-point clip-rect gap as a NEW divergence
T2's clip uses the raw graphviz cluster box (`result.clusters`) for every
endpoint. Upstream does the same **except** for composites with border-point
children, where `solveLine` adjusts the rect first:

```java
if (projectionCluster != null)
    projectionCluster.manageEntryExitPoint(stringBounder);   // SvekEdge.java:660-663
dotPath = dotPath.simulateCompound(lhead..., ltail...);      // SvekEdge.java:671
```

`Cluster.java:410-430` reassigns `rectangleArea =
frontierCalculator.getSuggestedPosition()`, applying `ensureMinWidth(
getTitleAndAttributeWidth() + 10)` when the cluster has a title.
`ClusterDotString.java:101-105` sets `projectionCluster` only when
`entityPositionsExceptNormal().size() > 0`, on the lines that cluster is
`lhead`/`ltail` for. Note it is an order-dependent mutation of shared cluster
state inside the per-line loop: a later line clipping against the same cluster
sees the already-adjusted rect.

Write a `DIVERGENCES.md` entry under `## State diagrams` recording this.
Required content, from `.agent-notes/si32-T2.md` and the decision journal —
**do not re-derive the measurements, do re-check the citations**:
- the two reachable fixtures, `pesita-10-dene726`/`AA` and
  `viroxo-69-fito663`/`comp1`, and that reachability was measured with the
  port's own `hasDirectBorderPointChild`, not inferred
- the measured rect deltas: `AA` 156x118.720 raw vs 126x104.720 adjusted;
  `comp1` 123x277.000 vs 109x277.000
- that both fixtures still move TOWARD the jar under T2 (orchestrator-measured
  summed path-endpoint distance: `pesita` 761.735 -> 663.541, `viroxo` 121.133
  -> 77.401), so this narrows the error without closing it
- that `pesita` retains the largest residual of any fixture spot-checked,
  consistent with the unported adjustment being a real remaining term there
- why it is not fixed here: porting `FrontierCalculator` is a second port of
  upstream arithmetic and was out of T2's scope

**Be honest about what is not known.** Nobody has measured what the adjusted
rect would do to the clip result — only what the rects themselves are. Say
that, rather than implying the residual is fully explained.

Also file it in `planning/next-missions.md` as a candidate, alongside Step 3's
two gaps.

## Write-set
- `DIVERGENCES.md`, `docs/architecture/overview.md`,
  `planning/next-missions.md`, `.agent-notes/si32-T3.md`

## Read-set
- `DIVERGENCES.md` — the "State diagrams" section, whole
- `.agent-notes/si32-T2.md` — T2's evidence that the divergence is gone
- `docs/architecture/overview.md` — the repo-relationship paragraph
- `~/git/plantuml/.../svek/DotStringFactory.java:441-467` — both sibling passes

## Acceptance
- Given `DIVERGENCES.md`, then the composite-anchor entry is absent entirely,
  the `## State diagrams` heading remains, and it carries the new border-point
  clip-rect entry from Step 4.
- Given the Step 4 entry, then every Java citation in it resolves to the line
  claimed (check them; they were written by the orchestrator, not verified by
  you) and it states plainly what has NOT been measured.
- Given `docs/architecture/overview.md`, then the pin reads `^1.6.0`.
- Given `planning/next-missions.md`, then both gaps appear with `file:line`,
  and the `alignEdgesAtLabelNodes` entry explicitly does NOT claim a link to
  `pavuzo-79`'s open row.
- Given T2's report contradicting Step 1's premise, then the entry is NOT
  deleted and the task stops.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: docs only, one commit.

## Quality bar
Four gates green (docs-only, so they should be). Every filed claim carries
`file:line`. Do not overstate: "unported" is a fact, "would fix X" is not.

## Report (<=350 tokens)
Confirmation the entry is gone and why that is now true; the overview.md fix;
the two filings as written.
