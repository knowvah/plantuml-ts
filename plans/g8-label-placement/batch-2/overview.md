# Batch 2 — Atomic implementation

The coupled set lands as ONE commit (D3): placement switch + T18
FIXEDSIZE/heights + G5/C1 13pt width + T20b ink walk + tests. G7
proved twice that partial landings regress the backlog transiently.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T2 | Placement switch + reverted stack + tests; harness-gated | typescript-pro | see task file | T1 | [ ] |

Hard bar: zero backlog widenings, 14-set within tolerance, 57 pins
byte-identical — else full revert + STOP (stop cond. 6).

**T2 STOPPED + reverted (2026-07-23).** Placement code verified correct
(incl. a `\n`-split defect fix that resolved pesita); 4 fixtures then
widen through `state-composite-sizing.ts#measureAutonomWrapper` (the
outer wrapper formula, out of write-set — the pre-existing "S5" gap).
Awaiting scope decision. See the decision-journal T2 STOP row.
