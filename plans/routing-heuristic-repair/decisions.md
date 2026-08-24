# Architecture decisions — `routing-heuristic-repair`

All five settled 2026-08-23, from the measurements the parent mission's halt
produced. Recorded with their evidence so nobody re-litigates them from
memory.

## D1 — registration order is FROZEN

**Context.** The parent mission's D1 read `src/index.ts`'s plugin
registration order as inverted from `PSystemBuilder.java:133-200` and directed
that it be re-mirrored. That was implemented, measured against the routing
gate, and reverted.

**Measured result.** Mirroring upstream's order exactly moves the gate
**79 → 469**: it fixes 25 fixtures and **newly misroutes 415**, via two
mechanisms, both accounted for with no residual.

- **262** — `sequencePlugin.accepts()` is true for **1351 of 3158** fixtures,
  **270 of which are not sequence diagrams** (152 CLASS, 96 STATE, 12
  DESCRIPTION, 10 NONE). Registering sequence first hands that 20%
  false-positive rate first refusal corpus-wide.
- **153** — upstream has description (`:138`) before state (`:139`); this port
  has state first. **153** fixtures are accepted by *both* engines and the jar
  calls **152 of them STATE**.

**Decision.** `src/index.ts` is in **no task's write-set**. The order does not
change in this mission.

**Consequences.** The current order is **load-bearing**, not merely inverted:
it is compensating for `accepts()` over-claim. Upstream's order is safe
because upstream breaks ties by attempting the parse
(`PSystemBuilder.java:257-266`, `isOk(f.createSystem(...))`); we break them
with per-line regexes. Re-mirroring becomes safe only once the heuristics are
as discriminating as that parse — which is what this mission moves toward and
what `dispatch-by-parse-attempt` finishes. Full diagnosis:
`.agent-notes/T2-registration-order-halt.md`.

## D2 — a task is judged by where the fixture LANDS, never by what stopped claiming it

**Context.** `DiagramRegistry#resolve` (`src/core/dispatcher.ts:249-253`)
returns the **first** plugin whose `accepts()` is true, and falls back to the
plugin for the block's own detected type when none accepts. So narrowing an
over-claimer does not deliver a fixture to the right engine — it releases the
fixture to whatever is next in registration order.

**Decision.** Every task's acceptance criteria assert `jarType === ourType`
for its bucket's fixtures, through the routing gate. "Engine X no longer
claims it" is never sufficient and never an acceptance criterion.

**Evidence.** Measured per fixture (the table in
[README.md](README.md#the-lesson-that-shapes-every-task)). Most buckets land
correctly, but **three do not, and would have been scored as successes**:
`dugeki-47-celo546` falls to yaml, `repudi-21-rovo448` falls to json, and
`zuvila-56-nuda425` falls back to its *detected* type, which is sequence —
the very engine T7 stops from claiming it.

**Consequences.** T3 is pulled forward into batch 2 to catch the first two,
and T6 and T7 must both land before `zuvila-56-nuda425` closes. This is the
direct lesson of the parent mission's halt, where a change was judged by a
bucket emptying rather than by fixtures arriving.

## D3 — narrow, never widen — with two named under-claim exceptions

**Context.** The over-claim class arose from patterns matching more than they
should. A repair that needs a broader match has usually misread the mechanism.

**Decision.** Narrowing is the default and the rule. **Two** repairs are
genuine under-claims and are permitted to widen:

1. **T5** — `probeSequence` (`src/core/block-extractor.ts:158-168`) misses
   left-pointing arrows and the `activate` / `deactivate` / `note over`
   family. These are sequence-only tokens; the widening is bounded by the
   command classes upstream registers in `SequenceDiagramFactory`.
2. **T6** — `classAccepts` must claim `map "…" as x {` positively. Object
   diagrams are the class family upstream (the jar renders
   `zuvila-56-nuda425` as `CLASS`), and the widening is bounded by
   `CommandCreateMap` and the `objectdiagram/command/` package.

**Consequences.** Both exceptions must cite the upstream command class in a
code comment and be recorded in the journal. Any *third* widening is a stop
condition. Note that T6 both widens (claim `map`) and narrows (stop probing
inside `{{ }}`) in the same file — they are different defects and the task
specifies each separately.

## D4 — `NONE` on the jar's side is classified, not chased

**Context.** Four pinned "misroutes" have `jarType: NONE`. Reading the
goldens: two are PlantUML version-banner error images, one is
`An error has occurred : java.lang.NullPointerException`, and one is
`svg-class/class-actor-bare-no-allowmixing`, whose own fixture header records
that the jar rejects the input and that this port reaching its class engine
is the correct behaviour.

**Decision.** T1 teaches the gate to record that the jar itself errored, and
counts those fixtures separately from misroutes.

**Consequences.** The mission's denominator becomes **75 defects**, not 79.
A jar crash is not a routing target, and pinning one as `known-misroute`
would floor the SLI above zero for a reason no repair can move — the same
error the parent mission's include-store decision corrected at T1.
`jarType: NONE` remains a real, compared value everywhere else: upstream
legitimately emits no attribute for `@startdot` passthrough, and several of
our own engines emit none either.

## D5 — batches are ordered by blast radius, and re-pinning is last

**Context.** `descriptive-keywords.ts` is shared by class, description and
sequence; `block-extractor.ts` types every block in the corpus. Both reach
far beyond their own bucket. Routing changes also move rendered bytes across
several engines at once.

**Decision.** Batch order is ascending blast radius (T1 → T2/T3 → T4 → T5 →
T6/T7), and **no batch before 6 touches a baseline**.

**Consequences.** Same separation `sequence-root-chrome` used, and what made
its regressions legible rather than one undifferentiated diff. The one
departure from strict blast-radius order is T3, pulled into batch 2 by D2's
measured dependencies.
