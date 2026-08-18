# Architecture decisions — state-declared-size-diagnosis

Approved 2026-08-18. Locked; a conflict is README stop 5, not a judgment call.

## ADR-1 — One record per fixture, uniform schema, rows table, pairingRisk
**Context.** T14 consumes the findings mechanically. **Decision.** Every
fixture gets one record on `findings/SCHEMA.md` (a `rows` table with
scope/axis/index/ours/jar/Δpx and a `pairingRisk` field); rows with distinct
causes split into `<slug>#a`/`<slug>#b`. **Consequences.** T14 pivots on
`sharedCauseWith` without re-reading prose. Rejected: one record per row.

## ADR-2 — `src/`, `tests/`, `oracle/`, `scripts/` are read-only
**Context.** Fixing while diagnosing is how fitted constants shipped; moving
the harness mid-mission moves the ruler. **Decision.** Probes live in
`scripts_scratch/` and are deleted before commit; harness improvements are
PROPOSED in METRIC-AUDIT; the T0 baseline must be reproduced byte-for-byte at
close-out. **Consequences.** Exit bar 4 is `git diff --name-only`-checkable.

## ADR-3 — Bucket labels are provenance, never partitions
**Context.** First-match classifiers merge unrelated bugs under one label
(S1L-e collected six). **Decision.** SYNTHESIS re-partitions all 94 fixtures
by TRUE mechanism; identical |Δ| across fixtures is one cause until refuted
with evidence. **Consequences.** The fix mission batches on real write-sets.

## ADR-4 — Inherited mechanisms are re-verified, not carried
**Context.** Two prior recorded mechanisms for one symptom were each
half-right (S1L precedent). **Decision.** The halted brief's finding
(transition label x folded into ink max-X, `layout-ink-extent.ts:391`),
`transition-label-ink`'s results, SI27 T1's `\t`/tabSize note, and
`state-composite-autonom.ts:196-205` (faithful `SvekResult#calculateDimension`)
are re-confirmed against current code and numbers before entering a record.

## ADR-5 — Findings estimate the fix; they never prototype it
**Decision.** `proposedWriteSet` + `sizeEstimate` per record; no patch.

## ADR-6 — An inherent divergence is PROPOSED, never declared
**Decision.** e.g. `skinparam tabSize` tab stops → proposed `DIVERGENCES.md`
entry flagged for maintainer ruling; the fixture stays in scope.

## ADR-7 — Sub-pixel rows are one task, threshold 0.05 px
**Context.** 53 rows / 27 fixtures differ by < 0.05 px (7.2e-5 … 0.005 px);
one formatting/conversion mechanism is expected. **Decision.** T11 owns them
all; the threshold is fixed and stated in SCHEMA. Rejected: folding them into
buckets (dilutes every bucket with the same cause).

## ADR-8 — Orchestrator commits; agents run no git
**Decision.** Branch `docs/state-declared-size-diagnosis`; one commit per
task via `git commit -- <paths>`; merge commit. Reason: SI27's bare-commit
incident swept other agents' staged files.

## ADR-9 — Model routing
**Decision.** T0–T13: `typescript-pro` (Sonnet). T14 SYNTHESIS: Opus
(`general-purpose`, effort high) with the brevity constraint ("return only the
structured result").
