# Batch 5 — Widen the routing (ADR-6) + close

T5 is where conformance finally moves. It is separate from T4 by design:
T6 of the last mission bundled a routing change with four narrowings and
made "port or widening?" unanswerable without re-running.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T5 | Remove TWO narrowing guards (ADR-10); delete flipped pins | typescript-pro | `src/diagrams/description/leaf-sizing.ts`, `leaf-sizing-legacy-fallback.ts`, `oracle/goldens/description/size-backlog.json` | T4 | [ ] |
| T6 | Perf check + mission close | orchestrator | `plans/*`, `planning/mission-index.md`, `plans/s1l-leaf-sizing/ledger.md` | T5 | [ ] |

## T5 shrank from three guards to two — ADR-10

The folder/package narrowing needs `create2`/`BodyEnhanced1`, which moved to
mission SI1 along with `MethodsOrFieldsArea` and a ≈12,100-line cascade. So
T5 removes only the sprite and `<img>` guards; folder/package and `<latex>`
both stay, and `FOLDER_SHOWN_TITLE_EXTRA_WIDTH` stays live.

Consequence for the number: expect a **modest** conformance rise, on the
order of the three fixtures T6 recorded for those two narrowings
(`bootstrap-0`, `ruziru-69`, `jecici-56`) — not the 8 folder/package ones.
**A large jump is a signal to hunt for an accidental `create3`-for-`create2`
substitution**, since `getMarginX` is 0 vs 6 and that swap would look like
progress on the ratchet while being wrong on every folder/package title.

## T6 is the orchestrator's, and its scope grew

Beyond the perf check and the usual close, T6 must now record: the ADR-5
AMENDMENT, ADR-7 through ADR-10, batch 3a's 14 tasks and ~2,300 ported
lines, the handoff of narrowing #1 to SI1, and the still-withheld
`CreoleStripeSimpleParser.ts:95` classification flip that closes S1L-i.
