# Batch 4 — Entrypoint/exitpoint WithLabel family (C9 item 4)

The 20-fixture entrypoint/exitpoint family (includes
`pesita-10-dene726`) is excluded from real cluster geometry by the
`hasBorderPointChildren` conjunct, because the port-block sizing for
border points (jar's `portRanksLabelOnEe`/WithLabel branch) was never
implemented (G5 C3's unresolved item). Severity is proven: pesita's
`AA` collapses to a 36×36 bbox.

Hard boundary (D5 + README stop cond. 8): this is a JAR PORT. Three
geometric approximations already failed (G4 S13); a fourth attempt is
forbidden. If the jar path can't be isolated, the batch stops.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T8 | Derive jar's WithLabel/portRanksLabelOnEe path (evidence doc) | debugger | plans/g6-cluster-geometry/batch-4/withlabel-derivation.md | — | [x] (2 rounds; spec still incomplete — see journal) |
| T9 | Port the sizing; widen hasBorderPointChildren gate | typescript-pro | corrected: graph-layout-build.ts, state-composite-geo.ts, state-composite-frontier.ts, cluster gate | T8 | STOPPED — 2 attempts, all predictions missed, fully reverted; FrontierCalculator port kept unwired (60fe88a) |
| T10 | Family sweep (20 fixtures) + mission close | general-purpose | goldens, size-backlog.json, plan README | T9 | not run (T9 stopped); close performed by orchestrator |
