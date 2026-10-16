# T3 — xenusu: stereotyped arrow skinparams and bold links (item 33)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout.

## Context
`component/xenusu-76-sabi405` (7/2):
```
skinparam arrow { Color green … }
skinparam arrow<<bluebold>> { Color blue;line.Bold() }
skinparam arrow<<bold>> { Color ;line.Bold() }
a -->> b <<bold>> : "stereotype bold"
a -->> b <<bluebold>> : "stereotype bluebold"
a -[#blue,bold]-> b : "line bluebold"
```
The jar draws the `<<bold>>` link at stroke-width 2, and the `<<bluebold>>` link at `#00F` with width 2.
Ours draws width 1 and `#008000`. The svg width is 354 vs our 353: diagnose whether that is the bold
stroke's ink extent or something else, and do not assume. Find the jar's `Color …;line.Bold()` skinparam
value parsing (the `;line.` suffix) and the stereotype-scoped arrow lookup.

## Task
Write the diagnosis artifact(s), then fix with tests built from the jar SVG's values.

## Write-set
`src/diagrams/description/{link-edge-attrs.ts,renderer-edge.ts,link-grammar.ts}`, `tests/unit/description/**`.
If the `;line.Bold()` parsing lives in a shared skinparam parser in `src/core/**`, that is stop 1: report it.

## Acceptance
- Given xenusu, when rendered, then the stroke colours and widths match, svg width is 354, and render-diff
  is 0/0.
- Given links without a stereotype or a bold decoration, then they are unchanged (existing tests pass).
- Given the component, usecase and unknown surveys, then there are no losses.

**Observability:** N/A. **Rollback:** reversible.
