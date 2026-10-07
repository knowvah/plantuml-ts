# Batch 3 — drive round + D9 sweep (written at the b2 close)

Families from the b2 re-census, plus the D9 sweep task: retire `isActionSheetEligible`
(port the `UHorizontalLine` SVG driver, thread `[[url]]` hyperlink colour/underline into
the activity ISkinSimple, route non-LEFT alignment through the Sheet) and any other
staging gate or heuristic found. Close `b3`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3* | (written at the b2 close) | typescript-pro | disjoint | b2 | [ ] |
| T3-gates | D9 gate-retirement sweep | typescript-pro | `activity-creole-sheet.ts`, `activity-renderer-text.ts`, named core klimt/svg driver files (survey-guarded) | b2 | [ ] |
