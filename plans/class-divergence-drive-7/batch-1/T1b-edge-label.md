# T1b: edge label — lone-sprite offset and creole edge labels

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
1. **kexaba (`edge-label-not-creole`, cdd6 rows 50, 63) — D5, first step before any
   edit:** run `dot -Tdot` on the cached `test-results/dot-cache/unknown/kexaba-26-kobu577/svek-1.dot`
   and on our DOT for the same fixture (capture ours through the layout-input
   observer, cdd6 T0d's `our-dot.mts` under `scratchpad/T0d/kexaba` is the
   precedent); record both `lp` values for the label edge in your report. Row 50
   measured them equal (`lp="68,127"`) — if they still agree, the Δ(7,7) is
   draw-side: a lone `<$sprite>` label is drawn as `<image>` at the label box origin
   + `marginLabel` (1,1) where the jar draws it at +8,+8 (image 59.5,107 vs jar
   66.5,114; box 19x14). Read `SvekEdge.java:745-747,808-814` and the creole
   `TextBlock` the label becomes (`AtomSprite`), quote the offset's origin, and
   port it in `renderer-edge-label.ts:141-156` (`renderEdgeLabelImage`, the
   `labelImage` arm). If `lp` differs: stop, report `open -> dot-engine` with the
   two DOT excerpts (the orchestrator files the TRACKER line).
2. **xuloxo (`class-head-arrow-triangle`, cdd6 row 67) — edge-label half.** Edge
   labels are measured/anchored as plain text (`class-edge-label-anchor.ts:85-92`)
   where the jar builds them as creole (`SvekEdge.java:298-299`). Port the creole
   path for the measure + anchor (`class-edge-label-measure.ts` is the existing
   creole-aware measurer, cdd6 T2d's `stripCreoleMarkup` precedent). xuloxo's leaf
   style is T1c's; report per-atom diffs on edge labels only.

## Rows
- `unknown/kexaba-26-kobu577` (0/2: image x/y Δ7,7)
- `unknown/xuloxo-85-vibu502` (edge-label share of 44/35; the rest is T1c's)

## Write-set
- `src/diagrams/class/renderer-edge-label.ts`
- `src/diagrams/class/class-edge-label-anchor.ts`
- `src/diagrams/class/class-edge-label-measure.ts`
- their unit tests under `tests/unit/class/`
- NOT `class/renderer-edge.ts` (T1a's) — a fix that needs it is a stop 1.

## Read-set
`decisions.md#D5`; cdd6 journal rows 44, 45, 50, 63; memory
`dot-engine-blame-needs-real-dot`; `SvekEdge.java:290-330,740-750,800-820`;
`AtomSprite.java`.

## Interface contracts
none.

## Acceptance
- Given kexaba's two DOTs, when `dot -Tdot` runs on both, then both `lp` values are
  in the report before any edit.
- Given a lone-sprite edge label and equal `lp`, when drawn, then the image sits at
  label-box origin +8,+8 (`SvekEdge.java:808-814`); kexaba 0/2 → 0/0.
- Given xuloxo's creole edge labels, when measured and anchored, then they go through
  the creole path and their per-atom diffs → 0.
- Given the class golden ratchet and DOT parity, then green.

## Architecture decisions (locked)
D5, D11. dot-engine is off limits.
