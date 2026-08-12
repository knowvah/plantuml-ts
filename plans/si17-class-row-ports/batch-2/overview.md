# Batch 2 — governed remediation loop

**Conditional.** Runs only if [T3](../batch-1/T3-shrink-the-backlog.md)
leaves residual slugs. If the backlog emptied, skip to
[batch-3](../batch-3/overview.md) and mark this batch `n/a`.

## Protocol — one mechanism per iteration

Modelled on `plans/object-close/batch-2`, which worked:

1. Pick the residual item with the largest measured reach.
2. **Diagnose to a `file:line` before writing code.** A predicted fixture
   list is a hypothesis until the gate confirms it; every count is a floor.
3. Land the fix, delete the pins it earned, in one commit.
4. Re-measure: class DOT + the four sibling DOT gates + the three censuses.
5. Journal the iteration — including reach that did NOT materialize.

| ID | Mechanism | Reach | Depends On | Done |
|---|---|---|---|---|
| B0…Bn | filled in by T3 | — | T3 | [ ] |

## The one residue already predicted

`bicabi-42-coto932` contains `MainWindow <|-- Gtk::Window`. That may be an
entity **named** `Gtk::Window` rather than port `Window` on entity `Gtk` —
a parse-level question, not a port-emission one. The oracle already tells
you which: its DOT anchors edges to `sh0007:pc89686…` and `sh0007:pcd2581…`,
which means upstream **did** read them as ports. Confirm what our parser
produces before assuming the port path is at fault.

## Batch exit

- Every remaining non-conformant class fixture carries a named mechanism
  with a `file:line`, or a `DIVERGENCES.md` entry.
- No slug was added to any backlog.
- All frozen counts unmoved except class `portOk` shrinking.
