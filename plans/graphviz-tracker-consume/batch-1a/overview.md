# Batch 1a — description lane: styles, arrows, draw order (items 32, 33, 30)

Sequential in the mission checkout, because the tasks share renderer files. Each task is followed by
[close-procedure A](../close-procedure.md). This batch runs in parallel with [1s](../batch-1s/overview.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | rufopi: cluster fill from `<style>` | typescript-pro | `description/renderer-cluster*.ts`, `layout-package-style.ts`, tests | T0 | [x] |
| T2 | zosuje: `<style>` group/link colours, font style | typescript-pro | `renderer-cluster*.ts`, `renderer-color-override.ts`, `link-edge-attrs.ts`, tests | T1 | [x] partial (13/0; core residual → T2b) |
| T2b | zosuje: component `<style>` FontStyle + description arrow cascade (src/core, D5 amendment) | typescript-pro | `src/core/style-map-element.ts`, `style-cascade-class*.ts`, `theme*.ts`, `usymbol-resolve.ts`, `renderer-edge.ts`, tests | T2 | [x] |
| T3 | xenusu: `skinparam arrow<<stereo>>`, `line.Bold()`, `[#c,bold]` | typescript-pro | `link-edge-attrs.ts`, `renderer-edge.ts`, tests | T2 | [x] partial (0/2; width → T3b) |
| T3b | xenusu: edge label TextBlockMarged UEmpty (svg width +1) | typescript-pro | `src/core/svek/SvekEdge.ts`, tests | T3 | [x] |
| T4 | repoge: note-in-component draw order, labels | typescript-pro | `renderer-draw-sequence.ts`, `renderer-cluster-note.ts`, `renderer-note*.ts`, tests | T3 | [ ] |

Ticks happen at the close: 32 after T2 (if rufopi and zosuje are both conformant), 33 after T3, 30 after T4.
