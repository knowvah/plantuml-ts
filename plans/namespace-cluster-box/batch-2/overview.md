# Batch 2 — emit the DOT jar emits

One task. It changes the graph handed to `@knowvah/dot-engine`, so layouts
move for all 126 cluster-bearing fixtures.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4](T4-emit-wrappers-and-title-table.md) | Give class/object clusters their protection wrappers and HTML title table | typescript-pro | `src/diagrams/class/class-dot-graph.ts`, `tests/oracle/wrapper-parity.test.ts` | T2, T3 | [x] |

## Expect the measurement to DIP here

This is the one place in the mission where the headline numbers may fall and
that is not a stop condition. Layouts shift by the new wrapper margins while
`buildNamespaceGeos` still applies the old member-bbox padding — the two
halves only agree again after T5.

Record the dipped numbers in the decision journal so T5's improvement is
measured against them AND against the batch-1 baseline. If they do NOT dip,
that is interesting and worth a journal entry too: it would mean the padding
approximation happened to absorb the change.

## Batch exit criteria

- All four quality gates green.
- Class DOT-parity ratchet still 712/712 conformant. This gate is blind to
  the wrappers themselves, so it passing is necessary, not sufficient.
- `tests/oracle/wrapper-parity.test.ts` now covers class and passes.
- `git diff --name-only` matches T4's write-set only.
