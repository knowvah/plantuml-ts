# Batch 3 — Retire the divergence; file what the pass exposed (serial)

Docs only, and the batch the mission is named for. The `DIVERGENCES.md` entry
is **deleted**, not softened: after T2 the port clips once and measures and
draws the same path, so the divergence does not exist to describe.

Porting `solve()`'s edge loop also makes two neighbouring absences visible.
They are **filed, not fixed** — same discipline SI31 used for its open rows.

**Amended 2026-08-19 after T2.** The batch also ADDS a divergence: T2's clip
uses the raw graphviz cluster box everywhere, and upstream adjusts that rect
via `FrontierCalculator` for composites with border-point children
(`SvekEdge.java:660-663`, `Cluster.java:410-430`, gated by
`ClusterDotString.java:101-105`) — reachable on 2 of the 41 movers. Retiring
one divergence while silently acquiring another is the failure mode this step
exists to prevent, so the `## State diagrams` heading stays and gains the new
entry.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Delete the old divergence; record the new border-point one; fix `overview.md`'s stale pin; file the gaps | typescript-pro (sonnet) | `DIVERGENCES.md`, `docs/architecture/overview.md`, `planning/next-missions.md`, `.agent-notes/si32-T3.md` | T2 | [x] |
