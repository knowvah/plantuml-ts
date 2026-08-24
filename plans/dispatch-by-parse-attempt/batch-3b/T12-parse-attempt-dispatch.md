# T12 — parse-attempt dispatch

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. This is the task the whole mission
exists for.

`resolve()` currently picks an engine by calling each plugin's regex
`accepts()` in registration order. Upstream has no such concept. It builds a
candidate set from the `@start` line, walks factories in a fixed order, skips
any whose type is not a candidate, and **attempts the parse** — the first
result that is not an error wins (`PSystemBuilder.java:256-266`).

T1 gave us the refusal type, T2 the candidate set, T3 the widened contract, and
T4–T11 made eight engines capable of refusing. This task replaces the
heuristic with the real thing.

## Task

Three changes that must land together.

**1. `resolve()` becomes parse-attempt.** Mirror `createPSystem`'s loop:
iterate plugins in registration order, skip any whose type is not in
`source.types`, call `parse()`, and take the first non-refusal. Collect
refusals; when every candidate refuses, produce the error diagram for
`mergeRefusals(refusals)` — the highest-scoring refusal, per
`PSystemErrorUtils.mergeV2` (`:140-147`).

`parse()` is now called during resolution. **Do not parse twice.** Return the
AST alongside the chosen plugin so `renderSync` consumes the parse that
resolution already performed — [D0](../decisions.md#d0) requires one parse
path, and re-parsing would also double D3's cost.

**2. Re-mirror registration order** in `src/index.ts` to
`PSystemBuilder.java:133-141`: sequence, class, activity, description, state,
then the rest. Sequence moves from **last to first**.

**3. Remove `accepts()`** from `DiagramPlugin`, `SyncPlugin`, `AsyncPlugin`,
and all 14 plugins.

## Why these three are one task

`routing-heuristic-repair`'s D1 froze registration order because mirroring
upstream's order moved the routing gate **79 → 469** — 25 fixed, 415 newly
misrouted (`.agent-notes/T2-registration-order-halt.md`). The order is
load-bearing *under heuristics*: it compensates for `sequencePlugin.accepts()`
claiming 1343 of 3158 fixtures, 244 of them not sequence diagrams. Under
parse-attempt that compensation is unnecessary and the upstream order becomes
correct. Landing either half alone reproduces a known-broken state.

## Write-set

- `src/core/dispatcher.ts`
- `src/index.ts`
- all 14 `src/diagrams/*/index.ts`
- tests asserting `accepts()` behaviour
- `docs/catalog.md` (`npm run catalog`)

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/PSystemBuilder.java:230-300` — `createPSystem`, `isOk`, and the factory list at `:133-141`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/error/PSystemErrorUtils.java:112-147`
- `src/core/dispatcher.ts:236-275` — the three tiers being replaced
- `src/core/parse-refusal.ts`, `src/core/diagram-type-set.ts`
- `.agent-notes/T2-registration-order-halt.md` — the full halt diagnosis
- `plans/routing-heuristic-repair/README.md` — its close-out and residual
- **`tests/oracle/svg-conformance/routing-conformance.test.ts`** — the SLI, and
  its header explains why corpus directory names are not the oracle

## Named regression checks

Two fixtures carry known traps from the predecessor mission. Verify both
explicitly and report on them:

- **`component/kokebo-27-vafi688`** — the proof criterion. It must route
  **DESCRIPTION** with no heuristic. `CommandPackageWithUSymbol` is registered
  on both `ClassDiagramFactory.java:130` and `DescriptionDiagramFactory.java:96`,
  and `CommandRemoveRestore` on both (`:114`, `:94`), so every line parses under
  both — only class-tries-first plus whole-document parse success separates them
- **`sequence/dudeku-78-naju581`** — `routing-heuristic-repair`'s close-out
  warns that adding `stereotype` to the class TYPE alternation misroutes this
  fixture, where `stereotype {` is a `<style>` block selector. The heuristic
  disappears here, but the underlying ambiguity does not. Confirm where it
  lands and why

## Architecture decisions in force

- [D0](../decisions.md#d0) one parse path · [D1](../decisions.md#d1) refusal
  returns · [D2](../decisions.md#d2) max-score merge ·
  [D3](../decisions.md#d3) measure the N-parse cost, do not prefilter ·
  [D3'](../decisions.md#d3--the-order-freeze-lifts-only-together-with-refusal)
  order and refusal are one unit · [D4](../decisions.md#d4) `accepts()` leaves
  the public interface

## Acceptance criteria

1. *Given* `component/kokebo-27-vafi688`, *when* resolved, *then* it routes
   **DESCRIPTION**, with no engine-specific special case anywhere in the path
2. *Given* the routing gate, *when* run, *then* disagreements are **≤ 2** and
   **zero** fixtures newly misroute
3. *Given* a source no candidate accepts, *when* rendered, *then* the error
   diagram is the highest-scoring refusal's, per `mergeRefusals`
4. *Given* any source, *when* rendered, *then* `parse()` runs at most once per
   candidate — resolution's parse is reused, never repeated
5. *Given* `accepts`, *when* grepped for across `src/`, *then* there are no
   definitions and no callers
6. *Given* SLI 3, *when* measured, *then* the suite's cost change from repeated
   candidate parsing is reported as a number

## Observability

Instrument and report **all four SLIs** at this task's close — it is the
mission's measurement point:

- SLI 1 routing disagreements, with the jar→ours bucket table
- SLI 2 refusal coverage, **broken down per engine** — this sizes batches 4–6
- SLI 3 parse cost as a multiple of the pre-mission suite time
- SLI 4 any ratchet or baseline movement, each with a mechanism

## Rollback

Reversible — revert 3a and 3b together. Reverting 3b alone leaves eight strict
parsers with heuristic routing, which is the incoherent state 3a warned about.

## Quality bar

All four quality gates green for **3a+3b together**. The routing gate must not
regress. Report all four SLIs in the commit body and in
`decision-journal.md`.

## Boundaries

- **Always:** report SLI 2 per engine, however large; verify both named
  regression fixtures
- **Ask first:** any change to `routing-conformance.test.ts`, a committed
  measuring instrument outside this write-set
- **Never:** re-introduce a heuristic, a prefilter, or an engine-specific
  special case to make a fixture pass — that is [stop condition
  5](../README.md#stop-conditions) and it defeats the mission's premise; run
  Prettier

## Commit

`feat(T12): dispatch by parse attempt, mirroring PSystemBuilder`

Body must explain the order re-mirror and cite the halt note, since this
reverses a previously-measured decision.
