# Batch 3 — close-out

Sequential. Nothing here changes rendering behavior; this batch makes the
record true.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T4](T4-close-out.md) | Flip the index row, file the findings, state the real number | general-purpose | `planning/mission-index.md`, `.agent-notes/**`, `DIVERGENCES.md` (only if something is left diverging), `../README.md`, `../ledger.md` | batch-1, batch-2 | [x] |

## Batch exit

- `planning/mission-index.md`'s SI17 row is flipped and carries the real
  measured number — including, if it applies, that the mission closed at
  **710/711** with `besepi-37-rori892` named.
- `.agent-notes/T8-member-ports-wrong-mechanism.md` is updated to record
  that the mechanism it described has been retired, with the commit that
  did it — the note is the reason this mission was cheap to scope, and
  leaving it describing live behavior would mislead the next reader.
- Any deliberate remaining divergence has a `DIVERGENCES.md` entry naming
  its mechanism. An effort excuse is not a divergence.
