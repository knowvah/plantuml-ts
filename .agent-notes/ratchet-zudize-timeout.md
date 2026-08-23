# `sequence.diff-baseline.ratchet.test.ts` — why `zudize-61-vomi445` and
# only `zudize-61-vomi445` trips the 5,000 ms default

Diagnosed 2026-08-22, following the `test-budget-invariant` mission's T5,
which observed the failure in 3 of 8 concurrent-trial processes and filed it
as `planning/next-missions.md` item (c). No fix applied; no file changed.

## Mechanism

`zudize-61-vomi445` is the only fixture in the 1,141-case corpus with a
large, *stable* per-call cost — ~650 ms every call, against vitest's
unconfigured 5,000 ms default (7.5x headroom). Its cost is dominated by
`compareSvg` over an **8.26 MB** golden, and it degrades **super-linearly**
with concurrent worker count: 5.4x at 22 workers, where CPU share alone
predicts 1.8x. Two full `npm test` suites put exactly 22 forks on 12 cores.

## Origin

`tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:226`
(the `it(...)` generated per fixture, no third argument, so all 1,141 cases
inherit the 5,000 ms default) → `measure()` at `:124` → `compareSvg` at
`:133`. The input: `test-results/dot-cache/sequence/zudize-61-vomi445/`,
`in.puml` 1,192,534 B and `in.svg` **8,256,409 B**.

## Causal chain

Per-call breakdown, steady state, reads inside the timed region exactly as
`measure()` does them (n=8, quiet):

```
zudize-61-vomi445  median=643ms max=666ms [read~8 render~232 cmp~407]
nereka-67-deco609  median=2ms   max=4ms   [read~0 render~1   cmp~1]
```

Degradation by concurrent copy count (worst observed max, 5 iterations each):

| copies | worst max | vs 1 copy | CPU-share prediction |
|---|---|---|---|
| 1 | 682 ms | 1.0x | 1.0x |
| 6 | 805 ms | 1.18x | 1.0x |
| 12 | 1,374 ms | 2.0x | 1.0x |
| **22** | **3,711 ms** | **5.4x** | 1.83x |

At 22 concurrent copies the fixture alone reaches **74% of the 5,000 ms
budget** with no other suite work in the process. In the real failing
condition that worker is *also* importing, transforming and running the rest
of the suite, which supplies the remaining margin. Observed 5.4x against a
1.83x CPU-share prediction is ~3x worse than core contention explains, which
is the signature of memory-bandwidth/GC contention: each copy churns a
461-671 MB heap over an 8 MB string.

## Ruled out

1. **Aggregate system load as the operative variable.** A single probe copy
   at load1 25.6-32.7 measured 673 ms max, against 667 ms quiet — 1.0x. Load
   is not what moves this; *concurrent worker count* is. (Same conclusion T2
   reached for `catalog.test.ts`, reached here by a different route.)
2. **`nereka-67-deco609`, which looks slower, being the real risk.** It
   reports 1,178 ms (quiet) and 2,069 ms (under load) in vitest runs but
   measures **2-4 ms** in steady state. Its entire cost is one-time JIT/module
   warmup, attributed to whichever fixture renders first in that worker. It
   cannot fail repeatedly because it is not expensive. This is why the
   failure names the *second*-slowest reported fixture, not the first.
3. **File I/O as the dominant term.** `readFileSync` of all 9.45 MB is ~8 ms
   of ~650 ms (1.2%), and did not grow materially under load.
4. **An assertion failure wearing a timeout's clothes.** `diffs.length` is 12
   in every measurement, equal to the committed baseline. The failure is
   purely the timeout.
5. **A per-test budget existing and being too small.** There is none: the
   `it()` at `:226` takes no third argument, so all 1,141 cases inherit
   vitest's unconfigured default.

## Not ruled out — genuine open boundary

- **GC versus memory bandwidth specifically was not separated.** The
  super-linear curve is consistent with both and I did not instrument
  `--trace-gc` to apportion them. It does not change the recommendation,
  because both scale with the same variable (concurrent workers holding 8 MB
  strings).
- **I did not myself reproduce a full 5,000 ms trip** in the real two-suite
  condition; I reproduced 3,711 ms in the fixture's own work at the same
  worker count. T5's 3-of-8 observation is the evidence that it completes the
  journey.

## This is NOT the same class as `catalog.test.ts` — correcting T5

T5 filed this as "the same general shape D5 named for `catalog.test.ts`."
The measurements say otherwise, and the difference decides what to do:

| | `catalog.test.ts` | `zudize-61-vomi445` |
|---|---|---|
| Steady-state cost | 406 ms | ~650 ms |
| Headroom to 5,000 ms | 12.3x | **7.5x** |
| Response to load | none (load1 71 → 1,544 ms) | none to load |
| Response to worker count | not established | **5.4x at 22, measured** |
| Reproducible on demand | **no** (T2 could not force it) | **yes** |
| Measured worst case | **none exists** | **3,711 ms** |

`catalog.test.ts` ended at `no-change` because no measured worst case
existed and naming a number would have been fitting a value. **That
reasoning does not transfer here**: this one has a reproducible worst case,
so a budget derived from it would be derived from measurement, not fitted.

## Recommendation

`set-budget` is defensible here, unlike for `catalog.test.ts`. A derivation
from what was measured: worst observed 3,711 ms at the 22-worker condition,
which is the realistic ceiling for two concurrent suites, plus the rest of
the worker's own work. Any number chosen should be justified against that
3,711 ms, and applied to **this fixture's case only** — not to all 1,141,
which would blind the other 1,140 (each with ~1,300x headroom) exactly as
D4 argued against a global `testTimeout`.

An alternative worth pricing before choosing: the golden is **8.26 MB**
while our own render is **317 KB** — a 26x size asymmetry that still yields
only 12 diffs. If that golden carries formatting the comparison does not
need, shrinking it attacks the 407 ms `compareSvg` term at its source rather
than raising a budget around it. That is a performance question, out of this
diagnosis's scope, and it is the one lead that would remove the problem
instead of accommodating it.
