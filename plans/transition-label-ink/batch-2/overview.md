# Batch 2 — land the fix

**Do not start this batch until a human has approved the write-set at the
Batch 1 checkpoint.** The `Writes` column below is a placeholder; replace it
with what was approved, and record the approval in `decision-journal.md`.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | Land mechanisms (A) and (B) in ONE commit, with tests | typescript-pro | *as approved* — expect `src/diagrams/state/layout-ink-extent.ts` plus T1's site | B1 + approval | [ ] |
| T4 | Sweep, ledger, close | typescript-pro | brief + `.agent-notes/` | T3 | [ ] |

Serial. T4 writes no `src/`.

## One commit, deliberately

(A) is −1.525 and (B) is +0.998. Landing either alone leaves the fixture
measurably worse than baseline and a bisect landing on that commit will
mislead. This is the case "one commit per task" exists to permit.

Route the label fold through `LimitFinder#drawText`'s rule rather than
re-implementing it at the call site — our port of that method is already
verbatim-correct (`evidence.md` §3), and the defect is that
`layout-ink-extent.ts:391` does not use it.

## Batch exit bar

1. The three named fixtures report composite width delta **0.000** in
   `measure-composite-declared-size.ts`.
2. That harness's `exact` count RISES from **2454**; nothing regresses.
3. `shape-match-report.ts` does not fall from **776 / 25695**.
4. state DOT-parity **268/268**; all **59** svg-state pins hold.
5. The document-level `labelInk: false` fold is untouched and its fixtures
   are byte-identical (decision D5).
6. Every constant introduced carries an upstream `file:line` (D4).
