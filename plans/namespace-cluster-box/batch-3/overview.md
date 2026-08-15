# Batch 3 — the box becomes the polygon

T5 then T6, in that order. T6 depends on T5 having landed.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T5](T5-read-cluster-box.md) | `buildNamespaceGeos` reads `DotLayoutResult.clusters` | typescript-pro | `class-geo-builders.ts`, `layout.ts`, `class-dot-graph.ts`, affected tests | T4 | [x] |
| [T6](T6-retire-padding-constants.md) | Delete `NAMESPACE_SIDE_PADDING` / `NAMESPACE_TOP_EXTRA` | typescript-pro | `class-namespace-shape.ts`, affected tests | T5 | [x] |

## This is where the mission pays off

The headline numbers must rise past the batch-1 baseline here, not merely
recover from T4's dip. The 11 fixtures with a named residual should reach
exact or carry a named remaining delta:

| Group | Fixtures |
|---|---|
| `(0.18, 0)` | `dopuzi-50-muxo994`, `finono-05-cuvu171`, `zomidu-04-fizu253` |
| `(0.32, 0)` | `jinibe-02-tebi269`, `mucuxi-36-beku683` |
| `(0.39, 0)` | `ditapa-46-bete946`, `repipi-06-dike782` |
| `(-0.29, 0)` | `sugifi-33-xefe083`, `sumule-00-pefa744` |
| `(8, 4)` | `cidepu-54-bemo048`, `kicolo-81-sidi387` |

## T5 is the oversized task

Ten test files carry namespace geometry expectations. T5 owns the ones it
breaks, because a commit with a red suite is not a commit. If it proves too
large, **split it** — that is an anticipated outcome, not a failure. Split
by consumer (geo builder / ink extent / renderer), never by "source in one
commit, tests in another".

## Batch exit criteria

- All four gates green.
- T1's harness reports both headline numbers ABOVE the batch-1 baseline.
- Every one of the 11 fixtures above is exact, or its residual is named in
  the decision journal with a mechanism.
- `NAMESPACE_SIDE_PADDING` and `NAMESPACE_TOP_EXTRA` are gone, or the
  survivor carries an upstream citation and a journal entry explaining the
  proof that failed.
