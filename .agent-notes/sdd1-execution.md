## Observation: Style#mergeNestedChildOver is not ported
- **Context**: sdd1 T1a, porting the sequence style signatures (2026-10-19).
- **Finding**: `src/core/style/Style.ts:117-120` lists `mergeNestedChildOver`,
  `getSymbolContext`, `eventuallyOverride(UStroke)` and `getStroke(Colors)` as
  not ported. Upstream sequence reads `mergeNestedChildOver` for the
  non-partition group header (`Grouping.java:83-96`) and every reference
  header (`Reference.java:85-97`), added by upstream commit 8dd75d2e4d1 (#2679).
- **Impact**: the sequence group/reference header styles cannot be faithful
  without an edit under `src/core/style/` (sdd1 stop 8). This halted sdd1.
- **Confidence**: High (read both files).

## Observation: external load can stall an all-engine survey for hours
- **Context**: sdd1 b0 all-engine survey, 2026-10-19 18:15–23:03.
- **Finding**: Proton Drive, fileproviderd, Spotlight and foreign node/python
  processes drove the load average to ~58. `chain.sh` waited for load < 12, and
  the engines surveyed while the load was elevated recorded timeouts (state 9,
  unknown 9, usecase 12). Re-running those three at load < 8 cleared every
  timeout.
- **Impact**: before trusting any timeout in a survey, re-run that engine at low load.
- **Confidence**: High.
