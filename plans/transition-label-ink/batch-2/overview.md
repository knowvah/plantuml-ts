# Batch 2 — fix both, together

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T2 | Land both mechanisms in one commit | typescript-pro | `state/layout-ink-extent.ts` + whatever T1 names | B1 | [ ] |
| T3 | Sweep, ledger, close | typescript-pro | brief + `.agent-notes/` | T2 | [ ] |

## One commit, deliberately

The two mechanisms have opposite signs (−1.525 and +0.998). Landing them
separately means an intermediate commit that is measurably worse than the
baseline, and a bisect that lands on it will mislead. This is the case the
"one commit per task" rule exists to permit, not to forbid.

Route the label fold through `LimitFinder#drawText`'s rule rather than
re-implementing it at the call site: our port of that method is already
verbatim-correct, and the bug is that `layout-ink-extent.ts:391` does not
use it.

## Batch exit bar

1. The three named fixtures report composite width delta **0.000** in
   `measure-composite-declared-size.ts`.
2. That harness's `exact` count RISES from 2454; nothing regresses.
3. `shape-match-report.ts` does not fall from 776 / 25695.
4. state DOT-parity 268/268; all 59 svg-state pins hold.
5. The document-level `labelInk: false` fold is untouched and its fixtures
   are byte-identical.
6. `.agent-notes/class-ink-shared-offset-groups.md` item (c) updated — it
   currently says the composite's own node-size derivation "is where a fix
   has to start", which this mission disproved.
