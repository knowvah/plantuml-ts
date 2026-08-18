# T13 — METRIC-AUDIT (sorted-pairing mis-attribution)

## Context
As T1–T10; ADR-2 forbids editing the harness. The harness pairs scopes by
index and nodes by SORTED value per axis
(`scripts/measure-composite-declared-size.ts:20-40` doc). Precedent:
`plans/s1l-tail-diagnosis/findings/METRIC-AUDIT.md`.

## Task
1. For every mismatched fixture in `findings/PARTITION.md`, decide `pairingRisk`
   (none/possible/likely): are two nodes in that scope within |Δ| of each
   other on that axis such that sorted pairing could swap them? Use a
   `scripts_scratch/` probe that dumps both sides' full sorted arrays per
   scope/axis (deleted before commit).
2. Where `likely`, give the alternative pairing and the delta it would show.
3. Propose (do NOT implement) an id-aware pairing: how our node ids and the
   jar's `shNNNN` could be matched (label text? insertion order after
   filtering `__init_*`? — cite `.agent-notes/class-ink-shared-offset-groups.md`
   item (c)). Estimate its size.
4. Cross-check the harness's `dirtyFixtures`/`unmatchedFixtures` counters
   against your own tally.

## Write-set
`findings/METRIC-AUDIT.md` ONLY.

## Acceptance
- Given PARTITION's mismatched fixtures, then each has a `pairingRisk` line with a one-line reason.
- Given the audit, then a proposed id-aware pairing with size estimate exists and no harness file changed.

## Observability / Rollback
N/A. Reversible.
