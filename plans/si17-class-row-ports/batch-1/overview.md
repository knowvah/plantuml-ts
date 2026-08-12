# Batch 1 — the mechanism

**Sequential.** Every commit must leave all four gates green, which is what
forces the ordering: T1 is additive and inert, T2 is the atomic behavioral
flip, T3 measures and shrinks the pin.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1](T1-class-port-band-producer.md) | Class port-band producer, pure + unit-tested, NOT wired | typescript-pro | `src/diagrams/class/class-port-rows.ts`, `tests/unit/class/class-port-rows.test.ts` | T0 | [ ] |
| [T2](T2-wire-the-mechanism.md) | Atomic flip: bands + edge suffix + retire `:P` | typescript-pro | `class-port-rows.ts`, `class-dot-graph.ts`, `class-layout-helpers.ts`, `tests/unit/class/layout.test.ts` | T1 | [ ] |
| [T3](T3-shrink-the-backlog.md) | Re-measure, shrink/delete the backlog | general-purpose | `oracle/goldens/class/port-backlog.json`, `../decision-journal.md` | T2 | [ ] |

## Why T2 is one commit and not three

No subset of T2 is coherent:

- Dropping `isPort` before the bands exist leaves the 22 failing
  *differently* — and they are pinned to fail `portOk` and nothing else, so
  the suite goes red.
- Adding the edge suffix without the shape flip anchors edges to ports no
  node declares. (The jar does exactly this on purpose in one case — see
  ADR-3 — but as a *deliberate* dangling port, not as a half-landed change.)
- Flipping the shape without the suffix moves every edge to `:h` on a node
  that now advertises rows.

Confirmed with the maintainer 2026-08-12: keep it as one commit. It is
larger than the 5–15 minute ideal; splitting buys a broken intermediate
rather than safety.

## Note on scope

T1 and T2 both write `class-port-rows.ts`. That is why they are
**sequential, not parallel** — one writer per file per batch.

## Batch exit

- Class DOT `portOk` failures strictly shrink; no other check regresses.
- All five DOT gates and all three censuses re-run in T2's pass, because
  the shared emitters are in scope.
- Every slug still failing carries a named mechanism, filed as a batch-2
  B-item.
