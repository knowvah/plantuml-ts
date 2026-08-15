# Decision journal — state-composite-inner-canvas

Appended during execution. Every non-trivial judgement call gets a row:
"non-trivial" means a reasonable developer might have chosen differently.

Also record here, because later tasks are measured against them:

- **T1's baseline** — the `exact`/`mismatched`/`unmatched` counts, and the
  reproduced 0.527 on the three named fixtures. If 0.527 does NOT
  reproduce, that is a stop, and the row says so.
- **T3's numbers alone** — the one sanctioned dip (batch-2/overview.md).
  They may be worse than baseline; record them, do not chase them.
- **T4's numbers** — the dip must be gone by here.
- **T5's frame finding** — what `clusterManager.moveDelta` actually moves,
  and whether this port already shifted inner content anywhere. This is the
  task's central question; the answer belongs here even if it is "nothing".
- **Every composite still mismatched at T6**, with its named mechanism and
  `file:line`.

| Date | Task | Decision | Why | Alternative rejected |
|---|---|---|---|---|
| | | | | |
