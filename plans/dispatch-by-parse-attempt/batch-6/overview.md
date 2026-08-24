# Batch 6 — command coverage: chart, packetdiag

Membership is provisional — see [batch 4's overview](../batch-4/overview.md)
for the re-derivation rule. Shared task spec:
[../batch-4/T13-T20-command-coverage.md](../batch-4/T13-T20-command-coverage.md).

| ID | Engine | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T19 | chart | typescript-pro | `src/diagrams/chart/**` | T12 | [ ] |
| T20 | packetdiag | typescript-pro | `src/diagrams/packetdiag/**` | T12 | [ ] |

Parallel. Gate at close as in batch 4.

Both engines are single-candidate: their refusal can never change routing, and
any coverage gap here is a pure command-table gap. Expect small buckets — and
if either measures empty, close it as a measured no-op.
