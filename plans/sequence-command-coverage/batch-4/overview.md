# Batch 4 — Dressing grammar and exo parse

Two parallel tasks, disjoint write-sets. Together they are **~122 of the
mission's 195 fixtures** — the largest batch by fixture count.

T13 opens the exo-arrow feature, which runs **strictly sequential** across
batches 4 → 5 → 6 (parse → layout → render), by ruling. Do not pull exo layout
or render forward into this batch.

| ID | Description | Writes | Fixtures | Depends On | Done |
|---|---|---|---|---|---|
| T12 | Decorated dressing + ACTIVATION/LIFECOLOR/STEREOTYPE/URL | `command-arrow.ts`, tests | ~45 | T7 | [ ] |
| T13 | `CommandExoArrowLeft`/`Right` over `CommandExoArrowAny` | `command-exo-arrow.ts`, `sequence-command-registry.ts`, tests | ~77 | T3, T5, T6 | [ ] |

## Expected gate behavior

T13 makes 77 fixtures parse that previously produced an error page. They will
render **badly** until T14 and T17 land — exo geometry is border-anchored and
nothing computes it yet. That is expected and is not a regression.

Their `diff-baseline` entries stay `status: "error"` until T19; do not re-pin
them here. What must hold at batch close is that **no fixture already pinned
`baseline` regresses** without a T4 verdict.

## Batch gate

Four standard gates, plus:
- refusal SLI 2 and routing misroutes both fall by ~122;
- every ratchet rise on an already-`baseline` fixture carries a T4 verdict;
  `regression` and `inconclusive` verdicts are diagnosed with a `file:line`
  mechanism before the batch is marked done.

## Batch close

```
npm run catalog && git add docs/catalog.md
git commit -m "chore(catalog): regenerate for batch 4"
```
