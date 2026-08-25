# Batch 6 — command coverage: chart, packetdiag

Membership is provisional — see [batch 4's overview](../batch-4/overview.md)
for the re-derivation rule. Shared task spec:
[../batch-4/T13-T20-command-coverage.md](../batch-4/T13-T20-command-coverage.md).

| ID | Engine | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T19 | chart | typescript-pro | `src/diagrams/chart/**` | T12 | [x] |
| T20 | packetdiag | typescript-pro | `src/diagrams/packetdiag/**` | T12 | [x] |

Parallel. Gate at close as in batch 4.

Both engines are single-candidate: their refusal can never change routing, and
any coverage gap here is a pure command-table gap. Expect small buckets — and
if either measures empty, close it as a measured no-op.

## Close-out — 2026-08-25

Both close as **measured no-ops**, as this overview anticipated ("expect small
buckets — and if either measures empty, close it as a measured no-op").
Measured over the whole corpus after batch 4: **chart 0, packetdiag 0**.

Every one of the 153 newly-erroring fixtures at that measurement was in the
SEQUENCE corpus; neither engine contributed one. Consistent with the note
above that both are single-candidate, so a refusal here could not have moved
routing either.
