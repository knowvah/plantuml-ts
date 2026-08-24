# Batches 4–6 — command coverage

**Membership below is a planning guess.** The real split is whatever T12's
SLI 2 breakdown measures. Re-derive it at batch 4's start: order engines by
their newly-erroring count, and rebalance across the three batches so no batch
is dominated by one huge bucket. Record the re-derivation in the journal.

| Batch | Engines | Tasks |
|---|---|---|
| 4 | sequence, class, description | T13, T14, T15 |
| [5](../batch-5/overview.md) | state, activity, board | T16, T17, T18 |
| [6](../batch-6/overview.md) | chart, packetdiag | T19, T20 |

All tasks share one specification:
[T13-T20-command-coverage.md](T13-T20-command-coverage.md).

## Batch 4

| ID | Engine | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T13 | sequence | typescript-pro | `src/diagrams/sequence/**` | T12 | [ ] |
| T14 | class | typescript-pro | `src/diagrams/class/**` | T12 | [ ] |
| T15 | description | typescript-pro | `src/diagrams/description/**` | T12 | [ ] |

Parallel — disjoint engine directories.

**Gate at close:** all four, plus the routing and refusal gates. Refusal
coverage must fall for each engine in the batch, or each residual must carry a
journaled mechanism naming the unported `Command` at its upstream `file:line`.
