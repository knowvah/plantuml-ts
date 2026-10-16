# T5 — group URL (Family A, D6)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `dur/T5`.

## Context
`svek/Cluster.java:339-341`: `if (url != null) ug.startUrl(url)` around the group's drawing (and the matching
`closeUrl`; read `drawU` from `:298` for exactly what the anchor wraps, relative to the kermor notes
`:302-307`, the frontier and the `ClusterDecoration`). No corpus fixture has a group url (D6), so author
them. T4 put `url` on container geo nodes. The draw path is `renderer-cluster.ts` (the `Cluster` /
`NotedCluster` port) and `renderer-draw-sequence.ts:111`.

## Task
1. Author `tests/fixtures/description-url/{package-url,rectangle-url,frame-url,nested-url}.puml` (one shape per
   file; include a tooltip `{…}` and a nested group) and render oracles with `scripts/oracle-render.sh
   /private/tmp/claude-501/dur-T5/oracle <puml>`; commit the `.puml` + jar `.svg` pairs.
2. Mirror the anchor placement exactly (what is inside the `<a>`, and where it opens/closes).

## Write-set
`src/diagrams/description/renderer-cluster.ts`, `renderer-draw-sequence.ts`, `tests/fixtures/description-url/**`,
`tests/unit/description/**`.

## Acceptance
- Given each authored fixture, when rendered, then compareSvg against its jar oracle has 0 `<a>` diffs
  (report full render-diff).
- Given a group without a url, then output is byte-identical (unit test).
- Given component/usecase/unknown surveys before → after, then 0 losses.

**Observability:** N/A. **Rollback:** Reversible.
