# Batch 3 — engine wiring for M1

Two tasks, parallel, disjoint write-sets. Both consume T5's
`computeQuantifierBox`. **This is the first batch that moves geometry** — a
corrected quantifier box changes what dot-engine reserves, so D4's census bar
is live from here on.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | Class + object quantifier wiring | `typescript-pro` | `src/diagrams/class/class-layout-edge-labels.ts`, `src/core/graph-layout.ts`, `oracle/goldens/class/label-size-backlog.json`, `oracle/goldens/object/label-size-backlog.json` | T5 | [ ] |
| T7 | Description quantifier wiring | `typescript-pro` | `src/diagrams/description/link-edge-attrs.ts`, `oracle/goldens/description/label-size-backlog.json` | T5 | [ ] |

**Write-set conflicts:** none. T6 owns the class/object backlogs and both
copies of `CARDINALITY_FONT_SIZE`; T7 owns the description backlog only.

**Batch exit:** all four gates; every slug either clears or keeps a named
mechanism; **no fixture rises** in `shape-match-report`; SVG ratchet pins hold
or move toward jar with the measurement journalled.

## Watch-out

Object shares the class engine's edge-label path. T6 owns both backlogs for
that reason — do not assume object needs its own wiring, and do not assume it
does not. Check, and journal which.

A slug leaves a backlog **only** when `labelSizeOk` actually passes for it.
The lists are shrink-only, and a slug removed optimistically is worse than a
slug left in: the contract's whole point is that a fixed fixture fails until
its entry goes.
