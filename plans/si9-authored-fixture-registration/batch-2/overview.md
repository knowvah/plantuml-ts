# Batch 2 — Regenerate `usecase` parity; inspect drift

One task. No code changes — this batch produces **generated data** and a
review of it.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Rebuild the `usecase` cache, regenerate `parity.json`, report every changed row | typescript-pro | `tests/oracle/svg-conformance/parity.json` | T1 | [ ] |

## Batch exit criteria

- All four quality gates green
- `parity.json` gains exactly three rows — `sprite-svg-{bootstrap,archimate,multiline}-0`,
  all `type: "usecase"`, all `dotEqual: true`
- **Every changed pre-existing row is reported with before/after** in the
  decision journal
- 389 svg-class/object/state goldens byte-identical
- `npx tsx scripts/measure-description-size-deltas.ts` still 320/351,
  widened 0

## The review is the deliverable, not the file

Regenerating `parity.json` re-measures all 355 existing rows. Most should be
unchanged. **Any row that moves for a reason unrelated to this mission is a
finding to report, not to absorb** (stop condition 5). Committing a
regenerated oracle without reading its diff is how unrelated drift gets
laundered into an unrelated mission's history.

If the diff is large or surprising, that is precisely when to stop and
report rather than push through.

## Never hand-edit the output

`parity.json`'s fields come from a measured render path
(`renderSync` + `WidthTableMeasurer`). Hand-writing or adjusting a row
fabricates oracle data and inverts the thing it exists to check. It is
generated, always — stop condition 1.
