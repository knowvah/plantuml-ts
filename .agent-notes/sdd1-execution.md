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

## Observation: the sequence self arrow ignores the style LineStyle
- **Context**: sdd1 T2c, porting the message stroke (2026-10-20).
- **Finding**: a self arrow strokes via the deprecated `ArrowConfiguration#applyStroke(ug)` (`ArrowConfiguration.java:254-260`, called at `ComponentRoseSelfArrow.java:81`), so `<style> arrow { LineStyle 6-3 }` reaches flat and exo arrows but never a self loop. The polygon arrowhead stroke stays 1 whatever the arrow thickness (`AbstractCommonUGraphic.java:58`). Both were verified against the jar.
- **Impact**: do not "fix" either in the port; the jar does this.
- **Confidence**: High.

## Observation: the ratchet comparator does not default a missing stroke-width
- **Context**: sdd1 T2b, activation bars (2026-10-20).
- **Finding**: `compareSvg` treats an absent `stroke-width` as different from the jar's explicit `stroke-width:1`, so a jar-default stroke must be emitted explicitly. `ComponentRoseActiveLine` applies no `UStroke`, so the jar draws an activation at 1 whatever `activationBox { LineThickness }` says.
- **Impact**: when the jar emits a default value, the port must emit it too.
- **Confidence**: High (jar probe).

## Observation: npm-pack tests fail inside mkwt worktrees
- **Context**: sdd1 T2a ran the full suite inside `.claude/worktrees/sdd1-T2a` (2026-10-20).
- **Finding**: `sprite-package-files`, `stdlib-package-files` and `stdlib-packages` fail there on `npm pack` contents (`generated/`, LICENSE), because `mkwt.sh` symlinks `packages/*/generated` and `npm pack` does not follow those links the same way. On the main checkout all 29 pass.
- **Impact**: ignore those three files in a worktree full-suite run; trust the orchestrator's gate on the main checkout.
- **Confidence**: High.
