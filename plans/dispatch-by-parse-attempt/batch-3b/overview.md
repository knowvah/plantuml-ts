# Batch 3b — parse-attempt dispatch, upstream order, heuristics out

One task, run immediately after 3a with no gate in between. This is where the
mission's thesis is tested.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T12 | `resolve()` by parse-attempt; re-mirror registration order; remove `accepts()` | typescript-pro | `src/core/dispatcher.ts`, `src/index.ts`, all 14 `src/diagrams/*/index.ts`, affected tests, `docs/catalog.md` | T4–T11 | [ ] |

**Gate at close — the batch boundary for 3a+3b together:** all four quality
gates, the routing gate (disagreements must not increase; `kokebo-27-vafi688`
must close), and T0's refusal gate reporting its number.

**If the refusal-coverage number is large, that is not a failure of this
batch.** It is the measurement batches 4–6 exist to consume
([D7](../decisions.md#d7)). Record it and continue. Halt only if a sampled
newly-erroring fixture turns out **not** to be an unported `Command` — that
means the refusal contract is wrong ([stop condition 4](../README.md#stop-conditions)).
