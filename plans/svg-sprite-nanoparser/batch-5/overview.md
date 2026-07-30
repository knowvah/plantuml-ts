# Batch 5 — Retire `fitToInk`; pin the two channels

Two tasks, parallel: distinct write-sets, both depend only on prior batches.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T10 | Retire `fitToInk`'s substitution | typescript-pro | `src/diagrams/description/leaf-sizing.ts` | T7, T9 | [ ] |
| T11 | Two-channel independence test (ADR-5) | typescript-pro | `src/core/klimt/sprite/SvgNanoParser.two-channel.test.ts` | T9 | [ ] |
| T12 | Measure the authored sprite goldens; ratchet in what passes | typescript-pro | `oracle/goldens/svg-description/ratchet.json` | T9, T10 | [ ] |

## Batch exit criteria — this is the mission's acceptance gate

- All four quality gates green
- **`npx tsx scripts/measure-description-size-deltas.ts` exits 0 with
  `bootstrap-0` and `ruziru-69-xixo434` at widened 0** — this is the mission
  objective, measured
- SVG goldens 310 / 22 / 57 byte-identical
- DOT parity clean (`oracle/goldens/description/*/svek-1.dot`)

## Closing the mission

After both tasks land and gates pass:

1. Update `plans/s1l-leaf-sizing/ledger.md` — the SVG-sprite ink gap entry
   moves from OPEN to closed, citing the commits. **State what was not
   achieved as plainly as what was**, per this project's ledger convention.
2. Update `planning/mission-index.md` with the close.
3. If any @knowvah/dot-engine finding surfaced during execution, file it under
   `docs/graphviz-issues/` with a tracker line before the mission closes —
   a finding that exists only in a mission ledger is not filed (CLAUDE.md).
4. Note in the summary that the class-engine coupling
   (`measureUsecase` ← `class-layout-leaf-shapes.ts:14,27`) remains open and
   is inherited by whoever next touches `leaf-sizing.ts`'s resolver.
