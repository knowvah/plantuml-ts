# Batch 1b — description lane: xagonu (item 29)

Sequential after batch 1a, in the mission checkout. [Close-procedure A](../close-procedure.md) runs after each task.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5a | `\r` link-label prefix; link `<g>` childCount 3 vs 4 | typescript-pro | `link-grammar*.ts`, `renderer-edge.ts`, tests | T4 | [x] |
| T5a2 | Edge label line alignment (`defaultTextAlignment`, `\r`/`\l`) in `SvekEdge.ts` | typescript-pro | `src/core/svek/SvekEdge.ts`, `renderer-edge.ts`, tests | T5a | [x] |
| T5b | Edge draw order (`lnk39` vs `lnk37`) | typescript-pro | `renderer-draw-sequence.ts`, `layout-geo-post.ts`, tests | T5a | [ ] |

Tick 29 after T5b if xagonu is conformant.
