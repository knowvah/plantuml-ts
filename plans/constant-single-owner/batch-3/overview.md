# Batch 3 — intra-engine clusters

The largest single win, and the lowest risk: constants duplicated entirely
INSIDE one engine, where there is no cross-engine judgement to make and no
`src/core/` owner needed (decision D3).

Concentrated in the activity engine:

```
8x  NODE_MARGIN_Y = 20   activity/ + activity/tiles/
4x  NODE_MARGIN_X = 40   activity/ + activity/tiles/
4x  ACTION_H_PAD  = 16   activity/ + activity/tiles/
3x  BAR_HEIGHT    = 8    activity/ + layout
3x  OUTER_RADIUS  = 14   activity/tiles/
```

Plus the one clean non-ported case: `PX_PER_INCH = 72`, three copies, a unit
conversion rather than a ported value (decision D2's narrow exception).

T1's classification is authoritative — work its `intra-engine` rows, not
this list.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | Consolidate the intra-engine clusters | typescript-pro | `src/diagrams/activity/**` (+ the `PX_PER_INCH` sites) | B1 | [ ] |

Independent of Batch 2 — different engines, disjoint write-sets. Either
order, or both.

## Batch exit bar

1. Each cluster has one declaration inside its own engine; no `src/core/`
   module was created for an engine-local constant.
2. **`shape-match-report.ts` reports 776 / 25695 EXACTLY.**
3. Redundant-declaration count strictly lower.
4. All four gates green.
