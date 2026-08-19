# T1 — Prove D1's premises before any code depends on them

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-anchor-clip-retire`. Faithful TypeScript port of PlantUML; the Java
at `~/git/plantuml` is the **canonical spec** — read method bodies, not
summaries. **You write NO source this task.** Your output is evidence and a
verdict.

D1 (`decisions.md#d1`) ports `DotStringFactory.solve`'s edge loop: clip every
transition once, after node geometry is final, before any consumer. That is
only sound if the premises below hold in THIS port.

## Task — answer four questions, each with `file:line` evidence

### Q1 — Are node geos final at the proposed pass site, on every path?
Entry points to audit, all of them:
- flat: `state/layout.ts:183-188` (`buildFlatStateGeos` + `buildFlatTransitionGeos`)
- composite: the SIX `buildLevelTransitionGeos` call sites —
  `state-composite-concurrent.ts:189`, `:438`;
  `state-composite-cluster.ts:271`; `state-composite-geo.ts:498`;
  `state-composite-autonom.ts:267`, `:285`

For each: are the `StateNodeGeo`s that `collectAnchorRects` needs already
materialized and positioned when the transitions for that level exist?

### Q2 — Is the coordinate frame the same?
`state-composite-concurrent.ts:438` and `state-composite-autonom.ts:285` pass a
**shifted** result. Determine, per site, whether transition points and the
anchor rectangles are in the SAME frame at the moment the proposed pass would
run. A single pass over final assembled geometry should make this trivially
true — **verify that it does** rather than assuming it.

### Q3 — D4: does anything need the UNCLIPPED path?
Enumerate every reader of `TransitionGeo.points` and classify each as
clipped-safe or not. Upstream's only pre-clip consumer is `dotPathInit`
(`SvekEdge.java:658`), used solely for Kal (`:1071-1075`), and Kal is not
ported for state. Confirm that holds here.

### Q4 — D5: do labels move?
`attachTransitionLabel` / `attachInlineTransitionLabel` are handed
`edgeResult.points` at construction. Establish whether the label POSITION comes
from the engine's own `lp` (so clipping cannot move it) or is derived from the
point list (so it can). Read the Java for what upstream does before deciding
what ours should do.

## Write-set
- `.agent-notes/si32-T1.md` — the evidence, per question, per site
- `plans/state-anchor-clip-retire/decision-journal.md` — the verdict

**No `src/`, no `tests/`, no baselines.** Gated tracing inside `src/` is
allowed ONLY if reverted before you finish; probes go under
`scripts_scratch/T1/` and are deleted.

## Read-set
- `decisions.md#d1`, `#d4`, `#d5`
- `src/diagrams/state/layout-ink-transition.ts:75-127` — `collectAnchorRects`
  and today's `clipTransitionPoints`
- The six call sites listed in Q1
- `~/git/plantuml/.../svek/DotStringFactory.java:441-467` — `solve`'s ordering.
  **Read the method body.**
- `~/git/plantuml/.../svek/SvekEdge.java:618-700` — `solveLine`, the clip at
  `:671-672`, extremities at `:679-684`, `dotPathInit` at `:658`

## Acceptance
- Given each of the seven entry points, then the note records whether node geos
  are final and same-frame there, with `file:line` evidence — not a general
  argument applied to all seven.
- Given Q3, then every `TransitionGeo.points` reader is enumerated and
  classified.
- Given Q4, then the label's position source is established from the code and
  the Java, and D5 is confirmed or contradicted.
- Given any premise that fails, then the task STOPS with that finding
  (stop 9) rather than proposing a workaround.

## Interface contracts
Output consumed by T2: a per-site table `{ site, nodeGeosFinal, sameFrame,
notes }`, plus the D4 reader classification and the D5 verdict.

## Observability
N/A — no new observable operations.

## Rollback
Nothing to roll back; this task writes only notes.

## Quality bar
Four gates green (you changed no source, so they should be). Every claim
carries `file:line`. "It looks like" is not a finding — if you cannot show it,
say you could not.

## Report (<=500 tokens)
The per-site table; the D4 classification; the D5 verdict; **GO or STOP** for
D1, with the single most load-bearing piece of evidence for that call.
