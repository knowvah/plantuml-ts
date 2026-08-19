# Batch 6 — G20a declaration order (serial, LAST, revert-on-net-growth)

Our autonom pass pushes member nodes onto `acc.nodes` before the `[*]` pseudo
circle; the jar creates the init pseudo FIRST, because `[*] --> Idle` is the
composite's first transition line and `reallyCreateLeaf` fires on first
reference. `runPass` consumes that raw push order, and real graphviz's own
label force-search reacts to it — 0.750 px on `kejabo-83-vinu490`.

**Deliberately last, and deliberately reversible.** Up to **83 of 273** state
fixtures carry a composite plus a `[*]` transition, and the force-search is
not monotonic in declaration order, so they can move either way. Per D5: if
the corpus net is not shrink-only, revert the whole batch and file G20a as its
own mission. No per-fixture human ruling.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | Push pseudo nodes in jar creation order in both composite passes | general-purpose (opus) | `src/diagrams/state/state-composite-autonom.ts`, `src/diagrams/state/state-composite-concurrent.ts`, `src/diagrams/state/state-composite-pseudo.ts` (only if the ordering helper itself must change), their unit tests | T5 | [ ] |
