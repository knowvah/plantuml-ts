# Architecture decisions — `dispatch-by-parse-attempt`

All seven settled 2026-08-24 with the maintainer. D7 and the refusal-scope
ruling under D0 were maintainer choices; the rest are recommendations accepted
as written. Each carries the evidence so nobody re-litigates it from memory.

## D0 — refusal is the real parse path, not a dispatch-only probe

**Context.** Refusal could be used only to *choose* an engine, leaving the
chosen engine's own parse permissive as today — closing routing with almost no
user-visible change.

**Decision.** **No.** `resolve()` and `render()` share **one** strict parse. An
unmatched line produces an error diagram; when every candidate refuses, the
highest-scoring refusal wins ([D2](#d2)).

**Consequences.** Error-page behaviour changes corpus-wide, and goldens and
ratchets are expected to move. Accepted deliberately: a dispatch-only probe
would leave two parse paths, and the permissive one would rot. It is also what
makes [D7](#d7) possible — and D7 is the reason this mission is worth doing
beyond the two fixtures it inherits.

## D1 — a plugin refuses by *returning*, never by throwing

**Context.** `plugin.parse()` is our analogue of
`PSystemCommandFactory.createSystem`, which returns an `AbstractDiagram` that
may itself be a `PSystemError`, or `null` (`:107-142`, `:159-161`).

**Options.** (A) `parse()` returns `AST | ParseRefusal` · (B) `parse()` throws a
typed refusal the dispatcher catches · (C) a separate `tryParse()`.

**Decision. A.**

**Consequences.** B collapses two distinct upstream outcomes into one: upstream
reserves `throw` for the `catch (Throwable t)` crash path
(`PSystemBuilder.java:273-279`), which produces `EXECUTION_ERROR "Fatal crash
error"` — a different diagram from a syntax refusal. C leaves the permissive
path alive, which [D0](#d0) forbids. A costs a narrowing at every `parse()`
call site; there are few.

## D2 — all-candidates-fail is broken by upstream's score, ported verbatim

**Context.** When no factory succeeds, `PSystemErrorUtils.mergeV2`
(`:140-147`) keeps the highest-scoring error, and
`PSystemError.score() = trace.size() * 10 + singleError.score()`
(`PSystemError.java:382-384`). `trace.size()` is how many lines the parse
consumed before failing, so **the factory that got furthest owns the error
page**.

**Decision.** Port the arithmetic verbatim, with that citation.

**Consequences.** Not a fitted constant — it is upstream arithmetic with a
`file:line`. First-refusal-wins was rejected: it would silently pick a
different error page from the jar's on every all-fail source, and nothing in
the corpus would catch it.

## D3 — pay for N parses; measure, do not prefilter

**Context.** A state diagram is parsed by sequence, class, activity and
description before state — up to five full parses per `@startuml`. The suite
renders 3158 fixtures under SI37's test-budget invariant.

**Decision.** Faithful: parse candidates in order until one succeeds. **Report
the measured cost multiple as a number** (SLI 3).

**Consequences.** A prefilter is the heuristic layer this mission deletes;
re-adding one under a performance justification is [stop condition
5](README.md#stop-conditions). Memoization was not chosen but is not
forbidden as a later, separately-measured change. Per the standing note, the
suite's wall-clock ceiling is advisory context, not a gate — but a
*super-linear* blowup is a stop.

### D3' — the order freeze lifts only together with refusal

`routing-heuristic-repair`'s D1 froze `src/index.ts` registration order after
mirroring upstream's order moved the routing gate **79 → 469** — 25 fixed, 415
newly misrouted (`.agent-notes/T2-registration-order-halt.md`). That freeze was
conditional on the heuristics staying. This mission lifts it, but **only in the
same atomic unit as refusal**: order without refusal reproduces the 469, and
refusal without the dispatch switch errors the corpus wide. Hence batches 3a
and 3b gate together (`README.md#batches`).

## D4 — `accepts()` leaves the exported interface

**Context.** It is part of `DiagramPlugin` and appears in `docs/catalog.md:41`.

**Decision.** Remove it from the interface and from all 14 plugins.

**Consequences.** A public-type break, accepted: the library has no external
consumers to coordinate, and a retained no-op invites a future caller to
depend on dispatch behaviour that no longer exists. `docs/catalog.md`
regenerates (`npm run catalog`, drift-gated).

## D5 — `detectUmlType` is deleted, not reduced

**Context.** `block-extractor.ts:267` guesses **one** type from `@startuml`
content. Upstream never guesses: `findStartTypes` returns the fixed 10-element
set for `@startuml` and a singleton for everything else
(`DiagramType.java:69-92`, `:198-201`).

**Decision.** Delete it. `UmlSource.type: DiagramType` becomes
`UmlSource.types: ReadonlySet<DiagramType>`.

**Consequences.** Cheap — `source.type` has only four read sites
(`dispatcher.ts:249,250,266`, `error/error-diagrams.ts:131`). The
`error-diagrams.ts` site derives the assumed type for an empty `@startuml` and
must keep behaving identically; it is named in T3's acceptance criteria.

## D6 — strict-loop scope follows upstream's factory base classes

**Decision.** Mirror upstream's own split rather than choosing a number:

| Upstream base | Ported engines | This mission |
|---|---|---|
| `PSystemCommandFactory` | sequence, class, activity, description, state, board, chart, packetdiag | strict per-line refusal (**8 tasks**) |
| `PSystemAbstractFactory` | json, yaml, hcl, files | own document parser reports its own failure — unchanged |
| `PSystemBasicFactory` | dot | passthrough — unchanged |

**Consequences.** board, chart and packetdiag gain refusal even though they are
single-candidate and their refusal can never change routing. They are in scope
because [D0](#d0) makes strict parsing the real path, not because dispatch
needs them.

## D7 — a newly-erroring fixture is a defect, not a baseline movement

**Context.** Once refusal is real, every corpus fixture becomes an assertion
that **our command tables match upstream's**. A fixture where we now error but
the jar rendered is not accepted movement — it is our command coverage being
incomplete, exposed for the first time.

**Options.** (A) treat every such fixture as a defect and gate the count ·
(B) re-pin them as baseline movement.

**Decision. A**, with dedicated per-engine coverage batches planned up front
(batches 4–6) on the assumption that the count is large.

**Consequences.** B would let refusal hide missing commands behind re-pinned
goldens — precisely the failure the routing gate was built to prevent, where 86
misroutes survived indefinitely because every one still rendered. The cost of A
is that the count is unknowable until batch 3b closes, so batch 4–6 membership
is a planning guess to be re-derived from measurement. This is also the mission's
largest hidden value: it is the first thing this port has ever built that can
measure command-table coverage at all.
