# Batch 5 — End-to-end verification; measure the win

One task. Everything before this proved a piece; this proves the mission.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | End-to-end against the REAL regenerated packages; record the measured payload | typescript-pro | `tests/integration/stdlib-remote-e2e.test.ts` | T4, T6 | [x] |

## Batch exit criteria

- A 3-icon tupadr3 diagram renders through the real regenerated package, served
  over a local fetcher, fetching ≤ 5 resources
- The measured payload is **recorded in the decision journal** — manifest gzip +
  N × resource, against 19.54 MB
- All existing gates unmoved

## Why this task exists separately

Every prior task tested its own layer with fabricated inputs. That is correct
for unit tests and insufficient as evidence: SI8 learned twice that a shape
assumed from a package's `exports` map did not survive contact with what the
generator actually emitted. This task uses the real emitted manifest and the
real vendored `.puml` files.

## The stop condition attached to this batch

**Stop condition 15.** If the measured reduction is not ≳99% against 19.54 MB
for the 3-icon case, report the real numbers and STOP. Per
[ADR-6](../decisions.md#adr-6) this mission measures and states; it does not
assert success. A disappointing number is a finding to escalate, not a result to
round up.

## No network

The fetcher is injected and reads from the local `assets/` tree or the package
directory. **Nothing in CI may reach jsDelivr or unpkg** — that is stop
condition 10.
