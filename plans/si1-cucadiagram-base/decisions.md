# Architecture Decisions — SI1

## ADR-1: Port + wire + contract — no engine migration

**Status:** Accepted (2026-08-05)

The base (plasma/abel/cucadiagram + body layer) is ported faithfully and
FULLY — including members with no caller today (ADR-8 corollary from the
bodyenhanced mission: "not ported yet" is never "unreachable"; this port
is porting every diagram type, so port it or STOP and report). Existing
engines keep their ASTs; each engine's migration onto the base is its own
follow-on mission. SI1's consumers are the two wirings (T11, T12) and the
Track SI-1 contract for the G-1..G-7 greenfield rebuilds.

## ADR-2: skin/ ports by consumed slice

**Status:** Accepted (2026-08-05)

Only the import closure the ported classes actually pull in — measured at
task time with a two-level trace, each pulled file ported faithfully and
completely. The whole-package port (8,225 unported lines) is rejected as
unbounded for this mission; the remainder is future missions' work. A
closure exceeding its task estimate by >2× is a STOP (README).

## ADR-3: Dedup adoption via the shared semantic hook

**Status:** Accepted (2026-08-05)

`CucaDiagram.addLink`/`containsSimilarLink` (net/atmp :896-909) and
`Link.sameConnections` (:462-470) are ported in full and unit-tested. The
three parsers (description swaps its inline `parse-state.ts:168-183`
version; class and state ADOPT) call a shared helper with exactly those
semantics over their own link lists. Instantiating real CucaDiagram inside
today's parsers is rejected: it risks divergence with their ASTs for no
measured payoff — that consumption arrives with the migration missions.

## ADR-4: BodyEnhanced1 replaces only the narrowed folder path

**Status:** Accepted (2026-08-05)

The folder/package title path un-narrows onto the faithful
`create2`→`BodyEnhanced1` route (decorate marginX=6,
BodyEnhancedAbstract:106-118), closing gujigi-63 and the leaf-sizing
narrowing. `EntityImageDescriptionTextBlock`'s scoped substitute STAYS for
description bodies — it is E2r/jar-verified; replacing it wholesale would
be refactor-while-porting against verified behavior. Its retirement is a
follow-on once BodyEnhanced1 parity is proven over the description corpus.

## ADR-5: The class member model is not rebased

**Status:** Accepted (2026-08-05)

`src/diagrams/class/class-member-*.ts` is jar-exact at 709/711.
`MethodsOrFieldsArea` is ported for the BodyEnhanced1 path and future
consumers; the class engine keeps its own model until a dedicated
migration mission ("faithful in different places", applied deliberately).

## Operational readiness (Phase 4, confirmed)

- **SLIs:** the ratchet battery (README) + NEW jar-pinned unit contract
  guards for the ported base (dedup semantics, Quark navigation,
  BodyEnhanced1 margins) — permanent tests, not synthetic.
- **Rollback:** Reversible — additive modules + two bounded wirings.
- **Failure modes:** pin widening at a wiring (STOP+diagnose); skin-slice
  closure blowout (STOP >2×); bundle growth (journaled, not gated).
- **Compatibility:** additive internal modules; base unexported from
  src/index until engines consume it.
