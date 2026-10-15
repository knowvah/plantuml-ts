# T9 — xagonu self-loop xlabel TABLEs

Prepend [../task-preamble.md](../task-preamble.md). Worktree `codd/T9`. D8 applies in full.

## Context
- unknown/xagonu-36-sudi116 nests like the jar (12 clusters), but its bb x is 449.70 against the
  jar's 443.70.
- The jar's svek DOT has two self-loop edges with xlabel TABLEs that ours lacks: `sh0050->sh0050`
  139×38 (`mapp --> mapp`) and `zaent0019->zaent0019` 142×25 (a group self-loop). dsw journal row 20
  marked this "suspected, not measured".
- TRACKER #16 (the edge xlabel position) has its consumer landed. Check T0b's ledger row for #16
  first.

## Task
1. Measure before acting. Diff the jar `svek-1.dot` edges for xagonu against our builder dump: list
   every edge attribute that differs.
2. Read the Java that emits a self-loop label as `xlabel` (`svek/SvekEdge.java`,
   `DotStringFactory`). Quote the self-loop branch.
3. Run native `dot -Tdot` on the jar DOT and on our DOT with the xlabels added by hand in a scratch
   file, to confirm that the xlabels move the bb to 443.70 before you write code. If they do not,
   stop and report the actual mechanism.
4. Mirror the emission in `link-edge-attrs.ts` / `buildDotEdges`.

## Write-set
- `src/diagrams/description/link-edge-attrs.ts`, `layout-dot-tree.ts` (edge emission only)
- core edge emission falls under D5, with the guards
- `tests/unit/description/**`

## Acceptance
- Given xagonu, then layoutParity is `equal`, or `firstDiff` is past the bb with the residual named.
- Given the layout-parity ratchet (469), then it stays green, and every new layout-equal row is
  reported for pinning at the close.

**Observability:** N/A. **Rollback:** Reversible.
