# Batch 7 — Adjudicate, re-pin, close out

Three tasks, **strictly sequential** — each consumes the previous one's output.

| ID | Description | Writes | Depends On | Done |
|---|---|---|---|---|
| T18 | Run the adjudicator; diagnose and fix genuine regressions | wherever a mechanism leads (declare before editing) | T17 | [ ] |
| T19 | Re-pin all three baselines, shape counts, census; reconcile the tally | the three baseline JSONs, `refusal-coverage.test.ts`, `diff-census.json` | T18 | [ ] |
| T20 | Close-out: catalog, findings, follow-on filings | `findings/CLOSE-OUT.md`, `planning/next-missions.md`, `docs/catalog.md` | T19 | [ ] |

## Why this order

Re-pinning before adjudicating would bake regressions into the baselines — the
exact failure D5 exists to prevent. T18 must finish, with every `regression`
and `inconclusive` verdict resolved to a `file:line` mechanism, before T19
writes a single pin.

## Batch gate

The four standard gates, plus the mission's own scoreboard at target:

| quantity | baseline | target |
|---|---:|---:|
| `refusal-baseline` `known-gap` pins | 163 | 0 |
| refusal SLI 2 (reported number) | 1 | ≤1 |
| routing misroutes, sequence | 195 | 0 |
| `diff-baseline` `status: "error"` | 195 | 0 |

A `known-gap` pin is excused from SLI 2, so the gate reports 1, not 163. The
deliverable is the pin count, not the SLI line.

A residual is acceptable **only** with a named mechanism and a filed follow-on
(D6). A residual with neither is a stop, not a close-out.

## Batch close

T20 runs `npm run catalog` as part of its own commit — this batch has no
separate orchestrator catalog step.
