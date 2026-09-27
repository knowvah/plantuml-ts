# T11 — issue 25 consumer half: skip an unplaced edge label

**Context.**
- dot-engine 1.6.1 `getLayout()` now reports a centre label as ABSENT when
  graphviz leaves it unplaced (`ED_label(e)->set` false), the same gate it
  applies to tail/head/xlabel (TRACKER 25, dot-engine `5932a793`).
- The jar reads `-Tsvg`, and an unplaced label emits no `<text>`, so it
  draws nothing (`docs/graphviz-issues/25-edge-label-published-when-unplaced.md`).
- Fixture `class/delasa-80-jusu462` (3 labels). Anchor:
  `src/diagrams/class/class-edge-geo.ts:205` already returns on
  `labelX === undefined`.

**Task.** TDD.
1. Trace how the layout read (`src/core/graph-layout*.ts`, including T-D3's
   `graph-layout-svek-read.ts`) maps `getLayout()`'s edge label into
   `labelX/labelY`.
2. Make an absent label produce `undefined`, never a sentinel position.
3. Quote the jar path that skips the label: `SvekEdge` label placement
   from the svg text.

**Write-set:** `src/core/graph-layout*.ts` (the read only),
`src/diagrams/class/class-edge-geo.ts` if needed, tests.
**Depends on:** T0d (1.6.1 pinned).

**Acceptance.**
- Given delasa, when surveyed, then its 3 unplaced labels draw no `<text>`,
  and the verdict is conformant or carries a stated residual.
- Given every engine, then no conformant loss.

**Observability** N/A. **Rollback** Reversible.
