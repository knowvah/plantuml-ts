# T1b — Snake text-block label placement (D1)

Agent: typescript-pro, worktree `add3-T1b`. Rules: [../common-rules.md](../common-rules.md).

## Task
1. `ActivityEdgeGeo.labelAlign?: { vertical?: 'BOTTOM' | 'CENTER'; horizontal?: 'LEFT' | 'CENTER' | 'RIGHT' }`,
   set at every push site from T1a's table (cite the Java `withLabel` line).
2. NEW `layout/snake-text-position.ts`: pure port of `getTextBlockPosition`
   (`Snake.java:244-267`) incl. `Worm.getDirectionsCode`, `getMinX/MaxY`,
   `getFirst/getLast`, over PRE-compression points; carry the anchor through
   compression like `emphasizeAt` (`compress-geometry.ts#withEmphasizeAnchor`).
3. `renderer.ts#renderEdgeLabel`: draw at the anchor; delete the unsourced pill
   only if T1a showed the jar draws none (else port what it draws).
4. Label boxes in the canvas ink (`canvas-origin*.ts`), per `Snake.getMaxX`.
5. Unit tests per Java branch; T1a's label cases reproduce the jar.

## Write-set
`layout/snake-text-position.ts` (new), `renderer.ts`, `activity-geometry.types.ts`,
`layout/compress/compress-geometry.ts`, `layout/canvas-origin*.ts`, the
`withLabel` push sites in `layout/walk-*.ts` / `layout/swimlane-*.ts`
(labelAlign field only), their tests.

## Acceptance
- boxefe-81-situ725 backward labels and every T1a case: label x/y = jar.
- 224 pinned goldens byte-equal; 0 unexplained risers (report every mover).
Observability: N/A. Rollback: Reversible.
