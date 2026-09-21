# Batch 2 — B2 link render-only

Sequential: T5 (AST/grammar fields) → T6 (edge geometry, needs the widened
`Relationship` from T5) → T7 (rendering, needs `EdgeGeo` from T6). No task
in this batch moves DOT node/cluster layout — B2 is reservation-preserving
render-only work per D2 (`decisions.md`), so the batch close expects the
710/711 DOT-equal fraction to hold and no currently-conformant fixture to
move except by a named mechanism (T6's dashed-carry AC pins this down).

T6 runs on Opus: it is the geometry-risk task in this batch (A5 M5's
direction-flip trigger is only MEDIUM-LOW confidence and needs
instrumentation before a fix, and M9/M10 add new label anchors).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Relationship AST/grammar: url, dashedBody, hidden, linkConstraint text, middleDecor, widened decors | typescript-pro (sonnet) | `class-relationship-parser.ts`, `class-relationship-ast.ts`, `class-arrow-grammar.ts`, `class-arrow-decor-map.ts`, tests | — | [ ] |
| T6 | Edge geometry: direction fix, visibility-icon anchor, note-box fields, constraint position, quantifier split | typescript-pro (opus) | `class-edge-geo.ts`, `class-geo-types.ts`, `class-edge-label-anchor.ts`, tests | T5 | [ ] |
| T7 | Edge rendering: visibility icon, url wrap, note body, new extremity decors, constraint line+text, quantifier lines, hidden-link skip, `getMiddle` arc | typescript-pro (sonnet) | `renderer-edge.ts`, `renderer-arrowhead.ts`, `src/core/klimt/shape/DotPath.ts`, tests | T6 | [ ] |

Specs: [`T5-relationship-ast.md`](T5-relationship-ast.md),
[`T6-edge-geometry.md`](T6-edge-geometry.md),
[`T7-edge-rendering.md`](T7-edge-rendering.md).
Batch close: [`close.md`](close.md).
