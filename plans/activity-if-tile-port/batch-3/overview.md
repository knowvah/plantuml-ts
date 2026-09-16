# Batch 3 — `FtileIfDown` (one branch empty or a lone stop)

Sequential after Batch 2. Measured against `measurements/t3.json`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | `GtileIfDown` + `walk-if-down.ts` (In, Else1/Else2/ElseNoDiamond, Horizontal + optionalStop, Out) + dispatch (`down` cases) | typescript-pro | `src/diagrams/activity/tiles/gtile-if-down.ts`, `layout/walk-if-down.ts` (new); `layout/conditional-builder.ts`, `layout/tile-coordinates.ts` (dispatch), `layout/hexagon-reservations.ts` (the `UEmpty(5, 12)` beside the Else elbow); their tests; `measurements/t4.json` | T3 | [x] |

Spec: [`T4-if-down.md`](T4-if-down.md).
Expected movers: `down` rows of [`../fixtures.md`](../fixtures.md).

## Notes from T1 (read before T4)

- `.agent-notes/aitp-T1.md` "Template: down" has TWO sub-shapes: (a) plain /
  swapped without `optionalStop` (`rerovo-62-nazo755`, `vimako-25-mega336`),
  where `diamond2` IS drawn; (b) `optionalStop` (`vaxiki-78-nice114`), where
  `diamond2` is the invisible `FtileEmpty(0, 6)` (`ConditionalBuilder.java:
  308-311`, `hasTwoBranches()` false) — no `if-merge` node — and the stop's
  own tile sits east of the hexagon on a `ConnectionHorizontal`.
- In (b) the main flow is an EMPTY pass-through, so the jar snake-MERGES
  `ConnectionIn` and `ConnectionOut` into one straight line (`Snake.java`,
  parent D5 — not ported). Our two edges will read as 2 lines where the
  golden has 1: journal it as the merge residual, NOT a stop 14 — counts move
  toward the jar's, and merging is filed, not built.
- Base `--align`: `rerovo` 3/6 4/5 2/4 1/1 4/16; `vimako` 3/6 4/5 2/5 1/1
  4/17; `vaxiki` 6/5 7/4 3/6 2/2 8/18 (ours currently has MORE lines than
  the jar on `vaxiki`: the legacy walker's else edge into nothing).
