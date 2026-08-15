# Batch 1 — baseline, family, and the walk

No rendered output changes in this batch.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Re-pin the harness baseline; reconcile the 5-vs-6 family count | typescript-pro | `.agent-notes/usymbol-ink-family.md` | — | [ ] |
| T2 | A symbol ink walk, modelled on `edgeExtremityInk` | typescript-pro | `src/diagrams/class/class-ink-symbol.ts` (new) + test | — | [ ] |

Parallel: disjoint write-sets, neither consumes the other in-batch.

## Batch exit bar

1. T1 reports current `shape-match-report.ts` numbers (doc-size-exact and
   matched shapes) as the baseline every later task is measured against —
   **measured, not quoted from the last mission's close-out.**
2. T1 states which fixtures are in the family and why the count is 5 or 6.
3. T2's walk returns an extent for an `actor` symbol that differs from
   `addRectInk`'s `(x-1, y-1)` corner by the measured 1.5 — proving it sees
   the drawn shapes. If it does not reproduce 1.5, STOP: either the walk or
   the premise is wrong, and which one matters.
4. Nothing consumes the walk yet; rendered output byte-identical.
5. All four gates green; class DOT-parity 712/712; class/object pins hold.
