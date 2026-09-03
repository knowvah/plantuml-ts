# Batch 3 — make the harness able to see it

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | `splinesOk` gates `dotEqual`, PROVEN to discriminate | sonnet | `tests/oracle/svek-dot.ts`, `tests/oracle/svek-dot.test.ts` | T6 | [ ] |

**Strictly after Batch 2** ([D6](../decisions.md)). `parity-*.json` records
`dotEqual: true` on all 8 today only because splines is not compared;
landing this before the emitter would flip 8 fixtures red for a reason that
is not a regression.

**The proof step is the task, not a formality.** An assertion that stays
green with the emitter reverted is decoration — this repo has shipped
exactly that (`planning/mission-index.md`, SI21: an oracle fixture that
"does not guard the separator", caught only by reverting the fix and
watching it still pass).
