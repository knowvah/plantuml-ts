# T1 — rufopi: `file` container fill from `<style>` (item 32)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout.

## Context
`unknown/rufopi-30-roro642` (2/0) has `skinparam useBetaStyle true` and a `<style>` with
`root { BackgroundColor #DFD }`, `document`, `title`, `caption`, and `file "file\n" as package { () … }`.
The jar fills both of the container's paths `#DFD`; ours draws `fill="none"`
(`svg/g[1]/g[2]/path[1..2]/@fill`). Layout is equal to native. Find the jar's style lookup for a
group/container background (the `StyleSignature` the jar builds for a `file` container, and how `root`
cascades into it). Start at `ClusterDecoration`, `USymbolFile`, and the `Cluster` background colour
selection; grep `src/main/java/net/`.

## Task
Write the diagnosis artifact first. Then fix it at the origin, with a failing unit test using values taken
from `test-results/dot-cache/unknown/rufopi-30-roro642/in.svg`.

## Write-set
`src/diagrams/description/{renderer-cluster.ts,renderer-cluster-note.ts,layout-package-style.ts}`,
`tests/unit/description/**`. A shared style resolver in `src/core/**` is outside the write-set (stop 1).

## Acceptance
- Given rufopi, when rendered, then both container `path/@fill` are `#DFD` and render-diff is 0/0.
- Given the unknown, component and usecase surveys, then there are no conformant losses, and every mover
  is reported with its mechanism.
- Given a container with no style background, then its fill is unchanged (existing tests pass).

**Observability:** N/A. **Rollback:** reversible.
