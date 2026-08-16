# Batch 6 — gated fixes for M3 and M4

Both tasks are **gated on a Batch 1 diagnosis** and neither may run without one.
Their write-sets are unknown at planning time — that is deliberate, not an
oversight: a fix whose write-set could be declared in advance would not have
needed a diagnosis task.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T11 | M3 fix: tail/head swap | `typescript-pro` | per T3's mechanism (suspected `src/diagrams/class/class-edge-geo.ts`) | T3 | [ ] |
| T12 | M4 fix: single-line width deltas | `typescript-pro` | per T4's mechanism | T4 | [ ] |

## Gates on running at all

- **T11 does not run** if `.agent-notes/m3-tail-head-swap.md` records STOP —
  i.e. the root cause is in edge **emission order**. D5 is locked: that belongs
  to the edge-draw-order mission. Record the hand-off and move on.
- **T12 does not run** if `.agent-notes/m4-single-line-width.md` leaves the
  mechanism unestablished. The residue is then **named, not fitted** — four
  slugs stay in the backlog with the ruled-out list attached, which is a
  legitimate outcome against an exit bar of ≤ 12.

## Write-set collision

Declare each task's write-set from its diagnosis note **before** starting
either. If they overlap, **run them sequentially** — an unknown write-set is not
a licence to guess at ownership, and one-writer-per-file is not negotiable.

**Batch exit:** for each task, either the fix landed with its slugs cleared and
no fixture risen, or the skip is recorded with the reason and the owning mission
named.
