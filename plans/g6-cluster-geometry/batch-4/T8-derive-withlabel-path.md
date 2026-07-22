# T8 — Derive jar's WithLabel / portRanksLabelOnEe border-point path

## Prior observations

- G5 C3 named and left unresolved: the entrypoint/exitpoint family's
  port-block sizing — jar's `portRanksLabelOnEe`/WithLabel branch —
  including the rank-chain shape it induces in the emitted DOT.
- Severity (G5 C8, verified): `pesita-10-dene726`'s `AA` carries a
  direct border-point child (`aa_ok_ex <<exitpoint>>`); excluded via
  `hasBorderPointChildren`, its bbox collapses to 36×36 and cascades
  into `nasreq_auth`'s outer bbox.
- G4 S13's history: three geometric approximations of adjacent
  behavior all failed differently. That is why D5 mandates a port.

## Context

plantuml-ts state clusters. Jar source:
`~/git/plantuml/src/main/java/net/` — grep the WHOLE `net/` tree for
`portRanksLabelOnEe`, `WithLabel`, entry/exit point entity images
(likely `svek/` + `svek/image/EntityImageStateBorder*` + `net/atmp/`
call sites). Never scope to the plantuml subtree only.

## Task

1. Locate and read jar's full border-point code path: how an
   entry/exit point child is sized, how it attaches to the cluster
   border (port), what rank-chain/DOT shape the WithLabel branch
   emits, and how the parent cluster's own geometry incorporates it.
2. Map each jar symbol to its port location in this repo (existing
   file or new function, preserving upstream names).
3. Write `batch-4/withlabel-derivation.md`: the call graph with
   file:line citations, the sizing computation term by term, the DOT
   shape to emit, the gate change T9 may make, and per-fixture
   predictions for pesita's `AA` (exact expected bbox) plus ≥2 more
   family fixtures.
4. Explicitly state what was ruled out (e.g. which branches of the
   jar path do NOT apply to this family).

## Write-set

`plans/g6-cluster-geometry/batch-4/withlabel-derivation.md` only.
Probes deleted.

## Read-set

G5 ledger §C3 (the original queue item) and §C8 (pesita evidence);
`src/diagrams/state/state-composite-cluster.ts:273-300`
(hasBorderPointChildren); `src/diagrams/state/state-dot-graph.ts`
(current DOT emission, symbol overview via Serena);
jar sources per Context.

## Interface contract (consumed by T9)

Doc must give: sizing formula(s) with jar citations; the DOT
rank-chain shape spec; the exact `titleTableEligible` change; expected
bboxes for pesita's `AA` + ≥2 family fixtures.

## Acceptance criteria

- Given the doc, when T9 implements, then no design decision remains
  open (every term cited, every shape specified).
- Given pesita's oracle SVG, when `AA`'s real bbox is box-extracted,
  then it matches the doc's prediction.
- Given the doc, then the ruled-out list is non-empty (diagnosis.md
  bar for non-trivial work).

## Quality bar

No production changes; gates untouched. If the path cannot be
isolated with citations within budget: journal + STOP (README stop
cond. 8) — do NOT sketch an approximation as a fallback.

## Boundaries

Jar reading only; no formula invention (D5); no git mutations.

## Observability / Rollback

N/A — documentation only.
