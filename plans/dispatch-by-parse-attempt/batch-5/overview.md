# Batch 5 — command coverage: state, activity, board

Membership is provisional — see [batch 4's overview](../batch-4/overview.md)
for the re-derivation rule. Shared task spec:
[../batch-4/T13-T20-command-coverage.md](../batch-4/T13-T20-command-coverage.md).

| ID | Engine | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T16 | state | typescript-pro | `src/diagrams/state/**` | T12 | [x] |
| T17 | activity | typescript-pro | `src/diagrams/activity/**` | T12 | [x] |
| T18 | board | typescript-pro | `src/diagrams/board/**` | T12 | [x] |

Parallel. Gate at close as in batch 4.

## Close-out — 2026-08-25

All three tasks close as **measured no-ops** under the shared spec's rule
("if your bucket is empty when you start, close the task as a measured no-op;
do not invent work"). Bucket measurement, whole corpus, after batch 4:

| Engine | Bucket |
|---|---|
| state | 17 — **none of them state gaps**, see below |
| activity | 0 |
| board | 0 |

### T16: the state bucket is mis-attributed, and that is the finding

All 17 fixtures the gate attributes to `state` live in the **sequence**
corpus and refuse on **sequence** commands. Every one is a family already
pinned in `diff-baseline.json`: `-\o` / `o/-` arrow dressings, `++ #color`
ACTIVATION+LIFECOLOR, `[->` / `->]` / bare `-> X` exo arrows,
`autonumber stop`, `<[#red]-o?` arrow styles, `||50||` HSpace.

The `engine` field is the merged refusal's `(Assumed diagram type: X)`, and
under [D2](../decisions.md) the merge keeps the HIGHEST-SCORING refusal — not
the engine that owns the gap. State's refusal simply outscores sequence's on
these sources. **Batches 4 and 6 read the same field**, so the attribution
caveat applies to their buckets too; filter by the refusing LINE, not by
`engine`.

### What the state DOT failures actually were

Batch 5 was expected to fix 20 failing state tests (`state-dot-parity` 16,
`state-note-attached-dot` 3, `state-note-link-dot` 1). They were not refusals
at all — the state engine parsed every one of those fixtures. They failed
because the **description** engine claimed them first: its bracket shorthand
matched `[*] --> state1` with a `(.*)?$` trailer, so it never declined and
`PSystemBuilder`'s next factory (State) never ran.

Registration order was NOT the bug — upstream is also
`Sequence, Class, Activity, Description, State`. The permissive trailer was.
Fixed in `command-table-containers.ts`, cited to
`CommandCreateElementFull.java:83-115`; all 20 now pass.
