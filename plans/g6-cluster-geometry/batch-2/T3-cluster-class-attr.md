# T3 — Emit `class="cluster"` for 'cluster'-classified composites

## Prior observations (G5 C8, verified)

- This port never emits `class="cluster"` for ANY state composite; jar
  does, for composites its classification treats as clusters. The
  CLASSIFICATION in this port is already correct and jar-matching
  (C8 probe: `nasreq_auth` in pesita-10-dene726 → `kind='cluster'`).
  The gap is purely the rendered `class` attribute.
- The `<g class="entity"|"start_entity"|"end_entity"|"link">` wrapper
  conventions are documented at the top of
  `src/diagrams/state/renderer-group.ts` and `renderer.ts:105`.

## Context

plantuml-ts state renderer. Decision D3 (decisions.md): emission is
classification-driven — `class="cluster"` exactly where
`classifyDiagram` yields `'cluster'`, `class="entity"` elsewhere.
The spec is the jar oracle SVGs: match what jar emits per composite.

## Task

1. First, survey the jar oracle SVGs (`oracle/` state goldens +
   the batch-2 target fixtures' oracles) to confirm exactly which
   `<g>` wrappers jar gives `class="cluster"` (vs `entity`) and
   whether any other attribute differs on those groups.
2. Thread the composite's classification (`state-composite-classify.ts`
   output, reachable from the composite pass context) to the wrapper
   emission in `renderer-group.ts` / `renderer-composite-box.ts`; emit
   `cluster` for `'cluster'`-classified composites.
3. Unit tests: one 'cluster'-classified composite → `class="cluster"`;
   one 'autonom' → `class="entity"` unchanged; pseudostate/start/end
   wrappers untouched.
4. Regression proof: re-render ALL currently-pinned state goldens —
   bytes must be identical except where the jar oracle itself carries
   `class="cluster"` (expected: zero pinned goldens change, since no
   pinned fixture contains a 'cluster' composite; if one does change,
   verify against its jar oracle byte-for-byte before proceeding).

## Write-set

`src/diagrams/state/renderer-group.ts`,
`src/diagrams/state/renderer-composite-box.ts`,
`tests/unit/state/` (nearest existing renderer test file).
If threading classification requires a pass-context field:
`src/diagrams/state/state-composite-pass-types.ts` (types only).

## Read-set

`decisions.md#d3`; `src/diagrams/state/renderer-group.ts` (header doc
comment); `src/diagrams/state/state-composite-classify.ts` (overview
via Serena); a jar oracle SVG containing a cluster composite (e.g.
gojuja's) for the exact attribute shape.

## Acceptance criteria

- Given a 'cluster'-classified composite, when rendered, then its
  wrapper is `<g class="cluster" ...>` with all other attributes
  unchanged.
- Given an 'autonom' composite, when rendered, then output is
  byte-identical to before this change.
- Given every currently-pinned state golden, when re-rendered, then
  bytes match the pin (or, if changed, match the jar oracle exactly —
  journal which).

## Quality bar

`npm test && npm run typecheck && npm run lint` green.

## Boundaries

Never touch classification logic itself; never touch sizing; no git
mutations.

## Observability / Rollback

N/A new operations; Reversible (git revert).
