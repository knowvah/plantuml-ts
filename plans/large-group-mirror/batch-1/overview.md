# Batch 1 — A2 mainframe, A3 projection cluster (parallel)

Two worktrees, write-sets disjoint. Each merge: stop-15 gate, D5 element
check. Close per [close-procedure.md](../close-procedure.md) (`b1`, prev `b0b`).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-mainframe-chrome-order.md) | every engine sizes the mainframe as `DiagramChromeFactory` does | typescript-pro | `src/index.ts` (chrome composition only), `src/core/annotations/chrome.ts`, `src/core/klimt/shape/big-frame.ts`, `src/core/assemble-svg.ts`, `src/core/document-margin*.ts` if one exists, `tests/oracle/svg-conformance/render-fixture-*.ts` (harness mirrors of index.ts — memory conformance-harness-mirrors-index-ts), the fragment dims export of each engine it must touch (named in its report), `tests/fixtures/lgm-T1a/`, its tests | b0 | [x] |
| [T1b](T1b-projection-cluster-clip.md) | `manageEntryExitPoint` before the lhead/ltail clip, per line, state + description | typescript-pro | `src/core/svek/Cluster.ts`, `src/core/svek/FrontierCalculator.ts`, `src/diagrams/state/state-transition-clip.ts`, `src/diagrams/state/state-composite-*.ts`, `src/diagrams/description/frontier-cluster-bbox.ts`, `src/diagrams/description/layout-dot-tree.ts`, the description lhead/ltail clip site (found in step 1; report the path before editing it), `tests/fixtures/lgm-T1b/`, its tests | b0 | [x] |

T1a must not edit `src/core/svek/**`; T1b must not edit `src/index.ts`,
`src/core/annotations/**` or any harness file.

| [T1c](T1c-svek-mainframe-raw.md) | state + description draw the framed SvekResult un-normalized (T1a remainder) | typescript-pro | see T1c file (disjoint from T1b) | T1a | [x] |
| [T1d](T1d-drawn-cluster-rect.md) | draw the border-point composite at the rect after L+2 mutations (T1b remainder) | typescript-pro | see T1d file (disjoint from T1c) | T1b | [x] |
| [T1e](T1e-embedded-svg-arm.md) | `{{ }}` slots sized by the jar SVG arm after oracle seam #3 (user-ordered) | typescript-pro | see T1e file | b92305594 | [ ] |
| [T1f](T1f-mirror-jar-crash.md) | mirror the jar deterministic-mode crash: error page where the jar crashes (user ruling) | typescript-pro | see T1f file | T1e | [ ] |
