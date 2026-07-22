# Batch 3 — Multi-line / action-text / stereotype cluster titles (C9 item 3)

Replace the single-line-only `CLUSTER_TITLE_TABLE_HEIGHT = 3`
calibration with jar's real title-table height computation, then relax
the `titleTableEligible` `lineCount === 1` gate so multi-line,
action-text, and stereotype titles take the real-cluster-geometry path.

Known data points: jar's real HEIGHT for title+action-zone
`Track_FSM.Run` (bajelo) is 42; C5's multi-line starting gap was 47.
NOTE: bajelo itself stays out of reach (its OTHER blocker is the
out-of-scope `insideAutonomPass` gate) — it is a formula data point
here, not a target fixture.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T6 | Derive jar's title-table height formula (evidence doc) | debugger | plans/g6-cluster-geometry/batch-3/title-height-derivation.md | — | [ ] |
| T7 | Implement formula; relax lineCount gate; re-measure | typescript-pro | state-composite-cluster.ts, unit tests, size-backlog.json | T6 | [ ] |
