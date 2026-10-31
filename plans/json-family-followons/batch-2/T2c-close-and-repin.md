# T2c — batch 2 close and re-pin

Agent: orchestrator. Follows [../close-procedure.md](../close-procedure.md)
with `N = 2`, `prev = b2a`. Commit: `chore(jff-b2): close batch 2 — title ×
scale through the export tail`.

## Specifics
- Expected movers: json/yaml/hcl rows with `scale` or chrome; extended-mode
  rows with the same (journal each with the mechanism "scale applied to the
  chromed block, `TextBlockExporter.java:159-177`"). Any mover with neither
  `scale` nor chrome needs its own mechanism before re-pinning (halt otherwise).
- Positional ceilings: lower each authored title/scale row to its new measure;
  a row whose title-related deltas are gone but whose body residue remains keeps
  that residue as its ceiling (journal the field values).
- Manifest: rows that turned structurally clean move to `clean`; no ceiling grows.
- Newly byte-identical corpus rows are pinned (count bumps); authored rows
  that reach 0 keep a positional ceiling of 0.
- `fixtures.md`: b2 counts row; Σ positional before → after.

## Acceptance
- Given the b2 measure vs b1, then no positional ceiling rose, pins ≥ 14/7/1, and every mover has a journal row.
- Given authored title + scale rows, then their title/canvas deltas are 0 (stop 14 otherwise).

Observability: N/A. Rollback: Reversible.
