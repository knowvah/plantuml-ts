# `catalog.test.ts` — correcting `test-budget-invariant`'s `no-change`

Measured and corrected 2026-08-23, one day after that mission merged. This
supersedes the recommendation in `.agent-notes/tbi-T2.md` and the outcome
T4 applied. **The prior work is not deleted and was not wrong on its own
evidence — it was wrong on evidence it never had.**

## What the mission concluded, and why it was reasonable

T2 diagnosed the intermittent `Error: Test timed out in 5000ms` to a
scheduling collision between two concurrent `npm test` processes' worker-fork
startup bursts. It recommended `no-change` and refused to name a budget,
because the colliding condition was never reproducible and so yielded no
measured worst case. D5 explicitly permitted that outcome, and naming a
number anyway would have been fitting a value.

That reasoning was sound. Its **evidence base was not**: every measurement
came from one 12-core, 96 GB dev machine. T2's operating limit stated
"Single `npm test` invocation ... reliable. Measured 391-406 ms against a
5,000 ms budget, ~12x headroom."

## What CI showed

`tests/architecture/catalog.test.ts` failed **3 of 6** `ubuntu-latest` runs
— in an ordinary **single, non-concurrent** `npm test`, which is precisely
the case T2 called reliable. Runs 32530470046, 32594071295, 32601147447 and
32611013662 carry the signature; 32610244977 passed.

The concurrency framing was therefore not the operative variable at all on
that machine. It never needed two processes.

## The number nobody had, and how it was obtained

The 5,000 ms default **aborts the call before its cost can be observed**, so
no failing run could ever report the real figure. Obtained by temporarily
lifting the budget to 120 s and logging the duration (CI run 32611966134),
then reverting the instrumentation:

| | value |
|---|---|
| in-suite, on the runner | **4,419 ms** |
| isolated, same run, same runner | 389-692 ms (4 cpus) |
| isolated, 12-core dev machine | 271-408 ms |
| in-suite, 12-core dev machine | 392-406 ms |
| `src/` files walked and parsed | 1,010 |

## Mechanism

The runner is only ~**2.5x** slower than the dev machine at this work in
isolation, which alone never explained a 12x blowout. The rest is the
suite's own contention: vitest runs `min(12, nproc-1)` = **3 workers on 4
cores** there, versus 11 on 12 locally, so each worker's share is far
smaller. That contention is worth a further ~**6-11x**.

At 4,419 ms the test sat at **88% of the 5,000 ms default** — which is
exactly the profile of an intermittent failure. It was never comfortably
inside the budget on CI; it was grazing it on every run.

## Ruled out

1. **Single-worker heap accumulation** (my first hypothesis: CI runs one
   worker, so one heap grows across all 631 files). Disproved locally with
   `--maxWorkers=1`: the test ran **404 ms**, indistinguishable from its
   406 ms at 12 workers.
2. **A broadly slower runner.** A local single-worker suite takes 255 s
   against CI's 306 s — only 1.2x. The 12x is specific to this test.
3. **Concurrency between two `npm test` processes** as a precondition. CI
   runs one. It still failed.

## Why 30,000, and why the margin is wide

Base is the 4,419 ms measured in-suite on CI. That is a single observation
from a **passing** run, and the failing runs are known to have exceeded
5,000 ms, so the true tail lies **above** the base rather than at it.
Scaling by the 1.8x spread the same quantity showed within one run
(isolated 389 → 692 ms) puts a plausible tail near 8,000 ms. 30,000 is
~3.8x that and ~6.8x the direct measurement.

The margin is wide because **n=1 and the tail is known to be above the
measurement** — not because a smaller number happened to fail. A hang still
surfaces in 30 s, well inside the job's 12-minute cap.

## Lesson worth keeping

An operating limit characterised on one machine is a claim about that
machine. T2's `no-change` was defensible on what it measured and would have
been right if the dev box were the only place this runs. The gap was never
the reasoning — it was that CI was never in the sample, and CI is where the
test was failing. **Measure on the machine that fails.**
