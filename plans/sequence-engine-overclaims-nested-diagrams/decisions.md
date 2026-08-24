# Architecture decisions — `sequence-engine-overclaims-nested-diagrams`

All six settled 2026-08-23. D2 was a maintainer choice; the rest were settled
by measurement and are recorded with the evidence so nobody re-litigates them
from memory.

## D1 — registration order mirrors upstream

**Context.** `PSystemBuilder.java:133-141` adds its factories in the order
`PSystemWelcomeFactory`, `PSystemColorsFactory`, **`SequenceDiagramFactory`**,
`ClassDiagramFactory`, `ActivityDiagramFactory`, `DescriptionDiagramFactory`,
`StateDiagramFactory`, … . `src/index.ts:70-87` registers
`class, state, description, activity, yaml, json, hcl, board, chronology,
files, packetdiag, chart, dot, sequence` — **sequence last**.

**Decision.** Reorder registration to upstream's.

**Consequences.** Sequence is first upstream and last here, so class,
description, json and yaml get first refusal on sequence diagrams; that
inversion accounts for the entire 70-fixture underclaim bucket. This is the
structural divergence `CLAUDE.md` names as *the* bug, so it is re-mirrored
rather than patched around. It is one line per plugin with corpus-wide reach,
which is why T2 measures before and after and is not parallel with anything.

## D2 — repair heuristics now; defer parse-attempt as its own mission

**Context.** Upstream does not use acceptance heuristics at all. It iterates
factories in fixed order and **attempts the parse**, taking the first success
(`PSystemBuilder.java:258-266`):

```java
for (PSystemFactory f : factories) {
    if (!diagramTypes.contains(f.getDiagramType())) continue;
    Diagram sys = f.createSystem(...);
    if (isOk(sys)) { result = sys; ... }
}
```

That is why upstream never claims `$arrow("-->")`: its sequence factory fails
to parse the source and falls through. We decide by regex instead.

**Options.** (A) order + targeted heuristic repair · (B) full parse-attempt
re-mirror · (C) hybrid — regex prefilter, tie broken by counting unrecognised
lines per candidate parser.

**Decision.** **A**, with **B filed as its own mission**. Chosen by the
maintainer 2026-08-23.

**Evidence for the deferral, not an effort estimate.** Our parsers are
permissive: fed the offending object-diagram source, `parseSequence` returned
a populated AST (2 participants, 1 event) rather than failing. Upstream's
equivalent fails because its command parser is strict — every line must match
a registered `Command`. So B requires strict unrecognised-line handling in 13
engines, changing error behaviour everywhere. That is "genuinely large AND
separable, proven by measurement", the one deferral `CLAUDE.md` permits.

C was rejected: it invents a scoring rule with no upstream basis, which is
fitting a value.

**Consequences.** The structural divergence survives this mission in reduced
form. If the residual after T3 can only be closed by B, that is a **stop
condition** — record it and let the deferred mission have it.

## D3 — the jar's `data-diagram-type` becomes a committed routing gate

**Context.** 86 misroutes persisted indefinitely because nothing compares our
engine choice to upstream's, and every affected fixture renders successfully —
no throw, no error card, no failing golden.

**Decision.** A conformance test asserting our `data-diagram-type` equals the
golden's, across **both** fixture trees, with a pinned known-failure list that
ratchets down only.

**Evidence.** Both trees carry the attribute:
`test-results/dot-cache/<type>/<slug>/in.svg` (2674 fixtures) and
`oracle/goldens/svg-*/<slug>/golden.svg` (~484) — together ~3158, matching
`render-manifest`'s entry count.

**Consequences.** This is the mission's durable deliverable. The fix without
the gate would silently rot again — that is exactly how this defect survived.

**The corpus is not exhaustive, and an 87th misroute proves it.** While
authoring this brief's own diagrams, `diagrams/data-flow.md`'s second block —
a sequence diagram *of the dispatcher* — rendered as `data-diagram-type=
"CLASS"`. Bisected to a single line: `JSON --> REG : false`, i.e. a
participant aliased `JSON`. Renaming the alias to `JSN` restored `SEQUENCE`.
That case exists in no fixture, so the gate in this decision would not have
caught it; it was caught by `CLAUDE.md`'s rule that every authored diagram
must actually be rendered and checked. Two consequences: a third mechanism
class exists — **a participant named after a diagram-type keyword** — and the
gate's pass is evidence about the corpus, never proof of correctness.

## D4 — keep the fast path, re-scope it to upstream's candidate type set

**Context.** `dispatcher.ts#resolve` carries an ad-hoc
`AMBIGUOUS_TYPES = {sequence, class, state, unknown}` that decides which
sources must go through `accepts()`. Upstream instead filters factories by
the `@start` line's declared type set (`PSystemBuilder.java:259`,
`DiagramType.findStartTypes`).

**Decision.** Express the fast path as upstream's candidate-set filter.

**Consequences.** This is the piece most likely to move a *currently correct*
fixture, so it is its own task, landed and measured separately from D1.

## D5 — fix and re-pin are separate batches

**Context.** Routing changes move rendered bytes across class, state,
description, json and yaml simultaneously.

**Decision.** Batches 2–4 touch no baseline; batch 5 re-pins.

**Consequences.** Same separation `sequence-root-chrome` used for T3 vs
T4/T5, and it is what made that mission's regressions legible rather than a
single undifferentiated diff.

## D6 — corpus classification is left alone

**Context.** `test-results/dot-cache/<type>/` comes from
`scripts/populate-corpus.py`, which over-selects (its own notes record this:
1427 candidates rendered, 285 rejected, because a bare `A -> B` anywhere makes
its pattern match non-sequence diagrams).

**Decision.** Out of scope. The jar's `data-diagram-type` is the oracle, so
directory names stop mattering.

**Consequences.** Directory names stay misleading — `object/zuvila-56-nuda425`
is a CLASS diagram and 70 files under `sequence/` are not sequence diagrams.
Accepted: renaming would move every path in a 3158-entry manifest for no
behavioural gain, and the gate makes the names irrelevant to correctness.
