# Batch 2 — bracket shorthand; `url of`; Family A geo + render

Starts after the batch-1 merge (T1a's `DescriptiveNode.url` and `makeNode` decorations; T3 owns
`layout-helpers-types.ts` edge part, now merged).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1b | Bracket shorthand `[X] <<s>> [[url]]`, `() I [[url]]` | typescript-pro | `element-grammar.ts`, `command-table-shorthand.ts` | T1a | [x] |
| T1c | `url of|for X is [[…]]` directive | typescript-pro | `command-table-directives.ts` | T1a | [x] |
| T4 | Node URL into the geo; entity `<a>` at render | typescript-pro | `layout-types.ts`, `layout-helpers.ts`, `layout-helpers-types.ts` (node part), `layout-dot-tree.ts`, `renderer-entity.ts` | T1a, T3 | [x] |

Disjoint write-sets; all three run in parallel off the post-batch-1 mission branch.
Close: [../close-procedure.md](../close-procedure.md).
