# Batch 2 — Byte-exact zero-diff pins (C9 item 1)

With batch 1's height fix landed, the 4 target fixtures
(`gojuja-90-pune699`, `decede-10-buvu414`, `cakaxu-97-nexe753`,
`fevida-60-kope208`) are blocked from byte-exact pins only by two
already-named gaps: the `class="entity"` vs jar `class="cluster"`
renderer convention (cosmetic, classification verified correct) and
decede's `<style>stateDiagram{}</style>` cascade (G5 C5 item 4).

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | Emit `class="cluster"` for 'cluster'-classified composites | typescript-pro | renderer-group.ts, renderer.ts (amended — journaled, flagged), unit tests | — | [x] |
| T4 | decede `<style>stateDiagram{}</style>` cascade | typescript-pro | skinparam.ts, state-render-colors.ts, theme.ts + style-map-theme.ts + renderer-box.ts + renderer-composite-box.ts (amended — journaled, flagged), unit tests | — | [x] |
| T5 | Pin sweep: byte-compare, pin zero-diffs, shrink backlog | general-purpose | oracle/goldens/svg-state/* (ratchet + 5 new pins), size-backlog.json (unchanged) | T2, T3, T4 | [x] |

T3 ∥ T4 (disjoint write-sets). T5 strictly after both plus batch 1.
