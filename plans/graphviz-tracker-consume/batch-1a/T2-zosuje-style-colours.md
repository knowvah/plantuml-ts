# T2 — zosuje: `<style>` group and link colours, component font style (item 32)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout. Depends on T1 (shared cluster file).

## Context
`component/zosuje-43-zebi775` (17/0) uses `<style>` blocks for `group` (BackgroundColor bisque,
LineColor Red, FontColor White, FontSize 32) and `component` (FontStyle italic, …), plus arrow colours
`#00BFFF`. All the diffs are attributes:
- group paths: fill `#FFE4C4`, stroke `#F00` (ours: none / `#181818`)
- `text/@font-style italic` on `g[5]`
- link paths and polygons: stroke/fill `#00BFFF` (ours `#181818`)

Read the full `in.puml` for the arrow style block, then the jar's style signatures for `group` and `arrow`
in the description path.

## Task
Write one diagnosis artifact per mechanism; expect up to three (group colours, component font style, link
colour). Fix each at its origin, with tests.

## Write-set
`src/diagrams/description/{renderer-cluster.ts,renderer-color-override.ts,link-edge-attrs.ts,renderer-edge.ts,renderer-entity.ts}`,
`tests/unit/description/**`.

## Acceptance
- Given zosuje, when rendered, then all 17 structural diffs clear (0/0).
- Given rufopi, then it stays 0/0.
- Given the component, usecase and unknown surveys, then there are no conformant losses and every mover
  has a mechanism.

**Observability:** N/A. **Rollback:** reversible.
