# Batch 3 — the chrome fix

One task, alone. The only batch that changes `src/`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Route activity through the klimt document shell | sonnet | `src/diagrams/activity/renderer.ts`, possibly `tests/oracle/svg-conformance/render-fixture-activity.ts` | T4 | [ ] |

**Entry gate:** T4 must have returned `isChrome: true` for **both** extra
`g` children. If either came back `false`, this batch does not run — the
mission halts for review.

Expect the diff-baseline ratchet (T2) to go RED with `[IMPROVED]` lines on
essentially every fixture. That is the intended effect, not a failure — T6
re-pins.
