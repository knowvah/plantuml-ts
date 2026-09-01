# Batch 3 — Phase A close

One task. Proves Phase A landed, measures what it bought, and records the
numbers Phase C is gated on (D6).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| A6 | sweep, adjudicate, record | typescript-pro | `findings/text-convention.md`, README status | A2 A3 A4 A5 | [x] |

**No re-pinning here.** D5: once, at C4.

## Result (2026-09-01)

Phase A closed. `findings/text-convention.md` carries the full write-up.

- **Sweep**: 0 of 44 689 `<text>` elements carry `text-anchor` or
  `dominant-baseline`. `textLength` reaches 43 296 — every element upstream's
  `length > 1` guard permits, exactly.
- **Adjudication**: `improved=1017 substructure=79 regression=0`. The 79
  substructure fixtures are exactly the 79 the ratchet fails, verified by set
  difference. No re-pinning (D5).
- **Measurement**: 2 437 184.889 over 48 904 diffs, `descended=714` held.

**One acceptance criterion failed and the failure is the finding.** `text@x +
text@y` fell 15.6%, not the >90% the criterion asked for. Only the x half of
the 423 064 was ever the centre-versus-left-edge artefact — it fell 35.5% with
half its diffs vanishing outright. The y half was real vertical error all
along, and is now legible: 26.8% of the remaining `text@y` diffs sit at
exactly the 10px document margin, up from 4.9% at the base ref.

