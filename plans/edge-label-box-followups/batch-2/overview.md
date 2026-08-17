# Batch 2 — description M2 and the class multi-line branch

Two tasks, parallel, disjoint write-sets. Both move geometry; the no-rise
census bar is live. T3 is the mission's largest task and crosses parse →
layout → render in one engine; T4 is confined to the class label-measurement
branch and its glyph draw.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | Description note-on-link merged box (D1, D2, D5) | `typescript-pro` (opus) | `src/diagrams/description/{ast,note-grammar,parse-state,link-edge-attrs,layout,renderer-edge}.ts`, `src/diagrams/description/link-note-box.ts` (new), `src/core/edge-label-box.ts` (`roseNoteDim` only), `tests/unit/description/{parser,link-edge-attrs,layout,renderer}.test.ts`, `tests/unit/core/edge-label-box.test.ts`, `oracle/goldens/description/label-size-backlog.json` | T1 (same core file) | [ ] |
| T4 | Class multi-line branch: creole strip + per-line magic arrows (D6) | `typescript-pro` | `src/diagrams/class/{class-layout-edge-labels,class-magic-arrow,class-edge-geo}.ts`, existing `tests/unit/class/*.test.ts`, `oracle/goldens/class/label-size-backlog.json` | T1 (same backlog file) | [ ] |

**Write-set note:** T3 re-opens `src/core/edge-label-box.ts` after T1 —
sequential, not concurrent. T3 must not touch `computeQuantifierBox`.

**Batch exit:** all gates; description DOT EQUAL ≥ 257/263 (component) and
≥ 89/93 (usecase); class ≥ 700; no fixture rises; class SVG ratchet holds or
moves toward jar with the measurement journalled.
