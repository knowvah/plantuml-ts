# T4 — G20a: pseudo-node declaration order matches the jar's creation order

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-residual-fix-batch`. Faithful TypeScript port of PlantUML; the Java
at `~/git/plantuml` is the spec. vitest, `tests/unit/state/`.

This is the mission's last batch and its riskiest. It closes ONE row worth
+0.750 px and can move up to 83 fixtures in either direction. It is scoped
this way on purpose — read D5 before starting.

## Task
Both composite passes build `acc.nodes` in the same order:

```ts
const memberSpecs = s.children.map((c) => resolveMember(c, acc, childCtx, undefined));
const pseudoSpecs = addLocalPseudoNodes(s.id, s.transitions, acc, ctx.pseudoCreationIndex);
```

`resolveMember` pushes member nodes onto `acc.nodes`; `addLocalPseudoNodes`
then appends the `[*]` circles. `runPass` consumes that raw array. The later
`sortSpecsByCreationIndex([...pseudoSpecs, ...memberSpecs])` reorders only the
`GeoSpec` list used for materialization — it never touches `acc.nodes`, and it
runs after `runPass` has already laid out.

The jar's order is its real creation order: `StateDiagram.java:92-107`'s
`getStart` creates `[*]`'s entity via `reallyCreateLeaf` on FIRST REFERENCE,
so for `kejabo-83` — whose composite opens with `[*] --> Idle` — the init
pseudo is registered ahead of `Idle`/`Configuring`. The jar's own cached
`svek-1.dot` confirms it: `sh0006=circle([*]), sh0007=Idle, sh0008=Configuring`.

Make our `acc.nodes` push order match the jar's creation order. **Both files**
— `state-composite-concurrent.ts`'s `buildConcurrentBranchAcc` has the
identical shape, so fixing only `state-composite-autonom.ts` leaves the other
diverging the same way.

Prefer merging the two spec lists through the existing creation-index ordering
*before* `runPass` consumes `acc.nodes`, over hand-swapping two call lines —
the creation index is the thing that actually encodes jar order, and a bare
swap would be right for `kejabo-83` and wrong for a composite whose first
reference is a member.

## Write-set
- `src/diagrams/state/state-composite-autonom.ts`
- `src/diagrams/state/state-composite-concurrent.ts` — `buildConcurrentBranchAcc`
  only. T1 and T2 already own other functions in this file in earlier batches;
  do not disturb their work.
- `src/diagrams/state/state-composite-pseudo.ts` — only if the ordering helper
  itself must change to support pre-`runPass` ordering.
- The corresponding unit tests.

## Read-set
- `plans/state-declared-size-fix/findings/G20-linetype-routing.md` — the
  `kejabo-83-vinu490` record. Its `causalChain` proves this is an ORDER
  effect, not arithmetic: our own emitted DOT and the jar's, both fed through
  the SAME real `dot -Txdot`, place the forward edge identically and the
  reverse edge 0.75 px apart.
- `decisions.md#d5`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/statediagram/StateDiagram.java:92-107`
  — `getStart` / `reallyCreateLeaf`. **Read the method body.**
- `src/diagrams/state/state-composite-pseudo.ts` — `addLocalPseudoNodes`
  (:118) and `sortSpecsByCreationIndex` (:59), and the doc comment at
  `state-composite-pseudo.ts:63-116` on `Bibliotekon`'s `LinkedHashMap`
  registration-order guarantee
- `plans/state-declared-size-fix/decisions.md` D4 — the same order-fidelity
  family one scope up (top-level cluster siblings), where the mission ruled
  SORTED pairing rather than a source fix. That ruling is about the harness's
  pairing, not about this push order; do not read it as forbidding this fix.

## Architecture decisions (locked)
D5 — last batch, full-corpus gate, revert-the-batch on net growth.

## Acceptance
- Given `kejabo-83-vinu490`, when the harness runs, then scope2 width idx2 is
  exact (+0.750 → 0).
- Given both composite passes, then each builds `acc.nodes` in jar creation
  order, and a unit test asserts the `[*]`-first case directly against
  `kejabo-83`'s own shape.
- Given the FULL corpus harness, then the net is shrink-only. **If it is not:
  revert the entire batch, journal the measured net (rows exact / appeared /
  grown, with fixture names), and file G20a as a tracked mission in
  `planning/next-missions.md`.** That is a successful outcome of this task,
  not a failure — do not iterate toward a green gate.
- Given `render-manifest`, then every moved fixture is on `expected-moves.txt`
  under a `# Batch 4` heading with a jar-side account.

## Interface contracts
None — `acc.nodes` ordering is internal to the pass. No type changes.

## Observability
N/A — no new observable operations. Note for the close-out whether drawn
output moved (it may, for any fixture whose label placement shifted).

## Rollback
Reversible, and reversion is an ANTICIPATED outcome here, not an incident.
One commit; revert it whole.

## Quality bar
All four gates green, coverage >= 90/90/90. TDD.

Opus behavioural note: implement the minimal faithful interpretation. Do not
generalise this into an ordering framework, and do not "improve" adjacent
ordering code. The carve-out applies in the other direction too — the row list
and both files are enumerated requirements, not optional scope.

## Boundaries
- **Always:** run the full-corpus harness before declaring done; treat a
  non-shrink-only net as the revert trigger, not as something to tune toward.
- **Ask first:** nothing — D5 already decided the failure branch.
- **Never:** hand-swap the two call lines without the creation index if that
  would only be right for `[*]`-first composites; disturb T1's
  `regionInkGeometry` or T2's `buildConcurrentBranchAcc` accumulator args;
  run git.

## Report (<=500 tokens)
kejabo-83 before/after; the full-corpus net (exact / appeared / grown, with
names); whether you reverted and why; every moved fixture with its account.
