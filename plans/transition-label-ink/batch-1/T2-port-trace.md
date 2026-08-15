# T2 — trace the port side: which line must change, and what else reads it

## Context

Same project context as `T1-java-excavation.md`. **Read
`plans/transition-label-ink/evidence.md` first.** This task is a READ; it
writes notes only.

T1 answers "what does jar do". This answers "where would we change it, and
what else would move". They are disjoint and run in parallel.

## Task

Establish, on the port side:

1. **Every caller of the `labelInk: true` fold.** `layout-ink-extent.ts:391`
   is reached from `computeSvekResultGeometry`; the document-level
   `computeStateDocumentDims`/`computeStateInkShift` pass `labelInk: false`
   and are jar-verified and pinned (decision D5). Confirm nothing else
   reaches the `true` path, so a change there is confined.
2. **What `transition.label.width` is used for besides the fold.** It is
   `computeReservedLabelBox`'s `reservedWidth`, and it is also the FIXEDSIZE
   table width fed to graphviz. If the fix changes what the field MEANS
   rather than what the fold reads, the DOT moves and the 268/268 gate
   breaks. Establish which.
3. **Whether the drawn text width is reachable at the fold.** Mechanism (A)
   needs the measured width (111.475), not the reserved box (113). Say where
   that value lives at the point of the fold, or what would have to be
   threaded to get it there.
4. **How many fixtures the `labelInk: true` path touches.** Any state
   fixture with a labelled transition inside a composite. Name the count and
   how you got it — this is the blast radius the checkpoint reports.

## Read-set

- `plans/transition-label-ink/evidence.md` §3 and §7
- `src/diagrams/state/layout-ink-extent.ts` — the fold and both callers
- `src/diagrams/state/state-transition-label.ts` —
  `computeReservedLabelBox`, `transitionLabelAnchor`, `attachTransitionLabel`
- `src/diagrams/state/state-composite-edge-label.ts` — the FIXEDSIZE table
  reservation fed to graphviz
- `src/core/klimt/drawing/LimitFinder.ts#drawText` — the rule the fold
  should route through
- `src/diagrams/state/state-geo-types.ts` — `TransitionGeo.label`'s shape

## Write-set

- `.agent-notes/transition-label-ink-port.md` (create)

Nothing under `src/`.

## Interface contract (consumed by the checkpoint and T3)

```
fold callers:      <list, with labelInk value each>
label.width uses:  <list — ink fold, DOT table, anything else>
measured width at the fold:  reachable | needs threading via <path>
blast radius:      <N fixtures, and the command that counted them>
```

## Acceptance criteria

1. Given the note, when read, then every caller of the `labelInk: true`
   path is listed and the `false` callers are shown to be untouched.
2. Given the note, then it states whether fixing the fold can change the
   emitted DOT — and if it can, that is flagged as a stop-condition risk for
   the 268/268 gate.
3. Given the note, then the blast radius carries the command that produced
   it, not an estimate.
4. Given `git status`, only `.agent-notes/transition-label-ink-port.md` is
   new.

## Quality bar

All four gates exit 0. No rendered output moves. Revert any probe and
confirm with `git status`.

## Boundaries

- **Always:** name a command for every count.
- **Ask first:** any `src/` change.
- **Never:** run a git command.
